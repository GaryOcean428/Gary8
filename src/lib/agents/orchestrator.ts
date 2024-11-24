import { BaseAgent } from './core/base-agent';
import { CodeAgent } from './code-agent';
import { thoughtLogger } from '../utils/logger';
import { ErrorHandler } from '../error/error-handler';
import { MonitoringService } from '../monitoring/monitoring-service';

interface Task {
  id: string;
  type: 'code' | 'search' | 'analysis' | 'execution';
  content: string;
  priority: number;
  dependencies?: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export class AgentOrchestrator {
  private static instance: AgentOrchestrator;
  private agents: Map<string, BaseAgent>;
  private taskQueue: Task[];
  private monitoring: MonitoringService;

  private constructor() {
    this.agents = new Map();
    this.taskQueue = [];
    this.monitoring = MonitoringService.getInstance();
    this.initializeAgents();
  }

  static getInstance(): AgentOrchestrator {
    if (!this.instance) {
      this.instance = new AgentOrchestrator();
    }
    return this.instance;
  }

  private initializeAgents(): void {
    // Initialize core agents
    this.agents.set('code', new CodeAgent({
      id: 'code-agent',
      capabilities: ['code_generation', 'code_review', 'testing']
    }));
    // Add more agents as needed
  }

  async executeTask(task: Task): Promise<any> {
    return await ErrorHandler.handleWithRetry(async () => {
      thoughtLogger.info('Executing task', { taskId: task.id, type: task.type });
      
      return await this.monitoring.trackOperation(`task_${task.type}`, async () => {
        const agent = this.getAgentForTask(task);
        if (!agent) {
          throw new Error(`No agent available for task type: ${task.type}`);
        }

        task.status = 'in_progress';
        const result = await agent.execute(task);
        task.status = 'completed';
        
        return result;
      });
    }, `execute_task_${task.id}`);
  }

  private getAgentForTask(task: Task): BaseAgent | undefined {
    switch (task.type) {
      case 'code':
        return this.agents.get('code');
      // Add more task types as needed
      default:
        return undefined;
    }
  }

  async planExecution(tasks: Task[]): Promise<Task[]> {
    // Sort tasks by priority and dependencies
    return tasks.sort((a, b) => {
      if (a.dependencies?.includes(b.id)) return 1;
      if (b.dependencies?.includes(a.id)) return -1;
      return b.priority - a.priority;
    });
  }

  async executeParallel(tasks: Task[]): Promise<any[]> {
    const plannedTasks = await this.planExecution(tasks);
    const results: any[] = [];
    
    // Group tasks that can be executed in parallel
    const taskGroups = this.groupParallelTasks(plannedTasks);
    
    for (const group of taskGroups) {
      const groupResults = await Promise.all(
        group.map(task => this.executeTask(task))
      );
      results.push(...groupResults);
    }
    
    return results;
  }

  private groupParallelTasks(tasks: Task[]): Task[][] {
    const groups: Task[][] = [];
    let currentGroup: Task[] = [];
    
    for (const task of tasks) {
      if (this.canRunInParallel(task, currentGroup)) {
        currentGroup.push(task);
      } else {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
        }
        currentGroup = [task];
      }
    }
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    return groups;
  }

  private canRunInParallel(task: Task, group: Task[]): boolean {
    return !group.some(t => 
      task.dependencies?.includes(t.id) || 
      t.dependencies?.includes(task.id)
    );
  }
}
