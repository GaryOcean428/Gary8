import type { Message, ProcessingResult } from '../../types';
import { ErrorHandler } from '../error/error-handler';

export class MessageProcessor {
  async processMessage(_message: Message): Promise<ProcessingResult> {
    try {
      // Validate message
      if (!this.validateMessage(_message)) {
        throw ErrorHandler.createError(
          'INVALID_MESSAGE',
          'Message format is invalid'
        );
      }

      // Process the message
      const processedContent = await this.processContent(_message.content);

      return {
        success: true,
        data: {
          id: _message.id,
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

  private validateMessage(_message: Message): boolean {
    return (
      typeof _message === 'object' &&
      typeof _message.id === 'string' &&
      typeof _message.content === 'string' &&
      ['user', 'assistant', 'system'].includes(_message.role) &&
      typeof _message.timestamp === 'number'
    );
  }

  private async processContent(_content: string): Promise<string> {
    // Basic content processing
    return _content.trim();
  }
}