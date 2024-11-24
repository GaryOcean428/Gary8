import { thoughtLogger } from '../logging/thought-logger';
import { VectorStore } from './vector-store';
import { IndexedDBStorage } from '../storage/indexed-db';
import { AutoTagger } from './auto-tagger';
import type { Document, Workspace, SearchOptions, SearchResult } from './types';
import { AppError } from '../errors/AppError';

export class DocumentManager {
  private static instance: DocumentManager;
  private vectorStore: VectorStore;
  private storage: IndexedDBStorage;
  private autoTagger: AutoTagger;

  private constructor() {
    this.vectorStore = new VectorStore();
    this.storage = new IndexedDBStorage();
    this.autoTagger = AutoTagger.getInstance();
  }

  static getInstance(): DocumentManager {
    if (!DocumentManager.instance) {
      DocumentManager.instance = new DocumentManager();
    }
    return DocumentManager.instance;
  }

  async addDocument(
    workspaceId: string,
    file: File,
    userTags: string[] = []
  ): Promise<Document> {
    thoughtLogger.log('execution', 'Adding new document', { 
      workspaceId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });

    try {
      // Initialize storage
      await this.storage.init();

      // Validate file
      if (!this.isValidFileType(file)) {
        throw new AppError('Unsupported file type', 'VALIDATION_ERROR');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new AppError('File size exceeds limit', 'VALIDATION_ERROR');
      }

      // Extract content
      const content = await this.extractContent(file);
      if (!content) {
        throw new AppError('Failed to extract content from file', 'PROCESSING_ERROR');
      }

      // Generate auto tags
      const autoTags = await this.autoTagger.generateTags(content, file.name, file.type);

      // Combine auto tags with user tags, removing duplicates
      const tags = Array.from(new Set([...autoTags, ...userTags]));

      // Generate vector embedding
      const vectorId = await this.vectorStore.addDocument(content);

      // Create document
      const document: Document = {
        id: crypto.randomUUID(),
        name: file.name,
        content,
        mimeType: file.type,
        tags,
        vectorId,
        workspaceId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
          fileSize: file.size,
          wordCount: content.split(/\s+/).length,
          processingTime: Date.now()
        }
      };

      // Store document
      await this.storage.put('documents', document);

      // Update workspace
      await this.updateWorkspaceDocuments(workspaceId, document.id);

      thoughtLogger.log('success', 'Document added successfully', {
        documentId: document.id,
        autoTags,
        finalTags: tags
      });

      return document;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to add document', { error });
      throw error instanceof AppError ? error : new AppError(
        'Failed to add document',
        'DOCUMENT_ERROR',
        error
      );
    }
  }

  private async extractContent(file: File): Promise<string> {
    try {
      switch (file.type) {
        case 'text/plain':
        case 'text/markdown':
          return await file.text();

        case 'application/pdf':
          return await this.extractPDFContent(file);

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractDocxContent(file);

        default:
          if (file.type.startsWith('text/')) {
            return await file.text();
          }
          throw new AppError(`Unsupported file type: ${file.type}`, 'VALIDATION_ERROR');
      }
    } catch (error) {
      thoughtLogger.log('error', 'Content extraction failed', { error });
      throw new AppError('Failed to extract content', 'PROCESSING_ERROR', error);
    }
  }

  private async extractPDFContent(file: File): Promise<string> {
    // For now, return a simple text extraction
    // In production, use a PDF parsing library
    return await file.text();
  }

  private async extractDocxContent(file: File): Promise<string> {
    // For now, return a simple text extraction
    // In production, use a DOCX parsing library
    return await file.text();
  }

  private isValidFileType(file: File): boolean {
    const supportedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    return supportedTypes.includes(file.type) || file.type.startsWith('text/');
  }

  private async updateWorkspaceDocuments(workspaceId: string, documentId: string): Promise<void> {
    const workspace = await this.storage.get('workspaces', workspaceId);
    if (!workspace) {
      // Create default workspace if it doesn't exist
      const defaultWorkspace: Workspace = {
        id: workspaceId,
        name: 'Default Workspace',
        documentIds: [documentId],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await this.storage.put('workspaces', defaultWorkspace);
    } else {
      workspace.documentIds.push(documentId);
      workspace.updatedAt = Date.now();
      await this.storage.put('workspaces', workspace);
    }
  }

  async searchDocuments(options: SearchOptions): Promise<SearchResult[]> {
    thoughtLogger.log('execution', 'Searching documents', options);

    try {
      // Get vector results
      const vectorResults = await this.vectorStore.search(
        options.query,
        options.similarity || 0.7,
        options.limit || 10
      );

      // Fetch full documents
      const documents = await Promise.all(
        vectorResults.map(async result => {
          const doc = await this.storage.get('documents', result.id);
          return {
            document: doc,
            score: result.score,
            excerpt: this.generateExcerpt(doc.content, options.query)
          };
        })
      );

      // Filter by workspace and tags if specified
      return documents.filter(result => {
        if (options.workspaceId && result.document.workspaceId !== options.workspaceId) {
          return false;
        }
        if (options.tags && options.tags.length > 0) {
          return options.tags.every(tag => result.document.tags.includes(tag));
        }
        return true;
      });
    } catch (error) {
      thoughtLogger.log('error', 'Document search failed', { error });
      throw error instanceof AppError ? error : new AppError(
        'Document search failed',
        'SEARCH_ERROR',
        error
      );
    }
  }

  private generateExcerpt(content: string, query: string): string {
    const words = content.split(/\s+/);
    const queryWords = query.toLowerCase().split(/\s+/);
    const excerptLength = 50;

    // Find best matching position
    let bestPosition = 0;
    let maxMatches = 0;

    for (let i = 0; i < words.length - excerptLength; i++) {
      const matches = queryWords.filter(qw => 
        words.slice(i, i + excerptLength)
          .some(w => w.toLowerCase().includes(qw))
      ).length;

      if (matches > maxMatches) {
        maxMatches = matches;
        bestPosition = i;
      }
    }

    return words
      .slice(bestPosition, bestPosition + excerptLength)
      .join(' ') + '...';
  }
}