import { GitHubService } from '../services/github-service';
import { thoughtLogger } from '../logging/thought-logger';
import type { Tool } from '../types/tools';

export class GitHubTools {
  private static instance: GitHubTools;
  private githubService: GitHubService;

  private constructor() {
    this.githubService = GitHubService.getInstance();
  }

  static getInstance(): GitHubTools {
    if (!GitHubTools.instance) {
      GitHubTools.instance = new GitHubTools();
    }
    return GitHubTools.instance;
  }

  getTools(): Tool[] {
    return [
      {
        name: 'search-repositories',
        description: 'Search GitHub repositories',
        execute: async (query: string) => {
          thoughtLogger.log('execution', `Searching repositories: ${query}`);
          try {
            const repositories = await this.githubService.searchRepositories(query);
            return {
              success: true,
              result: repositories
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Failed to search repositories'
            };
          }
        }
      },
      {
        name: 'get-repository-info',
        description: 'Get information about a specific repository',
        execute: async (owner: string, repo: string) => {
          thoughtLogger.log('execution', `Fetching repository info: ${owner}/${repo}`);
          try {
            const info = await this.githubService.fetchRepositoryInfo(owner, repo);
            return {
              success: true,
              result: info
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Failed to fetch repository info'
            };
          }
        }
      }
    ];
  }
}