import { thoughtLogger } from '../logging/thought-logger';
import { config } from '../config';
import { APIError } from '../errors/AppError';
import { ModelRouter } from '../routing/router';

interface ModelResponse {
  content: string;
  model: string;
  confidence: number;
}

export class ModelAPI {
  private static instance: ModelAPI;
  private router: ModelRouter;

  private constructor() {
    this.router = new ModelRouter();
  }

  static getInstance(): ModelAPI {
    if (!ModelAPI.instance) {
      ModelAPI.instance = new ModelAPI();
    }
    return ModelAPI.instance;
  }

  async callModel(
    _messages: Array<{ role: string; content: string }>,
    _model: string,
    _onProgress?: (content: string) => void
  ): Promise<ModelResponse> {
    thoughtLogger.log('execution', `Calling model: ${_model}`);

    // Validate API keys
    if (_model.startsWith('llama') && !config.apiKeys.groq) {
      throw new APIError('Groq API key not configured', 401);
    }
    if (_model.startsWith('grok') && !config.apiKeys.xai) {
      throw new APIError('X.AI API key not configured', 401);
    }
    if (_model.includes('sonar') && !config.apiKeys.perplexity) {
      throw new APIError('Perplexity API key not configured', 401);
    }

    const { endpoint, headers } = this.getEndpointConfig(_model);

    try {
      // Set up proper request based on the model provider
      let requestBody: any;
      
      // Anthropic has a different message format
      if (_model.includes('claude')) {
        requestBody = {
          _model,
          _messages,
          max_tokens: 4096,
          temperature: 0.7,
          stream: Boolean(_onProgress)
        };
      } else {
        // Standard OpenAI-compatible format for others
        requestBody = {
          _messages,
          _model,
          temperature: 0.7,
          max_tokens: 4096,
          stream: Boolean(_onProgress)
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          `Model API error: ${errorData.error?.message || response.statusText}`,
          response.status,
          errorData
        );
      }

      if (_onProgress && response.body) {
        return this.handleStreamingResponse(response.body, _model, _onProgress);
      }

      const data = await response.json();
      
      // Extract content based on model provider
      let content = '';
      if (_model.includes('claude')) {
        content = data.content?.[0]?.text || '';
      } else {
        content = data.choices?.[0]?.message?.content || '';
      }

      return {
        content,
        _model,
        confidence: 0.9
      };
    } catch (error) {
      if (error instanceof APIError) {
        thoughtLogger.log('error', `API Error: ${error.message}`, {
          status: error.statusCode,
          details: error.details
        });
        throw error;
      }

      thoughtLogger.log('error', `Unexpected error: ${error}`);
      throw new APIError(
        'Failed to communicate with model API',
        500,
        { originalError: error }
      );
    }
  }

  private getEndpointConfig(_model: string): { endpoint: string; headers: HeadersInit } {
    if (_model.startsWith('llama')) {
      return {
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${config.apiKeys.groq}`,
          'Content-Type': 'application/json'
        }
      };
    }

    if (_model.startsWith('grok')) {
      return {
        endpoint: 'https://api.x.ai/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${config.apiKeys.xai}`,
          'Content-Type': 'application/json'
        }
      };
    }

    if (_model.includes('sonar')) {
      return {
        endpoint: 'https://api.perplexity.ai/chat/completions',
        headers: {
          'Authorization': `Bearer ${config.apiKeys.perplexity}`,
          'Content-Type': 'application/json'
        }
      };
    }
    
    if (_model.includes('claude')) {
      return {
        endpoint: 'https://api.anthropic.com/v1/messages',
        headers: {
          'X-API-Key': config.apiKeys.anthropic,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      };
    }

    // Default to OpenAI
    return {
      endpoint: 'https://api.openai.com/v1/chat/completions', 
      headers: {
        'Authorization': `Bearer ${config.apiKeys.openai}`,
        'Content-Type': 'application/json'
      }
    };
  }

  private async handleStreamingResponse(
    _body: ReadableStream<Uint8Array>,
    _model: string,
    _onProgress: (content: string) => void
  ): Promise<ModelResponse> {
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
              
              // Handle different streaming formats
              let content;
              
              if (_model.includes('claude')) {
                // Anthropic streaming format
                content = parsed.delta?.text || parsed.content?.[0]?.text;
              } else {
                // OpenAI-compatible streaming format
                content = parsed.choices?.[0]?.delta?.content;
              }
              
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

      return {
        content: fullContent,
        _model,
        confidence: 0.9
      };
    } finally {
      reader.releaseLock();
    }
  }
}

// Export singleton instance for use throughout the application
export const modelAPI = ModelAPI.getInstance();