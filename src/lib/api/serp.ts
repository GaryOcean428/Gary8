import { useConfigStore, config } from '../config';
import { AppError } from '../errors/AppError';
import { thoughtLogger } from '../logging/thought-logger';

export class SerpAPI {
  private readonly baseUrl: string;
  private configStore = useConfigStore;

  constructor() {
    this.baseUrl = 'https://serpapi.com/search';
  }

  async search(_query: string): Promise<string> {
    const apiKey = this.configStore.getState().apiKeys.serp;
    
    if (!apiKey) {
      throw new AppError('SERP API key not configured', 'API_ERROR');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}?api_key=${apiKey}&q=${encodeURIComponent(_query)}&num=5`
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AppError(
          `SERP API error: ${error.message || response.statusText}`,
          'API_ERROR'
        );
      }

      const data = await response.json();
      
      if (!data.organic_results || !data.organic_results.length) {
        return 'No results found.';
      }

      return data.organic_results
        .map((_result: unknown) => `${_result.title}\n${_result.snippet}`)
        .join('\n\n');
    } catch (error) {
      thoughtLogger.log('error', 'SERP search failed', { error });
      throw error instanceof AppError ? error : new AppError(
        'Failed to communicate with SERP API',
        'API_ERROR',
        error
      );
    }
  }
}