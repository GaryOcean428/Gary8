import React from 'react';
import { useStore } from '../../store';
import { config } from '../../config';
import { Toggle } from '../ui/Toggle';

export function ModelSettings() {
  const { modelSettings, setModelSettings } = useStore();

  const models = {
    xai: Object.entries(config.services.xai.models),
    groq: Object.entries(config.services.groq.models),
    perplexity: [['default', config.services.perplexity.defaultModel]]
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Model Configuration</h3>
        
        <div className="space-y-6">
          {/* X.AI Models */}
          <div>
            <h4 className="text-sm font-medium mb-2">X.AI Models</h4>
            <div className="space-y-2">
              {models.xai.map(([key, model]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">{model}</span>
                  <Toggle
                    checked={modelSettings.enabledModels.includes(model)}
                    onCheckedChange={(checked) => {
                      setModelSettings({
                        ...modelSettings,
                        enabledModels: checked
                          ? [...modelSettings.enabledModels, model]
                          : modelSettings.enabledModels.filter(m => m !== model)
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Groq Models */}
          <div>
            <h4 className="text-sm font-medium mb-2">Groq Models</h4>
            <div className="space-y-2">
              {models.groq.map(([key, model]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">{model}</span>
                  <Toggle
                    checked={modelSettings.enabledModels.includes(model)}
                    onCheckedChange={(checked) => {
                      setModelSettings({
                        ...modelSettings,
                        enabledModels: checked
                          ? [...modelSettings.enabledModels, model]
                          : modelSettings.enabledModels.filter(m => m !== model)
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Perplexity Models */}
          <div>
            <h4 className="text-sm font-medium mb-2">Perplexity Models</h4>
            <div className="space-y-2">
              {models.perplexity.map(([key, model]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">{model}</span>
                  <Toggle
                    checked={modelSettings.enabledModels.includes(model)}
                    onCheckedChange={(checked) => {
                      setModelSettings({
                        ...modelSettings,
                        enabledModels: checked
                          ? [...modelSettings.enabledModels, model]
                          : modelSettings.enabledModels.filter(m => m !== model)
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Default Model Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Default Model</label>
            <select
              value={modelSettings.defaultModel}
              onChange={(e) => setModelSettings({
                ...modelSettings,
                defaultModel: e.target.value
              })}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm"
            >
              {modelSettings.enabledModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}