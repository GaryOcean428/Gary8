import { Message } from '../../types';

export class MemoryService {
  private messages: Message[] = [];

  async storeMessage(message: Message): Promise<void> {
    this.messages.push(message);
  }

  async getRelevantContext(message: string): Promise<string> {
    // Get last 5 messages for context
    const recentMessages = this.messages.slice(-5);
    return recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
  }

  async clearMessages(): Promise<void> {
    this.messages = [];
  }
}

export const memoryService = new MemoryService();