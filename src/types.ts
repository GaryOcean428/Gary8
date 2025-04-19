export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
}

export interface SavedChat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
  tags?: string[];
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
}
