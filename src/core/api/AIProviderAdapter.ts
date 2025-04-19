import { Message } from '../../types';

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  streaming?: boolean;
  tools?: Record<string, unknown>;
}

export interface AIProviderAdapter {
  name: string;
  setApiKey(apiKey: string): void;
  getAvailableModels(): string[] | Promise<string[]>;
  chat(messages: Message[], onProgress?: (content: string) => void, options?: ChatOptions): Promise<string>;
  isApiKeyValid(): Promise<{success: boolean; message: string}>;
}