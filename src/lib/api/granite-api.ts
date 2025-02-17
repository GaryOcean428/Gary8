import { HfInference } from '@huggingface/inference';
import { AppError } from '../errors/AppError';
import { config } from '../config';
import type { Message } from '../types';

export class GraniteAPI {
  private static instance: GraniteAPI;
  private hf: HfInference;
  private readonly model = 'IBM/granite-13b-chat-v1';

  private constructor() {
    if (!config.apiKeys.huggingface) {
      throw new AppError('Missing Hugging Face API key', 'CONFIG_ERROR');
    }
    this.hf = new HfInference(config.apiKeys.huggingface);
  }

  static getInstance(): GraniteAPI {
    if (!GraniteAPI.instance) {
      GraniteAPI.instance = new GraniteAPI();
    }
    return GraniteAPI.instance;
  }

  async chat(messages: Message[]): Promise<string> {
    try {
      const formattedPrompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: formattedPrompt,
        parameters: {
          max_new_tokens: 1024,
          temperature: 0.7,
          return_full_text: false
        }
      });
      return response.generated_text;
    } catch (error) {
      throw new AppError('Granite API request failed', 'API_ERROR', { originalError: error });
    }
  }
}
