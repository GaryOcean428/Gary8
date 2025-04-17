import { thoughtLogger } from '../logging/thought-logger';
import { AppError } from '../errors/AppError';
import { RetryHandler } from '../utils/RetryHandler';
import type { Message } from '../types';
import type { StreamingMetrics } from '../utils/PerformanceMonitor';

export class OpenAIAPI {
  private static instance: OpenAIAPI;
  private retryHandler: RetryHandler;
  private baseUrl: string = 'https://api.openai.com';
  
  private constructor() {
    this.retryHandler = new RetryHandler({
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2
    });
  }
  
  static getInstance(): OpenAIAPI {
    if (!OpenAIAPI.instance) {
      OpenAIAPI.instance = new OpenAIAPI();
    }
    return OpenAIAPI.instance;
  }

  /**
   * Make a request to the OpenAI API using the appropriate API version
   * @param messages Messages to be sent
   * @param apiKey OpenAI API key
   * @param options Request options
   * @param onProgress Progress callback for streaming
   * @returns The response content
   */
  async chat(
    messages: Message[],
    apiKey: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      tools?: Record<string, any>;
      responseFormat?: 'json' | 'text';
      reasoning?: { effort?: number };
    } = {},
    onProgress?: (content: string) => void
  ): Promise<string> {
    if (!apiKey) {
      throw new AppError('OpenAI API key not configured', 'API_ERROR');
    }
    
    const isResponsesSupported = this.isResponsesCompatibleModel(options.model || 'gpt-4o');
    
    try {
      // Use the Responses API for supported models, fall back to Chat Completions for others
      if (isResponsesSupported) {
        return await this.chatWithResponsesAPI(messages, apiKey, options, onProgress);
      } else {
        return await this.chatWithCompletionsAPI(messages, apiKey, options, onProgress);
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
        return await this.chatWithCompletionsAPI(messages, apiKey, options, onProgress);
      }
      
      throw error;
    }
  }
  
  /**
   * Make a request using the new Responses API
   */
  private async chatWithResponsesAPI(
    messages: Message[],
    apiKey: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      tools?: Record<string, any>;
      responseFormat?: 'json' | 'text';
      reasoning?: { effort?: number };
    },
    onProgress?: (content: string) => void
  ): Promise<string> {
    thoughtLogger.log('execution', 'Using OpenAI Responses API', { model: options.model });
    
    // Convert from messages to input format for Responses API
    const input = this.convertMessagesToInput(messages);
    
    // Build request body
    const requestBody: any = {
      model: options.model || 'gpt-4o',
      input,
      stream: Boolean(onProgress)
    };
    
    // Add optional parameters
    if (options.temperature !== undefined) requestBody.temperature = options.temperature;
    if (options.maxTokens !== undefined) requestBody.max_tokens = options.maxTokens;
    if (options.tools) requestBody.tools = options.tools;
    if (options.responseFormat) {
      requestBody.text = { format: options.responseFormat };
    }
    if (options.reasoning && options.reasoning.effort !== undefined) {
      requestBody.reasoning = { effort: options.reasoning.effort };
    }
    
    return await this.retryHandler.execute(async () => {
      const response = await fetch(`${this.baseUrl}/v1/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
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
    apiKey: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      tools?: Record<string, any>;
      responseFormat?: 'json' | 'text';
    },
    onProgress?: (content: string) => void
  ): Promise<string> {
    thoughtLogger.log('execution', 'Using OpenAI Chat Completions API', { model: options.model });
    
    // Build request body for Chat Completions API
    const requestBody: any = {
      model: options.model || 'gpt-4o',
      messages: messages.map(({ role, content }) => ({ role, content })),
      stream: Boolean(onProgress)
    };
    
    // Add optional parameters
    if (options.temperature !== undefined) requestBody.temperature = options.temperature;
    if (options.maxTokens !== undefined) requestBody.max_tokens = options.maxTokens;
    
    // Convert tools to functions if present
    if (options.tools) {
      requestBody.functions = Object.entries(options.tools).map(([name, schema]) => ({
        name,
        parameters: schema
      }));
    }
    
    if (options.responseFormat) {
      requestBody.response_format = { type: options.responseFormat === 'json' ? 'json_object' : 'text' };
    }
    
    return await this.retryHandler.execute(async () => {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
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
    onProgress: (content: string) => void,
    metrics?: StreamingMetrics
  ): Promise<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let startTime = Date.now();
    let chunkCount = 0;
    
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
                chunkCount++;
              }
              // Also handle text chunks
              else if (parsed.type === 'text') {
                fullContent += parsed.text;
                onProgress(parsed.text);
                chunkCount++;
              }
            } catch (e) {
              thoughtLogger.log('error', 'Failed to parse streaming response', { error: e });
            }
          }
        }
      }
      
      // Log streaming metrics
      if (metrics) {
        metrics.streamDuration = Date.now() - startTime;
        metrics.contentSize = fullContent.length;
        metrics.chunkCount = chunkCount;
        metrics.avgChunkSize = fullContent.length / Math.max(1, chunkCount);
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

// Export singleton instance
export const openaiAPI = OpenAIAPI.getInstance();