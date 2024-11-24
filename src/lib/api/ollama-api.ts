import { BaseAPI } from './base-api';
import { AppError } from '../errors/AppError';
import { thoughtLogger } from '../logging/thought-logger';
import type { Message } from '../types';

export class OllamaAPI extends BaseAPI {
  private static instance: OllamaAPI;
  private isInitialized: boolean = false;
  private connectionError: string | null = null;
  private retryTimeout: number | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  private constructor() {
    super();
    this.checkConnection();
  }

  static getInstance(): OllamaAPI {
    if (!OllamaAPI.instance) {
      OllamaAPI.instance = new OllamaAPI();
    }
    return OllamaAPI.instance;
  }

  private async checkConnection(): Promise<void> {
    try {
      thoughtLogger.log('execution', 'Checking Ollama connection');
      
      const response = await fetch(`${this.config.services.ollama.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000), // 5 second timeout
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
      
      if (!response.ok) {
        throw new Error('Ollama server responded with an error');
      }

      const data = await response.json();
      const hasModel = data.models?.some((model: any) => 
        model.name === this.config.services.ollama.models.granite
      );

      if (!hasModel) {
        this.handleConnectionError(
          'Granite model not found. Please ensure the model is available.'
        );
        return;
      }

      this.isInitialized = true;
      this.connectionError = null;
      this.retryCount = 0;
      thoughtLogger.log('success', 'Connected to Ollama server');
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.handleConnectionError(
          `Attempting to connect to Ollama server... (Attempt ${this.retryCount}/${this.maxRetries})`
        );
      } else {
        this.handleConnectionError(
          'Failed to connect to Ollama server. Please check the connection.'
        );
      }
    }
  }

  private handleConnectionError(message: string): void {
    this.isInitialized = false;
    this.connectionError = message;
    thoughtLogger.log('warning', message);

    // Retry connection every 30 seconds
    if (!this.retryTimeout) {
      this.retryTimeout = window.setTimeout(() => {
        this.retryTimeout = null;
        this.checkConnection();
      }, 30000);
    }
  }

  async chat(messages: Message[], onProgress?: (content: string) => void): Promise<string> {
    if (!this.isInitialized) {
      if (this.connectionError) {
        throw new AppError(this.connectionError, 'OLLAMA_ERROR');
      }
      throw new AppError('Ollama not initialized', 'OLLAMA_ERROR');
    }

    try {
      const response = await fetch(`${this.config.services.ollama.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          model: this.config.services.ollama.models.granite,
          messages: messages.map(({ role, content }) => ({ role, content })),
          stream: Boolean(onProgress),
          options: {
            temperature: this.config.services.ollama.temperature,
            num_predict: this.config.services.ollama.maxTokens
          }
        })
      });

      if (!response.ok) {
        throw new AppError(
          `Ollama API error: ${response.statusText}`,
          'API_ERROR',
          { status: response.status }
        );
      }

      if (onProgress && response.body) {
        return this.handleStreamingResponse(response.body, onProgress);
      }

      const data = await response.json();
      return data.message.content;
    } catch (error) {
      // If connection fails, mark as uninitialized and retry connection
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        this.isInitialized = false;
        this.checkConnection();
      }

      thoughtLogger.log('error', 'Ollama API request failed', { error });
      throw error instanceof AppError ? error : new AppError(
        'Failed to communicate with Ollama API',
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
          if (!line) continue;

          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              fullContent += parsed.message.content;
              onProgress(parsed.message.content);
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

  async isAvailable(): Promise<boolean> {
    if (this.connectionError) {
      await this.checkConnection();
    }
    return this.isInitialized;
  }

  getConnectionError(): string | null {
    return this.connectionError;
  }

  cleanup(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }
}