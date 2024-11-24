import { EventEmitter } from '../../events/event-emitter';
import { AgentConfig, AgentState, AgentCapability } from '../agent-types';
import { MessageQueue } from './message-queue';
import { LlamaIndexService } from '../../services/llamaindex-service';
import { thoughtLogger } from '../../logging/thought-logger';

export interface ToolCapability {
  name: string;
  description: string;
  creditCost: number;
  provider: string;
}

export abstract class BaseAgent extends EventEmitter {
  protected config: AgentConfig;
  protected state: AgentState;
  protected messageQueue: MessageQueue;
  protected tools: Map<string, ToolCapability>;
  private subordinates: Map<string, BaseAgent>;
  protected llamaIndexService: LlamaIndexService;

  constructor(config: AgentConfig) {
    super();
    this.config = config;
    this.messageQueue = new MessageQueue();
    this.subordinates = new Map();
    this.tools = new Map();
    this.llamaIndexService = LlamaIndexService.getInstance();
    this.state = {
      id: config.id,
      status: 'idle',
      subordinates: [],
      lastActive: Date.now(),
      metrics: {
        tasksCompleted: 0,
        successRate: 1,
        averageResponseTime: 0
      }
    };

    // Initialize available tools
    this.initializeTools();
  }

  private async initializeTools() {
    try {
      // Core tools
      this.tools.set('web_scraper', {
        name: 'Get Page Contents',
        description: 'Web content extraction',
        creditCost: 1,
        provider: 'Exa'
      });

      this.tools.set('code_interpreter', {
        name: 'Code Interpreter',
        description: 'Execute LLM-generated code',
        creditCost: 1,
        provider: 'Toolhouse'
      });

      this.tools.set('web_search', {
        name: 'Web Search',
        description: 'Internet search capabilities',
        creditCost: 1,
        provider: 'Toolhouse'
      });

      // Additional tools
      this.tools.set('exa_search', {
        name: 'Exa Web Search',
        description: 'Enhanced internet search',
        creditCost: 1,
        provider: 'Toolhouse'
      });

      this.tools.set('pdf2csv', {
        name: 'PDF2CSV',
        description: 'Table extraction from PDFs',
        creditCost: 1,
        provider: 'MutatedMind.com'
      });

      thoughtLogger.log('success', 'Agent tools initialized', {
        agentId: this.getId(),
        toolCount: this.tools.size
      });
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize agent tools', {
        agentId: this.getId(),
        error
      });
    }
  }

  protected async useTool(toolName: string, ...args: any[]): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not available`);
    }

    thoughtLogger.log('info', `Using tool: ${toolName}`, {
      agentId: this.getId(),
      tool,
      args
    });

    try {
      // Handle different tool types
      switch (toolName) {
        case 'web_search':
        case 'web_scraper':
          return await this.llamaIndexService.searchAndAnalyze(args[0]);
        // Add other tool implementations as needed
        default:
          throw new Error(`Tool ${toolName} implementation not found`);
      }
    } catch (error) {
      thoughtLogger.log('error', `Tool ${toolName} execution failed`, {
        agentId: this.getId(),
        error
      });
      throw error;
    }
  }

  getAvailableTools(): ToolCapability[] {
    return Array.from(this.tools.values());
  }

  abstract execute(task: any): Promise<any>;

  getId(): string {
    return this.config.id;
  }

  getCapabilities(): AgentCapability[] {
    return this.config.capabilities;
  }

  protected getSubordinates(): Map<string, BaseAgent> {
    return this.subordinates;
  }
}
