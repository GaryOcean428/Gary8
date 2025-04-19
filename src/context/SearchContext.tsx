import React, { createContext, useContext, useState, useCallback } from 'react';
import { SearchResult } from '../types';
import { searchService } from '../lib/services/search-service';
import { useSettings } from '../features/settings/hooks/useSettings';
import { getNetworkStatus } from '../core/supabase/supabase-client';
import { thoughtLogger } from '../lib/logging/thought-logger';

export type StreamingPhase = 'searching' | 'processing' | 'analyzing' | 'generating' | null;

interface SearchContextType {
  results: SearchResult[];
  isStreaming: boolean;
  streamingPhase: StreamingPhase;
  search: (query: string, filters?: unknown, sort?: string) => Promise<void>;
  clearResults: () => void;
  isCached: boolean;
  error: Error | null;
  lastQuery: string | null;
  retrySearch: () => Promise<void>;
  cancelSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingPhase, setStreamingPhase] = useState<StreamingPhase>(null);
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [lastFilters, setLastFilters] = useState<any>({});
  const [lastSort, setLastSort] = useState<string>('relevance');
  const [currentAbortController, setCurrentAbortController] = useState<AbortController | null>(null);
  
  const { settings } = useSettings();

  const search = useCallback(async (_query: string, _filters = {}, _sort = 'relevance') => {
    if (!_query.trim()) {
      setResults([]);
      return;
    }
    
    // Cancel any ongoing search
    if (currentAbortController) {
      currentAbortController.abort();
    }
    
    // Create a new abort controller for this search
    const controller = new AbortController();
    setCurrentAbortController(controller);
    
    setLastQuery(_query);
    setLastFilters(_filters);
    setLastSort(_sort);
    setIsStreaming(true);
    setIsCached(false);
    setError(null);
    setStreamingPhase('searching');
    
    try {
      // Check if we're offline
      if (!getNetworkStatus()) {
        throw new Error('You are currently offline. Please check your internet connection and try again.');
      }
      
      // Check cache first
      const cacheKey = `search:${_query}:${JSON.stringify(_filters)}:${_sort}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        // Short delay to show the cache is being used
        await new Promise(_resolve => setTimeout(_resolve, 300));
        setStreamingPhase('processing');
        await new Promise(_resolve => setTimeout(_resolve, 200));
        
        setResults(JSON.parse(cached));
        setIsCached(true);
        setIsStreaming(false);
        setStreamingPhase(null);
        return;
      }
      
      // Simulate search phases
      setStreamingPhase('searching');
      await new Promise(_resolve => setTimeout(_resolve, 800));
      
      setStreamingPhase('processing');
      await new Promise(_resolve => setTimeout(_resolve, 600));
      
      setStreamingPhase('analyzing');
      await new Promise(_resolve => setTimeout(_resolve, 500));
      
      setStreamingPhase('generating');
      
      // Do the actual search
      const searchResults = await searchService.search(_query, _filters, _sort);
      
      // Cache the results if the search was successful
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(searchResults));
      } catch (e) {
        console.warn('Failed to cache search results:', e);
      }
      
      // Update state with results
      setResults(searchResults);
      thoughtLogger.log('success', 'Search completed successfully', { 
        _query, 
        resultCount: searchResults.length 
      });
    } catch (error) {
      thoughtLogger.log('error', 'Search failed', { error });
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // Add error result
      setResults([{
        type: 'answer',
        content: `Error performing search: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsStreaming(false);
      setStreamingPhase(null);
      setCurrentAbortController(null);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setLastQuery(null);
    setLastFilters({});
    setLastSort('relevance');
    setError(null);
  }, []);
  
  const retrySearch = useCallback(async () => {
    if (lastQuery) {
      await search(lastQuery, lastFilters, lastSort);
    }
  }, [lastQuery, lastFilters, lastSort, search]);
  
  const cancelSearch = useCallback(() => {
    if (currentAbortController) {
      currentAbortController.abort();
      setIsStreaming(false);
      setStreamingPhase(null);
      setCurrentAbortController(null);
    }
  }, [currentAbortController]);

  return (
    <SearchContext.Provider value={{ 
      results, 
      isStreaming, 
      streamingPhase,
      search, 
      clearResults,
      isCached,
      error,
      lastQuery,
      retrySearch,
      cancelSearch
    }}>
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