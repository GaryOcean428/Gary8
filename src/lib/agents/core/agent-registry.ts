import { EventEmitter } from '../../events/event-emitter';
import { thoughtLogger } from '../../logging/thought-logger';
import type { AgentConfig, AgentEvent } from '../types';
import { z } from 'zod';
import { MCPClient } from '../../mcp/MCPClient';

export class AgentRegistry extends EventEmitter {
  private static instance: AgentRegistry;
  private agents: Map<string, AgentConfig> = new Map();
  private capabilities: Map<string, Set<string>> = new Map();
  private mcpClients: Map<string, MCPClient> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  async createAgent(config: AgentConfig): Promise<AgentConfig> {
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
      }).parseAsync(config);

      // Check if agent has MCP capabilities
      if (validatedConfig.capabilities.includes('mcp') && !this.mcpClients.has(validatedConfig.id)) {
        // Initialize MCP client for this agent
        const mcpClient = new MCPClient(validatedConfig.id);
        await mcpClient.initialize();
        this.mcpClients.set(validatedConfig.id, mcpClient);
      }

      // Register agent
      this.agents.set(validatedConfig.id, validatedConfig);

      // Index capabilities
      validatedConfig.capabilities.forEach(capability => {
        if (!this.capabilities.has(capability)) {
          this.capabilities.set(capability, new Set());
        }
        this.capabilities.get(capability)?.add(validatedConfig.id);
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

  getAgent(id: string): AgentConfig | undefined {
    return this.agents.get(id);
  }

  findAgentsByCapability(capability: string): AgentConfig[] {
    const agentIds = this.capabilities.get(capability);
    if (!agentIds) return [];

    return Array.from(agentIds)
      .map(id => this.agents.get(id))
      .filter((agent): agent is AgentConfig => agent !== undefined);
  }

  findAgentsByRole(role: string): AgentConfig[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.role === role);
  }

  async removeAgent(id: string): Promise<void> {
    const agent = this.agents.get(id);
    if (!agent) return;

    // Clean up MCP client if exists
    if (this.mcpClients.has(id)) {
      const mcpClient = this.mcpClients.get(id);
      await mcpClient?.disconnect();
      this.mcpClients.delete(id);
    }

    // Remove from capabilities index
    agent.capabilities.forEach(capability => {
      this.capabilities.get(capability)?.delete(id);
    });

    // Remove agent
    this.agents.delete(id);

    thoughtLogger.log('success', 'Agent removed', { agentId: id });
  }

  emitAgentEvent(event: AgentEvent): void {
    thoughtLogger.log('observation', 'Agent event emitted', {
      type: event.type,
      agentId: event.agentId
    });

    this.emit('agent-event', event);
  }

  getAgentCount(): number {
    return this.agents.size;
  }

  getCapabilities(): string[] {
    return Array.from(this.capabilities.keys());
  }

  getAllAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }
  
  getMCPClient(agentId: string): MCPClient | undefined {
    return this.mcpClients.get(agentId);
  }
  
  getAllMCPClients(): MCPClient[] {
    return Array.from(this.mcpClients.values());
  }

  clear(): void {
    this.agents.clear();
    this.capabilities.clear();
    
    // Clean up all MCP clients
    this.mcpClients.forEach(client => client.disconnect());
    this.mcpClients.clear();
    
    thoughtLogger.log('success', 'Agent registry cleared');
  }
}

export const agentRegistry = AgentRegistry.getInstance();