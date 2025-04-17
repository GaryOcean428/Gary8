import { ModelRouter } from './model-router';
import { thoughtLogger } from '../logging/thought-logger';
import type { Message } from '../types';

interface CalibrationResult {
  threshold: number;
  modelDistribution: Record<string, number>;
  averageConfidence: number;
  taskTypeAccuracy: number;
}

export class RouterCalibration {
  private router: ModelRouter;
  private sampleQueries: Message[];
  private expectedResults: Record<string, string>;

  constructor() {
    this.router = new ModelRouter();
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Initialize sample queries with expected model assignments
    this.sampleQueries = [
      // Coding tasks
      {
        id: '1',
        role: 'user',
        content: 'Write a TypeScript implementation of a B-tree',
        timestamp: Date.now()
      },
      {
        id: '2',
        role: 'user',
        content: 'Debug this React component with memory leaks',
        timestamp: Date.now()
      },
      // Creative tasks
      {
        id: '3',
        role: 'user',
        content: 'Write a story about time travel',
        timestamp: Date.now()
      },
      {
        id: '4',
        role: 'user',
        content: 'Generate innovative app ideas',
        timestamp: Date.now()
      },
      // Search tasks
      {
        id: '5',
        role: 'user',
        content: 'Find recent AI developments',
        timestamp: Date.now()
      },
      {
        id: '6',
        role: 'user',
        content: 'Research quantum computing advances',
        timestamp: Date.now()
      },
      // Complex reasoning
      {
        id: '7',
        role: 'user',
        content: 'Design a distributed system architecture',
        timestamp: Date.now()
      },
      {
        id: '8',
        role: 'user',
        content: 'Analyze microservices vs monoliths',
        timestamp: Date.now()
      },
      // Simple queries
      {
        id: '9',
        role: 'user',
        content: 'What time is it?',
        timestamp: Date.now()
      },
      {
        id: '10',
        role: 'user',
        content: 'Hello there!',
        timestamp: Date.now()
      }
    ];

    // Define expected model assignments
    this.expectedResults = {
      '1': 'claude-3-7-sonnet-20250219', // Coding
      '2': 'claude-3-7-sonnet-20250219', // Coding
      '3': 'gpt-4.5-preview', // Creative
      '4': 'gpt-4.5-preview', // Creative
      '5': 'sonar-reasoning-pro', // Search
      '6': 'sonar-reasoning-pro', // Search
      '7': 'claude-3-7-sonnet-20250219', // Complex
      '8': 'claude-3-7-sonnet-20250219', // Complex
      '9': 'llama-3.3-70b-versatile', // Simple
      '10': 'llama-3.3-70b-versatile' // Simple
    };
  }

  async calibrate(
    targetDistribution: Record<string, number> = {
      'claude-3-7-sonnet-20250219': 0.4, // 40% for complex/coding tasks
      'gpt-4.5-preview': 0.2, // 20% for creative tasks
      'sonar-reasoning-pro': 0.2, // 20% for search tasks
      'llama-3.3-70b-versatile': 0.2 // 20% for simple tasks
    }
  ): Promise<CalibrationResult> {
    thoughtLogger.log('plan', 'Starting router calibration');

    let currentThreshold = 0.63; // Start with default threshold
    let bestResult: CalibrationResult | null = null;
    let bestScore = 0;

    // Try different thresholds
    for (let threshold = 0.3; threshold <= 0.9; threshold += 0.05) {
      const result = await this.evaluateThreshold(threshold);
      const score = this.calculateScore(result, targetDistribution);

      if (score > bestScore) {
        bestScore = score;
        bestResult = result;
        currentThreshold = threshold;
      }
    }

    if (!bestResult) {
      throw new Error('Calibration failed to find optimal threshold');
    }

    thoughtLogger.log('success', 'Calibration completed', {
      threshold: currentThreshold,
      score: bestScore
    });

    return {
      threshold: currentThreshold,
      modelDistribution: bestResult.modelDistribution,
      averageConfidence: bestResult.averageConfidence,
      taskTypeAccuracy: bestResult.taskTypeAccuracy
    };
  }

  private async evaluateThreshold(threshold: number): Promise<CalibrationResult> {
    const results = await Promise.all(
      this.sampleQueries.map(query => this.router.route(query.content, []))
    );

    // Calculate model distribution
    const modelDistribution = results.reduce((acc, result) => {
      acc[result.model] = (acc[result.model] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Normalize distribution
    const total = Object.values(modelDistribution).reduce((a, b) => a + b, 0);
    Object.keys(modelDistribution).forEach(key => {
      modelDistribution[key] = modelDistribution[key] / total;
    });

    // Calculate average confidence
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    // Calculate task type accuracy
    const taskTypeAccuracy = results.reduce((correct, result, index) => {
      const expectedModel = this.expectedResults[this.sampleQueries[index].id];
      return correct + (result.model === expectedModel ? 1 : 0);
    }, 0) / results.length;

    return {
      threshold,
      modelDistribution,
      averageConfidence,
      taskTypeAccuracy
    };
  }

  private calculateScore(
    result: CalibrationResult,
    targetDistribution: Record<string, number>
  ): number {
    // Calculate distribution score (0-1)
    const distributionScore = 1 - Object.keys(targetDistribution).reduce((diff, model) => {
      return diff + Math.abs((result.modelDistribution[model] || 0) - targetDistribution[model]);
    }, 0) / 2;

    // Weight the components
    const weights = {
      distribution: 0.4,
      confidence: 0.3,
      accuracy: 0.3
    };

    return (
      distributionScore * weights.distribution +
      result.averageConfidence * weights.confidence +
      result.taskTypeAccuracy * weights.accuracy
    );
  }

  getOptimalThreshold(): number {
    return 0.63; // Default calibrated threshold
  }
}

export const routerCalibration = new RouterCalibration();