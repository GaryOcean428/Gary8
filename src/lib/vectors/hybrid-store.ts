import { createEmbedding, upsertVector, queryVector } from '../utils/pinecone-client';
import { thoughtLogger } from '../utils/logger';
import { AppError } from '../error';
import { VectorEntry, VectorSearchResult, FileType } from './types';

export class HybridVectorStore {
  private localVectors: Map<string, VectorEntry> = new Map();
  private readonly supportedTypes: FileType[] = [
    'text/plain', 'text/markdown', 'text/csv', 'application/json',
    'application/pdf', 'text/javascript', 'text/typescript',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  async addDocument(
    content: string,
    metadata: Partial<VectorEntry['metadata']> = {},
    permanent: boolean = false
  ): Promise<string> {
    try {
      const id = crypto.randomUUID();
      const vector = await createEmbedding(content);
      
      const vectorEntry: VectorEntry = {
        id,
        vector,
        metadata: {
          text: content,
          type: 'document',
          source: metadata.source || 'upload',
          timestamp: Date.now(),
          filename: metadata.filename,
          mimeType: metadata.mimeType,
          permanent,
          ...metadata
        }
      };

      // Store locally first
      this.localVectors.set(id, vectorEntry);

      // If marked as permanent, also store in Pinecone
      if (permanent) {
        await this.makePermanent(id);
      }

      return id;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to add document', { error });
      throw new AppError('Failed to add document', 'VECTOR_ERROR');
    }
  }

  async makePermanent(id: string): Promise<void> {
    const entry = this.localVectors.get(id);
    if (!entry) throw new AppError('Vector not found', 'NOT_FOUND');

    try {
      await upsertVector(entry.id, entry.vector, {
        ...entry.metadata,
        permanent: true
      });
      
      // Update local metadata
      entry.metadata.permanent = true;
      this.localVectors.set(id, entry);
    } catch (error) {
      thoughtLogger.log('error', 'Failed to make vector permanent', { error });
      throw new AppError('Failed to make vector permanent', 'VECTOR_ERROR');
    }
  }

  async search(
    query: string,
    options: {
      limit?: number;
      minScore?: number;
      includeLocal?: boolean;
      includePermanent?: boolean;
      type?: VectorEntry['metadata']['type'];
    } = {}
  ): Promise<VectorSearchResult[]> {
    const {
      limit = 5,
      minScore = 0.7,
      includeLocal = true,
      includePermanent = true,
      type
    } = options;

    try {
      const queryVector = await createEmbedding(query);
      const results: VectorSearchResult[] = [];

      // Search local vectors
      if (includeLocal) {
        const localResults = await this.searchLocal(queryVector, { limit, minScore, type });
        results.push(...localResults);
      }

      // Search Pinecone
      if (includePermanent) {
        const filter = type ? { type, permanent: true } : { permanent: true };
        const permanentResults = await queryVector(queryVector, limit, filter);
        results.push(...permanentResults.map(match => ({
          id: match.id,
          score: match.score,
          content: match.metadata.text as string,
          metadata: match.metadata as VectorEntry['metadata']
        })));
      }

      // Combine and sort results
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      thoughtLogger.log('error', 'Vector search failed', { error });
      throw new AppError('Vector search failed', 'SEARCH_ERROR');
    }
  }

  private async searchLocal(
    queryVector: number[],
    options: { limit: number; minScore: number; type?: string }
  ): Promise<VectorSearchResult[]> {
    const results: VectorSearchResult[] = [];

    for (const entry of this.localVectors.values()) {
      if (options.type && entry.metadata.type !== options.type) continue;

      const score = this.cosineSimilarity(queryVector, entry.vector);
      if (score >= options.minScore) {
        results.push({
          id: entry.id,
          score,
          content: entry.metadata.text,
          metadata: entry.metadata
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  isSupportedType(mimeType: string): boolean {
    return this.supportedTypes.includes(mimeType as FileType);
  }

  clearLocal(): void {
    this.localVectors.clear();
  }
} 