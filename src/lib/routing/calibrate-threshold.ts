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
    _targetDistribution: Record<string, number> = {
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
      const score = this.calculateScore(result, _targetDistribution);

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

  private async evaluateThreshold(_threshold: number): Promise<CalibrationResult> {
    const results = await Promise.all(
      this.sampleQueries.map(_query => this.router.route(_query.content, []))
    );

    // Calculate model distribution
    const modelDistribution = results.reduce((_acc, _result) => {
      _acc[_result.model] = (_acc[_result.model] || 0) + 1;
      return _acc;
    }, {} as Record<string, number>);

    // Normalize distribution
    const total = Object.values(modelDistribution).reduce((_a, _b) => _a + _b, 0);
    Object.keys(modelDistribution).forEach(_key => {
      modelDistribution[_key] = modelDistribution[_key] / total;
    });

    // Calculate average confidence
    const averageConfidence = results.reduce((_sum, _r) => _sum + _r.confidence, 0) / results.length;

    // Calculate task type accuracy
    const taskTypeAccuracy = results.reduce((_correct, _result, _index) => {
      const expectedModel = this.expectedResults[this.sampleQueries[_index].id];
      return _correct + (_result.model === expectedModel ? 1 : 0);
    }, 0) / results.length;

    return {
      _threshold,
      modelDistribution,
      averageConfidence,
      taskTypeAccuracy
    };
  }

  private calculateScore(
    _result: CalibrationResult,
    _targetDistribution: Record<string, number>
  ): number {
    // Calculate distribution score (0-1)
    const distributionScore = 1 - Object.keys(_targetDistribution).reduce((_diff, _model) => {
      return _diff + Math.abs((_result.modelDistribution[_model] || 0) - _targetDistribution[_model]);
    }, 0) / 2;

    // Weight the components
    const weights = {
      distribution: 0.4,
      confidence: 0.3,
      accuracy: 0.3
    };

    return (
      distributionScore * weights.distribution +
      _result.averageConfidence * weights.confidence +
      _result.taskTypeAccuracy * weights.accuracy
    );
  }

  getOptimalThreshold(): number {
    return 0.63; // Default calibrated threshold
  }
}

export const routerCalibration = new RouterCalibration();