export interface Tool {
  name: string;
  description: string;
  execute: (...args: any[]) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface WebDataResult {
  url: string;
  content: string;
  metadata: {
    title?: string;
    timestamp: number;
    contentType?: string;
  };
}