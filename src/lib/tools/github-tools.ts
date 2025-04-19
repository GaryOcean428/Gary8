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
        execute: async (_query: string) => {
          thoughtLogger.log('execution', `Searching repositories: ${_query}`);
          try {
            const repositories = await this.githubService.searchRepositories(_query);
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
        execute: async (_owner: string, _repo: string) => {
          thoughtLogger.log('execution', `Fetching repository info: ${_owner}/${_repo}`);
          try {
            const info = await this.githubService.fetchRepositoryInfo(_owner, _repo);
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