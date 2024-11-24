import { thoughtLogger } from '../logging/thought-logger';
import type { RouterConfig } from '../routing/router';
import { config } from '../config';

interface ModelResponse {
  content: string;
  model: string;
  confidence: number;
}

export class ModelConnector {
  private static instance: ModelConnector;
  private modelEndpoints: Map<string, string> = new Map([
    ['grok-beta', 'https://api.x.ai/v1/chat/completions'],
    ['llama-3.2-70b-preview', 'https://api.groq.com/openai/v1/chat/completions'],
    ['llama-3.2-7b-preview', 'https://api.groq.com/openai/v1/chat/completions'],
    ['llama-3.2-3b-preview', 'https://api.groq.com/openai/v1/chat/completions'],
    ['ibm-granite/granite-3b-code-base-2k', 'https://api-inference.huggingface.co/models/ibm-granite/granite-3b-code-base-2k']
  ]);

  private constructor() {}

  static getInstance(): ModelConnector {
    if (!ModelConnector.instance) {
      ModelConnector.instance = new ModelConnector();
    }
    return ModelConnector.instance;
  }

  async routeToModel(
    messages: Array<{ role: string; content: string }>,
    routerConfig: RouterConfig,
    onProgress?: (content: string) => void
  ): Promise<ModelResponse> {
    const endpoint = this.modelEndpoints.get(routerConfig.model);
    if (!endpoint) {
      throw new Error(`No endpoint found for model ${routerConfig.model}`);
    }

    thoughtLogger.log('plan', `Routing request to ${routerConfig.model}`, {
      modelUsed: routerConfig.model,
      confidence: routerConfig.confidence
    });

    try {
      if (routerConfig.model.includes('granite')) {
        return this.callHuggingFace(messages, routerConfig);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getApiKey(routerConfig.model)}`
        },
        body: JSON.stringify({
          messages,
          model: routerConfig.model,
          temperature: routerConfig.temperature,
          max_tokens: routerConfig.maxTokens,
          stream: Boolean(onProgress)
        })
      });

      if (!response.ok) {
        throw new Error(`Model API request failed: ${response.statusText}`);
      }

      if (onProgress && response.body) {
        return this.handleStreamingResponse(response.body, routerConfig, onProgress);
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        model: routerConfig.model,
        confidence: routerConfig.confidence
      };
    } catch (error) {
      thoughtLogger.log('critique', `Model request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async callHuggingFace(
    messages: Array<{ role: string; content: string }>,
    routerConfig: RouterConfig
  ): Promise<ModelResponse> {
    const combinedMessage = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const response = await fetch(this.modelEndpoints.get(routerConfig.model)!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKeys.huggingface}`
      },
      body: JSON.stringify({
        inputs: combinedMessage,
        parameters: {
          max_new_tokens: routerConfig.maxTokens,
          temperature: routerConfig.temperature,
          return_full_text: false
        }
      })
    });

    const data = await response.json();
    return {
      content: data[0].generated_text,
      model: routerConfig.model,
      confidence: routerConfig.confidence
    };
  }

  private async handleStreamingResponse(
    body: ReadableStream<Uint8Array>,
    routerConfig: RouterConfig,
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
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onProgress(content);
              }
            } catch (e) {
              console.error('Failed to parse streaming response:', e);
            }
          }
        }
      }

      return {
        content: fullContent,
        model: routerConfig.model,
        confidence: routerConfig.confidence
      };
    } finally {
      reader.releaseLock();
    }
  }

  private getApiKey(model: string): string {
    if (model === 'grok-beta') {
      return config.apiKeys.xai;
    }
    if (model.includes('llama')) {
      return config.apiKeys.groq;
    }
    if (model.includes('granite')) {
      return config.apiKeys.huggingface;
    }
    throw new Error(`No API key found for model ${model}`);
  }
}