import { thoughtLogger } from '../logging/thought-logger';
import { supabase } from '../supabase/supabase-client';
import { AppError } from '../errors/AppError';

interface VectorEntry {
  id: string;
  vector: number[];
  timestamp: number;
}

interface SearchResult {
  id: string;
  score: number;
}

export class VectorStore {
  private vectors: Map<string, VectorEntry> = new Map();
  private dimensions = 384;

  async addDocument(content: string): Promise<string> {
    try {
      const id = crypto.randomUUID();
      const vector = await this.generateEmbedding(content);

      this.vectors.set(id, {
        id,
        vector,
        timestamp: Date.now()
      });

      // In a real implementation, we would store the vector in a database
      // For now, we'll just store the ID in the document record
      return id;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to add vector', { error });
      throw new AppError('Failed to add vector', 'VECTOR_ERROR');
    }
  }

  async search(query: string, minSimilarity = 0.7, limit = 10): Promise<SearchResult[]> {
    try {
      const queryVector = await this.generateEmbedding(query);
      
      const results = Array.from(this.vectors.values())
        .map(entry => ({
          id: entry.id,
          score: this.cosineSimilarity(queryVector, entry.vector)
        }))
        .filter(result => result.score >= minSimilarity)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return results;
    } catch (error) {
      thoughtLogger.log('error', 'Vector search failed', { error });
      throw new AppError('Vector search failed', 'SEARCH_ERROR');
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Initialize embedding vector
    const vector = new Array(this.dimensions).fill(0);
    
    // Normalize and tokenize text
    const tokens = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    // Generate semantic embedding
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const tokenHash = this.hashString(token);
      
      // Distribute token influence across embedding
      for (let j = 0; j < this.dimensions; j++) {
        vector[j] += Math.sin(tokenHash * (j + 1)) / tokens.length;
      }
    }

    // Normalize vector
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );

    return vector.map(val => val / magnitude);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match');
    }

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    return dotProduct / (magnitudeA * magnitudeB);
  }

  clear(): void {
    this.vectors.clear();
  }
}