import React from 'react';
import { useStore } from '../../store';
import { Toggle } from '../ui/Toggle';

export function MemorySettings() {
  const { memorySettings, setMemorySettings } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Memory & Storage Settings</h3>

        <div className="space-y-6">
          {/* Vector Memory */}
          <div>
            <h4 className="text-sm font-medium mb-2">Vector Memory</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Enable Vector Memory</span>
                <Toggle
                  checked={memorySettings.vectorMemoryEnabled}
                  onCheckedChange={(checked) => {
                    setMemorySettings({
                      ...memorySettings,
                      vectorMemoryEnabled: checked
                    });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Context Window */}
          <div>
            <label className="block text-sm font-medium mb-2">Context Window</label>
            <select
              value={memorySettings.contextSize}
              onChange={(e) => setMemorySettings({
                ...memorySettings,
                contextSize: parseInt(e.target.value)
              })}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm"
            >
              <option value={2048}>2K tokens</option>
              <option value={4096}>4K tokens</option>
              <option value={8192}>8K tokens</option>
              <option value={16384}>16K tokens</option>
            </select>
          </div>

          {/* Memory Limit */}
          <div>
            <label className="block text-sm font-medium mb-2">Memory Limit</label>
            <select
              value={memorySettings.memoryLimit}
              onChange={(e) => setMemorySettings({
                ...memorySettings,
                memoryLimit: parseInt(e.target.value)
              })}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm"
            >
              <option value={100}>100 memories</option>
              <option value={500}>500 memories</option>
              <option value={1000}>1,000 memories</option>
              <option value={5000}>5,000 memories</option>
            </select>
          </div>

          {/* Clear Memory */}
          <div>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all memories? This cannot be undone.')) {
                  // Clear memory implementation
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Clear All Memories
            </button>
            <p className="text-sm text-foreground/60 mt-2">
              This will permanently delete all stored memories and conversation history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}