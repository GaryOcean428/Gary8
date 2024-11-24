import React from 'react';
import { Search as SearchIcon, Sparkles, ExternalLink } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
import { SearchResults } from '../SearchResults';
import { motion, AnimatePresence } from 'framer-motion';

export function SearchPanel() {
  const [query, setQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const resultsEndRef = React.useRef<HTMLDivElement>(null);
  const { search, results, isStreaming } = useSearch();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    try {
      await search(query);
    } finally {
      setIsSearching(false);
    }
  };

  React.useEffect(() => {
    if (results.length > 0) {
      resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [results]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Search Header */}
      <header className="bg-background/50 backdrop-blur-sm border-b border-border p-4">
        <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anything..."
              className="w-full bg-secondary text-foreground rounded-lg pl-12 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isSearching}
            />
            <SearchIcon className="absolute left-4 w-5 h-5 text-muted-foreground" />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-4 text-primary hover:text-primary/80 disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </form>
      </header>

      {/* Search Results */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <AnimatePresence mode="wait">
            {isSearching ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-center py-12"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-primary/30 rounded-full animate-spin border-t-primary" />
                    <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
                  </div>
                  <p className="text-muted-foreground">Searching...</p>
                </div>
              </motion.div>
            ) : (
              <SearchResults />
            )}
          </AnimatePresence>
          <div ref={resultsEndRef} />
        </div>
      </div>
    </div>
  );
}