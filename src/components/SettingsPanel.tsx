import React from 'react';
import { X, Settings as SettingsIcon, Zap, Database, Bell, Code, Workflow, Github, Search, Palette } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { APISettings } from './settings/APISettings';
import { PerformanceSettings } from './settings/PerformanceSettings';
import { MemorySettings } from './settings/MemorySettings';
import { ModelSettings } from './settings/ModelSettings';
import { NotificationSettings } from './settings/NotificationSettings';
import { WorkflowSettings } from './settings/WorkflowSettings';
import { GitHubSettings } from './settings/GitHubSettings';
import { FirebaseSettings } from './settings/FirebaseSettings';
import { SearchSettings } from './settings/SearchSettings';
import { ThemeSettings } from './settings/ThemeSettings';

type SettingsTab = 
  | 'api' 
  | 'performance' 
  | 'memory' 
  | 'models' 
  | 'notifications' 
  | 'workflow'
  | 'github'
  | 'firebase'
  | 'search'
  | 'theme';

export function SettingsPanel() {
  const { setSettingsPanelOpen } = useStore();
  const [activeTab, setActiveTab] = React.useState<SettingsTab>('api');

  const tabs = [
    { id: 'theme' as const, label: 'Theme', icon: Palette },
    { id: 'api' as const, label: 'API Configuration', icon: SettingsIcon },
    { id: 'models' as const, label: 'Model Configuration', icon: Code },
    { id: 'github' as const, label: 'GitHub Integration', icon: Github },
    { id: 'firebase' as const, label: 'Firebase Config', icon: Database },
    { id: 'search' as const, label: 'Search Integration', icon: Search },
    { id: 'performance' as const, label: 'Performance', icon: Zap },
    { id: 'memory' as const, label: 'Memory & Storage', icon: Database },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'workflow' as const, label: 'Workflow', icon: Workflow }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'theme':
        return <ThemeSettings />;
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
      case 'github':
        return <GitHubSettings />;
      case 'firebase':
        return <FirebaseSettings />;
      case 'search':
        return <SearchSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[800px] bg-background border-l border-border shadow-lg z-50 flex flex-col">
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
        <div className="w-56 border-r border-border p-2">
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
        <div className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
