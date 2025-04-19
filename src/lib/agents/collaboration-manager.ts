import { EventEmitter } from '../events/event-emitter';
import { thoughtLogger } from '../logging/thought-logger';
import { TaskPlanner } from './task-planner';
import { MemoryAggregator } from '../memory/memory-aggregator';
import type { Message } from '../types';

interface CollaborationSession {
  id: string;
  taskPlanId: string;
  participants: Set<string>;
  messages: Message[];
  status: 'active' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
}

export class CollaborationManager extends EventEmitter {
  private taskPlanner: TaskPlanner;
  private memoryAggregator: MemoryAggregator;
  private sessions: Map<string, CollaborationSession> = new Map();

  constructor() {
    super();
    this.taskPlanner = new TaskPlanner();
    this.memoryAggregator = MemoryAggregator.getInstance();
  }

  async startCollaboration(_message: Message): Promise<CollaborationSession> {
    const sessionId = crypto.randomUUID();
    thoughtLogger.log('plan', 'Starting collaboration session', { sessionId });

    try {
      // Create task plan
      const plan = await this.taskPlanner.planTask(_message);
      
      // Initialize collaboration session
      const session: CollaborationSession = {
        id: sessionId,
        taskPlanId: plan.id,
        participants: new Set(
          plan.steps
            .map(_step => _step.assignedAgent)
            .filter((_agent): _agent is string => Boolean(_agent))
        ),
        messages: [_message],
        status: 'active',
        startTime: Date.now()
      };

      this.sessions.set(sessionId, session);
      
      // Execute task plan
      await this.taskPlanner.executePlan(plan);
      
      // Aggregate results
      const results = plan.steps
        .filter(_step => _step.status === 'completed')
        .map(_step => ({
          agentId: _step.assignedAgent!,
          content: _step.result,
          confidence: 0.9
        }));

      const finalResult = await this.memoryAggregator.aggregateResults(results);
      
      // Complete session
      session.status = 'completed';
      session.endTime = Date.now();
      
      thoughtLogger.log('success', 'Collaboration completed', {
        sessionId,
        duration: session.endTime - session.startTime
      });

      return session;
    } catch (error) {
      thoughtLogger.log('error', 'Collaboration failed', { sessionId, error });
      throw error;
    }
  }

  async sendMessage(
    _sessionId: string,
    _message: Omit<Message, 'id' | 'timestamp'>
  ): Promise<void> {
    const session = this.sessions.get(_sessionId);
    if (!session) {
      throw new Error(`Session ${_sessionId} not found`);
    }

    const fullMessage: Message = {
      ..._message,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    session.messages.push(fullMessage);
    this.emit('message', { _sessionId, message: fullMessage });
  }

  getSession(_sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(_sessionId);
  }

  getActiveSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values()).filter(
      _session => _session.status === 'active'
    );
  }

  async endSession(_sessionId: string): Promise<void> {
    const session = this.sessions.get(_sessionId);
    if (!session) {
      throw new Error(`Session ${_sessionId} not found`);
    }

    session.status = 'completed';
    session.endTime = Date.now();
    this.emit('session-ended', { _sessionId });
  }
}