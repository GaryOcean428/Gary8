import { MonitoringService } from './monitoring-service';
import { ErrorReporting } from '../error/error-reporting';
import { thoughtLogger } from '../utils/logger';

interface OperationMetrics {
  duration: number;
  status: 'success' | 'error';
  type: string;
  metadata?: Record<string, any>;
}

interface ResourceUsage {
  memory: number;
  cpu: number;
  network: {
    requests: number;
    bandwidth: number;
  };
}

export class MonitoringExtensions {
  private static instance: MonitoringExtensions;
  private monitoring: MonitoringService;
  private errorReporting: ErrorReporting;

  private constructor() {
    this.monitoring = MonitoringService.getInstance();
    this.errorReporting = ErrorReporting.getInstance();
  }

  static getInstance(): MonitoringExtensions {
    if (!this.instance) {
      this.instance = new MonitoringExtensions();
    }
    return this.instance;
  }

  // Track AI operations
  async trackAIOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    const startUsage = await this.getResourceUsage();

    try {
      const result = await fn();
      
      // Record success metrics
      await this.recordOperationMetrics({
        duration: performance.now() - startTime,
        status: 'success',
        type: 'ai_operation',
        metadata: {
          operation,
          resourceUsage: {
            before: startUsage,
            after: await this.getResourceUsage()
          },
          ...metadata
        }
      });

      return result;
    } catch (error) {
      // Record error metrics
      await this.recordOperationMetrics({
        duration: performance.now() - startTime,
        status: 'error',
        type: 'ai_operation',
        metadata: {
          operation,
          error: error.message,
          resourceUsage: {
            before: startUsage,
            after: await this.getResourceUsage()
          },
          ...metadata
        }
      });

      throw error;
    }
  }

  // Track RAG operations
  async trackRAGOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await fn();
      
      await this.recordOperationMetrics({
        duration: performance.now() - startTime,
        status: 'success',
        type: 'rag_operation',
        metadata: {
          operation,
          context,
          resultSize: JSON.stringify(result).length
        }
      });

      return result;
    } catch (error) {
      await this.recordOperationMetrics({
        duration: performance.now() - startTime,
        status: 'error',
        type: 'rag_operation',
        metadata: {
          operation,
          context,
          error: error.message
        }
      });

      throw error;
    }
  }

  // Track code operations
  async trackCodeOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    code: string
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await fn();
      
      await this.recordOperationMetrics({
        duration: performance.now() - startTime,
        status: 'success',
        type: 'code_operation',
        metadata: {
          operation,
          codeSize: code.length,
          language: this.detectLanguage(code)
        }
      });

      return result;
    } catch (error) {
      await this.recordOperationMetrics({
        duration: performance.now() - startTime,
        status: 'error',
        type: 'code_operation',
        metadata: {
          operation,
          codeSize: code.length,
          language: this.detectLanguage(code),
          error: error.message
        }
      });

      throw error;
    }
  }

  private async recordOperationMetrics(metrics: OperationMetrics): Promise<void> {
    await this.monitoring.storeMetric(metrics.type, {
      ...metrics,
      timestamp: Date.now()
    });

    if (metrics.status === 'error') {
      await this.errorReporting.reportError(new Error(metrics.metadata?.error), {
        operation: metrics.metadata?.operation,
        timestamp: Date.now(),
        metadata: metrics.metadata
      });
    }

    thoughtLogger.info(`Operation tracked: ${metrics.metadata?.operation}`, metrics);
  }

  private async getResourceUsage(): Promise<ResourceUsage> {
    // Implement resource usage monitoring
    return {
      memory: 0,
      cpu: 0,
      network: {
        requests: 0,
        bandwidth: 0
      }
    };
  }

  private detectLanguage(code: string): string {
    // Implement language detection
    return 'typescript';
  }
} 