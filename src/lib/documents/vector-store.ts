import { createEmbedding, upsertVector, queryVector } from '../utils/pinecone-client';
import { thoughtLogger } from '../utils/logger';
import { APIError as AppError } from '../error';

interface SearchResult {
  id: string;
  score: number;  // Required field, must always be defined
  metadata?: Record<string, any>;
}

export class VectorStore {
  async createAndStoreEmbedding(text: string, metadata: Record<string, any> = {}): Promise<string> {
    try {
      const embedding = await createEmbedding(text);
      const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await upsertVector({
        id,
        values: embedding,
        metadata: {
          ...metadata,
          text
        }
      });

      return id;
    } catch (error) {
      thoughtLogger.error('Error creating and storing embedding', error);
      throw new AppError('Failed to create and store embedding', { cause: error });
    }
  }

  async search(text: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      const embedding = await createEmbedding(text);
      const results = await queryVector(embedding, limit);
      
      return results.map(result => ({
        id: result.id,
        score: result.score ?? 0, // Provide default score of 0 if undefined
        metadata: result.metadata
      }));
    } catch (error) {
      thoughtLogger.error('Error searching vectors', error);
      throw new AppError('Failed to search vectors', { cause: error });
    }
  }
}
