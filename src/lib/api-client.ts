import { HTTPClient } from './http';
import { RateLimiter } from './rate-limiter';
import { useConfigStore } from './config';
import { AppError } from './errors/AppError';
import { thoughtLogger } from './logging/thought-logger';
import type { Message } from './types';
import { ModelRouter } from './routing/model-router';
import { RetryHandler } from './utils/RetryHandler';
import { OpenAIAPI } from './api/openai-api';
import { getNetworkStatus } from '../core/supabase/supabase-client';
import { supabase } from '../core/supabase/supabase-client';
import { isResponsesCompatibleModel } from './utils/openai-helpers';
import { validateApiKey, looseValidateApiKey } from './utils/apiKeyValidation';

export class APIClient {
  private httpClient: HTTPClient;
  private rateLimiter: RateLimiter;
  private router: ModelRouter;
  private initialized: boolean = false;
  private static instance: APIClient;
  private configStore = useConfigStore;
  private retryHandler: RetryHandler;
  private openaiAPI: OpenAIAPI;
  private connectionStatus: Record<string, boolean> = {};
  private useEdgeFunctions: boolean = false; // Default to false - don't use edge functions
  private edgeFunctionStatus: Record<string, boolean> = {};
  private lastEdgeFunctionCheck: number = 0;
  private edgeFunctionCheckInterval: number = 60000; // 1 minute

  private constructor() {
    this.httpClient = new HTTPClient('', {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    this.rateLimiter = new RateLimiter({
      maxRequests: 50,
      interval: 60 * 1000 // 1 minute
    });

    this.router = new ModelRouter();
    
    this.retryHandler = new RetryHandler({
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2
    });
    
    this.openaiAPI = OpenAIAPI.getInstance();
  }

  static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }

  setUseEdgeFunctions(enabled: boolean): void {
    this.useEdgeFunctions = enabled;
    if (enabled) {
      thoughtLogger.log('execution', 'Using Edge Functions for API keys');
    } else {
      thoughtLogger.log('execution', 'Using local API keys');
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    thoughtLogger.log('execution', 'Initializing API client');

    // Check network connectivity first
    if (!getNetworkStatus()) {
      thoughtLogger.log('warning', 'Network is offline during API client initialization');
      return;
    }

    // Check Edge Functions status if enabled
    if (this.useEdgeFunctions) {
      try {
        await this.checkEdgeFunctionsStatus();
      } catch (error) {
        thoughtLogger.log('warning', 'Error checking Edge Functions status', { error });
        // Continue with initialization anyway
      }
    }

    // Safely retrieve configured API keys
    // Safely retrieve configured API keys (default to empty object if getState returns falsy)
    const configState = ((typeof this.configStore.getState === 'function' ? this.configStore.getState() : {}) || {});
    const apiKeys = configState.apiKeys || {};
    
    // Check for required API keys based on available models, with fallbacks
    const availableProviders = Object.entries(apiKeys)
      .filter(([provider, key]) => {
        // Attempt to validate the API key format
        const isValid = validateApiKey(provider as keyof typeof apiKeys, key);
        
        // Fall back to a looser validation if strict validation fails
        if (!isValid && looseValidateApiKey(provider as keyof typeof apiKeys, key)) {
          thoughtLogger.log('warning', `API key for ${provider} failed strict validation but passed loose validation`);
          return key && key.trim().length > 10;
        }
        
        return isValid;
      })
      .map(([provider]) => provider);
      
    thoughtLogger.log('observation', `Available API providers: ${availableProviders.join(', ') || 'none'}`);
    
    if (availableProviders.length === 0) {
      const message = 'No valid API keys configured. Please add at least one API key in settings.';
      thoughtLogger.log('warning', message);
      // Don't throw error here, just log a warning
    }

    this.initialized = true;
    thoughtLogger.log('success', 'API client initialized successfully');
  }

  async testConnection(provider: string): Promise<{success: boolean; message: string}> {
    // Check network connectivity first
    if (!getNetworkStatus()) {
      return {
        success: false,
        message: 'Network connection unavailable. Please check your internet connection.'
      };
    }
    
    // Try to test connection using Edge Functions if enabled
    if (this.useEdgeFunctions && this.edgeFunctionStatus['test-connection']) {
      try {
        const { data, error } = await supabase.functions.invoke('test-connection', {
          body: { provider }
        });
        
        if (!error && data) {
          this.connectionStatus[provider] = data.success;
          return data;
        }
      } catch (error) {
        thoughtLogger.log('warning', `Failed to test connection via Edge Function: ${error instanceof Error ? error.message : String(error)}`);
        // Fall through to using local API keys
      }
    }
    
    // Fall back to local API keys test
    // Safely retrieve configured API keys
    // Retrieve configured API keys if available
    const rawState = typeof this.configStore.getState === 'function' ? this.configStore.getState() : undefined;
    const apiKeys = rawState?.apiKeys;
    const apiKey = apiKeys?.[provider];
    // If keys object provided (e.g., in tests), enforce key presence and format
    if (apiKeys) {
      if (!apiKey || apiKey.trim() === '') {
        return { success: false, message: `No API key configured for ${provider}` };
      }
      if (!looseValidateApiKey(provider, apiKey)) {
        return { success: false, message: `Invalid API key format for ${provider}` };
      }
    }
    

    let endpoint: string;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    let body: any = {};

    try {
      switch(provider) {
        case 'openai':
          endpoint = 'https://api.openai.com/v1/models';
          headers['Authorization'] = `Bearer ${apiKey}`;
          break;
        
        case 'anthropic':
          endpoint = 'https://api.anthropic.com/v1/messages';
          headers['x-api-key'] = apiKey;
          headers['anthropic-version'] = '2023-06-01';
          body = {
            model: 'claude-3.5-haiku-latest',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hello' }]
          };
          break;
          
        case 'groq':
          endpoint = 'https://api.groq.com/openai/v1/models';
          headers['Authorization'] = `Bearer ${apiKey}`;
          break;
          
        case 'xai':
          endpoint = 'https://api.x.ai/v1/models';
          headers['Authorization'] = `Bearer ${apiKey}`;
          break;
          
        case 'perplexity':
          endpoint = 'https://api.perplexity.ai/chat/models';
          headers['Authorization'] = `Bearer ${apiKey}`;
          break;
          
        case 'google':
          endpoint = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
          break;
          
        case 'serp':
          endpoint = `https://serpapi.com/account?api_key=${apiKey}`;
          break;
          
        case 'bing':
          endpoint = 'https://api.bing.microsoft.com/v7.0/search?q=test';
          headers['Ocp-Apim-Subscription-Key'] = apiKey;
          break;

        case 'together':
          endpoint = 'https://api.together.ai/v1/models';
          headers['Authorization'] = `Bearer ${apiKey}`;
          break;
          
        case 'tavily':
          endpoint = `https://api.tavily.com/search?api_key=${apiKey}&query=test`;
          break;
          
        default:
          return {
            success: false,
            message: `Unknown provider: ${provider}`
          };
      }
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        // Make a simple request to check if API key is valid
        const response = await fetch(endpoint, {
          method: provider === 'anthropic' ? 'POST' : 'GET',
          headers,
          body: provider === 'anthropic' ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Update connection status
        this.connectionStatus[provider] = response.ok;
  
        if (response.ok) {
          return {
            success: true,
            message: `Successfully connected to ${provider} API`
          };
        } else {
          const error = await response.json().catch(() => ({}));
          return {
            success: false,
            message: `Failed to connect to ${provider} API: ${response.status} ${response.statusText}${
              error.error?.message ? ` - ${error.error.message}` : ''
            }`
          };
        }
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      // Update connection status
      this.connectionStatus[provider] = false;
      
      // Check for specific network errors
      let message = error instanceof Error ? error.message : String(error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        message = `Network error connecting to ${provider} API. Please check your internet connection.`;
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        message = `Connection to ${provider} API timed out. The service may be unavailable.`;
      }
      
      return {
        success: false,
        message: `Error testing connection to ${provider}: ${message}`
      };
    }
  }

  async chat(
    messages: Message[], 
    onProgress?: (content: string) => void
  ): Promise<string> {
    // Check network connectivity first
    if (!getNetworkStatus()) {
      throw new AppError('Network unavailable. Please check your internet connection and try again.', 'NETWORK_ERROR');
    }
    
    // Ensure initialization
    if (!this.initialized) {
      try {
        await this.initialize();
      } catch (error) {
        thoughtLogger.log('error', 'Failed to initialize API client', { error });
        throw error;
      }
    }

    await this.rateLimiter.acquire();

    // Route to appropriate model and provider
    // Determine routing configuration; provide defaults if router returns falsy
    const rawConfig = await this.router.route(messages[0].content, messages);
    const routerConfig = rawConfig ?? { model: '', temperature: undefined as any, maxTokens: undefined as any, confidence: undefined };
    thoughtLogger.log('decision', `Selected model: ${routerConfig.model}`, {
      confidence: routerConfig.confidence
    });
    // Safely retrieve configured API keys
    const configState = (typeof this.configStore.getState === 'function'
      ? this.configStore.getState()
      : {}) || {};
    const apiKeys = configState.apiKeys || {};
    // Determine provider for selected model
    const provider = this.getProviderForModel(routerConfig.model);
    // Execute fetch-based API call with retry and fallback for all models
    // Non-OpenAI providers: use fetch + retry + fallback logic
    try {
      const apiConfig = this.getAPIConfig(routerConfig.model, apiKeys);
      return await this.retryHandler.execute(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        try {
          console.log(`Making API request to ${apiConfig.endpoint} with model ${routerConfig.model}`);
          const response = await fetch(apiConfig.endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiConfig.apiKey}`,
              'Content-Type': 'application/json',
              ...apiConfig.additionalHeaders
            },
            body: JSON.stringify({
              ...apiConfig.bodyTransform({
                messages: messages.map(({ role, content }) => ({ role, content })),
                model: routerConfig.model,
                temperature: routerConfig.temperature,
                max_tokens: routerConfig.maxTokens,
                stream: Boolean(onProgress)
              })
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new AppError(
              `API request failed: ${response.status} ${response.statusText}` +
              (errorData.error?.message ? ` - ${errorData.error.message}` : ''),
              'API_ERROR', { status: response.status, ...errorData }
            );
          }
          if (onProgress && response.body) {
            return this.handleStreamingResponse(
              response.body,
              routerConfig.model,
              onProgress,
              apiConfig.streamParser
            );
          }
          const data = await response.json();
          const content = apiConfig.extractContent(data);
          if (typeof content !== 'string') {
            throw new AppError(`Invalid response format: ${JSON.stringify(content)}`, 'API_ERROR');
          }
          return content;
        } catch (err) {
          clearTimeout(timeoutId);
          throw err;
        }
      });
    } catch (error) {
      thoughtLogger.log('error', 'API request failed', { error });
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new AppError(
          'Network error. Please check your internet connection and try again.',
          'NETWORK_ERROR'
        );
      }
      // Fallback to alternates
      return await this.chatWithFallback(messages, onProgress, provider);
    }
  }

  private async checkEdgeFunctionsStatus(): Promise<void> {
    // Only check once per minute to avoid excessive requests
    const now = Date.now();
    if (now - this.lastEdgeFunctionCheck < this.edgeFunctionCheckInterval) {
      return;
    }
    
    this.lastEdgeFunctionCheck = now;
    
    try {
      // For monitoring purposes, log the attempt to check Edge Functions status
      console.log('Checking Edge Functions status...');
      
      // Test the test-connection function
      const { data, error } = await supabase.functions.invoke('test-connection', {
        body: { provider: 'openai' } // Just a test provider
      });
      
      this.edgeFunctionStatus['test-connection'] = !error;
      console.log('Test connection function status:', !error ? 'working' : 'failed', error);
      
      // Test the process-api-request function
      try {
        const { data: apiData, error: apiError } = await supabase.functions.invoke('process-api-request', {
          body: {
            provider: 'openai',
            endpoint: '/models',
            method: 'GET'
          },
          timeout: 5000
        });
        
        this.edgeFunctionStatus['process-api-request'] = !apiError;
        console.log('Process API request function status:', !apiError ? 'working' : 'failed', apiError);
      } catch (reqError) {
        console.error('Error testing process-api-request function:', reqError);
        this.edgeFunctionStatus['process-api-request'] = false;
      }
      
      // Test the api-keys function
      try {
        const { data: keysData, error: keysError } = await supabase.functions.invoke('api-keys', {
          timeout: 5000
        });
        
        this.edgeFunctionStatus['api-keys'] = !keysError;
        console.log('API keys function status:', !keysError ? 'working' : 'failed', keysError);
      } catch (keysError) {
        console.error('Error testing api-keys function:', keysError);
        this.edgeFunctionStatus['api-keys'] = false;
      }
      
      // Test the search function
      try {
        const { data: searchData, error: searchError } = await supabase.functions.invoke('search', {
          body: {
            query: 'test',
            provider: 'openai'
          },
          timeout: 5000
        });
        
        this.edgeFunctionStatus['search'] = !searchError;
        console.log('Search function status:', !searchError ? 'working' : 'failed', searchError);
      } catch (searchError) {
        console.error('Error testing search function:', searchError);
        this.edgeFunctionStatus['search'] = false;
      }
      
      thoughtLogger.log('success', 'Edge Functions status checked', { 
        status: this.edgeFunctionStatus 
      });
    } catch (error) {
      thoughtLogger.log('warning', 'Failed to check Edge Functions status', { error });
      // Set all to false on general error
      this.edgeFunctionStatus = {
        'test-connection': false,
        'process-api-request': false,
        'api-keys': false,
        'search': false
      };
    }
  }

  private shouldUseEdgeFunctions(): boolean {
    // Check if we have recent status information
    const now = Date.now();
    if (now - this.lastEdgeFunctionCheck > this.edgeFunctionCheckInterval) {
      // If it's been too long since our last check, assume they're not working
      // We'll check again on the next request
      return false;
    }
    
    // Check if the process-api-request function is working
    return this.edgeFunctionStatus['process-api-request'] !== false;
  }

  public getEdgeFunctionStatuses(): Record<string, boolean> {
    return { ...this.edgeFunctionStatus };
  }

  private getProviderForModel(model: string): string {
    if (model.includes('gpt') || model.includes('o1') || model.includes('o3')) return 'openai';
    if (model.includes('claude')) return 'anthropic';
    if (model.includes('llama') || model.startsWith('llama3')) return 'groq';
    if (model.includes('grok')) return 'xai';
    if (model.includes('sonar')) return 'perplexity';
    if (model.includes('gemini')) return 'google';
    // Default to openai
    return 'openai';
  }

  private async chatWithFallback(
    messages: Message[],
    onProgress?: (content: string) => void,
    initialProvider?: string
  ): Promise<string> {
    // Determine which providers are available for fallback (exclude initial provider)
    const apiKeys = this.configStore.getState().apiKeys;
    const fallbackProviders = Object.entries(apiKeys)
      .filter(([provider, key]) => provider !== initialProvider && key && key.trim().length > 10 && looseValidateApiKey(provider as any, key))
      .map(([provider]) => provider);
    thoughtLogger.log('decision', `Fallback provider order: ${fallbackProviders.join(', ')}`);
    
    if (fallbackProviders.includes('openai')) {
      // Try OpenAI first if available
      const model = 'gpt-4o-mini';
      thoughtLogger.log('execution', `Fallback to OpenAI: ${model}`);
      
      try {
        return await this.openaiAPI.chat(
          messages,
          apiKeys.openai,
          { model },
          onProgress
        );
      } catch (error) {
        throw new AppError(`OpenAI fallback failed: ${error instanceof Error ? error.message : String(error)}`, 'API_ERROR');
      }
    } else if (fallbackProviders.includes('groq')) {
      // Try Groq if available
      const model = 'llama-3.3-70b-versatile';
      thoughtLogger.log('execution', `Fallback to Groq: ${model}`);
      
      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKeys.groq}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messages: messages.map(({ role, content }) => ({ role, content })),
              model: model,
              temperature: 0.7,
              max_tokens: 4096,
              stream: Boolean(onProgress)
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
          }
          
          if (onProgress && response.body) {
            return this.handleStreamingResponse(response.body, model, onProgress);
          }
          
          const data = await response.json();
          return data.choices[0]?.message?.content || '';
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      } catch (error) {
        throw new AppError(`Groq fallback failed: ${error instanceof Error ? error.message : String(error)}`, 'API_ERROR');
      }
    } else if (fallbackProviders.includes('perplexity')) {
      // Try Perplexity if available
      const model = 'sonar-reasoning-pro';
      thoughtLogger.log('execution', `Fallback to Perplexity: ${model}`);
      
      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
          const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKeys.perplexity}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messages: messages.map(({ role, content }) => ({ role, content })),
              model: model,
              temperature: 0.7,
              max_tokens: 4096,
              stream: Boolean(onProgress)
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
          }
          
          if (onProgress && response.body) {
            return this.handleStreamingResponse(response.body, model, onProgress);
          }
          
          const data = await response.json();
          return data.choices[0]?.message?.content || '';
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      } catch (error) {
        throw new AppError(`Perplexity fallback failed: ${error instanceof Error ? error.message : String(error)}`, 'API_ERROR');
      }
    } else if (fallbackProviders.includes('anthropic')) {
      // Try Anthropic if available
      const model = 'claude-3.5-haiku-latest';
      thoughtLogger.log('execution', `Fallback to Anthropic: ${model}`);
      
      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'X-API-Key': apiKeys.anthropic,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: model,
              messages: messages.map(({ role, content }) => ({ role, content })),
              max_tokens: 4096,
              stream: Boolean(onProgress)
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
          }
          
          if (onProgress && response.body) {
            return this.handleStreamingResponse(response.body, model, onProgress, (data) => {
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta' && parsed.delta.text) {
                  return parsed.delta.text;
                }
                return undefined;
              } catch (e) {
                return undefined;
              }
            });
          }
          
          const data = await response.json();
          return data.content?.[0]?.text || '';
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      } catch (error) {
        throw new AppError(`Anthropic fallback failed: ${error instanceof Error ? error.message : String(error)}`, 'API_ERROR');
      }
    }
    
    // If no fallback providers remain
    throw new AppError(
      'No available API providers found for fallback. Please configure additional API keys in settings.',
      'CONFIGURATION_ERROR'
    );
  }

  private async handleStreamingResponse(
    body: ReadableStream<Uint8Array>,
    model: string,
    onProgress: (content: string) => void,
    customParser?: (data: string) => string | undefined
  ): Promise<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              let content: string | undefined;
              
              // Use custom parser if provided
              if (customParser) {
                content = customParser(data);
              } else {
                // Default parser for OpenAI-compatible streams
                const parsed = JSON.parse(data);
                content = parsed.choices?.[0]?.delta?.content;
                
                // Handle Anthropic-style responses
                if (!content && parsed.type === 'content_block_delta') {
                  content = parsed.delta?.text;
                }
              }
              
              if (content) {
                fullContent += content;
                onProgress(content);
              }
            } catch (e) {
              thoughtLogger.log('error', 'Failed to parse streaming response', { error: e });
            }
          }
        }
      }

      return fullContent;
    } finally {
      reader.releaseLock();
    }
  }

  private getAPIConfig(model: string, apiKeys: Record<string, string>): {
    endpoint: string;
    apiKey: string;
    additionalHeaders: Record<string, string>;
    bodyTransform: (data: any) => any;
    extractContent: (data: any) => string;
    streamParser?: (data: string) => string | undefined;
  } {
    // Log for debugging
    console.log(`Getting API config for model: ${model}`);
    
    // Groq models (check for different pattern prefixes)
    if (model.startsWith('llama') || model.includes('groq')) {
      return {
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: apiKeys.groq,
        additionalHeaders: {},
        bodyTransform: data => data,
        extractContent: data => data.choices[0]?.message?.content || ''
      };
    }
    
    if (model.startsWith('grok')) {
      return {
        endpoint: 'https://api.x.ai/v1/chat/completions',
        apiKey: apiKeys.xai,
        additionalHeaders: {
          'X-API-Version': '2023-11-01'
        },
        bodyTransform: data => data,
        extractContent: data => data.choices[0]?.message?.content || ''
      };
    }
    
    if (model.includes('sonar')) {
      return {
        endpoint: 'https://api.perplexity.ai/chat/completions',
        apiKey: apiKeys.perplexity,
        additionalHeaders: {},
        bodyTransform: data => data,
        extractContent: data => data.choices[0]?.message?.content || ''
      };
    }
    
    if (model.includes('claude')) {
      return {
        endpoint: 'https://api.anthropic.com/v1/messages',
        apiKey: apiKeys.anthropic || '',
        additionalHeaders: {
          'anthropic-version': '2023-06-01'
        },
        bodyTransform: data => ({
          model: data.model,
          max_tokens: data.max_tokens,
          messages: data.messages,
          stream: data.stream
        }),
        extractContent: data => data.content?.[0]?.text || '',
        streamParser: (data) => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta.text) {
              return parsed.delta.text;
            }
            return undefined;
          } catch (e) {
            return undefined;
          }
        }
      };
    }
    
    if (model.includes('gemini')) {
      const baseUrl = 'https://generativelanguage.googleapis.com/v1/models';
      const modelPath = model.replace(/\./g, '-');
      
      return {
        endpoint: `${baseUrl}/${modelPath}:generateContent?key=${apiKeys.google}`,
        apiKey: apiKeys.google || '',
        additionalHeaders: {},
        bodyTransform: data => ({
          contents: data.messages.map((m: any) => ({
            role: m.role === 'system' ? 'user' : m.role,
            parts: [{ text: m.content }]
          })),
          generationConfig: {
            temperature: data.temperature,
            maxOutputTokens: data.max_tokens
          }
        }),
        extractContent: data => data.candidates[0]?.content?.parts[0]?.text || ''
      };
    }
    
    // Default to OpenAI
    return {
      endpoint: 'https://api.openai.com/v1/chat/completions', 
      apiKey: apiKeys.openai || '',
      additionalHeaders: {},
      bodyTransform: data => data,
      extractContent: data => data.choices[0]?.message?.content || ''
    };
  }
  
  // Get connection status for a provider
  getConnectionStatus(provider: string): boolean {
    return this.connectionStatus[provider] || false;
  }
  
  // Get all connection statuses
  getAllConnectionStatuses(): Record<string, boolean> {
    return { ...this.connectionStatus };
  }
}

// Export the singleton instance
export const apiClient = APIClient.getInstance();