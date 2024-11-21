import { thoughtLogger } from '../logging/thought-logger';
import { AgentRegistry } from './core/agent-registry';
import { ModelRouter } from '../routing/router';
import { MemoryManager } from '../memory/memory-manager';
import { CodeAgent } from './code-agent';
import type { Message } from '../types';

export class AgentSystem {
  private static instance: AgentSystem;
  private registry: AgentRegistry;
  private modelRouter: ModelRouter;
  private memoryManager: MemoryManager;
  private initialized = false;

  private constructor() {
    this.registry = AgentRegistry.getInstance();
    this.modelRouter = ModelRouter.getInstance();
    this.memoryManager = MemoryManager.getInstance();
  }

  static getInstance(): AgentSystem {
    if (!AgentSystem.instance) {
      AgentSystem.instance = new AgentSystem();
    }
    return AgentSystem.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      thoughtLogger.log('plan', 'Initializing agent system');

      // Initialize core systems
      await Promise.all([
        this.modelRouter.initialize(),
        this.memoryManager.initialize()
      ]);

      // Register specialized agents
      await this.registerAgents();

      this.initialized = true;
      thoughtLogger.log('success', 'Agent system initialized');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize agent system', { error });
      throw error;
    }
  }

  private async registerAgents(): Promise<void> {
    // Register code agent
    const codeAgent = new CodeAgent(
      'code-specialist',
      'Code Specialist'
    );
    this.registry.registerAgent(codeAgent);

    // Register other specialized agents...
    thoughtLogger.log('success', 'Agents registered successfully', {
      agentCount: this.registry.getAgentCount()
    });
  }

  async processMessage(
    content: string,
    onProgress?: (content: string) => void,
    onStateChange?: (state: string) => void
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const messageId = crypto.randomUUID();
    thoughtLogger.log('plan', 'Processing message', { messageId });

    try {
      // Create message object
      const message: Message = {
        id: messageId,
        role: 'user',
        content,
        timestamp: Date.now()
      };

      // Route to appropriate model/agent
      const routerConfig = await this.modelRouter.route(content, []);
      thoughtLogger.log('decision', `Selected model: ${routerConfig.model}`, {
        confidence: routerConfig.confidence
      });

      // Handle code-related tasks with code agent
      if (this.isCodeRelated(content)) {
        const codeAgent = this.registry.getAgentByCapability('code-generation');
        if (codeAgent) {
          onStateChange?.('coding');
          const response = await codeAgent.processMessage(message);
          onProgress?.(response.content);
          return;
        }
      }

      // Process with selected model
      const response = await this.modelRouter.processWithModel(
        message,
        routerConfig,
        onProgress
      );

      // Store in memory
      await this.memoryManager.storeMessage(message, response);

      thoughtLogger.log('success', 'Message processed successfully', {
        messageId,
        model: routerConfig.model
      });
    } catch (error) {
      thoughtLogger.log('error', 'Message processing failed', {
        messageId,
        error
      });
      throw error;
    }
  }

  private isCodeRelated(content: string): boolean {
    const codeKeywords = [
      'code',
      'function',
      'class',
      'implement',
      'program',
      'debug',
      'refactor',
      'review'
    ];

    return codeKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  getAgents() {
    return this.registry.getAllAgents();
  }

  get isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const agentSystem = AgentSystem.getInstance();