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

// Zod schema for AgentMetrics
export const AgentMetricsSchema = z.object({
  tasksCompleted: z.number(),
  successRate: z.number(),
  averageResponseTime: z.number()
});

// Zod schema for AgentState
export const AgentStateSchema = z.object({
  id: z.string(),
  status: z.enum(['idle', 'active', 'busy', 'paused', 'error', 'waiting', 'terminated']),
  currentTask: z.string().optional(),
  subordinates: z.array(z.string()),
  lastActive: z.number(),
  metrics: AgentMetricsSchema
});

// Zod schema for AgentConfig
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

// Zod schema for AgentMessage
export const AgentMessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  content: z.string(),
  type: z.enum(['command', 'response', 'report', 'query']),
  timestamp: z.number(),
  metadata: z.record(z.unknown()).optional()
});

// Zod schema for AgentEvent
export const AgentEventSchema = z.object({
  type: z.enum(['task-completed', 'task-failed', 'error-occurred']),
  agentId: z.string(),
  data: z.record(z.unknown())
});
