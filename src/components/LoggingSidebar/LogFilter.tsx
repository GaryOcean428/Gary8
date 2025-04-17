import React from 'react';
import { LogSource } from './types';

interface LogFilterProps {
  activeFilters: Set<LogSource>;
  onFilterChange: (filters: Set<LogSource>) => void;
}

export function LogFilter({ activeFilters, onFilterChange }: LogFilterProps) {
  const sources: LogSource[] = [
    'primary-agent',
    'specialist-agent',
    'task-agent',
    'tool-manager',
    'memory-system',
    'router'
  ];

  const toggleFilter = (source: LogSource) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(source)) {
      newFilters.delete(source);
    } else {
      newFilters.add(source);
    }
    onFilterChange(newFilters);
  };

  return (
    <div className="p-4 border-b border-gray-700">
      <div className="flex flex-wrap gap-2">
        {sources.map(source => (
          <button
            key={source}
            onClick={() => toggleFilter(source)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              activeFilters.has(source)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {source.replace('-', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}