import { StreamBuffer } from './StreamBuffer';

/**
 * ContentManager - Manages streaming content with efficient updates
 * and memory optimization, including progressive rendering
 */
export class ContentManager {
  private buffer: StreamBuffer;
  private modelInfo: string | null = null;
  private onUpdate: (content: string) => void;
  private updateTimeoutId: number | null = null;
  private lastUpdateTime = 0;
  private pauseStatus = false;

  /**
   * Create a new ContentManager instance
   * @param onUpdate Callback to update the UI when content changes
   * @param updateFrequencyMs How often to batch updates (in ms)
   */
  constructor(onUpdate: (content: string) => void, private updateFrequencyMs: number = 50) {
    this.buffer = new StreamBuffer();
    this.onUpdate = onUpdate;
    this.lastUpdateTime = Date.now();
  }

  /**
   * Append new content to the stream
   * @param _content New content chunk
   */
  appendContent(_content: string): void {
    if (this.pauseStatus) return;
    
    this.buffer.append(_content);
    
    const now = Date.now();
    if (now - this.lastUpdateTime >= this.updateFrequencyMs) {
      this.triggerUpdate();
    } else if (this.updateTimeoutId === null) {
      // Schedule next update
      this.updateTimeoutId = window.setTimeout(() => {
        this.triggerUpdate();
      }, this.updateFrequencyMs);
    }
  }

  /**
   * Set model information
   * @param _model Model name/info
   */
  setModelInfo(_model: string): void {
    this.modelInfo = _model;
  }

  /**
   * Get full content
   */
  getContent(): string {
    return this.buffer.getContent();
  }

  /**
   * Get model info
   */
  getModelInfo(): string | null {
    return this.modelInfo;
  }

  /**
   * Pause content updates
   */
  pause(): void {
    this.pauseStatus = true;
  }

  /**
   * Resume content updates
   */
  resume(): void {
    this.pauseStatus = false;
    this.triggerUpdate();
  }

  /**
   * Check if content updates are paused
   */
  isPaused(): boolean {
    return this.pauseStatus;
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats() {
    return this.buffer.getMemoryStats();
  }

  /**
   * Reset the content manager
   */
  reset(): void {
    this.buffer.clear();
    this.modelInfo = null;
    this.pauseStatus = false;
    this.lastUpdateTime = 0;
    
    if (this.updateTimeoutId !== null) {
      clearTimeout(this.updateTimeoutId);
      this.updateTimeoutId = null;
    }
  }

  /**
   * Trigger content update
   */
  private triggerUpdate(): void {
    if (this.pauseStatus) return;
    
    this.lastUpdateTime = Date.now();
    
    if (this.updateTimeoutId !== null) {
      clearTimeout(this.updateTimeoutId);
      this.updateTimeoutId = null;
    }
    
    // Notify listener with latest content
    this.onUpdate(this.buffer.getContent());
  }
}