import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VectorMemory } from '../../../lib/memory/vector-memory';

describe('VectorMemory', () => {
  let vectorMemory: VectorMemory;
  
  beforeEach(() => {
    vectorMemory = new VectorMemory();
  });
  
  describe('store and recall', () => {
    it('should store and recall memory correctly', async () => {
      // Store some test memories
      await vectorMemory.store('Memory about JavaScript', 'instruction');
      await vectorMemory.store('Memory about Python', 'instruction');
      await vectorMemory.store('Memory about TypeScript', 'instruction');
      
      // Recall memories related to JavaScript
      const results = await vectorMemory.recall('JavaScript programming');
      
      // Verify we got results back
      expect(results.length).toBeGreaterThan(0);
      
      // The JavaScript memory should have the highest similarity score
      expect(results[0].content).toContain('JavaScript');
      
      // Scores should be between 0 and 1
      results.forEach(_result => {
        expect(_result.score).toBeGreaterThan(0);
        expect(_result.score).toBeLessThanOrEqual(1);
      });
    });
    
    it('should filter out irrelevant results', async () => {
      // Store memories
      await vectorMemory.store('Memory about cats', 'instruction');
      await vectorMemory.store('Memory about dogs', 'instruction');
      
      // Search for something unrelated
      const results = await vectorMemory.recall('quantum physics');
      
      // Should filter out low-relevance results
      expect(results.length).toBe(0);
    });
    
    it('should limit the number of results', async () => {
      // Store many memories
      for (let i = 0; i < 20; i++) {
        await vectorMemory.store(`Memory ${i} about JavaScript`, 'instruction');
      }
      
      // Recall with limit
      const results = await vectorMemory.recall('JavaScript', 5);
      
      // Should respect the limit
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });
  
  describe('memory management', () => {
    it('should keep track of memory statistics', () => {
      const stats = vectorMemory.getMemoryStats();
      
      expect(stats).toHaveProperty('count');
      expect(stats).toHaveProperty('types');
    });
    
    it('should clear all memories', async () => {
      // Store some test memories
      await vectorMemory.store('Test memory', 'instruction');
      
      // Verify memory was stored
      expect(vectorMemory.getMemoryStats().count).toBeGreaterThan(0);
      
      // Clear memories
      vectorMemory.clear();
      
      // Verify memory was cleared
      expect(vectorMemory.getMemoryStats().count).toBe(0);
    });
  });
  
  describe('error handling', () => {
    it('should handle cosineSimilarity errors', async () => {
      // Store a memory
      await vectorMemory.store('Test memory', 'instruction');
      
      // Mock the cosineSimilarity method to throw an error
      const originalMethod = (vectorMemory as any).cosineSimilarity;
      (vectorMemory as any).cosineSimilarity = vi.fn().mockImplementation(() => {
        throw new Error('Vector dimensions mismatch');
      });
      
      // Attempt to recall
      await expect(vectorMemory.recall('Test query')).rejects.toThrow();
      
      // Restore original method
      (vectorMemory as any).cosineSimilarity = originalMethod;
    });
  });
});