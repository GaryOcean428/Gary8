import { HTTPClient } from './http';
import { RateLimiter } from './rate-limiter';
import { config } from './config';
import { AppError } from './errors/AppError';
import { thoughtLogger } from './logging/thought-logger';
import type { Message } from './types';
import { ModelRouter } from './routing/router';

export class APIClient {
  private httpClient: HTTPClient;
  private rateLimiter: RateLimiter;
  private router: ModelRouter;

  constructor() {
    this.httpClient = new HTTPClient('', {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    this.rateLimiter = new RateLimiter({
      maxRequests: 50,
      interval: 60 * 1000 // 1 minute
    });

    this.router = new ModelRouter();
  }

  async chat(
    messages: Message[], 
    onProgress?: (content: string) => void
  ): Promise<Message> {
    await this.rateLimiter.acquire();

    try {
      // Route to appropriate model
      const routerConfig = await this.router.route(messages[0].content, messages);
      thoughtLogger.log('decision', `Selected model: ${routerConfig.model}`, {
        confidence: routerConfig.confidence
      });

      // Get appropriate API configuration
      const apiConfig = this.getAPIConfig(routerConfig.model);
      
      // Validate API key
      if (!apiConfig.apiKey) {
        throw new AppError(
          `API key not configured for model ${routerConfig.model}`,
          'API_ERROR'
        );
      }

      const response = await this.httpClient.fetch(apiConfig.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messages.map(({ role, content }) => ({ role, content })),
          model: routerConfig.model,
          temperature: routerConfig.temperature,
          max_tokens: routerConfig.maxTokens,
          stream: Boolean(onProgress)
        })
      });

      if (onProgress && response.body) {
        return this.handleStreamingResponse(response.body, onProgress, routerConfig.model);
      }

      const data = await response.json();
      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.choices[0]?.message?.content || '',
        timestamp: Date.now(),
        model: routerConfig.model
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

  private async handleStreamingResponse(
    body: ReadableStream<Uint8Array>,
    onProgress: (content: string) => void,
    model: string
  ): Promise<Message> {
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
              thoughtLogger.log('error', 'Failed to parse streaming response', { error: e });
            }
          }
        }
      }

      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
        model
      };
    } finally {
      reader.releaseLock();
    }
  }

  private getAPIConfig(model: string): { endpoint: string; apiKey: string } {
    if (model.startsWith('llama')) {
      return {
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: config.apiKeys.groq
      };
    }
    if (model === 'grok-beta') {
      return {
        endpoint: 'https://api.x.ai/v1/chat/completions',
        apiKey: config.apiKeys.xai
      };
    }
    if (model.includes('sonar')) {
      return {
        endpoint: 'https://api.perplexity.ai/chat/completions',
        apiKey: config.apiKeys.perplexity
      };
    }
    if (model.includes('granite')) {
      return {
        endpoint: `https://api-inference.huggingface.co/models/${model}`,
        apiKey: config.apiKeys.huggingface
      };
    }
    throw new AppError(`Unsupported model: ${model}`, 'API_ERROR');
  }
}