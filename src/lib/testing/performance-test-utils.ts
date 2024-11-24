import { PerformanceOptimizer } from '../performance/performance-optimizer';
import { MonitoringService } from '../monitoring/monitoring-service';
import { thoughtLogger } from '../utils/logger';

interface PerformanceTestConfig {
  name: string;
  iterations: number;
  warmupIterations?: number;
  timeout?: number;
  memoryThreshold?: number;
  cpuThreshold?: number;
}

interface PerformanceTestResult {
  name: string;
  averageTime: number;
  minTime: number;
  maxTime: number;
  memoryUsage: number;
  cpuUsage: number;
  iterations: number;
  failures: number;
  metrics: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

export class PerformanceTestUtils {
  private static optimizer = PerformanceOptimizer.getInstance();
  private static monitoring = MonitoringService.getInstance();

  static async measurePerformance(
    operation: () => Promise<any>,
    config: PerformanceTestConfig
  ): Promise<PerformanceTestResult> {
    const times: number[] = [];
    let failures = 0;
    let totalMemory = 0;
    let totalCpu = 0;

    // Warmup phase
    if (config.warmupIterations) {
      for (let i = 0; i < config.warmupIterations; i++) {
        await operation();
      }
    }

    // Test phase
    for (let i = 0; i < config.iterations; i++) {
      const startMemory = performance.memory?.usedJSHeapSize || 0;
      const startTime = performance.now();
      const startCpu = await this.getCpuUsage();

      try {
        await Promise.race([
          operation(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), 
            config.timeout || 5000)
          )
        ]);

        const endTime = performance.now();
        const endMemory = performance.memory?.usedJSHeapSize || 0;
        const endCpu = await this.getCpuUsage();

        times.push(endTime - startTime);
        totalMemory += endMemory - startMemory;
        totalCpu += endCpu - startCpu;
      } catch (error) {
        failures++;
        thoughtLogger.error('Performance test iteration failed', {
          error,
          iteration: i,
          config
        });
      }
    }

    // Calculate metrics
    times.sort((a, b) => a - b);
    const result: PerformanceTestResult = {
      name: config.name,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: times[0],
      maxTime: times[times.length - 1],
      memoryUsage: totalMemory / config.iterations,
      cpuUsage: totalCpu / config.iterations,
      iterations: config.iterations,
      failures,
      metrics: {
        p50: this.getPercentile(times, 50),
        p90: this.getPercentile(times, 90),
        p95: this.getPercentile(times, 95),
        p99: this.getPercentile(times, 99)
      }
    };

    // Check thresholds
    if (config.memoryThreshold && result.memoryUsage > config.memoryThreshold) {
      thoughtLogger.warn('Memory usage exceeded threshold', {
        actual: result.memoryUsage,
        threshold: config.memoryThreshold
      });
    }

    if (config.cpuThreshold && result.cpuUsage > config.cpuThreshold) {
      thoughtLogger.warn('CPU usage exceeded threshold', {
        actual: result.cpuUsage,
        threshold: config.cpuThreshold
      });
    }

    // Store results
    await this.monitoring.trackMetric('performance_test', {
      ...result,
      timestamp: Date.now()
    });

    return result;
  }

  static async benchmarkOperation<T>(
    operation: () => Promise<T>,
    name: string
  ): Promise<T> {
    return await this.optimizer.optimizeOperation(
      `benchmark_${name}`,
      async () => {
        const start = performance.now();
        try {
          const result = await operation();
          const duration = performance.now() - start;

          await this.monitoring.trackMetric('benchmark', {
            name,
            duration,
            success: true
          });

          return result;
        } catch (error) {
          const duration = performance.now() - start;
          await this.monitoring.trackMetric('benchmark', {
            name,
            duration,
            success: false,
            error: error.message
          });
          throw error;
        }
      }
    );
  }

  private static getPercentile(array: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * array.length) - 1;
    return array[index];
  }

  private static async getCpuUsage(): Promise<number> {
    if (typeof window !== 'undefined' && window.performance) {
      // Use Performance API if available
      const measurements = await performance.measureUserAgentSpecificMemory?.();
      return measurements?.duration || 0;
    }
    return 0;
  }

  static generateLoadProfile(
    baseLoad: number,
    duration: number,
    pattern: 'linear' | 'spike' | 'wave'
  ): number[] {
    const samples = Math.floor(duration / 100); // Sample every 100ms
    const loads: number[] = [];

    switch (pattern) {
      case 'linear':
        for (let i = 0; i < samples; i++) {
          loads.push(baseLoad);
        }
        break;

      case 'spike':
        for (let i = 0; i < samples; i++) {
          const progress = i / samples;
          if (progress > 0.45 && progress < 0.55) {
            loads.push(baseLoad * 2);
          } else {
            loads.push(baseLoad);
          }
        }
        break;

      case 'wave':
        for (let i = 0; i < samples; i++) {
          const progress = i / samples;
          const factor = 1 + Math.sin(progress * Math.PI * 2) * 0.5;
          loads.push(baseLoad * factor);
        }
        break;
    }

    return loads;
  }
} 