import { AIProviderAdapter } from '../AIProviderAdapter';
import { createOpenAIAdapter } from './OpenAIAdapter';
import { createGroqAdapter } from './GroqAdapter';
import { createAnthropicAdapter } from './AnthropicAdapter';

// Supported provider keys
export type ProviderName = 'openai' | 'groq' | 'anthropic' | 'perplexity' | 'xai' | 'google';
export class ProviderFactory {
  static createProvider(
    _provider: ProviderName,
    _apiKey?: string
  ): AIProviderAdapter {
    switch (_provider) {
      case 'openai':
        return createOpenAIAdapter(_apiKey);
      case 'groq':
        return createGroqAdapter(_apiKey);
      case 'anthropic':
        return createAnthropicAdapter(_apiKey);
      // Add more providers as they are implemented
      default:
        throw new Error(`Provider ${_provider} not implemented yet`);
    }
  }
  
  static getModelProvider(_model: string): string {
    if (_model.includes('gpt') || _model.includes('o1') || _model.includes('o3')) {
      return 'openai';
    }
    if (_model.includes('claude')) {
      return 'anthropic';
    }
    if (_model.includes('llama') || _model.startsWith('llama3')) {
      return 'groq';
    }
    if (_model.includes('grok')) {
      return 'xai';
    }
    if (_model.includes('sonar')) {
      return 'perplexity';
    }
    if (_model.includes('gemini')) {
      return 'google';
    }
    
    // Default to openai
    return 'openai';
  }
}