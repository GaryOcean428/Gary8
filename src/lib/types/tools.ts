export interface ToolResult {
  success: boolean;
  result?: any;
  error?: string;
}

export interface Tool {
  name: string;
  description: string;
  execute(...args: any[]): Promise<ToolResult>;
}

export interface ToolMetadata {
  lastUsed?: number;
  usageCount: number;
  averageExecutionTime: number;
  successRate: number;
}