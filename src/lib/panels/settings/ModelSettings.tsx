import React, { useState } from 'react';
import { Code } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { SettingsSection } from './SettingsSection';
import type { ModelParams } from '../../../types/index';

export function ModelSettings() {
  const { settings, updateSettings } = useSettings();
  const [modelParams, setModelParams] = useState<ModelParams>({
    temperature: settings.models.temperature || 0.7,
    maxTokens: settings.models.maxTokens || 2048,
    topP: settings.models.topP || 1,
    frequencyPenalty: settings.models.frequencyPenalty || 0,
    presencePenalty: settings.models.presencePenalty || 0
  });

  const handleParamChange = (_param: string, _value: number) => {
    setModelParams(_prev => ({ ..._prev, [_param]: _value }));
    updateSettings({
      models: {
        ...settings.models,
        [_param]: _value
      }
    });
  };

  const handleModelChange = (_model: string) => {
    updateSettings({
      models: {
        ...settings.models,
        defaultModel: _model
      }
    });
  };

  const modelConfigs = [
    {
      provider: 'OpenAI',
      models: [
        { id: 'chatgpt-4o-latest', name: 'GPT-4o Latest', context: '128K', description: 'Versatile flagship model with text/image input' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', context: '128K', description: 'Fast, affordable for focused tasks' },
        { id: 'o1', name: 'O1', context: '200K', description: 'Complex reasoning capabilities' },
        { id: 'o1-mini', name: 'O1 Mini', context: '128K', description: 'Fast reasoning for specialized tasks' },
        { id: 'o3-mini-2025-01-31', name: 'O3 Mini', context: '200K', description: 'Latest small reasoning model' },
        { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview', context: '128K', description: 'Creative thinking and conversation' },
        { id: 'gpt-4o-realtime-preview', name: 'GPT-4o Realtime', context: '128K', description: 'Real-time responses' }
      ]
    },
    {
      provider: 'Anthropic',
      models: [
        { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', context: '200K', description: 'Most intelligent Claude model' },
        { id: 'claude-3.5-sonnet-latest', name: 'Claude 3.5 Sonnet', context: '200K', description: '2nd most intelligent Claude model' },
        { id: 'claude-3.5-haiku-latest', name: 'Claude 3.5 Haiku', context: '200K', description: 'Fastest Claude 3.5 model' }
      ]
    },
    {
      provider: 'xAI',
      models: [
        { id: 'grok-3-beta', name: 'Grok 3', context: '131K', description: 'Most powerful Grok model' },
        { id: 'grok-3-fast-beta', name: 'Grok 3 Fast', context: '131K', description: 'Faster inference for time-critical tasks' },
        { id: 'grok-3-mini-beta', name: 'Grok 3 Mini', context: '131K', description: 'Cost-efficient model for standard tasks' },
        { id: 'grok-3-mini-fast-beta', name: 'Grok 3 Mini Fast', context: '131K', description: 'Fastest and most cost-efficient Grok model' }
      ]
    },
    {
      provider: 'Groq',
      models: [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', context: '128K', description: 'Versatile large language model' }
      ]
    },
    {
      provider: 'Perplexity',
      models: [
        { id: 'sonar-pro', name: 'Sonar Pro', context: '200K', description: 'Advanced reasoning with integrated search' },
        { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', context: '128K', description: 'Fast online search capabilities' }
      ]
    },
    {
      provider: 'Google',
      models: [
        { id: 'gemini-2.5-pro-exp-03-25', name: 'Gemini 2.5 Pro Exp', context: '1M', description: 'State-of-the-art reasoning for complex problems' },
        { id: 'gemini-2.0-pro-experimental', name: 'Gemini 2.0 Pro Exp', context: '2M', description: 'Best-in-class coding performance' },
        { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', context: '128K', description: 'Cost-efficient model for real-time interactions' }
      ]
    }
  ];

  const handleModelToggle = (_modelId: string) => {
    const enabledModels = settings.models.enabledModels.includes(_modelId)
      ? settings.models.enabledModels.filter(_m => _m !== _modelId)
      : [...settings.models.enabledModels, _modelId];
    updateSettings({ models: { ...settings.models, enabledModels } });
  };

  return (
    <SettingsSection>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-6 flex items-center">
            <Code className="w-5 h-5 mr-2" />
            Model Configuration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Default Model</label>
              <select
                value={settings.models.defaultModel}
                onChange={(_e) => handleModelChange(_e.target.value)}
                className="w-full bg-input rounded-lg px-3 py-2 text-foreground"
              >
                {modelConfigs.map(_provider => (
                  <optgroup key={_provider.provider} label={_provider.provider}>
                    {_provider.models.map(_model => (
                      <option key={_model.id} value={_model.id}>{_model.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-4">Model Parameters</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm mb-1">Temperature</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={modelParams.temperature}
                      onChange={(_e) => handleParamChange('temperature', parseFloat(_e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={modelParams.temperature}
                      onChange={(_e) => handleParamChange('temperature', parseFloat(_e.target.value))}
                      className="w-20 bg-input rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm mb-1">Max Tokens</label>
                  <input
                    type="number"
                    min="1"
                    max="200000"
                    value={modelParams.maxTokens}
                    onChange={(_e) => handleParamChange('maxTokens', parseInt(_e.target.value))}
                    className="w-full bg-input rounded px-3 py-1"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Top P</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={modelParams.topP}
                      onChange={(_e) => handleParamChange('topP', parseFloat(_e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={modelParams.topP}
                      onChange={(_e) => handleParamChange('topP', parseFloat(_e.target.value))}
                      className="w-20 bg-input rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1">Frequency Penalty</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.1"
                      value={modelParams.frequencyPenalty}
                      onChange={(_e) => handleParamChange('frequencyPenalty', parseFloat(_e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="-2"
                      max="2"
                      step="0.1"
                      value={modelParams.frequencyPenalty}
                      onChange={(_e) => handleParamChange('frequencyPenalty', parseFloat(_e.target.value))}
                      className="w-20 bg-input rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>

              <label className="block text-sm font-medium mb-2">Enabled Models</label>
              <div className="space-y-6">
                {modelConfigs.map(_provider => (
                  <div key={_provider.provider} className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">{_provider.provider}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {_provider.models.map(_model => (
                        <div key={_model.id} className="bg-card rounded-lg p-3">
                          <div className="flex items-start">
                            <input
                              type="checkbox"
                              checked={settings.models.enabledModels.includes(_model.id)}
                              onChange={() => handleModelToggle(_model.id)}
                              className="mt-1 rounded bg-input border-border text-primary focus:ring-primary"
                            />
                            <div className="ml-3">
                              <label className="font-medium block">{_model.name}</label>
                              <p className="text-sm text-muted-foreground">{_model.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">Context: {_model.context}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}