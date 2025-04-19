import React from 'react';
import { LogSource } from './types';

interface LogFilterProps {
  readonly activeFilters: Set<LogSource>;
  readonly onFilterChange: (filters: Set<LogSource>) => void;
}

export function LogFilter({ activeFilters, onFilterChange }: Readonly<LogFilterProps>) { // Mark props as read-only
  const sources: LogSource[] = [
    'primary-agent',
    'specialist-agent',
    'task-agent',
    'tool-manager',
    'memory-system',
    'router'
  ];

  const toggleFilter = (_source: LogSource) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(_source)) {
      newFilters.delete(_source);
    } else {
      newFilters.add(_source);
    }
    onFilterChange(newFilters);
  };

  return (
    <div className="p-4 border-b border-gray-700">
      <div className="flex flex-wrap gap-2">
        {sources.map(_source => (
          <button
            key={_source}
            onClick={() => toggleFilter(_source)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              activeFilters.has(_source)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {_source.replace('-', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}
