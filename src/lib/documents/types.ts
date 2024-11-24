export interface Document {
  id: string;
  title: string;
  content: string;
  url?: string;
  tags: string[];
  lastModified: number;
  createdAt: number;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  documentIds: string[];
  collaborators?: string[];
  permissions?: {
    [userId: string]: 'read' | 'write' | 'admin'
  };
  settings?: {
    defaultModel?: string;
    aiCapabilities?: string[];
    toolAccess?: string[];
  };
}

export interface SearchOptions {
  query: string;
  workspaceId?: string;
  tags?: string[];
  limit?: number;
  similarity?: number;
}

export interface SearchResult {
  document: Document;
  score: number;
  excerpt?: string;
  context?: {
    sourcePath?: string;
    matchType?: 'exact' | 'semantic' | 'hybrid';
    confidence?: number;
    relatedDocs?: string[];
  };
}