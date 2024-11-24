import { AgentMessage } from '../types';

export class MessageQueue {
  private queue: AgentMessage[] = [];
  private processing = false;
  private handlers: Map<string, (message: AgentMessage) => Promise<void>> = new Map();

  async enqueue(message: AgentMessage): Promise<void> {
    this.queue.push(message);
    if (!this.processing) {
      await this.processQueue();
    }
  }

  registerHandler(type: string, handler: (message: AgentMessage) => Promise<void>): void {
    this.handlers.set(type, handler);
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    try {
      while (this.queue.length > 0) {
        const message = this.queue.shift()!;
        const handler = this.handlers.get(message.type);
        if (handler) {
          await handler(message);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  clear(): void {
    this.queue = [];
    this.processing = false;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}