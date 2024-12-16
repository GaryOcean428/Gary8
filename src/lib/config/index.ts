export const config = {
  apiKeys: {
    xai: process.env.NEXT_PUBLIC_XAI_API_KEY || '',
    groq: process.env.NEXT_PUBLIC_GROQ_API_KEY || '',
    perplexity: process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || '',
    huggingface: process.env.NEXT_PUBLIC_HUGGINGFACE_TOKEN || '',
    github: process.env.NEXT_PUBLIC_GITHUB_TOKEN || '',
    tavily: process.env.NEXT_PUBLIC_TAVILY_API_KEY || '',
    google: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
    serp: process.env.NEXT_PUBLIC_SERP_API_KEY || ''
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
      searchEngineId: process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID || '',
      resultsPerPage: 10
    },
    serp: {
      baseUrl: 'https://serpapi.com/search',
      resultsPerPage: 10
    },
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
      validateConfig: () => {
        const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
        const missingFields = requiredFields.filter(field => !config.services.firebase[field]);
        if (missingFields.length > 0) {
          throw new Error(`Missing required Firebase configuration fields: ${missingFields.join(', ')}`);
        }
        return true;
      },
      appName: 'Gary8',
      linkedSite: 'gary8-ffec8-b37e9',
      collections: {
        users: 'users',
        chats: 'chats',
        messages: 'messages',
        memory: 'memory',
        workflows: 'workflows'
      },
      storage: {
        maxUploadSize: 5242880, // 5MB
        allowedTypes: ['image/*', 'application/pdf']
      }
    }
  },
  features: {
    enableStreaming: true,
    enableMemory: true,
    enableSearch: true,
    enableGitHub: true
  },
  vectorStore: {
    pinecone: {
      indexName: 'gto-general',
      host: 'https://gto-general-ieixnqw.svc.aped-4627-b74a.pinecone.io',
      dimensions: 3072,
      metric: 'cosine' as const,
      environment: 'aped-4627-b74a'
    }
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
