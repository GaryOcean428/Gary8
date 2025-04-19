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

  async aggregate(_searchResults: SearchResult[]): Promise<string> {
    try {
      // Filter out failed searches
      const validResults = _searchResults.filter(
        (_result): _result is { success: true; content: string } => 
        'success' in _result && _result.success
      );

      if (validResults.length === 0) {
        throw new AppError('No valid search results to aggregate', 'SEARCH_ERROR');
      }

      // Extract content from results
      const contents = validResults.map(_result => _result.content);

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

  private async processAttentionHead(_contents: string[]): Promise<string> {
    // Calculate attention scores for each content piece
    const attentionScores = _contents.map(_content => ({
      _content,
      score: this.calculateAttentionScore(_content)
    }));

    // Sort by attention score
    attentionScores.sort((_a, _b) => _b.score - _a.score);

    // Take top results based on attention scores
    const topResults = attentionScores.slice(0, 3);

    // Combine top results with weighted attention
    return this.combineWithAttention(topResults);
  }

  private calculateAttentionScore(_content: string): number {
    // Implement attention scoring based on:
    // - Content length (normalized)
    // - Information density (keywords, entities)
    // - Relevance signals (dates, numbers, proper nouns)
    
    const lengthScore = Math.min(_content.length / 1000, 1);
    const densityScore = this.calculateDensityScore(_content);
    const relevanceScore = this.calculateRelevanceScore(_content);

    return (lengthScore + densityScore + relevanceScore) / 3;
  }

  private calculateDensityScore(_content: string): number {
    const words = _content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    
    // Calculate information density based on unique words ratio
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
      .map(_r => this.truncateContent(_r.content, Math.floor(this.maxTokens * _r.score)))
      .join('\n\n');
  }

  private truncateContent(_content: string, _maxLength: number): string {
    if (_content.length <= _maxLength) return _content;
    return _content.slice(0, _maxLength - 3) + '...';
  }

  private combineHeadResults(_headResults: string[]): string {
    // Remove duplicates and near-duplicates
    const uniqueResults = this.deduplicateResults(_headResults);

    // Combine unique results
    return uniqueResults.join('\n\n');
  }

  private deduplicateResults(_results: string[]): string[] {
    const unique = new Set<string>();
    const output: string[] = [];

    for (const result of _results) {
      // Create a simplified version for comparison
      const simplified = result.toLowerCase().replace(/\s+/g, ' ').trim();
      
      // Check if we already have a similar result
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
    // Implement Jaccard similarity for quick string comparison
    const setA = new Set(_a.split(' '));
    const setB = new Set(_b.split(' '));
    
    const intersection = new Set(
      Array.from(setA).filter(_x => setB.has(_x))
    );
    
    const union = new Set([...setA, ...setB]);
    
    return intersection.size / union.size;
  }
}