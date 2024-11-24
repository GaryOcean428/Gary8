import { thoughtLogger } from '../../logging/thought-logger';
import type { XAIConfig } from './types';

export class ConfigValidator {
  static validateApiKey(apiKey: string | undefined): string {
    if (!apiKey) {
      thoughtLogger.log('error', 'X.AI API key not found in environment variables');
      throw new Error('X.AI API key not configured. Please set VITE_XAI_API_KEY in your environment.');
    }

    const trimmedKey = apiKey.trim();
    if (trimmedKey.length < 32) {
      thoughtLogger.log('error', 'Invalid X.AI API key format');
      throw new Error('Invalid X.AI API key format. Please check your API key.');
    }

    return trimmedKey;
  }

  static validateConfig(config: Partial<XAIConfig>): void {
    const requiredFields = ['apiKey', 'baseUrl', 'apiVersion', 'defaultModel'] as const;
    const missingFields = requiredFields.filter(field => !config[field]);

    if (missingFields.length > 0) {
      thoughtLogger.log('error', 'Missing required configuration fields', { missingFields });
      throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
    }

    // Validate rate limits
    if (config.rateLimits) {
      if (config.rateLimits.requestsPerMinute <= 0) {
        throw new Error('Invalid requests per minute limit');
      }
      if (config.rateLimits.tokensPerMinute <= 0) {
        throw new Error('Invalid tokens per minute limit');
      }
    }

    // Validate model configuration
    if (config.models && (!config.models.beta || !config.models.pro)) {
      throw new Error('Invalid model configuration');
    }
  }
}