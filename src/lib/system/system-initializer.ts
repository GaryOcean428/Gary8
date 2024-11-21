import { thoughtLogger } from '../logging/thought-logger';
import { CodeAwareness } from './code-awareness';
import { GitHubClient } from '../github/github-client';
import { CodespaceClient } from '../github/codespace-client';
import { agentSystem } from '../agents/agent-system';
import { ModelRouter } from '../routing/router';
import { MemoryManager } from '../memory/memory-manager';

export class SystemInitializer {
  private static instance: SystemInitializer;
  private initialized = false;

  private constructor() {}

  static getInstance(): SystemInitializer {
    if (!SystemInitializer.instance) {
      SystemInitializer.instance = new SystemInitializer();
    }
    return SystemInitializer.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      thoughtLogger.log('plan', 'Starting system initialization');

      // Initialize code awareness first to enable self-awareness
      const codeAwareness = CodeAwareness.getInstance();
      await codeAwareness.initialize();

      // Initialize GitHub and Codespace clients
      const [githubClient, codespaceClient] = await Promise.all([
        GitHubClient.getInstance().verifyConnection(),
        CodespaceClient.getInstance().verifyCodespaceAccess()
      ]);

      // Initialize core systems
      const [modelRouter, memoryManager] = await Promise.all([
        ModelRouter.getInstance().initialize(),
        MemoryManager.getInstance().initialize()
      ]);

      // Initialize agent system
      await agentSystem.initialize();

      this.initialized = true;
      thoughtLogger.log('success', 'System initialization complete', {
        codeAwareness: codeAwareness.isInitialized,
        githubConnected: githubClient,
        codespaceAvailable: codespaceClient,
        modelRouter: modelRouter.isInitialized,
        memoryManager: memoryManager.isInitialized,
        agentSystem: agentSystem.isInitialized
      });
    } catch (error) {
      thoughtLogger.log('error', 'System initialization failed', { error });
      throw error;
    }
  }

  get isInitialized(): boolean {
    return this.initialized;
  }
}