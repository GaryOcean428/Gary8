import React from 'react';
import { Settings, Zap, Database, Bell, Code, Workflow } from 'lucide-react';
import { APISettings } from './settings/APISettings';
import { PerformanceSettings } from './settings/PerformanceSettings';
import { MemorySettings } from './settings/MemorySettings';
import { NotificationSettings } from './settings/NotificationSettings';
import { ModelSettings } from './settings/ModelSettings';
import { WorkflowSettings } from './settings/WorkflowSettings';

export function SettingsPanel() {
  const [activeSection, setActiveSection] = React.useState<string>('api');

  const sections = [
    { id: 'api', icon: Settings, title: 'API Configuration', component: APISettings },
    { id: 'performance', icon: Zap, title: 'Performance', component: PerformanceSettings },
    { id: 'memory', icon: Database, title: 'Memory & Storage', component: MemorySettings },
    { id: 'models', icon: Code, title: 'Model Configuration', component: ModelSettings },
    { id: 'workflow', icon: Workflow, title: 'Workflow Settings', component: WorkflowSettings },
    { id: 'notifications', icon: Bell, title: 'Notifications', component: NotificationSettings }
  ];

  const ActiveComponent = sections.find(s => s.id === activeSection)?.component || APISettings;

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <Settings className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold">Settings</h2>
        </div>

        <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
          {/* Navigation */}
          <div className="w-64 space-y-2">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <section.icon className="w-5 h-5" />
                <span>{section. title}</span>
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