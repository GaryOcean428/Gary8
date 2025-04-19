import { config } from '../lib/config';
import { MoASearchAggregator } from '../lib/search/moa';
import { thoughtLogger } from '../lib/logging/thought-logger';
import { useConfigStore } from '../lib/config';
import { perplexityModels } from '../lib/config/perplexity-models';

export class SearchService {
  private moaAggregator: MoASearchAggregator;
  private configStore = useConfigStore;
  private cache = new Map<string, { data: unknown, timestamp: number }>();
  private cacheTTL = 30 * 60 * 1000; // 30 minutes

  constructor() { 
    this.moaAggregator = new MoASearchAggregator();
  }

  needsSearch(_query: string): boolean {
    const searchKeywords = [
      'what', 'who', 'where', 'when', 'why', 'how',
      'search', 'find', 'look up', 'tell me about',
      'latest', 'news', 'current', 'recent'
    ];
    return searchKeywords.some(_keyword => 
      _query.toLowerCase().includes(_keyword.toLowerCase())
    );
  }

  async search(_query: string, _filters = {}, _sort = 'relevance'): Promise<any[]> {
    const apiKeys = this.configStore.getState().apiKeys;
    const cacheKey = `${_query}:${JSON.stringify(_filters)}:${_sort}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      thoughtLogger.log('success', 'Using cached search results', { _query });
      return cached.data;
    }
    
    try {
      // Generate answer using AI
      let answer = '';
      const providers = [];

      // Try providers in order of availability
      if (apiKeys.perplexity) {
        try {
          answer = await this.searchWithPerplexity(_query);
          providers.push('Perplexity');
        } catch (error) {
          thoughtLogger.log('error', 'Perplexity search failed, trying next provider', { error });
        }
      }

      if (!answer && apiKeys.openai) {
        try {
          answer = await this.searchWithOpenAI(_query);
          providers.push('OpenAI');
        } catch (error) {
          thoughtLogger.log('error', 'OpenAI search failed, trying next provider', { error });
        }
      }

      if (!answer && apiKeys.anthropic) {
        try {
          answer = await this.searchWithAnthropic(_query);
          providers.push('Anthropic');
        } catch (error) {
          thoughtLogger.log('error', 'Anthropic search failed, trying next provider', { error });
        }
      }

      if (!answer && apiKeys.xai) {
        try {
          answer = await this.searchWithXai(_query);
          providers.push('X.AI');
        } catch (error) {
          thoughtLogger.log('error', 'X.AI search failed, trying next provider', { error });
        }
      }

      if (!answer && apiKeys.groq) {
        try {
          answer = await this.searchWithGroq(_query);
          providers.push('Groq');
        } catch (error) {
          thoughtLogger.log('error', 'Groq search failed', { error });
        }
      }

      // If we still don't have an answer, use a fallback message
      if (!answer) {
        answer = 'I was unable to search for information due to service unavailability. Please try again later or check your API configuration.';
      }

      // Generate fake source results for demonstration
      const sources = this.generateSampleSources(_query, _sort);
      
      // Combine answer and sources
      const results = [
        {
          type: 'answer',
          content: answer,
          timestamp: new Date().toISOString(),
          providers: providers.join(', ')
        },
        ...sources
      ];
      
      // Cache results
      this.cache.set(cacheKey, { data: results, timestamp: Date.now() });
      
      return results;
    } catch (error) {
      thoughtLogger.log('error', 'Search failed', { error });
      throw error;
    }
  }

  private async searchWithPerplexity(_query: string): Promise<string> {
    const apiKeys = this.configStore.getState().apiKeys;
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeys.perplexity}`
      },
      body: JSON.stringify({
        model: perplexityModels.sonarReasoningPro,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant with search capabilities. Provide accurate and helpful information about the user\'s query.'
          },
          { 
            role: 'user', 
            content: _query 
          }
        ],
        temperature: 0.5,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API returned ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async searchWithOpenAI(_query: string): Promise<string> {
    const apiKeys = this.configStore.getState().apiKeys;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeys.openai}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Provide accurate and helpful information about the user\'s query.'
          },
          { 
            role: 'user', 
            content: _query 
          }
        ],
        temperature: 0.5,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async searchWithAnthropic(_query: string): Promise<string> {
    const apiKeys = this.configStore.getState().apiKeys;
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKeys.anthropic,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3.5-haiku-latest',
        messages: [
          { 
            role: 'user', 
            content: _query 
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API returned ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private async searchWithXai(_query: string): Promise<string> {
    const apiKeys = this.configStore.getState().apiKeys;
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeys.xai}`
      },
      body: JSON.stringify({
        model: 'grok-3-mini-latest',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Provide accurate and helpful information about the user\'s query.'
          },
          { 
            role: 'user', 
            content: _query 
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`X.AI API returned ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async searchWithGroq(_query: string): Promise<string> {
    const apiKeys = this.configStore.getState().apiKeys;
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeys.groq}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Provide accurate and helpful information about the user\'s query.'
          },
          { 
            role: 'user', 
            content: _query 
          }
        ],
        temperature: 0.5,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API returned ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Helper to generate sample source results for UI demonstration
  private generateSampleSources(_query: string, _sort: string): any[] {
    const domains = [
      'wikipedia.org', 'github.com', 'stackoverflow.com',
      'medium.com', 'dev.to', 'ycombinator.com',
      'nytimes.com', 'bbc.com', 'cnn.com',
      'papers.ssrn.com', 'arxiv.org', 'science.org'
    ];
    
    const types = ['web', 'code', 'news', 'academic'];
    
    const getRandomInt = (_min: number, _max: number) => {
      return Math.floor(Math.random() * (_max - _min + 1)) + _min;
    };
    
    const sources = Array(getRandomInt(4, 8)).fill(0).map((_, _i) => {
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const daysAgo = getRandomInt(0, 365);
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - daysAgo);
      
      return {
        type: 'source',
        title: `${_query} - Result from ${domain}`,
        content: `This is a sample result about "${_query}" from ${domain}. This text would contain a snippet or summary of the information found at this source.`,
        url: `https://www.${domain}/path/to/${_query.replace(/\s+/g, '-').toLowerCase()}`,
        sourceType: type,
        timestamp: timestamp.toISOString(),
        relevanceScore: getRandomInt(60, 95) / 100
      };
    });
    
    // Sort based on selected option
    if (_sort === 'recency') {
      sources.sort((_a, _b) => new Date(_b.timestamp).getTime() - new Date(_a.timestamp).getTime());
    } else {
      sources.sort((_a, _b) => _b.relevanceScore - _a.relevanceScore);
    }
    
    return sources;
  }
}

export const searchService = new SearchService();