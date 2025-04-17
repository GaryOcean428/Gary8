export interface SearchMetadata {
  query: string;
  timestamp: string;
  responseTime?: number;
}

export interface SearchSuccess {
  success: true;
  content: string;
  metadata: SearchMetadata;
}

export interface SearchError {
  success: false;
  error: string;
  metadata: SearchMetadata;
}

export type SearchResult = SearchSuccess | SearchError;