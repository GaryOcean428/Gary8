import { thoughtLogger } from '../logging/thought-logger';
import { AppError } from '../errors/AppError';
import { config } from '../config';

export class TavilyAPI {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.tavily.com/v1';

  constructor() {
    this.apiKey = config.apiKeys.tavily;
    if (!this.apiKey) {
      thoughtLogger.log('warning', 'Tavily API key not configured');
    }
  }

  async search(query: string, options: {
    searchDepth?: 'basic' | 'advanced';
    includeImages?: boolean;
    includeAnswers?: boolean;
    maxResults?: number;
  } = {}): Promise<string> {
    if (!this.apiKey) {
      throw new AppError('Tavily API key not configured', 'API_ERROR');
    }

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify({
          query,
          search_depth: options.searchDepth || 'advanced',
          include_images: options.includeImages || false,
          include_answer: options.includeAnswers || true,
          max_results: options.maxResults || 10
        })
      });

      if (!response.ok) {
        throw new AppError(
          `Tavily API error: ${response.statusText}`,
          'API_ERROR',
          { status: response.status }
        );
      }

      const data = await response.json();
      return this.formatResults(data);
    } catch (error) {
      thoughtLogger.log('error', 'Tavily search failed', { error });
      throw error instanceof AppError ? error : new AppError(
        'Failed to search with Tavily',
        'API_ERROR',
        error
      );
    }
  }

  async extract(url: string, options: {
    include_summary?: boolean;
    max_results?: number;
  } = {}): Promise<string> {
    if (!this.apiKey) {
      throw new AppError('Tavily API key not configured', 'API_ERROR');
    }

    try {
      const response = await fetch(`${this.baseUrl}/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify({
          url,
          include_summary: options.include_summary || true,
          max_results: options.max_results || 5
        })
      });

      if (!response.ok) {
        throw new AppError(
          `Tavily API error: ${response.statusText}`,
          'API_ERROR',
          { status: response.status }
        );
      }

      const data = await response.json();
      return this.formatExtractedContent(data);
    } catch (error) {
      thoughtLogger.log('error', 'Tavily extraction failed', { error });
      throw error instanceof AppError ? error : new AppError(
        'Failed to extract content with Tavily',
        'API_ERROR',
        error
      );
    }
  }

  private formatResults(data: any): string {
    let formattedContent = '';

    if (data.answer) {
      formattedContent += `${data.answer}\n\n`;
    }

    if (data.results?.length) {
      formattedContent += '### Sources\n\n';
      data.results.forEach((result: any) => {
        formattedContent += `**${result.title}**\n${result.snippet}\n[${result.url}](${result.url})\n\n`;
      });
    }

    return formattedContent.trim();
  }

  private formatExtractedContent(data: any): string {
    let formattedContent = '';

    if (data.summary) {
      formattedContent += `### Summary\n${data.summary}\n\n`;
    }

    if (data.content) {
      formattedContent += `### Content\n${data.content}\n\n`;
    }

    if (data.metadata) {
      formattedContent += `### Metadata\n`;
      Object.entries(data.metadata).forEach(([key, value]) => {
        formattedContent += `- ${key}: ${value}\n`;
      });
    }

    return formattedContent.trim();
  }
}