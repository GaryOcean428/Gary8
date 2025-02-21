import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { SaveButton } from '../../SaveButton';
import { Tooltip } from '../../ui/Tooltip';

export function APISettings() {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings.apiKeys || {});
  const [errors, setErrors] = useState({});
  const isDirty = JSON.stringify(localSettings) !== JSON.stringify(settings.apiKeys);

  const validateApiKey = (key, value) => {
    if (!value) {
      return 'API key is required';
    }
    if (value.length < 20) {
      return 'API key must be at least 20 characters long';
    }
    return '';
  };

  const handleSave = async () => {
    const newErrors = {};
    Object.keys(localSettings).forEach(key => {
      const error = validateApiKey(key, localSettings[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await updateSettings({
      ...settings,
      apiKeys: localSettings
    });
  };

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
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
          <label className="block font-medium mb-2">
            Groq API Key
            <Tooltip content="Required for Llama models" />
          </label>
          <input
            type="password"
            value={localSettings.groq || ''}
            onChange={(e) => handleChange('groq', e.target.value)}
            className="w-full bg-gray-700 rounded-lg px-3 py-2"
            placeholder="Enter Groq API key"
          />
          {errors.groq && <p className="text-red-500 text-sm">{errors.groq}</p>}
        </div>

        <div>
          <label className="block font-medium mb-2">
            Perplexity API Key
            <Tooltip content="Required for Sonar models" />
          </label>
          <input
            type="password"
            value={localSettings.perplexity || ''}
            onChange={(e) => handleChange('perplexity', e.target.value)}
            className="w-full bg-gray-700 rounded-lg px-3 py-2"
            placeholder="Enter Perplexity API key"
          />
          {errors.perplexity && <p className="text-red-500 text-sm">{errors.perplexity}</p>}
        </div>

        <div>
          <label className="block font-medium mb-2">
            X.AI API Key
            <Tooltip content="Required for Grok models" />
          </label>
          <input
            type="password"
            value={localSettings.xai || ''}
            onChange={(e) => handleChange('xai', e.target.value)}
            className="w-full bg-gray-700 rounded-lg px-3 py-2"
            placeholder="Enter X.AI API key"
          />
          {errors.xai && <p className="text-red-500 text-sm">{errors.xai}</p>}
        </div>

        <div>
          <label className="block font-medium mb-2">
            GitHub API Key
            <Tooltip content="Required for GitHub integration" />
          </label>
          <input
            type="password"
            value={localSettings.github || ''}
            onChange={(e) => handleChange('github', e.target.value)}
            className="w-full bg-gray-700 rounded-lg px-3 py-2"
            placeholder="Enter GitHub API key"
          />
          {errors.github && <p className="text-red-500 text-sm">{errors.github}</p>}
        </div>

        <div className="pt-4">
          <SaveButton onSave={handleSave} isDirty={isDirty} />
        </div>
      </div>
    </div>
  );
}
