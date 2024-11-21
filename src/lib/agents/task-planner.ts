import { thoughtLogger } from '../logging/thought-logger';
import { ModelRouter } from '../routing/model-router';
import { z } from 'zod';

const TaskStep = z.object({
  id: z.string(),
  type: z.enum(['research', 'analyze', 'code', 'write', 'review', 'execute']),
  description: z.string(),
  requiredCapabilities: z.array(z.string()),
  dependencies: z.array(z.string()),
  status: z.enum(['pending', 'active', 'completed', 'failed']),
  assignedAgent: z.string().optional(),
  result: z.unknown().optional()
});

type TaskStep = z.infer<typeof TaskStep>;

const TaskPlan = z.object({
  id: z.string(),
  steps: z.array(TaskStep),
  status: z.enum(['planning', 'executing', 'completed', 'failed']),
  startTime: z.number(),
  endTime: z.number().optional()
});

type TaskPlan = z.infer<typeof TaskPlan>;

export class TaskPlanner {
  private router: ModelRouter;
  private activePlans: Map<string, TaskPlan> = new Map();

  constructor() {
    this.router = new ModelRouter();
  }

  async createPlan(task: string): Promise<TaskPlan> {
    const planId = crypto.randomUUID();
    thoughtLogger.log('plan', 'Creating task plan', { planId });

    try {
      // Route to planning model
      const routerConfig = await this.router.route(task, []);

      // Generate task steps based on complexity and requirements
      const steps = await this.generateTaskSteps(task, routerConfig);

      // Create and store task plan
      const plan: TaskPlan = {
        id: planId,
        steps,
        status: 'planning',
        startTime: Date.now()
      };

      this.activePlans.set(planId, plan);

      thoughtLogger.log('success', 'Task plan created', {
        planId,
        stepCount: steps.length
      });

      return plan;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to create task plan', { planId, error });
      throw error;
    }
  }

  private async generateTaskSteps(task: string, config: any): Promise<TaskStep[]> {
    const steps: TaskStep[] = [];
    const taskLower = task.toLowerCase();

    // Information gathering step
    if (this.requiresResearch(taskLower)) {
      steps.push({
        id: crypto.randomUUID(),
        type: 'research',
        description: 'Gather relevant information and context',
        requiredCapabilities: ['web-search', 'memory-access'],
        dependencies: [],
        status: 'pending'
      });
    }

    // Analysis step
    if (this.requiresAnalysis(taskLower)) {
      steps.push({
        id: crypto.randomUUID(),
        type: 'analyze',
        description: 'Analyze gathered information and identify key insights',
        requiredCapabilities: ['data-analysis', 'content-generation'],
        dependencies: steps.map(s => s.id),
        status: 'pending'
      });
    }

    // Code generation step
    if (this.requiresCode(taskLower)) {
      steps.push({
        id: crypto.randomUUID(),
        type: 'code',
        description: 'Generate required code implementation',
        requiredCapabilities: ['code-execution', 'tool-usage'],
        dependencies: steps.map(s => s.id),
        status: 'pending'
      });
    }

    // Content writing step
    if (this.requiresWriting(taskLower)) {
      steps.push({
        id: crypto.randomUUID(),
        type: 'write',
        description: 'Create content based on analysis',
        requiredCapabilities: ['content-generation', 'self-reflection'],
        dependencies: steps.map(s => s.id),
        status: 'pending'
      });
    }

    // Review step
    steps.push({
      id: crypto.randomUUID(),
      type: 'review',
      description: 'Review and validate generated content/code',
      requiredCapabilities: ['error-handling', 'self-reflection'],
      dependencies: steps.map(s => s.id),
      status: 'pending'
    });

    // Execution step
    steps.push({
      id: crypto.randomUUID(),
      type: 'execute',
      description: 'Execute final actions and compile results',
      requiredCapabilities: ['tool-usage', 'agent-communication'],
      dependencies: steps.map(s => s.id),
      status: 'pending'
    });

    return steps;
  }

  private requiresResearch(task: string): boolean {
    return /\b(search|find|gather|research|information about|learn about)\b/i.test(task);
  }

  private requiresAnalysis(task: string): boolean {
    return /\b(analyze|compare|evaluate|assess|understand)\b/i.test(task);
  }

  private requiresCode(task: string): boolean {
    return /\b(code|program|implement|function|class|algorithm)\b/i.test(task);
  }

  private requiresWriting(task: string): boolean {
    return /\b(write|create|generate|compose|draft)\b/i.test(task);
  }

  async executePlan(plan: TaskPlan): Promise<void> {
    plan.status = 'executing';
    thoughtLogger.log('execution', 'Executing task plan', { planId: plan.id });

    try {
      // Execute steps in dependency order
      const completed = new Set<string>();
      
      while (completed.size < plan.steps.length) {
        const readySteps = plan.steps.filter(step => 
          step.status === 'pending' &&
          step.dependencies.every(depId => completed.has(depId))
        );

        if (readySteps.length === 0) {
          throw new Error('Deadlock detected in task execution');
        }

        // Execute ready steps in parallel
        await Promise.all(readySteps.map(async step => {
          try {
            step.status = 'active';
            // Step execution handled by assigned agent
            completed.add(step.id);
            step.status = 'completed';
          } catch (error) {
            step.status = 'failed';
            throw error;
          }
        }));
      }

      plan.status = 'completed';
      plan.endTime = Date.now();

      thoughtLogger.log('success', 'Task plan executed successfully', {
        planId: plan.id,
        duration: plan.endTime - plan.startTime
      });
    } catch (error) {
      plan.status = 'failed';
      plan.endTime = Date.now();
      thoughtLogger.log('error', 'Task plan execution failed', { planId: plan.id, error });
      throw error;
    }
  }

  getPlan(planId: string): TaskPlan | undefined {
    return this.activePlans.get(planId);
  }

  getActivePlans(): TaskPlan[] {
    return Array.from(this.activePlans.values());
  }
}