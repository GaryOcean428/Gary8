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
