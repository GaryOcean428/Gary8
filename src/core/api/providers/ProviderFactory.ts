import { AIProviderAdapter } from '../AIProviderAdapter';
import { createOpenAIAdapter } from './OpenAIAdapter';
import { createGroqAdapter } from './GroqAdapter';
import { createAnthropicAdapter } from './AnthropicAdapter';

export class ProviderFactory {
  static createProvider(
    provider: 'openai' | 'groq' | 'anthropic' | 'perplexity' | 'xai' | 'google',
    apiKey?: string
  ): AIProviderAdapter {
    switch (provider) {
      case 'openai':
        return createOpenAIAdapter(apiKey);
      case 'groq':
        return createGroqAdapter(apiKey);
      case 'anthropic':
        return createAnthropicAdapter(apiKey);
      // Add more providers as they are implemented
      default:
        throw new Error(`Provider ${provider} not implemented yet`);
    }
  }
  
  static getModelProvider(model: string): string {
    if (model.includes('gpt') || model.includes('o1') || model.includes('o3')) {
      return 'openai';
    }
    if (model.includes('claude')) {
      return 'anthropic';
    }
    if (model.includes('llama') || model.startsWith('llama3')) {
      return 'groq';
    }
    if (model.includes('grok')) {
      return 'xai';
    }
    if (model.includes('sonar')) {
      return 'perplexity';
    }
    if (model.includes('gemini')) {
      return 'google';
    }
    
    // Default to openai
    return 'openai';
  }
}