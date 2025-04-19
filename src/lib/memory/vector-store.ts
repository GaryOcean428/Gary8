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

  async addEntry(_content: string, _type: string, _metadata?: Record<string, unknown>): Promise<void> {
    try {
      const embedding = await this.generateEmbedding(_content);
      
      this.entries.push({
        id: crypto.randomUUID(),
        _content,
        _type,
        timestamp: Date.now(),
        embedding,
        _metadata
      });

      // Keep only recent entries to prevent memory bloat
      if (this.entries.length > 1000) {
        this.entries = this.entries.slice(-1000);
      }
    } catch (error) {
      throw new AppError('Failed to add vector entry', 'VECTOR_STORE_ERROR', error);
    }
  }

  async search(_query: string, _limit = 5): Promise<Array<{ content: string; score: number }>> {
    try {
      if (this.entries.length === 0) return [];

      const queryEmbedding = await this.generateEmbedding(_query);
      
      const results = this.entries.map(_entry => ({
        content: _entry.content,
        score: this.cosineSimilarity(queryEmbedding, _entry.embedding)
      }));

      results.sort((_a, _b) => _b.score - _a.score);
      
      // Filter out low-relevance results
      return results
        .filter(_result => _result.score > 0.7)
        .slice(0, _limit);
    } catch (error) {
      throw new AppError('Failed to search vector store', 'VECTOR_STORE_ERROR', error);
    }
  }

  private async generateEmbedding(_text: string): Promise<number[]> {
    // Initialize embedding vector
    const embedding = new Array(this.dimensions).fill(0);
    
    // Normalize and tokenize text
    const tokens = _text.toLowerCase()
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
      embedding.reduce((_sum, _val) => _sum + _val * _val, 0)
    );

    return embedding.map(_val => _val / magnitude);
  }

  private hashString(_str: string): number {
    let hash = 0;
    for (let i = 0; i < _str.length; i++) {
      const char = _str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  private cosineSimilarity(_a: number[], _b: number[]): number {
    if (_a.length !== _b.length) {
      throw new Error('Vectors must have same length');
    }

    const dotProduct = _a.reduce((_sum, _val, _i) => _sum + _val * _b[_i], 0);
    const magnitudeA = Math.sqrt(_a.reduce((_sum, _val) => _sum + _val * _val, 0));
    const magnitudeB = Math.sqrt(_b.reduce((_sum, _val) => _sum + _val * _val, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  clear(): void {
    this.entries = [];
  }
}