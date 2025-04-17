import { MemoryService } from './memory/memory-service';
import { WebSearch } from './tools/web-search';

export class MessageProcessor {
  constructor(
    private memoryService: MemoryService,
    private webSearch: WebSearch
  ) {}

  async processMessage(message: string): Promise<string> {
    try {
      // Check if message requires web search
      if (this.requiresWebSearch(message)) {
        const searchResults = await this.webSearch.search(message);
        return this.formatResponse(searchResults);
      }

      // Get relevant context from memory
      const context = await this.memoryService.getRelevantContext(message);
      
      // Process message with context
      return this.generateResponse(message, context);
    } catch (error) {
      console.error('Error in message processor:', error);
      throw new Error('Failed to process message');
    }
  }

  private requiresWebSearch(message: string): boolean {
    const searchKeywords = ['search', 'find', 'look up', 'what is', 'who is', 'where is', 'when is', 'why is', 'how is'];
    return searchKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private formatResponse(response: string): string {
    return response.trim();
  }

  private async generateResponse(message: string, context: string): Promise<string> {
    // Basic response generation
    return `I understand you're asking about "${message}". Let me help you with that.`;
  }
}