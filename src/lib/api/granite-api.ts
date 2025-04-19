import { BaseAPI } from './base-api';
import { AppError } from '../errors/AppError';
import { thoughtLogger } from '../logging/thought-logger';
import type { Message } from '../types';

export class GraniteAPI extends BaseAPI {
  private static instance: GraniteAPI;

  private constructor() {
    super();
    if (!this.config.apiKeys.huggingface) {
      thoughtLogger.log('warning', 'Hugging Face API key not configured');
    }
  }

  static getInstance(): GraniteAPI {
    if (!GraniteAPI.instance) {
      GraniteAPI.instance = new GraniteAPI();
    }
    return GraniteAPI.instance;
  }

  async chat(_messages: Message[], _onProgress?: (content: string) => void): Promise<string> {
    if (!this.config.apiKeys.huggingface) {
      throw new AppError('Hugging Face API key not configured', 'API_ERROR');
    }

    try {
      const combinedMessage = _messages.map(_m => `${_m.role}: ${_m.content}`).join('\n');

      const response = await fetch(
        `${this.config.services.huggingface.baseUrl}/${this.config.services.huggingface.models.granite}`,
        {
          method: 'POST',
          headers: this.getHeaders(this.config.apiKeys.huggingface),
          body: JSON.stringify({
            inputs: combinedMessage,
            parameters: {
              max_new_tokens: this.config.services.huggingface.maxTokens,
              temperature: this.config.services.huggingface.temperature,
              return_full_text: false,
              stream: Boolean(_onProgress)
            }
          })
        }
      );

      if (!response.ok) {
        throw new AppError(
          `Granite API error: ${response.statusText}`,
          'API_ERROR',
          { status: response.status }
        );
      }

      if (_onProgress && response.body) {
        return this.handleStreamingResponse(response.body, _onProgress);
      }

      const data = await response.json();
      return data[0].generated_text;
    } catch (error) {
      thoughtLogger.log('error', 'Granite API request failed', { error });
      throw error instanceof AppError ? error : new AppError(
        'Failed to communicate with Granite API',
        'API_ERROR',
        { originalError: error }
      );
    }
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
          if (!line) continue;

          try {
            const parsed = JSON.parse(line);
            const content = parsed[0]?.generated_text;
            if (content) {
              const newContent = content.slice(fullContent.length);
              fullContent = content;
              _onProgress(newContent);
            }
          } catch (e) {
            thoughtLogger.log('error', 'Failed to parse streaming response', { error: e });
          }
        }
      }

      return fullContent;
    } finally {
      reader.releaseLock();
    }
  }
}