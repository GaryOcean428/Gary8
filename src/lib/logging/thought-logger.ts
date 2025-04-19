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
    _level: ThoughtType,
    _message: string,
    _metadata?: Record<string, unknown>,
    _options: {
      agentId?: string;
      collaborationId?: string;
      parentThoughtId?: string;
      taskId?: string;
      source?: string;
    } = {}
  ): void {
    const thought: Thought = {
      id: crypto.randomUUID(),
      _level,
      _message,
      timestamp: Date.now(),
      _metadata,
      ..._options
    };

    // Track collaborations
    if (_options.collaborationId) {
      const thoughts = this.activeCollaborations.get(_options.collaborationId) || [];
      thoughts.push(thought.id);
      this.activeCollaborations.set(_options.collaborationId, thoughts);
    }

    // Track tasks
    if (_options.taskId) {
      const agents = this.activeTasks.get(_options.taskId) || new Set();
      if (_options.agentId) {
        agents.add(_options.agentId);
      }
      this.activeTasks.set(_options.taskId, agents);
    }

    this.thoughts.push(thought);
    this.notifyListeners();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const prefix = [
        _options.agentId ? `[${_options.agentId}]` : '',
        _options.taskId ? `(Task ${_options.taskId})` : '',
        _level.toUpperCase()
      ].filter(Boolean).join(' ');
      
      console.log(`${prefix}: ${_message}`, _metadata || '');
    }
  }

  getThoughts(_options: {
    agentId?: string;
    collaborationId?: string;
    level?: ThoughtType;
    since?: number;
    taskId?: string;
    source?: string;
  } = {}): Thought[] {
    let filtered = [...this.thoughts];

    if (_options.agentId) {
      filtered = filtered.filter(_t => _t.agentId === _options.agentId);
    }

    if (_options.collaborationId) {
      filtered = filtered.filter(_t => _t.collaborationId === _options.collaborationId);
    }

    if (_options.level) {
      filtered = filtered.filter(_t => _t.level === _options.level);
    }

    if (_options.since) {
      filtered = filtered.filter(_t => _t.timestamp >= _options.since);
    }

    if (_options.taskId) {
      filtered = filtered.filter(_t => _t.taskId === _options.taskId);
    }

    if (_options.source) {
      filtered = filtered.filter(_t => _t.source === _options.source);
    }

    return filtered;
  }

  getCollaborationThoughts(_collaborationId: string): Thought[] {
    const thoughtIds = this.activeCollaborations.get(_collaborationId) || [];
    return this.thoughts.filter(_t => thoughtIds.includes(_t.id));
  }

  getTaskAgents(_taskId: string): string[] {
    return Array.from(this.activeTasks.get(_taskId) || []);
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

  subscribe(_listener: (thoughts: Thought[]) => void): () => void {
    this.listeners.add(_listener);
    _listener(this.getThoughts());

    return () => {
      this.listeners.delete(_listener);
    };
  }

  private notifyListeners(): void {
    const thoughts = this.getThoughts();
    this.listeners.forEach(_listener => _listener(thoughts));
  }

  clear(): void {
    this.thoughts = [];
    this.activeCollaborations.clear();
    this.activeTasks.clear();
    this.notifyListeners();
  }
}

export const thoughtLogger = ThoughtLogger.getInstance();