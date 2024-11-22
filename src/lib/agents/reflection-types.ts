import { z } from 'zod';

export const ReflectionType = z.enum([
  'pre-execution',   // Initial plan review
  'mid-execution',   // Progress assessment
  'post-execution',  // Result evaluation
  'error-analysis',  // Problem identification
  'improvement',     // Enhancement suggestions
  'conversation'     // Casual chat detection
]);

export type ReflectionType = z.infer<typeof ReflectionType>;

export const ReflectionEntry = z.object({
  id: z.string(),
  type: ReflectionType,
  content: z.string(),
  confidence: z.number(),
  timestamp: z.number(),
  taskId: z.string().optional(),
  suggestions: z.array(z.string()),
  requiresRevision: z.boolean(),
  context: z.record(z.unknown())
});

export type ReflectionEntry = z.infer<typeof ReflectionEntry>;