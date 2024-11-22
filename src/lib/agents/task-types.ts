import { z } from 'zod';

export interface Task {
  id: string;
  type: string;
  payload: unknown;
  priority?: number;
  deadline?: Date;
  dependencies?: string[];
  metadata?: Record<string, unknown>;
}

export interface TaskStatus {
  taskId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
}

export const TaskSchema = z.object({
  id: z.string(),
  type: z.string(),
  payload: z.unknown(),
  priority: z.number().optional(),
  deadline: z.date().optional(),
  dependencies: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional()
});
