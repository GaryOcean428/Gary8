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

  abstract processMessage(_message: AgentMessage): Promise<void>;
  abstract executeTask(_task: string): Promise<unknown>;

  async sendMessage(_message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<void> {
    const fullMessage: AgentMessage = {
      ..._message,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    await this.messageQueue.enqueue(fullMessage);
    this.emit('message-sent', fullMessage);
  }

  async addSubordinate(_agent: BaseAgent): Promise<void> {
    this.subordinates.set(_agent.getId(), _agent);
    this.state.subordinates.push(_agent.getId());
    this.emit('subordinate-added', _agent.getId());
  }

  async removeSubordinate(_agentId: string): Promise<void> {
    const agent = this.subordinates.get(_agentId);
    if (agent) {
      this.subordinates.delete(_agentId);
      this.state.subordinates = this.state.subordinates.filter(_id => _id !== _agentId);
      this.emit('subordinate-removed', _agentId);
    }
  }

  setStatus(_status: AgentStatus): void {
    this.state.status = _status;
    this.state.lastActive = Date.now();
    this.emit('status-changed', _status);
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

  protected async delegateTask(_task: string, _targetAgentId: string): Promise<void> {
    const agent = this.subordinates.get(_targetAgentId);
    if (!agent) {
      throw new Error(`Agent ${_targetAgentId} not found`);
    }

    await this.sendMessage({
      from: this.config.id,
      to: _targetAgentId,
      content: _task,
      type: 'command'
    });
  }

  protected updateMetrics(_success: boolean, _responseTime: number): void {
    const { metrics } = this.state;
    metrics.tasksCompleted++;
    metrics.successRate = (metrics.successRate * (metrics.tasksCompleted - 1) + (_success ? 1 : 0)) / metrics.tasksCompleted;
    metrics.averageResponseTime = (metrics.averageResponseTime * (metrics.tasksCompleted - 1) + _responseTime) / metrics.tasksCompleted;
  }
}