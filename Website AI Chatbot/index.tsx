import { GoogleGenAI, Type } from "@google/genai";

// --- DOM ELEMENT REFERENCES ---
const inputContainer = document.getElementById('input-container') as HTMLElement;
const inputForm = document.getElementById('input-form') as HTMLFormElement;
const submitButton = document.getElementById('submit-button') as HTMLButtonElement;

// Tab-related elements
const tabButtons = document.querySelectorAll('.tab-button');
const inputPanels = document.querySelectorAll('.input-panel');
const urlInput = document.getElementById('url-input') as HTMLInputElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const fileNameElement = document.getElementById('file-name') as HTMLSpanElement;
const textInput = document.getElementById('text-input') as HTMLTextAreaElement;

const loadingIndicator = document.getElementById('loading-indicator') as HTMLDivElement;
const errorContainer = document.getElementById('error-container') as HTMLDivElement;

const resultsSection = document.getElementById('results-section') as HTMLElement;
const analysisSourceElement = document.getElementById('analysis-source') as HTMLHeadingElement;
const summaryContent = document.getElementById('summary-content') as HTMLParagraphElement;
const askQuestionButton = document.getElementById('ask-question-button') as HTMLButtonElement;
const newAnalysisButton = document.getElementById('new-analysis-button') as HTMLButtonElement;

const chatSection = document.getElementById('chat-section') as HTMLElement;
const chatHistory = document.getElementById('chat-history') as HTMLDivElement;
const suggestedQuestionsContainer = document.getElementById('suggested-questions-container') as HTMLDivElement;
const chatForm = document.getElementById('chat-form') as HTMLFormElement;
const chatInput = document.getElementById('chat-input') as HTMLInputElement;
const chatSendButton = document.getElementById('chat-send-button') as HTMLButtonElement;


// --- STATE ---
let ai: GoogleGenAI;
let conversationHistory: { role: 'user' | 'model', parts: { text: string }[] }[] = [];
let sourceContent = '';
let activeTab = 'url';

// --- INITIALIZATION ---
try {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} catch (error) {
    console.error(error);
    showError('Failed to initialize AI. Please check your API key.');
    if(submitButton) submitButton.disabled = true;
}

// --- SYSTEM PROMPTS ---
const initialAnalysisSystemInstruction = `You are an expert content analyzer. Your tasks are:
1.  Thoroughly read the provided text.
2.  Write a concise, neutral summary of the content's main purpose and key information.
3.  Generate 4-6 diverse and insightful questions that a curious user might have after reading the content. The questions should be answerable from the provided text.
Your response MUST be a single, valid JSON object with two keys: "summary" (string) and "suggestedQuestions" (an array of strings).`;

// --- EVENT LISTENERS ---
inputForm.addEventListener('submit', handleFormSubmit);
chatForm.addEventListener('submit', handleChatSubmit);
newAnalysisButton.addEventListener('click', resetUI);
askQuestionButton.addEventListener('click', showChatView);
tabButtons.forEach(button => button.addEventListener('click', handleTabSwitch));
fileInput.addEventListener('change', updateFileName);

// --- CORE LOGIC ---

/**
 * Handles tab switching in the input form.
 */
function handleTabSwitch(e: Event) {
    const clickedButton = e.currentTarget as HTMLButtonElement;
    activeTab = clickedButton.dataset.tab || 'url';

    tabButtons.forEach(button => button.classList.remove('active'));
    clickedButton.classList.add('active');

    inputPanels.forEach(panel => {
        panel.classList.toggle('active', panel.id === `${activeTab}-panel`);
    });
}

/**
 * Updates the displayed file name when a file is selected.
 */
function updateFileName() {
    if (fileInput.files && fileInput.files.length > 0) {
        fileNameElement.textContent = fileInput.files[0].name;
    } else {
        fileNameElement.textContent = 'No file selected';
    }
}

/**
 * Handles the submission of the main input form.
 */
async function handleFormSubmit(e: Event) {
    e.preventDefault();
    if (submitButton.disabled) return;

    // Clear previous results and errors
    errorContainer.classList.add('hidden');
    resultsSection.classList.add('hidden');
    chatSection.classList.add('hidden');
    setLoading(true);

    try {
        let analysisInput: { content: string, sourceDescription: string };

        switch (activeTab) {
            case 'url':
                analysisInput = await processUrl();
                break;
            case 'file':
                analysisInput = await processFile();
                break;
            case 'text':
                analysisInput = processText();
                break;
            default:
                throw new Error('Invalid input source.');
        }

        sourceContent = analysisInput.content; // Store content globally for chat
        analysisSourceElement.textContent = `Results for: ${analysisInput.sourceDescription}`;
        await getInitialAnalysis();

    } catch (error) {
        console.error(error);
        showError(error instanceof Error ? error.message : 'An unknown error occurred.');
        setLoading(false);
    }
}

/**
 * Fetches and extracts text content from a URL.
 */
async function processUrl(): Promise<{ content: string, sourceDescription: string }> {
    const urlString = urlInput.value.trim();
    if (!urlString) throw new Error('Please enter a valid URL.');
    
    let url: URL;
    try {
        url = new URL(urlString);
    } catch (_) {
        throw new Error('The URL you entered is not valid. Please check it and try again.');
    }

    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url.href)}`;
    
    let response: Response;
    try {
        response = await fetch(proxyUrl);
    } catch (networkError) {
        console.error('Network error fetching via proxy:', networkError);
        throw new Error('Failed to connect to the fetching service. Please check your internet connection.');
    }
    
    if (!response.ok) {
        throw new Error(`The URL could not be accessed (Status: ${response.status}). The website might be blocking access or is offline.`);
    }
    
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style, noscript, svg, footer, header, nav').forEach(el => el.remove());
    const content = doc.body.textContent?.replace(/\s\s+/g, ' ').trim() || '';

    if (content.length < 100) {
        throw new Error('Could not extract enough readable content from the URL. The page might be empty or heavily reliant on JavaScript.');
    }
    return { content, sourceDescription: url.hostname };
}

/**
 * Reads and returns content from an uploaded file.
 */
async function processFile(): Promise<{ content: string, sourceDescription: string }> {
    return new Promise((resolve, reject) => {
        const file = fileInput.files?.[0];
        if (!file) {
            reject(new Error('Please select a file to analyze.'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content.length < 20) {
                 reject(new Error('The selected file has very little content.'));
            } else {
                 resolve({ content, sourceDescription: `File: ${file.name}` });
            }
        };
        reader.onerror = () => {
            reject(new Error('Failed to read the selected file.'));
        };
        reader.readAsText(file);
    });
}

/**
 * Reads and returns content from the text area.
 */
function processText(): { content: string, sourceDescription: string } {
    const content = textInput.value.trim();
    if (content.length < 50) {
        throw new Error('Please paste more content into the text area.');
    }
    return { content, sourceDescription: 'Pasted Text' };
}


/**
 * Gets the initial summary and suggested questions from the Gemini API.
 */
async function getInitialAnalysis() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: `Here is the content:\n\n${sourceContent}` }] }],
            config: {
                systemInstruction: initialAnalysisSystemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        suggestedQuestions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ['summary', 'suggestedQuestions']
                },
            }
        });

        const data = JSON.parse(response.text);
        
        summaryContent.textContent = data.summary;
        renderSuggestedQuestions(data.suggestedQuestions);
        resultsSection.classList.remove('hidden');
        newAnalysisButton.classList.remove('hidden');

    } catch (error) {
        console.error('Initial analysis failed:', error);
        showError('Could not analyze the content. The format might be too complex or not accessible.');
    } finally {
        setLoading(false);
    }
}

/**
 * Handles submission of a message from the chat input.
 */
async function handleChatSubmit(e: Event) {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message || chatSendButton.disabled) return;
    
    chatInput.value = '';
    await sendMessage(message);
}

/**
 * Sends a message to the Gemini API and renders the response.
 * @param {string} message - The user's message.
 */
async function sendMessage(message: string) {
    renderChatMessage(message, 'user');
    suggestedQuestionsContainer.innerHTML = ''; // Clear suggestions
    setChatInputDisabled(true);

    const thinkingIndicator = renderChatMessage('...', 'model', ['thinking']);
    
    conversationHistory.push({ role: 'user', parts: [{ text: message }] });
    
    const chatSystemInstruction = `You are a helpful AI assistant that answers questions about a specific text, using ONLY the content provided.
- Your answers must be based exclusively on the provided text. Do not use any external knowledge.
- IMPORTANT: Keep your answer to a single, concise sentence (a "one-liner").
- After each answer, suggest 2-3 relevant follow-up questions that can also be answered from the text.
- If you cannot find the answer in the text, politely state that the information isn't available in the provided content.
- Your response MUST be a single, valid JSON object with two keys: "answer" (string) and "followUpQuestions" (an array of strings).

Here is the content you will be answering questions about:
---
${sourceContent}
---
`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Using Pro for better chat performance
            contents: conversationHistory,
            config: {
                systemInstruction: chatSystemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        answer: { type: Type.STRING },
                        followUpQuestions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ['answer', 'followUpQuestions']
                },
            }
        });
        
        const data = JSON.parse(response.text);
        
        thinkingIndicator.remove();
        renderChatMessage(data.answer, 'model');
        conversationHistory.push({ role: 'model', parts: [{ text: data.answer }] });
        renderSuggestedQuestions(data.followUpQuestions);

    } catch (error) {
        thinkingIndicator.remove();
        renderChatMessage('Sorry, I encountered an error processing that request. Please try asking in a different way.', 'model');
        console.error('Chat error:', error);
    } finally {
        setChatInputDisabled(false);
        chatInput.focus();
    }
}


// --- UI HELPER FUNCTIONS ---

/**
 * Hides the results/summary view and shows the chat view.
 */
function showChatView() {
    resultsSection.classList.add('hidden');
    chatSection.classList.remove('hidden');
    chatInput.disabled = false;
    chatSendButton.disabled = false;
    chatInput.focus();
}

/**
 * Resets the UI to its initial state.
 */
function resetUI() {
    errorContainer.classList.add('hidden');
    resultsSection.classList.add('hidden');
    chatSection.classList.add('hidden');
    inputContainer.classList.remove('hidden');
    newAnalysisButton.classList.add('hidden');
    
    summaryContent.textContent = '';
    chatHistory.innerHTML = '';
    suggestedQuestionsContainer.innerHTML = '';
    urlInput.value = '';
    fileInput.value = '';
    textInput.value = '';
    fileNameElement.textContent = 'No file selected';

    conversationHistory = [];
    sourceContent = '';

    handleTabSwitch({ currentTarget: document.querySelector('.tab-button[data-tab="url"]') } as unknown as Event);

    setLoading(false);
}

/**
 * Toggles the loading state of the UI.
 * @param {boolean} isLoading - Whether to show the loading indicator.
 */
function setLoading(isLoading: boolean) {
    loadingIndicator.classList.toggle('hidden', !isLoading);
    submitButton.disabled = isLoading;
    if (isLoading) {
        inputContainer.classList.add('hidden');
        resultsSection.classList.add('hidden');
        chatSection.classList.add('hidden');
    }
}

/**
 * Disables or enables the chat input and send button.
 * @param {boolean} isDisabled - The disabled state.
 */
function setChatInputDisabled(isDisabled: boolean) {
    chatInput.disabled = isDisabled;
    chatSendButton.disabled = isDisabled;
}

/**
 * Displays an error message to the user.
 * @param {string} message - The error message to display.
 */
function showError(message: string) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
    inputContainer.classList.remove('hidden');
}

/**
 * Renders a chat message in the chat history.
 * @param {string} text - The message text.
 * @param {'user' | 'model'} sender - The sender of the message.
 * @param {string[]} classes - Optional additional CSS classes.
 * @returns {HTMLDivElement} - The created message element.
 */
function renderChatMessage(text: string, sender: 'user' | 'model', classes: string[] = []): HTMLDivElement {
    const messageEl = document.createElement('div');
    messageEl.classList.add('chat-message', sender, ...classes);
    messageEl.textContent = text;
    chatHistory.appendChild(messageEl);
    chatHistory.scrollTop = chatHistory.scrollHeight; // Auto-scroll
    return messageEl;
}

/**
 * Renders suggested questions as clickable buttons.
 * @param {string[]} questions - An array of question strings.
 */
function renderSuggestedQuestions(questions: string[]) {
    suggestedQuestionsContainer.innerHTML = '';
    questions.forEach(question => {
        const button = document.createElement('button');
        button.classList.add('suggested-question');
        button.textContent = question;
        button.addEventListener('click', () => {
            sendMessage(question);
        });
        suggestedQuestionsContainer.appendChild(button);
    });
}