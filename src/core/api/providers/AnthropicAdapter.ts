import { AIProviderAdapter, ChatOptions } from '../AIProviderAdapter';
import { Message } from '../../../types';
import { AppError } from '../../../lib/errors/AppError';
import { thoughtLogger } from '../../../lib/logging/thought-logger';
import { RetryHandler } from '../../../shared/utils/RetryHandler';

export class AnthropicAdapter implements AIProviderAdapter {
  name = 'Anthropic';
  private apiKey: string = '';
  private baseUrl: string = 'https://api.anthropic.com/v1';
  private retryHandler: RetryHandler;
  
  constructor(apiKey?: string) {
    this.retryHandler = new RetryHandler();
    
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
  
  getAvailableModels(): string[] {
    return [
      'claude-3-7-sonnet-20250219',
      'claude-3.5-sonnet-latest',
      'claude-3.5-haiku-latest'
    ];
  }
  
  async isApiKeyValid(): Promise<{success: boolean; message: string}> {
    if (!this.apiKey) {
      return {
        success: false,
        message: 'Anthropic API key not provided'
      };
    }
    
    try {
      // Claude API doesn't have a dedicated endpoint for API key validation
      // We'll make a minimal messages request instead
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3.5-haiku-latest',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        })
      });
      
      if (response.ok) {
        return {
          success: true,
          message: 'Successfully connected to Anthropic API'
        };
      } else {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          message: `Failed to connect to Anthropic API: ${response.status} ${response.statusText}${
            error.error ? ` - ${error.error}` : ''
          }`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error testing connection to Anthropic API: ${
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
      throw new AppError('Anthropic API key not configured', 'API_ERROR');
    }

    return await this.retryHandler.execute(async () => {
      const body = {
        model: options?.model || 'claude-3.5-haiku-latest',
        max_tokens: options?.maxTokens || 4096,
        messages: messages.map(({ role, content }) => ({ role, content })),
        temperature: options?.temperature,
        stream: Boolean(onProgress)
      };

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AppError(
          `Anthropic API error: ${response.status} ${response.statusText}${
            errorData.error ? ` - ${errorData.error}` : ''
          }`,
          'API_ERROR',
          { status: response.status, ...errorData }
        );
      }
      
      // Handle streaming
      if (onProgress && response.body) {
        return await this.handleStreamingResponse(response.body, onProgress);
      }
      
      // Parse normal response
      const data = await response.json();
      return data.content[0]?.text || '';
    });
  }
  
  private async handleStreamingResponse(
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
              if (parsed.type === 'content_block_delta' && parsed.delta.text) {
                const content = parsed.delta.text;
                fullContent += content;
                onProgress(content);
              } else if (parsed.type === 'message_stop') {
                // End of message
              }
            } catch (e) {
              thoughtLogger.log('error', 'Failed to parse Anthropic streaming response', { error: e });
            }
          }
        }
      }
      
      return fullContent;
    } finally {
      reader.releaseLock();
    }
  }
}

export function createAnthropicAdapter(apiKey?: string): AIProviderAdapter {
  return new AnthropicAdapter(apiKey);
}