import { ErrorHandler } from '../errors/ErrorHandler';
import { ProcessingError } from '../errors/AppError';
import { SearchService } from './search-service';
import { Message } from '../types/Message';

export class MessageProcessor {
  private searchService: SearchService;

  constructor() {
    this.searchService = new SearchService();
  }

  async processMessage(message: Message): Promise<Message> {
    try {
      const [searchResults, searchError] = await ErrorHandler.handleAsync(
        this.searchService.search(message.content)
      );

      if (searchError) {
        throw new ProcessingError('Failed to process search request', {
          originalError: searchError
        });
      }

      return {
        id: message.id,
        content: searchResults || 'No results found',
        timestamp: new Date().toISOString(),
        type: 'response'
      };
    } catch (error) {
      const handled = ErrorHandler.handle(error);
      return {
        id: message.id,
        content: `Error: ${handled.message}`,
        timestamp: new Date().toISOString(),
        type: 'error'
      };
    }
  }
}