export const config = {
  apiKeys: {
    xai: import.meta.env.VITE_XAI_API_KEY || '',
    groq: import.meta.env.VITE_GROQ_API_KEY || '',
    perplexity: import.meta.env.VITE_PERPLEXITY_API_KEY || '',
    huggingface: import.meta.env.VITE_HUGGINGFACE_TOKEN || '',
    github: import.meta.env.VITE_GITHUB_TOKEN || '',
    tavily: import.meta.env.VITE_TAVILY_API_KEY || '',
    google: import.meta.env.VITE_GOOGLE_API_KEY || '',
    serp: import.meta.env.VITE_SERP_API_KEY || ''
  },
  services: {
    xai: {
      baseUrl: 'https://api.x.ai/v1',
      apiVersion: '2024-01',
      defaultModel: 'grok-beta',
      maxTokens: 4096,
      temperature: 0.7,
      models: {
        beta: 'grok-beta',
        pro: 'grok-pro'
      }
    },
    groq: {
      baseUrl: 'https://api.groq.com/openai/v1',
      models: {
        small: 'llama-3.2-3b-preview',
        medium: 'llama-3.2-7b-preview',
        large: 'llama-3.2-70b-preview'
      },
      maxTokens: 4096,
      temperature: 0.7
    },
    perplexity: {
      baseUrl: 'https://api.perplexity.ai',
      defaultModel: 'llama-3.1-sonar-large-128k-online',
      maxTokens: 2048,
      temperature: 0.7
    },
    tavily: {
      baseUrl: 'https://api.tavily.com/v1',
      searchDepth: 'advanced',
      maxResults: 10
    },
    google: {
      baseUrl: 'https://www.googleapis.com/customsearch/v1',
      searchEngineId: import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID || '',
      resultsPerPage: 10
    },
    serp: {
      baseUrl: 'https://serpapi.com/search',
      resultsPerPage: 10
    }
  },
  features: {
    enableStreaming: true,
    enableMemory: true,
    enableSearch: true,
    enableGitHub: true
  }
} as const;

// Export individual API keys for backward compatibility
export const {
  xai: XAI_API_KEY,
  groq: GROQ_API_KEY,
  perplexity: PERPLEXITY_API_KEY,
  huggingface: HUGGINGFACE_TOKEN,
  github: GITHUB_TOKEN,
  tavily: TAVILY_API_KEY,
  google: GOOGLE_API_KEY,
  serp: SERP_API_KEY
} = config.apiKeys;