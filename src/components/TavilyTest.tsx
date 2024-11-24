'use client';

import { useState } from 'react';
import { TavilyAPI } from '../lib/api/tavily-api';

export function TavilyTest() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    setResults('');

    try {
      const tavilyClient = TavilyAPI.getInstance();
      const response = await tavilyClient.search(query, {
        search_depth: 'basic',
        max_results: 3
      });

      setResults(JSON.stringify(response, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Tavily API Test</h2>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter search query"
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !query}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {results && (
        <pre className="p-4 bg-gray-100 rounded overflow-auto max-h-[500px]">
          {results}
        </pre>
      )}
    </div>
  );
} 