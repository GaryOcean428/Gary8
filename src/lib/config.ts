import { create } from 'zustand';

interface ConfigStore {
  apiKeys: Record<string, string>;
  updateApiKeys: (keys: Record<string, string>) => void;
}

export const useConfigStore = create<ConfigStore>((_set) => ({
  apiKeys: {
    groq: import.meta.env.VITE_GROQ_API_KEY || '',
    perplexity: import.meta.env.VITE_PERPLEXITY_API_KEY || '',
    google: import.meta.env.VITE_GOOGLE_API_KEY || '',
    xai: import.meta.env.VITE_XAI_API_KEY || '',
    anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    openai: import.meta.env.VITE_OPENAI_API_KEY || '',
    github: import.meta.env.VITE_GITHUB_TOKEN || ''
  },
  updateApiKeys: (_keys) => _set({ apiKeys: _keys })
}));

export const getApiKeys = () => {
  const store = useConfigStore.getState();
  return store.apiKeys;
};

export const config = {
  services: {
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      models: {
        latest: 'chatgpt-4o-latest',
        mini: 'gpt-4o-mini',
        o1: 'o1',
        o1mini: 'o1-mini',
        o3mini: 'o3-mini-2025-01-31'
      },
      maxTokens: 128000,
      temperature: 0.7
    },
    groq: {
      baseUrl: 'https://api.groq.com/openai/v1',
      models: {
        versatile: 'llama3-3.7b-versatile',
        toolUse: 'llama3-groq-70b-8192-tool-use-pre'
      },
      maxTokens: 32768,
      temperature: 0.7
    },
    perplexity: {
      baseUrl: 'https://api.perplexity.ai',
      models: {
        pro: 'sonar-pro',
        reasoningPro: 'sonar-reasoning-pro'
      },
      maxTokens: 8192,
      temperature: 0.7
    },
    xai: {
      baseUrl: 'https://api.x.ai/v1',
      models: {
        latest: 'grok-2-latest',
        vision: 'grok-2-vision-1212',
        beta: 'grok-vision-beta'
      },
      maxTokens: 131072,
      temperature: 0.7
    },
    anthropic: {
      baseUrl: 'https://api.anthropic.com/v1',
      models: {
        sonnet: 'claude-3.5-sonnet-latest',
        haiku: 'claude-3.5-haiku-latest'
      },
      maxTokens: 200000,
      temperature: 0.7
    }
  }
} as const;