import { thoughtLogger } from '../logging/thought-logger';
import { config } from '../config';
import { APIError } from '../errors/AppError';

interface ModelResponse {
  content: string;
  model: string;
  confidence: number;
}

export class ModelAPI {
  private static instance: ModelAPI;

  private constructor() {}

  static getInstance(): ModelAPI {
    if (!ModelAPI.instance) {
      ModelAPI.instance = new ModelAPI();
    }
    return ModelAPI.instance;
  }

  async callModel(
    messages: Array<{ role: string; content: string }>,
    model: string,
    onProgress?: (content: string) => void
  ): Promise<ModelResponse> {
    thoughtLogger.log('execution', `Calling model: ${model}`);

    // Validate API keys
    if (model.startsWith('llama') && !config.apiKeys.groq) {
      throw new APIError('Groq API key not configured', 401);
    }
    if (model === 'grok-beta' && !config.apiKeys.xai) {
      throw new APIError('X.AI API key not configured', 401);
    }
    if (model.includes('sonar') && !config.apiKeys.perplexity) {
      throw new APIError('Perplexity API key not configured', 401);
    }

    const { endpoint, headers } = this.getEndpointConfig(model);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages,
          model,
          temperature: 0.7,
          max_tokens: 4096,
          stream: Boolean(onProgress)
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          `Model API error: ${errorData.error?.message || response.statusText}`,
          response.status,
          errorData
        );
      }

      if (onProgress && response.body) {
        return this.handleStreamingResponse(response.body, model, onProgress);
      }

      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        throw new APIError(
          'Invalid response format from API',
          response.status,
          data
        );
      }

      return {
        content: data.choices[0].message.content,
        model,
        confidence: 0.9
      };
    } catch (error) {
      if (error instanceof APIError) {
        thoughtLogger.log('error', `API Error: ${error.message}`, {
          status: error.status,
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

  private getEndpointConfig(model: string): { endpoint: string; headers: HeadersInit } {
    if (model.startsWith('llama')) {
      return {
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${config.apiKeys.groq}`,
          'Content-Type': 'application/json'
        }
      };
    }

    if (model === 'grok-beta') {
      return {
        endpoint: 'https://api.x.ai/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${config.apiKeys.xai}`,
          'Content-Type': 'application/json'
        }
      };
    }

    if (model.includes('sonar')) {
      return {
        endpoint: 'https://api.perplexity.ai/chat/completions',
        headers: {
          'Authorization': `Bearer ${config.apiKeys.perplexity}`,
          'Content-Type': 'application/json'
        }
      };
    }

    throw new APIError(`Unsupported model: ${model}`, 400);
  }

  private async handleStreamingResponse(
    body: ReadableStream<Uint8Array>,
    model: string,
    onProgress: (content: string) => void
  ): Promise<ModelResponse> {
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
              thoughtLogger.log('error', 'Failed to parse streaming response', e);
            }
          }
        }
      }

      return {
        content: fullContent,
        model,
        confidence: 0.9
      };
    } finally {
      reader.releaseLock();
    }
  }
}