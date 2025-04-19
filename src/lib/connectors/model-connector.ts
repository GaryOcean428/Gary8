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
    ['grok-3-beta', 'https://api.x.ai/v1/chat/completions'],
    ['grok-3-fast-beta', 'https://api.x.ai/v1/chat/completions'],
    ['grok-3-mini-beta', 'https://api.x.ai/v1/chat/completions'],
    ['grok-3-mini-fast-beta', 'https://api.x.ai/v1/chat/completions'],
    ['llama-3.3-70b-versatile', 'https://api.groq.com/openai/v1/chat/completions'],
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
    _messages: Array<{ role: string; content: string }>,
    _routerConfig: RouterConfig,
    _onProgress?: (content: string) => void
  ): Promise<ModelResponse> {
    const endpoint = this.modelEndpoints.get(_routerConfig.model);
    if (!endpoint) {
      throw new Error(`No endpoint found for model ${_routerConfig.model}`);
    }

    thoughtLogger.log('plan', `Routing request to ${_routerConfig.model}`, {
      modelUsed: _routerConfig.model,
      confidence: _routerConfig.confidence
    });

    try {
      if (_routerConfig.model.includes('granite')) {
        return this.callHuggingFace(_messages, _routerConfig);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getApiKey(_routerConfig.model)}`
        },
        body: JSON.stringify({
          _messages,
          model: _routerConfig.model,
          temperature: _routerConfig.temperature,
          max_tokens: _routerConfig.maxTokens,
          stream: Boolean(_onProgress)
        })
      });

      if (!response.ok) {
        throw new Error(`Model API request failed: ${response.statusText}`);
      }

      if (_onProgress && response.body) {
        return this.handleStreamingResponse(response.body, _routerConfig, _onProgress);
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        model: _routerConfig.model,
        confidence: _routerConfig.confidence
      };
    } catch (error) {
      thoughtLogger.log('critique', `Model request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async callHuggingFace(
    _messages: Array<{ role: string; content: string }>,
    _routerConfig: RouterConfig
  ): Promise<ModelResponse> {
    const combinedMessage = _messages.map(_m => `${_m.role}: ${_m.content}`).join('\n');

    const response = await fetch(this.modelEndpoints.get(_routerConfig.model)!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKeys.huggingface}`
      },
      body: JSON.stringify({
        inputs: combinedMessage,
        parameters: {
          max_new_tokens: _routerConfig.maxTokens,
          temperature: _routerConfig.temperature,
          return_full_text: false
        }
      })
    });

    const data = await response.json();
    return {
      content: data[0].generated_text,
      model: _routerConfig.model,
      confidence: _routerConfig.confidence
    };
  }

  private async handleStreamingResponse(
    _body: ReadableStream<Uint8Array>,
    _routerConfig: RouterConfig,
    _onProgress: (content: string) => void
  ): Promise<ModelResponse> {
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
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                fullContent += content;
                _onProgress(content);
              }
            } catch (e) {
              console.error('Failed to parse streaming response:', e);
            }
          }
        }
      }

      return {
        content: fullContent,
        model: _routerConfig.model,
        confidence: _routerConfig.confidence
      };
    } finally {
      reader.releaseLock();
    }
  }

  private getApiKey(_model: string): string {
    if (_model.startsWith('grok')) {
      return config.apiKeys.xai;
    }
    if (_model.includes('llama')) {
      return config.apiKeys.groq;
    }
    if (_model.includes('claude')) {
      return config.apiKeys.anthropic;
    }
    if (_model.includes('granite')) {
      return config.apiKeys.huggingface;
    }
    if (_model.includes('gpt') || _model.includes('o1') || _model.includes('o3')) {
      return config.apiKeys.openai;
    }
    if (_model.includes('sonar')) {
      return config.apiKeys.perplexity;
    }
    if (_model.includes('gemini')) {
      return config.apiKeys.google;
    }
    throw new Error(`No API key found for model ${_model}`);
  }
}