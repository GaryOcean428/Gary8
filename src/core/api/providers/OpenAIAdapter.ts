import { thoughtLogger } from '../../../lib/logging/thought-logger';
import { AppError } from '../../../lib/errors/AppError';
import { RetryHandler } from '../../../shared/utils/RetryHandler';
import { AIProviderAdapter, ChatOptions } from '../AIProviderAdapter';
import { Message } from '../../../types';

export class OpenAIAdapter implements AIProviderAdapter {
  name = 'OpenAI';
  private apiKey: string = '';
  private baseUrl: string = 'https://api.openai.com/v1';
  private retryHandler: RetryHandler;
  
  constructor(apiKey?: string) {
    this.retryHandler = new RetryHandler({
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2
    });
    
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }
  
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  getAvailableModels(): string[] {
    return [
      'gpt-4o',
      'gpt-4o-mini',
      'o1',
      'o1-mini',
      'o3-mini-2025-01-31',
      'gpt-4.5-preview',
      'gpt-4o-realtime-preview'
    ];
  }
  
  async isApiKeyValid(): Promise<{success: boolean; message: string}> {
    if (!this.apiKey) {
      return {
        success: false,
        message: 'OpenAI API key not provided'
      };
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return {
          success: true,
          message: 'Successfully connected to OpenAI API'
        };
      } else {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          message: `Failed to connect to OpenAI API: ${response.status} ${response.statusText}${
            error.error?.message ? ` - ${error.error.message}` : ''
          }`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error testing connection to OpenAI API: ${
          error instanceof Error ? error.message : String(error)
        }`
      };
    }
  }
  
  async chat(
    messages: Message[],
    onProgress?: (content: string) => void,
    options?: ChatOptions
  ): Promise<string> {
    if (!this.apiKey) {
      throw new AppError('OpenAI API key not configured', 'API_ERROR');
    }
    
    const isResponsesSupported = this.isResponsesCompatibleModel(options?.model || 'gpt-4o');
    
    try {
      // Use the Responses API for supported models, fall back to Chat Completions for others
      if (isResponsesSupported) {
        return await this.chatWithResponsesAPI(messages, onProgress, options);
      } else {
        return await this.chatWithCompletionsAPI(messages, onProgress, options);
      }
    } catch (error) {
      // If the Responses API fails with a not-found error, fallback to Completions API
      if (
        error instanceof AppError && 
        error.code === 'API_ERROR' && 
        error.details?.status === 404 &&
        isResponsesSupported
      ) {
        thoughtLogger.log('warning', 'Failed to use Responses API, falling back to Chat Completions', { error });
        return await this.chatWithCompletionsAPI(messages, onProgress, options);
      }
      
      throw error;
    }
  }
  
  /**
   * Make a request using the new Responses API
   */
  private async chatWithResponsesAPI(
    messages: Message[],
    onProgress?: (content: string) => void,
    options?: ChatOptions
  ): Promise<string> {
    thoughtLogger.log('execution', 'Using OpenAI Responses API', { model: options?.model });
    
    // Convert from messages to input format for Responses API
    const input = this.convertMessagesToInput(messages);
    
    // Build request body
    const requestBody: any = {
      model: options?.model || 'gpt-4o',
      input,
      stream: Boolean(onProgress)
    };
    
    // Add optional parameters
    if (options?.temperature !== undefined) requestBody.temperature = options.temperature;
    if (options?.maxTokens !== undefined) requestBody.max_tokens = options.maxTokens;
    
    return await this.retryHandler.execute(async () => {
      const response = await fetch(`${this.baseUrl}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'OpenAI-Beta': 'responses=v2'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AppError(
          `OpenAI API error: ${response.status} ${response.statusText}${
            errorData.error?.message ? ` - ${errorData.error.message}` : ''
          }`,
          'API_ERROR',
          { status: response.status, ...errorData }
        );
      }
      
      // Handle streaming
      if (onProgress && response.body) {
        return await this.handleResponsesStreaming(response.body, onProgress);
      }
      
      // Parse response
      const data = await response.json();
      return this.extractResponsesContent(data);
    });
  }
  
  /**
   * Fallback method: Make a request using the older Chat Completions API
   */
  private async chatWithCompletionsAPI(
    messages: Message[],
    onProgress?: (content: string) => void,
    options?: ChatOptions
  ): Promise<string> {
    thoughtLogger.log('execution', 'Using OpenAI Chat Completions API', { model: options?.model });
    
    // Build request body for Chat Completions API
    const requestBody: any = {
      model: options?.model || 'gpt-4o',
      messages: messages.map(({ role, content }) => ({ role, content })),
      stream: Boolean(onProgress)
    };
    
    // Add optional parameters
    if (options?.temperature !== undefined) requestBody.temperature = options.temperature;
    if (options?.maxTokens !== undefined) requestBody.max_tokens = options.maxTokens;
    if (options?.topP !== undefined) requestBody.top_p = options.topP;
    if (options?.frequencyPenalty !== undefined) requestBody.frequency_penalty = options.frequencyPenalty;
    if (options?.presencePenalty !== undefined) requestBody.presence_penalty = options.presencePenalty;
    
    return await this.retryHandler.execute(async () => {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AppError(
          `OpenAI API error: ${response.status} ${response.statusText}${
            errorData.error?.message ? ` - ${errorData.error.message}` : ''
          }`,
          'API_ERROR',
          { status: response.status, ...errorData }
        );
      }
      
      // Handle streaming
      if (onProgress && response.body) {
        return await this.handleCompletionsStreaming(response.body, onProgress);
      }
      
      // Parse normal response
      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    });
  }
  
  /**
   * Handle streaming responses from the Responses API
   */
  private async handleResponsesStreaming(
    body: ReadableStream<Uint8Array>,
    onProgress: (content: string) => void
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
              const parsed = JSON.parse(data);
              
              // Check for text_delta chunks in streaming
              if (parsed.type === 'text_delta') {
                fullContent += parsed.delta;
                onProgress(parsed.delta);
              }
              // Also handle text chunks
              else if (parsed.type === 'text') {
                fullContent += parsed.text;
                onProgress(parsed.text);
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
  
  /**
   * Handle streaming responses from the Chat Completions API
   */
  private async handleCompletionsStreaming(
    body: ReadableStream<Uint8Array>,
    onProgress: (content: string) => void
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
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
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
  
  /**
   * Extract content from the Responses API response
   */
  private extractResponsesContent(data: any): string {
    // Use the convenience method if available
    if (data.output_text !== undefined) {
      return data.output_text;
    }
    
    // Otherwise manually extract from the structured output
    if (data.output) {
      // Find the first message content that's a text
      for (const item of data.output) {
        if (item.type === 'message' && item.role === 'assistant') {
          for (const content of (item.content || [])) {
            if (content.type === 'output_text') {
              return content.text;
            }
            if (content.type === 'text') {
              return content.text;
            }
          }
        }
      }
    }
    
    throw new AppError('Unable to extract text content from OpenAI Responses API', 'API_ERROR');
  }
  
  /**
   * Convert messages array to input format for Responses API
   */
  private convertMessagesToInput(messages: Message[]): any {
    // If just one message, return it directly with role and content
    if (messages.length === 1) {
      return { role: messages[0].role, content: messages[0].content };
    }
    
    // Otherwise return an array
    return messages.map(({ role, content }) => ({ role, content }));
  }
  
  /**
   * Check if a model is compatible with the Responses API
   */
  private isResponsesCompatibleModel(model: string): boolean {
    // Only certain OpenAI models work with the Responses API
    const compatibleModels = [
      'gpt-4o',
      'gpt-4o-mini',
      'o1',
      'o1-mini',
      'o3-mini',
      'chatgpt-4o-latest'
    ];
    
    // Check if model name contains any of the compatible models
    return compatibleModels.some(compatibleModel => 
      model.includes(compatibleModel)
    );
  }
}

export function createOpenAIAdapter(apiKey?: string): AIProviderAdapter {
  return new OpenAIAdapter(apiKey);
}