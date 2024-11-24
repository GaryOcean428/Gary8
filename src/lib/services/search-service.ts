import { SearchConfig, SearchResult } from '../types/search-types';
import { RedisCache } from '../cache/redis-cache';
import { thoughtLogger } from '../utils/logger';
import { AppError } from '../errors/AppError';

export class SearchService {
  private static instance: SearchService;
  private cache: RedisCache;
  private config: SearchConfig;

  private constructor() {
    this.cache = RedisCache.getInstance();
    this.config = {
      providers: {
        perplexity: {
          apiKey: process.env.PERPLEXITY_API_KEY!,
          model: 'llama-3.1-sonar-large-128k-online',
          maxTokens: 4096
        },
        // ... other provider configs
      },
      rag: {
        enabled: true,
        similarityThreshold: 0.8,
        maxResults: 5
      }
    };
  }

  static getInstance(): SearchService {
    if (!this.instance) {
      this.instance = new SearchService();
    }
    return this.instance;
  }

  async search(query: string, options?: Partial<SearchConfig>): Promise<SearchResult[]> {
    try {
      // Check cache first
      const cachedResults = await this.cache.get(`search:${query}`);
      if (cachedResults) {
        return JSON.parse(cachedResults);
      }

      // Perform search across providers
      const results = await this.executeSearch(query, options);
      
      // Cache results
      await this.cache.set(`search:${query}`, JSON.stringify(results), 3600);
      
      return results;
    } catch (error) {
      thoughtLogger.error('Search failed', { query, error });
      throw new AppError('Search operation failed', 'SEARCH_ERROR');
    }
  }
}