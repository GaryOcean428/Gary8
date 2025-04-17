import { create } from 'zustand';
import { perplexityModels } from './perplexity-models';

interface ConfigStore {
  apiKeys: Record<string, string>;
  useEdgeFunctions: boolean;
  fallbackToDirectApi: boolean;
  updateApiKeys: (keys: Record<string, string>) => void;
  setApiKey: (provider: string, key: string) => void;
  setEdgeFunctions: (enabled: boolean) => void;
  setFallbackToDirectApi: (enabled: boolean) => void;
}

// Helper to safely get environment variables with fallbacks
const getEnvVar = (key: string, fallback: string = ''): string => {
  const value = import.meta.env[key];
  return value !== undefined ? String(value) : fallback;
};

export const useConfigStore = create<ConfigStore>((set) => ({
  apiKeys: {
    groq: getEnvVar('VITE_GROQ_API_KEY'),
    perplexity: getEnvVar('VITE_PERPLEXITY_API_KEY'),
    anthropic: getEnvVar('VITE_ANTHROPIC_API_KEY'),
    openai: getEnvVar('VITE_OPENAI_API_KEY'),
    xai: getEnvVar('VITE_XAI_API_KEY'),
    google: getEnvVar('VITE_GOOGLE_API_KEY'),
    serp: getEnvVar('VITE_SERP_API_KEY'),
    bing: getEnvVar('VITE_BING_SEARCH_API_KEY'),
    together: getEnvVar('VITE_TOGETHER_API_KEY'),
    tavily: getEnvVar('VITE_TAVILY_API_KEY')
  },
  useEdgeFunctions: false, // Disabled Edge Functions to use direct API calls
  fallbackToDirectApi: true, // Ensure direct API fallback is enabled
  updateApiKeys: (keys) => set((state) => ({
    apiKeys: { ...state.apiKeys, ...keys }
  })),
  setApiKey: (provider, key) => set((state) => ({
    apiKeys: { ...state.apiKeys, [provider]: key }
  })),
  setEdgeFunctions: (enabled) => set(() => ({
    useEdgeFunctions: enabled
  })),
  setFallbackToDirectApi: (enabled) => set(() => ({
    fallbackToDirectApi: enabled
  }))
}));

export const config = {
  services: {
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      models: {
        latest: 'chatgpt-4o-latest',          // 128K context, versatile flagship
        mini: 'gpt-4o-mini',                  // 128K context, fast & affordable
        o1: 'o1',                             // 200K context, complex reasoning
        o1mini: 'o1-mini',                    // 128K context, fast reasoning
        o3mini: 'o3-mini-2025-01-31',         // 200K context, STEM tasks
        gpt45: 'gpt-4.5-preview',             // 128K context, creative thinking
        realtime: 'gpt-4o-realtime-preview'   // Real-time audio/text responses
      },
      maxTokens: 100000,
      temperature: 0.7
    },
    groq: {
      baseUrl: 'https://api.groq.com/openai/v1',
      models: {
        versatile: 'llama-3.3-70b-versatile',  // 128K context, versatile model
        toolUse: 'llama3-groq-70b-8192-tool-use-preview', // 8K context, tool use specialized
        llama3: 'llama3-8b-8192', // 8K context, smaller efficient model
        visionLarge: 'llama-3.2-90b-vision-preview', // 8K context, vision capabilities
        visionSmall: 'llama-3.2-11b-vision-preview' // 8K context, smaller vision model
      },
      maxTokens: 32768,
      temperature: 0.7
    },
    perplexity: {
      baseUrl: 'https://api.perplexity.ai',
      models: {
        deepResearch: perplexityModels.sonarDeepResearch,   // 128K context, advanced research
        reasoningPro: perplexityModels.sonarReasoningPro,   // 128K context, advanced reasoning
        reasoning: perplexityModels.sonarReasoning,         // 128K context, standard reasoning
        pro: perplexityModels.sonarPro,                     // 200K context, advanced features
        sonar: perplexityModels.sonar                       // 128K context, standard features
      },
      maxTokens: 8192,
      temperature: 0.7
    },
    xai: {
      baseUrl: 'https://api.x.ai/v1',
      models: {
        latest: 'grok-3-latest',               // Enterprise use cases (standard speed)
        fast: 'grok-3-fast-latest',            // Enterprise use cases (faster speed)
        mini: 'grok-3-mini-latest',            // Fast, smart, logic-based tasks (standard)
        miniFast: 'grok-3-mini-fast-latest'    // Fast, smart, logic-based tasks (faster)
      },
      maxTokens: 131072,
      temperature: 0.7
    },
    anthropic: {
      baseUrl: 'https://api.anthropic.com/v1',
      models: {
        sonnet37: 'claude-3-7-sonnet-20250219',  // 200K context, most intelligent
        sonnet: 'claude-3.5-sonnet-latest',      // 200K context, former best
        haiku: 'claude-3.5-haiku-latest'         // 200K context, fastest
      },
      maxTokens: 200000,
      temperature: 0.7
    },
    google: {
      baseUrl: 'https://generativelanguage.googleapis.com/v1',
      models: {
        flash: 'gemini-2.0-flash-thinking-exp',   // 1M context, reasoning
        pro: 'gemini-2.5-pro-exp-03-25',          // State-of-the-art reasoning
        proExp: 'gemini-2.0-pro-experimental',    // 2M context, best-in-class coding
        lite: 'gemini-2.0-flash-lite'             // 128K context, cost-efficient
      },
      maxTokens: 64000,
      temperature: 0.7
    }
  }
} as const;