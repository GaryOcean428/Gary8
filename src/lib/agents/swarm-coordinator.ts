import { EventEmitter } from '../events/event-emitter';
import { thoughtLogger } from '../logging/thought-logger';
import { ModelRouter } from '../routing/router';
import { MemoryAggregator } from '../memory/memory-aggregator';
import type { Message } from '../types';

interface SwarmAgent {
  id: string;
  role: string;
  capabilities: Set<string>;
  status: 'idle' | 'active' | 'paused';
}

export class SwarmCoordinator extends EventEmitter {
  private agents: Map<string, SwarmAgent> = new Map();
  private tasks: Map<string, string[]> = new Map(); // taskId -> agentIds
  private router: ModelRouter;
  private memoryAggregator: MemoryAggregator;

  constructor() {
    super();
    this.router = new ModelRouter();
    this.memoryAggregator = MemoryAggregator.getInstance();
  }

  async processTask(message: Message): Promise<Message> {
    const taskId = crypto.randomUUID();
    thoughtLogger.log('plan', 'Starting swarm task processing', { taskId });

    try {
      // Analyze task complexity and requirements
      const routerConfig = await this.router.route(message.content, []);
      
      // Create agent swarm based on task requirements
      const swarm = this.createSwarm(message.content, routerConfig);
      this.tasks.set(taskId, swarm.map(agent => agent.id));

      // Execute task in parallel with coordinated agents
      const results = await Promise.all(
        swarm.map(agent => this.executeAgentTask(agent, message, taskId))
      );

      // Aggregate results using MoA approach
      const aggregatedContent = await this.memoryAggregator.aggregateResults(
        results.map(r => ({
          agentId: r.agentId,
          content: r.content,
          confidence: r.confidence
        }))
      );

      thoughtLogger.log('success', 'Swarm task completed', { taskId });

      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aggregatedContent,
        timestamp: Date.now()
      };
    } catch (error) {
      thoughtLogger.log('error', 'Swarm task failed', { taskId, error });
      throw error;
    }
  }

  private createSwarm(task: string, config: any): SwarmAgent[] {
    const swarm: SwarmAgent[] = [];

    // Add specialized agents based on task requirements
    if (task.toLowerCase().includes('search') || task.toLowerCase().includes('find')) {
      swarm.push(this.createAgent('search', ['web-search', 'data-gathering']));
    }

    if (task.toLowerCase().includes('analyze') || task.toLowerCase().includes('compare')) {
      swarm.push(this.createAgent('analysis', ['data-analysis', 'insight-generation']));
    }

    if (task.toLowerCase().includes('export') || task.toLowerCase().includes('table')) {
      swarm.push(this.createAgent('export', ['data-export', 'format-conversion']));
    }

    // Always add a coordinator agent
    swarm.push(this.createAgent('coordinator', ['task-coordination', 'result-synthesis']));

    return swarm;
  }

  private createAgent(role: string, capabilities: string[]): SwarmAgent {
    const agent: SwarmAgent = {
      id: crypto.randomUUID(),
      role,
      capabilities: new Set(capabilities),
      status: 'idle'
    };

    this.agents.set(agent.id, agent);
    return agent;
  }

  private async executeAgentTask(
    agent: SwarmAgent,
    message: Message,
    taskId: string
  ): Promise<{ agentId: string; content: string; confidence: number }> {
    thoughtLogger.log('execution', `Agent ${agent.id} starting task`, {
      role: agent.role,
      taskId
    });

    try {
      agent.status = 'active';
      
      // Simulate agent-specific processing
      const result = await this.simulateAgentProcessing(agent, message);

      agent.status = 'idle';
      return {
        agentId: agent.id,
        content: result,
        confidence: 0.9
      };
    } catch (error) {
      agent.status = 'idle';
      throw error;
    }
  }

  private async simulateAgentProcessing(
    agent: SwarmAgent,
    message: Message
  ): Promise<string> {
    // This is a placeholder for actual agent-specific processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `${agent.role} processed: ${message.content}`;
  }

  getActiveAgents(): SwarmAgent[] {
    return Array.from(this.agents.values()).filter(
      agent => agent.status === 'active'
    );
  }

  getTaskAgents(taskId: string): SwarmAgent[] {
    const agentIds = this.tasks.get(taskId) || [];
    return agentIds.map(id => this.agents.get(id)!).filter(Boolean);
  }
}