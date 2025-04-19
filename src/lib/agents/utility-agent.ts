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

  async processMessage(_message: Message): Promise<Message> {
    // Utility agents are designed for specific tasks
    const result = await this.executeTask(_message.content);

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

  private async executeTask(_task: string): Promise<unknown> {
    // Execute task based on agent's capabilities
    if (this.hasCapability('code-execution')) {
      return this.executeCode(_task);
    }
    if (this.hasCapability('data-analysis')) {
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
}