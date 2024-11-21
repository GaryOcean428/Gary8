import { BaseAPI } from './base-api';
import { AppError } from '../errors/AppError';
import { thoughtLogger } from '../logging/thought-logger';
import type { Message } from '../types';

export class PerplexityAPI extends BaseAPI {
  private static instance: PerplexityAPI;

  private constructor() {
    super();
    if (!this.config.apiKeys.perplexity) {
      thoughtLogger.log('warning', 'Perplexity API key not configured');
    }
  }

  static getInstance(): PerplexityAPI {
    if (!PerplexityAPI.instance) {
      PerplexityAPI.instance = new PerplexityAPI();
    }
    return PerplexityAPI.instance;
  }

  async chat(messages: Message[], onProgress?: (content: string) => void): Promise<string> {
    if (!this.config.apiKeys.perplexity) {
      throw new AppError('Perplexity API key not configured', 'API_ERROR');
    }

    try {
      const response = await fetch(`${this.config.services.perplexity.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(this.config.apiKeys.perplexity, {
          'API-Version': this.config.services.perplexity.apiVersion
        }),
        body: JSON.stringify({
          model: this.config.services.perplexity.defaultModel,
          messages: messages.map(({ role, content }) => ({ role, content })),
          temperature: this.config.services.perplexity.temperature,
          max_tokens: this.config.services.perplexity.maxTokens,
          stream: Boolean(onProgress)
        })
      });

      if (!response.ok) {
        throw new AppError(
          `Perplexity API error: ${response.statusText}`,
          'API_ERROR',
          { status: response.status }
        );
      }

      if (onProgress && response.body) {
        return this.handleStreamingResponse(response.body, onProgress);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      thoughtLogger.log('error', 'Perplexity API request failed', { error });
      throw error instanceof AppError ? error : new AppError(
        'Failed to communicate with Perplexity API',
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
              thoughtLogger.log('error', 'Failed to parse streaming response', { error: e });
            }
          }
        }
      }

      return fullContent;
    } finally {
      reader.releaseLock();
    }
  }
}