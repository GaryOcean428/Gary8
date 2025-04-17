/**
 * Common types for AI API interactions
 */

// Request options for API calls
export interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

// Standard API response structure
export interface APIResponse<T> {
  data: T;
  headers: Record<string, string>;
  status: number;
}

// Error information structure
export interface APIError {
  message: string;
  code: string;
  details?: unknown;
}

// Options for streaming responses
export interface StreamOptions {
  onProgress?: (content: string) => void;
  signal?: AbortSignal;
}

// Request parameters for chat completions
export interface ChatCompletionOptions {
  model: string;
  messages: Array<{role: string; content: string}>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  stream?: boolean;
}

// Options for the Responses API
export interface ResponsesAPIOptions {
  model: string;
  input: any; // Can be string or structured input
  temperature?: number;
  max_tokens?: number;
  tools?: Record<string, any>;
  reasoning?: { effort?: number };
  response_format?: 'json' | 'text';
  stream?: boolean;
}

// Normalized result from different LLM APIs
export interface ModelResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  finish_reason?: string;
  toolCalls?: any[];
}