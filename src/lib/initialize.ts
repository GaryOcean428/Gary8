import { thoughtLogger } from './logging/thought-logger';
import { SystemInitializer } from './system/system-initializer';
import { SearchService } from './services/search-service';
import { GitHubClient } from './github/github-client';
import { CodeAwareness } from './system/code-awareness';
import { config } from './config';
import { firebaseService } from './services/firebase';

export async function initializeSystem() {
  try {
    thoughtLogger.log('plan', 'Starting system initialization');

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

    thoughtLogger.log('success', 'System initialization complete');
    return true;
  } catch (error) {
    thoughtLogger.log('error', 'System initialization failed', { error });
    // Return true even if some services fail to initialize
    // This prevents the blank screen and allows the app to function with reduced capabilities
    return true;
  }
}