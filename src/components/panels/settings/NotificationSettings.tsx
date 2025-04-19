import React, { useState } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { Toggle } from '../../Toggle';
import { SaveButton } from '../../SaveButton';

export function NotificationSettings() {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings.notifications);
  const isDirty = JSON.stringify(localSettings) !== JSON.stringify(settings.notifications);

  const handleSave = async () => {
    await updateSettings('notifications', localSettings);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notification Settings</h3>
        <SaveButton onSave={handleSave} isDirty={isDirty} />
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            System Notifications
            <span className="text-gray-400 ml-2">Status and error alerts</span>
          </label>
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Show error notifications</span>
              <Toggle
                enabled={localSettings.showErrors}
                onChange={(_enabled) => setLocalSettings(_prev => ({
                  ..._prev,
                  showErrors: _enabled
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Show success notifications</span>
              <Toggle
                enabled={localSettings.showSuccess}
                onChange={(_enabled) => setLocalSettings(_prev => ({
                  ..._prev,
                  showSuccess: _enabled
                }))}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Agent Status Updates
            <span className="text-gray-400 ml-2">Agent activity notifications</span>
          </label>
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Show agent assignments</span>
              <Toggle
                enabled={localSettings.showAgentAssignments}
                onChange={(_enabled) => setLocalSettings(_prev => ({
                  ..._prev,
                  showAgentAssignments: _enabled
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Show task completion</span>
              <Toggle
                enabled={localSettings.showTaskCompletion}
                onChange={(_enabled) => setLocalSettings(_prev => ({
                  ..._prev,
                  showTaskCompletion: _enabled
                }))}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Sound Effects
            <span className="text-gray-400 ml-2">Notification sounds</span>
          </label>
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Enable sound effects</span>
              <Toggle
                enabled={localSettings.soundEnabled}
                onChange={(_enabled) => setLocalSettings(_prev => ({
                  ..._prev,
                  soundEnabled: _enabled
                }))}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Volume</label>
              <input
                type="range"
                min="0"
                max="100"
                value={localSettings.volume}
                onChange={(_e) => setLocalSettings(_prev => ({
                  ..._prev,
                  volume: parseInt(_e.target.value)
                }))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}