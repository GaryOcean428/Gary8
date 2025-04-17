import { BaseAPI } from './base-api';
import { AppError } from '../errors/AppError';
import { thoughtLogger } from '../logging/thought-logger';
import type { Message } from '../types';
import { config } from '../config';

export class GroqAPI {
  private static instance: GroqAPI;
  private baseUrl: string;
  private apiKey: string;

  private constructor() {
    this.baseUrl = config.services.groq.baseUrl;
    this.apiKey = '';
  }

  static getInstance(): GroqAPI {
    if (!GroqAPI.instance) {
      GroqAPI.instance = new GroqAPI();
    }
    return GroqAPI.instance;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  async chat(
    messages: Message[],
    model: string = 'llama-3.3-70b-versatile',
    onProgress?: (content: string) => void,
    options: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
    } = {}
  ): Promise<string> {
    if (!this.apiKey) {
      throw new AppError('Groq API key not configured', 'API_ERROR');
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: messages.map(({ role, content }) => ({ role, content })),
          temperature: options.temperature ?? config.services.groq.temperature,
          max_tokens: options.maxTokens ?? config.services.groq.maxTokens,
          top_p: options.topP ?? 1.0,
          frequency_penalty: options.frequencyPenalty ?? 0,
          presence_penalty: options.presencePenalty ?? 0,
          stream: Boolean(onProgress)
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText || 'Unknown error';
        
        throw new AppError(
          `Groq API error: ${errorMessage} (${response.status})`,
          'API_ERROR',
          { status: response.status, ...errorData }
        );
      }

      if (onProgress && response.body) {
        return this.handleStreamingResponse(response.body, onProgress);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      thoughtLogger.log('error', 'Groq API request failed', { error });
      throw new AppError(
        `Failed to communicate with Groq API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'API_ERROR',
        { originalError: error }
      );
    }
  }

  async listModels(): Promise<string[]> {
    if (!this.apiKey) {
      throw new AppError('Groq API key not configured', 'API_ERROR');
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AppError(
          `Failed to list Groq models: ${errorData.error?.message || response.statusText}`,
          'API_ERROR',
          { status: response.status, ...errorData }
        );
      }

      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      thoughtLogger.log('error', 'Groq model listing failed', { error });
      throw error instanceof AppError ? error : new AppError(
        'Failed to list Groq models',
        'API_ERROR',
        { originalError: error }
      );
    }
  }

  private async handleStreamingResponse(
    body: ReadableStream<Uint8Array>,
    onProgress: (content: string) => void
  ): Promise<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onProgress(content);
              }
            } catch (e) {
              thoughtLogger.log('error', 'Failed to parse Groq streaming response', { error: e });
            }
          }
        }
      }

      return fullContent;
    } finally {
      reader.releaseLock();
    }
  }

  getModelInfo(modelId: string): {
    name: string;
    contextWindow: number;
    description: string;
    tier: string;
  } | null {
    const modelMap: Record<string, {
      name: string;
      contextWindow: number;
      description: string;
      tier: string;
    }> = {
      'llama-3.3-70b-versatile': {
        name: 'Llama 3.3 70B',
        contextWindow: 128000,
        description: 'Versatile large language model',
        tier: 'Free'
      },
      'llama3-groq-70b-8192-tool-use-preview': {
        name: 'Llama 3 Tool Use',
        contextWindow: 8192,
        description: 'Specialized for function calling and tool use',
        tier: 'Pro'
      },
      'llama3-8b-8192': {
        name: 'Llama 3 8B',
        contextWindow: 8192,
        description: 'Fast, efficient smaller model',
        tier: 'Free'
      },
      'llama-3.2-90b-vision-preview': {
        name: 'Llama 3.2 90B Vision',
        contextWindow: 8192,
        description: 'Large vision model for handling images',
        tier: 'Premium'
      },
      'llama-3.2-11b-vision-preview': {
        name: 'Llama 3.2 11B Vision',
        contextWindow: 8192,
        description: 'Efficient vision model',
        tier: 'Pro'
      },
      'llama-3.2-11b-text-preview': {
        name: 'Llama 3.2 11B Text',
        contextWindow: 8192,
        description: 'Efficient text-only model',
        tier: 'Pro'
      },
      'llama-3.2-3b-preview': {
        name: 'Llama 3.2 3B',
        contextWindow: 8192,
        description: 'Lightweight model for basic tasks',
        tier: 'Free'
      },
      'llama-3.2-1b-preview': {
        name: 'Llama 3.2 1B',
        contextWindow: 8192,
        description: 'Ultra-lightweight model',
        tier: 'Free'
      },
      'llama-3.1-70b-versatile': {
        name: 'Llama 3.1 70B',
        contextWindow: 32768,
        description: 'Previous generation versatile model',
        tier: 'Free'
      },
      'llama-3.1-8b-instant': {
        name: 'Llama 3.1 8B',
        contextWindow: 131072,
        description: 'Fast, efficient model with large context',
        tier: 'Free'
      }
    };

    return modelMap[modelId] || null;
  }
}

// Export singleton instance
export const groqApi = GroqAPI.getInstance();