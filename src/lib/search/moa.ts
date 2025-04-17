import { SearchResult } from '../types';
import { AppError } from '../errors/AppError';

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

  async aggregate(searchResults: SearchResult[]): Promise<string> {
    try {
      // Filter out failed searches
      const validResults = searchResults.filter(
        (result): result is { success: true; content: string } => 
        'success' in result && result.success
      );

      if (validResults.length === 0) {
        throw new AppError('No valid search results to aggregate', 'SEARCH_ERROR');
      }

      // Extract content from results
      const contents = validResults.map(result => result.content);

      // Apply attention mechanism to each head
      const headResults = await Promise.all(
        Array(this.numHeads).fill(0).map(() => 
          this.processAttentionHead(contents)
        )
      );

      // Combine results from all heads
      return this.combineHeadResults(headResults);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to aggregate search results', 'SEARCH_ERROR', error);
    }
  }

  private async processAttentionHead(contents: string[]): Promise<string> {
    // Calculate attention scores for each content piece
    const attentionScores = contents.map(content => ({
      content,
      score: this.calculateAttentionScore(content)
    }));

    // Sort by attention score
    attentionScores.sort((a, b) => b.score - a.score);

    // Take top results based on attention scores
    const topResults = attentionScores.slice(0, 3);

    // Combine top results with weighted attention
    return this.combineWithAttention(topResults);
  }

  private calculateAttentionScore(content: string): number {
    // Implement attention scoring based on:
    // - Content length (normalized)
    // - Information density (keywords, entities)
    // - Relevance signals (dates, numbers, proper nouns)
    
    const lengthScore = Math.min(content.length / 1000, 1);
    const densityScore = this.calculateDensityScore(content);
    const relevanceScore = this.calculateRelevanceScore(content);

    return (lengthScore + densityScore + relevanceScore) / 3;
  }

  private calculateDensityScore(content: string): number {
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    
    // Calculate information density based on unique words ratio
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
      .map(r => this.truncateContent(r.content, Math.floor(this.maxTokens * r.score)))
      .join('\n\n');
  }

  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength - 3) + '...';
  }

  private combineHeadResults(headResults: string[]): string {
    // Remove duplicates and near-duplicates
    const uniqueResults = this.deduplicateResults(headResults);

    // Combine unique results
    return uniqueResults.join('\n\n');
  }

  private deduplicateResults(results: string[]): string[] {
    const unique = new Set<string>();
    const output: string[] = [];

    for (const result of results) {
      // Create a simplified version for comparison
      const simplified = result.toLowerCase().replace(/\s+/g, ' ').trim();
      
      // Check if we already have a similar result
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
    // Implement Jaccard similarity for quick string comparison
    const setA = new Set(a.split(' '));
    const setB = new Set(b.split(' '));
    
    const intersection = new Set(
      Array.from(setA).filter(x => setB.has(x))
    );
    
    const union = new Set([...setA, ...setB]);
    
    return intersection.size / union.size;
  }
}