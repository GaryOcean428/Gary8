import React from 'react';
import { Settings } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { APISettings } from './APISettings';
import { PerformanceSettings } from './PerformanceSettings';
import { MemorySettings } from './MemorySettings';
import { NotificationSettings } from './NotificationSettings';
import { ModelSettings } from './ModelSettings';
import { WorkflowSettings } from './WorkflowSettings';

export function SettingsPanel() {
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
            <Settings className="w-8 h-8 text-blue-400" />
            <h2 className="text-2xl font-bold">Settings</h2>
          </div>
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-300"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
          {/* Navigation */}
          <div className={`lg:w-64 space-y-2 ${isMobileNavOpen ? 'block' : 'hidden lg:block'}`}>
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setIsMobileNavOpen( section.id);
                  setIsMobileNavOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800'
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