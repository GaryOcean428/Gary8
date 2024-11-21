import React from 'react';
import { useStore } from '../../store';
import { Toggle } from '../ui/Toggle';

export function WorkflowSettings() {
  const { workflowSettings, setWorkflowSettings } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Workflow Settings</h3>

        <div className="space-y-6">
          {/* Agent Collaboration */}
          <div>
            <h4 className="text-sm font-medium mb-2">Agent Collaboration</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Enable Multi-Agent Collaboration</span>
                <Toggle
                  checked={workflowSettings.collaborationEnabled}
                  onCheckedChange={(checked) => {
                    setWorkflowSettings({
                      ...workflowSettings,
                      collaborationEnabled: checked
                    });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Task Planning */}
          <div>
            <h4 className="text-sm font-medium mb-2">Task Planning</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Enable Automatic Task Planning</span>
                <Toggle
                  checked={workflowSettings.taskPlanningEnabled}
                  onCheckedChange={(checked) => {
                    setWorkflowSettings({
                      ...workflowSettings,
                      taskPlanningEnabled: checked
                    });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Parallel Processing */}
          <div>
            <label className="block text-sm font-medium mb-2">Parallel Tasks</label>
            <select
              value={workflowSettings.parallelTasks}
              onChange={(e) => setWorkflowSettings({
                ...workflowSettings,
                parallelTasks: parseInt(e.target.value)
              })}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm"
            >
              <option value={1}>Sequential (1 task)</option>
              <option value={2}>Balanced (2 tasks)</option>
              <option value={4}>Performance (4 tasks)</option>
              <option value={8}>Maximum (8 tasks)</option>
            </select>
          </div>

          {/* Logging */}
          <div>
            <h4 className="text-sm font-medium mb-2">Logging</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Log Task Planning</span>
                <Toggle
                  checked={workflowSettings.logTaskPlanning}
                  onCheckedChange={(checked) => {
                    setWorkflowSettings({
                      ...workflowSettings,
                      logTaskPlanning: checked
                    });
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Log Agent Communication</span>
                <Toggle
                  checked={workflowSettings.logAgentComm}
                  onCheckedChange={(checked) => {
                    setWorkflowSettings({
                      ...workflowSettings,
                      logAgentComm: checked
                    });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}