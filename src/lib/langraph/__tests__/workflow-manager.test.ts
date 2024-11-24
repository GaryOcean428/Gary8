import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowManager } from '../workflow-manager';
import { thoughtLogger } from '../../logging/thought-logger';

describe('WorkflowManager', () => {
    let workflowManager: WorkflowManager;

    beforeEach(async () => {
        workflowManager = WorkflowManager.getInstance();
        await workflowManager.initialize();
    });

    describe('executeWorkflow', () => {
        it('should process code analysis workflow', async () => {
            const input = `
                function test() {
                    console.log('hello world');
                }
            `;

            const result = await workflowManager.executeWorkflow(input);
            expect(result).toBeDefined();
            expect(thoughtLogger.log).toHaveBeenCalledWith(
                'info',
                'Executing workflow',
                expect.any(Object)
            );
        });

        it('should handle errors gracefully', async () => {
            const invalidInput = null;

            await expect(
                workflowManager.executeWorkflow(invalidInput as any)
            ).rejects.toThrow();
        });
    });
}); 