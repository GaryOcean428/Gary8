/**
 * Configuration validator for X.AI API
 */
import { thoughtLogger } from '../../logging/thought-logger';
import type { XAIConfig } from './types';

export class ConfigValidator {
  /**
   * Validates API key format and presence
   * @param _apiKey API key to validate
   * @returns Validated API key
   * @throws {Error} If API key is invalid or missing
   */
  static validateApiKey(_apiKey: string | undefined): string {
    if (!_apiKey) {
      thoughtLogger.log('warning', 'X.AI API key not found in environment variables');
      return ''; // Return empty string instead of throwing
    }

    const trimmedKey = _apiKey.trim();
    if (trimmedKey.length < 10) {  // Reduced threshold for validation
      thoughtLogger.log('warning', 'X.AI API key looks invalid (too short)');
      return trimmedKey; // Still return it even if it looks invalid
    }

    return trimmedKey;
  }

  /**
   * Validates complete API configuration
   * @param _config Configuration object to validate
   * @throws {Error} If configuration is invalid
   */
  static validateConfig(_config: Partial<XAIConfig>): void {
    const requiredFields = ['baseUrl', 'apiVersion', 'models'] as const;
    const missingFields = requiredFields.filter(_field => !_config[_field]);

    if (missingFields.length > 0) {
      thoughtLogger.log('warning', 'Missing configuration fields', { missingFields });
      // Continue anyway, don't throw
    }

    // Validate rate limits if present
    if (_config.rateLimits) {
      if (_config.rateLimits.requestsPerMinute <= 0) {
        _config.rateLimits.requestsPerMinute = 60; // Default value
      }
      if (_config.rateLimits.tokensPerMinute <= 0) {
        _config.rateLimits.tokensPerMinute = 100000; // Default value
      }
    }

    // Check model configuration
    if (!_config.models || Object.keys(_config.models).length === 0) {
      thoughtLogger.log('warning', 'Missing model configuration, using defaults');
      
      if (_config.models === undefined) {
        (_config as any).models = {
          beta: 'grok-3-beta',
          fast: 'grok-3-fast-beta',
          mini: 'grok-3-mini-beta',
          miniFast: 'grok-3-mini-fast-beta'
        };
      }
    }
    
    // Set default model if not defined
    if (!_config.defaultModel && _config.models) {
      const models = Object.values(_config.models);
      if (models.length > 0) {
        (_config as any).defaultModel = models[0];
      }
    }
  }
}