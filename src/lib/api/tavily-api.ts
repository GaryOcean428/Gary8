import { thoughtLogger } from '../logging/thought-logger';

interface TavilySearchOptions {
  search_depth?: 'basic' | 'advanced';
  topic?: 'general' | 'news';
  max_results?: number;
  include_domains?: string[];
  exclude_domains?: string[];
  include_answer?: boolean;
  include_raw_content?: boolean;
  include_images?: boolean;
}

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content?: string;
  published_date?: string;
}

interface TavilyResponse {
  query: string;
  answer?: string;
  results: TavilySearchResult[];
  images?: string[];
  response_time: number;
}

export class TavilyAPI {
  private static instance: TavilyAPI;
  private apiKey: string;
  private baseUrl = 'https://api.tavily.com/search';

  private constructor() {
    const apiKey = process.env.NEXT_PUBLIC_TAVILY_API_KEY;
    if (!apiKey) {
      thoughtLogger.log('error', 'Tavily API key not configured');
      throw new Error('Tavily API key not configured');
    }
    this.apiKey = apiKey;
  }

  static getInstance(): TavilyAPI {
    if (!TavilyAPI.instance) {
      TavilyAPI.instance = new TavilyAPI();
    }
    return TavilyAPI.instance;
  }

  async search(query: string, options: TavilySearchOptions = {}): Promise<TavilyResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          query,
          search_depth: options.search_depth || 'basic',
          topic: options.topic || 'general',
          max_results: options.max_results || 5,
          include_domains: options.include_domains,
          exclude_domains: options.exclude_domains,
          include_answer: options.include_answer,
          include_raw_content: options.include_raw_content,
          include_images: options.include_images,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        thoughtLogger.log('error', 'Tavily API error', { error });
        throw new Error(`Tavily API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      thoughtLogger.log('success', 'Tavily search completed', { query });
      return data;
    } catch (error) {
      thoughtLogger.log('error', 'Tavily search failed', { error, query });
      throw error;
    }
  }

  async getSearchContext(query: string, maxTokens: number = 4000): Promise<string> {
    try {
      const response = await this.search(query, {
        search_depth: 'advanced',
        max_results: 5,
      });

      // Combine results into a context string
      const context = response.results
        .map(result => `${result.content}\nSource: ${result.url}`)
        .join('\n\n');

      thoughtLogger.log('success', 'Tavily context generated', { query });
      return context;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to get search context', { error, query });
      throw error;
    }
  }
} 