import React from 'react';
import { MessageSquare, Paintbrush, Brain, FileText, Settings, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

type ActivePanel = 
  | 'chat' 
  | 'canvas' 
  | 'documents' 
  | 'settings' 
  | 'search'
  | 'competitor-analysis';

interface SidebarProps {
  activePanel: ActivePanel;
  onPanelChange: (panel: ActivePanel) => void;
}

export function Sidebar({ activePanel, onPanelChange }: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  const navItems = [
    { id: 'chat' as const, icon: MessageSquare, label: 'Chat', primary: true },
    { id: 'canvas' as const, icon: Paintbrush, label: 'Canvas' },
    { id: 'documents' as const, icon: FileText, label: 'Documents' },
    { id: 'search' as const, icon: Search, label: 'Search' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
    { id: 'competitor-analysis' as const, icon: Brain, label: 'Analysis' }
  ];

  return (
    <div className={cn(
      "h-screen bg-background border-r border-border flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex-1 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onPanelChange(item.id)}
              className={cn(
                'w-full flex items-center space-x-3 px-3 py-2 text-sm transition-colors',
                activePanel === item.id
                  ? item.primary 
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>

      <div className={cn(
        "p-4 border-t border-border",
        collapsed && "p-2"
      )}>
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
          {!collapsed && <span className="text-sm text-muted-foreground">System Online</span>}
        </div>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-10 bg-background border border-border rounded-r flex items-center justify-center hover:bg-secondary transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
