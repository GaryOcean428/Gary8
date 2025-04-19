import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, Check, XCircle, Loader, Server, ToggleLeft, ToggleRight } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useConfigStore } from '../../../lib/config';
import { APIClient } from '../../../lib/api-client';
import { SaveButton } from '../../../shared/components/SaveButton';
import { Badge } from '../../../shared/components/ui/Badge';

export function APISettings() {
  const { settings, updateSettings } = useSettings();
  const updateApiKeys = useConfigStore(_state => _state.updateApiKeys);
  const [localSettings, setLocalSettings] = useState(settings.apiKeys || {});
  const [testStatus, setTestStatus] = useState<Record<string, { status: 'success' | 'error' | 'testing' | null, message: string }>>({});
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [useEdgeFunctions, setUseEdgeFunctions] = useState<boolean>(true);
  const apiClient = APIClient.getInstance();

  // Initialize with current API keys
  useEffect(() => {
    if (settings.apiKeys) {
      setLocalSettings(settings.apiKeys);
    }
    
    // Initialize the useEdgeFunctions state from settings
    setUseEdgeFunctions(settings.useEdgeFunctions !== false);
    apiClient.setUseEdgeFunctions(settings.useEdgeFunctions !== false);
  }, [settings.apiKeys, settings.useEdgeFunctions]);

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

  const isDirty = JSON.stringify(localSettings) !== JSON.stringify(settings.apiKeys) || 
                 useEdgeFunctions !== (settings.useEdgeFunctions !== false);

  const handleSave = async () => {
    await updateSettings({
      ...settings,
      apiKeys: localSettings,
      useEdgeFunctions
    });
    updateApiKeys(localSettings);
    apiClient.setUseEdgeFunctions(useEdgeFunctions);
  };

  const testConnection = async (_key: string) => {
    setTestStatus(_prev => ({
      ..._prev,
      [_key]: { status: 'testing', message: 'Testing connection...' }
    }));

    try {
      const result = await apiClient.testConnection(_key);

      setTestStatus(_prev => ({
        ..._prev,
        [_key]: { 
          status: result.success ? 'success' : 'error',
          message: result.message
        }
      }));
    } catch (error) {
      setTestStatus(_prev => ({
        ..._prev,
        [_key]: { 
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
      await new Promise(_resolve => setTimeout(_resolve, 500));
    }
    
    setIsTestingAll(false);
  };

  const toggleEdgeFunctions = () => {
    setUseEdgeFunctions(!useEdgeFunctions);
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
      
      <div className="bg-card/50 rounded-lg p-6 backdrop-blur-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-medium flex items-center">
              <Server className="w-4 h-4 mr-2 text-primary" />
              Edge Functions
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Use Supabase Edge Functions to securely access API keys without exposing them to the client
            </p>
          </div>
          <button
            onClick={toggleEdgeFunctions}
            className="flex items-center gap-2 text-primary"
            aria-pressed={useEdgeFunctions}
          >
            {useEdgeFunctions ? (
              <>
                <ToggleRight className="w-6 h-6" />
                <span className="text-sm font-medium">Enabled</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-6 h-6" />
                <span className="text-sm font-medium">Disabled</span>
              </>
            )}
          </button>
        </div>
        
        {useEdgeFunctions && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-2">
            <p className="text-sm">
              Edge Functions are enabled. API keys stored in Supabase will be used for requests.
              You can still configure local API keys below as a fallback.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {apiConfigs.map(_config => (
          <div key={_config.key} className="bg-card/50 rounded-lg p-6 backdrop-blur-sm border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <label htmlFor={_config.key} className="block font-medium text-base">
                  {_config.label}
                </label>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <a
                    href={_config.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Get API Key
                  </a>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex flex-wrap gap-1">
                    {_config.models.map(_model => (
                      <Badge key={_model} variant="outline" className="text-xs bg-muted">
                        {_model}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              {testStatus[_config.key] && (
                <div className={`text-sm flex items-center gap-1 px-2 py-1 rounded ${
                  testStatus[_config.key].status === 'success' 
                    ? 'text-success bg-success/10' 
                    : testStatus[_config.key].status === 'error'
                    ? 'text-destructive bg-destructive/10'
                    : 'text-muted-foreground bg-muted/50'
                }`}>
                  {testStatus[_config.key].status === 'success' && <Check className="w-3.5 h-3.5" />}
                  {testStatus[_config.key].status === 'error' && <XCircle className="w-3.5 h-3.5" />}
                  {testStatus[_config.key].status === 'testing' && <Loader className="w-3.5 h-3.5 animate-spin" />}
                  <span className="text-xs">{
                    testStatus[_config.key].status === 'success' ? 'Connected' : 
                    testStatus[_config.key].status === 'testing' ? 'Testing...' : 
                    'Failed'
                  }</span>
                </div>
              )}
            </div>
            
            <div className="relative flex items-center gap-2">
              <input
                id={_config.key}
                type="password"
                autoComplete="off"
                value={localSettings[_config.key] || ''}
                onChange={(_e) => setLocalSettings(_prev => ({ 
                  ..._prev, 
                  [_config.key]: _e.target.value 
                }))}
                className="input text-base"
                placeholder={_config.placeholder}
              />
              <button
                type="button"
                onClick={() => testConnection(_config.key)}
                className={`flex-none px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                  testStatus[_config.key]?.status === 'testing' ? 'bg-muted text-muted-foreground animate-pulse' :
                  testStatus[_config.key]?.status === 'success' ? 'bg-success/20 text-success' :
                  testStatus[_config.key]?.status === 'error' ? 'bg-destructive/20 text-destructive' :
                  'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
                disabled={testStatus[_config.key]?.status === 'testing' || !localSettings[_config.key]}
              >
                {testStatus[_config.key]?.status === 'testing' ? 'Testing...' :
                 testStatus[_config.key]?.status === 'success' ? 'Valid' :
                 testStatus[_config.key]?.status === 'error' ? 'Invalid' : 
                 'Test Key'}
              </button>
            </div>
            
            {testStatus[_config.key]?.status === 'error' && (
              <div className="mt-2 text-sm text-destructive flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{testStatus[_config.key]?.message || 'Connection failed'}</span>
              </div>
            )}

            {!localSettings[_config.key] && useEdgeFunctions && (
              <div className="mt-2 text-xs text-primary">
                Note: If you don't configure a local {_config.label}, requests will use the API key from Edge Functions
              </div>
            )}
            
            {!localSettings[_config.key] && !useEdgeFunctions && (
              <div className="mt-2 text-xs text-muted-foreground">
                Note: If you don't have a {_config.label}, you can still use other providers
              </div>
            )}
          </div>
        ))}

        <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 -mx-6 mt-6 border-t border-border">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <p>You need at least one API key or Edge Functions enabled to use Agent One</p>
            </div>
            <SaveButton onSave={handleSave} isDirty={isDirty} />
          </div>
        </div>
      </div>
    </div>
  );
}