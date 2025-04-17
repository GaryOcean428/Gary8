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

  async startCollaboration(message: Message): Promise<CollaborationSession> {
    const sessionId = crypto.randomUUID();
    thoughtLogger.log('plan', 'Starting collaboration session', { sessionId });

    try {
      // Create task plan
      const plan = await this.taskPlanner.planTask(message);
      
      // Initialize collaboration session
      const session: CollaborationSession = {
        id: sessionId,
        taskPlanId: plan.id,
        participants: new Set(
          plan.steps
            .map(step => step.assignedAgent)
            .filter((agent): agent is string => Boolean(agent))
        ),
        messages: [message],
        status: 'active',
        startTime: Date.now()
      };

      this.sessions.set(sessionId, session);
      
      // Execute task plan
      await this.taskPlanner.executePlan(plan);
      
      // Aggregate results
      const results = plan.steps
        .filter(step => step.status === 'completed')
        .map(step => ({
          agentId: step.assignedAgent!,
          content: step.result,
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
    sessionId: string,
    message: Omit<Message, 'id' | 'timestamp'>
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const fullMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    session.messages.push(fullMessage);
    this.emit('message', { sessionId, message: fullMessage });
  }

  getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId);
  }

  getActiveSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values()).filter(
      session => session.status === 'active'
    );
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'completed';
    session.endTime = Date.now();
    this.emit('session-ended', { sessionId });
  }
}