import { thoughtLogger } from '../utils/logger';
import { RedisCache } from '../cache/redis-cache';

interface LatencyMetric {
  operation: string;
  duration: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private cache: RedisCache;
  private readonly LATENCY_KEY = 'app:latency';
  private readonly THRESHOLD_KEY = 'app:latency:thresholds';

  constructor() {
    this.cache = RedisCache.getInstance();
    this.initializeThresholds();
  }

  async recordLatency(operation: string, duration: number): Promise<void> {
    const metric: LatencyMetric = {
      operation,
      duration,
      timestamp: Date.now()
    };

    try {
      await this.storeLatencyMetric(metric);
      await this.checkLatencyThreshold(metric);
      await this.updatePerformanceStats(metric);
    } catch (error) {
      thoughtLogger.error('Failed to record latency', { metric, error });
    }
  }

  private async initializeThresholds(): Promise<void> {
    const existingThresholds = await this.cache.get(this.THRESHOLD_KEY);
    if (!existingThresholds) {
      const defaultThresholds = {
        api: 1000,      // 1 second
        database: 500,  // 500ms
        cache: 100,     // 100ms
        default: 2000   // 2 seconds
      };
      await this.cache.set(this.THRESHOLD_KEY, defaultThresholds);
    }
  }

  private async storeLatencyMetric(metric: LatencyMetric): Promise<void> {
    const metrics = await this.cache.get(this.LATENCY_KEY) || [];
    metrics.push(metric);

    // Keep only last hour of metrics
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentMetrics = metrics.filter((m: LatencyMetric) => 
      m.timestamp > oneHourAgo
    );

    await this.cache.set(this.LATENCY_KEY, recentMetrics);
  }

  private async checkLatencyThreshold(metric: LatencyMetric): Promise<void> {
    const thresholds = await this.cache.get(this.THRESHOLD_KEY);
    const threshold = thresholds[metric.operation] || thresholds.default;

    if (metric.duration > threshold) {
      thoughtLogger.warn('High latency detected', {
        operation: metric.operation,
        duration: metric.duration,
        threshold
      });
    }
  }

  private async updatePerformanceStats(metric: LatencyMetric): Promise<void> {
    const key = `performance:${metric.operation}:${new Date().toISOString().split('T')[0]}`;
    const stats = await this.cache.get(key) || {
      count: 0,
      totalDuration: 0,
      maxDuration: 0,
      minDuration: Infinity,
      avgDuration: 0
    };

    stats.count++;
    stats.totalDuration += metric.duration;
    stats.maxDuration = Math.max(stats.maxDuration, metric.duration);
    stats.minDuration = Math.min(stats.minDuration, metric.duration);
    stats.avgDuration = stats.totalDuration / stats.count;

    await this.cache.set(key, stats);
  }
} 