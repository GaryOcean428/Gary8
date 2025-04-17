import { Message } from '../types';
import { AppError } from '../errors/AppError';

interface VectorEntry {
  id: string;
  content: string;
  type: string;
  timestamp: number;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

export class VectorStore {
  private entries: VectorEntry[] = [];
  private readonly dimensions = 384; // Standard for small-medium models

  async addEntry(content: string, type: string, metadata?: Record<string, unknown>): Promise<void> {
    try {
      const embedding = await this.generateEmbedding(content);
      
      this.entries.push({
        id: crypto.randomUUID(),
        content,
        type,
        timestamp: Date.now(),
        embedding,
        metadata
      });

      // Keep only recent entries to prevent memory bloat
      if (this.entries.length > 1000) {
        this.entries = this.entries.slice(-1000);
      }
    } catch (error) {
      throw new AppError('Failed to add vector entry', 'VECTOR_STORE_ERROR', error);
    }
  }

  async search(query: string, limit = 5): Promise<Array<{ content: string; score: number }>> {
    try {
      if (this.entries.length === 0) return [];

      const queryEmbedding = await this.generateEmbedding(query);
      
      const results = this.entries.map(entry => ({
        content: entry.content,
        score: this.cosineSimilarity(queryEmbedding, entry.embedding)
      }));

      results.sort((a, b) => b.score - a.score);
      
      // Filter out low-relevance results
      return results
        .filter(result => result.score > 0.7)
        .slice(0, limit);
    } catch (error) {
      throw new AppError('Failed to search vector store', 'VECTOR_STORE_ERROR', error);
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Initialize embedding vector
    const embedding = new Array(this.dimensions).fill(0);
    
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
        embedding[j] += Math.sin(tokenHash * (j + 1)) / tokens.length;
      }
    }

    // Normalize embedding vector
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );

    return embedding.map(val => val / magnitude);
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
      throw new Error('Vectors must have same length');
    }

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  clear(): void {
    this.entries = [];
  }
}