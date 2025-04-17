export type AgentRole = 'primary' | 'specialist' | 'task';
export type AgentStatus = 'idle' | 'active' | 'paused' | 'error';
export type ModelTier = '3B' | '7B' | '70B' | 'superior';

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  modelTier: ModelTier;
  superiorId?: string;
  capabilities: string[];
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  type: 'command' | 'report' | 'query' | 'response';
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface AgentState {
  id: string;
  status: AgentStatus;
  currentTask?: string;
  subordinates: string[];
  lastActive: number;
  metrics: {
    tasksCompleted: number;
    successRate: number;
    averageResponseTime: number;
  };
}