import { CodeReviewResult } from '../interfaces/code-interfaces';
import { CODE_CONSTANTS } from '../constants/code-constants';
import { ErrorHandler } from '../utils/error-handler';
import { thoughtLogger } from '../logging/thought-logger';
import { HfInference } from '@huggingface/inference';
import { AppError } from '../errors/AppError';
import { config } from '../config';

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

      // Verify model availability with a simple test request
      await this.hf.textGeneration({
        model: this.model,
        inputs: 'Test',
        parameters: {
          max_new_tokens: 1,
          temperature: 0.1
        }
      });

      this.initialized = true;
      thoughtLogger.log('success', 'Qwen API initialized successfully');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize Qwen API', { error });
      throw error instanceof AppError ? error : new AppError('Failed to initialize Qwen API', 'API_ERROR', error);
    }
  }

  async generateCode(
    prompt: string,
    language?: string,
    onProgress?: (content: string) => void
  ): Promise<string> {
    if (!this.initialized) await this.initialize();

    try {
      thoughtLogger.log('execution', 'Generating code with Qwen', { language });
      
      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: this.formatPrompt(prompt, language),
        parameters: {
          max_new_tokens: CODE_CONSTANTS.MAX_TOKENS.CODE_GENERATION,
          temperature: CODE_CONSTANTS.TEMPERATURES.CODE_GENERATION,
          top_p: 0.95
        }
      });

      if (onProgress && response.generated_text) {
        onProgress(response.generated_text);
      }

      thoughtLogger.log('success', 'Code generation complete');
      return response.generated_text;
    } catch (error) {
      throw ErrorHandler.handleWithThrow(error, 'generate code');
    }
  }

  async reviewCode(
    code: string,
    language?: string
  ): Promise<CodeReviewResult> {
    if (!this.initialized) await this.initialize();

    try {
      thoughtLogger.log('execution', 'Reviewing code with Qwen', { language });

      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: this.formatReviewPrompt(code, language),
        parameters: {
          max_new_tokens: CODE_CONSTANTS.MAX_TOKENS.CODE_REVIEW,
          temperature: CODE_CONSTANTS.TEMPERATURES.CODE_REVIEW
        }
      });

      const result = this.parseReviewResponse(response.generated_text);
      thoughtLogger.log('success', 'Code review complete', { 
        issues: result.issues,
        suggestions: result.suggestions,
        quality: result.quality
      } as Record<string, unknown>);
      return result;
    } catch (error) {
      throw ErrorHandler.handleWithThrow(error, 'review code');
    }
  }

  private formatReviewPrompt(code: string, language?: string): string {
    return `Review the following ${language || ''} code and provide:
1. List of potential issues
2. Improvement suggestions
3. Code quality score (0-100)

Code to review:
\`\`\`
${code}
\`\`\``;
  }

  private parseReviewResponse(text: string): CodeReviewResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let quality = 0;
    let currentSection = '';

    const lines = text.split('\n');
    for (const line of lines) {
      if (line.includes('Issues:')) currentSection = 'issues';
      else if (line.includes('Suggestions:')) currentSection = 'suggestions';
      else if (line.includes('Quality Score:')) {
        quality = parseInt(line.match(/\d+/)?.[0] || '0');
      } else if (line.trim().startsWith('-')) {
        const item = line.trim().slice(2);
        if (currentSection === 'issues') issues.push(item);
        else if (currentSection === 'suggestions') suggestions.push(item);
      }
    }

    return { issues, suggestions, quality };
  }

  private formatPrompt(prompt: string, language?: string): string {
    return `You are an expert programmer. Generate high-quality ${language || ''} code based on the following request:

${prompt}

Provide clean, efficient, and well-documented code with proper error handling.`;
  }

  get isInitialized(): boolean {
    return this.initialized;
  }

  async generateResponse(prompt: string): Promise<string> {
    if (!this.initialized) await this.initialize();

    try {
      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 1024,
          temperature: 0.2
        }
      });
      return response.generated_text;
    } catch (error) {
      throw ErrorHandler.handleWithThrow(error, 'generate response');
    }
  }
}
