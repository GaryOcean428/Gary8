import { RetryHandler } from './utils/RetryHandler';
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
  private retryHandler: RetryHandler;

  constructor(baseUrl = '', defaultOptions: RequestOptions = {}) {
    this.baseUrl = baseUrl;
    this.defaultOptions = {
      timeout: 30000, // 30 seconds default
      retries: 3,
      retryDelay: 1000,
      headers: {
        'Content-Type': 'application/json'
      },
      ...defaultOptions,
    };
    this.cache = new Map();
    this.retryHandler = new RetryHandler({
      maxRetries: defaultOptions.retries || 3,
      initialDelay: defaultOptions.retryDelay || 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      jitterFactor: 0.1
    });
  }

  async fetch<T>(
    url: string,
    options: RequestOptions = {},
    cacheOptions?: CacheOptions
  ): Promise<T> {
    const fullUrl = this.baseUrl + url;
    const finalOptions = { ...this.defaultOptions, ...options };

    // Check cache first if cache options provided
    if (cacheOptions) {
      const cacheKey = cacheOptions.key || fullUrl;
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) return cached;
    }

    try {
      // Use retry handler for automatic retry with exponential backoff
      return await this.retryHandler.execute(async () => {
        thoughtLogger.log('execution', `HTTP Request: ${finalOptions.method || 'GET'} ${fullUrl}`);
        
        const response = await this.timeoutFetch(fullUrl, finalOptions);

        if (!response.ok) {
          // Get specific error info for Groq API
          if (fullUrl.includes('groq.com')) {
            const errorText = await response.text();
            try {
              const errorData = JSON.parse(errorText);
              throw new AppError(
                `Groq API error: ${errorData.error?.message || response.statusText}`,
                'API_ERROR',
                { status: response.status, error: errorData }
              );
            } catch (parseError) {
              // If JSON parsing fails, use the original error text
              throw new AppError(
                `Groq API error: ${errorText || response.statusText}`,
                'API_ERROR',
                { status: response.status }
              );
            }
          }

          // Default error handling for other APIs
          const errorData = await response.json().catch(() => ({}));
          throw new AppError(
            `HTTP request failed with status ${response.status}: ${errorData.error?.message || response.statusText}`,
            'API_ERROR',
            { status: response.status, ...errorData }
          );
        }

        // Safely handle empty responses
        const contentType = response.headers.get('content-type');
        let data: any;
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          // Try to parse as JSON anyway, in case Content-Type header is wrong
          try {
            data = JSON.parse(text);
          } catch (e) {
            // Not JSON, return as text
            data = { text };
          }
        }
        
        // Cache response if cache options provided
        if (cacheOptions) {
          const cacheKey = cacheOptions.key || fullUrl;
          this.setCache(cacheKey, data, cacheOptions.ttl);
        }

        thoughtLogger.log('success', 'HTTP request successful');
        return data;
      });
    } catch (error) {
      thoughtLogger.log('error', 'HTTP request failed after retries', { error });
      
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

  private async timeoutFetch(
    url: string,
    options: RequestOptions
  ): Promise<Response> {
    const { timeout = 30000, ...fetchOptions } = options;

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
    
    // Cleanup old cache entries if cache gets too large (more than 100 entries)
    if (this.cache.size > 100) {
      const now = Date.now();
      const keysToDelete = Array.from(this.cache.entries())
        .filter(([_, value]) => value.expires < now)
        .map(([key]) => key);
      
      keysToDelete.forEach(key => this.cache.delete(key));
    }
  }
  
  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Clear specific cache entry
   * @param key Cache key to clear
   */
  clearCacheEntry(key: string): void {
    this.cache.delete(this.baseUrl + key);
  }
}