import React from 'react';
import { useStore } from '../../store';
import { Toggle } from '../ui/Toggle';

export function NotificationSettings() {
  const { notificationSettings, setNotificationSettings } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Notification Settings</h3>

        <div className="space-y-6">
          {/* System Notifications */}
          <div>
            <h4 className="text-sm font-medium mb-2">System Notifications</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Show Error Notifications</span>
                <Toggle
                  checked={notificationSettings.showErrors}
                  onCheckedChange={(checked) => {
                    setNotificationSettings({
                      ...notificationSettings,
                      showErrors: checked
                    });
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Show Success Notifications</span>
                <Toggle
                  checked={notificationSettings.showSuccess}
                  onCheckedChange={(checked) => {
                    setNotificationSettings({
                      ...notificationSettings,
                      showSuccess: checked
                    });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Agent Status Updates */}
          <div>
            <h4 className="text-sm font-medium mb-2">Agent Status Updates</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Show Agent Assignments</span>
                <Toggle
                  checked={notificationSettings.showAgentAssignments}
                  onCheckedChange={(checked) => {
                    setNotificationSettings({
                      ...notificationSettings,
                      showAgentAssignments: checked
                    });
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Show Task Completion</span>
                <Toggle
                  checked={notificationSettings.showTaskCompletion}
                  onCheckedChange={(checked) => {
                    setNotificationSettings({
                      ...notificationSettings,
                      showTaskCompletion: checked
                    });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sound Settings */}
          <div>
            <h4 className="text-sm font-medium mb-2">Sound Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Enable Sound Effects</span>
                <Toggle
                  checked={notificationSettings.soundEnabled}
                  onCheckedChange={(checked) => {
                    setNotificationSettings({
                      ...notificationSettings,
                      soundEnabled: checked
                    });
                  }}
                />
              </div>
              {notificationSettings.soundEnabled && (
                <div>
                  <label className="block text-sm mb-2">Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={notificationSettings.volume}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      volume: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-foreground/60 mt-1">
                    <span>0%</span>
                    <span>{notificationSettings.volume}%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}