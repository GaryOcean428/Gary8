import { Message } from '../types';

export class ChatContext {
  private recentMessages: Message[] = [];
  private maxRecentMessages = 10;

  addMessage(message: Message): void {
    this.recentMessages.push(message);
    if (this.recentMessages.length > this.maxRecentMessages) {
      this.recentMessages.shift();
    }
  }

  getRecentContext(): string {
    return this.recentMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
  }

  clear(): void {
    this.recentMessages = [];
  }
}