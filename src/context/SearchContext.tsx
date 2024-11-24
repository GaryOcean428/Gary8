'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from '../hooks/useToast';
import { useSettings } from './SettingsContext';
import { thoughtLogger } from '../lib/logging/thought-logger';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: string;
  score: number;
  source: 'tavily' | 'perplexity' | 'google' | 'serp' | 'aggregated';
  url?: string;
  metadata?: Record<string, unknown>;
}

interface SearchContextType {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  searchHistory: string[];
  setQuery: (query: string) => void;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
  clearHistory: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

async function searchTavily(query: string, apiKey: string): Promise<SearchResult[]> {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query,
        search_depth: 'advanced',
        include_domains: [],
        exclude_domains: [],
        max_results: 10
      })
    });

    if (!response.ok) throw new Error('Tavily search failed');
    const data = await response.json();

    return data.results.map((result: any) => ({
      id: crypto.randomUUID(),
      title: result.title,
      content: result.snippet,
      type: 'web',
      score: result.relevance_score,
      source: 'tavily' as const,
      url: result.url,
      metadata: {
        domain: result.domain,
        published_date: result.published_date
      }
    }));
  } catch (error) {
    thoughtLogger.log('error', 'Tavily search failed', { error });
    return [];
  }
}

async function searchPerplexity(query: string, apiKey: string): Promise<SearchResult[]> {
  try {
    const response = await fetch('https://api.perplexity.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query,
        max_results: 10,
        highlight: true
      })
    });

    if (!response.ok) throw new Error('Perplexity search failed');
    const data = await response.json();

    return data.results.map((result: any) => ({
      id: crypto.randomUUID(),
      title: result.title,
      content: result.snippet,
      type: 'web',
      score: result.relevance_score,
      source: 'perplexity' as const,
      url: result.url,
      metadata: {
        highlights: result.highlights,
        timestamp: result.timestamp
      }
    }));
  } catch (error) {
    thoughtLogger.log('error', 'Perplexity search failed', { error });
    return [];
  }
}

async function searchGoogle(query: string, apiKey: string): Promise<SearchResult[]> {
  try {
    const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=160a1f0ff7af2449d&q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) throw new Error('Google search failed');
    const data = await response.json();

    return data.items?.map((item: any) => ({
      id: crypto.randomUUID(),
      title: item.title,
      content: item.snippet,
      type: 'web',
      score: 0.5, // Default score since Google doesn't provide relevance scores
      source: 'google' as const,
      url: item.link,
      metadata: {
        displayLink: item.displayLink,
        pagemap: item.pagemap
      }
    })) || [];
  } catch (error) {
    thoughtLogger.log('error', 'Google search failed', { error });
    return [];
  }
}

async function searchSerp(query: string, apiKey: string): Promise<SearchResult[]> {
  try {
    const response = await fetch(`https://serpapi.com/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&engine=google`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) throw new Error('SERP search failed');
    const data = await response.json();

    return data.organic_results?.map((result: any) => ({
      id: crypto.randomUUID(),
      title: result.title,
      content: result.snippet,
      type: 'web',
      score: 0.4, // Default score, slightly lower than Google
      source: 'serp' as const,
      url: result.link,
      metadata: {
        position: result.position,
        displayed_link: result.displayed_link
      }
    })) || [];
  } catch (error) {
    thoughtLogger.log('error', 'SERP search failed', { error });
    return [];
  }
}

function aggregateResults(
  tavilyResults: SearchResult[], 
  perplexityResults: SearchResult[],
  googleResults: SearchResult[],
  serpResults: SearchResult[]
): SearchResult[] {
  const urlMap = new Map<string, SearchResult[]>();
  
  // Assign source weights
  const sourceWeights = {
    tavily: 1.0,
    perplexity: 1.0,
    google: 0.7,
    serp: 0.6
  };
  
  // Group all results by URL
  [...tavilyResults, ...perplexityResults, ...googleResults, ...serpResults]
    .forEach(result => {
      if (!result.url) return;
      const existing = urlMap.get(result.url) || [];
      urlMap.set(result.url, [...existing, result]);
    });

  // Aggregate and score results
  return Array.from(urlMap.entries())
    .map(([url, results]) => {
      // Calculate weighted average score
      const weightedScore = results.reduce((sum, r) => {
        const weight = sourceWeights[r.source as keyof typeof sourceWeights];
        return sum + (r.score * weight);
      }, 0) / results.length;

      // Find the best result (prefer primary sources)
      const bestResult = results.reduce((best, current) => {
        const currentWeight = sourceWeights[current.source as keyof typeof sourceWeights];
        const bestWeight = sourceWeights[best.source as keyof typeof sourceWeights];
        return currentWeight > bestWeight ? current : best;
      });

      return {
        ...bestResult,
        id: crypto.randomUUID(),
        score: weightedScore * (results.length > 1 ? 1.2 : 1), // Boost for multiple sources
        source: 'aggregated',
        metadata: {
          ...bestResult.metadata,
          sources: results.map(r => r.source),
          originalScores: results.map(r => ({
            source: r.source,
            score: r.score
          }))
        }
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { addToast } = useToast();
  const { settings } = useSettings();

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setIsSearching(true);
      thoughtLogger.log('execution', 'Starting search with fallbacks', { query: searchQuery });

      // Add to search history
      setSearchHistory(prev => {
        const newHistory = [searchQuery, ...prev.filter(q => q !== searchQuery)];
        return newHistory.slice(0, 10);
      });

      // Try primary search providers first
      const [tavilyResults, perplexityResults] = await Promise.all([
        searchTavily(searchQuery, settings.apiKeys.tavily),
        searchPerplexity(searchQuery, settings.apiKeys.perplexity)
      ]);

      let googleResults: SearchResult[] = [];
      let serpResults: SearchResult[] = [];

      // If primary searches return limited results, try fallbacks
      if (tavilyResults.length + perplexityResults.length < 5) {
        thoughtLogger.log('info', 'Using fallback search providers', {
          primaryResultCount: tavilyResults.length + perplexityResults.length
        });

        [googleResults, serpResults] = await Promise.all([
          searchGoogle(searchQuery, settings.apiKeys.google),
          searchSerp(searchQuery, settings.apiKeys.serp)
        ]);
      }

      // Aggregate all results
      const aggregatedResults = aggregateResults(
        tavilyResults, 
        perplexityResults,
        googleResults,
        serpResults
      );
      
      thoughtLogger.log('success', 'Search completed', {
        tavilyCount: tavilyResults.length,
        perplexityCount: perplexityResults.length,
        googleCount: googleResults.length,
        serpCount: serpResults.length,
        aggregatedCount: aggregatedResults.length
      });

      setResults(aggregatedResults);
    } catch (error) {
      thoughtLogger.log('error', 'Search failed', { error });
      addToast({
        type: 'error',
        title: 'Search Error',
        message: 'Failed to perform search. Please try again.',
      });
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [addToast, settings.apiKeys]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return (
    <SearchContext.Provider
      value={{
        query,
        results,
        isSearching,
        searchHistory,
        setQuery,
        performSearch,
        clearSearch,
        clearHistory,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}