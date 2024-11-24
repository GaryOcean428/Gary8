export interface MetricsData {
  avgResponseTime: number;
  responseTimeChange: number;
  memoryUsage: number;
  memoryUsageChange: number;
  cpuLoad: number;
  cpuLoadChange: number;
  cacheHitRate: number;
  cacheHitRateChange: number;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): MonitoringService {
    if (!this.instance) {
      this.instance = new MonitoringService();
    }
    return this.instance;
  }

  async trackOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      return await operation();
    } finally {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_duration`, duration);
    }
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetrics(name: string): number[] {
    return this.metrics.get(name) || [];
  }

  getAverageMetric(name: string): number {
    const values = this.getMetrics(name);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  clearMetrics() {
    this.metrics.clear();
  }
}
