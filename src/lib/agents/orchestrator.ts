import { AgentRegistry } from './registry';
import { BaseAgent } from './core/base-agent';
import { DynamicConfigManager } from './dynamic-config-manager';
import { AgentConfig } from './agent-types';

export class Orchestrator {
  private registry: AgentRegistry;
  private configManager: DynamicConfigManager;

  constructor() {
    this.registry = AgentRegistry.getInstance();
    this.configManager = new DynamicConfigManager();
  }

  async executeTask(taskId: string, agentId: string, payload: unknown): Promise<unknown> {
    const agent = this.registry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found for task ${taskId}`);
    }

    // Apply dynamic configuration if available
    const dynamicConfig = this.configManager.getConfig(agentId);
    if (dynamicConfig) {
      await this.applyConfiguration(agent, dynamicConfig, taskId);
    }

    try {
      const result = await agent.execute(payload);
      // Could emit a task completion event with taskId
      agent.emit('taskComplete', { taskId, result });
      return result;
    } catch (error) {
      // Include taskId in error handling
      agent.emit('taskError', { taskId, error });
      throw new Error(`Task ${taskId} execution failed: ${error}`);
    }
  }

  private async applyConfiguration(agent: BaseAgent, config: AgentConfig, taskId: string): Promise<void> {
    // Include taskId in configuration update event
    agent.emit('configUpdate', { config, taskId });
    
    // Additional configuration logic can be added here
    // For example, updating agent capabilities or state
  }
}
