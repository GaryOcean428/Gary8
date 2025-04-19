import { Logger } from '../logging/Logger';
import { ToolError } from '../errors/AppError';
import { WebDataTools } from './web-data-tools';
import { GitHubTools } from './github-tools';
import { CompetitorAnalysisTool } from './competitor-analysis';
import type { Tool, ToolResult } from '../types/tools';
import { thoughtLogger } from '../logging/thought-logger';

class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, Tool> = new Map();
  private webDataTools: WebDataTools;
  private githubTools: GitHubTools;
  private competitorAnalysisTool: CompetitorAnalysisTool;

  private constructor() {
    this.webDataTools = WebDataTools.getInstance();
    this.githubTools = GitHubTools.getInstance();
    this.competitorAnalysisTool = CompetitorAnalysisTool.getInstance();
    this.registerDefaultTools();
  }

  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  private registerDefaultTools(): void {
    try {
      // Register GitHub tools
      this.githubTools.getTools().forEach(_tool => this.register(_tool));

      // Register web data tools
      this.register({
        name: 'scrape-github-links',
        description: 'Scrape repository links from a GitHub page and export to CSV',
        execute: async (_url: string) => {
          thoughtLogger.log('plan', `Starting GitHub scraping for ${_url}`);
          try {
            const links = await this.webDataTools.scrapeGitHubLinks(_url);
            const csv = await this.webDataTools.exportToCSV(links);
            
            return {
              success: true,
              result: {
                linkCount: links.length,
                csv
              }
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Failed to scrape GitHub links'
            };
          }
        }
      });

      // Register competitor analysis tool
      this.register({
        name: 'analyze-competitors',
        description: 'Analyze competitors in a specific industry and region',
        execute: async (_industry: string, _region: string) => {
          thoughtLogger.log('plan', `Starting competitor analysis for ${_industry} in ${_region}`);
          return this.competitorAnalysisTool.analyzeCompetitors(_industry, _region);
        }
      });

      thoughtLogger.log('success', 'Default tools registered successfully');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to register default tools', { error });
      throw new ToolError('Failed to register default tools', error);
    }
  }

  register(_tool: Tool): void {
    try {
      if (!_tool.name || !_tool.execute) {
        throw new ToolError('Invalid tool configuration');
      }

      this.tools.set(_tool.name, _tool);
      thoughtLogger.log('success', `Tool registered: ${_tool.name}`);
    } catch (error) {
      thoughtLogger.log('error', `Failed to register tool: ${_tool.name}`, { error });
      throw new ToolError(`Failed to register tool: ${_tool.name}`, error);
    }
  }

  async executeTool(_name: string, ..._args: any[]): Promise<ToolResult> {
    const tool = this.tools.get(_name);
    if (!tool) {
      const error = `Tool "${_name}" not found`;
      thoughtLogger.log('error', error);
      return {
        success: false,
        error
      };
    }

    try {
      thoughtLogger.log('execution', `Executing tool: ${_name}`, { _args });
      const result = await tool.execute(..._args);
      thoughtLogger.log('success', `Tool execution completed: ${_name}`);
      return result;
    } catch (error) {
      thoughtLogger.log('error', `Tool execution failed: ${_name}`, { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}

// Create and export the singleton instance
export const toolRegistry = ToolRegistry.getInstance();