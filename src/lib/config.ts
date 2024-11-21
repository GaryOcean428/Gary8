import { XAI_CONFIG } from './config';

// API Keys
export const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY || '';
export const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
export const SERP_API_KEY = import.meta.env.VITE_SERP_API_KEY || '';
export const XAI_API_KEY = import.meta.env.VITE_XAI_API_KEY || '';
export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
export const HUGGINGFACE_TOKEN = import.meta.env.VITE_HUGGINGFACE_TOKEN || '';

// API Configuration
export const config = {
  apiKeys: {
    perplexity: PERPLEXITY_API_KEY,
    google: GOOGLE_API_KEY,
    serp: SERP_API_KEY,
    xai: XAI_API_KEY,
    groq: GROQ_API_KEY,
    huggingface: HUGGINGFACE_TOKEN
  },
  services: {
    perplexity: {
      baseUrl: 'https://api.perplexity.ai',
      defaultModel: 'llama-3.1-sonar-large-128k-online',
      maxTokens: 2048,
      temperature: 0.7
    },
    google: {
      baseUrl: 'https://www.googleapis.com/customsearch/v1',
      searchEngineId: import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID || '',
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
    },
    groq: {
      baseUrl: 'https://api.groq.com/openai/v1',
      models: {
        small: 'llama-3.2-3b-preview',
        medium: 'llama-3.2-7b-preview',
        large: 'llama-3.2-70b-preview',
        toolUse: 'llama-3.2-70b-tool-use'
      },
      maxTokens: 4096,
      temperature: 0.7
    }
  },
  features: {
    enableSearch: true,
    enableMemory: true,
    enableStreaming: true,
    enableDebugMode: false
  }
} as const;