import { EventEmitter } from '../events/event-emitter';
import { thoughtLogger } from '../logging/thought-logger';
import type { Message } from '../types';
import type { RouterConfig } from '../routing/router';

// Bridge pattern to handle inter-agent communication
export class AgentBridge extends EventEmitter {
  private static instance: AgentBridge;
  private activeConnections: Map<string, string> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): AgentBridge {
    if (!AgentBridge.instance) {
      AgentBridge.instance = new AgentBridge();
    }
    return AgentBridge.instance;
  }

  async routeMessage(
    message: Message,
    fromAgentId: string,
    toAgentId: string,
    config?: RouterConfig
  ): Promise<void> {
    thoughtLogger.log('observation', `Routing message from ${fromAgentId} to ${toAgentId}`, {
      fromAgent: fromAgentId,
      toAgent: toAgentId,
      modelUsed: config?.model
    });

    this.activeConnections.set(`${fromAgentId}-${toAgentId}`, message.id);
    
    try {
      this.emit('message-route', {
        message,
        fromAgentId,
        toAgentId,
        config
      });
    } catch (error) {
      thoughtLogger.log('critique', `Failed to route message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async delegateTask(
    task: string,
    fromAgentId: string,
    toAgentId: string,
    config?: RouterConfig
  ): Promise<void> {
    thoughtLogger.log('decision', `Delegating task from ${fromAgentId} to ${toAgentId}`, {
      task,
      fromAgent: fromAgentId,
      toAgent: toAgentId,
      modelUsed: config?.model
    });

    try {
      this.emit('task-delegate', {
        task,
        fromAgentId,
        toAgentId,
        config
      });
    } catch (error) {
      thoughtLogger.log('critique', `Failed to delegate task: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async reportResult(
    result: any,
    fromAgentId: string,
    toAgentId: string
  ): Promise<void> {
    thoughtLogger.log('observation', `Reporting result from ${fromAgentId} to ${toAgentId}`);

    try {
      this.emit('result-report', {
        result,
        fromAgentId,
        toAgentId
      });
    } catch (error) {
      thoughtLogger.log('critique', `Failed to report result: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  isConnected(fromAgentId: string, toAgentId: string): boolean {
    return this.activeConnections.has(`${fromAgentId}-${toAgentId}`);
  }

  clearConnections(): void {
    this.activeConnections.clear();
  }
}