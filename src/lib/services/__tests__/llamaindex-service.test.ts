import { describe, it, expect, beforeEach } from 'vitest';
import { LlamaIndexService } from '../llamaindex-service';
import { thoughtLogger } from '../../logging/thought-logger';

describe('LlamaIndexService', () => {
    let service: LlamaIndexService;

    beforeEach(async () => {
        service = LlamaIndexService.getInstance();
        await service.initialize();
    });

    describe('processQuery', () => {
        it('should process search queries', async () => {
            const query = 'Search for AI companies and analyze their tech stack';
            const result = await service.processQuery(query);
            
            expect(result).toBeDefined();
            expect(thoughtLogger.log).toHaveBeenCalledWith(
                'info',
                'Processing query with LlamaIndex',
                { query }
            );
        });

        it('should handle processing errors', async () => {
            const invalidQuery = null;
            await expect(
                service.processQuery(invalidQuery as any)
            ).rejects.toThrow();
        });
    });

    describe('searchAndAnalyze', () => {
        it('should search and analyze with default options', async () => {
            const query = 'Find companies using LangChain';
            const result = await service.searchAndAnalyze(query);
            
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeLessThanOrEqual(5);
        });

        it('should respect maxResults option', async () => {
            const query = 'Find companies using LangChain';
            const result = await service.searchAndAnalyze(query, { maxResults: 3 });
            
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeLessThanOrEqual(3);
        });

        it('should include metadata when requested', async () => {
            const query = 'Find companies using LangChain';
            const result = await service.searchAndAnalyze(query, { 
                includeMetadata: true 
            });
            
            expect(result[0].metadata).toBeDefined();
        });

        it('should work with specific bundles', async () => {
            const query = 'Find companies using LangChain';
            const result = await service.searchAndAnalyze(query, { 
                bundle: 'search_and_get_page_contents' 
            });
            
            expect(result).toBeDefined();
        });
    });
}); 