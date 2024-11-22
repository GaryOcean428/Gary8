import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { thoughtLogger, Thought } from '../lib/logging/thought-logger';
import { useSettings } from '../context/SettingsContext';

interface LoggingSidebarProps {
  onClose: () => void;
}

interface LogEntry {
  message: string;
  timestamp: Date;
  level: string;
  // Add other properties as needed
}

export function LoggingSidebar({ onClose }: LoggingSidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [logs, setLogs] = React.useState<Thought[]>([]);
  const { settings } = useSettings();

  // Subscribe to thought logger
  React.useEffect(() => {
    // Get initial logs
    const initialLogs = thoughtLogger.getThoughts({
      since: Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
    });
    setLogs(initialLogs);

    // Subscribe to new logs
    const unsubscribe = thoughtLogger.subscribe((thoughts) => {
      // Filter logs based on settings
      const filteredThoughts = thoughts.filter(thought => {
        if (!settings.workflow) return true;
        
        // Apply workflow logging settings
        if (thought.data?.type === 'task-planning' && !settings.workflow.logTaskPlanning) return false;
        if (thought.data?.type === 'agent-communication' && !settings.workflow.logAgentComm) return false;
        if (thought.data?.type === 'agent-state' && !settings.workflow.logAgentState) return false;
        if (thought.data?.type === 'memory-operation' && !settings.workflow.logMemoryOps) return false;
        
        return true;
      });
      
      setLogs(filteredThoughts);
    });

    return () => {
      unsubscribe();
    };
  }, [settings.workflow]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'success':
        return 'text-green-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatLog = (log: LogEntry) => {
    // ... rest of the code
  };

  return (
    <div className={cn(
      "fixed right-0 top-0 h-screen bg-background border-l border-border transition-all duration-300",
      collapsed ? "w-6" : "w-[400px]"
    )}>
      {!collapsed && (
        <>
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">System Logs</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              aria-label="Close logs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-2 overflow-auto h-[calc(100vh-64px)]">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="text-sm">
                  <span className="text-muted-foreground">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span className={cn("ml-2", getLogColor(log.type))}>
                    [{log.type.toUpperCase()}]
                  </span>
                  <span className="ml-2">{log.message}</span>
                  {log.data && (
                    <pre className="mt-1 text-xs bg-secondary/50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                No logs to display
              </div>
            )}
          </div>
        </>
      )}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-10 bg-background border border-border rounded-l flex items-center justify-center hover:bg-secondary transition-colors"
        aria-label={collapsed ? "Expand logs" : "Collapse logs"}
      >
        {collapsed ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {/* Log level indicators when collapsed */}
      {collapsed && (
        <div className="absolute inset-y-0 right-0 w-1.5 flex flex-col gap-1 p-1">
          <div className="flex-1 flex flex-col justify-evenly">
            <div className="w-1 h-1 rounded-full bg-green-400" title="Success logs" />
            <div className="w-1 h-1 rounded-full bg-blue-400" title="Info logs" />
            <div className="w-1 h-1 rounded-full bg-yellow-400" title="Warning logs" />
            <div className="w-1 h-1 rounded-full bg-red-400" title="Error logs" />
          </div>
        </div>
      )}
    </div>
  );
}
