import { AIProviderAdapter, ChatOptions } from '../AIProviderAdapter';
import { Message } from '../../../types';
import { AppError } from '../../../lib/errors/AppError';
import { thoughtLogger } from '../../../lib/logging/thought-logger';
import { RetryHandler } from '../../../shared/utils/RetryHandler';

export class GroqAdapter implements AIProviderAdapter {
  name = 'Groq';
  private apiKey: string = '';
  private baseUrl: string = 'https://api.groq.com/openai/v1';
  private retryHandler: RetryHandler;
  
  constructor(apiKey?: string) {
    this.retryHandler = new RetryHandler({
      maxRetries: 3,
      initialDelay: 500,
      maxDelay: 5000,
      backoffFactor: 2
    });
    
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  setApiKey(_apiKey: string): void {
    this.apiKey = _apiKey;
  }
  
  async getAvailableModels(): Promise<string[]> {
    if (!this.apiKey) {
      return this.getDefaultModels();
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        return this.getDefaultModels();
      }
      
      const data = await response.json();
      return data.data?.map((_model: unknown) => _model.id) || this.getDefaultModels();
    } catch (error) {
      return this.getDefaultModels();
    }
  }
  
  private getDefaultModels(): string[] {
    return [
      'llama-3.3-70b-versatile',
      'llama3-8b-8192',
      'llama3-groq-70b-8192-tool-use-preview',
      'llama-3.2-90b-vision-preview',
      'llama-3.2-11b-vision-preview',
      'llama-3.2-11b-text-preview'
    ];
  }
  
  async isApiKeyValid(): Promise<{success: boolean; message: string}> {
    if (!this.apiKey) {
      return {
        success: false,
        message: 'Groq API key not provided'
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
          message: 'Successfully connected to Groq API'
        };
      } else {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          message: `Failed to connect to Groq API: ${response.status} ${response.statusText}${
            error.error?.message ? ` - ${error.error.message}` : ''
          }`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error testing connection to Groq API: ${
          error instanceof Error ? error.message : String(error)
        }`
      };
    }
  }

  async chat(
    _messages: Message[],
    _onProgress?: (content: string) => void,
    _options?: ChatOptions
  ): Promise<string> {
    if (!this.apiKey) {
      throw new AppError('Groq API key not configured', 'API_ERROR');
    }

    return await this.retryHandler.execute(async () => {
      const requestBody = {
        model: _options?.model || 'llama-3.3-70b-versatile',
        messages: _messages.map(({ role, content }) => ({ role, content })),
        temperature: _options?.temperature ?? 0.7,
        max_tokens: _options?.maxTokens ?? 8192,
        top_p: _options?.topP ?? 1,
        frequency_penalty: _options?.frequencyPenalty ?? 0,
        presence_penalty: _options?.presencePenalty ?? 0,
        stream: Boolean(_onProgress)
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AppError(
          `Groq API error: ${response.status} ${response.statusText}${
            errorData.error?.message ? ` - ${errorData.error.message}` : ''
          }`,
          'API_ERROR',
          { status: response.status, ...errorData }
        );
      }
      
      // Handle streaming
      if (_onProgress && response.body) {
        return await this.handleStreamingResponse(response.body, _onProgress);
      }
      
      // Parse normal response
      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    });
  }
  
  private async handleStreamingResponse(
    _body: ReadableStream<Uint8Array>,
    _onProgress: (content: string) => void
  ): Promise<string> {
    const reader = _body.getReader();
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
              const content = parsed.choices[0]?.delta?.content;
              
              if (content) {
                fullContent += content;
                _onProgress(content);
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
  
  getModelInfo(_modelId: string): {
    name: string;
    contextWindow: number;
    description: string;
    tier: string;
  } | null {
    const modelMap: Record<string, {
      name: string;
      contextWindow: number;
      description: string;
      tier: string;
    }> = {
      'llama-3.3-70b-versatile': {
        name: 'Llama 3.3 70B',
        contextWindow: 128000,
        description: 'Versatile large language model',
        tier: 'Free'
      },
      'llama3-groq-70b-8192-tool-use-preview': {
        name: 'Llama 3 Tool Use',
        contextWindow: 8192,
        description: 'Specialized for function calling and tool use',
        tier: 'Pro'
      },
      'llama3-8b-8192': {
        name: 'Llama 3 8B',
        contextWindow: 8192,
        description: 'Fast, efficient smaller model',
        tier: 'Free'
      }
    };
    
    return modelMap[_modelId] || null;
  }
}

export function createGroqAdapter(_apiKey?: string): AIProviderAdapter {
  return new GroqAdapter(_apiKey);
}