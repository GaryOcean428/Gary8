import { EventEmitter } from '../events/event-emitter';
import { MessageProcessor } from '../processing/message-processor';
import type { Message, ProcessingResult } from '../../types';

export class BaseAgent extends EventEmitter {
  protected id: string;
  protected name: string;
  protected role: string;
  protected messages: Message[] = [];
  protected capabilities: Set<string> = new Set();
  private messageProcessor: MessageProcessor;

  constructor(id: string, name: string, role: string) {
    super();
    this.id = id;
    this.name = name;
    this.role = role;
    this.messageProcessor = new MessageProcessor();
  }

  async processMessage(_message: Message): Promise<ProcessingResult> {
    try {
      const result = await this.messageProcessor.processMessage(_message);
      
      if (result.success) {
        this.messages.push(_message);
        this.emit('message', _message);
      }

      return result;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  clearMessages(): void {
    this.messages = [];
    this.emit('clear');
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getRole(): string {
    return this.role;
  }

  addCapability(_capability: string): void {
    this.capabilities.add(_capability);
    this.emit('capability-added', _capability);
  }

  removeCapability(_capability: string): void {
    this.capabilities.delete(_capability);
    this.emit('capability-removed', _capability);
  }

  hasCapability(_capability: string): boolean {
    return this.capabilities.has(_capability);
  }

  getCapabilities(): string[] {
    return Array.from(this.capabilities);
  }
}