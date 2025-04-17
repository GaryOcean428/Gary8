import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { LogEntry } from './types';

interface LogGroupProps {
  logs: LogEntry[];
}

export function LogGroup({ logs }: LogGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getLogLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'debug': return 'text-purple-400';
      default: return 'text-blue-400';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-gray-700"
      >
        <div className="flex items-center space-x-2">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="font-medium">{logs[0].source}</span>
          <span className="text-sm text-gray-400">
            {formatTimestamp(logs[0].timestamp)}
          </span>
        </div>
        <span className="text-sm text-gray-400">{logs.length} entries</span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="pl-6 border-l-2 border-gray-700">
              <div className="flex items-start space-x-2">
                <span className={`text-sm ${getLogLevelColor(log.level)}`}>
                  [{log.level}]
                </span>
                <span className="text-sm">{log.message}</span>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(log.timestamp)}
                </span>
              </div>
              {log.metadata && (
                <pre className="mt-1 text-xs text-gray-400 overflow-x-auto">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}