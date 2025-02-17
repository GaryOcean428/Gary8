import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { thoughtLogger } from '../logging/thought-logger';
import { MonitoringService } from '../monitoring/monitoring-service';

export class CodeAnalysisTool extends StructuredTool {
    name = 'code-analysis';
    description = 'Analyzes code for patterns, complexity, and potential issues';
    schema = z.object({
        code: z.string().describe('The code to analyze'),
        language: z.string().optional().describe('The programming language'),
        depth: z.number().optional().describe('Analysis depth (1-5)')
    });

    private monitoring = MonitoringService.getInstance();

    async _call(args: z.infer<typeof this.schema>) {
        return await this.monitoring.trackOperation('code_analysis', async () => {
            try {
                thoughtLogger.log('info', 'Running code analysis tool', { 
                    language: args.language,
                    codeLength: args.code.length,
                    depth: args.depth
                });

                const startTime = performance.now();
                const analysis = await this.analyzeCode(args.code, args.language, args.depth);
                const duration = performance.now() - startTime;

                this.monitoring.recordMetric('code_analysis_duration', duration);
                this.monitoring.recordMetric('code_complexity', analysis.complexity);

                return JSON.stringify(analysis);
            } catch (error) {
                thoughtLogger.log('error', 'Code analysis tool failed', { error });
                throw error;
            }
        });
    }

    private async analyzeCode(code: string, language?: string, depth: number = 3) {
        const metrics: Record<string, number> = {};

        await Promise.all([
            this.monitoring.trackOperation('calculate_complexity', async () => {
                metrics.complexity = this.calculateComplexity(code);
            }),
            this.monitoring.trackOperation('identify_patterns', async () => {
                metrics.patternCount = this.identifyPatterns(code).length;
            }),
            this.monitoring.trackOperation('find_issues', async () => {
                metrics.issueCount = this.findIssues(code).length;
            })
        ]);

        return {
            complexity: metrics.complexity,
            patterns: this.identifyPatterns(code),
            issues: this.findIssues(code),
            metrics: this.calculateMetrics(code),
            performance: metrics
        };
    }

    private calculateComplexity(code: string): number {
        const complexityFactors = {
            if: 1,
            for: 1,
            while: 1,
            switch: 1,
            catch: 1
        };
        
        let complexity = 0;
        for (const [pattern, weight] of Object.entries(complexityFactors)) {
            const matches = code.match(new RegExp(pattern, 'g')) || [];
            complexity += matches.length * weight;
        }
        
        return complexity;
    }

    private identifyPatterns(code: string): string[] {
        const patterns = [];
        const patternRules = {
            singleton: /private\s+static\s+instance/,
            factory: /create[A-Z][a-zA-Z]*\(/,
            observer: /subscribe|notify|observe/,
            decorator: /decorator|@[a-zA-Z]+/
        };

        for (const [name, regex] of Object.entries(patternRules)) {
            if (regex.test(code)) {
                patterns.push(name);
            }
        }

        return patterns;
    }

    private findIssues(code: string): string[] {
        const issues: string[] = [];
        const issuePatterns = {
            'eval-usage': /eval\s*\(/,
            'console-log': /console\.(log|debug|info)/,
            'empty-catch': /catch\s*\([^)]*\)\s*{}/,
            'magic-numbers': /(?<![\w])[0-9]+(?![\w])/,
            'long-function': new RegExp(`{[^}]*\n[^}]*\n[^}]*\n[^}]*\n[^}]*}`, 'g')
        };

        for (const [name, pattern] of Object.entries(issuePatterns)) {
            if (pattern.test(code)) {
                issues.push(name);
            }
        }

        return issues;
    }

    private calculateMetrics(code: string): Record<string, number> {
        return {
            lineCount: code.split('\n').length,
            charCount: code.length,
            functionCount: (code.match(/function\s+\w+/g) || []).length,
            classCount: (code.match(/class\s+\w+/g) || []).length,
            commentCount: (code.match(/\/\/.+|\/\*[\s\S]*?\*\//g) || []).length
        };
    }
}
