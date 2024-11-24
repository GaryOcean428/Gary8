import { thoughtLogger } from '../utils/logger';
import { MonitoringService } from '../monitoring/monitoring-service';
import { DeepSeekClient } from '../clients/deepseek-client';

interface ErrorContext {
  code?: string;
  operation: string;
  timestamp: number;
  environment: string;
  user?: string;
  metadata?: Record<string, any>;
}

interface ErrorAnalysis {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestedFix?: string;
  relatedIssues?: string[];
  preventiveMeasures?: string[];
}

export class ErrorReporting {
  private static instance: ErrorReporting;
  private monitoring: MonitoringService;
  private deepseek: DeepSeekClient;

  private constructor() {
    this.monitoring = MonitoringService.getInstance();
    this.deepseek = DeepSeekClient.getInstance();
  }

  static getInstance(): ErrorReporting {
    if (!this.instance) {
      this.instance = new ErrorReporting();
    }
    return this.instance;
  }

  async reportError(error: Error, context: ErrorContext): Promise<void> {
    try {
      // Log error with context
      thoughtLogger.error('Error occurred', {
        error,
        context,
        stack: error.stack
      });

      // Analyze error using DeepSeek
      const analysis = await this.analyzeError(error, context);

      // Track in monitoring system
      await this.monitoring.trackOperation('error_report', async () => {
        await this.storeErrorReport(error, context, analysis);
      });

      // Send alerts if necessary
      if (analysis.severity === 'high' || analysis.severity === 'critical') {
        await this.sendAlerts(error, analysis);
      }

      // Generate fix suggestions if code-related
      if (context.code) {
        const fixes = await this.generateFixSuggestions(error, context.code);
        analysis.suggestedFix = fixes;
      }
    } catch (reportingError) {
      // Fallback error logging if reporting fails
      thoughtLogger.error('Error reporting failed', {
        originalError: error,
        reportingError
      });
    }
  }

  private async analyzeError(error: Error, context: ErrorContext): Promise<ErrorAnalysis> {
    const prompt = `Analyze the following error and provide structured insights:
Error: ${error.message}
Stack: ${error.stack}
Context: ${JSON.stringify(context, null, 2)}

Provide analysis including:
1. Error type and classification
2. Severity level
3. Detailed description
4. Related issues
5. Preventive measures`;

    try {
      const analysis = await this.deepseek.generateCode(prompt);
      return JSON.parse(analysis);
    } catch (analysisError) {
      thoughtLogger.error('Error analysis failed', { analysisError });
      return {
        type: error.name,
        severity: 'medium',
        description: error.message
      };
    }
  }

  private async storeErrorReport(
    error: Error,
    context: ErrorContext,
    analysis: ErrorAnalysis
  ): Promise<void> {
    const report = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      analysis,
      timestamp: Date.now()
    };

    // Store in monitoring system
    await this.monitoring.storeMetric('error_reports', report);
  }

  private async sendAlerts(error: Error, analysis: ErrorAnalysis): Promise<void> {
    const alert = {
      title: `${analysis.severity.toUpperCase()} Severity Error: ${error.name}`,
      message: error.message,
      analysis: {
        type: analysis.type,
        description: analysis.description,
        suggestedFix: analysis.suggestedFix
      },
      timestamp: Date.now()
    };

    await this.monitoring.sendAlert(alert);
  }

  private async generateFixSuggestions(error: Error, code: string): Promise<string> {
    const prompt = `Given the following error and code, suggest fixes:
Error: ${error.message}
Stack: ${error.stack}

Code:
${code}

Provide specific fixes that would resolve this error.`;

    try {
      return await this.deepseek.generateCode(prompt);
    } catch (error) {
      thoughtLogger.error('Fix suggestion generation failed', { error });
      return 'Unable to generate fix suggestions';
    }
  }
} 