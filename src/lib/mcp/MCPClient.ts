import { thoughtLogger } from '../logging/thought-logger';
import { AppError } from '../errors/AppError';
import { EventEmitter } from '../events/event-emitter';
import { getNetworkStatus } from '../../core/supabase/supabase-client';

interface MCPResource {
  id: string;
  path: string;
  name: string;
  description: string;
  contentType: string;
}

interface MCPTool {
  id: string;
  name: string;
  description: string;
  parameters: unknown;
}

interface MCPPrompt {
  id: string;
  name: string;
  description: string;
  template: string;
  parameters?: any[];
}

interface MCPServerInfo {
  id: string;
  name: string;
  version: string;
  capabilities: {
    resources: boolean;
    tools: boolean;
    prompts: boolean;
    sampling: boolean;
  };
}

export class MCPClient extends EventEmitter {
  private agentId: string;
  private serverInfo?: MCPServerInfo;
  private resources: MCPResource[] = [];
  private tools: MCPTool[] = [];
  private prompts: MCPPrompt[] = [];
  private isConnected = false;
  private retryCount = 0;
  private maxRetries = 3;
  private connectionPromise?: Promise<void>;

  constructor(agentId: string) {
    super();
    this.agentId = agentId;
  }

  async initialize(): Promise<void> {
    if (this.isConnected) return;
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = this.connect();
    return this.connectionPromise;
  }

  private async connect(): Promise<void> {
    if (!getNetworkStatus()) {
      throw new AppError('Cannot connect to MCP server: Network is offline', 'NETWORK_ERROR');
    }

    try {
      thoughtLogger.log('execution', `MCP Client(${this.agentId}): Connecting to server`);
      
      // Simulate connection latency
      await new Promise(_resolve => setTimeout(_resolve, 300));
      
      // For demo purposes, we'll create a mock connection
      this.serverInfo = {
        id: 'mcp-server-1',
        name: 'Gary8 MCP Server',
        version: '1.0.0',
        capabilities: {
          resources: true,
          tools: true,
          prompts: true,
          sampling: true
        }
      };

      // Randomly fail to simulate connection issues (10% chance)
      if (Math.random() < 0.1 && this.retryCount < this.maxRetries) {
        this.retryCount++;
        throw new Error('Failed to connect to MCP server');
      }

      // Mock discovery of resources, tools, and prompts
      await this.discoverResources();
      await this.discoverTools();
      await this.discoverPrompts();

      this.isConnected = true;
      this.retryCount = 0;
      
      thoughtLogger.log('success', `MCP Client(${this.agentId}): Connected successfully to ${this.serverInfo.name}`);
      
      this.emit('connected', { 
        agentId: this.agentId, 
        serverInfo: this.serverInfo 
      });
      
      return;
    } catch (error) {
      thoughtLogger.log('error', `MCP Client(${this.agentId}): Connection failed`, { error, retryCount: this.retryCount });
      
      if (this.retryCount < this.maxRetries) {
        const delay = Math.pow(2, this.retryCount) * 500; // Exponential backoff
        thoughtLogger.log('execution', `MCP Client(${this.agentId}): Retrying in ${delay}ms (${this.retryCount + 1}/${this.maxRetries})`);
        
        await new Promise(_resolve => setTimeout(_resolve, delay));
        return this.connect();
      }
      
      throw new AppError(
        `Failed to connect to MCP server after ${this.maxRetries} attempts`,
        'MCP_CONNECTION_ERROR',
        { originalError: error }
      );
    } finally {
      this.connectionPromise = undefined;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      thoughtLogger.log('execution', `MCP Client(${this.agentId}): Disconnecting from server`);
      
      // Simulate disconnection
      await new Promise(_resolve => setTimeout(_resolve, 100));
      
      this.isConnected = false;
      this.resources = [];
      this.tools = [];
      this.prompts = [];
      this.serverInfo = undefined;
      
      thoughtLogger.log('success', `MCP Client(${this.agentId}): Disconnected successfully`);
      
      this.emit('disconnected', { agentId: this.agentId });
    } catch (error) {
      thoughtLogger.log('error', `MCP Client(${this.agentId}): Failed to disconnect`, { error });
      throw error;
    }
  }

  private async discoverResources(): Promise<void> {
    try {
      thoughtLogger.log('execution', `MCP Client(${this.agentId}): Discovering resources`);
      
      // Simulate resource discovery
      await new Promise(_resolve => setTimeout(_resolve, 100));
      
      this.resources = [
        {
          id: 'r1',
          path: '/documents',
          name: 'Documents',
          description: 'Access to your documents',
          contentType: 'application/json'
        },
        {
          id: 'r2',
          path: '/knowledge',
          name: 'Knowledge Base',
          description: 'Shared knowledge repository',
          contentType: 'application/json'
        }
      ];
      
      thoughtLogger.log('success', `MCP Client(${this.agentId}): Discovered ${this.resources.length} resources`);
    } catch (error) {
      thoughtLogger.log('error', `MCP Client(${this.agentId}): Failed to discover resources`, { error });
      throw error;
    }
  }

  private async discoverTools(): Promise<void> {
    try {
      thoughtLogger.log('execution', `MCP Client(${this.agentId}): Discovering tools`);
      
      // Simulate tool discovery
      await new Promise(_resolve => setTimeout(_resolve, 150));
      
      this.tools = [
        {
          id: 't1',
          name: 'web-search',
          description: 'Search the web for information',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query'
              },
              limit: {
                type: 'integer',
                description: 'Maximum number of results',
                default: 5
              }
            },
            required: ['query']
          }
        },
        {
          id: 't2',
          name: 'execute-code',
          description: 'Execute code in a sandbox environment',
          parameters: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'The code to execute'
              },
              language: {
                type: 'string',
                description: 'The programming language',
                enum: ['javascript', 'python', 'html', 'css']
              }
            },
            required: ['code', 'language']
          }
        },
        {
          id: 't3',
          name: 'analyze-data',
          description: 'Analyze data and generate statistics',
          parameters: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                description: 'The data to analyze'
              },
              operations: {
                type: 'array',
                description: 'The operations to perform',
                items: {
                  type: 'string',
                  enum: ['mean', 'median', 'mode', 'sum', 'min', 'max']
                }
              }
            },
            required: ['data']
          }
        }
      ];
      
      thoughtLogger.log('success', `MCP Client(${this.agentId}): Discovered ${this.tools.length} tools`);
    } catch (error) {
      thoughtLogger.log('error', `MCP Client(${this.agentId}): Failed to discover tools`, { error });
      throw error;
    }
  }

  private async discoverPrompts(): Promise<void> {
    try {
      thoughtLogger.log('execution', `MCP Client(${this.agentId}): Discovering prompts`);
      
      // Simulate prompt discovery
      await new Promise(_resolve => setTimeout(_resolve, 80));
      
      this.prompts = [
        {
          id: 'p1',
          name: 'data-analysis',
          description: 'Analyze dataset and provide insights',
          template: 'Analyze this {{dataType}} data and provide {{numInsights}} key insights: {{data}}'
        },
        {
          id: 'p2',
          name: 'code-review',
          description: 'Review code for bugs and improvements',
          template: 'Review this {{language}} code and identify bugs and potential improvements: {{code}}'
        }
      ];
      
      thoughtLogger.log('success', `MCP Client(${this.agentId}): Discovered ${this.prompts.length} prompts`);
    } catch (error) {
      thoughtLogger.log('error', `MCP Client(${this.agentId}): Failed to discover prompts`, { error });
      throw error;
    }
  }

  // Public methods to access discovered components
  getServerInfo(): MCPServerInfo | undefined {
    return this.serverInfo;
  }

  getResources(): MCPResource[] {
    return [...this.resources];
  }

  getTools(): MCPTool[] {
    return [...this.tools];
  }

  getPrompts(): MCPPrompt[] {
    return [...this.prompts];
  }

  async executeTool(_toolId: string, _parameters: unknown): Promise<unknown> {
    if (!this.isConnected) {
      throw new AppError('Cannot execute tool: Not connected to MCP server', 'MCP_ERROR');
    }

    const tool = this.tools.find(_t => _t.id === _toolId);
    if (!tool) {
      throw new AppError(`Tool not found: ${_toolId}`, 'MCP_ERROR');
    }

    try {
      thoughtLogger.log('execution', `MCP Client(${this.agentId}): Executing tool ${tool.name}`, { _parameters });
      
      // Simulate tool execution
      await new Promise(_resolve => setTimeout(_resolve, 500));
      
      // Mock responses for demo purposes
      let result;
      
      switch (tool.name) {
        case 'web-search':
          result = {
            results: [
              { title: 'Example Result 1', url: 'https://example.com/1', snippet: 'This is an example search result about ' + _parameters.query },
              { title: 'Example Result 2', url: 'https://example.com/2', snippet: 'Another example search result relevant to ' + _parameters.query }
            ],
            totalResults: 2
          };
          break;
          
        case 'execute-code':
          result = {
            output: 'Code executed successfully: ' + _parameters.code.substring(0, 30) + '...',
            execTime: '0.12s'
          };
          break;
          
        case 'analyze-data':
          result = {
            statistics: {
              mean: 42.5,
              median: 40,
              mode: 38,
              sum: 425,
              min: 10,
              max: 95
            },
            insights: [
              'The data shows a normal distribution',
              'There are no significant outliers'
            ]
          };
          break;
          
        default:
          result = { message: 'Tool executed successfully' };
      }
      
      thoughtLogger.log('success', `MCP Client(${this.agentId}): Tool ${tool.name} executed successfully`);
      
      return result;
    } catch (error) {
      thoughtLogger.log('error', `MCP Client(${this.agentId}): Failed to execute tool ${tool.name}`, { error });
      throw new AppError(
        `Failed to execute tool ${tool.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'MCP_TOOL_EXECUTION_ERROR',
        { _toolId, _parameters, originalError: error }
      );
    }
  }

  async getResource(_resourceId: string, _params?: unknown): Promise<unknown> {
    if (!this.isConnected) {
      throw new AppError('Cannot get resource: Not connected to MCP server', 'MCP_ERROR');
    }

    const resource = this.resources.find(_r => _r.id === _resourceId);
    if (!resource) {
      throw new AppError(`Resource not found: ${_resourceId}`, 'MCP_ERROR');
    }

    try {
      thoughtLogger.log('execution', `MCP Client(${this.agentId}): Fetching resource ${resource.name}`, { _params });
      
      // Simulate resource fetching
      await new Promise(_resolve => setTimeout(_resolve, 300));
      
      // Mock responses for demo purposes
      let content;
      
      switch (resource.path) {
        case '/documents':
          content = {
            documents: [
              { id: 'd1', name: 'Document 1', type: 'text/markdown', size: 1024 },
              { id: 'd2', name: 'Document 2', type: 'application/pdf', size: 5120 }
            ]
          };
          break;
          
        case '/knowledge':
          content = {
            entries: [
              { id: 'k1', title: 'Knowledge Entry 1', category: 'Science' },
              { id: 'k2', title: 'Knowledge Entry 2', category: 'Technology' }
            ]
          };
          break;
          
        default:
          content = { message: 'Resource content' };
      }
      
      thoughtLogger.log('success', `MCP Client(${this.agentId}): Resource ${resource.name} fetched successfully`);
      
      return content;
    } catch (error) {
      thoughtLogger.log('error', `MCP Client(${this.agentId}): Failed to fetch resource ${resource.name}`, { error });
      throw new AppError(
        `Failed to fetch resource ${resource.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'MCP_RESOURCE_ERROR',
        { _resourceId, _params, originalError: error }
      );
    }
  }
}