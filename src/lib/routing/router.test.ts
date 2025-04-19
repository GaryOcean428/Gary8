import { describe, test, expect, beforeEach } from 'vitest';
import { ModelRouter } from './model-router';
import { Message } from '../types';
import { webcrypto } from 'node:crypto';

// Polyfill crypto for Node.js environment
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

describe('ModelRouter Calibration Tests', () => {
  let router: ModelRouter;

  beforeEach(() => {
    router = new ModelRouter();
  });

  // Test model selection for different task types
  describe('Task-Based Routing', () => {
    test('routes coding tasks to Claude 3.7', async () => {
      const queries = [
        'Write a TypeScript function to implement a binary search tree',
        'Debug this React component that has a memory leak',
        'Help me optimize this database query for better performance',
        'Implement a distributed caching system in Go'
      ];

      for (const query of queries) {
        const result = await router.route(query, []);
        expect(result.model).toBe('claude-3-7-sonnet-20250219');
        expect(result.responseStrategy).toBe('code_generation');
        expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      }
    });

    test('routes creative tasks to GPT-4.5', async () => {
      const queries = [
        'Write a creative story about time travel',
        'Generate ideas for a new mobile app',
        'Design an innovative user interface',
        'Create a marketing campaign concept'
      ];

      for (const query of queries) {
        const result = await router.route(query, []);
        expect(result.model).toBe('gpt-4.5-preview');
        expect(result.responseStrategy).toBe('creative_generation');
        expect(result.temperature).toBeGreaterThanOrEqual(0.7);
      }
    });

    test('routes search tasks to Perplexity', async () => {
      const queries = [
        'What are the latest developments in quantum computing?',
        'Find information about climate change impacts',
        'Search for recent AI breakthroughs',
        'Research market trends in renewable energy'
      ];

      for (const query of queries) {
        const result = await router.route(query, []);
        expect(result.model).toBe('sonar-reasoning-pro');
        expect(result.responseStrategy).toBe('search_and_synthesize');
      }
    });
  });

  // Test complexity-based routing
  describe('Complexity-Based Routing', () => {
    test('routes based on query complexity', async () => {
      const testCases = [
        {
          query: 'Hi there!',
          expectedModel: 'llama-3.3-70b-versatile',
          expectedConfidence: 0.8
        },
        {
          query: 'Explain how databases work',
          expectedModel: 'claude-3.5-haiku-latest',
          expectedConfidence: 0.85
        },
        {
          query: 'Design a scalable microservices architecture for a high-traffic e-commerce platform, considering performance, reliability, and security aspects',
          expectedModel: 'claude-3-7-sonnet-20250219',
          expectedConfidence: 0.9
        }
      ];

      for (const { query, expectedModel, expectedConfidence } of testCases) {
        const result = await router.route(query, []);
        expect(result.model).toBe(expectedModel);
        expect(result.confidence).toBeGreaterThanOrEqual(expectedConfidence);
      }
    });

    test('considers context length in routing decisions', async () => {
      const query = 'Continue with the previous discussion';
      const history: Message[] = Array(20).fill({
        id: '1',
        role: 'user',
        content: 'Previous discussion about complex technical topics...',
        timestamp: Date.now()
      });

      const result = await router.route(query, history);
      expect(result.maxTokens).toBeGreaterThanOrEqual(8192);
      expect(result.model).toBe('claude-3-7-sonnet-20250219');
    });
  });

  // Test specialized scenarios
  describe('Specialized Scenarios', () => {
    test('handles multi-step reasoning tasks', async () => {
      const query = 'First analyze the system requirements, then design the architecture, and finally propose an implementation plan with specific technologies';
      const result = await router.route(query, []);
      expect(result.model).toBe('claude-3-7-sonnet-20250219');
      expect(result.responseStrategy).toBe('chain_of_thought');
    });

    test('handles creative brainstorming', async () => {
      const query = 'Generate innovative ideas for solving urban transportation problems';
      const result = await router.route(query, []);
      expect(result.model).toBe('gpt-4.5-preview');
      expect(result.temperature).toBeGreaterThan(0.7);
    });

    test('handles technical analysis', async () => {
      const query = 'Compare different machine learning algorithms for time series prediction';
      const result = await router.route(query, []);
      expect(result.model).toBe('claude-3-7-sonnet-20250219');
      expect(result.responseStrategy).toBe('comparative_analysis');
    });
  });

  // Test edge cases
  describe('Edge Cases', () => {
    test('handles empty history', async () => {
      const result = await router.route('Hello', []);
      expect(result.model).toBe('llama-3.3-70b-versatile');
    });

    test('handles very long queries', async () => {
      const longQuery = 'a'.repeat(10000);
      const result = await router.route(longQuery, []);
      expect(result.maxTokens).toBeGreaterThanOrEqual(8192);
    });

    test('handles mixed task types', async () => {
      const query = 'Write code to analyze data and create a visualization';
      const result = await router.route(query, []);
      expect(result.model).toBe('claude-3-7-sonnet-20250219');
    });
  });

  // Test calibration thresholds
  describe('Calibration Thresholds', () => {
    test('maintains expected model distribution', async () => {
      const queries = [
        'Hi',
        'What is the weather?',
        'Tell me a joke',
        'How do I center a div?',
        'What is recursion?',
        'Write a sorting algorithm',
        'Design a database schema',
        'Explain quantum computing'
      ];

      const results = await Promise.all(
        queries.map(_query => router.route(_query, []))
      );

      const modelCounts = results.reduce((_acc, _result) => {
        _acc[_result.model] = (_acc[_result.model] || 0) + 1;
        return _acc;
      }, {} as Record<string, number>);

      // Verify distribution matches calibration targets
      const totalQueries = queries.length;
      expect(modelCounts['llama-3.3-70b-versatile'] || 0).toBeLessThanOrEqual(totalQueries * 0.3);
      expect(modelCounts['claude-3-7-sonnet-20250219'] || 0).toBeGreaterThanOrEqual(totalQueries * 0.2);
      expect(modelCounts['gpt-4.5-preview'] || 0).toBeLessThanOrEqual(totalQueries * 0.15);
    });

    test('respects complexity threshold', async () => {
      const threshold = 0.63; // Calibrated threshold
      const query = 'Design and implement a distributed system architecture for real-time data processing with fault tolerance, scalability considerations, and performance optimization strategies. Include specific examples of technologies and patterns that would be most appropriate for different scaling requirements.';
      
      const complexity = router['assessComplexity'](query);
      expect(complexity).toBeGreaterThan(threshold);
      
      const result = await router.route(query, []);
      expect(result.model).toBe('claude-3-7-sonnet-20250219');
    });
  });

  // Test response strategies
  describe('Response Strategies', () => {
    test('selects appropriate response strategies', async () => {
      const testCases = [
        {
          query: 'How do neural networks work?',
          expectedStrategy: 'chain_of_thought'
        },
        {
          query: 'What is TypeScript?',
          expectedStrategy: 'direct_answer'
        },
        {
          query: 'Compare REST and GraphQL',
          expectedStrategy: 'comparative_analysis'
        },
        {
          query: 'Create a story about space exploration',
          expectedStrategy: 'creative_generation'
        }
      ];

      for (const { query, expectedStrategy } of testCases) {
        const result = await router.route(query, []);
        expect(result.responseStrategy).toBe(expectedStrategy);
      }
    });
  });
});