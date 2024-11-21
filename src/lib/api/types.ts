/**
 * Common types for API interactions
 */

export interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface APIResponse<T> {
  data: T;
  headers: Record<string, string>;
  status: number;
}

export interface APIError {
  message: string;
  code: string;
  details?: unknown;
}

export interface StreamOptions {
  onProgress?: (content: string) => void;
  signal?: AbortSignal;
}