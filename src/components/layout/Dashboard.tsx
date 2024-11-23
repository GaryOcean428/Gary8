'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AgentPanel } from '../panels/AgentPanel';
import { MonitorPanel } from '../panels/MonitorPanel';
import { SettingsPanel } from '../panels/SettingsPanel';

export function Dashboard({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = useState<string>('agents');

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activePanel={activePanel} onPanelChange={setActivePanel} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {activePanel === 'agents' && <AgentPanel />}
          {activePanel === 'monitor' && <MonitorPanel />}
          {activePanel === 'settings' && <SettingsPanel />}
          {children}
        </main>
      </div>
    </div>
  );
} 