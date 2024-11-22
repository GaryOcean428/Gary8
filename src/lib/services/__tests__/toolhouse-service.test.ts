import { describe, it, expect, beforeEach } from 'vitest';
import { ToolhouseService } from '../toolhouse-service';
import { thoughtLogger } from '../../logging/thought-logger';
import { Messages } from '@anthropic-ai/sdk';

describe('ToolhouseService', () => {
    let service: ToolhouseService;

    beforeEach(async () => {
        service = ToolhouseService.getInstance();
        await service.initialize();
    });

    describe('processWithTools', () => {
        it('should process messages with local tools', async () => {
            const messages: Messages.MessageParam[] = [{
                role: 'user',
                content: 'Search the codebase for authentication implementations'
            }];

            const result = await service.processWithTools(messages);
            expect(result).toBeDefined();
            expect(result[0].content).toBeDefined();
            expect(thoughtLogger.log).toHaveBeenCalledWith(
                'info',
                'Processing messages with Toolhouse tools'
            );
        });

        it('should handle local tool errors gracefully', async () => {
            const messages: Messages.MessageParam[] = [{
                role: 'user',
                content: 'Search with invalid parameters'
            }];

            await expect(service.processWithTools(messages)).resolves.toBeDefined();
        });
    });

    describe('switchProvider', () => {
        it('should switch to different providers', async () => {
            await service.switchProvider('vercel');
            expect(thoughtLogger.log).toHaveBeenCalledWith(
                'success',
                'Switched to vercel provider'
            );

            await service.switchProvider('llamaindex');
            expect(thoughtLogger.log).toHaveBeenCalledWith(
                'success',
                'Switched to llamaindex provider'
            );
        });
    });
}); 