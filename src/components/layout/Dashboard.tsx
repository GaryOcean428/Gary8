'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AgentPanel } from '../panels/AgentPanel';
import { MonitorPanel } from '../panels/MonitorPanel';
import { SettingsPanel } from '../panels/SettingsPanel';
import { LoggingSidebar } from '../LoggingSidebar';
import { ChatPanel } from '../panels/ChatPanel';
import { CodePanel } from '../panels/CodePanel';

export function Dashboard({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = useState<string>('agents');
  const [isLoggingSidebarOpen, setIsLoggingSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activePanel={activePanel} onPanelChange={setActivePanel} />
      <div className="flex-1 flex flex-col">
        <Header onToggleLogger={() => setIsLoggingSidebarOpen(!isLoggingSidebarOpen)} />
        <main className="flex-1 overflow-auto p-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto max-w-7xl">
            {activePanel === 'agents' && <AgentPanel />}
            {activePanel === 'monitor' && <MonitorPanel />}
            {activePanel === 'settings' && <SettingsPanel />}
            {activePanel === 'chat' && <ChatPanel />}
            {activePanel === 'code' && <CodePanel />}
            {children}
          </div>
        </main>
      </div>
      {isLoggingSidebarOpen && (
        <LoggingSidebar onClose={() => setIsLoggingSidebarOpen(false)} />
      )}
    </div>
  );
} 