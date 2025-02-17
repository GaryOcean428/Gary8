import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AdvancedRAGPipeline } from '../advanced-rag-pipeline';
import { PineconeClient } from '../../clients/pinecone-client';
import { DeepSeekClient } from '../../clients/deepseek-client';
import { MonitoringService } from '../../monitoring/monitoring-service';

// Mock dependencies
jest.mock('../../clients/pinecone-client');
jest.mock('../../clients/deepseek-client');
jest.mock('../../monitoring/monitoring-service');

describe('AdvancedRAGPipeline', () => {
  let pipeline: AdvancedRAGPipeline;
  let pinecone: jest.Mocked<PineconeClient>;
  let deepseek: jest.Mocked<DeepSeekClient>;
  let monitoring: jest.Mocked<MonitoringService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Initialize pipeline
    pipeline = AdvancedRAGPipeline.getInstance();
    pinecone = PineconeClient.getInstance() as jest.Mocked<PineconeClient>;
    deepseek = DeepSeekClient.getInstance() as jest.Mocked<DeepSeekClient>;
    monitoring = MonitoringService.getInstance() as jest.Mocked<MonitoringService>;
  });

  describe('Text Chunking', () => {
    it('should chunk text by sentences', async () => {
      const text = 'First sentence. Second sentence. Third sentence.';
      const config = {
        maxChunkSize: 2,
        overlap: 1,
        strategy: 'sentence' as const
      };

      const chunks = await pipeline.processWithChunking(text, config);
      
      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toContain('First sentence');
      expect(monitoring.trackOperation).toHaveBeenCalledWith(
        'chunk_text',
        expect.any(Function)
      );
    });

    it('should handle empty text', async () => {
      const chunks = await pipeline.processWithChunking('', {
        maxChunkSize: 10,
        overlap: 0,
        strategy: 'paragraph'
      });

      expect(chunks).toHaveLength(0);
    });
  });

  describe('Retrieval with Reranking', () => {
    it('should rerank search results', async () => {
      const query = 'test query';
      const mockResults = [
        { text: 'result 1', score: 0.5 },
        { text: 'result 2', score: 0.8 }
      ];

      pinecone.query.mockResolvedValue(mockResults);
      deepseek.generateCode.mockResolvedValue(JSON.stringify([
        { index: 1, relevance: 0.9 },
        { index: 0, relevance: 0.6 }
      ]));

      const results = await pipeline.retrieveWithReranking(query, {
        topK: 2,
        minRelevance: 0.5,
        reranking: true
      });

      expect(results).toHaveLength(2);
      expect(results[0].score).toBeGreaterThan(results[1].score);
      expect(pinecone.query).toHaveBeenCalledWith(
        query,
        expect.any(Object)
      );
    });
  });

  describe('Streaming Generation', () => {
    it('should stream generated content', async () => {
      const prompt = 'test prompt';
      const mockChunks = ['chunk1', 'chunk2', 'chunk3'];
      const onChunk = jest.fn();

      deepseek.generateCode.mockResolvedValue(mockChunks.join(''));

      const result = await pipeline.generateWithStream(
        prompt,
        {
          temperature: 0.7,
          maxTokens: 100,
          streaming: true
        },
        onChunk
      );

      expect(result).toBe(mockChunks.join(''));
      expect(onChunk).toHaveBeenCalledTimes(1);
      expect(monitoring.trackOperation).toHaveBeenCalledWith(
        'generate_stream',
        expect.any(Function)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle chunking errors gracefully', async () => {
      const text = null;
      
      await expect(pipeline.processWithChunking(text as any, {
        maxChunkSize: 10,
        overlap: 0,
        strategy: 'sentence'
      })).rejects.toThrow();
    });

    it('should handle reranking errors', async () => {
      deepseek.generateCode.mockRejectedValue(new Error('Reranking failed'));

      const results = await pipeline.retrieveWithReranking('query', {
        topK: 2,
        minRelevance: 0.5,
        reranking: true
      });

      expect(results).toBeDefined();
      expect(monitoring.trackOperation).toHaveBeenCalled();
    });
  });
});
