/**
 * X.AI API client implementation
 */
import { BaseAPI } from '../base-api';
import { Message } from '../../types';
import { AppError } from '../../errors/AppError';
import { thoughtLogger } from '../../logging/thought-logger';
import { xaiConfig } from './config';
import { ConfigValidator } from './config-validator';
import { RateLimiter } from './rate-limiter';
import type { XAIRequestOptions, ChatResponse } from './types';

export class XaiAPI extends BaseAPI {
  private static instance: XaiAPI;
  private rateLimiter: RateLimiter;
  protected baseUrl = xaiConfig.baseUrl;
  protected apiKey = xaiConfig.apiKey;

  private constructor() {
    super();
    try {
      ConfigValidator.validateConfig(xaiConfig);
      this.rateLimiter = new RateLimiter(
        xaiConfig.rateLimits.requestsPerMinute,
        xaiConfig.rateLimits.tokensPerMinute
      );
      thoughtLogger.log('success', 'X.AI API initialized successfully');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize X.AI API', { error });
      throw error;
    }
  }

  static getInstance(): XaiAPI {
    if (!XaiAPI.instance) {
      XaiAPI.instance = new XaiAPI();
    }
    return XaiAPI.instance;
  }

  /**
   * Sends a chat completion request
   * @param messages Chat messages
   * @param onProgress Optional progress callback for streaming
   * @param options Request options
   * @returns Promise resolving to response content
   */
  async chat(
    messages: Message[],
    onProgress?: (content: string) => void,
    options: XAIRequestOptions = {}
  ): Promise<string> {
    try {
      const estimatedTokens = this.estimateTokenCount(messages);
      await this.rateLimiter.checkRateLimit(estimatedTokens);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-API-Version': xaiConfig.apiVersion
        },
        body: JSON.stringify({
          model: options.model || xaiConfig.defaultModel,
          messages: messages.map(({ role, content }) => ({ role, content })),
          temperature: options.temperature ?? xaiConfig.temperature,
          max_tokens: options.maxTokens ?? xaiConfig.maxTokens,
          stream: Boolean(onProgress)
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AppError(
          `X.AI API error: ${errorData.error?.message || response.statusText}`,
          'API_ERROR',
          { status: response.status, ...errorData }
        );
      }

      if (onProgress && response.body) {
        return this.handleStream(response, onProgress);
      }

      const { data } = await this.request<ChatResponse>('/chat/completions', {
        method: 'POST',
        body: {
          model: options.model || xaiConfig.defaultModel,
          messages: messages.map(({ role, content }) => ({ role, content })),
          temperature: options.temperature ?? xaiConfig.temperature,
          max_tokens: options.maxTokens ?? xaiConfig.maxTokens
        }
      });

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

  private estimateTokenCount(messages: Message[]): number {
    return messages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
  }
}