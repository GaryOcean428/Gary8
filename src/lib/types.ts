export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface APIError extends Error {
  status?: number;
  response?: unknown;
}

export interface SearchResult {
  title: string;
  snippet: string;
  link: string;
}