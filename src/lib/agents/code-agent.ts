import { BaseAgent } from './core/base-agent';
import { QwenAPI } from '../api/qwen-api';
import { AgentMessage, AgentConfig } from './agent-types';
import { ErrorHandler } from '../utils/error-handler';
import { thoughtLogger } from '../utils/logger';
import { AppError } from '../errors/AppError';

export class CodeAgent extends BaseAgent {
  private qwenAPI: QwenAPI;

  constructor(config: AgentConfig) {
    super(config);
    this.qwenAPI = QwenAPI.getInstance();
    thoughtLogger.log('info', 'CodeAgent initialized');
  }

  async execute(task: any): Promise<any> {
    return this.executeTask(task);
  }

  async executeTask(task: string): Promise<unknown> {
    try {
      const result = await this.qwenAPI.generateCode(task);
      return result;
    } catch (error) {
      throw ErrorHandler.handleWithThrow(error, 'execute task');
    }
  }

  async processMessage(message: AgentMessage): Promise<void> {
    try {
      const messageType = this.determineMessageType(message);
      await this.handleMessageByType(message, messageType);
    } catch (error) {
      throw ErrorHandler.handleWithThrow(error, 'process message');
    }
  }

  private async handleMessageByType(message: AgentMessage, type: 'review' | 'generate'): Promise<void> {
    switch (type) {
      case 'review':
        await this.handleCodeReview(message.content);
        break;
      case 'generate':
        await this.handleCodeGeneration(message.content);
        break;
    }
  }

  private determineMessageType(message: AgentMessage): 'review' | 'generate' {
    return message.content.toLowerCase().includes('review') ? 'review' : 'generate';
  }

  async handleCodeReview(message: string): Promise<string> {
    try {
      // Extract code block and language
      const codeMatch = message.match(/```(\w+)?\n([\s\S]*?)```/);
      if (!codeMatch) {
        throw new AppError('No code block found in message', 'PARSING_ERROR');
      }

      const [, language = 'plaintext', code] = codeMatch;
      thoughtLogger.log('info', 'Reviewing code', { language, codeLength: code.length });

      const review = await this.qwenAPI.reviewCode(code, language);
      return this.formatReviewResponse(review);
    } catch (error) {
      thoughtLogger.log('error', 'Code review failed', { error });
      throw new AppError('Code review failed', 'PROCESSING_ERROR');
    }
  }

  async handleCodeGeneration(prompt: string): Promise<string> {
    try {
      thoughtLogger.log('info', 'Generating code', { prompt });
      const result = await this.qwenAPI.generateCode(prompt);
      return this.formatGenerationResponse(result);
    } catch (error) {
      thoughtLogger.log('error', 'Code generation failed', { error });
      throw new AppError('Code generation failed', 'PROCESSING_ERROR');
    }
  }

  private formatReviewResponse(review: any): string {
    return `Code Review Results:
Issues Found: ${review.issues.length}
Overall Score: ${review.quality}/100

Issues:
${review.issues.map((issue: string, i: number) => 
  `${i + 1}. ${issue}`
).join('\n\n')}

Suggestions:
${review.suggestions.join('\n')}`;
  }

  private formatGenerationResponse(result: string): string {
    // Extract code block if present, otherwise use the full result
    const codeMatch = result.match(/```(\w+)?\n([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[2] : result;
    const language = codeMatch ? codeMatch[1] || 'plaintext' : 'plaintext';

    return `Generated Code:
\`\`\`${language}
${code}
\`\`\``;
  }
}
