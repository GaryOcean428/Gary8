import React, { useState, useEffect } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { Toggle } from '../../Toggle';
import { SaveButton } from '../../SaveButton';
import { Info } from 'lucide-react';

interface WorkflowState {
  [key: string]: any;
}

const defaultSettings: WorkflowState = {
  collaborationEnabled: false,
  taskPlanningEnabled: false,
  parallelTasks: 1,
  logTaskPlanning: false,
  logAgentComm: false,
  logAgentState: false,
  logMemoryOps: false
};

export function WorkflowSettings() {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<WorkflowState>(defaultSettings);
  const isDirty = JSON.stringify(localSettings) !== JSON.stringify(settings.workflow);

  // Load initial settings from context
  useEffect(() => {
    if (settings.workflow) {
      setLocalSettings({
        ...defaultSettings,
        ...settings.workflow
      });
    }
  }, [settings.workflow]);

  const handleSave = async () => {
    await updateSettings({
      ...settings,
      workflow: localSettings
    });
  };

  const handleParallelTasksChange = (value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      parallelTasks: value
    }));
  };

  const updateSetting = (prev: WorkflowState) => {
    // ... rest of the code
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Workflow Settings</h3>
        <SaveButton onSave={handleSave} isDirty={isDirty} />
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Multi-Agent Collaboration
            <span className="text-gray-400 ml-2">Agent cooperation for complex tasks</span>
          </label>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm">Enable agent collaboration</span>
            <Toggle
              enabled={localSettings.collaborationEnabled}
              onChange={(enabled) => updateSetting(prev => ({
                ...prev,
                collaborationEnabled: enabled
              }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Task Planning
            <span className="text-gray-400 ml-2">Automatic task decomposition</span>
          </label>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm">Enable task planning</span>
            <Toggle
              enabled={localSettings.taskPlanningEnabled}
              onChange={(enabled) => updateSetting(prev => ({
                ...prev,
                taskPlanningEnabled: enabled
              }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Parallel Processing
            <span className="text-gray-400 ml-2">Concurrent task execution</span>
          </label>
          <div className="relative">
            <select
              value={localSettings.parallelTasks}
              onChange={(e) => handleParallelTasksChange(parseInt(e.target.value))}
              className="w-full bg-gray-700 rounded px-3 py-2"
            >
              <option value={1}>Sequential (1 task)</option>
              <option value={2}>Balanced (2 tasks)</option>
              <option value={4}>Performance (4 tasks)</option>
              <option value={8}>Maximum (8 tasks)</option>
            </select>
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              title="Parallel tasks allow multiple agents to work simultaneously on different aspects of a complex task. Higher values increase processing speed but require more system resources."
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Current parallel tasks: {localSettings.parallelTasks}
            <br />
            <span className="text-xs">
              Higher values allow more agents to work simultaneously, improving speed but using more resources.
            </span>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Workflow Logging
            <span className="text-gray-400 ml-2">Task execution monitoring</span>
          </label>
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Log task planning</span>
              <Toggle
                enabled={localSettings.logTaskPlanning}
                onChange={(enabled) => updateSetting(prev => ({
                  ...prev,
                  logTaskPlanning: enabled
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Log agent communication</span>
              <Toggle
                enabled={localSettings.logAgentComm}
                onChange={(enabled) => updateSetting(prev => ({
                  ...prev,
                  logAgentComm: enabled
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Log agent state changes</span>
              <Toggle
                enabled={localSettings.logAgentState}
                onChange={(enabled) => updateSetting(prev => ({
                  ...prev,
                  logAgentState: enabled
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Log memory operations</span>
              <Toggle
                enabled={localSettings.logMemoryOps}
                onChange={(enabled) => updateSetting(prev => ({
                  ...prev,
                  logMemoryOps: enabled
                }))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
