import { thoughtLogger } from '../logging/thought-logger';

/**
 * Validates API key formats for various providers
 * Returns true if the key appears valid, false otherwise
 */
export function validateApiKey(_provider: string, _key: string): boolean {
  if (!_key || typeof _key !== 'string' || _key.trim().length === 0) {
    return false;
  }
  
  const trimmedKey = _key.trim();
  
  // General minimum length check
  if (trimmedKey.length < 8) {
    return false;
  }
  
  // Provider-specific validation
  try {
    switch (_provider) {
      case 'openai':
        // OpenAI keys typically start with 'sk-' and are longer than 30 chars
        return /^sk-[A-Za-z0-9]{30,}$/.test(trimmedKey);
        
      case 'anthropic':
        // Anthropic keys usually start with 'sk-ant-' or 'ant-'
        return /^(sk-ant-|ant-)[A-Za-z0-9]{20,}$/.test(trimmedKey);
        
      case 'groq':
        // Groq keys usually start with 'gsk_'
        return /^gsk_[A-Za-z0-9]{20,}$/.test(trimmedKey);
        
      case 'perplexity':
        // Perplexity keys usually start with 'pplx-'
        return /^pplx-[A-Za-z0-9]{20,}$/.test(trimmedKey);
        
      case 'xai':
        // X.AI (Grok) keys may have various formats
        return /^(xai-|grok-)?[A-Za-z0-9]{20,}$/.test(trimmedKey);
        
      case 'google':
        // Google API keys are typically 39 characters
        return trimmedKey.length >= 30;
        
      case 'serp':
        // SERP API keys are typically alphanumeric
        return /^[A-Za-z0-9]{20,}$/.test(trimmedKey);
        
      case 'bing':
        // Bing Search API keys are alphanumeric, typically 32 chars
        return /^[A-Za-z0-9]{20,}$/.test(trimmedKey);
        
      case 'together':
        // Together AI keys typically have specific formats
        return trimmedKey.length >= 20;
        
      default:
        // For unknown providers, just check if it's reasonably long
        return trimmedKey.length >= 16;
    }
  } catch (error) {
    thoughtLogger.log('error', `API key validation failed for ${_provider}`, { error });
    return false;
  }
}

/**
 * Loosely validates API keys for various providers with more lenient requirements
 * Used as a fallback when strict validation fails
 */
export function looseValidateApiKey(_provider: string, _key: string): boolean {
  if (!_key || typeof _key !== 'string' || _key.trim().length === 0) {
    return false;
  }
  
  const trimmedKey = _key.trim();
  
  // Minimum reasonable length for any API key
  return trimmedKey.length >= 10;
}

/**
 * Provides a quality score for an API key (0-1)
 * Even if a key passes validation, it might have quality issues
 */
export function getApiKeyQualityScore(_provider: string, _key: string): number {
  if (!_key || typeof _key !== 'string') {
    return 0;
  }
  
  const trimmedKey = _key.trim();
  
  // Start with a base score
  let score = 0.5;
  
  // Add points for proper length
  if (trimmedKey.length >= 30) {
    score += 0.2;
  } else if (trimmedKey.length >= 20) {
    score += 0.1;
  }
  
  // Add points for proper prefix
  switch (_provider) {
    case 'openai':
      if (trimmedKey.startsWith('sk-')) score += 0.3;
      break;
    case 'anthropic':
      if (trimmedKey.startsWith('sk-ant-') || trimmedKey.startsWith('ant-')) score += 0.3;
      break;
    case 'groq':
      if (trimmedKey.startsWith('gsk_')) score += 0.3;
      break;
    case 'perplexity':
      if (trimmedKey.startsWith('pplx-')) score += 0.3;
      break;
    case 'xai':
      if (trimmedKey.startsWith('xai-') || trimmedKey.startsWith('grok-')) score += 0.3;
      break;
    default:
      // No specific prefix check for other providers
      break;
  }
  
  // Cap at 1.0
  return Math.min(score, 1.0);
}