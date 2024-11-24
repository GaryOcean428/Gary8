import { thoughtLogger } from '../logging/thought-logger';
import type { Message } from '../types';

interface AgentResult {
  agentId: string;
  content: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export class MemoryAggregator {
  private static instance: MemoryAggregator;
  private attentionHeads = 4;

  private constructor() {}

  static getInstance(): MemoryAggregator {
    if (!MemoryAggregator.instance) {
      MemoryAggregator.instance = new MemoryAggregator();
    }
    return MemoryAggregator.instance;
  }

  async aggregateResults(results: AgentResult[]): Promise<string> {
    thoughtLogger.log('plan', 'Starting MoA-style result aggregation', {
      numResults: results.length,
      agents: results.map(r => r.agentId)
    });

    try {
      // Apply multi-head attention mechanism
      const headResults = await Promise.all(
        Array(this.attentionHeads).fill(0).map(() => 
          this.processAttentionHead(results)
        )
      );

      // Combine results from all heads
      const aggregated = this.combineHeadResults(headResults);

      thoughtLogger.log('success', 'Results aggregated successfully', {
        numHeads: this.attentionHeads,
        resultLength: aggregated.length
      });

      return aggregated;
    } catch (error) {
      thoughtLogger.log('error', 'Result aggregation failed', { error });
      throw error;
    }
  }

  private async processAttentionHead(results: AgentResult[]): Promise<string> {
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

  private calculateAttentionScore(result: AgentResult): number {
    // Score based on:
    // - Agent confidence
    // - Content relevance signals
    // - Information density
    
    const confidenceScore = result.confidence;
    const densityScore = this.calculateDensityScore(result.content);
    const relevanceScore = this.calculateRelevanceScore(result.content);

    return (confidenceScore + densityScore + relevanceScore) / 3;
  }

  private calculateDensityScore(content: string): number {
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    return uniqueWords.size / words.length;
  }

  private calculateRelevanceScore(content: string): number {
    // Count relevance signals:
    // - Dates (YYYY-MM-DD, Month DD, YYYY, etc.)
    // - Numbers and statistics
    // - Proper nouns (capitalized words not at start of sentence)
    
    const dateMatches = content.match(/\b\d{4}[-/]\d{2}[-/]\d{2}\b/g)?.length || 0;
    const numberMatches = content.match(/\b\d+([.,]\d+)?\b/g)?.length || 0;
    const properNouns = content.match(/(?<!^|\.\s+)\b[A-Z][a-z]+\b/g)?.length || 0;

    const totalSignals = dateMatches + numberMatches + properNouns;
    return Math.min(totalSignals / 10, 1);
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
      .map(r => this.truncateContent(r.content, Math.floor(2048 * r.score)))
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