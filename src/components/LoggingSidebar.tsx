'use client';

import { useEffect, useState } from 'react';
import { Card } from "@nextui-org/react";
import { Terminal, X, Filter } from "lucide-react";
import { thoughtLogger } from '../lib/logging/thought-logger';

interface LogEntry {
  level: 'info' | 'debug' | 'success' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

interface LoggingSidebarProps {
  onClose: () => void;
}

export function LoggingSidebar({ onClose }: LoggingSidebarProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string[]>(['info', 'error', 'warn']);

  useEffect(() => {
    const subscription = thoughtLogger.subscribe((entry) => {
      setLogs(prev => [...prev, entry].slice(-100)); // Keep last 100 logs
    });

    return () => subscription.unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => filter.includes(log.level));

  return (
    <Card className="h-full border-l border-border bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <h2 className="font-semibold">System Logs</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLogs([])}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            aria-label="Clear logs"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
            aria-label="Close logs panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-2 h-[calc(100vh-4rem)] overflow-auto">
        {filteredLogs.map((log, index) => (
          <div key={index} className={`text-sm ${getLogColor(log.level)}`}>
            {`[${log.level.toUpperCase()}] ${log.message}`}
          </div>
        ))}
      </div>
    </Card>
  );
}

function getLogColor(level: string): string {
  switch (level) {
    case 'debug': return 'text-blue-500';
    case 'success': return 'text-green-500';
    case 'warn': return 'text-yellow-500';
    case 'error': return 'text-red-500';
    default: return 'text-muted-foreground';
  }
}
