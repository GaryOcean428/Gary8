import React from 'react';

export function NotificationSettings() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-medium">Notification Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure how and when you receive notifications from the application.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">General Notifications</h4>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="enableNotifications" className="text-sm font-medium">
                  Enable notifications
                </label>
                <p className="text-xs text-muted-foreground">
                  Receive system notifications for important events
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="checkbox" 
                  id="enableNotifications" 
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="notificationSound" className="text-sm font-medium">
                  Notification sounds
                </label>
                <p className="text-xs text-muted-foreground">
                  Play sound when notifications are received
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="checkbox" 
                  id="notificationSound" 
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">Task Notifications</h4>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="taskCompletion" className="text-sm font-medium">
                  Task completion
                </label>
                <p className="text-xs text-muted-foreground">
                  Notify when a task is completed
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="checkbox" 
                  id="taskCompletion" 
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="taskError" className="text-sm font-medium">
                  Task errors
                </label>
                <p className="text-xs text-muted-foreground">
                  Notify when a task encounters an error
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="checkbox" 
                  id="taskError" 
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">System Notifications</h4>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="systemUpdates" className="text-sm font-medium">
                  System updates
                </label>
                <p className="text-xs text-muted-foreground">
                  Notify when system updates are available
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="checkbox" 
                  id="systemUpdates" 
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="maintenanceNotices" className="text-sm font-medium">
                  Maintenance notices
                </label>
                <p className="text-xs text-muted-foreground">
                  Notify about scheduled maintenance
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="checkbox" 
                  id="maintenanceNotices" 
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">Do Not Disturb</h4>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="dndMode" className="text-sm font-medium">
                  Enable Do Not Disturb
                </label>
                <p className="text-xs text-muted-foreground">
                  Temporarily silence all notifications
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="checkbox" 
                  id="dndMode" 
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="grow">
                <label htmlFor="dndSchedule" className="text-sm font-medium block mb-1">
                  Schedule Do Not Disturb
                </label>
                <div className="flex space-x-2">
                  <input 
                    type="time" 
                    id="dndStart"
                    className="rounded border border-input bg-background px-3 py-1 text-sm"
                    defaultValue="22:00"
                  />
                  <span className="text-sm self-center">to</span>
                  <input 
                    type="time" 
                    id="dndEnd"
                    className="rounded border border-input bg-background px-3 py-1 text-sm"
                    defaultValue="08:00"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}