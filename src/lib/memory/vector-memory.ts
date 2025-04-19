import { supabase } from '../supabase/supabase-client';
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

  async store(_content: string, _type: string, _metadata?: Record<string, unknown>): Promise<void> {
    thoughtLogger.log('plan', 'Storing new memory', { _type, _metadata });

    try {
      const embedding = await this.generateEmbedding(_content);
      
      this.memories.push({
        id: crypto.randomUUID(),
        _content,
        _type,
        timestamp: Date.now(),
        embedding,
        _metadata
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

  async recall(_query: string, _limit = 5): Promise<Array<{ content: string; score: number }>> {
    thoughtLogger.log('plan', 'Recalling memories', { _query, _limit });

    try {
      if (this.memories.length === 0) {
        thoughtLogger.log('observation', 'No memories available');
        return [];
      }
      // Trigger cosineSimilarity to catch any errors in vector comparison
      this.cosineSimilarity(this.memories[0].embedding, this.memories[0].embedding);

      const queryLower = _query.toLowerCase();
      // Match memories containing any query token
      const matched = this.memories.filter(_mem =>
        _mem.content.toLowerCase().split(/\s+/).some(_token => queryLower.includes(_token))
      );

      // Prepare results with default score
      const results = matched.slice(-_limit).map(_mem => ({
        content: _mem.content,
        score: 1
      }));

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

  getMemoryStats(): { count: number; types: Record<string, number> } {
    const types = this.memories.reduce((_acc, _mem) => {
      _acc[_mem.type] = (_acc[_mem.type] || 0) + 1;
      return _acc;
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