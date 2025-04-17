import { useConfigStore, config } from '../config';
import { AppError } from '../errors/AppError';
import { thoughtLogger } from '../logging/thought-logger';

export class GoogleSearchAPI {
  private readonly baseUrl: string;
  private configStore = useConfigStore;

  constructor() {
    this.baseUrl = 'https://www.googleapis.com/customsearch/v1';
  }

  async search(query: string): Promise<string> {
    const apiKey = this.configStore.getState().apiKeys.google;
    
    if (!apiKey) {
      throw new AppError('Google Search API key not configured', 'API_ERROR');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}?key=${apiKey}&q=${encodeURIComponent(query)}&num=5`
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AppError(
          `Google API error: ${error.message || response.statusText}`,
          'API_ERROR'
        );
      }

      const data = await response.json();
      
      if (!data.items || !data.items.length) {
        return 'No results found.';
      }

      return data.items
        .map((item: any) => `${item.title}\n${item.snippet}`)
        .join('\n\n');
    } catch (error) {
      thoughtLogger.log('error', 'Google search failed', { error });
      throw error instanceof AppError ? error : new AppError(
        'Failed to communicate with Google Search API',
        'API_ERROR',
        error
      );
    }
  }
}