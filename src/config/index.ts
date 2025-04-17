// API Keys
export const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY || '';
export const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
export const SERP_API_KEY = import.meta.env.VITE_SERP_API_KEY || '';
export const XAI_API_KEY = import.meta.env.VITE_XAI_API_KEY || '';

// API Configuration
export const config = {
  perplexity: {
    baseUrl: 'https://api.perplexity.ai',
    defaultModel: 'llama-3.1-sonar-large-128k-online',
    maxTokens: 2048,
    temperature: 0.7
  },
  google: {
    baseUrl: 'https://www.googleapis.com/customsearch/v1',
    searchEngineId: 'AIzaSyBYnK6ckkX8gW_Qs4vYGKn2uvd3GyVIooU',
    resultsPerPage: 5
  },
  serp: {
    baseUrl: 'https://serpapi.com/search',
    resultsPerPage: 5
  },
  xai: {
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-beta',
    maxTokens: 1024,
    temperature: 0.7
  }
} as const;

// Feature Flags
export const features = {
  enableSearch: true,
  enableMemory: true,
  enableStreaming: true,
  enableDebugMode: false
} as const;