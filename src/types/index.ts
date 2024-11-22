// Panel Types
export type ActivePanel = 
  | 'chat' 
  | 'canvas' 
  | 'documents' 
  | 'settings' 
  | 'search'
  | 'competitor-analysis';

// Agent Types
export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: 'idle' | 'working' | 'error';
}

// Document Types
export interface Document {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'code' | 'image';
  createdAt: Date;
  updatedAt: Date;
}

// Settings Types
export interface Settings {
  theme: 'light' | 'dark';
  fontSize: number;
  language: string;
  notifications: boolean;
  autoSave: boolean;
}

// Search Types
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: string;
  score: number;
  highlights: string[];
}

// Canvas Types
export interface CanvasElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'connection';
  position: { x: number; y: number };
  data: any;
}
