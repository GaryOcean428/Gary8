import React, { createContext, useContext, useState } from 'react';
import { searchService } from '../services/search-service';
import { thoughtLogger } from '../lib/logging/thought-logger';
import type { SearchResult } from '../lib/types/search';

interface SearchContextType {
  results: SearchResult[];
  isStreaming: boolean;
  search: (query: string) => Promise<void>;
  clearResults: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const search = async (query: string) => {
    setIsStreaming(true);
    try {
      thoughtLogger.log('execution', 'Starting search', { query });
      const searchResults = await searchService.search(query);
      
      setResults(prev => [...prev, {
        success: true,
        content: searchResults,
        metadata: {
          source: 'aggregated',
          timestamp: new Date().toISOString(),
          query
        }
      }]);

      thoughtLogger.log('success', 'Search completed');
    } catch (error) {
      thoughtLogger.log('error', 'Search failed', { error });
      setResults(prev => [...prev, {
        success: false,
        content: error instanceof Error ? error.message : 'Search failed',
        metadata: {
          source: 'error',
          timestamp: new Date().toISOString(),
          query
        }
      }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    thoughtLogger.log('success', 'Search results cleared');
  };

  return (
    <SearchContext.Provider value={{ results, isStreaming, search, clearResults }}>
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