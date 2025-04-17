import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, Check, XCircle, Loader } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { useConfigStore } from '../../../lib/config';
import { APIClient } from '../../../lib/api-client';
import { SaveButton } from '../../SaveButton';
import { Badge } from '../../ui/Badge';

export function APISettings() {
  const { settings, updateSettings } = useSettings();
  const updateApiKeys = useConfigStore(state => state.updateApiKeys);
  const [localSettings, setLocalSettings] = useState(settings.apiKeys || {});
  const [testStatus, setTestStatus] = useState<Record<string, { status: 'success' | 'error' | 'testing' | null, message: string }>>({});
  const [isTestingAll, setIsTestingAll] = useState(false);

  // Initialize with current API keys
  useEffect(() => {
    if (settings.apiKeys) {
      setLocalSettings(settings.apiKeys);
    }
  }, [settings.apiKeys]);

  const apiConfigs = [
    {
      key: 'openai',
      label: 'OpenAI API Key',
      placeholder: 'sk-...',
      docs: 'https://platform.openai.com/api-keys',
      models: ['GPT-4o', 'GPT-4o-mini', 'o1', 'o1-mini', 'o3-mini']
    },
    {
      key: 'groq',
      label: 'Groq API Key',
      placeholder: 'gsk_...',
      docs: 'https://console.groq.com/keys',
      models: ['LLaMA 3.3 70B']
    },
    {
      key: 'xai',
      label: 'X.AI (Grok) API Key',
      placeholder: 'xai-...',
      docs: 'https://platform.x.ai/docs',
      models: ['Grok-3', 'Grok-3-mini']
    },
    {
      key: 'perplexity',
      label: 'Perplexity API Key',
      placeholder: 'pplx-...',
      docs: 'https://docs.perplexity.ai/docs/getting-started',
      models: ['Sonar Pro', 'Sonar Reasoning Pro']
    },
    {
      key: 'anthropic',
      label: 'Anthropic API Key',
      placeholder: 'sk-ant-...',
      docs: 'https://console.anthropic.com/settings/keys',
      models: ['Claude 3.7 Sonnet', 'Claude 3.5 Sonnet', 'Claude 3.5 Haiku']
    },
    {
      key: 'google',
      label: 'Google AI API Key',
      placeholder: 'AIza...',
      docs: 'https://ai.google.dev/tutorials/setup',
      models: ['Gemini 2.5 Pro', 'Gemini 2.0 Flash Lite']
    }
  ];

  const isDirty = JSON.stringify(localSettings) !== JSON.stringify(settings.apiKeys);

  const handleSave = async () => {
    await updateSettings({
      ...settings,
      apiKeys: localSettings
    });
    updateApiKeys(localSettings);
  };

  const testConnection = async (key: string) => {
    setTestStatus(prev => ({
      ...prev,
      [key]: { status: 'testing', message: 'Testing connection...' }
    }));

    try {
      const apiClient = APIClient.getInstance();
      const result = await apiClient.testConnection(key);

      setTestStatus(prev => ({
        ...prev,
        [key]: { 
          status: result.success ? 'success' : 'error',
          message: result.message
        }
      }));
    } catch (error) {
      setTestStatus(prev => ({
        ...prev,
        [key]: { 
          status: 'error',
          message: error instanceof Error ? error.message : 'An unknown error occurred'
        }
      }));
    }
  };

  const testAllConnections = async () => {
    setIsTestingAll(true);
    
    const activeKeys = Object.entries(localSettings)
      .filter(([_, value]) => value && value.trim().length > 0)
      .map(([key]) => key);
      
    if (activeKeys.length === 0) {
      setIsTestingAll(false);
      return;
    }
    
    for (const key of activeKeys) {
      await testConnection(key);
      // Small delay between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsTestingAll(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">API Configuration</h3>
          <p className="text-sm text-muted-foreground">Configure API keys for AI models</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={testAllConnections}
            disabled={isTestingAll || !isDirty}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium disabled:opacity-50"
          >
            {isTestingAll ? (
              <>
                <Loader size={14} className="animate-spin mr-1.5" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Shield size={14} className="mr-1.5" />
                <span>Test All Keys</span>
              </>
            )}
          </button>
          <Shield className="w-5 h-5 text-primary" />
        </div>
      </div>

      <div className="grid gap-6">
        {apiConfigs.map(config => (
          <div key={config.key} className="bg-card/50 rounded-lg p-6 backdrop-blur-sm border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <label htmlFor={config.key} className="block font-medium text-base">
                  {config.label}
                </label>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <a
                    href={config.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Get API Key
                  </a>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex flex-wrap gap-1">
                    {config.models.map(model => (
                      <Badge key={model} variant="outline" className="text-xs bg-muted">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              {testStatus[config.key] && (
                <div className={`text-sm flex items-center gap-1 px-2 py-1 rounded ${
                  testStatus[config.key].status === 'success' 
                    ? 'text-success bg-success/10' 
                    : testStatus[config.key].status === 'error'
                    ? 'text-destructive bg-destructive/10'
                    : 'text-muted-foreground bg-muted/50'
                }`}>
                  {testStatus[config.key].status === 'success' && <Check className="w-3.5 h-3.5" />}
                  {testStatus[config.key].status === 'error' && <XCircle className="w-3.5 h-3.5" />}
                  {testStatus[config.key].status === 'testing' && <Loader className="w-3.5 h-3.5 animate-spin" />}
                  <span className="text-xs">{
                    testStatus[config.key].status === 'success' ? 'Connected' : 
                    testStatus[config.key].status === 'testing' ? 'Testing...' : 
                    'Failed'
                  }</span>
                </div>
              )}
            </div>
            
            <div className="relative flex items-center gap-2">
              <input
                id={config.key}
                type="password"
                autoComplete="off"
                value={localSettings[config.key] || ''}
                onChange={(e) => setLocalSettings(prev => ({ 
                  ...prev, 
                  [config.key]: e.target.value 
                }))}
                className="input text-base"
                placeholder={config.placeholder}
              />
              <button
                type="button"
                onClick={() => testConnection(config.key)}
                className={`flex-none px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                  testStatus[config.key]?.status === 'testing' ? 'bg-muted text-muted-foreground animate-pulse' :
                  testStatus[config.key]?.status === 'success' ? 'bg-success/20 text-success' :
                  testStatus[config.key]?.status === 'error' ? 'bg-destructive/20 text-destructive' :
                  'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
                disabled={testStatus[config.key]?.status === 'testing' || !localSettings[config.key]}
              >
                {testStatus[config.key]?.status === 'testing' ? 'Testing...' :
                 testStatus[config.key]?.status === 'success' ? 'Valid' :
                 testStatus[config.key]?.status === 'error' ? 'Invalid' : 
                 'Test Key'}
              </button>
            </div>
            
            {testStatus[config.key]?.status === 'error' && (
              <div className="mt-2 text-sm text-destructive flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{testStatus[config.key]?.message || 'Connection failed'}</span>
              </div>
            )}

            {!localSettings[config.key] && (
              <div className="mt-2 text-xs text-muted-foreground">
                Note: If you don't have a {config.label}, you can still use other providers
              </div>
            )}
          </div>
        ))}

        <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 -mx-6 mt-6 border-t border-border">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <p>You need at least one API key to use Agent One</p>
            </div>
            <SaveButton onSave={handleSave} isDirty={isDirty} />
          </div>
        </div>
      </div>
    </div>
  );
}