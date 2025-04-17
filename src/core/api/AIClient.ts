import { Message } from '../../types';
import { AIProviderAdapter, ChatOptions } from './AIProviderAdapter';
import { ProviderFactory } from './providers/ProviderFactory';
import { AppError } from '../../lib/errors/AppError';
import { thoughtLogger } from '../../lib/logging/thought-logger';
import { RetryHandler } from '../../shared/utils/RetryHandler';

/**
 * Unified AIClient that can work with multiple provider adapters
 */
export class AIClient {
  private static instance: AIClient;
  private providers = new Map<string, AIProviderAdapter>();
  private retryHandler: RetryHandler;
  private initialized = false;
  
  private constructor() {
    this.retryHandler = new RetryHandler({
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2
    });
  }
  
  static getInstance(): AIClient {
    if (!AIClient.instance) {
      AIClient.instance = new AIClient();
    }
    return AIClient.instance;
  }
  
  /**
   * Initialize the client with API keys
   */
  async initialize(apiKeys: Record<string, string>): Promise<void> {
    if (this.initialized) return;
    
    thoughtLogger.log('execution', 'Initializing AI client');
    
    // Initialize providers with API keys
    for (const [provider, apiKey] of Object.entries(apiKeys)) {
      if (apiKey && apiKey.length > 0) {
        try {
          const adapter = ProviderFactory.createProvider(provider as any, apiKey);
          this.providers.set(provider, adapter);
        } catch (error) {
          thoughtLogger.log('warning', `Failed to initialize ${provider} provider`, { error });
          // Continue with other providers
        }
      }
    }
    
    if (this.providers.size === 0) {
      thoughtLogger.log('warning', 'No AI providers initialized');
    } else {
      thoughtLogger.log('success', `Initialized ${this.providers.size} AI providers`);
      this.initialized = true;
    }
  }
  
  /**
   * Update API key for a specific provider
   */
  setProviderApiKey(provider: string, apiKey: string): void {
    if (this.providers.has(provider)) {
      this.providers.get(provider)!.setApiKey(apiKey);
    } else {
      try {
        const adapter = ProviderFactory.createProvider(provider as any, apiKey);
        this.providers.set(provider, adapter);
      } catch (error) {
        thoughtLogger.log('error', `Failed to initialize ${provider} provider`, { error });
        throw error;
      }
    }
  }
  
  /**
   * Check if a provider is available
   */
  hasProvider(provider: string): boolean {
    return this.providers.has(provider);
  }
  
  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
  
  /**
   * Get a provider by name
   */
  getProvider(provider: string): AIProviderAdapter {
    if (!this.providers.has(provider)) {
      throw new AppError(`Provider ${provider} not available`, 'CONFIGURATION_ERROR');
    }
    return this.providers.get(provider)!;
  }
  
  /**
   * Test connection to a provider
   */
  async testProviderConnection(
    provider: string
  ): Promise<{ success: boolean; message: string }> {
    if (!this.providers.has(provider)) {
      return {
        success: false,
        message: `Provider ${provider} not configured`
      };
    }
    
    try {
      return await this.providers.get(provider)!.isApiKeyValid();
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Send a chat request to the appropriate provider
   */
  async chat(
    messages: Message[],
    options: ChatOptions & { provider?: string; model?: string } = {},
    onProgress?: (content: string) => void
  ): Promise<string> {
    const { provider, model, ...chatOptions } = options;
    
    // Ensure we're initialized
    if (!this.initialized && this.providers.size === 0) {
      throw new AppError('AI client not initialized with any providers', 'CONFIGURATION_ERROR');
    }
    
    try {
      // If provider is specified directly, use it
      if (provider && this.providers.has(provider)) {
        return await this.providers.get(provider)!.chat(messages, onProgress, { model, ...chatOptions });
      }
      
      // If model is specified, determine the provider from the model name
      if (model) {
        const providerName = ProviderFactory.getModelProvider(model);
        if (this.providers.has(providerName)) {
          return await this.providers.get(providerName)!.chat(messages, onProgress, { model, ...chatOptions });
        }
      }
      
      // If we get here, try providers in order of preference
      return await this.chatWithFallback(messages, chatOptions, onProgress);
    } catch (error) {
      thoughtLogger.log('error', 'Chat request failed', { error });
      
      // Try fallback for API errors
      if (error instanceof AppError && error.code === 'API_ERROR') {
        try {
          return await this.chatWithFallback(messages, chatOptions, onProgress);
        } catch (fallbackError) {
          throw fallbackError;
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Try to chat with available providers in order of preference
   */
  private async chatWithFallback(
    messages: Message[],
    options: ChatOptions = {},
    onProgress?: (content: string) => void
  ): Promise<string> {
    // Provider preference order
    const providerOrder = [
      'groq',      // Fast, free tier
      'openai',    // Reliable
      'anthropic', // High quality
      'xai',       // Alternative
      'perplexity' // Search capabilities
    ];
    
    // Find the first available provider
    const availableProvider = providerOrder.find(p => this.providers.has(p));
    
    if (!availableProvider) {
      throw new AppError('No AI providers available', 'CONFIGURATION_ERROR');
    }
    
    thoughtLogger.log('decision', `Using ${availableProvider} as fallback provider`);
    return await this.providers.get(availableProvider)!.chat(messages, onProgress, options);
  }
}

// Export singleton instance
export const aiClient = AIClient.getInstance();