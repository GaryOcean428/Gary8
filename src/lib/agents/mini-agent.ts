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

  async processMessage(message: Message): Promise<Message> {
    // Mini agents are designed for specific tasks with lower complexity
    const result = await this.executeTask(message.content);

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

  private async executeTask(task: string): Promise<unknown> {
    if (this.capabilities.has('code-execution')) {
      return this.executeCode(task);
    }
    if (this.capabilities.has('data-analysis')) {
      return this.analyzeData(task);
    }
    return task;
  }

  private async executeCode(code: string): Promise<unknown> {
    // Safe code execution implementation
    return `Executed code: ${code}`;
  }

  private async analyzeData(data: string): Promise<unknown> {
    // Data analysis implementation
    return `Analyzed data: ${data}`;
  }

  private async reportToSuperior(result: unknown): Promise<void> {
    this.emit('report', {
      agentId: this.getId(),
      superiorId: this.superiorId,
      result
    });
  }

  getModel(): string {
    return this.model;
  }

  getSuperiorId(): string {
    return this.superiorId;
  }

  hasCapability(capability: AgentCapability): boolean {
    return this.capabilities.has(capability);
  }

  addCapability(capability: AgentCapability): void {
    this.capabilities.add(capability);
  }

  removeCapability(capability: AgentCapability): void {
    this.capabilities.delete(capability);
  }
}