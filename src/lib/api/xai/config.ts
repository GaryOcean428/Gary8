/**
 * X.AI API configuration
 */
import { XAIConfig } from './types';

export const xaiConfig: XAIConfig = {
  apiKey: import.meta.env.VITE_XAI_API_KEY || '',
  baseUrl: 'https://api.x.ai/v1',
  apiVersion: '2024-01',
  defaultModel: 'grok-3-mini-latest',
  maxTokens: 4096,
  temperature: 0.7,
  models: {
    beta: 'grok-3-latest',
    fast: 'grok-3-fast-latest',
    mini: 'grok-3-mini-latest',
    miniFast: 'grok-3-mini-fast-latest'
  },
  rateLimits: {
    requestsPerMinute: 60,
    tokensPerMinute: 100000
  }
};