import { config } from '../config';
import { AppError } from '../errors/AppError';

export class SerpAPI {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = config.apiKeys.serp;
    this.baseUrl = config.services.serp.baseUrl;

    if (!this.apiKey) {
      console.warn('SERP API key not configured');
    }
  }

  async search(query: string): Promise<string> {
    if (!this.apiKey) {
      throw new AppError('SERP API key not configured', 'API_ERROR');
    }

    try {
      const url = new URL(this.baseUrl);
      url.searchParams.append('api_key', this.apiKey);
      url.searchParams.append('q', query);
      url.searchParams.append('num', config.services.serp.resultsPerPage.toString());

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new AppError(
          `SERP API request failed with status ${response.status}`,
          'API_ERROR'
        );
      }

      const data = await response.json();
      return this.formatSearchResults(data.organic_results || []);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to communicate with SERP API', 'API_ERROR', error);
    }
  }

  private formatSearchResults(results: any[]): string {
    if (!results.length) {
      return 'No results found.';
    }

    return results.map(result => {
      const title = result.title || 'Untitled';
      const snippet = result.snippet || 'No description available.';
      return `**${title}**\n${snippet}\n`;
    }).join('\n');
  }
}