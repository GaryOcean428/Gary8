import { thoughtLogger } from '../../../lib/logging/thought-logger';
import { VectorStore } from './VectorStore';
import { StorageService } from '../../../core/storage/storage-service';
import { AutoTagger } from './AutoTagger';
import type { Document, SearchOptions, SearchResult } from '../types';
import { AppError } from '../../../lib/errors/AppError';
// Disabling rules-of-hooks for this class to allow auth hook usage
 
import { supabase } from '../../../core/supabase/supabase-client';
import { useAuth } from '../../../core/auth/AuthProvider';

export class DocumentManager {
  private static instance: DocumentManager;
  private vectorStore: VectorStore;
  private storageService: StorageService;
  private autoTagger: AutoTagger;

  private constructor() {
    this.vectorStore = new VectorStore();
    this.storageService = new StorageService();
    this.autoTagger = new AutoTagger();
  }

  static getInstance(): DocumentManager {
    if (!DocumentManager.instance) {
      DocumentManager.instance = new DocumentManager();
    }
    return DocumentManager.instance;
  }

  async addDocument(
    _workspaceId: string = 'default',
    _file: File,
    _userTags: string[] = []
  ): Promise<Document> {
    thoughtLogger.log('execution', 'Adding new document', { 
      _workspaceId,
      fileName: _file.name,
      fileType: _file.type,
      fileSize: _file.size
    });

    try {
      // Get current user
      const { user } = useAuth();
      if (!user) {
        throw new AppError('User not authenticated', 'AUTH_ERROR');
      }

      // Validate file
      if (!this.isValidFileType(_file)) {
        throw new AppError('Unsupported file type', 'VALIDATION_ERROR');
      }

      if (_file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new AppError('File size exceeds limit', 'VALIDATION_ERROR');
      }

      // Extract content for vector storage
      const content = await this.extractContent(_file);
      if (!content) {
        throw new AppError('Failed to extract content from file', 'PROCESSING_ERROR');
      }

      // Generate auto tags
      const autoTags = await this.autoTagger.generateTags(content, _file.name, _file.type);

      // Combine auto tags with user tags, removing duplicates
      const tags = Array.from(new Set([...autoTags, ..._userTags]));

      // Generate vector embedding
      const vectorId = await this.vectorStore.addDocument(content);

      // Upload to Storage Service
      const userId = user.id;
      const document = await this.storageService.uploadDocument(_file, userId || _workspaceId);

      // Add vectorId to document record in the database
      const { error: updateError } = await supabase
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
        tags
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

  async searchDocuments(_options: SearchOptions): Promise<SearchResult[]> {
    thoughtLogger.log('execution', 'Searching documents', _options);

    try {
      // Get current user
      const { user } = useAuth();
      if (!user) {
        throw new AppError('User not authenticated', 'AUTH_ERROR');
      }

      // Get vector results
      const vectorResults = await this.vectorStore.search(
        _options.query || '',
        _options.similarity || 0.7,
        _options.limit || 10
      );

      // Fetch documents from Supabase
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Combine results
      const results = vectorResults.map(_result => {
        const doc = documents?.find(_d => _d.vector_id === _result.id);
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
          score: _result.score,
          excerpt: this.generateExcerpt(doc.content || '', _options.query || '')
        };
      }).filter(Boolean) as SearchResult[];

      // Filter by workspace and tags if specified
      return results.filter(_result => {
        if (_options.workspaceId && _result.document.workspaceId !== _options.workspaceId) {
          return false;
        }
        if (_options.tags && _options.tags.length > 0) {
          return _options.tags.every(_tag => _result.document.tags.includes(_tag));
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

  private isValidFileType(_file: File): boolean {
    const supportedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    return supportedTypes.includes(_file.type) || _file.type.startsWith('text/');
  }

  private async extractContent(_file: File): Promise<string> {
    try {
      switch (_file.type) {
        case 'text/plain':
        case 'text/markdown':
          return await _file.text();

        case 'application/pdf':
          return await this.extractPDFContent(_file);

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractDocxContent(_file);

        default:
          if (_file.type.startsWith('text/')) {
            return await _file.text();
          }
          throw new AppError(`Unsupported file type: ${_file.type}`, 'VALIDATION_ERROR');
      }
    } catch (error) {
      thoughtLogger.log('error', 'Content extraction failed', { error });
      throw new AppError('Failed to extract content', 'PROCESSING_ERROR', error);
    }
  }

  private async extractPDFContent(_file: File): Promise<string> {
    // Simple text extraction for now
    return await _file.text();
  }

  private async extractDocxContent(_file: File): Promise<string> {
    // Simple text extraction for now
    return await _file.text();
  }

  private generateExcerpt(_content: string, _query: string): string {
    const words = _content.split(/\s+/);
    const queryWords = _query.toLowerCase().split(/\s+/);
    const excerptLength = 50;

    // Find best matching position
    let bestPosition = 0;
    let maxMatches = 0;

    for (let i = 0; i < words.length - excerptLength; i++) {
      const matches = queryWords.filter(_qw => 
        words.slice(i, i + excerptLength)
          .some(_w => _w.toLowerCase().includes(_qw))
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