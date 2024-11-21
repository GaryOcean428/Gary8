export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
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

export interface SearchResult {
  type: 'answer' | 'source';
  title?: string;
  content: string;
  url?: string;
  timestamp: string;
}

export interface SearchResponse {
  answer: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}