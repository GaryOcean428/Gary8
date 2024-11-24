import React from 'react';
import { Code } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { SettingsSection } from './SettingsSection';

export function ModelSettings() {
  const { settings, updateSettings } = useSettings();

  const handleModelChange = (model: string) => {
    updateSettings({
      models: {
        ...settings.models,
        defaultModel: model
      }
    });
  };

  const handleModelToggle = (model: string) => {
    const enabledModels = settings.models.enabledModels.includes(model)
      ? settings.models.enabledModels.filter(m => m !== model)
      : [...settings.models.enabledModels, model];

    updateSettings({
      models: {
        ...settings.models,
        enabledModels
      }
    });
  };

  return (
    <SettingsSection>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Code className="w-5 h-5 mr-2" />
            Model Configuration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Default Model</label>
              <select
                value={settings.models.defaultModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-3 py-2 text-gray-100"
              >
                <option value="grok-beta">Grok Beta</option>
                <option value="llama-3.2-70b-preview">Llama 70B</option>
                <option value="llama-3.2-7b-preview">Llama 7B</option>
                <option value="granite3-dense-2b">Granite Dense 2B</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Enabled Models</label>
              <div className="space-y-2">
                {['grok-beta', 'llama-3.2-70b-preview', 'llama-3.2-7b-preview', 'granite3-dense-2b'].map(model => (
                  <label key={model} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.models.enabledModels.includes(model)}
                      onChange={() => handleModelToggle(model)}
                      className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{model}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}