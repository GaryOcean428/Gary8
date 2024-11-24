import { BaseAgent } from './base-agent';
import { thoughtLogger } from '../../logging/thought-logger';
import { AgentConfig } from '../agent-types';

interface TaskStep {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  dependencies: string[];
  result?: any;
}

interface TaskPlan {
  steps: TaskStep[];
  currentStepIndex: number;
}

export class TaskAgent extends BaseAgent {
  private taskPlan: TaskPlan | null = null;

  constructor(config: AgentConfig) {
    super({
      ...config,
      capabilities: [
        ...config.capabilities,
        { name: 'task_planning', type: 'core', description: 'Break down complex tasks into steps' },
        { name: 'task_execution', type: 'core', description: 'Execute individual task steps' }
      ]
    });
  }

  async execute(task: string): Promise<any> {
    try {
      thoughtLogger.log('info', 'Starting task execution', { 
        agentId: this.getId(),
        task 
      });

      // Generate task plan
      this.taskPlan = await this.planTask(task);

      // Execute steps
      const results = [];
      for (const step of this.taskPlan.steps) {
        if (step.dependencies.some(depId => 
          this.taskPlan?.steps.find(s => s.id === depId)?.status !== 'completed'
        )) {
          continue;
        }

        step.status = 'in_progress';
        try {
          // Select appropriate tool for the step
          const toolResult = await this.executeStep(step);
          step.status = 'completed';
          step.result = toolResult;
          results.push(toolResult);
        } catch (error) {
          step.status = 'failed';
          thoughtLogger.log('error', 'Step execution failed', {
            stepId: step.id,
            error
          });
        }
      }

      return this.aggregateResults(results);
    } catch (error) {
      thoughtLogger.log('error', 'Task execution failed', {
        agentId: this.getId(),
        error
      });
      throw error;
    }
  }

  private async planTask(task: string): Promise<TaskPlan> {
    // Use LLM to break down task into steps
    const planningPrompt = `Break down the following task into steps:
    Task: ${task}
    Consider dependencies between steps and required tools for each step.`;

    try {
      const response = await this.useTool('code_interpreter', planningPrompt);
      // Parse and structure the response into TaskPlan
      const steps = this.parseSteps(response);
      return {
        steps,
        currentStepIndex: 0
      };
    } catch (error) {
      thoughtLogger.log('error', 'Task planning failed', { error });
      throw error;
    }
  }

  private async executeStep(step: TaskStep): Promise<any> {
    thoughtLogger.log('info', 'Executing step', { 
      stepId: step.id,
      description: step.description 
    });

    // Determine required tool based on step description
    const tool = this.selectToolForStep(step);
    if (!tool) {
      throw new Error(`No suitable tool found for step: ${step.description}`);
    }

    return await this.useTool(tool, step.description);
  }

  private selectToolForStep(step: TaskStep): string | null {
    // Logic to select appropriate tool based on step description
    if (step.description.includes('search') || step.description.includes('find')) {
      return 'web_search';
    }
    if (step.description.includes('extract') && step.description.includes('pdf')) {
      return 'pdf2csv';
    }
    if (step.description.includes('code') || step.description.includes('implement')) {
      return 'code_interpreter';
    }
    return null;
  }

  private parseSteps(planningResponse: string): TaskStep[] {
    // Parse LLM response into structured steps
    // This is a simplified version - you might want to make it more robust
    const steps = planningResponse.split('\n')
      .filter(line => line.trim())
      .map((step, index) => ({
        id: `step_${index}`,
        description: step,
        status: 'pending' as const,
        dependencies: [], // You might want to parse dependencies from the response
      }));

    return steps;
  }

  private aggregateResults(results: any[]): any {
    // Combine results from all steps
    return results.reduce((acc, result) => {
      if (typeof result === 'string') {
        return acc + '\n' + result;
      }
      return { ...acc, ...result };
    }, {});
  }
} 