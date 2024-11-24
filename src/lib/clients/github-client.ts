import { Octokit } from '@octokit/rest';
import { AppError } from '../error/app-error';
import { thoughtLogger } from '../utils/logger';

export class GitHubClient {
  private static instance: GitHubClient;
  private octokit: Octokit;

  private constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
      userAgent: 'Gary8-App/1.0.0'
    });
  }

  static getInstance(): GitHubClient {
    if (!this.instance) {
      this.instance = new GitHubClient();
    }
    return this.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.verifyAccess();
    } catch (error) {
      thoughtLogger.error('GitHub client initialization failed', { error });
      throw new AppError('Failed to initialize GitHub client', 'GITHUB_INIT_ERROR');
    }
  }

  private async verifyAccess(): Promise<void> {
    try {
      await this.octokit.users.getAuthenticated();
    } catch (error) {
      throw new AppError('GitHub authentication failed', 'GITHUB_AUTH_ERROR');
    }
  }
} 