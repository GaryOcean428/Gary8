import type { Message, ProcessingResult } from '../../types';
import { ErrorHandler } from '../error/error-handler';

export class MessageProcessor {
  async processMessage(message: Message): Promise<ProcessingResult> {
    try {
      // Validate message
      if (!this.validateMessage(message)) {
        throw ErrorHandler.createError(
          'INVALID_MESSAGE',
          'Message format is invalid'
        );
      }

      // Process the message
      const processedContent = await this.processContent(message.content);

      return {
        success: true,
        data: {
          id: message.id,
          processedContent
        }
      };
    } catch (error) {
      const processedError = ErrorHandler.handleError(error as Error);
      return {
        success: false,
        error: processedError,
        message: processedError.message
      };
    }
  }

  private validateMessage(message: Message): boolean {
    return (
      typeof message === 'object' &&
      typeof message.id === 'string' &&
      typeof message.content === 'string' &&
      ['user', 'assistant', 'system'].includes(message.role) &&
      typeof message.timestamp === 'number'
    );
  }

  private async processContent(content: string): Promise<string> {
    // Basic content processing
    return content.trim();
  }
}