
export interface FirebaseUser {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: number;
  lastLoginAt: number;
  settings: {
    theme: 'light' | 'dark';
    enableNotifications: boolean;
    enableAnalytics: boolean;
  };
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  systemPrompt?: string;
  metadata?: Record<string, unknown>;
}

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: number;
  metadata?: {
    tokens?: number;
    processingTime?: number;
    model?: string;
    codeBlocks?: Array<{
      language: string;
      code: string;
    }>;
  };
}

export interface Memory {
  id: string;
  userId: string;
  type: 'conversation' | 'code' | 'fact' | 'reference';
  content: string;
  context?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
  embeddings?: number[];
  tags?: string[];
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  steps: Array<{
    id: string;
    type: string;
    config: Record<string, unknown>;
    dependencies: string[];
  }>;
  createdAt: number;
  updatedAt: number;
  lastRunAt?: number;
  status: 'active' | 'archived' | 'draft';
}