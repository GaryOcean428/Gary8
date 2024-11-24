export type LogLevel = 'info' | 'warning' | 'error' | 'debug';
export type LogSource = 
  | 'primary-agent'
  | 'specialist-agent'
  | 'task-agent'
  | 'tool-manager'
  | 'memory-system'
  | 'router';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  source: LogSource;
  message: string;
  groupId?: string;
  metadata?: Record<string, unknown>;
}