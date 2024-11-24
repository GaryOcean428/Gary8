import { thoughtLogger } from '../logging/thought-logger';
import { SearchResult } from '../types/search';

interface MoAConfig {
  numHeads?: number;
  temperature?: number;
  maxTokens?: number;
}

export class MoASearchAggregator {
  private numHeads: number;
  private temperature: number;
  private maxTokens: number;

  constructor(config: MoAConfig = {}) {
    this.numHeads = config.numHeads || 4;
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 1024;
  }

  async aggregate(results: SearchResult[]): Promise<string> {
    thoughtLogger.log('plan', 'Starting MoA-style result aggregation', {
      numResults: results.length,
      sources: results.map(r => r.metadata?.source)
    });

    try {
      // Apply multi-head attention mechanism
      const headResults = await Promise.all(
        Array(this.numHeads).fill(0).map(() => 
          this.processAttentionHead(results)
        )
      );

      // Combine results from all heads
      const aggregated = this.combineHeadResults(headResults);

      thoughtLogger.log('success', 'Results aggregated successfully', {
        numHeads: this.numHeads,
        resultLength: aggregated.length
      });

      return aggregated;
    } catch (error) {
      thoughtLogger.log('error', 'Result aggregation failed', { error });
      throw error;
    }
  }

  private async processAttentionHead(results: SearchResult[]): Promise<string> {
    // Calculate attention scores
    const scores = results.map(result => ({
      content: result.content,
      score: this.calculateAttentionScore(result)
    }));

    // Sort by attention score
    scores.sort((a, b) => b.score - a.score);

    // Take top results
    const topResults = scores.slice(0, 3);

    return this.combineWithAttention(topResults);
  }

  private calculateAttentionScore(result: SearchResult): number {
    // Score based on multiple factors
    const sourceScore = this.getSourceScore(result.metadata?.source);
    const densityScore = this.calculateDensityScore(result.content);
    const relevanceScore = this.calculateRelevanceScore(result.content);
    const freshnessScore = this.calculateFreshnessScore(result.metadata?.timestamp);

    return (sourceScore + densityScore + relevanceScore + freshnessScore) / 4;
  }

  private getSourceScore(source?: string): number {
    const sourceScores: Record<string, number> = {
      perplexity: 0.95,
      tavily: 0.9,
      google: 0.85,
      serp: 0.8
    };
    return source ? sourceScores[source] || 0.7 : 0.7;
  }

  private calculateDensityScore(content: string): number {
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    return uniqueWords.size / words.length;
  }

  private calculateRelevanceScore(content: string): number {
    // Count relevance signals
    const dateMatches = content.match(/\b\d{4}[-/]\d{2}[-/]\d{2}\b/g)?.length || 0;
    const numberMatches = content.match(/\b\d+([.,]\d+)?\b/g)?.length || 0;
    const properNouns = content.match(/(?<!^|\.\s+)\b[A-Z][a-z]+\b/g)?.length || 0;

    const totalSignals = dateMatches + numberMatches + properNouns;
    return Math.min(totalSignals / 10, 1);
  }

  private calculateFreshnessScore(timestamp?: string): number {
    if (!timestamp) return 0.5;
    
    const age = Date.now() - new Date(timestamp).getTime();
    const hourAge = age / (1000 * 60 * 60);
    
    // Exponential decay based on age
    return Math.exp(-hourAge / 24);
  }

  private combineWithAttention(
    results: Array<{ content: string; score: number }>
  ): string {
    // Normalize scores
    const total = results.reduce((sum, r) => sum + r.score, 0);
    const normalized = results.map(r => ({
      ...r,
      score: r.score / total
    }));

    // Combine content with weighted attention
    return normalized
      .map(r => this.truncateContent(r.content, Math.floor(this.maxTokens * r.score)))
      .join('\n\n');
  }

  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength - 3) + '...';
  }

  private combineHeadResults(headResults: string[]): string {
    // Remove duplicates and near-duplicates
    const unique = this.deduplicateResults(headResults);
    return unique.join('\n\n');
  }

  private deduplicateResults(results: string[]): string[] {
    const unique = new Set<string>();
    const output: string[] = [];

    for (const result of results) {
      const simplified = result.toLowerCase().replace(/\s+/g, ' ').trim();
      
      const isDuplicate = Array.from(unique).some(existing => 
        this.calculateSimilarity(simplified, existing) > 0.8
      );

      if (!isDuplicate) {
        unique.add(simplified);
        output.push(result);
      }
    }

    return output;
  }

  private calculateSimilarity(a: string, b: string): number {
    const setA = new Set(a.split(' '));
    const setB = new Set(b.split(' '));
    
    const intersection = new Set(
      Array.from(setA).filter(x => setB.has(x))
    );
    
    const union = new Set([...setA, ...setB]);
    
    return intersection.size / union.size;
  }
}