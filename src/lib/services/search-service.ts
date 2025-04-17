import { thoughtLogger } from '../logging/thought-logger';
import { MoASearchAggregator } from '../search/moa';
import type { SearchResult } from '../types';
import { useConfigStore } from '../config';
import { searchRouter } from '../routing/search-router';
import { apiClient } from '../api-client';
import { AppError } from '../errors/AppError';
import { getNetworkStatus } from '../../core/supabase/supabase-client';
import { supabase } from '../../core/supabase/supabase-client';

export class SearchService {
  private moaAggregator: MoASearchAggregator;
  private configStore = useConfigStore;
  private cache = new Map<string, { data: any, timestamp: number }>();
  private cacheTTL = 30 * 60 * 1000; // 30 minutes
  private useEdgeFunctions: boolean = true;

  constructor() { 
    this.moaAggregator = new MoASearchAggregator();
  }

  setUseEdgeFunctions(useEdgeFunctions: boolean): void {
    this.useEdgeFunctions = useEdgeFunctions;
    thoughtLogger.log('info', 'Search service configuration updated', { useEdgeFunctions });
  }

  needsSearch(query: string): boolean {
    const searchKeywords = [
      'what', 'who', 'where', 'when', 'why', 'how',
      'search', 'find', 'look up', 'tell me about',
      'latest', 'news', 'current', 'recent'
    ];
    return searchKeywords.some(keyword => 
      query.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  async search(query: string, filters = {}, sort = 'relevance'): Promise<any[]> {
    const apiKeys = this.configStore.getState().apiKeys;
    const cacheKey = `${query}:${JSON.stringify(filters)}:${sort}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      thoughtLogger.log('success', 'Using cached search results', { query });
      return cached.data;
    }
    
    // Check network connectivity first
    if (!getNetworkStatus()) {
      throw new AppError('Network unavailable. Please check your internet connection and try again.', 'NETWORK_ERROR');
    }
    
    try {
      // Try using Edge Functions for search if enabled
      if (this.useEdgeFunctions) {
        try {
          // Get route from search router
          const routeConfig = await searchRouter.route(query, []);
          
          // Invoke search edge function
          const { data, error } = await supabase.functions.invoke('search', {
            body: {
              query,
              provider: routeConfig.provider,
              options: {
                includeImages: routeConfig.includeImages,
                includeNews: routeConfig.includeNews,
                recentOnly: routeConfig.recentOnly,
                maxResults: routeConfig.maxResults
              }
            }
          });
          
          if (!error && data?.success && data?.results) {
            // Cache the results
            this.cache.set(cacheKey, { data: data.results, timestamp: Date.now() });
            return data.results;
          }
          
          // If edge function fails, fall back to direct API calls
          thoughtLogger.log('warning', 'Search edge function failed, falling back to direct API calls', { error });
        } catch (error) {
          thoughtLogger.log('warning', 'Error using search edge function, falling back to direct API calls', { error });
          // Fall through to direct search implementation
        }
      }
      
      // Generate answer using AI
      let answer = '';
      const providers = [];

      // Try providers in order of availability
      const providerErrors: Record<string, string> = {};
      
      if (apiKeys.perplexity) {
        try {
          answer = await this.searchWithPerplexity(query);
          providers.push('Perplexity');
        } catch (error) {
          providerErrors['Perplexity'] = error instanceof Error ? error.message : 'Unknown error';
          thoughtLogger.log('error', 'Perplexity search failed, trying next provider', { error });
        }
      }

      if (!answer && apiKeys.openai) {
        try {
          answer = await this.searchWithOpenAI(query);
          providers.push('OpenAI');
        } catch (error) {
          providerErrors['OpenAI'] = error instanceof Error ? error.message : 'Unknown error';
          thoughtLogger.log('error', 'OpenAI search failed, trying next provider', { error });
        }
      }

      if (!answer && apiKeys.anthropic) {
        try {
          answer = await this.searchWithAnthropic(query);
          providers.push('Anthropic');
        } catch (error) {
          providerErrors['Anthropic'] = error instanceof Error ? error.message : 'Unknown error';
          thoughtLogger.log('error', 'Anthropic search failed, trying next provider', { error });
        }
      }

      if (!answer && apiKeys.xai) {
        try {
          answer = await this.searchWithXai(query);
          providers.push('X.AI');
        } catch (error) {
          providerErrors['X.AI'] = error instanceof Error ? error.message : 'Unknown error';
          thoughtLogger.log('error', 'X.AI search failed, trying next provider', { error });
        }
      }

      if (!answer && apiKeys.groq) {
        try {
          answer = await this.searchWithGroq(query);
          providers.push('Groq');
        } catch (error) {
          providerErrors['Groq'] = error instanceof Error ? error.message : 'Unknown error';
          thoughtLogger.log('error', 'Groq search failed', { error });
        }
      }

      // If we still don't have an answer, report all the errors
      if (!answer) {
        const errorMessages = Object.entries(providerErrors)
          .map(([provider, error]) => `${provider}: ${error}`)
          .join('; ');
          
        throw new AppError(
          `All search providers failed: ${errorMessages}`,
          'SEARCH_ERROR'
        );
      }

      // Generate source results for demonstration
      const sources = this.generateSampleSources(query, sort);
      
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
      
      // Enhance error message for network issues
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new AppError(
          'Network error. Please check your internet connection and try again.',
          'NETWORK_ERROR'
        );
      }
      
      throw error;
    }
  }

  private async searchWithPerplexity(query: string): Promise<string> {
    const apiKey = this.configStore.getState().apiKeys.perplexity;
    
    if (!apiKey) {
      throw new AppError('Perplexity API key not configured', 'API_ERROR');
    }
    
    try {
      // First try to use apiClient for unified error handling and retries
      return await apiClient.chat(
        [
          {
            id: crypto.randomUUID(),
            role: 'system',
            content: 'You are a helpful AI assistant with search capabilities. Provide accurate and helpful information about the user\'s query.',
            timestamp: Date.now()
          },
          {
            id: crypto.randomUUID(),
            role: 'user',
            content: query,
            timestamp: Date.now()
          }
        ]
      );
    } catch (error) {
      // Fall back to direct API call if needed
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'sonar-reasoning-pro',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant with search capabilities. Provide accurate and helpful information about the user\'s query.'
            },
            { 
              role: 'user', 
              content: query 
            }
          ],
          temperature: 0.5,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        throw new AppError(`Perplexity API error: ${response.status} ${response.statusText}`, 'API_ERROR');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    }
  }

  private async searchWithOpenAI(query: string): Promise<string> {
    const apiKey = this.configStore.getState().apiKeys.openai;
    
    if (!apiKey) {
      throw new AppError('OpenAI API key not configured', 'API_ERROR');
    }

    try {
      // First try to use apiClient for unified error handling and retries
      return await apiClient.chat(
        [
          {
            id: crypto.randomUUID(),
            role: 'system',
            content: 'You are a helpful AI assistant. The user is asking a question that may require up-to-date information. Answer to the best of your ability based on your training data, but clearly state if the information might be outdated.',
            timestamp: Date.now()
          },
          {
            id: crypto.randomUUID(),
            role: 'user',
            content: query,
            timestamp: Date.now()
          }
        ]
      );
    } catch (error) {
      // Fall back to direct API call if needed
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant. The user is asking a question that may require up-to-date information. Answer to the best of your ability based on your training data, but clearly state if the information might be outdated.'
            },
            { 
              role: 'user', 
              content: query 
            }
          ],
          temperature: 0.5,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        throw new AppError(`OpenAI API error: ${response.status} ${response.statusText}`, 'API_ERROR');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    }
  }

  private async searchWithAnthropic(query: string): Promise<string> {
    const apiKey = this.configStore.getState().apiKeys.anthropic;
    
    if (!apiKey) {
      throw new AppError('Anthropic API key not configured', 'API_ERROR');
    }

    try {
      // First try to use apiClient for unified error handling and retries
      return await apiClient.chat(
        [
          {
            id: crypto.randomUUID(),
            role: 'user',
            content: query,
            timestamp: Date.now()
          }
        ]
      );
    } catch (error) {
      // Fall back to direct API call if needed
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3.5-haiku-latest',
          messages: [
            { 
              role: 'user', 
              content: query 
            }
          ],
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        throw new AppError(`Anthropic API error: ${response.status} ${response.statusText}`, 'API_ERROR');
      }

      const data = await response.json();
      return data.content[0].text;
    }
  }

  private async searchWithXai(query: string): Promise<string> {
    const apiKey = this.configStore.getState().apiKeys.xai;
    
    if (!apiKey) {
      throw new AppError('X.AI API key not configured', 'API_ERROR');
    }

    try {
      // First try to use apiClient for unified error handling and retries
      return await apiClient.chat(
        [
          {
            id: crypto.randomUUID(),
            role: 'system',
            content: 'You are a helpful AI assistant. Provide accurate and helpful information about the user\'s query.',
            timestamp: Date.now()
          },
          {
            id: crypto.randomUUID(),
            role: 'user',
            content: query,
            timestamp: Date.now()
          }
        ]
      );
    } catch (error) {
      // Fall back to direct API call if needed
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
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
              content: query 
            }
          ],
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        throw new AppError(`X.AI API error: ${response.status} ${response.statusText}`, 'API_ERROR');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    }
  }

  private async searchWithGroq(query: string): Promise<string> {
    const apiKey = this.configStore.getState().apiKeys.groq;
    
    if (!apiKey) {
      throw new AppError('Groq API key not configured', 'API_ERROR');
    }

    try {
      // First try to use apiClient for unified error handling and retries
      return await apiClient.chat(
        [
          {
            id: crypto.randomUUID(),
            role: 'system',
            content: 'You are a helpful AI assistant. Provide accurate and helpful information about the user\'s query.',
            timestamp: Date.now()
          },
          {
            id: crypto.randomUUID(),
            role: 'user',
            content: query,
            timestamp: Date.now()
          }
        ]
      );
    } catch (error) {
      // Fall back to direct API call if needed
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
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
              content: query 
            }
          ],
          temperature: 0.5,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        throw new AppError(`Groq API error: ${response.status} ${response.statusText}`, 'API_ERROR');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    }
  }

  // Helper to generate sample source results for UI demonstration
  // This will be replaced with actual sources from search APIs in production
  private generateSampleSources(query: string, sort: string): any[] {
    const domains = [
      'wikipedia.org', 'github.com', 'stackoverflow.com',
      'medium.com', 'dev.to', 'ycombinator.com',
      'nytimes.com', 'bbc.com', 'cnn.com',
      'papers.ssrn.com', 'arxiv.org', 'science.org'
    ];
    
    const types = ['web', 'code', 'news', 'academic'];
    
    const getRandomInt = (min: number, max: number) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    
    const sources = Array(getRandomInt(4, 8)).fill(0).map((_, i) => {
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const daysAgo = getRandomInt(0, 365);
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - daysAgo);
      
      return {
        type: 'source',
        title: `${query} - Result from ${domain}`,
        content: `This is a sample result about "${query}" from ${domain}. This text would contain a snippet or summary of the information found at this source.`,
        url: `https://www.${domain}/path/to/${query.replace(/\s+/g, '-').toLowerCase()}`,
        sourceType: type,
        timestamp: timestamp.toISOString(),
        relevanceScore: getRandomInt(60, 95) / 100
      };
    });
    
    // Sort based on selected option
    if (sort === 'recency') {
      sources.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else {
      sources.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    
    return sources;
  }
}

export const searchService = new SearchService();