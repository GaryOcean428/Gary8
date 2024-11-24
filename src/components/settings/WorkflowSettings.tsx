import React from 'react';
import { useStore } from '../../store';
import { Toggle } from '../ui/Toggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export function WorkflowSettings() {
  const { workflowSettings, setWorkflowSettings } = useStore(state => ({
    workflowSettings: state.workflowSettings,
    setWorkflowSettings: state.setWorkflowSettings
  }));

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
                  onCheckedChange={(checked: boolean) => {
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
                  onCheckedChange={(checked: boolean) => {
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
            <label id="parallel-tasks-label" className="block text-sm font-medium mb-2">
              Parallel Tasks
            </label>
            <Select
              value={workflowSettings.parallelTasks.toString()}
              onValueChange={(value) => setWorkflowSettings({
                ...workflowSettings,
                parallelTasks: parseInt(value)
              })}
              aria-labelledby="parallel-tasks-label"
            >
              <SelectTrigger className="w-full bg-secondary rounded-lg">
                <SelectValue placeholder="Select number of parallel tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Sequential (1 task)</SelectItem>
                <SelectItem value="2">Balanced (2 tasks)</SelectItem>
                <SelectItem value="4">Performance (4 tasks)</SelectItem>
                <SelectItem value="8">Maximum (8 tasks)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logging */}
          <div>
            <h4 className="text-sm font-medium mb-2">Logging</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Log Task Planning</span>
                <Toggle
                  checked={workflowSettings.logTaskPlanning}
                  onCheckedChange={(checked: boolean) => {
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
                  onCheckedChange={(checked: boolean) => {
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
