import { useConfigStore, config } from '../config';
import type { Message } from '../types';
import { AppError } from '../errors/AppError';
import { thoughtLogger } from '../logging/thought-logger';

export class PerplexityAPI {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private configStore = useConfigStore;

  constructor() {
    this.apiKey = this.configStore.getState().apiKeys.perplexity;
    this.baseUrl = config.services.perplexity.baseUrl;

    if (!this.apiKey) {
      thoughtLogger.log('warning', 'Perplexity API key not configured');
    }
  }

  async search(query: string): Promise<string> {
    if (!this.apiKey) {
      throw new AppError('Perplexity API key not configured', 'API_ERROR');
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: config.services.perplexity.models.reasoningPro,
          messages: [{ role: 'user', content: query }],
          max_tokens: config.services.perplexity.maxTokens,
          temperature: config.services.perplexity.temperature
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AppError(
          `Perplexity API error: ${error.message || response.statusText}`,
          'API_ERROR'
        );
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to communicate with Perplexity API', 'API_ERROR', error);
    }
  }
}