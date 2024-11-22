import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoggingSidebarProps {
  onClose: () => void;
}

export function LoggingSidebar({ onClose }: LoggingSidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [logs, setLogs] = React.useState<string[]>([]);

  // Mock function to add logs - replace with actual log handling
  React.useEffect(() => {
    const handleLog = (message: string) => {
      setLogs(prev => [...prev, message]);
    };
    // Add event listener for logs here
    return () => {
      // Clean up event listener
    };
  }, []);

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
              logs.map((log, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  {log}
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
            <div className="w-1 h-1 rounded-full bg-green-400" title="Info logs" />
            <div className="w-1 h-1 rounded-full bg-yellow-400" title="Warning logs" />
            <div className="w-1 h-1 rounded-full bg-red-400" title="Error logs" />
          </div>
        </div>
      )}
    </div>
  );
}
