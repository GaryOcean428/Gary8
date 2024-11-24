import { config } from '../config';
import { AppError } from '../errors/AppError';

export class GoogleSearchAPI {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly searchEngineId: string;

  constructor() {
    this.apiKey = config.apiKeys.google;
    this.baseUrl = config.services.google.baseUrl;
    this.searchEngineId = config.services.google.searchEngineId;

    if (!this.apiKey) {
      console.warn('Google Search API key not configured');
    }
  }

  async search(query: string): Promise<string> {
    if (!this.apiKey) {
      throw new AppError('Google Search API key not configured', 'API_ERROR');
    }

    try {
      const url = new URL(this.baseUrl);
      url.searchParams.append('key', this.apiKey);
      url.searchParams.append('cx', this.searchEngineId);
      url.searchParams.append('q', query);
      url.searchParams.append('num', config.services.google.resultsPerPage.toString());

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new AppError(
          `Google API request failed with status ${response.status}`,
          'API_ERROR'
        );
      }

      const data = await response.json();
      return this.formatSearchResults(data.items || []);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to communicate with Google Search API', 'API_ERROR', error);
    }
  }

  private formatSearchResults(items: any[]): string {
    if (!items.length) {
      return 'No results found.';
    }

    return items.map(item => {
      const title = item.title || 'Untitled';
      const snippet = item.snippet || 'No description available.';
      return `**${title}**\n${snippet}\n`;
    }).join('\n');
  }
}