import { BaseAgent } from './core/base-agent';
import { QwenAPI } from '../api/qwen-api';
import { thoughtLogger } from '../logging/thought-logger';
import type { Message } from '../types';

export class CodeAgent extends BaseAgent {
  private qwenAPI: QwenAPI;

  constructor(id: string, name: string) {
    super(id, name, 'specialist');
    this.qwenAPI = QwenAPI.getInstance();
    this.capabilities.add('code-generation');
    this.capabilities.add('code-review');
    this.capabilities.add('refactoring');
  }

  async processMessage(message: Message): Promise<Message> {
    const startTime = Date.now();
    thoughtLogger.log('plan', `Code agent ${this.getId()} processing message`, {
      capabilities: Array.from(this.capabilities)
    });

    try {
      this.setStatus('active');
      let result: string;

      if (message.content.toLowerCase().includes('review')) {
        const review = await this.reviewCode(message.content);
        result = this.formatReviewResponse(review);
      } else {
        result = await this.generateCode(message.content);
      }

      thoughtLogger.log('success', `Code agent ${this.getId()} completed task`, {
        duration: Date.now() - startTime
      });

      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result,
        timestamp: Date.now()
      };
    } catch (error) {
      thoughtLogger.log('error', `Code agent ${this.getId()} failed`, { error });
      throw error;
    } finally {
      this.setStatus('idle');
    }
  }

  private async generateCode(prompt: string): Promise<string> {
    // Extract language from prompt if specified
    const languageMatch = prompt.match(/in\s+([\w\+\#]+)(?:\s|$)/i);
    const language = languageMatch ? languageMatch[1] : undefined;

    thoughtLogger.log('execution', 'Generating code', { language });

    return this.qwenAPI.generateCode(prompt, language);
  }

  private async reviewCode(content: string): Promise<{
    issues: string[];
    suggestions: string[];
    quality: number;
  }> {
    // Extract code block and language
    const codeMatch = content.match(/```(\w+)?\n([\s\S]+?)```/);
    if (!codeMatch) {
      throw new Error('No code block found in message');
    }

    const [_, language, code] = codeMatch;
    thoughtLogger.log('execution', 'Reviewing code', { language });

    return this.qwenAPI.reviewCode(code, language);
  }

  private formatReviewResponse(review: {
    issues: string[];
    suggestions: string[];
    quality: number;
  }): string {
    return `# Code Review Results

## Quality Score: ${review.quality}/100

## Issues Found
${review.issues.map(issue => `- ${issue}`).join('\n')}

## Suggestions for Improvement
${review.suggestions.map(suggestion => `- ${suggestion}`).join('\n')}`;
  }

  getCapabilities(): string[] {
    return Array.from(this.capabilities);
  }
}