import { config } from './config';
import { StreamProcessor } from './streaming';

export class XAIClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    onProgress?: (content: string) => void
  ): Promise<void> {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        messages,
        model: config.defaultModel,
        stream: Boolean(onProgress),
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error('Chat API request failed');
    }

    if (onProgress && response.body) {
      const reader = response.body.getReader();
      const processor = new StreamProcessor(onProgress);
      await processor.processStream(reader);
    }
  }
}