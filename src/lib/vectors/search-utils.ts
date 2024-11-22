import { HybridVectorStore } from './hybrid-store';
import { thoughtLogger } from '../utils/logger';
import { AppError } from '../error';

export interface SearchOptions {
  limit?: number;
  minScore?: number;
  filters?: {
    fileTypes?: string[];
    dateRange?: { start: Date; end: Date };
    permanent?: boolean;
  };
  sort?: 'relevance' | 'date' | 'size';
  groupBy?: 'file' | 'type' | 'none';
}

export class SearchUtils {
  constructor(private vectorStore: HybridVectorStore) {}

  async semanticSearch(query: string, options: SearchOptions = {}): Promise<any[]> {
    try {
      const {
        limit = 10,
        minScore = 0.7,
        filters,
        sort = 'relevance',
        groupBy = 'none'
      } = options;

      // Build filter object for vector search
      const searchFilter: Record<string, any> = {};
      if (filters) {
        if (filters.fileTypes?.length) {
          searchFilter.mimeType = { $in: filters.fileTypes };
        }
        if (filters.dateRange) {
          searchFilter.timestamp = {
            $gte: filters.dateRange.start.getTime(),
            $lte: filters.dateRange.end.getTime()
          };
        }
        if (typeof filters.permanent === 'boolean') {
          searchFilter.permanent = filters.permanent;
        }
      }

      // Perform vector search
      const results = await this.vectorStore.search(query, {
        limit: limit * 2, // Get more results for post-processing
        minScore,
        filter: searchFilter
      });

      // Post-process results
      let processedResults = this.processResults(results, sort);
      
      // Group results if needed
      if (groupBy !== 'none') {
        processedResults = this.groupResults(processedResults, groupBy);
      }

      return processedResults.slice(0, limit);
    } catch (error) {
      thoughtLogger.log('error', 'Semantic search failed', { error });
      throw new AppError('Search failed', 'SEARCH_ERROR');
    }
  }

  private processResults(results: any[], sort: string): any[] {
    switch (sort) {
      case 'date':
        return results.sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);
      case 'size':
        return results.sort((a, b) => b.metadata.size - a.metadata.size);
      default: // 'relevance'
        return results.sort((a, b) => b.score - a.score);
    }
  }

  private groupResults(results: any[], groupBy: string): any[] {
    const groups = new Map<string, any[]>();

    results.forEach(result => {
      const key = groupBy === 'file' 
        ? result.metadata.parentFile 
        : result.metadata.mimeType;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(result);
    });

    return Array.from(groups.values()).flat();
  }
} 