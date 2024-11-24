'use client';

import { useState } from 'react';
import { Button } from '@nextui-org/react';
import { 
  Settings, 
  Layout, 
  MessageSquare, 
  Code,
  ChevronLeft,
  ChevronRight,
  Activity,
  MonitorIcon,
  BrainCircuit
} from 'lucide-react';
import type { ActivePanel } from '../../types';

interface SidebarProps {
  activePanel: ActivePanel;
  onPanelChange: (panel: ActivePanel) => void;
}

export function Sidebar({ activePanel, onPanelChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems: Array<{ id: ActivePanel; icon: any; label: string }> = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'canvas', icon: Layout, label: 'Canvas' },
    { id: 'documents', icon: Code, label: 'Documents' },
    { id: 'tools', icon: BrainCircuit, label: 'Tools' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div 
      className={`
        relative flex flex-col border-r border-border bg-background/95 backdrop-blur
        ${isCollapsed ? 'w-[60px]' : 'w-[240px]'}
        transition-all duration-300
      `}
    >
      <div className="flex flex-col space-y-2 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activePanel === item.id ? 'solid' : 'light'}
              className={`justify-start ${isCollapsed ? 'px-0' : ''} h-12`}
              onClick={() => onPanelChange(item.id)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="ml-2">{item.label}</span>}
            </Button>
          );
        })}
      </div>

      <Button
        isIconOnly
        variant="light"
        className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-border bg-background p-0"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
