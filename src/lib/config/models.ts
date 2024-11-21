import { config } from './index';

export const models = {
  // Groq Models
  groq: {
    simple: {
      id: 'llama-3.2-3b-preview',
      description: 'Simple tasks and quick responses',
      maxTokens: 2048,
      temperature: 0.7,
      capabilities: ['basic-chat', 'simple-tasks']
    },
    balanced: {
      id: 'llama-3.2-7b-preview',
      description: 'Balanced performance for general tasks',
      maxTokens: 4096,
      temperature: 0.7,
      capabilities: ['general-chat', 'code-generation', 'analysis']
    },
    advanced: {
      id: 'llama-3.2-70b-preview',
      description: 'Complex tasks and advanced reasoning',
      maxTokens: 8192,
      temperature: 0.7,
      capabilities: ['complex-reasoning', 'expert-analysis', 'advanced-code']
    },
    toolUse: {
      id: 'llama3-groq-70b-8192-tool-use-preview',
      description: 'Advanced tool use and reasoning',
      maxTokens: 8192,
      temperature: 0.7,
      capabilities: ['tool-use', 'system-integration', 'workflow-automation']
    }
  },

  // Perplexity Models
  perplexity: {
    small: {
      id: 'llama-3.1-sonar-small-128k-online',
      description: '8B parameters, efficient for simple searches',
      maxTokens: 2048,
      temperature: 0.7,
      capabilities: ['web-search', 'information-retrieval']
    },
    large: {
      id: 'llama-3.1-sonar-large-128k-online',
      description: '70B parameters, comprehensive search',
      maxTokens: 4096,
      temperature: 0.7,
      capabilities: ['advanced-search', 'data-synthesis', 'current-events']
    },
    huge: {
      id: 'llama-3.1-sonar-huge-128k-online',
      description: '405B parameters, expert search and analysis',
      maxTokens: 8192,
      temperature: 0.7,
      capabilities: ['expert-search', 'deep-analysis', 'comprehensive-research']
    }
  },

  // X.AI Models
  xai: {
    grokBeta: {
      id: 'grok-beta',
      description: 'Expert-level queries and complex reasoning',
      maxTokens: 4096,
      temperature: 0.7,
      capabilities: ['expert-queries', 'complex-reasoning', 'advanced-analysis']
    }
  },

  // Qwen Models
  qwen: {
    coder: {
      id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
      description: 'Specialized code generation and analysis',
      maxTokens: 2048,
      temperature: 0.2,
      capabilities: [
        'code-generation',
        'code-review',
        'refactoring',
        'documentation',
        'debugging'
      ]
    }
  },

  // Granite Models
  granite: {
    codeBase: {
      id: 'granite-3b-code-base-2k',
      description: 'Code-focused tasks and development',
      maxTokens: 2048,
      temperature: 0.7,
      capabilities: ['code-generation', 'code-review', 'technical-documentation']
    }
  }
};

export function selectModel(task: string, complexity: number = 0.5): string {
  // Code-related tasks
  if (task.toLowerCase().includes('code') || task.toLowerCase().includes('program')) {
    if (complexity > 0.7) {
      return models.qwen.coder.id; // Use Qwen for complex coding tasks
    }
    return complexity > 0.5 ? models.groq.advanced.id : models.granite.codeBase.id;
  }

  // Search and information tasks
  if (task.toLowerCase().includes('search') || task.toLowerCase().includes('find')) {
    if (complexity > 0.8) return models.perplexity.huge.id;
    if (complexity > 0.5) return models.perplexity.large.id;
    return models.perplexity.small.id;
  }

  // Expert-level queries
  if (complexity > 0.8) {
    return models.xai.grokBeta.id;
  }

  // General tasks based on complexity
  if (complexity > 0.7) return models.groq.advanced.id;
  if (complexity > 0.4) return models.groq.balanced.id;
  return models.groq.simple.id;
}

export function getModelCapabilities(modelId: string): string[] {
  const allModels = [
    ...Object.values(models.groq),
    ...Object.values(models.perplexity),
    ...Object.values(models.xai),
    ...Object.values(models.qwen),
    ...Object.values(models.granite)
  ];

  const model = allModels.find(m => m.id === modelId);
  return model?.capabilities || [];
}

export function validateApiKeys(): boolean {
  const requiredKeys = {
    groq: config.apiKeys.groq,
    perplexity: config.apiKeys.perplexity,
    xai: config.apiKeys.xai,
    huggingface: config.apiKeys.huggingface
  };

  return Object.entries(requiredKeys).every(([provider, key]) => {
    const hasKey = Boolean(key);
    if (!hasKey) {
      thoughtLogger.log('warning', `Missing API key for ${provider}`);
    }
    return hasKey;
  });
}