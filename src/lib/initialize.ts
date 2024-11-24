import { thoughtLogger } from './logging/thought-logger';
import { SystemInitializer } from './system/system-initializer';
import { SearchService } from './services/search-service';
import { GitHubClient } from './github/github-client';
import { CodeAwareness } from './system/code-awareness';
import { config } from './config';
import { firebaseService } from './services/firebase';
import { LangChainConfig } from './config/langchain-config';
import { WorkflowManager } from './langraph/workflow-manager';
import { ToolhouseConfig } from './config/toolhouse-config';
import { LangChainService } from './services/langchain-service';
import { ToolhouseService } from './services/toolhouse-service';

export async function initializeSystem() {
  try {
    thoughtLogger.log('plan', 'Starting system initialization');

    // Initialize LangChain configuration
    const langchainConfig = LangChainConfig.getInstance();
    await langchainConfig.initialize();

    // Initialize LangChain service
    const langchainService = LangChainService.getInstance();

    // Initialize Toolhouse configuration
    const toolhouseConfig = ToolhouseConfig.getInstance();
    await toolhouseConfig.initialize();

    // Initialize workflow manager
    const workflowManager = WorkflowManager.getInstance();
    await workflowManager.initialize();

    // Add API key validation
    if (!validateApiKeys()) {
      throw new Error('Invalid API configuration');
    }

    // Initialize Firebase first
    const firebase = firebaseService;
    thoughtLogger.log('success', 'Firebase initialized');

    // Skip GitHub initialization if no token is provided
    // This prevents the blank screen issue when GitHub token is missing
    if (config.apiKeys.github) {
      try {
        const githubClient = GitHubClient.getInstance();
        await githubClient.initialize();
        thoughtLogger.log('success', 'GitHub client initialized');
      } catch (error) {
        thoughtLogger.log('warning', 'GitHub initialization failed, continuing without GitHub integration', { error });
      }
    }

    // Initialize core services
    const searchService = SearchService.getInstance();
    const codeAwareness = CodeAwareness.getInstance();
    const systemInitializer = SystemInitializer.getInstance();

    // Initialize remaining services with error handling
    await Promise.allSettled([
      searchService.initialize().catch(error => {
        thoughtLogger.log('warning', 'Search service initialization failed', { error });
      }),
      codeAwareness.initialize().catch(error => {
        thoughtLogger.log('warning', 'Code awareness initialization failed', { error });
      }),
      systemInitializer.initialize()
    ]);

    // Initialize Toolhouse service
    const toolhouseService = ToolhouseService.getInstance();
    await toolhouseService.initialize();

    thoughtLogger.log('success', 'System initialization complete');
    return true;
  } catch (error) {
    thoughtLogger.log('error', 'System initialization failed', { error });
    // Return true even if some services fail to initialize
    // This prevents the blank screen and allows the app to function with reduced capabilities
    return true;
  }
}

function validateApiKeys(): boolean {
  const requiredKeys = [
    'PERPLEXITY_API_KEY',
    'ANTHROPIC_API_KEY',
    // ... other required keys
  ];
  
  return requiredKeys.every(key => 
    process.env[key] && process.env[key]!.length > 0
  );
}