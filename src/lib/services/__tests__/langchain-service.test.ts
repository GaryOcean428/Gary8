import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LangChainService } from '../langchain-service';
import { thoughtLogger } from '../../logging/thought-logger';
import { StructuredTool } from '@langchain/core/tools';

describe('LangChainService', () => {
    let service: LangChainService;

    beforeEach(() => {
        service = LangChainService.getInstance();
    });

    describe('analyzeCode', () => {
        it('should analyze code and create a run', async () => {
            const code = `
                function test() {
                    console.log('hello');
                }
            `;

            const result = await service.analyzeCode(code);
            expect(result).toBeDefined();
            expect(result.complexity).toBeDefined();
            expect(result.patterns).toBeDefined();
            expect(result.issues).toBeDefined();
            expect(result.suggestions).toBeDefined();
            expect(thoughtLogger.log).toHaveBeenCalledWith(
                'info',
                'Starting code analysis with LangChain'
            );
        });

        it('should handle analysis errors', async () => {
            const invalidCode = null;
            await expect(service.analyzeCode(invalidCode as any)).rejects.toThrow();
        });
    });

    describe('checkCodeQuality', () => {
        it('should check code quality with metrics', async () => {
            const code = `
                function test() {
                    var x = 1;
                    return x;
                }
            `;

            const result = await service.checkCodeQuality(code);
            expect(result).toBeDefined();
            expect(result.score).toBeDefined();
            expect(result.metrics).toBeDefined();
            expect(result.metrics.complexity).toBeDefined();
            expect(result.metrics.maintainability).toBeDefined();
            expect(result.metrics.reliability).toBeDefined();
        });
    });

    describe('generateCode', () => {
        it('should generate code from prompt', async () => {
            const prompt = 'Create a function that calculates fibonacci numbers';
            const result = await service.generateCode(prompt);
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result).toContain('function');
        });

        it('should generate code with context', async () => {
            const prompt = 'Add error handling to this function';
            const context = {
                existingCode: `
                    function divide(a, b) {
                        return a / b;
                    }
                `
            };
            const result = await service.generateCode(prompt, context);
            expect(result).toContain('try');
            expect(result).toContain('catch');
        });
    });

    describe('custom tools', () => {
        it('should register and retrieve custom tools', async () => {
            const mockTool = {
                name: 'testTool',
                description: 'A test tool',
                call: async () => 'test result'
            } as StructuredTool;

            await service.registerCustomTool('testTool', mockTool);
            const tools = await service.getRegisteredTools();
            expect(tools).toContainEqual(mockTool);
        });
    });
}); 