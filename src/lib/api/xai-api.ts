import { BaseAPI } from './base-api';
import { AppError } from '../errors/AppError';
import { thoughtLogger } from '../logging/thought-logger';
import type { Message } from '../types';

export class XaiAPI extends BaseAPI {
  private static instance: XaiAPI;

  private constructor() {
    super();
    if (!this.config.apiKeys.xai) {
      thoughtLogger.log('warning', 'X.AI API key not configured');
    }
  }

  static getInstance(): XaiAPI {
    if (!XaiAPI.instance) {
      XaiAPI.instance = new XaiAPI();
    }
    return XaiAPI.instance;
  }

  async chat(
    messages: Message[], 
    onProgress?: (content: string) => void,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    if (!this.config.apiKeys.xai) {
      throw new AppError('X.AI API key not configured', 'API_ERROR');
    }

    try {
      const response = await fetch(`${this.config.services.xai.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKeys.xai}`,
          'Content-Type': 'application/json',
          'X-API-Version': this.config.services.xai.apiVersion
        },
        body: JSON.stringify({
          model: options.model || this.config.services.xai.defaultModel,
          messages: messages.map(({ role, content }) => ({ role, content })),
          temperature: options.temperature || this.config.services.xai.temperature,
          max_tokens: options.maxTokens || this.config.services.xai.maxTokens,
          stream: Boolean(onProgress)
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AppError(
          `X.AI API error: ${errorData.error?.message || response.statusText}`,
          'API_ERROR',
          { status: response.status, ...errorData }
        );
      }

      if (onProgress && response.body) {
        return this.handleStreamingResponse(response.body, onProgress);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      thoughtLogger.log('error', 'X.AI API request failed', { error });
      throw error instanceof AppError ? error : new AppError(
        'Failed to communicate with X.AI API',
        'API_ERROR',
        { originalError: error }
      );
    }
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
              const content = parsed.choices[0]?.delta?.content;
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
}