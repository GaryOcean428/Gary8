import { BaseAgent } from './core/base-agent';
import { AgentMessage, AgentConfig } from './types';
import { ErrorHandler } from '../errors/ErrorHandler';

export class TaskAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super({ ...config, role: 'task' });

    // Register message handlers
    this.messageQueue.registerHandler('command', this.handleCommand.bind(this));
  }

  async processMessage(_message: AgentMessage): Promise<void> {
    const startTime = Date.now();
    try {
      this.setStatus('active');

      const result = await this.executeTask(_message.content);
      
      // Report back to superior
      if (this.config.superiorId) {
        await this.sendMessage({
          from: this.config.id,
          to: this.config.superiorId,
          content: JSON.stringify(result),
          type: 'report'
        });
      }

      this.updateMetrics(true, Date.now() - startTime);
    } catch (error) {
      this.updateMetrics(false, Date.now() - startTime);
      throw error;
    } finally {
      this.setStatus('idle');
    }
  }

  async executeTask(_task: string): Promise<unknown> {
    try {
      // Task-specific execution logic
      return { status: 'completed', _task };
    } catch (error) {
      const handled = ErrorHandler.handle(error);
      throw new Error(`Task execution failed: ${handled.message}`);
    }
  }

  private async handleCommand(_message: AgentMessage): Promise<void> {
    await this.processMessage(_message);
  }
}