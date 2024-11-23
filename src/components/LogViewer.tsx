'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Chip } from '@nextui-org/react';
import { Download, Filter, Search } from 'lucide-react';

interface Log {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  agent: string;
  message: string;
  details?: any;
}

export function LogViewer() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button
            startContent={<Filter className="w-4 h-4" />}
            variant="light"
          >
            Filter
          </Button>
          <Button
            startContent={<Search className="w-4 h-4" />}
            variant="light"
          >
            Search
          </Button>
        </div>
        <Button
          startContent={<Download className="w-4 h-4" />}
          color="primary"
        >
          Export Logs
        </Button>
      </div>

      <div className="space-y-2">
        {logs.map((log, index) => (
          <div 
            key={index}
            className="flex items-start gap-2 p-2 hover:bg-gray-100 rounded"
          >
            <Chip
              size="sm"
              color={
                log.level === 'error' ? 'danger' :
                log.level === 'warn' ? 'warning' : 'success'
              }
            >
              {log.level.toUpperCase()}
            </Chip>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="text-sm font-medium">{log.agent}</span>
                <span className="text-xs text-gray-500">{log.timestamp}</span>
              </div>
              <p className="text-sm mt-1">{log.message}</p>
              {log.details && (
                <pre className="text-xs bg-gray-100 p-2 mt-2 rounded">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
} 