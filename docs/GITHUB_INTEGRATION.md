# GitHub Integration Documentation

## Overview

The GitHub integration provides comprehensive access to GitHub repositories, files, and operations through the GitHub REST API. It supports both personal access tokens and GitHub Apps authentication methods.

## Features

1. **Repository Management**
   - List repositories
   - Get repository details
   - Access file contents
   - Create/update files
   - Branch management

2. **Code Awareness**
   - File system traversal
   - Content analysis
   - Code search
   - Syntax awareness

3. **Codespace Integration**
   - Environment detection
   - Configuration access
   - Resource management
   - Repository synchronization

## Configuration

### Authentication

```typescript
interface GitHubConfig {
  apiKey: string;          // Personal access token
  apiVersion?: string;     // API version (default: '2022-11-28')
  baseUrl?: string;        // API base URL
  userAgent?: string;      // Custom user agent
}
```

### Required Scopes

- `repo`: Full repository access
- `read:user`: Read user profile data
- `read:org`: Read organization data
- `workflow`: Workflow access (optional)

## API Reference

### Repository Operations

```typescript
// List repositories
async listRepositories(options?: {
  type?: 'all' | 'owner' | 'public' | 'private' | 'member';
  sort?: 'created' | 'updated' | 'pushed' | 'full_name';
  direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}): Promise<Repository[]>

// Get repository
async getRepository(owner: string, repo: string): Promise<Repository>

// Get file content
async getFileContent(owner: string, repo: string, path: string): Promise<string>

// List branches
async listBranches(owner: string, repo: string): Promise<Branch[]>

// Create pull request
async createPullRequest(params: {
  owner: string;
  repo: string;
  title: string;
  head: string;
  base: string;
  body?: string;
}): Promise<PullRequest>
```

### Code Awareness

```typescript
// Search code
async searchCode(query: string): Promise<SearchResult[]>

// Get repository files
async getRepositoryFiles(
  owner: string,
  repo: string,
  path?: string
): Promise<File[]>

// Get file tree
async getFileTree(
  owner: string,
  repo: string,
  sha?: string
): Promise<TreeEntry[]>
```

### Codespace Operations

```typescript
// Verify access
async verifyCodespaceAccess(): Promise<boolean>

// Get current info
async getCurrentCodespaceInfo(): Promise<CodespaceInfo>

// Sync with repository
async syncWithRepository(): Promise<void>
```

## Error Handling

```typescript
try {
  await githubClient.initialize();
} catch (error) {
  if (error instanceof AppError) {
    switch (error.code) {
      case 'CONFIG_ERROR':
        // Handle configuration errors
        break;
      case 'GITHUB_ERROR':
        // Handle GitHub API errors
        break;
      case 'AUTH_ERROR':
        // Handle authentication errors
        break;
    }
  }
}
```

## Best Practices

1. **Initialization**
   - Always initialize the client before use
   - Verify API key and permissions
   - Handle initialization failures

2. **Rate Limiting**
   - Monitor rate limits
   - Implement exponential backoff
   - Cache responses when possible

3. **Error Handling**
   - Use specific error types
   - Implement retry logic
   - Log errors appropriately

4. **Security**
   - Validate input parameters
   - Handle sensitive data properly
   - Use secure connections

## Examples

### Basic Usage

```typescript
// Initialize client
const github = GitHubClient.getInstance();
await github.initialize();

// List repositories
const repos = await github.listRepositories({
  type: 'all',
  sort: 'updated'
});

// Get file content
const content = await github.getFileContent(
  'owner',
  'repo',
  'path/to/file.ts'
);
```

### Code Awareness

```typescript
// Search code
const results = await github.searchCode('function searchCode');

// Get repository files
const files = await github.getRepositoryFiles(
  'owner',
  'repo',
  'src'
);

// Analyze code
const capabilities = await codeAwareness.getCapabilities();
```

### Error Handling

```typescript
try {
  const repo = await github.getRepository(owner, repo);
} catch (error) {
  if (error instanceof AppError) {
    logger.error('GitHub operation failed', {
      code: error.code,
      message: error.message,
      details: error.details
    });
  }
}
```