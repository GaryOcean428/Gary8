/**
 * Base API client with common functionality for all API integrations
 * @abstract
 */
import { thoughtLogger } from '../logging/thought-logger';
import { AppError } from '../errors/AppError';
import type { APIResponse, RequestOptions } from './types';

export abstract class BaseAPI {
  protected abstract baseUrl: string;
  protected abstract apiKey: string;

  /**
   * Makes an authenticated API request
   * @template T Response data type
   * @param endpoint API endpoint path
   * @param options Request options
   * @returns Promise resolving to response data
   * @throws {AppError} On request failure
   */
  protected async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<APIResponse<T>> {
    const { method = 'GET', body, headers = {}, signal } = options;

    try {
      thoughtLogger.log('execution', `API Request: ${method} ${endpoint}`);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...headers
        },
        ...(body && { body: JSON.stringify(body) }),
        signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AppError(
          `API request failed: ${errorData.error?.message || response.statusText}`,
          'API_ERROR',
          { status: response.status, ...errorData }
        );
      }

      const data = await response.json();
      thoughtLogger.log('success', 'API request successful');

      return {
        data,
        headers: Object.fromEntries(response.headers.entries()),
        status: response.status
      };
    } catch (error) {
      thoughtLogger.log('error', 'API request failed', { error });
      
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to communicate with API',
        'API_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * Handles streaming responses
   * @param response Fetch Response object
   * @param onProgress Progress callback
   * @returns Promise resolving to complete response content
   */
  protected async handleStream(
    response: Response,
    onProgress?: (content: string) => void
  ): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new AppError('No response body available for streaming', 'STREAM_ERROR');
    }

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
                onProgress?.(content);
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