import { EventEmitter } from '../../events/event-emitter';
import { AgentConfig, AgentMessage, AgentState, AgentStatus } from '../types';
import { MessageQueue } from './message-queue';

export abstract class BaseAgent extends EventEmitter {
  protected config: AgentConfig;
  protected state: AgentState;
  protected messageQueue: MessageQueue;
  private subordinates: Map<string, BaseAgent> = new Map();

  constructor(config: AgentConfig) {
    super();
    this.config = config;
    this.messageQueue = new MessageQueue();
    this.state = {
      id: config.id,
      status: 'idle',
      subordinates: [],
      lastActive: Date.now(),
      metrics: {
        tasksCompleted: 0,
        successRate: 1,
        averageResponseTime: 0
      }
    };
  }

  abstract processMessage(message: AgentMessage): Promise<void>;
  abstract executeTask(task: string): Promise<unknown>;

  async sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<void> {
    const fullMessage: AgentMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    await this.messageQueue.enqueue(fullMessage);
    this.emit('message-sent', fullMessage);
  }

  async addSubordinate(agent: BaseAgent): Promise<void> {
    this.subordinates.set(agent.getId(), agent);
    this.state.subordinates.push(agent.getId());
    this.emit('subordinate-added', agent.getId());
  }

  async removeSubordinate(agentId: string): Promise<void> {
    const agent = this.subordinates.get(agentId);
    if (agent) {
      this.subordinates.delete(agentId);
      this.state.subordinates = this.state.subordinates.filter(id => id !== agentId);
      this.emit('subordinate-removed', agentId);
    }
  }

  setStatus(status: AgentStatus): void {
    this.state.status = status;
    this.state.lastActive = Date.now();
    this.emit('status-changed', status);
  }

  getId(): string {
    return this.config.id;
  }

  getRole(): string {
    return this.config.role;
  }

  getState(): AgentState {
    return { ...this.state };
  }

  getSubordinates(): BaseAgent[] {
    return Array.from(this.subordinates.values());
  }

  protected async delegateTask(task: string, targetAgentId: string): Promise<void> {
    const agent = this.subordinates.get(targetAgentId);
    if (!agent) {
      throw new Error(`Agent ${targetAgentId} not found`);
    }

    await this.sendMessage({
      from: this.config.id,
      to: targetAgentId,
      content: task,
      type: 'command'
    });
  }

  protected updateMetrics(success: boolean, responseTime: number): void {
    const { metrics } = this.state;
    metrics.tasksCompleted++;
    metrics.successRate = (metrics.successRate * (metrics.tasksCompleted - 1) + (success ? 1 : 0)) / metrics.tasksCompleted;
    metrics.averageResponseTime = (metrics.averageResponseTime * (metrics.tasksCompleted - 1) + responseTime) / metrics.tasksCompleted;
  }
}