import React from 'react';

export function PerformanceSettings() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-medium">Performance Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure application performance settings to optimize your experience.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">Response Generation</h4>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="streaming" className="text-sm font-medium">
                  Enable streaming responses
                </label>
                <p className="text-xs text-muted-foreground">
                  Receive AI responses in real-time as they're generated
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="checkbox" 
                  id="streaming" 
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="concurrentRequests" className="text-sm font-medium">
                  Concurrent requests
                </label>
                <p className="text-xs text-muted-foreground">
                  Maximum number of concurrent API requests
                </p>
              </div>
              <div className="shrink-0">
                <select 
                  id="concurrentRequests" 
                  className="rounded border border-input bg-background px-3 py-1 text-sm"
                  defaultValue="3"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">UI Performance</h4>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="animations" className="text-sm font-medium">
                  UI Animations
                </label>
                <p className="text-xs text-muted-foreground">
                  Enable/disable UI animations for improved performance
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="checkbox" 
                  id="animations" 
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="virtualization" className="text-sm font-medium">
                  Message virtualization
                </label>
                <p className="text-xs text-muted-foreground">
                  Only render visible messages for improved performance
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="checkbox" 
                  id="virtualization" 
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">Data Management</h4>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="cachingEnabled" className="text-sm font-medium">
                  Response caching
                </label>
                <p className="text-xs text-muted-foreground">
                  Cache responses to reduce API calls and improve performance
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="checkbox" 
                  id="cachingEnabled" 
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="cacheExpiration" className="text-sm font-medium">
                  Cache expiration (hours)
                </label>
                <p className="text-xs text-muted-foreground">
                  Time until cached responses expire
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="number" 
                  id="cacheExpiration" 
                  className="w-16 rounded border border-input bg-background px-3 py-1 text-sm"
                  min="1" 
                  max="72" 
                  defaultValue="24"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}