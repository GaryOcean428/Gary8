import { Message } from '../../types';

export class MemoryService {
  private messages: Message[] = [];

  async storeMessage(_message: Message): Promise<void> {
    this.messages.push(_message);
  }

  async getRelevantContext(_message: string): Promise<string> {
    // Get last 5 messages for context
    const recentMessages = this.messages.slice(-5);
    return recentMessages.map(_msg => `${_msg.role}: ${_msg.content}`).join('\n');
  }

  async clearMessages(): Promise<void> {
    this.messages = [];
  }
}

export const memoryService = new MemoryService();