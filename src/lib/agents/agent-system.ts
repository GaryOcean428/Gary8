import { Message } from '../types';
import { CollaborationManager } from './collaboration-manager';
import { AgentRegistry } from './core/agent-registry';
import { ModelRouter } from '../routing/router';
import { thoughtLogger } from '../logging/thought-logger';
import { ErrorHandler } from '../errors/ErrorHandler';
import { ContextManager } from '../context/ContextManager';
import { ContextEnhancer } from '../context/ContextEnhancer';

export class AgentSystem {
  private collaborationManager: CollaborationManager;
  private agentRegistry: AgentRegistry;
  private modelRouter: ModelRouter;
  private contextManager: ContextManager;
  private contextEnhancer: ContextEnhancer;
  private isProcessing: boolean = false;
  private isPaused: boolean = false;

  constructor() {
    this.collaborationManager = new CollaborationManager();
    this.agentRegistry = AgentRegistry.getInstance();
    this.modelRouter = new ModelRouter();
    this.contextManager = ContextManager.getInstance();
    this.contextEnhancer = ContextEnhancer.getInstance();

    // Initialize default agents
    this.initializeAgents();
  }

  private initializeAgents(): void {
    // Create primary agent
    this.agentRegistry.createAgent({
      id: 'primary',
      name: 'Primary Agent',
      role: 'primary',
      model: 'grok-beta',
      capabilities: ['task-delegation', 'response-generation']
    });

    // Create specialist agents
    this.agentRegistry.createAgent({
      id: 'search-specialist',
      name: 'Search Specialist',
      role: 'specialist',
      model: 'llama-3.1-sonar-large-128k-online',
      capabilities: ['web-search', 'data-gathering'],
      superiorId: 'primary'
    });

    this.agentRegistry.createAgent({
      id: 'analysis-specialist',
      name: 'Analysis Specialist',
      role: 'specialist',
      model: 'llama-3.2-70b-preview',
      capabilities: ['data-analysis', 'insight-generation'],
      superiorId: 'primary'
    });

    // Create task agents
    this.agentRegistry.createAgent({
      id: 'data-processor',
      name: 'Data Processor',
      role: 'task',
      model: 'llama-3.2-7b-preview',
      capabilities: ['data-processing', 'format-conversion'],
      superiorId: 'primary'
    });
  }

  async processMessage(
    content: string,
    onProgress?: (content: string) => void,
    onStateChange?: (state: string) => void
  ): Promise<void> {
    if (this.isProcessing || this.isPaused) return;

    this.isProcessing = true;
    thoughtLogger.log('plan', 'Processing new message');

    try {
      const message: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now()
      };

      // Get and enhance context
      await this.updateState('retrieving', onStateChange);
      const context = await this.contextManager.getContext(message);
      const enhancedContext = this.contextEnhancer.enhanceContext(message);

      // Start collaboration session
      const session = await this.collaborationManager.startCollaboration(message);

      // Monitor session progress
      let lastProgress = '';
      const progressInterval = setInterval(() => {
        const plan = this.collaborationManager.getSession(session.id);
        if (plan && onProgress && plan.messages.length > 0) {
          const latestMessage = plan.messages[plan.messages.length - 1];
          if (latestMessage.content !== lastProgress) {
            onProgress(latestMessage.content);
            lastProgress = latestMessage.content;
          }
        }
      }, 100);

      // Wait for session completion
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          clearInterval(progressInterval);
          this.collaborationManager.removeAllListeners(session.id);
        };

        this.collaborationManager.once(session.id, (event: any) => {
          cleanup();
          if (event.type === 'completed') {
            resolve();
          } else {
            reject(new Error(event.error));
          }
        });
      });

      // Update context with session results
      await this.contextManager.updateContext(session.id, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: lastProgress,
        timestamp: Date.now()
      });

      thoughtLogger.log('success', 'Message processing completed');
    } catch (error) {
      thoughtLogger.log('error', 'Message processing failed', { error });
      const handled = ErrorHandler.handle(error);
      throw new Error(handled.message);
    } finally {
      this.isProcessing = false;
      onStateChange?.(undefined);
    }
  }

  private async updateState(
    state: string,
    onStateChange?: (state: string) => void
  ): Promise<void> {
    onStateChange?.(state);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  getAgents(): any[] {
    return this.agentRegistry.getAllAgents();
  }
}

// Create and export singleton instance
export const agentSystem = new AgentSystem();