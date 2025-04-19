import { MemoryService } from './memory/memory-service';
import { WebSearch } from './tools/web-search';

export class MessageProcessor {
  constructor(
    private memoryService: MemoryService,
    private webSearch: WebSearch
  ) {}

  async processMessage(_message: string): Promise<string> {
    try {
      // Check if message requires web search
      if (this.requiresWebSearch(_message)) {
        const searchResults = await this.webSearch.search(_message);
        return this.formatResponse(searchResults);
      }

      // Get relevant context from memory
      const context = await this.memoryService.getRelevantContext(_message);
      
      // Process message with context
      return this.generateResponse(_message, context);
    } catch (error) {
      console.error('Error in message processor:', error);
      throw new Error('Failed to process message');
    }
  }

  private requiresWebSearch(_message: string): boolean {
    const searchKeywords = ['search', 'find', 'look up', 'what is', 'who is', 'where is', 'when is', 'why is', 'how is'];
    return searchKeywords.some(_keyword => _message.toLowerCase().includes(_keyword));
  }

  private formatResponse(_response: string): string {
    return _response.trim();
  }

  private async generateResponse(_message: string, _context: string): Promise<string> {
    // Basic response generation
    return `I understand you're asking about "${_message}". Let me help you with that.`;
  }
}