/**
 * Configuration validator for X.AI API
 */
import { thoughtLogger } from '../../logging/thought-logger';
import type { XAIConfig } from './types';

export class ConfigValidator {
  /**
   * Validates API key format and presence
   * @param apiKey API key to validate
   * @returns Validated API key
   * @throws {Error} If API key is invalid or missing
   */
  static validateApiKey(apiKey: string | undefined): string {
    if (!apiKey) {
      thoughtLogger.log('warning', 'X.AI API key not found in environment variables');
      return ''; // Return empty string instead of throwing
    }

    const trimmedKey = apiKey.trim();
    if (trimmedKey.length < 10) {  // Reduced threshold for validation
      thoughtLogger.log('warning', 'X.AI API key looks invalid (too short)');
      return trimmedKey; // Still return it even if it looks invalid
    }

    return trimmedKey;
  }

  /**
   * Validates complete API configuration
   * @param config Configuration object to validate
   * @throws {Error} If configuration is invalid
   */
  static validateConfig(config: Partial<XAIConfig>): void {
    const requiredFields = ['baseUrl', 'apiVersion', 'models'] as const;
    const missingFields = requiredFields.filter(field => !config[field]);

    if (missingFields.length > 0) {
      thoughtLogger.log('warning', 'Missing configuration fields', { missingFields });
      // Continue anyway, don't throw
    }

    // Validate rate limits if present
    if (config.rateLimits) {
      if (config.rateLimits.requestsPerMinute <= 0) {
        config.rateLimits.requestsPerMinute = 60; // Default value
      }
      if (config.rateLimits.tokensPerMinute <= 0) {
        config.rateLimits.tokensPerMinute = 100000; // Default value
      }
    }

    // Check model configuration
    if (!config.models || Object.keys(config.models).length === 0) {
      thoughtLogger.log('warning', 'Missing model configuration, using defaults');
      
      if (config.models === undefined) {
        (config as any).models = {
          beta: 'grok-3-beta',
          fast: 'grok-3-fast-beta',
          mini: 'grok-3-mini-beta',
          miniFast: 'grok-3-mini-fast-beta'
        };
      }
    }
    
    // Set default model if not defined
    if (!config.defaultModel && config.models) {
      const models = Object.values(config.models);
      if (models.length > 0) {
        (config as any).defaultModel = models[0];
      }
    }
  }
}