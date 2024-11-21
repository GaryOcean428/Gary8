import { EventEmitter } from '../events/event-emitter';
import { thoughtLogger } from '../logging/thought-logger';
import { AgentRegistry } from './registry';
import { TaskPlanner } from './task-planner';
import { MemoryManager } from '../memory/memory-manager';
import { ModelRouter } from '../routing/model-router';
import type { AgentConfig, AgentMessage, AgentEvent } from './agent-types';
import { z } from 'zod';

export class Orchestrator extends EventEmitter {
  private config: AgentConfig;
  private registry: AgentRegistry;
  private planner: TaskPlanner;
  private memory: MemoryManager;
  private router: ModelRouter;
  private activeTasks: Map<string, string[]> = new Map();

  constructor(config: AgentConfig) {
    super();
    this.config = config;
    this.registry = AgentRegistry.getInstance();
    this.planner = new TaskPlanner();
    this.memory = new MemoryManager();
    this.router = new ModelRouter();

    // Register for agent events
    this.registry.on('agent-event', this.handleAgentEvent.bind(this));
  }

  async processTask(content: string): Promise<void> {
    const taskId = crypto.randomUUID();
    thoughtLogger.log('plan', 'Orchestrator processing new task', { taskId });

    try {
      // Generate task plan
      const plan = await this.planner.createPlan(content);
      
      // Route to appropriate agents
      const routerConfig = await this.router.route(content, []);
      
      // Create agent swarm
      const agents = await this.createAgentSwarm(plan, routerConfig);
      this.activeTasks.set(taskId, agents.map(a => a.id));

      // Execute plan with agents
      for (const step of plan.steps) {
        const agent = this.findBestAgent(agents, step);
        if (!agent) {
          throw new Error(`No suitable agent found for step: ${step.type}`);
        }

        const message: AgentMessage = {
          id: crypto.randomUUID(),
          from: this.config.id,
          to: agent.id,
          content: step.description,
          type: 'command',
          timestamp: Date.now()
        };

        await this.sendMessage(message);
        
        // Wait for step completion
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Step execution timeout'));
          }, 30000);

          this.once('step-completed', ({ stepId }) => {
            if (stepId === step.id) {
              clearTimeout(timeout);
              resolve(true);
            }
          });
        });
      }

      thoughtLogger.log('success', 'Task completed successfully', { taskId });
    } catch (error) {
      thoughtLogger.log('error', 'Task execution failed', { taskId, error });
      throw error;
    } finally {
      this.activeTasks.delete(taskId);
    }
  }

  private async createAgentSwarm(plan: any, config: any): Promise<AgentConfig[]> {
    const requiredRoles = new Set<string>();
    
    // Analyze plan steps to determine required agent roles
    for (const step of plan.steps) {
      switch (step.type) {
        case 'research':
          requiredRoles.add('researcher');
          break;
        case 'analyze':
          requiredRoles.add('analyst');
          break;
        case 'code':
          requiredRoles.add('coder');
          break;
        case 'write':
          requiredRoles.add('writer');
          break;
        case 'review':
          requiredRoles.add('critic');
          break;
        case 'execute':
          requiredRoles.add('executor');
          break;
      }
    }

    // Create agents for required roles
    const agents: AgentConfig[] = [];
    for (const role of requiredRoles) {
      const agent = await this.registry.createAgent({
        id: crypto.randomUUID(),
        name: `${role}-agent`,
        role: role as any,
        capabilities: this.getCapabilitiesForRole(role),
        model: this.getModelForRole(role, config),
        temperature: 0.7,
        maxTokens: 4096,
        systemPrompt: this.getSystemPromptForRole(role),
        tools: this.getToolsForRole(role)
      });
      agents.push(agent);
    }

    return agents;
  }

  private getCapabilitiesForRole(role: string): string[] {
    // Map roles to required capabilities
    const capabilityMap: Record<string, string[]> = {
      researcher: ['web-search', 'memory-access'],
      analyst: ['data-analysis', 'content-generation'],
      coder: ['code-execution', 'tool-usage'],
      writer: ['content-generation', 'self-reflection'],
      critic: ['error-handling', 'self-reflection'],
      executor: ['tool-usage', 'agent-communication']
    };
    return capabilityMap[role] || [];
  }

  private getModelForRole(role: string, config: any): string {
    // Map roles to appropriate models based on requirements
    switch (role) {
      case 'researcher':
        return 'llama-3.1-sonar-large-128k-online';
      case 'analyst':
        return 'llama-3.2-70b-preview';
      case 'coder':
        return 'granite-3b-code-base-2k';
      case 'writer':
        return 'llama-3.2-70b-preview';
      case 'critic':
        return 'llama-3.2-7b-preview';
      case 'executor':
        return 'llama-3.2-3b-preview';
      default:
        return config.model;
    }
  }

  private getSystemPromptForRole(role: string): string {
    // Role-specific system prompts
    const prompts: Record<string, string> = {
      researcher: 'You are a research specialist focused on gathering accurate and relevant information...',
      analyst: 'You are a data analyst skilled at processing information and generating insights...',
      coder: 'You are a coding expert focused on generating high-quality, maintainable code...',
      writer: 'You are a content specialist skilled at creating clear and engaging content...',
      critic: 'You are a quality control specialist focused on reviewing and improving work...',
      executor: 'You are a task execution specialist skilled at using tools and completing objectives...'
    };
    return prompts[role] || '';
  }

  private getToolsForRole(role: string): string[] {
    // Map roles to available tools
    const toolMap: Record<string, string[]> = {
      researcher: ['web-search', 'document-retrieval'],
      analyst: ['data-processing', 'visualization'],
      coder: ['code-execution', 'version-control'],
      writer: ['content-generation', 'grammar-check'],
      critic: ['code-review', 'content-review'],
      executor: ['file-operations', 'system-commands']
    };
    return toolMap[role] || [];
  }

  private findBestAgent(agents: AgentConfig[], step: any): AgentConfig | undefined {
    return agents.find(agent => 
      agent.capabilities.some(cap => 
        step.requiredCapabilities.includes(cap)
      )
    );
  }

  private async sendMessage(message: AgentMessage): Promise<void> {
    thoughtLogger.log('execution', 'Sending message', {
      from: message.from,
      to: message.to,
      type: message.type
    });

    try {
      const agent = this.registry.getAgent(message.to);
      if (!agent) {
        throw new Error(`Agent ${message.to} not found`);
      }

      await agent.receiveMessage(message);
    } catch (error) {
      thoughtLogger.log('error', 'Failed to send message', { error });
      throw error;
    }
  }

  private handleAgentEvent(event: AgentEvent): void {
    thoughtLogger.log('observation', 'Received agent event', {
      type: event.type,
      agentId: event.agentId
    });

    switch (event.type) {
      case 'task-completed':
        this.emit('step-completed', {
          stepId: event.data.stepId,
          result: event.data.result
        });
        break;
      
      case 'task-failed':
        this.emit('step-failed', {
          stepId: event.data.stepId,
          error: event.data.error
        });
        break;
      
      case 'error-occurred':
        thoughtLogger.log('error', 'Agent error occurred', {
          agentId: event.agentId,
          error: event.data.error
        });
        break;
    }
  }
}