import React, { useState } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { Toggle } from '../../Toggle';
import { SaveButton } from '../../SaveButton';

export function MemorySettings() {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings.memory);
  const isDirty = JSON.stringify(localSettings) !== JSON.stringify(settings.memory);

  const handleSave = async () => {
    await updateSettings('memory', localSettings);
  };

  const handleClearMemory = async () => {
    if (window.confirm('Are you sure you want to clear all memory? This cannot be undone.')) {
      // Clear memory implementation
      console.log('Memory cleared');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Memory & Storage Settings</h3>
        <SaveButton onSave={handleSave} isDirty={isDirty} />
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Vector Memory
            <span className="text-gray-400 ml-2">Long-term knowledge storage</span>
          </label>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm">Enable vector memory</span>
            <Toggle
              enabled={localSettings.vectorMemoryEnabled}
              onChange={(enabled) => setLocalSettings(prev => ({
                ...prev,
                vectorMemoryEnabled: enabled
              }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Memory Limit
            <span className="text-gray-400 ml-2">Maximum stored memories</span>
          </label>
          <select
            value={localSettings.memoryLimit}
            onChange={(e) => setLocalSettings(prev => ({
              ...prev,
              memoryLimit: parseInt(e.target.value)
            }))}
            className="w-full bg-gray-700 rounded px-3 py-2"
          >
            <option value={100}>100 memories</option>
            <option value={500}>500 memories</option>
            <option value={1000}>1,000 memories</option>
            <option value={5000}>5,000 memories</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Context Window
            <span className="text-gray-400 ml-2">Message history length</span>
          </label>
          <select
            value={localSettings.contextWindow}
            onChange={(e) => setLocalSettings(prev => ({
              ...prev,
              contextWindow: parseInt(e.target.value)
            }))}
            className="w-full bg-gray-700 rounded px-3 py-2"
          >
            <option value={5}>Last 5 messages</option>
            <option value={10}>Last 10 messages</option>
            <option value={20}>Last 20 messages</option>
            <option value={50}>Last 50 messages</option>
          </select>
        </div>

        <div className="pt-4">
          <button
            onClick={handleClearMemory}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear All Memory
          </button>
          <p className="text-sm text-gray-400 mt-2">
            This will permanently delete all stored memories and conversation history.
          </p>
        </div>
      </div>
    </div>
  );
}