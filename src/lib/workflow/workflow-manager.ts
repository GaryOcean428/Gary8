import { thoughtLogger } from '../logging/thought-logger';
import { SwarmCoordinator } from '../agents/swarm-coordinator';
import { RealTimeProcessor } from '../agents/real-time-processor';
import type { Message } from '../types';

interface WorkflowStep {
  id: string;
  type: 'search' | 'process' | 'analyze' | 'export';
  status: 'pending' | 'active' | 'completed' | 'failed';
  result?: any;
}

interface Workflow {
  id: string;
  steps: WorkflowStep[];
  status: 'active' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
}

export class WorkflowManager {
  private swarmCoordinator: SwarmCoordinator;
  private realTimeProcessor: RealTimeProcessor;
  private workflows: Map<string, Workflow> = new Map();

  constructor() {
    this.swarmCoordinator = new SwarmCoordinator();
    this.realTimeProcessor = new RealTimeProcessor();
  }

  async processWorkflow(message: Message): Promise<Message> {
    const workflowId = crypto.randomUUID();
    const workflow: Workflow = {
      id: workflowId,
      steps: this.createWorkflowSteps(message),
      status: 'active',
      startTime: Date.now()
    };

    this.workflows.set(workflowId, workflow);
    thoughtLogger.log('plan', 'Starting workflow', { workflowId });

    try {
      // Execute workflow steps
      for (const step of workflow.steps) {
        step.status = 'active';
        thoughtLogger.log('execution', `Executing workflow step: ${step.type}`, {
          workflowId,
          stepId: step.id
        });

        try {
          step.result = await this.executeWorkflowStep(step, message);
          step.status = 'completed';
        } catch (error) {
          step.status = 'failed';
          throw error;
        }
      }

      // Aggregate results from all steps
      const finalResult = this.aggregateWorkflowResults(workflow);
      workflow.status = 'completed';
      workflow.endTime = Date.now();

      thoughtLogger.log('success', 'Workflow completed', {
        workflowId,
        duration: workflow.endTime - workflow.startTime
      });

      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: finalResult,
        timestamp: Date.now()
      };
    } catch (error) {
      workflow.status = 'failed';
      workflow.endTime = Date.now();
      thoughtLogger.log('error', 'Workflow failed', { workflowId, error });
      throw error;
    }
  }

  private createWorkflowSteps(message: Message): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    const content = message.content.toLowerCase();

    if (content.includes('search') || content.includes('find')) {
      steps.push({
        id: crypto.randomUUID(),
        type: 'search',
        status: 'pending'
      });
    }

    if (content.includes('process') || content.includes('analyze')) {
      steps.push({
        id: crypto.randomUUID(),
        type: 'process',
        status: 'pending'
      });
      steps.push({
        id: crypto.randomUUID(),
        type: 'analyze',
        status: 'pending'
      });
    }

    if (content.includes('export') || content.includes('table')) {
      steps.push({
        id: crypto.randomUUID(),
        type: 'export',
        status: 'pending'
      });
    }

    return steps;
  }

  private async executeWorkflowStep(
    step: WorkflowStep,
    message: Message
  ): Promise<any> {
    switch (step.type) {
      case 'search':
        return await this.swarmCoordinator.processTask({
          ...message,
          content: `Search: ${message.content}`
        });

      case 'process':
        return await this.realTimeProcessor.processInRealTime(
          message,
          content => thoughtLogger.log('observation', content),
          thought => thoughtLogger.log('reasoning', thought)
        );

      case 'analyze':
        return await this.swarmCoordinator.processTask({
          ...message,
          content: `Analyze: ${message.content}`
        });

      case 'export':
        return await this.swarmCoordinator.processTask({
          ...message,
          content: `Export: ${message.content}`
        });

      default:
        throw new Error(`Unknown workflow step type: ${step.type}`);
    }
  }

  private aggregateWorkflowResults(workflow: Workflow): string {
    // Combine results from all completed steps
    const results = workflow.steps
      .filter(step => step.status === 'completed')
      .map(step => step.result);

    // Format and return combined results
    return results.join('\n\n');
  }

  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  getActiveWorkflows(): Workflow[] {
    return Array.from(this.workflows.values()).filter(
      workflow => workflow.status === 'active'
    );
  }
}