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

  // Updated model configs based on the allowed models document
  const modelConfigs = [
    {
      provider: 'Anthropic',
      tier: 'Mixed',
      models: [
        {
          id: 'claude-3-7-sonnet-20250219',
          name: 'Claude 3.7 Sonnet',
          context: '200K',
          description: 'Most intelligent model, text/image input/Coding/Agentic/tools',
          tier: 'Pro/Premium'
        },
        {
          id: 'claude-3.5-sonnet-latest',
          name: 'Claude 3.5 Sonnet',
          context: '200K',
          description: 'Former most intelligent model',
          tier: 'Pro'
        },
        {
          id: 'claude-3.5-haiku-latest',
          name: 'Claude 3.5 Haiku',
          context: '200K',
          description: 'Fastest Claude 3.5 model',
          tier: 'Free'
        }
      ]
    },
    {
      provider: 'OpenAI',
      tier: 'Mixed',
      models: [
        {
          id: 'chatgpt-4o-latest',
          name: 'GPT-4o Latest',
          context: '128K',
          description: 'Versatile flagship model with text/image input',
          tier: 'Pro'
        },
        {
          id: 'gpt-4o-mini',
          name: 'GPT-4o Mini',
          context: '128K',
          description: 'Fast, affordable for focused tasks',
          tier: 'Free'
        },
        {
          id: 'o1',
          name: 'O1',
          context: '200K',
          description: 'Complex reasoning capabilities',
          tier: 'Premium'
        },
        {
          id: 'o1-mini',
          name: 'O1 Mini',
          context: '128K',
          description: 'Fast reasoning for specialized tasks',
          tier: 'Free'
        },
        {
          id: 'o3-mini-2025-01-31',
          name: 'O3 Mini',
          context: '200K',
          description: 'Small reasoning model for STEM tasks',
          tier: 'Pro'
        },
        {
          id: 'gpt-4.5-preview',
          name: 'GPT-4.5 Preview',
          context: '128K',
          description: 'Creative, open-ended thinking and conversation',
          tier: 'Pro'
        },
        {
          id: 'gpt-4o-realtime-preview',
          name: 'GPT-4o Realtime',
          context: '128K',
          description: 'Real-time audio/text responses',
          tier: 'Pro'
        }
      ]
    },
    {
      provider: 'xAI',
      tier: 'Mixed',
      models: [
        {
          id: 'grok-3-latest',
          name: 'Grok 3',
          context: '131K',
          description: 'Enterprise use cases, coding, summarization (standard speed)',
          tier: 'Premium'
        },
        {
          id: 'grok-3-fast-latest',
          name: 'Grok 3 Fast',
          context: '131K',
          description: 'Enterprise use cases, coding, summarization (faster speed)',
          tier: 'Premium'
        },
        {
          id: 'grok-3-mini-latest',
          name: 'Grok 3 Mini',
          context: '131K',
          description: 'Fast, smart, logic-based tasks (standard speed)',
          tier: 'Pro'
        },
        {
          id: 'grok-3-mini-fast-latest',
          name: 'Grok 3 Mini Fast',
          context: '131K',
          description: 'Fast, smart, logic-based tasks (faster speed)',
          tier: 'Pro'
        }
      ]
    },
    {
      provider: 'Google',
      tier: 'Mixed',
      models: [
        {
          id: 'gemini-2.5-pro-exp-03-25',
          name: 'Gemini 2.5 Pro Exp',
          context: '1M',
          description: 'State-of-the-art thinking model',
          tier: 'Pro/Premium'
        },
        {
          id: 'gemini-2.0-pro-experimental',
          name: 'Gemini 2.0 Pro Exp',
          context: '2M',
          description: 'Best-in-class coding performance',
          tier: 'Pro/Premium'
        },
        {
          id: 'gemini-2.0-flash-thinking-exp',
          name: 'Gemini 2.0 Flash Thinking',
          context: '1M',
          description: 'Advanced reasoning capabilities',
          tier: 'Pro'
        },
        {
          id: 'gemini-2.0-flash-lite',
          name: 'Gemini 2.0 Flash Lite',
          context: '128K',
          description: 'Cost-efficient model for real-time interactions',
          tier: 'Free'
        }
      ]
    },
    {
      provider: 'Groq',
      tier: 'Mixed',
      models: [
        {
          id: 'llama-3.3-70b-versatile',
          name: 'Llama 3.3 70B',
          context: '128K',
          description: 'Versatile large language model',
          tier: 'Free'
        },
        {
          id: 'llama3-groq-70b-8192-tool-use-preview',
          name: 'Llama 3 Tool Use 70B',
          context: '8K',
          description: 'Specialized for function calling and tool use',
          tier: 'Pro'
        },
        {
          id: 'llama3-8b-8192',
          name: 'Llama 3 8B',
          context: '8K',
          description: 'Fast, efficient smaller model',
          tier: 'Free'
        },
        {
          id: 'llama-3.2-90b-vision-preview',
          name: 'Llama 3.2 90B Vision',
          context: '8K',
          description: 'Large vision model for handling images',
          tier: 'Premium'
        }
      ]
    },
    {
      provider: 'Perplexity',
      tier: 'Pro',
      models: [
        {
          id: 'sonar-pro',
          name: 'Sonar Pro',
          context: '200K',
          description: 'Advanced reasoning with integrated search',
          tier: 'Pro'
        },
        {
          id: 'sonar-reasoning-pro',
          name: 'Sonar Reasoning Pro',
          context: '128K',
          description: 'Fast online search capabilities',
          tier: 'Pro'
        }
      ]
    }
  ];

  // Function to determine badge color based on tier
  const getTierBadgeClass = (_tier: string): string => {
    switch(_tier) {
      case 'Free': return 'bg-success/10 text-success border border-success/20';
      case 'Pro': return 'bg-secondary/10 text-secondary border border-secondary/20';
      case 'Premium': return 'bg-primary/10 text-primary border border-primary/20';
      default: return 'bg-accent/10 text-accent border border-accent/20';
    }
  };

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
          
          <div className="space-y-6">
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

              <label className="block text-sm font-medium mb-2">Models by Tier</label>
              <div className="space-y-6">
                {['Free', 'Pro', 'Premium'].map(_tier => (
                  <div key={_tier} className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center space-x-2">
                      <span>{_tier} Tier Models</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${getTierBadgeClass(_tier)}`}>
                        {_tier === 'Free' ? 'All Users' : _tier === 'Pro' ? 'Pro & Premium Plans' : 'Premium Plan Only'}
                      </span>
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {modelConfigs.flatMap(_provider => 
                        _provider.models
                          .filter(_model => _model.tier.includes(_tier))
                          .map(_model => (
                            <div key={_model.id} className="card p-3 hover:card-elevated transition-all">
                              <div className="flex items-start">
                                <input
                                  type="checkbox"
                                  id={`model-${_model.id}`}
                                  checked={settings.models.enabledModels.includes(_model.id)}
                                  onChange={() => handleModelToggle(_model.id)}
                                  className="mt-1 rounded bg-input border-border text-primary focus:ring-primary"
                                />
                                <div className="ml-3 flex-1">
                                  <label htmlFor={`model-${_model.id}`} className="font-medium block cursor-pointer">{_model.name}</label>
                                  <p className="text-sm text-muted-foreground">{_model.description}</p>
                                  <div className="mt-1 flex gap-2 items-center">
                                    <span className="text-xs text-muted-foreground">Provider: {_provider.provider}</span>
                                    <span className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">
                                      Context: {_model.context}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
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