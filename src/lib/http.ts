import { AppError } from './errors/AppError';
import { thoughtLogger } from './logging/thought-logger';

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface CacheOptions {
  ttl: number;
  key?: string;
}

export class HTTPClient {
  private baseUrl: string;
  private defaultOptions: RequestOptions;
  private cache: Map<string, { data: unknown; expires: number }>;

  constructor(baseUrl = '', defaultOptions: RequestOptions = {}) {
    this.baseUrl = baseUrl;
    this.defaultOptions = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...defaultOptions,
    };
    this.cache = new Map();
  }

  async fetch<T>(
    url: string,
    options: RequestOptions = {},
    cacheOptions?: CacheOptions
  ): Promise<T> {
    const fullUrl = this.baseUrl + url;
    const finalOptions = { ...this.defaultOptions, ...options };

    if (cacheOptions) {
      const cached = this.getFromCache<T>(cacheOptions.key || fullUrl);
      if (cached) return cached;
    }

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= finalOptions.retries!; attempt++) {
      try {
        thoughtLogger.log('execution', `HTTP Request: ${finalOptions.method || 'GET'} ${fullUrl}`, {
          attempt: attempt + 1
        });

        const response = await this.timeoutFetch(fullUrl, finalOptions);

        if (!response.ok) {
          throw new AppError(
            `HTTP request failed with status ${response.status}`,
            'API_ERROR',
            await response.text()
          );
        }

        const data = await response.json();

        if (cacheOptions) {
          this.setCache(
            cacheOptions.key || fullUrl,
            data,
            cacheOptions.ttl
          );
        }

        thoughtLogger.log('success', 'HTTP request successful');
        return data;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < finalOptions.retries!) {
          thoughtLogger.log('warning', `Request failed, retrying... (${attempt + 1}/${finalOptions.retries})`, {
            error
          });
          await new Promise(resolve => 
            setTimeout(resolve, finalOptions.retryDelay)
          );
          continue;
        }
        break;
      }
    }

    thoughtLogger.log('error', 'All request attempts failed', { lastError });
    throw lastError || new Error('Request failed');
  }

  private async timeoutFetch(
    url: string,
    options: RequestOptions
  ): Promise<Response> {
    const { timeout = 10000, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  private setCache(key: string, data: unknown, ttl: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
    });
  }
}