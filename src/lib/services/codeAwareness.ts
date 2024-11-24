import { thoughtLogger } from '../logging/thought-logger';
import { CodeCapability, FileContent } from '../interfaces/code-interfaces';
import { ErrorHandler } from '../utils/error-handler';

export class CodeAwareness {
    private static instance: CodeAwareness;
    private initialized: boolean = false;

    private constructor() {}

    static getInstance(): CodeAwareness {
        if (!CodeAwareness.instance) {
            CodeAwareness.instance = new CodeAwareness();
        }
        return CodeAwareness.instance;
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;
        
        try {
            thoughtLogger.log('info', 'Initializing code awareness system');
            // Initialize language parsers and analysis tools
            this.initialized = true;
            thoughtLogger.log('success', 'Code awareness system initialized');
        } catch (error) {
            throw ErrorHandler.handleWithThrow(error, 'initialize code awareness');
        }
    }

    async analyzeCode(code: string): Promise<{
        capabilities: CodeCapability[];
        dependencies: string[];
        complexity: number;
        suggestions: string[];
    }> {
        if (!this.initialized) await this.initialize();

        try {
            thoughtLogger.log('info', 'Analyzing code', { codeLength: code.length });

            // Perform static analysis
            const analysis = await this.performStaticAnalysis(code);
            
            // Generate suggestions
            const suggestions = await this.generateSuggestions(analysis);

            return {
                capabilities: analysis.capabilities,
                dependencies: analysis.dependencies,
                complexity: analysis.complexity,
                suggestions
            };
        } catch (error) {
            throw ErrorHandler.handleWithThrow(error, 'analyze code');
        }
    }

    private async performStaticAnalysis(code: string) {
        // Implement static code analysis
        const capabilities: CodeCapability[] = [];
        const dependencies: string[] = [];
        let complexity = 0;

        // Parse imports and exports
        const importMatches = code.match(/import\s+.*?from\s+['"](.+?)['"]/g) || [];
        dependencies.push(...importMatches.map(match => match.split('from')[1].trim().replace(/['"]/g, '')));

        // Find functions and classes
        const functionMatches = code.match(/(?:function|class)\s+(\w+)/g) || [];
        functionMatches.forEach(match => {
            capabilities.push({
                name: match.split(/\s+/)[1],
                type: match.startsWith('class') ? 'class' : 'function',
                path: 'unknown'
            });
        });

        // Calculate complexity (simplified)
        complexity = (code.match(/if|while|for|switch/g) || []).length;

        return { capabilities, dependencies, complexity };
    }

    private async generateSuggestions(analysis: any): Promise<string[]> {
        const suggestions: string[] = [];

        // Add suggestions based on analysis
        if (analysis.complexity > 10) {
            suggestions.push('Consider breaking down complex functions into smaller ones');
        }

        if (analysis.dependencies.length > 15) {
            suggestions.push('Large number of dependencies detected. Consider modularizing the code');
        }

        return suggestions;
    }

    get isInitialized(): boolean {
        return this.initialized;
    }
} 