import { Message } from '../types';
import { thoughtLogger } from '../logging/thought-logger';
import { AppError } from '../errors/AppError';

interface MemoryEntry {
  id: string;
  content: string;
  type: string;
  timestamp: number;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

export class VectorMemory {
  private memories: MemoryEntry[] = [];
  private dimensions = 384; // Standard for small-medium models
  private maxMemories = 1000;

  async store(content: string, type: string, metadata?: Record<string, unknown>): Promise<void> {
    thoughtLogger.log('plan', 'Storing new memory', { type, metadata });

    try {
      const embedding = await this.generateEmbedding(content);
      
      this.memories.push({
        id: crypto.randomUUID(),
        content,
        type,
        timestamp: Date.now(),
        embedding,
        metadata
      });

      // Keep only recent memories to prevent bloat
      if (this.memories.length > this.maxMemories) {
        this.memories = this.memories.slice(-this.maxMemories);
      }

      thoughtLogger.log('success', 'Memory stored successfully', {
        memoryCount: this.memories.length
      });
    } catch (error) {
      thoughtLogger.log('error', 'Failed to store memory', { error });
      throw new AppError('Failed to store memory', 'MEMORY_ERROR', error);
    }
  }

  async recall(query: string, limit = 5): Promise<Array<{ content: string; score: number }>> {
    thoughtLogger.log('plan', 'Recalling memories', { query, limit });

    try {
      if (this.memories.length === 0) {
        thoughtLogger.log('observation', 'No memories available');
        return [];
      }

      const queryEmbedding = await this.generateEmbedding(query);
      
      const scored = this.memories.map(memory => ({
        content: memory.content,
        score: this.cosineSimilarity(queryEmbedding, memory.embedding),
        timestamp: memory.timestamp
      }));

      // Sort by score and recency
      scored.sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (Math.abs(scoreDiff) > 0.1) {
          return scoreDiff;
        }
        return b.timestamp - a.timestamp;
      });

      // Filter out low-relevance results
      const results = scored
        .filter(result => result.score > 0.7)
        .slice(0, limit)
        .map(({ content, score }) => ({ content, score }));

      thoughtLogger.log('success', 'Memories recalled successfully', {
        matchCount: results.length,
        topScore: results[0]?.score
      });

      return results;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to recall memories', { error });
      throw new AppError('Failed to recall memories', 'MEMORY_ERROR', error);
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

  getMemoryStats(): { count: number; types: Record<string, number> } {
    const types = this.memories.reduce((acc, mem) => {
      acc[mem.type] = (acc[mem.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      count: this.memories.length,
      types
    };
  }

  clear(): void {
    this.memories = [];
    thoughtLogger.log('success', 'Memory cleared');
  }
}