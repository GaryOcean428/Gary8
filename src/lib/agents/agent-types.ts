import { z } from 'zod';

export type ModelTier = '3B' | '7B' | '70B' | 'superior';

export type AgentCapability = 
  | 'planning'
  | 'execution'
  | 'reflection'
  | 'coordination'
  | 'analysis';

export const AGENT_ROLES = [
  'primary',
  'specialist',
  'task',
  'orchestrator',
  'researcher',
  'analyst',
  'coder',
  'writer',
  'critic',
  'executor'
] as const;

export type AgentRole = typeof AGENT_ROLES[number];

export type AgentStatus = 
  | 'idle'
  | 'active'
  | 'busy'
  | 'paused'
  | 'error'
  | 'waiting'
  | 'terminated';

export type MessageType = 
  | 'command'
  | 'response'
  | 'report'
  | 'query';

export interface AgentMetrics {
  tasksCompleted: number;
  successRate: number;
  averageResponseTime: number;
}

export interface AgentState {
  id: string;
  status: AgentStatus;
  currentTask?: string;
  subordinates: string[];
  lastActive: number;
  metrics: AgentMetrics;
}

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  capabilities: AgentCapability[];
  model: string;
  modelTier?: ModelTier;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  tools: string[];
  superiorId?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  type: MessageType;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface AgentEvent {
  type: 'task-completed' | 'task-failed' | 'error-occurred';
  agentId: string;
  data: Record<string, unknown>;
}

export const AgentConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(AGENT_ROLES),
  capabilities: z.array(z.enum([
    'planning',
    'execution',
    'reflection',
    'coordination',
    'analysis'
  ])),
  model: z.string(),
  modelTier: z.enum(['3B', '7B', '70B', 'superior']).optional(),
  temperature: z.number(),
  maxTokens: z.number(),
  systemPrompt: z.string(),
  tools: z.array(z.string()),
  superiorId: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});
