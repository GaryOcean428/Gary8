/**
 * StreamBuffer - Efficient management of streamed content chunks
 * Optimizes memory usage by storing fixed-size chunks instead of a continuously growing string
 */
export class StreamBuffer {
  private chunks: string[] = [];
  private maxChunkSize: number;
  private totalLength: number = 0;
  private lastUpdate: number = 0;
  
  /**
   * Creates a new StreamBuffer
   * @param maxChunkSize Maximum size of each chunk (default: 5000 characters)
   */
  constructor(maxChunkSize: number = 5000) {
    this.maxChunkSize = maxChunkSize;
    this.lastUpdate = Date.now();
  }

  /**
   * Appends content to the buffer
   * @param _content Content to append
   */
  append(_content: string): void {
    // Update metrics
    this.totalLength += _content.length;
    this.lastUpdate = Date.now();
    
    // Instead of one growing string, manage array of fixed-size chunks
    const lastChunk = this.chunks[this.chunks.length - 1];
    
    if (!lastChunk || lastChunk.length >= this.maxChunkSize) {
      this.chunks.push(_content);
    } else {
      this.chunks[this.chunks.length - 1] += _content;
    }
  }
  
  /**
   * Gets the complete buffer content
   * @returns The full content
   */
  getContent(): string {
    return this.chunks.join('');
  }
  
  /**
   * Gets a specific range of content
   * Optimizes for showing only visible portions in virtualized displays
   * @param _start Start position
   * @param _end End position
   * @returns The content in the specified range
   */
  getRange(_start: number, _end: number): string {
    if (_start < 0) _start = 0;
    if (_end > this.totalLength) _end = this.totalLength;
    if (_start >= _end) return '';
    
    let result = '';
    let position = 0;
    
    // Only process chunks that might contain requested range
    for (const chunk of this.chunks) {
      const chunkStart = position;
      const chunkEnd = position + chunk.length;
      
      // Check if this chunk overlaps with requested range
      if (chunkEnd > _start && chunkStart < _end) {
        const overlapStart = Math.max(_start - chunkStart, 0);
        const overlapEnd = Math.min(_end - chunkStart, chunk.length);
        result += chunk.substring(overlapStart, overlapEnd);
      }
      
      position += chunk.length;
      if (position >= _end) break;
    }
    
    return result;
  }
  
  /**
   * Gets the total length of content
   */
  getLength(): number {
    return this.totalLength;
  }
  
  /**
   * Gets time since last update
   */
  getTimeSinceUpdate(): number {
    return Date.now() - this.lastUpdate;
  }
  
  /**
   * Clear the buffer
   */
  clear(): void {
    this.chunks = [];
    this.totalLength = 0;
  }
  
  /**
   * Get memory stats for debugging/monitoring
   */
  getMemoryStats(): { chunkCount: number; totalLength: number; averageChunkSize: number } {
    return {
      chunkCount: this.chunks.length,
      totalLength: this.totalLength,
      averageChunkSize: this.chunks.length ? this.totalLength / this.chunks.length : 0
    };
  }
}