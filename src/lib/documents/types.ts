export interface Document {
  id: string;
  name: string;
  content: string;
  mimeType: string;
  tags: string[];
  vectorId?: string;
  workspaceId: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  documentIds: string[];
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
}