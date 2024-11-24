import { GitHubClient } from '../clients/github-client';
import { ErrorHandler } from '../error/error-handler';
import { thoughtLogger } from '../utils/logger';
import { MonitoringService } from '../monitoring/monitoring-service';

interface DeploymentConfig {
  repository: string;
  branch: string;
  environment?: 'development' | 'staging' | 'production';
  codespace?: {
    machine: string;
    prebuilds: boolean;
  };
}

interface DeploymentResult {
  status: 'success' | 'failure';
  url?: string;
  logs: string[];
  duration: number;
}

export class DeploymentService {
  private static instance: DeploymentService;
  private github: GitHubClient;
  private monitoring: MonitoringService;

  private constructor() {
    this.github = GitHubClient.getInstance();
    this.monitoring = MonitoringService.getInstance();
  }

  static getInstance(): DeploymentService {
    if (!this.instance) {
      this.instance = new DeploymentService();
    }
    return this.instance;
  }

  async deployToCodespace(
    code: string,
    config: DeploymentConfig
  ): Promise<DeploymentResult> {
    return await ErrorHandler.handleWithRetry(async () => {
      const startTime = Date.now();
      const logs: string[] = [];

      try {
        // Create or get existing codespace
        const codespace = await this.github.createCodespace({
          repository: config.repository,
          machine: config.codespace?.machine || 'basicLinux32gb',
          prebuild: config.codespace?.prebuilds ?? true
        });

        // Execute code in codespace
        logs.push('Executing code in codespace...');
        const result = await this.github.executeInCodespace(
          codespace.id,
          code
        );
        logs.push(result.output);

        // Run tests if available
        if (result.hasTests) {
          logs.push('Running tests...');
          const testResults = await this.github.runTests(codespace.id);
          logs.push(testResults);
        }

        return {
          status: 'success',
          url: codespace.url,
          logs,
          duration: Date.now() - startTime
        };
      } catch (error) {
        thoughtLogger.error('Deployment failed', { error, config });
        return {
          status: 'failure',
          logs: [...logs, `Error: ${error.message}`],
          duration: Date.now() - startTime
        };
      }
    }, 'deploy to codespace');
  }

  async createPullRequest(
    code: string,
    config: DeploymentConfig
  ): Promise<string> {
    return await ErrorHandler.handleWithRetry(async () => {
      const branch = `feature/${Date.now()}`;
      
      // Create new branch
      await this.github.createBranch(config.repository, branch);

      // Commit code
      await this.github.commitFiles(config.repository, branch, [{
        path: 'generated-code.ts',
        content: code
      }]);

      // Create PR
      const pr = await this.github.createPullRequest({
        repository: config.repository,
        title: 'Generated Code from Canvas',
        body: 'This PR contains code generated from the canvas system.',
        base: config.branch,
        head: branch
      });

      return pr.url;
    }, 'create pull request');
  }
} 