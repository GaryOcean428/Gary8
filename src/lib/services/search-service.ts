import { thoughtLogger } from '../logging/thought-logger';
import { PerplexityAPI } from '../api/perplexity';
import { TavilyAPI } from '../api/tavily';
import { GoogleSearchAPI } from '../api/google-search';
import { SerpAPI } from '../api/serp';
import { MoASearchAggregator } from '../search/moa';
import { RagProcessor } from '../search/rag-processor';
import { SearchResult } from '../types/search';
import { config } from '../config';
import { AppError } from '../errors/AppError';

export class SearchService {
  private static instance: SearchService;
  private perplexityAPI: PerplexityAPI;
  private tavilyAPI: TavilyAPI;
  private googleSearchAPI: GoogleSearchAPI;
  private serpAPI: SerpAPI;
  private moaAggregator: MoASearchAggregator;
  private ragProcessor: RagProcessor;
  private initialized = false;

  private constructor() {
    this.perplexityAPI = new PerplexityAPI();
    this.tavilyAPI = new TavilyAPI();
    this.googleSearchAPI = new GoogleSearchAPI();
    this.serpAPI = new SerpAPI();
    this.moaAggregator = new MoASearchAggregator();
    this.ragProcessor = new RagProcessor();
  }

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Verify API keys
      const missingKeys = this.validateApiKeys();
      if (missingKeys.length > 0) {
        throw new AppError(`Missing search API keys: ${missingKeys.join(', ')}`, 'CONFIG_ERROR');
      }

      this.initialized = true;
      thoughtLogger.log('success', 'Search service initialized');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize search service', { error });
      throw error;
    }
  }

  private validateApiKeys(): string[] {
    const requiredKeys = {
      perplexity: config.apiKeys.perplexity,
      tavily: config.apiKeys.tavily,
      google: config.apiKeys.google,
      serp: config.apiKeys.serp
    };

    return Object.entries(requiredKeys)
      .filter(([_, value]) => !value)
      .map(([key]) => key);
  }

  async search(query: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    thoughtLogger.log('plan', 'Starting concurrent search with MoA and RAG', { query });

    try {
      // Run primary searches concurrently
      const [perplexityResult, tavilyResult] = await Promise.allSettled([
        this.searchWithProvider('perplexity', () => this.perplexityAPI.search(query)),
        this.searchWithProvider('tavily', () => this.tavilyAPI.search(query))
      ]);

      // Run fallback searches if needed
      let fallbackResults: PromiseSettledResult<SearchResult>[] = [];
      if (perplexityResult.status === 'rejected' || tavilyResult.status === 'rejected') {
        fallbackResults = await Promise.allSettled([
          this.searchWithProvider('google', () => this.googleSearchAPI.search(query)),
          this.searchWithProvider('serp', () => this.serpAPI.search(query))
        ]);
      }

      // Collect successful results
      const results = [
        ...(perplexityResult.status === 'fulfilled' ? [perplexityResult.value] : []),
        ...(tavilyResult.status === 'fulfilled' ? [tavilyResult.value] : []),
        ...fallbackResults
          .filter((result): result is PromiseFulfilledResult<SearchResult> => 
            result.status === 'fulfilled'
          )
          .map(result => result.value)
      ];

      if (results.length === 0) {
        throw new AppError('No search results available', 'SEARCH_ERROR');
      }

      // Process results through RAG
      const ragResults = await this.ragProcessor.process(results);

      // Aggregate results using MoA
      const aggregatedContent = await this.moaAggregator.aggregate(ragResults);

      thoughtLogger.log('success', 'Search completed successfully', {
        resultCount: results.length,
        sources: results.map(r => r.metadata.source)
      });

      return aggregatedContent;
    } catch (error) {
      thoughtLogger.log('error', 'Search failed', { error });
      throw error instanceof AppError ? error : new AppError(
        'Search operation failed',
        'SEARCH_ERROR',
        error
      );
    }
  }

  private async searchWithProvider(
    provider: string,
    searchFn: () => Promise<string>
  ): Promise<SearchResult> {
    try {
      const content = await searchFn();
      return {
        success: true,
        content,
        metadata: {
          source: provider,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      thoughtLogger.log('error', `${provider} search failed`, { error });
      throw error;
    }
  }

  get isInitialized(): boolean {
    return this.initialized;
  }
}