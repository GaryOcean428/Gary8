import { config } from './config';
import { StreamProcessor } from './streaming';

export class XAIClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(
    _messages: Array<{ role: string; content: string }>,
    _onProgress?: (content: string) => void
  ): Promise<void> {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        _messages,
        model: config.defaultModel,
        stream: Boolean(_onProgress),
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error('Chat API request failed');
    }

    if (_onProgress && response.body) {
      const reader = response.body.getReader();
      const processor = new StreamProcessor(_onProgress);
      await processor.processStream(reader);
    }
  }
}