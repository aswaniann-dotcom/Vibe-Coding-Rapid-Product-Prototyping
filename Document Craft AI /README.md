# Document Craft AI — AI-Powered Document Generator

Document Craft AI is a **SaaS application** that automates the creation of **professional, data-driven business documents**—including POV decks, pitch decks, and research reports—with a single click.  

This MVP focuses on generating **fully formatted, editable Point of View (POV) PowerPoint (.pptx) documents**, combining AI-driven research, structured content generation, and rich in-app editing.

---
🎥 **Product Demo (Google Drive):** 

[https://drive.google.com/your-demo-link](https://drive.google.com/drive/folders/1OZcE9RxKjVH4yjJKKRT_-dn7PIkA-QZJ)

---

## 🎯 Executive Summary

Product managers and business analysts spend a disproportionate amount of time manually creating high-impact business documents. Document Craft AI reimagines this workflow by orchestrating **data, design, and AI intelligence** into a single automated experience.

Rather than generating raw text, the platform produces **structured, presentation-ready PowerPoint decks** that users can edit, share, and download instantly. The lean technology stack—**Firebase Studio and Supabase**—is a deliberate choice to validate the core value proposition while laying the groundwork for enterprise scalability.

---

## 🎯 Goals (MVP)

- **Validate the Core Workflow**  
  Prove reliable generation of a structured, professional Point of View PowerPoint deck from inputs like Company Name, Product/Solution Name and Additional Context

- **Deliver an Intuitive Editing Experience**  
  Enable in-app rich-text editing, formatting, and seamless document preview.

- **Establish a Scalable Foundation**  
  Use Supabase for structured data, secure file storage, and future authentication needs.

---

## 🔄 User Flow (MVP)

### 1️⃣ User Input
- User lands on a minimal homepage
- Enters **Company Name**
- Selects document type (**Point of View deck**)
- Enters **Product/Solution Name** of the company for which the POV has to be generated
---

### 2️⃣ Generate Document
- User clicks **Generate**
- AI workflow is triggered

---

### 3️⃣ AI Workflow (Content & File Creation)

- **Orchestration:** Firebase Studio AI coordinates the workflow  
- **Research:** Gemini API performs company, industry, and competitor research using Google Search grounding  
- **Structured Content Generation:** Gemini generates a single, well-structured JSON object for a 9-slide POV deck  
- **PPT Generation:** A document generation service converts JSON into a fully formatted `.pptx` file  
- **Storage:**  
  - PPT file uploaded to Supabase Storage  
  - JSON content + file URL stored in Supabase database  

---

### 4️⃣ Document Display & Editing
- User is redirected to a document view
- Content rendered in a **rich-text editor**
- Users can:
  - Edit slide text
  - Modify font size, color, and styling

---

### 5️⃣ Sharing & Download
- **Share:** Generate a public link to view or export the document  
- **Download:** Download `.pptx` directly  
- **Formats supported:** PPT, Word, PDF  

---

## ✨ Key Features

### 🔍 AI-Powered Content Generation
- Company and market research via Gemini API
- Structured generation of all slides
- Consistent, professional narrative

---

### 📝 Rich In-App Editing
- Editable slide content
- Basic formatting controls
- Save edits to persistent storage

---

### 🔗 Sharing & Export
- Public document URLs
- Download in multiple formats
- Copy-to-clipboard sharing links

---

### 💾 Data Persistence (Supabase)
- Store:
  - Structured content (JSON)
  - File URLs
  - Metadata
- Enables versioning and future collaboration

---

## 📊 Automated POV Deck Structure (9 Slides)

1. **Title Slide** — Company Name  
2. **Agenda** — Topics covered  
3. **Company Overview** — Industry, facts, solutions, competitors  
4. **Product Portfolio** — Products, descriptions, features  
5. **Market Overview** — Size, segmentation, CAGR, players  
6. **Market Drivers & Restraints**  
7. **Key Market Trends**  
8. **References**  
9. **Thank You Slide**

---

## 🛠️ Technical Architecture (MVP)

### Core Technology Stack

- **Frontend:** React (Single-Page App)
- **Backend & Storage:** Supabase
  - Database
  - Storage
  - Edge Functions
- **AI Orchestration:** Firebase Studio AI
- **AI Research & Generation:** Google Gemini API
- **Document Generation:**  
  - python-pptx microservice or  
  - Third-party APIs (SlideSpeak / Aspose.Slides)

---

## 🗄️ Data Model (Supabase)

**documents table**

| Field | Type | Description |
|-----|-----|------------|
| id | UUID | Primary key |
| owner_id | Text | User identifier |
| title | Text | Document title |
| document_type | Text | POV |
| input | Text | Company name | Product/Solution Name |
| content | JSONB | Structured slide content |
| ppt_url | Text | Public PPT file URL |
| created_at | Timestamp | Creation time |

---

## 🔁 Key Workflows

### Generate Document
- React → Supabase Edge Function
- Gemini research + JSON generation
- PPT creation
- Storage + DB persistence

---

### Editing
- Rich-text editor bound to JSON
- Save updates content in database

---

### Sharing & Download
- Share via public URL
- Export to Word / PDF on demand
- Download original `.pptx`

---

## 🔮 Future Enhancements

- Generate Pitch decks, RFP Documents, Strategy Document, Proposal Documents etc..
- Regenerate PPT with user edits
- Collaborative editing
- Multi-template support
- Version history
- Google Slides integration
- Role-based access control

---
