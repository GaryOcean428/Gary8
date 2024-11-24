import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { SaveButton } from '../../SaveButton';

export function APISettings() {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings.apiKeys || {});
  const isDirty = JSON.stringify(localSettings) !== JSON.stringify(settings.apiKeys);

  const handleSave = async () => {
    await updateSettings({
      ...settings,
      apiKeys: localSettings
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">API Configuration</h3>
          <p className="text-sm text-gray-400">Configure API keys for various services</p>
        </div>
        <Shield className="w-5 h-5 text-blue-400" />
      </div>

      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-2">Groq API Key</label>
          <input
            type="password"
            value={localSettings.groq || ''}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, groq: e.target.value }))}
            className="w-full bg-gray-700 rounded-lg px-3 py-2"
            placeholder="Enter Groq API key"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Perplexity API Key</label>
          <input
            type="password"
            value={localSettings.perplexity || ''}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, perplexity: e.target.value }))}
            className="w-full bg-gray-700 rounded-lg px-3 py-2"
            placeholder="Enter Perplexity API key"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">X.AI API Key</label>
          <input
            type="password"
            value={localSettings.xai || ''}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, xai: e.target.value }))}
            className="w-full bg-gray-700 rounded-lg px-3 py-2"
            placeholder="Enter X.AI API key"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">GitHub API Key</label>
          <input
            type="password"
            value={localSettings.github || ''}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, github: e.target.value }))}
            className="w-full bg-gray-700 rounded-lg px-3 py-2"
            placeholder="Enter GitHub API key"
          />
        </div>

        <div className="pt-4">
          <SaveButton onSave={handleSave} isDirty={isDirty} />
        </div>
      </div>
    </div>
  );
}