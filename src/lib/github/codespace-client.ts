import { thoughtLogger } from '../logging/thought-logger';
import { AppError } from '../errors/AppError';
import { GitHubClient } from './github-client';

export class CodespaceClient {
  private static instance: CodespaceClient;
  private githubClient: GitHubClient;

  private constructor() {
    this.githubClient = GitHubClient.getInstance();
  }

  static getInstance(): CodespaceClient {
    if (!CodespaceClient.instance) {
      CodespaceClient.instance = new CodespaceClient();
    }
    return CodespaceClient.instance;
  }

  async verifyCodespaceAccess(): Promise<boolean> {
    try {
      const isGitHubConnected = await this.githubClient.verifyConnection();
      if (!isGitHubConnected) {
        thoughtLogger.log('warning', 'GitHub connection required for Codespace access');
        return false;
      }

      // Check if we're running in a Codespace environment
      const isCodespace = Boolean(process.env.CODESPACE_NAME);
      thoughtLogger.log(
        isCodespace ? 'success' : 'info',
        isCodespace ? 'Running in Codespace environment' : 'Not running in Codespace environment'
      );

      return isCodespace;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to verify Codespace access', { error });
      return false;
    }
  }

  async getCurrentCodespaceInfo(): Promise<any> {
    try {
      if (!process.env.CODESPACE_NAME) {
        throw new AppError('Not running in a Codespace', 'CODESPACE_ERROR');
      }

      // Get current Codespace configuration
      const config = {
        name: process.env.CODESPACE_NAME,
        repository: process.env.GITHUB_REPOSITORY,
        branch: process.env.GITHUB_REF_NAME,
        environment: process.env.CODESPACE_ENVIRONMENT,
      };

      return config;
    } catch (error) {
      throw new AppError('Failed to get Codespace info', 'CODESPACE_ERROR', error);
    }
  }

  async syncWithRepository(): Promise<void> {
    try {
      if (!process.env.CODESPACE_NAME || !process.env.GITHUB_REPOSITORY) {
        throw new AppError('Not running in a Codespace', 'CODESPACE_ERROR');
      }

      const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
      
      // Get latest changes from the repository
      await this.githubClient.getRepository(owner, repo);

      thoughtLogger.log('success', 'Synced with repository successfully');
    } catch (error) {
      throw new AppError('Failed to sync with repository', 'CODESPACE_ERROR', error);
    }
  }

  isCodespaceEnvironment(): boolean {
    return Boolean(process.env.CODESPACE_NAME);
  }
}