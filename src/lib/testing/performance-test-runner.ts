import { PerformanceTestUtils } from './performance-test-utils';
import { MonitoringService } from '../monitoring/monitoring-service';
import { thoughtLogger } from '../utils/logger';

interface TestSuite {
  name: string;
  tests: TestCase[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

interface TestCase {
  name: string;
  operation: () => Promise<any>;
  config: {
    iterations: number;
    warmup?: number;
    timeout?: number;
    memoryThreshold?: number;
    cpuThreshold?: number;
  };
}

export class PerformanceTestRunner {
  private monitoring = MonitoringService.getInstance();

  async runSuite(suite: TestSuite): Promise<void> {
    thoughtLogger.info(`Starting test suite: ${suite.name}`);
    const startTime = Date.now();

    try {
      // Run setup if provided
      if (suite.setup) {
        await suite.setup();
      }

      // Run all tests
      for (const test of suite.tests) {
        await this.runTest(test);
      }

      // Run teardown if provided
      if (suite.teardown) {
        await suite.teardown();
      }

      const duration = Date.now() - startTime;
      thoughtLogger.info(`Test suite completed: ${suite.name}`, { duration });

      await this.monitoring.trackMetric('test_suite', {
        name: suite.name,
        duration,
        testsCount: suite.tests.length,
        timestamp: startTime
      });
    } catch (error) {
      thoughtLogger.error(`Test suite failed: ${suite.name}`, { error });
      throw error;
    }
  }

  private async runTest(test: TestCase): Promise<void> {
    thoughtLogger.info(`Running test: ${test.name}`);

    try {
      const result = await PerformanceTestUtils.measurePerformance(
        test.operation,
        {
          name: test.name,
          ...test.config
        }
      );

      thoughtLogger.info(`Test completed: ${test.name}`, { result });

      // Report detailed metrics
      await this.monitoring.trackMetric('test_case', {
        ...result,
        timestamp: Date.now()
      });
    } catch (error) {
      thoughtLogger.error(`Test failed: ${test.name}`, { error });
      throw error;
    }
  }

  async runLoadTest(
    operation: () => Promise<any>,
    config: {
      duration: number;
      baseLoad: number;
      pattern: 'linear' | 'spike' | 'wave';
    }
  ): Promise<void> {
    const loadProfile = PerformanceTestUtils.generateLoadProfile(
      config.baseLoad,
      config.duration,
      config.pattern
    );

    thoughtLogger.info('Starting load test', { config });

    for (const load of loadProfile) {
      const promises = Array(Math.floor(load)).fill(null).map(() => 
        PerformanceTestUtils.benchmarkOperation(operation, 'load_test')
      );

      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms between samples
    }

    thoughtLogger.info('Load test completed');
  }
} 