import React from 'react';
import { X, Settings as SettingsIcon, Zap, Database, Bell, Code, Workflow } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { APISettings } from './settings/APISettings';
import { PerformanceSettings } from './settings/PerformanceSettings';
import { MemorySettings } from './settings/MemorySettings';
import { ModelSettings } from './settings/ModelSettings';
import { NotificationSettings } from './settings/NotificationSettings';
import { WorkflowSettings } from './settings/WorkflowSettings';

type SettingsTab = 'api' | 'performance' | 'memory' | 'models' | 'notifications' | 'workflow';

export function SettingsPanel() {
  const { setSettingsPanelOpen } = useStore();
  const [activeTab, setActiveTab] = React.useState<SettingsTab>('api');

  const tabs = [
    { id: 'api' as const, label: 'API Configuration', icon: SettingsIcon },
    { id: 'performance' as const, label: 'Performance', icon: Zap },
    { id: 'memory' as const, label: 'Memory & Storage', icon: Database },
    { id: 'models' as const, label: 'Model Configuration', icon: Code },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'workflow' as const, label: 'Workflow', icon: Workflow }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'api':
        return <APISettings />;
      case 'performance':
        return <PerformanceSettings />;
      case 'memory':
        return <MemorySettings />;
      case 'models':
        return <ModelSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'workflow':
        return <WorkflowSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-background border-l border-border shadow-lg z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Settings</h2>
        <button
          onClick={() => setSettingsPanelOpen(false)}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-48 border-r border-border p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/60 hover:text-foreground hover:bg-secondary'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}