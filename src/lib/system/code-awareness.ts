import { thoughtLogger } from '../logging/thought-logger';
import { GitHubClient } from '../github/github-client';
import { CodespaceClient } from '../github/codespace-client';
import { AppError } from '../errors/AppError';
import { CodeCapability, FileContent } from '../interfaces/code-interfaces';
import { CODE_CONSTANTS } from '../constants/code-constants';
import { ErrorHandler } from '../utils/error-handler';

export class CodeAwareness {
  private static instance: CodeAwareness;
  private githubClient: GitHubClient;
  private codespaceClient: CodespaceClient;
  private sourceFiles: Map<string, string> = new Map();
  private capabilities: Map<string, CodeCapability> = new Map();
  private initialized = false;

  private constructor() {
    this.githubClient = GitHubClient.getInstance();
    this.codespaceClient = CodespaceClient.getInstance();
  }

  static getInstance(): CodeAwareness {
    if (!CodeAwareness.instance) {
      CodeAwareness.instance = new CodeAwareness();
    }
    return CodeAwareness.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      thoughtLogger.log('plan', 'Initializing code awareness system');

      // Load local source files first
      await this.loadLocalSourceFiles();

      // Verify GitHub and Codespace access
      const [githubConnected, codespaceAvailable] = await Promise.all([
        this.githubClient.verifyConnection(),
        this.codespaceClient.verifyCodespaceAccess()
      ]);

      if (githubConnected) {
        // Get current repository info
        const codespaceInfo = await this.codespaceClient.getCurrentCodespaceInfo();
        const [owner, repo] = (codespaceInfo?.repository || '').split('/');

        if (owner && repo) {
          // Load repository files
          await this.loadRepositoryFiles(owner, repo);
        }
      }

      // Extract capabilities from all source files
      await this.extractAllCapabilities();

      this.initialized = true;
      thoughtLogger.log('success', 'Code awareness system initialized', {
        filesLoaded: this.sourceFiles.size,
        capabilitiesFound: this.capabilities.size,
        codespaceAvailable
      });
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize code awareness', { error });
      throw error;
    }
  }

  private async loadLocalSourceFiles(): Promise<void> {
    try {
      // Get all TypeScript files in the src directory
      const files = await this.getLocalFiles('/src');
      
      for (const file of files) {
        if (this.isRelevantFile(file.path)) {
          this.sourceFiles.set(file.path, file.content);
        }
      }

      thoughtLogger.log('success', 'Local source files loaded', {
        fileCount: this.sourceFiles.size
      });
    } catch (error) {
      thoughtLogger.log('error', 'Failed to load local source files', { error });
      throw error;
    }
  }

  private async getLocalFiles(dir: string): Promise<Array<{ path: string; content: string }>> {
    // This is a simplified version - in production, use proper file system access
    const files: Array<{ path: string; content: string }> = [];
    
    // Add files that we know exist from our running context
    const knownFiles = [
      '/src/lib/system/code-awareness.ts',
      '/src/lib/github/github-client.ts',
      '/src/lib/services/search-service.ts',
      // Add other known files
    ];

    for (const path of knownFiles) {
      try {
        const content = await this.getFileContent(path);
        if (content) {
          files.push({ path, content });
        }
      } catch (error) {
        thoughtLogger.log('warning', `Failed to load file: ${path}`, { error });
      }
    }

    return files;
  }

  private async loadRepositoryFiles(owner: string, repo: string): Promise<void> {
    try {
      const files = await this.githubClient.getRepositoryFiles(owner, repo);

      for (const file of files) {
        if (this.isRelevantFile(file.path)) {
          const content = await this.githubClient.getFileContent(owner, repo, file.path);
          this.sourceFiles.set(file.path, content);
        }
      }
    } catch (error) {
      thoughtLogger.log('error', 'Failed to load repository files', { error });
      throw error;
    }
  }

  private async extractAllCapabilities(): Promise<void> {
    for (const [path, content] of this.sourceFiles.entries()) {
      const fileCapabilities = this.extractCapabilities(content, path);
      fileCapabilities.forEach(cap => this.capabilities.set(cap.name, cap));
    }
  }

  private isRelevantFile(path: string): boolean {
    return (
      CODE_CONSTANTS.RELEVANT_EXTENSIONS.some(ext => path.endsWith(ext)) &&
      !CODE_CONSTANTS.EXCLUDED_PATHS.some(excluded => path.includes(excluded))
    );
  }

  async getFileContent(path: string): Promise<string | null> {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.sourceFiles.get(path) || null;
  }

  async searchCode(query: string): Promise<FileContent[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const results: FileContent[] = [];
      const searchRegex = new RegExp(query, 'gi');

      for (const [path, content] of this.sourceFiles.entries()) {
        const matches = content.match(searchRegex);
        if (matches) {
          results.push({ path, content, matches });
        }
      }

      return results;
    } catch (error) {
      return ErrorHandler.handle(error, 'search code');
    }
  }

  getCapabilities(): CodeCapability[] {
    return Array.from(this.capabilities.values());
  }

  hasCapability(name: string): boolean {
    return this.capabilities.has(name);
  }

  private extractCapabilities(content: string, path: string): CodeCapability[] {
    const capabilities: CodeCapability[] = [];
    
    // Extract classes
    const classMatches = content.matchAll(/(?:export\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+\w+(?:\s*,\s*\w+)*)?/g);
    for (const match of classMatches) {
      capabilities.push({
        name: match[1],
        type: 'class',
        path,
        description: this.extractDescription(content, match.index || 0)
      });
    }

    // Extract interfaces
    const interfaceMatches = content.matchAll(/(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+\w+(?:\s*,\s*\w+)*)?/g);
    for (const match of interfaceMatches) {
      capabilities.push({
        name: match[1],
        type: 'interface',
        path,
        description: this.extractDescription(content, match.index || 0)
      });
    }

    // Extract functions
    const functionMatches = content.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/g);
    for (const match of functionMatches) {
      capabilities.push({
        name: match[1],
        type: 'function',
        path,
        description: this.extractDescription(content, match.index || 0)
      });
    }

    return capabilities;
  }

  private extractDescription(content: string, index: number): string | undefined {
    // Look for JSDoc comment above the declaration
    const beforeDeclaration = content.slice(0, index).trim();
    const commentMatch = beforeDeclaration.match(/\/\*\*\s*([\s\S]*?)\s*\*\/\s*$/);
    
    if (commentMatch) {
      return commentMatch[1]
        .split('\n')
        .map(line => line.trim().replace(/^\*\s*/, ''))
        .filter(Boolean)
        .join(' ');
    }

    return undefined;
  }

  async getSystemCapabilities(): Promise<{
    services: string[];
    features: string[];
    integrations: string[];
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    const capabilities = this.getCapabilities();
    
    return {
      services: capabilities
        .filter(cap => cap.path.includes('/services/'))
        .map(cap => cap.name),
      features: capabilities
        .filter(cap => cap.type === 'class' && !cap.path.includes('/services/'))
        .map(cap => cap.name),
      integrations: capabilities
        .filter(cap => cap.path.includes('/integrations/') || cap.path.includes('/api/'))
        .map(cap => cap.name)
    };
  }

  get isInitialized(): boolean {
    return this.initialized;
  }
}