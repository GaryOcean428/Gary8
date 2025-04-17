import React from 'react';

export function MemorySettings() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-medium">Memory & Storage</h3>
        <p className="text-sm text-muted-foreground">
          Configure how the application manages memory and local storage.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">Chat History</h4>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="storeHistory" className="text-sm font-medium">
                  Store chat history
                </label>
                <p className="text-xs text-muted-foreground">
                  Save your conversations for future reference
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="checkbox" 
                  id="storeHistory" 
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="historyLimit" className="text-sm font-medium">
                  Max conversations
                </label>
                <p className="text-xs text-muted-foreground">
                  Maximum number of conversations to keep
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="number" 
                  id="historyLimit" 
                  className="w-16 rounded border border-input bg-background px-3 py-1 text-sm"
                  min="5" 
                  max="100" 
                  defaultValue="50"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">Local Storage</h4>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="storageLimit" className="text-sm font-medium">
                  Storage limit (MB)
                </label>
                <p className="text-xs text-muted-foreground">
                  Maximum storage space to use for cached data
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="number" 
                  id="storageLimit" 
                  className="w-16 rounded border border-input bg-background px-3 py-1 text-sm"
                  min="10" 
                  max="500" 
                  defaultValue="100"
                />
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="autoCleanup" className="text-sm font-medium">
                  Auto cleanup
                </label>
                <p className="text-xs text-muted-foreground">
                  Automatically clean up old data when approaching limit
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="checkbox" 
                  id="autoCleanup" 
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90">
            Clear All Data
          </button>
          <p className="text-xs text-muted-foreground mt-2">
            This will delete all locally stored data including chat history and settings
          </p>
        </div>
      </div>
    </div>
  );
}