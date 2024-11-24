export interface SearchMetadata {
  source: string;
  timestamp: string;
  query?: string;
  responseTime?: number;
}

export interface SearchResult {
  success: boolean;
  content: string;
  metadata: SearchMetadata;
}

export interface SearchOptions {
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
  includeImages?: boolean;
  includeAnswers?: boolean;
}