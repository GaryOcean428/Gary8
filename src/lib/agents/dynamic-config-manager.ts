import { AgentConfig } from './agent-types';

export class DynamicConfigManager {
  private configs: Map<string, AgentConfig> = new Map();

  updateConfig(agentId: string, configUpdate: Partial<AgentConfig>): void {
    const currentConfig = this.configs.get(agentId);
    if (currentConfig) {
      this.configs.set(agentId, { ...currentConfig, ...configUpdate });
    }
  }

  getConfig(agentId: string): AgentConfig | undefined {
    return this.configs.get(agentId);
  }

  initializeConfig(agentId: string, config: AgentConfig): void {
    this.configs.set(agentId, config);
  }
}
