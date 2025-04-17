import React from 'react';
import { Settings, Zap } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { APISettings } from './APISettings';
import { PerformanceSettings } from './PerformanceSettings';
import { MemorySettings } from './MemorySettings';
import { NotificationSettings } from './NotificationSettings';
import { ModelSettings } from './ModelSettings';
import { WorkflowSettings } from './WorkflowSettings';
import { ApiStatusDisplay } from '../../ApiStatusDisplay';

interface SettingsPanelProps {
  onToggleOptimizedUI?: (enabled: boolean) => void;
  optimizedUI?: boolean;
}

export function SettingsPanel({ onToggleOptimizedUI, optimizedUI }: SettingsPanelProps) {
  const [activeSection, setActiveSection] = React.useState<string>('api');
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);

  const sections = [
    { id: 'api', icon: Settings, title: 'API Configuration', component: APISettings },
    { id: 'performance', icon: Settings, title: 'Performance', component: PerformanceSettings },
    { id: 'memory', icon: Settings, title: 'Memory & Storage', component: MemorySettings },
    { id: 'models', icon: Settings, title: 'Model Configuration', component: ModelSettings },
    { id: 'workflow', icon: Settings, title: 'Workflow Settings', component: WorkflowSettings },
    { id: 'notifications', icon: Settings, title: 'Notifications', component: NotificationSettings }
  ];

  const ActiveComponent = sections.find(s => s.id === activeSection)?.component || APISettings;

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Settings className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-bold">Settings</h2>
          </div>
          
          <button
            onClick={() => onToggleOptimizedUI?.(!optimizedUI)}
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
              optimizedUI 
                ? 'bg-success/20 text-success border border-success/20' 
                : 'bg-muted text-muted-foreground border border-border'
            }`}
          >
            <Zap className={`w-4 h-4 mr-1.5 ${optimizedUI ? 'animate-pulse' : ''}`} />
            {optimizedUI ? 'Using Optimized UI' : 'Standard UI'}
          </button>
          
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>

        {/* API Status Card */}
        {activeSection === 'api' && (
          <ApiStatusDisplay />
        )}

        <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
          {/* Navigation */}
          <div className={`lg:w-64 space-y-2 ${isMobileNavOpen ? 'block' : 'hidden lg:block'}`}>
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setIsMobileNavOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <section.icon className="w-5 h-5" />
                <span>{section.title}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </div>
  );
}