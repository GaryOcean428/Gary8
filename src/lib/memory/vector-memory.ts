import { createEmbedding, upsertVector, queryVector } from '../utils/pinecone-client';
import { thoughtLogger } from '../utils/logger';
import { AppError } from '../error';

export class VectorMemory {
  private dimensions = 3072; // Updated to match text-embedding-3-large dimensions

  async addMemory(text: string, metadata: Record<string, any> = {}) {
    try {
      const embedding = await createEmbedding(text);
      const id = crypto.randomUUID();
      
      await upsertVector(id, embedding, {
        ...metadata,
        text,
        timestamp: Date.now(),
        type: 'memory'
      });

      return id;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to add memory', { error });
      throw new AppError('Failed to add memory', 'VECTOR_ERROR');
    }
  }

  async searchMemories(query: string, limit = 5): Promise<Array<{ content: string; score: number }>> {
    try {
      const queryEmbedding = await createEmbedding(query);
      const results = await queryVector(queryEmbedding, limit, { type: 'memory' });
      
      return results.map(match => ({
        content: match.metadata.text as string,
        score: match.score
      }));
    } catch (error) {
      thoughtLogger.log('error', 'Memory search failed', { error });
      throw new AppError('Memory search failed', 'SEARCH_ERROR');
    }
  }
}