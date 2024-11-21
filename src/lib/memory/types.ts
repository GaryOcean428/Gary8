export interface MemoryItem {
  id: string;
  type: 'instruction' | 'response' | 'error' | 'learning';
  content: string;
  tags: string[];
  timestamp: number;
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

export interface VectorEntry {
  id: string;
  vector: number[];
  metadata: {
    content: string;
    type: string;
    timestamp: number;
    tags: string[];
  };
}

export interface DBEntry {
  _id?: string;
  memoryId: string;
  content: string;
  type: string;
  timestamp: number;
  tags: string[];
  metadata?: Record<string, unknown>;
}