import { describe, it, expect, beforeEach } from 'vitest';
import { SearchRouter } from '../../../lib/routing/search-router';

describe('SearchRouter', () => {
  let searchRouter: SearchRouter;

  beforeEach(() => {
    searchRouter = new SearchRouter();
  });

  describe('search provider routing', () => {
    it('routes image search queries correctly', async () => {
      const imageQueries = [
        'Show me pictures of the Eiffel Tower',
        'What does a blue whale look like?',
        'Find images of modern architecture',
        'Show visual examples of Renaissance art'
      ];

      for (const query of imageQueries) {
        const result = await searchRouter.route(query, []);
        expect(result.provider).toBe('bing');
        expect(result.includeImages).toBe(true);
        expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      }
    });

    it('routes news queries to appropriate provider', async () => {
      const newsQueries = [
        'What are the latest developments in AI research?',
        'Recent news about climate change',
        'Yesterday\'s top headlines',
        'Latest updates on the Mars rover mission'
      ];

      for (const query of newsQueries) {
        const result = await searchRouter.route(query, []);
        expect(result.provider).toBe('perplexity');
        expect(result.recentOnly).toBe(true);
        expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      }
    });

    it('routes academic queries correctly', async () => {
      const academicQueries = [
        'Find research papers on quantum computing',
        'Recent studies on climate change impacts',
        'Academic publications about machine learning',
        'Scientific papers on renewable energy'
      ];

      for (const query of academicQueries) {
        const result = await searchRouter.route(query, []);
        expect(result.provider).toBe('tavily');
        expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      }
    });

    it('routes local search queries correctly', async () => {
      const localQueries = [
        'Restaurants near me',
        'Coffee shops in my area',
        'Local hiking trails',
        'Events nearby this weekend'
      ];

      for (const query of localQueries) {
        const result = await searchRouter.route(query, []);
        expect(result.provider).toBe('serp');
        expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      }
    });

    it('routes entity queries correctly', async () => {
      const entityQueries = [
        'Who is Marie Curie?',
        'What is Microsoft?',
        'Information about Tesla Inc',
        'Who was Albert Einstein?'
      ];

      for (const query of entityQueries) {
        const result = await searchRouter.route(query, []);
        expect(result.provider).toBe('bing');
        expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      }
    });

    it('uses default provider for general queries', async () => {
      const generalQueries = [
        'How does photosynthesis work?',
        'What is the capital of France?',
        'Explain quantum mechanics',
        'Recipe for chocolate cake'
      ];

      for (const query of generalQueries) {
        const result = await searchRouter.route(query, []);
        expect(result.provider).toBe('perplexity');
        expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      }
    });
  });

  describe('search need assessment', () => {
    it('returns low confidence for non-search queries', async () => {
      const nonSearchQueries = [
        'Hello there',
        'Thank you',
        'That\'s interesting',
        'I agree with you'
      ];

      for (const query of nonSearchQueries) {
        const result = await searchRouter.route(query, []);
        expect(result.confidence).toBeLessThan(0.7);
      }
    });

    it('handles questions with high confidence', async () => {
      const questionQueries = [
        'What is the speed of light?',
        'Who invented the telephone?',
        'When did World War II end?',
        'Where is the Great Barrier Reef located?'
      ];

      for (const query of questionQueries) {
        const result = await searchRouter.route(query, []);
        expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      }
    });
  });

  describe('configuration options', () => {
    it('includes correct configuration options for each provider', async () => {
      // Test Bing image search configuration
      const imageQuery = 'Show pictures of mountains';
      const imageResult = await searchRouter.route(imageQuery, []);
      expect(imageResult.provider).toBe('bing');
      expect(imageResult.includeImages).toBe(true);

      // Test Perplexity news search configuration
      const newsQuery = 'Latest news on space exploration';
      const newsResult = await searchRouter.route(newsQuery, []);
      expect(newsResult.provider).toBe('perplexity');
      expect(newsResult.model).toBe('sonar-reasoning-pro');
      expect(newsResult.recentOnly).toBe(true);

      // Test Tavily academic search configuration
      const academicQuery = 'Research papers on machine learning';
      const academicResult = await searchRouter.route(academicQuery, []);
      expect(academicResult.provider).toBe('tavily');
      expect(academicResult.maxResults).toBeGreaterThan(5);
    });
  });

  describe('explanation and confidence', () => {
    it('provides meaningful routing explanations', async () => {
      const query = 'Show me recent images of Mars rover';
      const result = await searchRouter.route(query, []);
      
      expect(result.routingExplanation).toBeDefined();
      expect(result.routingExplanation.length).toBeGreaterThan(10);
      expect(typeof result.routingExplanation).toBe('string');
    });

    it('assigns appropriate confidence levels', async () => {
      const highConfidenceQuery = 'Latest news on technology';
      const highResult = await searchRouter.route(highConfidenceQuery, []);
      expect(highResult.confidence).toBeGreaterThanOrEqual(0.8);

      const lowConfidenceQuery = 'Hello';
      const lowResult = await searchRouter.route(lowConfidenceQuery, []);
      expect(lowResult.confidence).toBeLessThanOrEqual(0.7);
    });
  });
});