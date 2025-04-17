/**
 * X.AI API specific types
 */
export interface XAIRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface XAIConfig {
  apiKey: string;
  baseUrl: string;
  apiVersion: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  models: {
    beta: string;
    fast: string;
    mini: string;
    miniFast: string;
  };
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}