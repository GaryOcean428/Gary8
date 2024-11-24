import { useState, useCallback } from 'react';
import { GitHubClient } from '../lib/github/github-client';
import { Repository, Branch, PullRequest } from '../lib/github/types';
import { useToast } from './useToast';

export function useGitHub() {
  const [isLoading, setIsLoading] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const { addToast } = useToast();
  const client = GitHubClient.getInstance();

  const loadRepositories = useCallback(async () => {
    setIsLoading(true);
    try {
      const repos = await client.listRepositories();
      setRepositories(repos);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to load repositories',
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const loadBranches = useCallback(async (owner: string, repo: string) => {
    setIsLoading(true);
    try {
      const branchList = await client.listBranches(owner, repo);
      setBranches(branchList);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to load branches',
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const loadPullRequests = useCallback(async (owner: string, repo: string) => {
    setIsLoading(true);
    try {
      const prs = await client.listPullRequests(owner, repo);
      setPullRequests(prs);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to load pull requests',
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const createPullRequest = useCallback(async (params: {
    owner: string;
    repo: string;
    title: string;
    head: string;
    base: string;
    body?: string;
  }) => {
    setIsLoading(true);
    try {
      const pr = await client.createPullRequest(params);
      addToast({
        type: 'success',
        title: 'Pull request created',
        message: `PR #${pr.number} created successfully`
      });
      return pr;
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to create pull request',
        message: error instanceof Error ? error.message : 'An error occurred'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  return {
    isLoading,
    repositories,
    branches,
    pullRequests,
    loadRepositories,
    loadBranches,
    loadPullRequests,
    createPullRequest
  };
}