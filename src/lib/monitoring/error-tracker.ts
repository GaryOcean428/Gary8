import { thoughtLogger } from '../utils/logger';
import { RedisCache } from '../cache/redis-cache';

interface ErrorDetails {
  operation: string;
  duration: number;
  timestamp: string;
  stack?: string;
  context?: Record<string, any>;
}

export class ErrorTracker {
  private cache: RedisCache;
  private readonly ERROR_KEY = 'app:errors';
  private readonly MAX_ERRORS = 100;

  constructor() {
    this.cache = RedisCache.getInstance();
  }

  async trackError(error: Error, details: ErrorDetails): Promise<void> {
    const errorEntry = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...details,
      timestamp: new Date().toISOString()
    };

    try {
      await this.storeError(errorEntry);
      await this.updateErrorStats(errorEntry);
      
      // Alert if error rate is too high
      await this.checkErrorThreshold();
    } catch (storageError) {
      thoughtLogger.error('Failed to track error', { error, storageError });
    }
  }

  private async storeError(error: any): Promise<void> {
    const errors = await this.cache.get(this.ERROR_KEY) || [];
    errors.push(error);
    
    if (errors.length > this.MAX_ERRORS) {
      errors.shift();
    }

    await this.cache.set(this.ERROR_KEY, errors);
  }

  private async updateErrorStats(error: any): Promise<void> {
    const key = `errors:stats:${new Date().toISOString().split('T')[0]}`;
    const stats = await this.cache.get(key) || {
      count: 0,
      byType: {},
      byOperation: {}
    };

    stats.count++;
    stats.byType[error.name] = (stats.byType[error.name] || 0) + 1;
    stats.byOperation[error.operation] = (stats.byOperation[error.operation] || 0) + 1;

    await this.cache.set(key, stats);
  }

  private async checkErrorThreshold(): Promise<void> {
    const stats = await this.getRecentErrorStats();
    const errorRate = stats.count / (5 * 60); // errors per second over last 5 minutes

    if (errorRate > 1) { // More than 1 error per second
      thoughtLogger.alert('High error rate detected', { errorRate, stats });
    }
  }

  private async getRecentErrorStats(): Promise<any> {
    const errors = await this.cache.get(this.ERROR_KEY) || [];
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    return errors.reduce((stats: any, error: any) => {
      if (new Date(error.timestamp).getTime() > fiveMinutesAgo) {
        stats.count++;
      }
      return stats;
    }, { count: 0 });
  }
} 