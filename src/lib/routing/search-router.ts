import { thoughtLogger } from '../logging/thought-logger';
import { Message } from '../types';

export interface SearchRouterConfig {
  provider: 'perplexity' | 'openai' | 'bing' | 'serp' | 'tavily';
  model?: string;
  maxResults?: number;
  includeImages?: boolean;
  includeNews?: boolean;
  recentOnly?: boolean;
  confidence: number;
  routingExplanation: string;
}

/**
 * SearchRouter - Specialized router for search-related queries
 * Determines the best search provider based on query type
 */
export class SearchRouter {
  private readonly searchThreshold = 0.6;
  private readonly newsKeywords = ['news', 'latest', 'recent', 'today', 'yesterday', 'week', 'month', 'year', 'update', 'development'];
  private readonly imageKeywords = ['image', 'picture', 'photo', 'visual', 'look like', 'appearance', 'how does it look'];
  private readonly academicKeywords = ['research', 'paper', 'study', 'journal', 'academic', 'science', 'scientific', 'publication'];
  private readonly localKeywords = ['near me', 'nearby', 'location', 'locally', 'in my area', 'city', 'region', 'around me'];
  private readonly entityKeywords = ['who is', 'what is', 'person', 'company', 'organization', 'product', 'entity', 'profile'];

  async route(query: string, history: Message[]): Promise<SearchRouterConfig> {
    thoughtLogger.log('reasoning', 'Analyzing search query for provider selection');

    const needsSearch = this.assessSearchNeed(query);
    const requiresImages = this.requiresImages(query);
    const requiresNews = this.requiresNews(query);
    const requiresAcademic = this.requiresAcademic(query);
    const requiresLocal = this.requiresLocal(query);
    const requiresEntity = this.requiresEntity(query);
    const queryContext = history.length > 0 ? this.extractQueryContext(history) : '';

    thoughtLogger.log('observation', 'Search query analysis complete', {
      needsSearch,
      requiresImages,
      requiresNews,
      requiresAcademic,
      requiresLocal,
      requiresEntity,
    });


    // For image searches, prefer Bing
    if (requiresImages) {
      return {
        provider: 'bing',
        includeImages: true,
        confidence: 0.85,
        routingExplanation: 'Image search requested, using Bing for better image results',
      };
    }

    // For news and recent information, prefer Perplexity
    if (requiresNews) {
      return {
        provider: 'perplexity',
        model: 'sonar-reasoning-pro',
        recentOnly: true,
        confidence: 0.9,
        routingExplanation: 'News or recent information requested, using Perplexity for up-to-date results',
      };
    }

    // For academic or research queries, prefer Perplexity or Tavily
    if (requiresAcademic) {
      return {
        provider: 'tavily',
        maxResults: 8,
        confidence: 0.85,
        routingExplanation: 'Academic or research query detected, using Tavily for specialized search',
      };
    }

    // For local queries, prefer Bing or SERP
    if (requiresLocal) {
      return {
        provider: 'serp',
        confidence: 0.8,
        routingExplanation: 'Local information requested, using SERP for location-based results',
      };
    }

    // For entity lookups, prefer Bing
    if (requiresEntity) {
      return {
        provider: 'bing', 
        confidence: 0.85,
        routingExplanation: 'Entity information requested, using Bing for comprehensive entity details',
      };
    }
    // If search is likely not needed, return low confidence
    if (needsSearch < this.searchThreshold) {
      return {
        provider: 'perplexity',
        confidence: 0.5,
        routingExplanation: 'Query may not require search, using general-purpose search with low confidence',
      };
    }

    // Default to Perplexity for general queries
    return {
      provider: 'perplexity',
      model: 'sonar-reasoning-pro',
      confidence: 0.75,
      routingExplanation: 'Using Perplexity for general search query',
    };
  }

  private assessSearchNeed(query: string): number {
    const searchKeywords = [
      'search', 'find', 'look up', 'locate', 'discover',
      'who', 'what', 'when', 'where', 'why', 'how',
      'latest', 'recent', 'current', 'new', 'today',
      'information', 'details', 'tell me about'
    ];

    const queryLower = query.toLowerCase();
    
    // Count how many search keywords appear in the query
    const keywordMatches = searchKeywords.filter(keyword => 
      queryLower.includes(keyword.toLowerCase())
    ).length;
    
    // Calculate match ratio relative to query length
    const queryWordCount = queryLower.split(/\s+/).length;
    const keywordRatio = keywordMatches / Math.min(queryWordCount, 10);
    
    // Questions are very likely to need search
    const isQuestion = /\b(who|what|when|where|why|how)\b.*\?/i.test(queryLower);
    
    // Calculate final search need score
    return Math.min(keywordRatio * 0.7 + (isQuestion ? 0.3 : 0), 1);
  }

  private requiresImages(query: string): boolean {
    const queryLower = query.toLowerCase();
    return this.imageKeywords.some(keyword => queryLower.includes(keyword));
  }

  private requiresNews(query: string): boolean {
    const queryLower = query.toLowerCase();
    return this.newsKeywords.some(keyword => queryLower.includes(keyword));
  }

  private requiresAcademic(query: string): boolean {
    const queryLower = query.toLowerCase();
    return this.academicKeywords.some(keyword => queryLower.includes(keyword));
  }

  private requiresLocal(query: string): boolean {
    const queryLower = query.toLowerCase();
    return this.localKeywords.some(keyword => queryLower.includes(keyword));
  }

  private requiresEntity(query: string): boolean {
    const queryLower = query.toLowerCase();
    return this.entityKeywords.some(keyword => queryLower.includes(keyword));
  }

  private extractQueryContext(history: Message[]): string {
    // Extract context from recent messages
    return history.slice(-3)
      .map(msg => msg.content)
      .join('\n');
  }
}

// Export singleton instance
export const searchRouter = new SearchRouter();