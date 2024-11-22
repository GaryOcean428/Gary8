import { EventEmitter } from '../events/event-emitter';
import { db } from '../firebase/config';
import { collection, addDoc, FirestoreError } from 'firebase/firestore';

export type ThoughtType = 'error' | 'success' | 'info' | 'warning' | 'debug';

export const getThoughtTypes = (): ThoughtType[] => [
  'error',
  'success',
  'info',
  'warning',
  'debug'
];

export interface Thought {
  id: string;
  type: ThoughtType;
  message: string;
  timestamp: string;
  data?: any;
}

interface GetThoughtsOptions {
  agentId?: string;
  collaborationId?: string;
  level?: ThoughtType;
  since?: number | null;
  taskId?: string;
  source?: string;
}

export class ThoughtLogger extends EventEmitter {
  private static instance: ThoughtLogger;
  private thoughts: Thought[] = [];
  private listeners: Set<(thoughts: Thought[]) => void> = new Set();
  private activeCollaborations: Map<string, string[]> = new Map();
  private activeTasks: Map<string, Set<string>> = new Map();
  private memoryUsage: number = 0;

  private constructor() {
    super();
    // Log initial startup
    this.log('info', 'System initialized');
    this.startMemoryTracking();
  }

  static getInstance(): ThoughtLogger {
    if (!ThoughtLogger.instance) {
      ThoughtLogger.instance = new ThoughtLogger();
    }
    return ThoughtLogger.instance;
  }

  private startMemoryTracking(): void {
    setInterval(() => {
      // Simulate memory tracking in browser environment
      this.memoryUsage = this.thoughts.reduce((total, thought) => {
        return total + JSON.stringify(thought).length;
      }, 0);
    }, 5000);
  }

  async getMemoryUsage(): Promise<number> {
    return this.memoryUsage;
  }

  log(type: ThoughtType, message: string, data?: any): Thought {
    const timestamp = new Date().toISOString();
    const thought = {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp,
      data
    };

    // Track collaborations
    if (thought.data?.collaborationId) {
      const thoughts = this.activeCollaborations.get(thought.data.collaborationId) || [];
      thoughts.push(thought.id);
      this.activeCollaborations.set(thought.data.collaborationId, thoughts);
    }

    // Track tasks
    if (thought.data?.taskId) {
      const agents = this.activeTasks.get(thought.data.taskId) || new Set();
      if (thought.data.agentId) {
        agents.add(thought.data.agentId);
      }
      this.activeTasks.set(thought.data.taskId, agents);
    }

    this.thoughts.push(thought);
    this.notifyListeners();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const logMethod = type === 'error' ? console.error :
                       type === 'warning' ? console.warn :
                       console.log;
      logMethod(`[${type.toUpperCase()}] ${message}`, data);
    }

    // Store in database using Firestore v9 syntax
    const thoughtsCollection = collection(db, 'thoughts');
    addDoc(thoughtsCollection, thought)
      .catch((error: FirestoreError) => console.error('Failed to store thought:', error));

    return thought;
  }

  getThoughts(options: GetThoughtsOptions = {}): Thought[] {
    let filtered = [...this.thoughts];

    if (options.agentId) {
      filtered = filtered.filter(t => t.data?.agentId === options.agentId);
    }

    if (options.collaborationId) {
      filtered = filtered.filter(t => t.data?.collaborationId === options.collaborationId);
    }

    if (options.level) {
      filtered = filtered.filter(t => t.type === options.level);
    }

    const sinceTimestamp = options.since ?? null;
    if (sinceTimestamp !== null) {
      filtered = filtered.filter(t => {
        // Convert ISO string timestamp to milliseconds for direct comparison
        const thoughtTimestamp = Date.parse(t.timestamp);
        return thoughtTimestamp >= sinceTimestamp;
      });
    }

    if (options.taskId) {
      filtered = filtered.filter(t => t.data?.taskId === options.taskId);
    }

    if (options.source) {
      filtered = filtered.filter(t => t.data?.source === options.source);
    }

    return filtered;
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
