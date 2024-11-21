import { HfInference } from '@huggingface/inference';
import { thoughtLogger } from '../logging/thought-logger';
import { AppError } from '../errors/AppError';
import { config } from '../config';
import type { Message } from '../types';

export class QwenAPI {
  private static instance: QwenAPI;
  private hf: HfInference;
  private initialized = false;
  private readonly model = 'Qwen/Qwen2.5-Coder-32B-Instruct';

  private constructor() {
    this.hf = new HfInference(config.apiKeys.huggingface);
  }

  static getInstance(): QwenAPI {
    if (!QwenAPI.instance) {
      QwenAPI.instance = new QwenAPI();
    }
    return QwenAPI.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      if (!config.apiKeys.huggingface) {
        throw new AppError('Hugging Face API key not configured', 'CONFIG_ERROR');
      }

      // Verify model access
      await this.hf.modelInfo({
        model: this.model
      });

      this.initialized = true;
      thoughtLogger.log('success', 'Qwen API initialized successfully');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize Qwen API', { error });
      throw error;
    }
  }

  async generateCode(
    prompt: string,
    language?: string,
    onProgress?: (content: string) => void
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      thoughtLogger.log('execution', 'Generating code with Qwen', {
        language,
        promptLength: prompt.length
      });

      const messages = this.formatPrompt(prompt, language);
      
      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: messages,
        parameters: {
          max_new_tokens: 2048,
          temperature: 0.2,
          top_p: 0.95,
          stream: Boolean(onProgress)
        }
      });

      if (onProgress && response.details?.text) {
        onProgress(response.details.text);
      }

      thoughtLogger.log('success', 'Code generation complete');
      return response.generated_text;
    } catch (error) {
      thoughtLogger.log('error', 'Code generation failed', { error });
      throw error instanceof AppError ? error : new AppError(
        'Failed to generate code',
        'GENERATION_ERROR',
        error
      );
    }
  }

  async reviewCode(
    code: string,
    language?: string
  ): Promise<{ issues: string[]; suggestions: string[]; quality: number }> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      thoughtLogger.log('execution', 'Reviewing code with Qwen', { language });

      const prompt = `Review the following ${language || ''} code and provide:
1. List of potential issues
2. Improvement suggestions
3. Code quality score (0-100)

Code to review:
\`\`\`
${code}
\`\`\``;

      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 1024,
          temperature: 0.3
        }
      });

      // Parse response
      const issues: string[] = [];
      const suggestions: string[] = [];
      let quality = 0;

      const lines = response.generated_text.split('\n');
      let currentSection = '';

      for (const line of lines) {
        if (line.includes('Issues:')) {
          currentSection = 'issues';
        } else if (line.includes('Suggestions:')) {
          currentSection = 'suggestions';
        } else if (line.includes('Quality Score:')) {
          quality = parseInt(line.match(/\d+/)?.[0] || '0');
        } else if (line.trim().startsWith('-')) {
          if (currentSection === 'issues') {
            issues.push(line.trim().slice(2));
          } else if (currentSection === 'suggestions') {
            suggestions.push(line.trim().slice(2));
          }
        }
      }

      thoughtLogger.log('success', 'Code review complete', {
        issueCount: issues.length,
        suggestionCount: suggestions.length,
        quality
      });

      return { issues, suggestions, quality };
    } catch (error) {
      thoughtLogger.log('error', 'Code review failed', { error });
      throw error instanceof AppError ? error : new AppError(
        'Failed to review code',
        'REVIEW_ERROR',
        error
      );
    }
  }

  private formatPrompt(prompt: string, language?: string): string {
    return `You are an expert programmer. Generate high-quality ${language || ''} code based on the following request:

${prompt}

Provide clean, efficient, and well-documented code with proper error handling.`;
  }

  get isInitialized(): boolean {
    return this.initialized;
  }
}