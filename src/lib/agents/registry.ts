import { EventEmitter } from '../events/event-emitter';
import { thoughtLogger } from '../logging/thought-logger';
import type { AgentConfig, AgentEvent } from './agent-types';
import { z } from 'zod';

export class AgentRegistry extends EventEmitter {
  private static instance: AgentRegistry;
  private agents: Map<string, AgentConfig> = new Map();
  private capabilities: Map<string, Set<string>> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  async createAgent(_config: AgentConfig): Promise<AgentConfig> {
    try {
      // Validate config using Zod schema
      const validatedConfig = await z.object({
        id: z.string(),
        name: z.string(),
        role: z.string(),
        capabilities: z.array(z.string()),
        model: z.string(),
        temperature: z.number(),
        maxTokens: z.number(),
        systemPrompt: z.string(),
        tools: z.array(z.string())
      }).parseAsync(_config);

      // Register agent
      this.agents.set(validatedConfig.id, validatedConfig);

      // Index capabilities
      validatedConfig.capabilities.forEach(_capability => {
        if (!this.capabilities.has(_capability)) {
          this.capabilities.set(_capability, new Set());
        }
        this.capabilities.get(_capability)?.add(validatedConfig.id);
      });

      thoughtLogger.log('success', 'Agent created successfully', {
        agentId: validatedConfig.id,
        role: validatedConfig.role
      });

      return validatedConfig;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to create agent', { error });
      throw error;
    }
  }

  getAgent(_id: string): AgentConfig | undefined {
    return this.agents.get(_id);
  }

  findAgentsByCapability(_capability: string): AgentConfig[] {
    const agentIds = this.capabilities.get(_capability);
    if (!agentIds) return [];

    return Array.from(agentIds)
      .map(_id => this.agents.get(_id))
      .filter((_agent): _agent is AgentConfig => _agent !== undefined);
  }

  findAgentsByRole(_role: string): AgentConfig[] {
    return Array.from(this.agents.values())
      .filter(_agent => _agent.role === _role);
  }

  async removeAgent(_id: string): Promise<void> {
    const agent = this.agents.get(_id);
    if (!agent) return;

    // Remove from capabilities index
    agent.capabilities.forEach(_capability => {
      this.capabilities.get(_capability)?.delete(_id);
    });

    // Remove agent
    this.agents.delete(_id);

    thoughtLogger.log('success', 'Agent removed', { agentId: _id });
  }

  emitAgentEvent(_event: AgentEvent): void {
    thoughtLogger.log('observation', 'Agent event emitted', {
      type: _event.type,
      agentId: _event.agentId
    });

    this.emit('agent-event', _event);
  }

  getAgentCount(): number {
    return this.agents.size;
  }

  getCapabilities(): string[] {
    return Array.from(this.capabilities.keys());
  }

  clear(): void {
    this.agents.clear();
    this.capabilities.clear();
    thoughtLogger.log('success', 'Agent registry cleared');
  }
}