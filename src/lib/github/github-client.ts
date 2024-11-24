import { Octokit } from '@octokit/rest';
import { thoughtLogger } from '../logging/thought-logger';
import { AppError } from '../errors/AppError';
import type { Repository, Branch, PullRequest } from './types';
import { config } from '../config';

export class GitHubClient {
  private static instance: GitHubClient;
  private octokit: Octokit;
  private initialized = false;

  private constructor() {
    this.octokit = new Octokit({
      auth: config.apiKeys.github,
      userAgent: 'Agent-One v1.0.0'
    });
  }

  static getInstance(): GitHubClient {
    if (!GitHubClient.instance) {
      GitHubClient.instance = new GitHubClient();
    }
    return GitHubClient.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      if (!config.apiKeys.github) {
        throw new AppError('GitHub API key not configured', 'CONFIG_ERROR');
      }

      // Verify connection and permissions
      const { data } = await this.octokit.users.getAuthenticated();
      
      thoughtLogger.log('success', 'GitHub connection verified', {
        username: data.login,
        scopes: data.scopes
      });

      this.initialized = true;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize GitHub client', { error });
      throw new AppError(
        'GitHub initialization failed',
        'GITHUB_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      if (!config.apiKeys.github) {
        thoughtLogger.log('warning', 'GitHub API key not configured');
        return false;
      }

      const { data } = await this.octokit.users.getAuthenticated();
      thoughtLogger.log('success', 'GitHub connection verified', {
        username: data.login,
        scopes: data.scopes
      });
      return true;
    } catch (error) {
      thoughtLogger.log('error', 'GitHub connection verification failed', { error });
      return false;
    }
  }

  async listRepositories(options: {
    type?: 'all' | 'owner' | 'public' | 'private' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  } = {}): Promise<Repository[]> {
    if (!this.initialized) await this.initialize();

    try {
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        ...options,
        per_page: options.per_page || 30,
        sort: options.sort || 'updated'
      });
      return data;
    } catch (error) {
      throw new AppError('Failed to list repositories', 'GITHUB_ERROR', error);
    }
  }

  async getRepository(owner: string, repo: string): Promise<Repository> {
    if (!this.initialized) await this.initialize();

    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo
      });
      return data;
    } catch (error) {
      throw new AppError('Failed to get repository', 'GITHUB_ERROR', error);
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    if (!this.initialized) await this.initialize();

    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path
      });

      if ('content' in data) {
        return Buffer.from(data.content, 'base64').toString();
      }

      throw new Error('Not a file');
    } catch (error) {
      throw new AppError('Failed to get file content', 'GITHUB_ERROR', error);
    }
  }

  async listBranches(owner: string, repo: string): Promise<Branch[]> {
    if (!this.initialized) await this.initialize();

    try {
      const { data } = await this.octokit.repos.listBranches({
        owner,
        repo
      });
      return data;
    } catch (error) {
      throw new AppError('Failed to list branches', 'GITHUB_ERROR', error);
    }
  }

  async createPullRequest(params: {
    owner: string;
    repo: string;
    title: string;
    head: string;
    base: string;
    body?: string;
  }): Promise<PullRequest> {
    if (!this.initialized) await this.initialize();

    try {
      const { data } = await this.octokit.pulls.create(params);
      return data;
    } catch (error) {
      throw new AppError('Failed to create pull request', 'GITHUB_ERROR', error);
    }
  }

  async getRepositoryFiles(owner: string, repo: string, path: string = ''): Promise<any[]> {
    if (!this.initialized) await this.initialize();

    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path
      });

      if (Array.isArray(data)) {
        const files = [];
        for (const item of data) {
          if (item.type === 'file') {
            files.push(item);
          } else if (item.type === 'dir') {
            const subFiles = await this.getRepositoryFiles(owner, repo, item.path);
            files.push(...subFiles);
          }
        }
        return files;
      }

      return [data];
    } catch (error) {
      throw new AppError('Failed to get repository files', 'GITHUB_ERROR', error);
    }
  }

  get isInitialized(): boolean {
    return this.initialized;
  }
}