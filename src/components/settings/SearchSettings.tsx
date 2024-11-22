import React from 'react';
import { useStore } from '../../store';
import { Search, Zap, RotateCcw } from 'lucide-react';
import { Toggle } from '../ui/Toggle';

type ProviderId = 'perplexity' | 'tavily' | 'google' | 'serp';

interface ProviderConfig {
  id: ProviderId;
  name: string;
  description: string;
  configFields: Array<'apiKey' | 'model' | 'maxTokens' | 'searchDepth' | 'searchEngineId' | 'resultsPerPage'>;
}

export function SearchSettings() {
  const { searchConfig, setSearchConfig } = useStore();

  const providers: ProviderConfig[] = [
    {
      id: 'perplexity',
      name: 'Perplexity',
      description: 'Advanced semantic search with RAG capabilities',
      configFields: ['apiKey', 'model', 'maxTokens']
    },
    {
      id: 'tavily',
      name: 'Tavily',
      description: 'AI-powered web search',
      configFields: ['apiKey', 'searchDepth']
    },
    {
      id: 'google',
      name: 'Google Search',
      description: 'Traditional web search',
      configFields: ['apiKey', 'searchEngineId']
    },
    {
      id: 'serp',
      name: 'SERP API',
      description: 'Search engine results page data',
      configFields: ['apiKey', 'resultsPerPage']
    }
  ];

  const searchDepthOptions = [
    { value: 'basic', label: 'Basic' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const handleProviderConfigChange = (providerId: ProviderId, field: string, value: string | number) => {
    setSearchConfig({
      ...searchConfig,
      providers: {
        ...searchConfig.providers,
        [providerId]: {
          ...searchConfig.providers[providerId],
          [field]: value
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Search className="w-5 h-5" />
        <h3 className="text-lg font-medium">Search Configuration</h3>
      </div>

      {/* Provider Configuration */}
      <div className="space-y-6">
        {providers.map((provider) => (
          <div key={provider.id} className="p-4 bg-secondary/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{provider.name}</h4>
              <Toggle
                checked={searchConfig.enabledProviders.includes(provider.id)}
                onCheckedChange={(checked) => {
                  const newProviders = checked
                    ? [...searchConfig.enabledProviders, provider.id]
                    : searchConfig.enabledProviders.filter((p: ProviderId) => p !== provider.id);
                  setSearchConfig({
                    ...searchConfig,
                    enabledProviders: newProviders
                  });
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground mb-4">{provider.description}</p>

            <div className="space-y-3">
              {provider.configFields.map((field) => (
                <div key={field}>
                  {field === 'searchDepth' ? (
                    <div>
                      <label className="block text-sm font-medium mb-1">Search Depth</label>
                      <select
                        value={searchConfig.providers[provider.id].searchDepth || 'basic'}
                        onChange={(e) => handleProviderConfigChange(provider.id, field, e.target.value)}
                        className="w-full bg-background rounded-lg px-3 py-2 text-sm"
                      >
                        {searchDepthOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                      </label>
                      <input
                        type={field === 'apiKey' ? 'password' : 'text'}
                        value={searchConfig.providers[provider.id][field] || ''}
                        onChange={(e) => handleProviderConfigChange(
                          provider.id,
                          field,
                          field === 'maxTokens' || field === 'resultsPerPage'
                            ? parseInt(e.target.value)
                            : e.target.value
                        )}
                        placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                        className="w-full bg-background rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* RAG Configuration */}
      <div className="p-4 bg-secondary/50 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4" />
          <h4 className="font-medium">RAG Processing</h4>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Similarity Threshold</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={searchConfig.rag.similarityThreshold}
              onChange={(e) => setSearchConfig({
                ...searchConfig,
                rag: {
                  ...searchConfig.rag,
                  similarityThreshold: parseFloat(e.target.value)
                }
              })}
              className="w-full bg-background rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Max Results</label>
            <input
              type="number"
              min="1"
              value={searchConfig.rag.maxResults}
              onChange={(e) => setSearchConfig({
                ...searchConfig,
                rag: {
                  ...searchConfig.rag,
                  maxResults: parseInt(e.target.value)
                }
              })}
              className="w-full bg-background rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Fallback Strategy */}
      <div className="p-4 bg-secondary/50 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <RotateCcw className="w-4 h-4" />
          <h4 className="font-medium">Fallback Strategy</h4>
        </div>

        <div>
          <select
            value={searchConfig.fallbackStrategy}
            onChange={(e) => setSearchConfig({
              ...searchConfig,
              fallbackStrategy: e.target.value as 'sequential' | 'parallel'
            })}
            className="w-full bg-background rounded-lg px-3 py-2 text-sm"
          >
            <option value="sequential">Sequential</option>
            <option value="parallel">Parallel</option>
          </select>
          <p className="text-sm text-muted-foreground mt-2">
            Sequential: Try providers one by one until successful
            <br />
            Parallel: Query all providers simultaneously
          </p>
        </div>
      </div>
    </div>
  );
}
