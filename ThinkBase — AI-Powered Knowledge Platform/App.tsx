import React, { useState, useMemo, useCallback } from 'react';
import { Project, Document, IntelligenceArtifacts, ArtifactType } from './types';
import { ARTIFACT_TABS } from './constants';
import { processContent } from './services/geminiService';
import { FolderIcon, PlusIcon, Spinner } from './components/icons';
import { IngestionView } from './components/IngestionView';
import { ArtifactsDisplay } from './components/ArtifactViews';
import { SuccessModal } from './components/SuccessModal';

const Sidebar: React.FC<{
    projects: Project[];
    activeProject: Project | null;
    onSelectProject: (id: string) => void;
    onAddProject: (name: string) => void;
}> = ({ projects, activeProject, onSelectProject, onAddProject }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    const handleCreateClick = () => {
        setIsCreating(true);
    };

    const handleCancelCreate = () => {
        setIsCreating(false);
        setNewProjectName('');
    };

    const handleConfirmCreate = () => {
        if (newProjectName.trim()) {
            onAddProject(newProjectName.trim());
            handleCancelCreate();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleConfirmCreate();
        } else if (e.key === 'Escape') {
            handleCancelCreate();
        }
    };

    return (
        <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col">
            <h1 className="text-2xl font-bold text-white mb-6">ThinkBase</h1>
            
            {isCreating ? (
                <div className="mb-4">
                    <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="New project name"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                        autoFocus
                    />
                    <div className="mt-2 flex gap-2">
                        <button 
                            onClick={handleConfirmCreate} 
                            disabled={!newProjectName.trim()}
                            className="flex-1 px-4 py-2 bg-brand-blue text-white text-sm font-semibold rounded-md hover:bg-brand-accent transition disabled:opacity-50"
                        >
                            Create
                        </button>
                        <button 
                            onClick={handleCancelCreate} 
                            className="flex-1 px-4 py-2 bg-gray-600 text-gray-200 text-sm rounded-md hover:bg-gray-500 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={handleCreateClick}
                    className="w-full flex items-center justify-center gap-2 mb-4 px-4 py-2 bg-brand-blue text-white font-semibold rounded-md hover:bg-brand-accent transition"
                >
                    <PlusIcon className="w-5 h-5" />
                    New Project
                </button>
            )}

            <nav className="flex-grow overflow-y-auto">
                <ul>
                    {projects.map(p => (
                        <li key={p.id}>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); onSelectProject(p.id); }}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                                    activeProject?.id === p.id
                                        ? 'bg-brand-accent text-white'
                                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                <FolderIcon className="w-5 h-5" />
                                <span>{p.name}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

// FIX: Update onAddDocument prop to accept an optional mimeType for image uploads.
const ProjectWorkspace: React.FC<{
    project: Project;
    onAddDocument: (document: Omit<Document, 'id' | 'artifacts' | 'processed' | 'createdAt'> & { mimeType?: string }) => void;
    isLoading: boolean;
}> = ({ project, onAddDocument, isLoading }) => {
    const [activeTab, setActiveTab] = useState<ArtifactType | 'ingest'>('ingest');

    const combinedArtifacts = useMemo<IntelligenceArtifacts>(() => {
        const initial: IntelligenceArtifacts = {
            decisions: [], actionItems: [], timelineEvents: [],
            people: [], glossary: [], qaPairs: [], references: []
        };
        if (!project) return initial;
        
        return project.documents.reduce((acc, doc) => {
            if (!doc.processed) return acc;
            return {
                decisions: [...acc.decisions, ...doc.artifacts.decisions],
                actionItems: [...acc.actionItems, ...doc.artifacts.actionItems],
                timelineEvents: [...acc.timelineEvents, ...doc.artifacts.timelineEvents],
                people: [...acc.people, ...doc.artifacts.people], // Simple concat, could be smarter
                glossary: [...acc.glossary, ...doc.artifacts.glossary],
                qaPairs: [...acc.qaPairs, ...doc.artifacts.qaPairs],
                references: [...acc.references, ...doc.artifacts.references],
            };
        }, initial);
    }, [project]);

    return (
        <main className="flex-1 p-6 overflow-y-auto">
            <h2 className="text-3xl font-bold text-white mb-2">{project.name}</h2>
            <p className="text-gray-400 mb-6">This is your project's collective brain. Add content or explore the generated knowledge.</p>
            
            <div className="border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('ingest')}
                        className={`${
                            activeTab === 'ingest'
                                ? 'border-brand-accent text-brand-accent'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
                    >
                        Ingestion
                    </button>
                    {ARTIFACT_TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`${
                                activeTab === tab
                                    ? 'border-brand-accent text-brand-accent'
                                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>
            
            {activeTab === 'ingest' ? (
                <>
                    <IngestionView onAddDocument={onAddDocument} isLoading={isLoading} />
                    <DocumentList documents={project.documents} />
                </>
            ) : (
                <ArtifactsDisplay artifacts={combinedArtifacts} activeTab={activeTab as ArtifactType} />
            )}
        </main>
    );
};

const DocumentList: React.FC<{documents: Document[]}> = ({ documents }) => (
    <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Processed Documents</h3>
        <div className="space-y-3">
            {documents.slice().reverse().map(doc => (
                 <div key={doc.id} className="bg-gray-800 p-3 rounded-md flex justify-between items-center border border-gray-700">
                    <div>
                        <p className="font-medium text-gray-200">{doc.name}</p>
                        <p className="text-xs text-gray-400">{doc.createdAt.toLocaleString()}</p>
                    </div>
                    {doc.processed ? 
                        <span className="text-xs font-medium bg-green-800 text-green-200 px-2 py-1 rounded-full">Processed</span> :
                        <div className="flex items-center gap-2 text-xs font-medium bg-yellow-800 text-yellow-200 px-2 py-1 rounded-full">
                            <Spinner className="w-3 h-3"/> Processing
                        </div>
                    }
                 </div>
            ))}
        </div>
    </div>
);


function App() {
    const [projects, setProjects] = useState<Project[]>([
        { id: 'proj-1', name: 'Q4 Launch Project', documents: [] },
        { id: 'proj-2', name: 'API v3 Design', documents: [] }
    ]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>('proj-1');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleAddProject = (name: string) => {
        if (name) {
            const newProject: Project = {
                id: `proj-${Date.now()}`,
                name,
                documents: []
            };
            setProjects(prev => [...prev, newProject]);
            setActiveProjectId(newProject.id);
        }
    };

    // FIX: Update handleAddDocument to accept and use the mimeType for image processing, avoiding hardcoded values.
    const handleAddDocument = useCallback(async (docData: Omit<Document, 'id' | 'artifacts' | 'processed' | 'createdAt'> & { mimeType?: string }) => {
        if (!activeProjectId) return;
        setIsLoading(true);

        const { mimeType, ...docProperties } = docData;

        const newDoc: Document = {
            ...docProperties,
            id: `doc-${Date.now()}`,
            artifacts: { decisions: [], actionItems: [], timelineEvents: [], people: [], glossary: [], qaPairs: [], references: [] },
            processed: false,
            createdAt: new Date(),
        };

        setProjects(prev => prev.map(p => 
            p.id === activeProjectId ? { ...p, documents: [...p.documents, newDoc] } : p
        ));
        
        try {
            const contentToProcess = docData.type === 'image' 
                ? { type: 'image' as const, data: docData.content, mimeType: mimeType || 'image/jpeg' } // Use the passed mimeType.
                : docData.content;
            
            const artifacts = await processContent(contentToProcess, docData.name);

            setProjects(prev => prev.map(p => 
                p.id === activeProjectId 
                ? { 
                    ...p, 
                    documents: p.documents.map(d => 
                        d.id === newDoc.id ? { ...d, artifacts, processed: true } : d
                    ) 
                  } 
                : p
            ));
            setShowSuccessModal(true);
        } catch (error) {
            console.error("Failed to process document:", error);
            alert("An error occurred while processing the document. Please try again.");
            // Optionally remove the failed document
            setProjects(prev => prev.map(p => 
                p.id === activeProjectId 
                ? { ...p, documents: p.documents.filter(d => d.id !== newDoc.id) } 
                : p
            ));
        } finally {
            setIsLoading(false);
        }

    }, [activeProjectId]);

    const activeProject = projects.find(p => p.id === activeProjectId) ?? null;

    return (
        <div className="flex h-screen bg-gray-800 text-gray-200 font-sans">
            <Sidebar
                projects={projects}
                activeProject={activeProject}
                onSelectProject={setActiveProjectId}
                onAddProject={handleAddProject}
            />
            {activeProject ? (
                 <ProjectWorkspace 
                    project={activeProject} 
                    onAddDocument={handleAddDocument}
                    isLoading={isLoading}
                 />
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-gray-400">Select a project to begin</h2>
                        <p className="text-gray-500">or create a new one to start organizing knowledge.</p>
                    </div>
                </div>
            )}
            <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
        </div>
    );
}

export default App;
