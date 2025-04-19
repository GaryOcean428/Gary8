import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { Toggle } from '../../Toggle';
import { SaveButton } from '../../SaveButton';

export function PerformanceSettings() {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings.performance);
  const isDirty = JSON.stringify(localSettings) !== JSON.stringify(settings.performance);

  const handleSave = async () => {
    await updateSettings({
      ...settings,
      performance: localSettings
    });
  };

  const handleMaxTokensChange = (_value: string) => {
    setLocalSettings(_prev => ({
      ..._prev,
      maxTokens: parseInt(_value)
    }));
  };

  const handleTemperatureChange = (_value: string) => {
    setLocalSettings(_prev => ({
      ..._prev,
      temperature: parseFloat(_value)
    }));
  };

  const handleStreamingToggle = (_enabled: boolean) => {
    setLocalSettings(_prev => ({
      ..._prev,
      streaming: _enabled
    }));
  };

  const tokenOptions = [
    { value: 1024, label: '1K tokens' },
    { value: 2048, label: '2K tokens' },
    { value: 4096, label: '4K tokens' },
    { value: 8192, label: '8K tokens' },
    { value: 16384, label: '16K tokens' },
    { value: 32768, label: '32K tokens' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Performance Settings</h3>
          <p className="text-sm text-gray-400">Configure model performance and behavior</p>
        </div>
        <Zap className="w-5 h-5 text-blue-400" />
      </div>

      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-2">Temperature</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={localSettings.temperature}
            onChange={(_e) => handleTemperatureChange(_e.target.value)}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-400">
            <span>More Focused</span>
            <span>{localSettings.temperature.toFixed(1)}</span>
            <span>More Creative</span>
          </div>
        </div>

        <div>
          <label className="block font-medium mb-2">Max Tokens</label>
          <select
            value={localSettings.maxTokens}
            onChange={(_e) => handleMaxTokensChange(_e.target.value)}
            className="w-full bg-gray-700 rounded-lg px-3 py-2"
          >
            {tokenOptions.map(_option => (
              <option key={_option.value} value={_option.value}>
                {_option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-400">
            Maximum number of tokens to generate in responses
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium">Enable Streaming</label>
            <p className="text-sm text-gray-400">Show responses as they are generated</p>
          </div>
          <Toggle
            enabled={localSettings.streaming}
            onChange={handleStreamingToggle}
          />
        </div>

        <div className="pt-4">
          <SaveButton onSave={handleSave} isDirty={isDirty} />
        </div>
      </div>
    </div>
  );
}