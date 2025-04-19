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

  async processTask(_message: Message): Promise<Message> {
    const taskId = crypto.randomUUID();
    thoughtLogger.log('plan', 'Starting swarm task processing', { taskId });

    try {
      // Analyze task complexity and requirements
      const routerConfig = await this.router.route(_message.content, []);
      
      // Create agent swarm based on task requirements
      const swarm = this.createSwarm(_message.content, routerConfig);
      this.tasks.set(taskId, swarm.map(_agent => _agent.id));

      // Execute task in parallel with coordinated agents
      const results = await Promise.all(
        swarm.map(_agent => this.executeAgentTask(_agent, _message, taskId))
      );

      // Aggregate results using MoA approach
      const aggregatedContent = await this.memoryAggregator.aggregateResults(
        results.map(_r => ({
          agentId: _r.agentId,
          content: _r.content,
          confidence: _r.confidence
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

  private createSwarm(_task: string, _config: unknown): SwarmAgent[] {
    const swarm: SwarmAgent[] = [];

    // Add specialized agents based on task requirements
    if (_task.toLowerCase().includes('search') || _task.toLowerCase().includes('find')) {
      swarm.push(this.createAgent('search', ['web-search', 'data-gathering']));
    }

    if (_task.toLowerCase().includes('analyze') || _task.toLowerCase().includes('compare')) {
      swarm.push(this.createAgent('analysis', ['data-analysis', 'insight-generation']));
    }

    if (_task.toLowerCase().includes('export') || _task.toLowerCase().includes('table')) {
      swarm.push(this.createAgent('export', ['data-export', 'format-conversion']));
    }

    // Always add a coordinator agent
    swarm.push(this.createAgent('coordinator', ['task-coordination', 'result-synthesis']));

    return swarm;
  }

  private createAgent(_role: string, _capabilities: string[]): SwarmAgent {
    const agent: SwarmAgent = {
      id: crypto.randomUUID(),
      _role,
      capabilities: new Set(_capabilities),
      status: 'idle'
    };

    this.agents.set(agent.id, agent);
    return agent;
  }

  private async executeAgentTask(
    _agent: SwarmAgent,
    _message: Message,
    _taskId: string
  ): Promise<{ agentId: string; content: string; confidence: number }> {
    thoughtLogger.log('execution', `Agent ${_agent.id} starting task`, {
      role: _agent.role,
      _taskId
    });

    try {
      _agent.status = 'active';
      
      // Simulate agent-specific processing
      const result = await this.simulateAgentProcessing(_agent, _message);

      _agent.status = 'idle';
      return {
        agentId: _agent.id,
        content: result,
        confidence: 0.9
      };
    } catch (error) {
      _agent.status = 'idle';
      throw error;
    }
  }

  private async simulateAgentProcessing(
    _agent: SwarmAgent,
    _message: Message
  ): Promise<string> {
    // This is a placeholder for actual agent-specific processing
    await new Promise(_resolve => setTimeout(_resolve, 1000));
    return `${_agent.role} processed: ${_message.content}`;
  }

  getActiveAgents(): SwarmAgent[] {
    return Array.from(this.agents.values()).filter(
      _agent => _agent.status === 'active'
    );
  }

  getTaskAgents(_taskId: string): SwarmAgent[] {
    const agentIds = this.tasks.get(_taskId) || [];
    return agentIds.map(_id => this.agents.get(_id)!).filter(Boolean);
  }
}