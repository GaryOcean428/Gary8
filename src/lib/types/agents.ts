export type AgentRole = 'primary' | 'utility';

export type AgentCapability = 
  | 'web-browsing'
  | 'code-execution'
  | 'task-delegation'
  | 'code-generation'
  | 'data-analysis';

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  model: string;
  capabilities: AgentCapability[];
  superiorId?: string;
}