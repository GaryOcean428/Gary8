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
    _message: Message,
    _fromAgentId: string,
    _toAgentId: string,
    _config?: RouterConfig
  ): Promise<void> {
    thoughtLogger.log('observation', `Routing message from ${_fromAgentId} to ${_toAgentId}`, {
      fromAgent: _fromAgentId,
      toAgent: _toAgentId,
      modelUsed: _config?.model
    });

    this.activeConnections.set(`${_fromAgentId}-${_toAgentId}`, _message.id);
    
    try {
      this.emit('message-route', {
        _message,
        _fromAgentId,
        _toAgentId,
        _config
      });
    } catch (error) {
      thoughtLogger.log('critique', `Failed to route message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async delegateTask(
    _task: string,
    _fromAgentId: string,
    _toAgentId: string,
    _config?: RouterConfig
  ): Promise<void> {
    thoughtLogger.log('decision', `Delegating task from ${_fromAgentId} to ${_toAgentId}`, {
      _task,
      fromAgent: _fromAgentId,
      toAgent: _toAgentId,
      modelUsed: _config?.model
    });

    try {
      this.emit('task-delegate', {
        _task,
        _fromAgentId,
        _toAgentId,
        _config
      });
    } catch (error) {
      thoughtLogger.log('critique', `Failed to delegate task: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async reportResult(
    _result: unknown,
    _fromAgentId: string,
    _toAgentId: string
  ): Promise<void> {
    thoughtLogger.log('observation', `Reporting result from ${_fromAgentId} to ${_toAgentId}`);

    try {
      this.emit('result-report', {
        _result,
        _fromAgentId,
        _toAgentId
      });
    } catch (error) {
      thoughtLogger.log('critique', `Failed to report result: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  isConnected(_fromAgentId: string, _toAgentId: string): boolean {
    return this.activeConnections.has(`${_fromAgentId}-${_toAgentId}`);
  }

  clearConnections(): void {
    this.activeConnections.clear();
  }
}