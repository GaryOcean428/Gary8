import { z } from 'zod';

export const AgentRole = z.enum([
  'orchestrator',    // High-level task planning and delegation
  'researcher',      // Web search and information gathering
  'analyst',         // Data analysis and insights
  'coder',          // Code generation and execution
  'writer',         // Content generation and refinement
  'critic',         // Review and quality control
  'executor'        // Task execution and tool usage
]);

export type AgentRole = z.infer<typeof AgentRole>;

export const AgentCapability = z.enum([
  'web-search',
  'code-execution',
  'data-analysis',
  'content-generation',
  'task-planning',
  'tool-usage',
  'memory-access',
  'agent-communication',
  'error-handling',
  'self-reflection'
]);

export type AgentCapability = z.infer<typeof AgentCapability>;

export const AgentConfig = z.object({
  id: z.string(),
  name: z.string(),
  role: AgentRole,
  capabilities: z.array(AgentCapability),
  model: z.string(),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().positive(),
  systemPrompt: z.string(),
  tools: z.array(z.string()),
  metadata: z.record(z.unknown()).optional()
});

export type AgentConfig = z.infer<typeof AgentConfig>;

export const AgentMessage = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  content: z.string(),
  type: z.enum(['command', 'response', 'error', 'reflection', 'plan', 'result']),
  timestamp: z.number(),
  metadata: z.record(z.unknown()).optional()
});

export type AgentMessage = z.infer<typeof AgentMessage>;

export const AgentState = z.object({
  id: z.string(),
  status: z.enum(['idle', 'active', 'paused', 'error']),
  currentTask: z.string().optional(),
  memory: z.record(z.unknown()),
  metrics: z.object({
    tasksCompleted: z.number(),
    successRate: z.number(),
    averageResponseTime: z.number(),
    lastActive: z.number()
  })
});

export type AgentState = z.infer<typeof AgentState>;

export const AgentEvent = z.object({
  type: z.enum([
    'task-assigned',
    'task-completed',
    'task-failed',
    'message-sent',
    'message-received',
    'state-changed',
    'error-occurred',
    'reflection-added'
  ]),
  agentId: z.string(),
  timestamp: z.number(),
  data: z.record(z.unknown())
});

export type AgentEvent = z.infer<typeof AgentEvent>;