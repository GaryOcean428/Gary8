import { config } from '../config';
import type { Message } from '../types';
import { AppError } from '../errors/AppError';

export class PerplexityAPI {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.apiKey = config.apiKeys.perplexity;
    this.baseUrl = config.services.perplexity.baseUrl;
    this.model = config.services.perplexity.defaultModel;

    if (!this.apiKey) {
      console.warn('Perplexity API key not configured');
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
          model: this.model,
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