
export interface Decision {
  decision: string;
  date: string;
  context: string;
}

export interface ActionItem {
  task: string;
  assignee: string | 'Unassigned';
  dueDate: string | 'N/A';
}

export interface TimelineEvent {
  date: string;
  event: string;
  type: 'decision' | 'milestone' | 'meeting' | 'upload';
}

export interface PersonProfile {
  name: string;
  expertise: string[];
  mentionedIn: number;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface QAPair {
  question: string;
  answer: string;
}

export interface Reference {
  url: string;
  description: string;
}

export interface IntelligenceArtifacts {
  decisions: Decision[];
  actionItems: ActionItem[];
  timelineEvents: TimelineEvent[];
  people: PersonProfile[];
  glossary: GlossaryTerm[];
  qaPairs: QAPair[];
  references: Reference[];
}

export interface Document {
  id: string;
  name: string;
  type: 'text' | 'image' | 'url';
  content: string; // raw text, base64 for image, or url
  artifacts: IntelligenceArtifacts;
  processed: boolean;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  documents: Document[];
}

export enum ArtifactType {
  Timeline = 'Timeline',
  Decisions = 'Decisions',
  ActionItems = 'Action Items',
  Experts = 'Experts',
  Glossary = 'Glossary',
  FAQ = 'FAQ',
  References = 'References',
}
