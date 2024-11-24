import type { Tool } from '../types';
import { WebSearch } from './tools/web-search';
import { memoryManager } from './memory';

class ToolManager {
  private tools: Map<string, Tool> = new Map();
  private webSearch: WebSearch;

  constructor() {
    this.webSearch = new WebSearch();
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    this.register({
      name: 'searchWeb',
      description: 'Search the internet for information',
      execute: async ({ query }) => {
        if (typeof query !== 'string') {
          throw new Error('Query must be a string');
        }
        return this.webSearch.search(query);
      }
    });

    this.register({
      name: 'fetchWebContent',
      description: 'Fetch content from a URL',
      execute: async ({ url }) => {
        if (typeof url !== 'string') {
          throw new Error('URL must be a string');
        }
        return this.webSearch.fetchContent(url);
      }
    });

    this.register({
      name: 'searchMemory',
      description: 'Search through agent memory',
      execute: async ({ query }) => {
        if (typeof query !== 'string') {
          throw new Error('Query must be a string');
        }
        return memoryManager.search(query);
      }
    });
  }

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  async execute(name: string, args: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found`);
    }
    return tool.execute(args);
  }

  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}

export const tools = new ToolManager();