import { AgentMessage } from '../types';

export class MessageQueue {
  private queue: AgentMessage[] = [];
  private processing = false;
  private handlers: Map<string, (message: AgentMessage) => Promise<void>> = new Map();

  async enqueue(_message: AgentMessage): Promise<void> {
    this.queue.push(_message);
    if (!this.processing) {
      await this.processQueue();
    }
  }

  registerHandler(_type: string, _handler: (message: AgentMessage) => Promise<void>): void {
    this.handlers.set(_type, _handler);
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