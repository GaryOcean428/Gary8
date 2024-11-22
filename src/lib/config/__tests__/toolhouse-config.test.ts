import { describe, it, expect, beforeEach } from 'vitest';
import { ToolhouseConfig } from '../toolhouse-config';
import { thoughtLogger } from '../../logging/thought-logger';

describe('ToolhouseConfig', () => {
    let toolhouseConfig: ToolhouseConfig;

    beforeEach(async () => {
        toolhouseConfig = ToolhouseConfig.getInstance();
        await toolhouseConfig.initialize();
    });

    describe('getToolsForProvider', () => {
        it('should get tools for Anthropic', async () => {
            const tools = await toolhouseConfig.getToolsForProvider('anthropic');
            expect(tools).toBeDefined();
        });

        it('should get tools for LlamaIndex', async () => {
            const tools = await toolhouseConfig.getToolsForProvider('llamaindex');
            expect(tools).toBeDefined();
        });

        it('should handle errors gracefully', async () => {
            process.env.TOOLHOUSE_API_KEY = '';
            await expect(
                toolhouseConfig.getToolsForProvider('anthropic')
            ).rejects.toThrow();
        });
    });
}); 