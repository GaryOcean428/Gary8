import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, ExternalLink } from 'lucide-react';
import { useSearch } from '../context/SearchContext';
import SearchResults from './SearchResults';
import ReactMarkdown from 'react-markdown';

export default function SearchInterface() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const resultsEndRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (results.length > 0) {
      resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [results]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Search Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask me anything..."
              className="w-full bg-gray-900 text-gray-100 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSearching}
            />
            <Search className="absolute left-4 w-5 h-5 text-gray-400" />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-4 text-blue-500 hover:text-blue-400 disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </form>
      </header>

      {/* Search Results */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <SearchResults />
          <div ref={resultsEndRef} />
        </div>
      </div>
    </div>
  );
}