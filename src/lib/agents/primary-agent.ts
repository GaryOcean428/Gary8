import { BaseAgent } from './core/base-agent';
import { AgentMessage, AgentConfig } from './types';
import { ModelRouter } from '../routing/router';
import { ErrorHandler } from '../errors/ErrorHandler';

export class PrimaryAgent extends BaseAgent {
  private router: ModelRouter;

  constructor(config: AgentConfig) {
    super({ ...config, role: 'primary' });
    this.router = new ModelRouter();

    // Register message handlers
    this.messageQueue.registerHandler('command', this.handleCommand.bind(this));
    this.messageQueue.registerHandler('report', this.handleReport.bind(this));
    this.messageQueue.registerHandler('query', this.handleQuery.bind(this));
  }

  async processMessage(message: AgentMessage): Promise<void> {
    const startTime = Date.now();
    try {
      this.setStatus('active');

      // Route message based on complexity
      const routerConfig = await this.router.route(message.content, []);
      
      if (this.shouldDelegateToSpecialist(routerConfig)) {
        await this.delegateToSpecialist(message, routerConfig);
      } else {
        await this.executeTask(message.content);
      }

      this.updateMetrics(true, Date.now() - startTime);
    } catch (error) {
      this.updateMetrics(false, Date.now() - startTime);
      throw error;
    } finally {
      this.setStatus('idle');
    }
  }

  async executeTask(task: string): Promise<unknown> {
    try {
      // Primary agent's direct task execution logic
      return { status: 'completed', task };
    } catch (error) {
      const handled = ErrorHandler.handle(error);
      throw new Error(`Task execution failed: ${handled.message}`);
    }
  }

  private async handleCommand(message: AgentMessage): Promise<void> {
    // Handle commands from user
    await this.processMessage(message);
  }

  private async handleReport(message: AgentMessage): Promise<void> {
    // Process reports from subordinates
    this.emit('report-received', message);
  }

  private async handleQuery(message: AgentMessage): Promise<void> {
    // Handle queries from subordinates or user
    const response = await this.executeTask(message.content);
    await this.sendMessage({
      from: this.config.id,
      to: message.from,
      content: JSON.stringify(response),
      type: 'response'
    });
  }

  private shouldDelegateToSpecialist(routerConfig: any): boolean {
    return routerConfig.model.includes('3b') || routerConfig.model.includes('7b');
  }

  private async delegateToSpecialist(message: AgentMessage, routerConfig: any): Promise<void> {
    const specialists = this.getSubordinates().filter(agent => 
      agent.getRole() === 'specialist'
    );

    if (specialists.length === 0) {
      throw new Error('No specialist agents available');
    }

    // Select appropriate specialist based on model tier
    const specialist = specialists.find(agent => 
      (agent as any).getModelTier() === routerConfig.model
    );

    if (specialist) {
      await this.delegateTask(message.content, specialist.getId());
    } else {
      throw new Error(`No specialist available for model ${routerConfig.model}`);
    }
  }
}