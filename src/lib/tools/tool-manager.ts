import { Tool } from '../types';
import { AppError } from '../errors/AppError';

interface ToolMetadata {
  name: string;
  description: string;
  version: string;
  created: number;
  lastUsed?: number;
  usageCount: number;
}

export class ToolManager {
  private tools: Map<string, Tool> = new Map();
  private metadata: Map<string, ToolMetadata> = new Map();
  private readonly maxTools = 100;

  async registerTool(
    name: string, 
    tool: Tool, 
    metadata: Omit<ToolMetadata, 'created' | 'usageCount'>
  ): Promise<void> {
    if (this.tools.size >= this.maxTools) {
      await this.pruneTools();
    }

    if (this.tools.has(name)) {
      throw new AppError(`Tool ${name} already exists`, 'TOOL_ERROR');
    }

    this.tools.set(name, tool);
    this.metadata.set(name, {
      ...metadata,
      created: Date.now(),
      usageCount: 0
    });
  }

  async executeTool(name: string, ...args: unknown[]): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new AppError(`Tool ${name} not found`, 'TOOL_ERROR');
    }

    try {
      const meta = this.metadata.get(name)!;
      meta.lastUsed = Date.now();
      meta.usageCount++;
      
      return await tool.execute(...args);
    } catch (error) {
      throw new AppError(
        `Failed to execute tool ${name}`, 
        'TOOL_ERROR',
        error
      );
    }
  }

  async purgeTool(name: string): Promise<void> {
    const tool = this.tools.get(name);
    if (!tool) return;

    try {
      if (tool.cleanup) {
        await tool.cleanup();
      }
      
      this.tools.delete(name);
      this.metadata.delete(name);
    } catch (error) {
      throw new AppError(
        `Failed to purge tool ${name}`,
        'TOOL_ERROR',
        error
      );
    }
  }

  private async pruneTools(): Promise<void> {
    // Get tools sorted by last used timestamp and usage count
    const toolEntries = Array.from(this.metadata.entries())
      .sort(([, a], [, b]) => {
        const timeA = a.lastUsed || a.created;
        const timeB = b.lastUsed || b.created;
        
        // Prioritize keeping frequently used tools
        if (Math.abs(a.usageCount - b.usageCount) > 10) {
          return b.usageCount - a.usageCount;
        }
        
        return timeB - timeA;
      });

    // Keep only the most recent/useful tools
    const toolsToRemove = toolEntries
      .slice(this.maxTools / 2)
      .map(([name]) => name);

    await Promise.all(
      toolsToRemove.map(name => this.purgeTool(name))
    );
  }

  getToolMetadata(name: string): ToolMetadata | undefined {
    return this.metadata.get(name);
  }

  listTools(): Array<{ name: string; metadata: ToolMetadata }> {
    return Array.from(this.metadata.entries())
      .map(([name, metadata]) => ({ name, metadata }));
  }
}