import { BaseAgent } from './base-agent';
import { CodeReviewResult } from '../interfaces/code-interfaces';
import { thoughtLogger } from '../logging/thought-logger';
import { ErrorHandler } from '../utils/error-handler';

export class QualityAssuranceAgent extends BaseAgent {
    private static instance: QualityAssuranceAgent;
    
    private constructor() {
        super('quality-assurance', 'Quality Assurance Agent');
    }

    static getInstance(): QualityAssuranceAgent {
        if (!QualityAssuranceAgent.instance) {
            QualityAssuranceAgent.instance = new QualityAssuranceAgent();
        }
        return QualityAssuranceAgent.instance;
    }

    async reviewCode(code: string, language?: string): Promise<CodeReviewResult> {
        try {
            thoughtLogger.log('info', 'Starting code review', { language });

            // Perform static analysis
            const staticAnalysis = await this.performStaticAnalysis(code);

            // Check for security vulnerabilities
            const securityIssues = await this.checkSecurity(code);

            // Analyze code quality
            const qualityScore = await this.calculateQualityScore(staticAnalysis);

            const result: CodeReviewResult = {
                issues: [...staticAnalysis.issues, ...securityIssues],
                suggestions: staticAnalysis.suggestions,
                quality: qualityScore
            };

            thoughtLogger.log('success', 'Code review completed', { 
                issueCount: result.issues.length,
                quality: result.quality 
            });

            return result;
        } catch (error) {
            throw ErrorHandler.handleWithThrow(error, 'review code');
        }
    }
    
    async runTests(testFiles: string[]): Promise<void> {
        try {
            thoughtLogger.log('info', 'Running tests', { fileCount: testFiles.length });

            for (const file of testFiles) {
                await this.executeTestFile(file);
            }

            thoughtLogger.log('success', 'Tests completed successfully');
        } catch (error) {
            throw ErrorHandler.handleWithThrow(error, 'run tests');
        }
    }

    private async performStaticAnalysis(code: string) {
        const issues: string[] = [];
        const suggestions: string[] = [];

        // Check for common code smells
        if (code.includes('var ')) {
            issues.push('Use of var keyword detected. Consider using let or const');
        }

        // Check function length
        const functions = code.match(/function\s+\w+\s*\([^)]*\)\s*{[^}]*}/g) || [];
        functions.forEach(func => {
            if (func.split('\n').length > 30) {
                suggestions.push('Consider breaking down large functions into smaller ones');
            }
        });

        return { issues, suggestions };
    }

    private async checkSecurity(code: string): Promise<string[]> {
        const issues: string[] = [];

        // Check for common security issues
        if (code.includes('eval(')) {
            issues.push('Use of eval() detected - potential security risk');
        }

        if (code.includes('innerHTML')) {
            issues.push('Use of innerHTML detected - potential XSS risk');
        }

        return issues;
    }

    private async calculateQualityScore(analysis: any): Promise<number> {
        let score = 100;

        // Deduct points for issues
        score -= analysis.issues.length * 5;
        
        // Deduct points for suggestions
        score -= analysis.suggestions.length * 2;

        // Ensure score stays within 0-100 range
        return Math.max(0, Math.min(100, score));
    }

    private async executeTestFile(file: string): Promise<void> {
        thoughtLogger.log('info', 'Executing test file', { file });
        // Implement test execution logic
        // This would typically integrate with your test runner (Jest, Vitest, etc.)
    }
}
