import { thoughtLogger } from '../utils/logger';
import { RedisCache } from '../cache/redis-cache';

interface Metric {
  operation: string;
  duration: number;
  status: 'success' | 'error';
  errorType?: string;
  timestamp: number;
}

export class MetricsCollector {
  private cache: RedisCache;
  private readonly METRICS_KEY = 'app:metrics';
  private readonly MAX_METRICS = 1000;

  constructor() {
    this.cache = RedisCache.getInstance();
  }

  async recordMetric(operation: string, data: Partial<Metric>): Promise<void> {
    const metric: Metric = {
      operation,
      duration: data.duration || 0,
      status: data.status || 'success',
      errorType: data.errorType,
      timestamp: Date.now()
    };

    try {
      await this.storeMetric(metric);
      await this.updateAggregates(metric);
    } catch (error) {
      thoughtLogger.error('Failed to record metric', { metric, error });
    }
  }

  private async storeMetric(metric: Metric): Promise<void> {
    const metrics = await this.cache.get(this.METRICS_KEY) || [];
    metrics.push(metric);
    
    // Keep only the latest metrics
    if (metrics.length > this.MAX_METRICS) {
      metrics.shift();
    }

    await this.cache.set(this.METRICS_KEY, metrics);
  }

  private async updateAggregates(metric: Metric): Promise<void> {
    const key = `metrics:${metric.operation}:${new Date().toISOString().split('T')[0]}`;
    const aggregates = await this.cache.get(key) || {
      count: 0,
      errors: 0,
      totalDuration: 0,
      avgDuration: 0
    };

    aggregates.count++;
    aggregates.totalDuration += metric.duration;
    aggregates.avgDuration = aggregates.totalDuration / aggregates.count;
    if (metric.status === 'error') {
      aggregates.errors++;
    }

    await this.cache.set(key, aggregates);
  }
} 