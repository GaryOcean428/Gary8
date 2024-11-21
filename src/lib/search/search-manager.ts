import { thoughtLogger } from '../logging/thought-logger';
import { PerplexityAPI } from '../api/perplexity';
import { TavilyAPI } from '../api/tavily';
import { GoogleSearchAPI } from '../api/google-search';
import { SerpAPI } from '../api/serp';
import { MoASearchAggregator } from './moa';
import { RagProcessor } from './rag-processor';
import { SearchResult } from '../types/search';
import { config } from '../config';

export class SearchManager {
  private static instance: SearchManager;
  private perplexityAPI: PerplexityAPI;
  private tavilyAPI: TavilyAPI;
  private googleSearchAPI: GoogleSearchAPI;
  private serpAPI: SerpAPI;
  private moaAggregator: MoASearchAggregator;
  private ragProcessor: RagProcessor;

  private constructor() {
    this.perplexityAPI = new PerplexityAPI();
    this.tavilyAPI = new TavilyAPI();
    this.googleSearchAPI = new GoogleSearchAPI();
    this.serpAPI = new SerpAPI();
    this.moaAggregator = new MoASearchAggregator();
    this.ragProcessor = new RagProcessor();
  }

  static getInstance(): SearchManager {
    if (!SearchManager.instance) {
      SearchManager.instance = new SearchManager();
    }
    return SearchManager.instance;
  }

  async search(query: string): Promise<string> {
    thoughtLogger.log('plan', 'Starting concurrent search with MoA and RAG', { query });

    try {
      // Run primary searches concurrently
      const [perplexityResult, tavilyResult] = await Promise.allSettled([
        this.perplexityAPI.search(query),
        this.tavilyAPI.search(query)
      ]);

      // Run fallback searches if needed
      let fallbackResults: PromiseSettledResult<string>[] = [];
      if (perplexityResult.status === 'rejected' || tavilyResult.status === 'rejected') {
        fallbackResults = await Promise.allSettled([
          this.googleSearchAPI.search(query),
          this.serpAPI.search(query)
        ]);
      }

      // Collect successful results
      const results: SearchResult[] = [];

      // Add primary results
      if (perplexityResult.status === 'fulfilled') {
        results.push({
          success: true,
          content: perplexityResult.value,
          metadata: {
            source: 'perplexity',
            timestamp: new Date().toISOString(),
            query
          }
        });
      }

      if (tavilyResult.status === 'fulfilled') {
        results.push({
          success: true,
          content: tavilyResult.value,
          metadata: {
            source: 'tavily',
            timestamp: new Date().toISOString(),
            query
          }
        });
      }

      // Add fallback results if needed
      fallbackResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push({
            success: true,
            content: result.value,
            metadata: {
              source: index === 0 ? 'google' : 'serp',
              timestamp: new Date().toISOString(),
              query
            }
          });
        }
      });

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
}