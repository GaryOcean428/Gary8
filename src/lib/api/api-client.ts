import { config } from '../config';
import { thoughtLogger } from '../logging/thought-logger';
import { AppError } from '../errors/AppError';
import { RateLimiter } from './rate-limiter';
import type { Message } from '../types';

export class APIClient {
  private static instance: APIClient | null = null;
  private initialized = false;
  private rateLimiter: RateLimiter;

  private constructor() {
    this.rateLimiter = new RateLimiter({
      maxRequests: 60,
      interval: 60 * 1000 // 1 minute
    });
  }

  static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }

  async initialize(): Promise<APIClient> {
    if (this.initialized) return this;

    try {
      // Validate required API keys
      const missingKeys = this.validateApiKeys();
      if (missingKeys.length > 0) {
        throw new AppError(`Missing API keys: ${missingKeys.join(', ')}`, 'CONFIG_ERROR');
      }

      // Test API connection
      await this.testConnection();
      
      this.initialized = true;
      thoughtLogger.log('success', 'API client initialized successfully');
      return this;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize API client', { error });
      throw error;
    }
  }

  private validateApiKeys(): string[] {
    const requiredKeys = ['xai', 'groq', 'perplexity', 'huggingface'] as const;
    return requiredKeys.filter(key => !config.apiKeys[key]);
  }

  private async testConnection(): Promise<void> {
    const response = await fetch(`${config.services.xai.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${config.apiKeys.xai}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new AppError('Failed to connect to API', 'API_ERROR');
    }
  }

  async chat(messages: Message[], onProgress?: (content: string) => void): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Check rate limits
    await this.rateLimiter.acquire();

    try {
      const response = await fetch(`${config.services.xai.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKeys.xai}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messages.map(({ role, content }) => ({ role, content })),
          model: config.services.xai.defaultModel,
          stream: Boolean(onProgress),
          temperature: config.services.xai.temperature,
          max_tokens: config.services.xai.maxTokens
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AppError(
          `Chat API request failed: ${error.error?.message || response.statusText}`,
          'API_ERROR'
        );
      }

      if (onProgress && response.body) {
        await this.handleStreamingResponse(response.body, onProgress);
        return;
      }

      const data = await response.json();
      onProgress?.(data.choices[0].message.content);
    } catch (error) {
      thoughtLogger.log('error', 'Chat request failed', { error });
      throw error;
    }
  }

  private async handleStreamingResponse(
    body: ReadableStream<Uint8Array>,
    onProgress: (content: string) => void
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();

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
                onProgress(content);
              }
            } catch (e) {
              thoughtLogger.log('error', 'Failed to parse streaming response', { error: e });
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  get isInitialized(): boolean {
    return this.initialized;
  }
}