import { BaseAgent } from './base-agent';
import type { Message } from '../../types';

export class UtilityAgent extends BaseAgent {
  private model: string;
  private superiorId?: string;

  constructor(id: string, name: string, model: string = 'llama-3.2', superiorId?: string) {
    super(id, name, 'utility');
    this.model = model;
    this.superiorId = superiorId;
  }

  async processMessage(message: Message): Promise<Message> {
    // Utility agents are designed for specific tasks
    const result = await this.executeTask(message.content);

    // Report results to superior if one exists
    if (this.superiorId) {
      await this.reportToSuperior(result);
    }

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: typeof result === 'string' ? result : JSON.stringify(result),
      timestamp: Date.now()
    };
  }

  private async executeTask(task: string): Promise<unknown> {
    // Execute task based on agent's capabilities
    if (this.hasCapability('code-execution')) {
      return this.executeCode(task);
    }
    if (this.hasCapability('data-analysis')) {
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
}