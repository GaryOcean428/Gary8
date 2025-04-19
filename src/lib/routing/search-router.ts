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
  private readonly imageKeywords = ['image', 'images', 'picture', 'pictures', 'photo', 'visual', 'look like', 'appearance', 'how does it look'];
  private readonly academicKeywords = ['paper', 'papers', 'study', 'studies', 'journal', 'academic', 'science', 'scientific', 'publication'];
  private readonly localKeywords = ['near me', 'nearby', 'location', 'local', 'locally', 'in my area', 'city', 'region', 'around me'];
  private readonly entityKeywords = ['who is', 'who was', 'what is', 'information about', 'person', 'company', 'organization', 'product', 'entity', 'profile'];

  async route(_query: string, _history: Message[]): Promise<SearchRouterConfig> {
    thoughtLogger.log('reasoning', 'Analyzing search query for provider selection');

    const q = _query.toLowerCase();
    // Treat interrogatives, 'Explain ...', and 'Recipe ...' as question-like to avoid low-confidence default
    const isQuestion = /\b(who|what|when|where|why|how)\b.*\?|^explain\b|^recipe\b/i.test(q);
    const needsSearch = this.assessSearchNeed(_query);

    // Image search detection
    if (/\b(images?|pictures?)\b/.test(q) || /\bphoto\b/.test(q) || /\bvisual\b/.test(q) || q.includes('look like') || q.includes('appearance') || q.includes('how does it look')) {
      return {
        provider: 'bing',
        includeImages: true,
        confidence: 0.85,
        routingExplanation: 'Image search requested, using Bing for better image results',
      };
    }

    // News and recent information
    if (/\b(news|latest|yesterday)\b/.test(q)) {
      return {
        provider: 'perplexity',
        model: 'sonar-reasoning-pro',
        recentOnly: true,
        confidence: 0.9,
        routingExplanation: 'News or recent information requested, using Perplexity for up-to-date results',
      };
    }

    // Academic or research queries
    if (/\b(papers?|studies|journal|academic|science|scientific|publication)\b/.test(q)) {
      return {
        provider: 'tavily',
        maxResults: 8,
        confidence: 0.85,
        routingExplanation: 'Academic or research query detected, using Tavily for specialized search',
      };
    }

    // Local or nearby queries
    if (/\b(near me|in my area|nearby|local|locally|city|region|around me)\b/.test(q)) {
      return {
        provider: 'serp',
        confidence: 0.8,
        routingExplanation: 'Local information requested, using SERP for location-based results',
      };
    }

    // Entity lookups (proper entities)
    if (
      /\b(who is|who was)\b/.test(q) ||
      q.startsWith('information about') ||
      /^what is (?!the )/.test(q)
    ) {
      return {
        provider: 'bing',
        confidence: 0.85,
        routingExplanation: 'Entity information requested, using Bing for comprehensive entity details',
      };
    }

    // Low confidence for non-search queries
    if (needsSearch < this.searchThreshold && !isQuestion) {
      return {
        provider: 'perplexity',
        confidence: 0.5,
        routingExplanation: 'Low search need detected; using Perplexity with low confidence',
      };
    }

    // Default route for general queries
    return {
      provider: 'perplexity',
      model: 'sonar-reasoning-pro',
      confidence: 0.75,
      routingExplanation: 'Using Perplexity for general search query',
    };
  }

  private assessSearchNeed(_query: string): number {
    const searchKeywords = [
      'search', 'find', 'look up', 'locate', 'discover',
      'who', 'what', 'when', 'where', 'why', 'how',
      'latest', 'recent', 'current', 'new', 'today',
      'information', 'details', 'tell me about'
    ];

    const queryLower = _query.toLowerCase();
    
    // Count how many search keywords appear in the query
    const keywordMatches = searchKeywords.filter(_keyword => 
      queryLower.includes(_keyword.toLowerCase())
    ).length;
    
    // Calculate match ratio relative to query length
    const queryWordCount = queryLower.split(/\s+/).length;
    const keywordRatio = keywordMatches / Math.min(queryWordCount, 10);
    
    // Questions are very likely to need search
    const isQuestion = /\b(who|what|when|where|why|how)\b.*\?/i.test(queryLower);
    
    // Calculate final search need score
    return Math.min(keywordRatio * 0.7 + (isQuestion ? 0.3 : 0), 1);
  }

  private requiresImages(_query: string): boolean {
    const queryLower = _query.toLowerCase();
    // Match multi-word phrases with simple includes, single words with word boundaries
    return this.imageKeywords.some(_keyword => {
      if (_keyword.includes(' ')) {
        return queryLower.includes(_keyword);
      }
      const pattern = new RegExp(`\\b${_keyword}\\b`);
      return pattern.test(queryLower);
    });
  }

  private requiresNews(_query: string): boolean {
    const queryLower = _query.toLowerCase();
    return this.newsKeywords.some(_keyword => queryLower.includes(_keyword));
  }

  private requiresAcademic(_query: string): boolean {
    const queryLower = _query.toLowerCase();
    return this.academicKeywords.some(_keyword => queryLower.includes(_keyword));
  }

  private requiresLocal(_query: string): boolean {
    const queryLower = _query.toLowerCase();
    return this.localKeywords.some(_keyword => queryLower.includes(_keyword));
  }

  private requiresEntity(_query: string): boolean {
    const queryLower = _query.toLowerCase();
    return this.entityKeywords.some(_keyword => queryLower.includes(_keyword));
  }

  private extractQueryContext(_history: Message[]): string {
    // Extract context from recent messages
    return _history.slice(-3)
      .map(_msg => _msg.content)
      .join('\n');
  }
}

// Export singleton instance
export const searchRouter = new SearchRouter();