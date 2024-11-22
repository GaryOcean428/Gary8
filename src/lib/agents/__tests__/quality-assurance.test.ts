import { describe, it, expect, beforeEach } from 'vitest';
import { QualityAssuranceAgent } from '../quality-assurance';
import { thoughtLogger } from '../../logging/thought-logger';

describe('QualityAssuranceAgent', () => {
    let agent: QualityAssuranceAgent;

    beforeEach(() => {
        agent = QualityAssuranceAgent.getInstance();
    });

    describe('reviewCode', () => {
        it('should detect var usage', async () => {
            const code = `
                function test() {
                    var x = 1;
                    return x;
                }
            `;

            const result = await agent.reviewCode(code, 'javascript');
            expect(result.issues).toContain('Use of var keyword detected. Consider using let or const');
        });

        it('should detect long functions', async () => {
            const longFunction = Array(31).fill('console.log("test");').join('\n');
            const code = `function test() {\n${longFunction}\n}`;

            const result = await agent.reviewCode(code, 'javascript');
            expect(result.suggestions).toContain('Consider breaking down large functions into smaller ones');
        });

        it('should detect security issues', async () => {
            const code = `
                function unsafe() {
                    eval('console.log("test")');
                    element.innerHTML = '<div>test</div>';
                }
            `;

            const result = await agent.reviewCode(code, 'javascript');
            expect(result.issues).toContain('Use of eval() detected - potential security risk');
            expect(result.issues).toContain('Use of innerHTML detected - potential XSS risk');
        });

        it('should calculate quality score correctly', async () => {
            const code = `
                function test() {
                    return 'clean code';
                }
            `;

            const result = await agent.reviewCode(code, 'javascript');
            expect(result.quality).toBe(100);
        });
    });

    describe('runTests', () => {
        it('should execute test files', async () => {
            const testFiles = ['test1.test.ts', 'test2.test.ts'];
            
            await expect(agent.runTests(testFiles)).resolves.not.toThrow();
            expect(thoughtLogger.log).toHaveBeenCalledWith(
                'info',
                'Running tests',
                { fileCount: 2 }
            );
        });
    });
});
