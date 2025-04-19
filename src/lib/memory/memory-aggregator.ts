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

  async aggregateResults(_results: AgentResult[]): Promise<string> {
    thoughtLogger.log('plan', 'Starting MoA-style result aggregation', {
      numResults: _results.length,
      agents: _results.map(_r => _r.agentId)
    });

    try {
      // Apply multi-head attention mechanism
      const headResults = await Promise.all(
        Array(this.attentionHeads).fill(0).map(() => 
          this.processAttentionHead(_results)
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

  private async processAttentionHead(_results: AgentResult[]): Promise<string> {
    // Calculate attention scores
    const scores = _results.map(_result => ({
      content: _result.content,
      score: this.calculateAttentionScore(_result)
    }));

    // Sort by attention score
    scores.sort((_a, _b) => _b.score - _a.score);

    // Take top results
    const topResults = scores.slice(0, 3);

    return this.combineWithAttention(topResults);
  }

  private calculateAttentionScore(_result: AgentResult): number {
    // Score based on:
    // - Agent confidence
    // - Content relevance signals
    // - Information density
    
    const confidenceScore = _result.confidence;
    const densityScore = this.calculateDensityScore(_result.content);
    const relevanceScore = this.calculateRelevanceScore(_result.content);

    return (confidenceScore + densityScore + relevanceScore) / 3;
  }

  private calculateDensityScore(_content: string): number {
    const words = _content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    return uniqueWords.size / words.length;
  }

  private calculateRelevanceScore(_content: string): number {
    // Count relevance signals:
    // - Dates (YYYY-MM-DD, Month DD, YYYY, etc.)
    // - Numbers and statistics
    // - Proper nouns (capitalized words not at start of sentence)
    
    const dateMatches = _content.match(/\b\d{4}[-/]\d{2}[-/]\d{2}\b/g)?.length || 0;
    const numberMatches = _content.match(/\b\d+([.,]\d+)?\b/g)?.length || 0;
    const properNouns = _content.match(/(?<!^|\.\s+)\b[A-Z][a-z]+\b/g)?.length || 0;

    const totalSignals = dateMatches + numberMatches + properNouns;
    return Math.min(totalSignals / 10, 1);
  }

  private combineWithAttention(
    _results: Array<{ content: string; score: number }>
  ): string {
    // Normalize scores
    const total = _results.reduce((_sum, _r) => _sum + _r.score, 0);
    const normalized = _results.map(_r => ({
      ..._r,
      score: _r.score / total
    }));

    // Combine content with weighted attention
    return normalized
      .map(_r => this.truncateContent(_r.content, Math.floor(2048 * _r.score)))
      .join('\n\n');
  }

  private truncateContent(_content: string, _maxLength: number): string {
    if (_content.length <= _maxLength) return _content;
    return _content.slice(0, _maxLength - 3) + '...';
  }

  private combineHeadResults(_headResults: string[]): string {
    // Remove duplicates and near-duplicates
    const unique = this.deduplicateResults(_headResults);
    return unique.join('\n\n');
  }

  private deduplicateResults(_results: string[]): string[] {
    const unique = new Set<string>();
    const output: string[] = [];

    for (const result of _results) {
      const simplified = result.toLowerCase().replace(/\s+/g, ' ').trim();
      
      const isDuplicate = Array.from(unique).some(_existing => 
        this.calculateSimilarity(simplified, _existing) > 0.8
      );

      if (!isDuplicate) {
        unique.add(simplified);
        output.push(result);
      }
    }

    return output;
  }

  private calculateSimilarity(_a: string, _b: string): number {
    const setA = new Set(_a.split(' '));
    const setB = new Set(_b.split(' '));
    
    const intersection = new Set(
      Array.from(setA).filter(_x => setB.has(_x))
    );
    
    const union = new Set([...setA, ...setB]);
    
    return intersection.size / union.size;
  }
}