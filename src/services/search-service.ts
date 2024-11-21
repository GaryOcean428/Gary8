import { config } from '../lib/config';
import { MoASearchAggregator } from '../lib/search/moa';
import { RagProcessor } from '../lib/search/rag-processor';
import { PerplexityAPI } from '../lib/api/perplexity';
import { TavilyAPI } from '../lib/api/tavily';
import { GoogleSearchAPI } from '../lib/api/google-search';
import { SerpAPI } from '../lib/api/serp';
import { thoughtLogger } from '../lib/logging/thought-logger';
import type { SearchResult } from '../lib/types/search';

class SearchService {
  private perplexityAPI: PerplexityAPI;
  private tavilyAPI: TavilyAPI;
  private googleSearchAPI: GoogleSearchAPI;
  private serpAPI: SerpAPI;
  private moaAggregator: MoASearchAggregator;
  private ragProcessor: RagProcessor;
  private static instance: SearchService;

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

  async search(query: string): Promise<string> {
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
      throw error;
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
}

// Export singleton instance
export const searchService = SearchService.getInstance();