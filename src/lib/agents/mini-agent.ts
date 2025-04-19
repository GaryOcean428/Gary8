import { BaseAgent } from './base-agent';
import { Message, AgentCapability } from '../types';
import { config } from '../config';

export class MiniAgent extends BaseAgent {
  private model: string;
  private capabilities: Set<AgentCapability>;
  private superiorId: string;

  constructor(
    id: string,
    name: string,
    model: string,
    superiorId: string,
    capabilities: AgentCapability[] = []
  ) {
    super(id, name, 'utility');
    this.model = model;
    this.superiorId = superiorId;
    this.capabilities = new Set(capabilities);
  }

  async processMessage(_message: Message): Promise<Message> {
    // Mini agents are designed for specific tasks with lower complexity
    const result = await this.executeTask(_message.content);

    // Report results to superior
    await this.reportToSuperior(result);

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: typeof result === 'string' ? result : JSON.stringify(result),
      timestamp: Date.now(),
      model: this.model
    };
  }

  private async executeTask(_task: string): Promise<unknown> {
    if (this.capabilities.has('code-execution')) {
      return this.executeCode(_task);
    }
    if (this.capabilities.has('data-analysis')) {
      return this.analyzeData(_task);
    }
    return _task;
  }

  private async executeCode(_code: string): Promise<unknown> {
    // Safe code execution implementation
    return `Executed code: ${_code}`;
  }

  private async analyzeData(_data: string): Promise<unknown> {
    // Data analysis implementation
    return `Analyzed data: ${_data}`;
  }

  private async reportToSuperior(_result: unknown): Promise<void> {
    this.emit('report', {
      agentId: this.getId(),
      superiorId: this.superiorId,
      _result
    });
  }

  getModel(): string {
    return this.model;
  }

  getSuperiorId(): string {
    return this.superiorId;
  }

  hasCapability(_capability: AgentCapability): boolean {
    return this.capabilities.has(_capability);
  }

  addCapability(_capability: AgentCapability): void {
    this.capabilities.add(_capability);
  }

  removeCapability(_capability: AgentCapability): void {
    this.capabilities.delete(_capability);
  }
}