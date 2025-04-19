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
      // Don't rethrow, allow creation even with invalid config
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
   * @param _messages Chat messages
   * @param _onProgress Optional progress callback for streaming
   * @param _options Request options
   * @returns Promise resolving to response content
   */
  async chat(
    _messages: Message[],
    _onProgress?: (content: string) => void,
    _options: XAIRequestOptions = {}
  ): Promise<string> {
    try {
      // Check if API key is available
      if (!this.apiKey) {
        throw new AppError('X.AI API key not configured', 'API_ERROR');
      }
      
      const estimatedTokens = this.estimateTokenCount(_messages);
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
          model: _options.model || xaiConfig.models.beta,
          messages: _messages.map(({ role, content }) => ({ role, content })),
          temperature: _options.temperature ?? xaiConfig.temperature,
          max_tokens: _options.maxTokens ?? xaiConfig.maxTokens,
          stream: Boolean(_onProgress)
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

      if (_onProgress && response.body) {
        return this.handleStream(response, _onProgress);
      }

      const { data } = await this.request<ChatResponse>('/chat/completions', {
        method: 'POST',
        body: {
          model: _options.model || xaiConfig.models.beta,
          messages: _messages.map(({ role, content }) => ({ role, content })),
          temperature: _options.temperature ?? xaiConfig.temperature,
          max_tokens: _options.maxTokens ?? xaiConfig.maxTokens
        }
      });

      return data.choices[0].message.content;
    } catch (error) {
      thoughtLogger.log('error', 'X.AI API request failed', { error });
      
      // Provide fallback error message with suggestion
      const errorMessage = error instanceof AppError ? error.message : 'Failed to communicate with X.AI API';
      throw new AppError(
        `${errorMessage}. Please check your API key in the settings or try a different model.`,
        'API_ERROR',
        { originalError: error }
      );
    }
  }

  private estimateTokenCount(_messages: Message[]): number {
    return _messages.reduce((_sum, _msg) => _sum + Math.ceil(_msg.content.length / 4), 0);
  }
}