import { Message } from '../types';

export class ChatContext {
  private recentMessages: Message[] = [];
  private maxRecentMessages = 10;

  addMessage(_message: Message): void {
    this.recentMessages.push(_message);
    if (this.recentMessages.length > this.maxRecentMessages) {
      this.recentMessages.shift();
    }
  }

  getRecentContext(): string {
    return this.recentMessages
      .map(_msg => `${_msg.role}: ${_msg.content}`)
      .join('\n');
  }

  clear(): void {
    this.recentMessages = [];
  }
}