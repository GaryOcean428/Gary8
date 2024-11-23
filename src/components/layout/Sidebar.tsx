'use client';

import { useState } from 'react';
import { Button } from '@nextui-org/react';
import { 
  Settings, 
  Layout, 
  MessageSquare, 
  Code,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`
      relative flex flex-col border-r border-border bg-background
      ${isCollapsed ? 'w-[50px]' : 'w-[250px]'}
      transition-all duration-300
    `}>
      <div className="flex flex-col space-y-2 p-4">
        <Button
          variant="light"
          className={`justify-start ${isCollapsed ? 'px-0' : ''}`}
          startContent={!isCollapsed && <Layout className="h-4 w-4" />}
        >
          {!isCollapsed && 'Canvas'}
        </Button>
        <Button
          variant="light"
          className={`justify-start ${isCollapsed ? 'px-0' : ''}`}
          startContent={!isCollapsed && <MessageSquare className="h-4 w-4" />}
        >
          {!isCollapsed && 'Chat'}
        </Button>
        <Button
          variant="light"
          className={`justify-start ${isCollapsed ? 'px-0' : ''}`}
          startContent={!isCollapsed && <Code className="h-4 w-4" />}
        >
          {!isCollapsed && 'Code'}
        </Button>
        <Button
          variant="light"
          className={`justify-start ${isCollapsed ? 'px-0' : ''}`}
          startContent={!isCollapsed && <Settings className="h-4 w-4" />}
        >
          {!isCollapsed && 'Settings'}
        </Button>
      </div>
      <Button
        isIconOnly
        variant="light"
        className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-border bg-background"
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