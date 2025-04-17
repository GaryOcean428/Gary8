/**
 * Model information for different providers
 * Used for displaying model capabilities and availability
 */

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  maxOutput?: number;
  description: string;
  tier: 'Free' | 'Pro' | 'Premium' | string;
  capabilities?: string[];
  releaseDate?: string;
}

export const modelInfo: Record<string, ModelInfo> = {
  // OpenAI Models
  'chatgpt-4o-latest': {
    id: 'chatgpt-4o-latest',
    name: 'GPT-4o',
    provider: 'OpenAI',
    contextWindow: 128000,
    maxOutput: 16384,
    description: 'Versatile flagship model with text/image input',
    tier: 'Pro',
    capabilities: ['text', 'image-input', 'function-calling'],
    releaseDate: '2024-11'
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    contextWindow: 128000,
    maxOutput: 16384,
    description: 'Fast, affordable for focused tasks',
    tier: 'Free',
    capabilities: ['text', 'image-input', 'function-calling'],
    releaseDate: '2024-07'
  },
  'o1': {
    id: 'o1',
    name: 'O1',
    provider: 'OpenAI',
    contextWindow: 200000,
    maxOutput: 100000,
    description: 'Complex reasoning capabilities',
    tier: 'Premium',
    capabilities: ['text', 'code', 'reasoning'],
    releaseDate: '2024-12'
  },
  'o1-mini': {
    id: 'o1-mini',
    name: 'O1 Mini',
    provider: 'OpenAI',
    contextWindow: 128000,
    maxOutput: 65536,
    description: 'Fast reasoning for specialized tasks',
    tier: 'Free',
    capabilities: ['text', 'code', 'reasoning'],
    releaseDate: '2024-09'
  },
  'o3-mini-2025-01-31': {
    id: 'o3-mini-2025-01-31',
    name: 'O3 Mini',
    provider: 'OpenAI',
    contextWindow: 200000,
    maxOutput: 100000,
    description: 'Latest small reasoning model',
    tier: 'Pro',
    capabilities: ['text', 'code', 'reasoning', 'function-calling'],
    releaseDate: '2025-01'
  },
  
  // Anthropic Models
  'claude-3-7-sonnet-20250219': {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    contextWindow: 200000,
    maxOutput: 8192,
    description: 'Most intelligent model, text/image input',
    tier: 'Premium',
    capabilities: ['text', 'image-input', 'tool-use', 'code'],
    releaseDate: '2025-02'
  },
  'claude-3.5-sonnet-latest': {
    id: 'claude-3.5-sonnet-latest',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    contextWindow: 200000,
    description: 'Former most intelligent model',
    tier: 'Pro',
    capabilities: ['text', 'image-input', 'tool-use', 'code'],
    releaseDate: '2024-04'
  },
  'claude-3.5-haiku-latest': {
    id: 'claude-3.5-haiku-latest',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    contextWindow: 200000,
    description: 'Fastest Claude 3.5 model',
    tier: 'Free',
    capabilities: ['text', 'image-input'],
    releaseDate: '2024-07'
  },
  
  // Groq Models
  'llama-3.3-70b-versatile': {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'Groq',
    contextWindow: 128000,
    maxOutput: 32768,
    description: 'Versatile large language model',
    tier: 'Free',
    capabilities: ['text', 'code'],
    releaseDate: '2024'
  },
  'llama3-groq-70b-8192-tool-use-preview': {
    id: 'llama3-groq-70b-8192-tool-use-preview',
    name: 'Llama 3 Tool Use',
    provider: 'Groq',
    contextWindow: 8192,
    description: 'Specialized for function calling',
    tier: 'Pro',
    capabilities: ['text', 'tool-use', 'function-calling'],
    releaseDate: '2024'
  },
  'llama3-8b-8192': {
    id: 'llama3-8b-8192',
    name: 'Llama 3 8B',
    provider: 'Groq',
    contextWindow: 8192,
    description: 'Fast, efficient smaller model',
    tier: 'Free',
    capabilities: ['text'],
    releaseDate: '2024'
  },
  
  // xAI Models
  'grok-3-latest': {
    id: 'grok-3-latest',
    name: 'Grok 3',
    provider: 'xAI',
    contextWindow: 131072,
    description: 'Powerful general-purpose model',
    tier: 'Premium',
    capabilities: ['text', 'code', 'reasoning'],
    releaseDate: '2024'
  },
  'grok-3-mini-latest': {
    id: 'grok-3-mini-latest',
    name: 'Grok 3 Mini',
    provider: 'xAI',
    contextWindow: 131072,
    description: 'Cost-efficient standard tasks model',
    tier: 'Pro',
    capabilities: ['text', 'code'],
    releaseDate: '2024'
  }
};