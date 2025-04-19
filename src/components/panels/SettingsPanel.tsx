import React from 'react';
import { Settings } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
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
    { id: 'performance', icon: Settings, title: 'Performance', component: PerformanceSettings },
    { id: 'memory', icon: Settings, title: 'Memory & Storage', component: MemorySettings },
    { id: 'models', icon: Settings, title: 'Model Configuration', component: ModelSettings },
    { id: 'workflow', icon: Settings, title: 'Workflow Settings', component: WorkflowSettings },
    { id: 'notifications', icon: Settings, title: 'Notifications', component: NotificationSettings }
  ];

  const ActiveComponent = sections.find(_s => _s.id === activeSection)?.component || APISettings;

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <Settings className="w-8 h-8 text-blue-400" />
          <h2 className="text-2xl font-bold">Settings</h2>
        </div>

        <div className="flex space-x-6">
          {/* Navigation */}
          <div className="w-64 space-y-2">
            {sections.map(_section => (
              <button
                key={_section.id}
                onClick={() => setActiveSection(_section.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                  activeSection === _section.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <_section.icon className="w-5 h-5" />
                <span>{_section.title}</span>
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