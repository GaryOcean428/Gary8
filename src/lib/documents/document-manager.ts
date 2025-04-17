import { thoughtLogger } from '../logging/thought-logger';
import { VectorStore } from './vector-store';
import { StorageService } from '../storage/storage-service';
import { AutoTagger } from './auto-tagger';
import type { Document, SearchOptions, SearchResult } from './types';
import { AppError } from '../errors/AppError';
import { supabase } from '../supabase/supabase-client';
import { useAuth } from '../auth/AuthProvider';

export class DocumentManager {
  private static instance: DocumentManager;
  private vectorStore: VectorStore;
  private storageService: StorageService;
  private autoTagger: AutoTagger;

  private constructor() {
    this.vectorStore = new VectorStore();
    this.storageService = new StorageService();
    this.autoTagger = AutoTagger.getInstance();
  }

  static getInstance(): DocumentManager {
    if (!DocumentManager.instance) {
      DocumentManager.instance = new DocumentManager();
    }
    return DocumentManager.instance;
  }

  async addDocument(
    workspaceId: string = 'default',
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
      // Get current user
      const { user } = useAuth();
      if (!user) {
        throw new AppError('User not authenticated', 'AUTH_ERROR');
      }

      // Validate file
      if (!this.isValidFileType(file)) {
        throw new AppError('Unsupported file type', 'VALIDATION_ERROR');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new AppError('File size exceeds limit', 'VALIDATION_ERROR');
      }

      // Extract content for vector storage
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

      // Upload to Supabase Storage
      const userId = user.id;
      const document = await this.storageService.uploadDocument(file, userId || workspaceId);

      // Add vectorId to document record in the database
      const { data: updatedDoc, error: updateError } = await supabase
        .from('documents')
        .update({
          tags,
          vector_id: vectorId
        })
        .eq('id', document.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      thoughtLogger.log('success', 'Document added successfully', {
        documentId: document.id,
        autoTags,
        finalTags: tags
      });

      return {
        ...document,
        tags,
        vectorId
      };
    } catch (error) {
      thoughtLogger.log('error', 'Failed to add document', { error });
      throw error instanceof AppError ? error : new AppError(
        'Failed to add document',
        'DOCUMENT_ERROR',
        error
      );
    }
  }

  async searchDocuments(options: SearchOptions): Promise<SearchResult[]> {
    thoughtLogger.log('execution', 'Searching documents', options);

    try {
      // Get current user
      const { user } = useAuth();
      if (!user) {
        throw new AppError('User not authenticated', 'AUTH_ERROR');
      }

      // Get vector results
      const vectorResults = await this.vectorStore.search(
        options.query || '',
        options.similarity || 0.7,
        options.limit || 10
      );

      // Fetch documents from Supabase
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Combine results
      const results = vectorResults.map(result => {
        const doc = documents?.find(d => d.vector_id === result.id);
        if (!doc) return null;
        
        return {
          document: {
            id: doc.id,
            name: doc.name,
            content: doc.url || '',
            mimeType: doc.mime_type,
            tags: doc.tags || [],
            workspaceId: doc.workspace_id || user.id,
            createdAt: new Date(doc.created_at).getTime(),
            updatedAt: new Date(doc.updated_at).getTime(),
            vectorId: doc.vector_id,
            metadata: {
              fileSize: doc.size,
              storagePath: doc.storage_path
            }
          },
          score: result.score,
          excerpt: this.generateExcerpt(doc.content || '', options.query || '')
        };
      }).filter(Boolean) as SearchResult[];

      // Filter by workspace and tags if specified
      return results.filter(result => {
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

  private isValidFileType(file: File): boolean {
    const supportedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    return supportedTypes.includes(file.type) || file.type.startsWith('text/');
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
    // Simple text extraction for now
    return await file.text();
  }

  private async extractDocxContent(file: File): Promise<string> {
    // Simple text extraction for now
    return await file.text();
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