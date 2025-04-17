import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, MoreHorizontal, GaugeCircle, Clock, Newspaper, X, ArrowUpDown, Filter, Book, Image, AlertCircle, Loader, RefreshCw } from 'lucide-react';
import { useSearch } from '../context/SearchContext';
import SearchResults from './SearchResults';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export default function SearchInterface() {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useLocalStorage('search.sort', 'relevance');
  const [filterState, setFilterState] = useLocalStorage('search.filters', {
    time: 'any', // 'any', 'day', 'week', 'month', 'year'
    source: 'all' // 'all', 'web', 'academic', 'news', 'code'
  });
  
  const resultsEndRef = useRef<HTMLDivElement>(null);
  const { 
    search, 
    results, 
    isStreaming, 
    streamingPhase, 
    isCached, 
    error,
    retrySearch,
    cancelSearch
  } = useSearch();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isStreaming) return;

    try {
      await search(query, filterState, sortOption);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleSortChange = (value: string) => {
    setSortOption(value);
    if (results.length > 0 && query) {
      search(query, filterState, value);
    }
  };

  const handleFilterChange = (key: keyof typeof filterState, value: string) => {
    setFilterState(prev => ({ ...prev, [key]: value }));
    if (results.length > 0 && query) {
      search(query, { ...filterState, [key]: value }, sortOption);
    }
  };

  useEffect(() => {
    if (results.length > 0) {
      resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [results]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If the user presses Enter, start search
    if (e.key === 'Enter') {
      handleSearch(e as any);
    }
    
    // If the user presses Escape, clear the search input
    if (e.key === 'Escape') {
      setQuery('');
    }
  };

  const handleCancelSearch = () => {
    cancelSearch();
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Search Header */}
      <header className="bg-card/50 backdrop-blur-sm border-b border-border p-4 sticky top-0 z-10">
        <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="w-full bg-input rounded-lg pl-12 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus-glow text-foreground"
              disabled={isStreaming}
            />
            <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
            
            <div className="absolute right-4 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-full transition-colors ${showFilters ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
                aria-label="Show filters"
              >
                <Filter className="w-4 h-4" />
              </button>
              
              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleCancelSearch}
                  className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10 p-2 rounded-full transition-colors"
                  aria-label="Cancel search"
                >
                  <X className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isStreaming || !query.trim()}
                  className="text-primary hover:text-primary-foreground hover:bg-primary/10 p-2 rounded-full transition-colors disabled:opacity-50"
                  aria-label="Search"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-3 pb-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Time Range</label>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { id: 'any', label: 'Any time' },
                        { id: 'day', label: 'Past 24h' },
                        { id: 'week', label: 'Past week' },
                        { id: 'month', label: 'Past month' },
                        { id: 'year', label: 'Past year' }
                      ].map(option => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleFilterChange('time', option.id)}
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            filterState.time === option.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-foreground hover:bg-muted/80'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs text-muted-foreground">Sources</label>
                      <div className="flex gap-2 items-center">
                        <label className="text-xs text-muted-foreground mr-1">Sort by:</label>
                        <button
                          type="button"
                          onClick={() => handleSortChange(sortOption === 'relevance' ? 'recency' : 'relevance')}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <span>{sortOption === 'relevance' ? 'Relevance' : 'Recency'}</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { id: 'all', label: 'All', icon: Search },
                        { id: 'web', label: 'Web', icon: GaugeCircle },
                        { id: 'news', label: 'News', icon: Newspaper },
                        { id: 'academic', label: 'Academic', icon: Book },
                        { id: 'image', label: 'Images', icon: Image }
                      ].map(option => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleFilterChange('source', option.id)}
                          className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 transition-colors ${
                            filterState.source === option.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-foreground hover:bg-muted/80'
                          }`}
                        >
                          <option.icon className="w-3 h-3" />
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </header>

      {/* Streaming Status Indicator */}
      {isStreaming && (
        <div className="bg-card/30 backdrop-blur-sm border-b border-border py-2 px-4 flex items-center justify-center gap-2">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-2 h-2 rounded-full bg-primary"
          />
          <span className="text-sm text-muted-foreground">
            {streamingPhase === 'searching' && 'Searching for information...'}
            {streamingPhase === 'processing' && 'Processing data...'}
            {streamingPhase === 'analyzing' && 'Analyzing results...'}
            {streamingPhase === 'generating' && 'Generating response...'}
            {!streamingPhase && 'Processing your query...'}
          </span>
        </div>
      )}

      {/* Error State */}
      {error && !isStreaming && (
        <div className="m-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <h3 className="font-medium text-destructive mb-1">Search Error</h3>
              <p className="text-destructive/90 text-sm">{error.message}</p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  leftIcon={<RefreshCw size={14} />}
                  onClick={retrySearch}
                >
                  Retry Search
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<X size={14} />}
                  onClick={() => setQuery('')}
                >
                  Clear Query
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <SearchResults 
            isStreaming={isStreaming} 
            streamingPhase={streamingPhase}
          />
          <div ref={resultsEndRef} />
        </div>
      </div>

      {/* Sort Options Popover */}
      <AnimatePresence>
        {results.length > 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 card-glass p-2 shadow-lg z-10 backdrop-blur-lg"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSortChange('relevance')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  sortOption === 'relevance' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Relevance
              </button>
              <button
                onClick={() => handleSortChange('recency')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  sortOption === 'recency' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Recency
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 bg-muted text-foreground hover:bg-muted/80 rounded-full"
              >
                <Filter className="w-4 h-4" />
              </button>
              <button
                onClick={() => setQuery('')}
                className="p-2 text-muted-foreground hover:text-foreground"
                aria-label="Clear results"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}