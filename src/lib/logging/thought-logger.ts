import { EventEmitter } from '../events/event-emitter';

export type ThoughtType = 
  | 'observation'  // For recording facts and events
  | 'reasoning'    // For logical deductions
  | 'plan'         // For outlining steps
  | 'decision'     // For choices made
  | 'critique'     // For self-criticism
  | 'reflection'   // For meta-cognition
  | 'execution'    // For actions taken
  | 'success'      // For successful outcomes
  | 'error'        // For failures and issues
  | 'agent-state'  // For agent status changes
  | 'agent-comm'   // For inter-agent communication
  | 'memory-op'    // For memory operations
  | 'task-plan';   // For task planning events

export interface Thought {
  id: string;
  level: ThoughtType;
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
  agentId?: string;
  collaborationId?: string;
  parentThoughtId?: string;
  taskId?: string;
  source?: string;
}

export class ThoughtLogger extends EventEmitter {
  private static instance: ThoughtLogger;
  private thoughts: Thought[] = [];
  private listeners: Set<(thoughts: Thought[]) => void> = new Set();
  private activeCollaborations: Map<string, string[]> = new Map();
  private activeTasks: Map<string, Set<string>> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): ThoughtLogger {
    if (!ThoughtLogger.instance) {
      ThoughtLogger.instance = new ThoughtLogger();
    }
    return ThoughtLogger.instance;
  }

  log(
    level: ThoughtType,
    message: string,
    metadata?: Record<string, unknown>,
    options: {
      agentId?: string;
      collaborationId?: string;
      parentThoughtId?: string;
      taskId?: string;
      source?: string;
    } = {}
  ): void {
    const thought: Thought = {
      id: crypto.randomUUID(),
      level,
      message,
      timestamp: Date.now(),
      metadata,
      ...options
    };

    // Track collaborations
    if (options.collaborationId) {
      const thoughts = this.activeCollaborations.get(options.collaborationId) || [];
      thoughts.push(thought.id);
      this.activeCollaborations.set(options.collaborationId, thoughts);
    }

    // Track tasks
    if (options.taskId) {
      const agents = this.activeTasks.get(options.taskId) || new Set();
      if (options.agentId) {
        agents.add(options.agentId);
      }
      this.activeTasks.set(options.taskId, agents);
    }

    this.thoughts.push(thought);
    this.notifyListeners();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const prefix = [
        options.agentId ? `[${options.agentId}]` : '',
        options.taskId ? `(Task ${options.taskId})` : '',
        level.toUpperCase()
      ].filter(Boolean).join(' ');
      
      console.log(`${prefix}: ${message}`, metadata || '');
    }
  }

  getThoughts(options: {
    agentId?: string;
    collaborationId?: string;
    level?: ThoughtType;
    since?: number;
    taskId?: string;
    source?: string;
  } = {}): Thought[] {
    let filtered = [...this.thoughts];

    if (options.agentId) {
      filtered = filtered.filter(t => t.agentId === options.agentId);
    }

    if (options.collaborationId) {
      filtered = filtered.filter(t => t.collaborationId === options.collaborationId);
    }

    if (options.level) {
      filtered = filtered.filter(t => t.level === options.level);
    }

    if (options.since) {
      filtered = filtered.filter(t => t.timestamp >= options.since);
    }

    if (options.taskId) {
      filtered = filtered.filter(t => t.taskId === options.taskId);
    }

    if (options.source) {
      filtered = filtered.filter(t => t.source === options.source);
    }

    return filtered;
  }

  getCollaborationThoughts(collaborationId: string): Thought[] {
    const thoughtIds = this.activeCollaborations.get(collaborationId) || [];
    return this.thoughts.filter(t => thoughtIds.includes(t.id));
  }

  getTaskAgents(taskId: string): string[] {
    return Array.from(this.activeTasks.get(taskId) || []);
  }

  getActiveTaskCount(): number {
    return this.activeTasks.size;
  }

  getThoughtTypes(): Record<string, ThoughtType> {
    return {
      OBSERVATION: 'observation',
      REASONING: 'reasoning',
      PLAN: 'plan',
      DECISION: 'decision',
      CRITIQUE: 'critique',
      REFLECTION: 'reflection',
      EXECUTION: 'execution',
      SUCCESS: 'success',
      ERROR: 'error',
      AGENT_STATE: 'agent-state',
      AGENT_COMM: 'agent-comm',
      MEMORY_OP: 'memory-op',
      TASK_PLAN: 'task-plan'
    };
  }

  subscribe(listener: (thoughts: Thought[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getThoughts());

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const thoughts = this.getThoughts();
    this.listeners.forEach(listener => listener(thoughts));
  }

  clear(): void {
    this.thoughts = [];
    this.activeCollaborations.clear();
    this.activeTasks.clear();
    this.notifyListeners();
  }
}

export const thoughtLogger = ThoughtLogger.getInstance();