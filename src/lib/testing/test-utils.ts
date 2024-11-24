import { MonitoringService } from '../monitoring/monitoring-service';
import { thoughtLogger } from '../utils/logger';

export class TestUtils {
  static async measurePerformance(
    testName: string,
    testFn: () => Promise<void>
  ): Promise<void> {
    const monitoring = MonitoringService.getInstance();
    
    try {
      await monitoring.trackOperation(testName, testFn);
      thoughtLogger.info(`Test passed: ${testName}`);
    } catch (error) {
      thoughtLogger.error(`Test failed: ${testName}`, { error });
      throw error;
    }
  }

  static createMockRequest(overrides: Partial<any> = {}): any {
    return {
      headers: { authorization: 'Bearer test-token' },
      body: {},
      query: {},
      ...overrides
    };
  }

  static createMockResponse(): any {
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis()
    };
    return res;
  }
} 