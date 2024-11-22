import { EventEmitter } from '../../events/event-emitter';
import { AgentConfig, AgentState, AgentCapability } from '../agent-types';
import { MessageQueue } from './message-queue';

export abstract class BaseAgent extends EventEmitter {
  protected config: AgentConfig;
  protected state: AgentState;
  protected messageQueue: MessageQueue;
  private subordinates: Map<string, BaseAgent>;

  constructor(config: AgentConfig) {
    super();
    this.config = config;
    this.messageQueue = new MessageQueue();
    this.subordinates = new Map();
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

  abstract execute(task: any): Promise<any>;

  getId(): string {
    return this.config.id;
  }

  getCapabilities(): AgentCapability[] {
    return this.config.capabilities;
  }

  protected getSubordinates(): Map<string, BaseAgent> {
    return this.subordinates;
  }
}
