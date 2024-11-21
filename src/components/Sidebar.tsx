import React from 'react';
import { MessageSquare, Paintbrush, Brain, Wrench, FileText, Settings, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';

export function Sidebar() {
  const { activeView, setActiveView } = useStore();

  const navItems = [
    { id: 'chat', icon: MessageSquare, label: 'Chat', primary: true },
    { id: 'canvas', icon: Paintbrush, label: 'Canvas' },
    { id: 'agent', icon: Brain, label: 'Agent' },
    { id: 'tools', icon: Wrench, label: 'Tools' },
    { id: 'documents', icon: FileText, label: 'Documents' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ] as const;

  return (
    <div className="w-64 bg-background border-r border-border flex flex-col">
      <div className="flex-1 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                'w-full flex items-center space-x-3 px-3 py-2 text-sm transition-colors',
                activeView === item.id
                  ? item.primary 
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-sm text-muted-foreground">System Online</span>
        </div>
      </div>
    </div>
  );
}