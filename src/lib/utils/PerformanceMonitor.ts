/**
 * Performance monitoring utility for tracking rendering and API performance
 */
export class PerformanceMonitor {
  private measures: Record<string, {
    markName: string;
    metadata?: Record<string, unknown>;
    startTime: number;
  }> = {};
  
  private static instance: PerformanceMonitor;
  
  // Memory metrics over time for trend analysis
  private memoryHistory: Array<{
    timestamp: number;
    metrics: unknown;
  }> = [];
  
  // Performance metrics storage
  private metrics: Record<string, number[]> = {
    messageProcessingTime: [],
    renderTime: [],
    apiLatency: [],
    memoryUsage: []
  };
  
  private constructor() {
    // Start periodic memory sampling
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      setInterval(() => this.sampleMemory(), 10000); // Sample every 10s
    }
  }
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  /**
   * Start measuring a performance metric
   * @param _name Measurement name
   * @param _metadata Additional context data
   */
  startMeasure(_name: string, _metadata: Record<string, unknown> = {}): void {
    if (typeof performance === 'undefined') return;
    
    const markName = `${_name}_start_${Date.now()}`;
    performance.mark(markName);
    this.measures[_name] = { markName, _metadata, startTime: Date.now() };
  }
  
  /**
   * End a performance measurement
   * @param _name Measurement name
   */
  endMeasure(_name: string): void {
    if (typeof performance === 'undefined' || !this.measures[_name]) return;
    
    const { markName, metadata, startTime } = this.measures[_name];
    const endMarkName = `${_name}_end_${Date.now()}`;
    performance.mark(endMarkName);
    
    try {
      performance.measure(_name, markName, endMarkName);
      
      const duration = Date.now() - startTime;
      
      // Store the metric
      if (_name === 'message_processing') {
        this.metrics.messageProcessingTime.push(duration);
        // Keep only last 20 measurements
        if (this.metrics.messageProcessingTime.length > 20) {
          this.metrics.messageProcessingTime.shift();
        }
      } else if (_name === 'api_request') {
        this.metrics.apiLatency.push(duration);
        if (this.metrics.apiLatency.length > 20) {
          this.metrics.apiLatency.shift();
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.info(
          `%c Performance: ${_name} took ${duration}ms`, 
          'color: #3b82f6; font-weight: bold;', 
          metadata
        );
      }
      
      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${_name} took ${duration}ms`, metadata);
      }
    } catch (e) {
      // Some browsers have limitations with performance marks
    }
    
    delete this.measures[_name];
  }
  
  /**
   * Record streaming metrics
   */
  measureStreamingPerformance(_metrics: StreamingMetrics): void {
    if (typeof performance === 'undefined') return;
    
    // Record metrics
    if (process.env.NODE_ENV === 'development') {
      console.debug('Streaming metrics', _metrics);
    }
    
    // Track long-running streams that might indicate issues
    if (_metrics.streamDuration > 10000 && _metrics.contentSize < 500) {
      console.warn('Potentially stalled stream detected', _metrics);
    }
  }
  
  /**
   * Sample memory usage for trend analysis
   */
  private sampleMemory(): void {
    if (typeof performance === 'undefined' || !(performance as any).memory) return;
    
    const memory = (performance as any).memory;
    const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    
    this.metrics.memoryUsage.push(memoryUsage);
    if (this.metrics.memoryUsage.length > 60) { // Keep 10 minutes of data at 10s intervals
      this.metrics.memoryUsage.shift();
    }
    
    this.memoryHistory.push({
      timestamp: Date.now(),
      metrics: {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        domNodes: document.querySelectorAll('*').length
      }
    });
    
    // Keep only last 30 samples (5 minutes)
    if (this.memoryHistory.length > 30) {
      this.memoryHistory.shift();
    }
    
    // Check for memory growth trend
    this.checkMemoryTrend();
  }
  
  /**
   * Check for concerning memory usage patterns
   */
  private checkMemoryTrend(): void {
    if (this.memoryHistory.length < 5) return;
    
    const recentSamples = this.memoryHistory.slice(-5);
    const oldestMetrics = recentSamples[0].metrics;
    const newestMetrics = recentSamples[recentSamples.length - 1].metrics;
    
    const growthRate = (newestMetrics.usedJSHeapSize - oldestMetrics.usedJSHeapSize) / 
                      oldestMetrics.usedJSHeapSize;
    
    // Alert if memory has grown by more than 20% in the last 5 samples
    if (growthRate > 0.2) {
      console.warn('Memory usage growing quickly', {
        growthRate: `${(growthRate * 100).toFixed(1)}%`,
        timeSpan: `${(recentSamples[recentSamples.length-1].timestamp - recentSamples[0].timestamp) / 1000}s`,
        currentUsage: `${(newestMetrics.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`
      });
    }
  }
  
  /**
   * Get performance statistics
   */
  getStats() {
    return {
      messageProcessing: {
        avg: this.getAverage(this.metrics.messageProcessingTime),
        min: this.getMin(this.metrics.messageProcessingTime),
        max: this.getMax(this.metrics.messageProcessingTime)
      },
      apiLatency: {
        avg: this.getAverage(this.metrics.apiLatency),
        min: this.getMin(this.metrics.apiLatency),
        max: this.getMax(this.metrics.apiLatency)
      },
      memoryUsage: {
        current: this.metrics.memoryUsage.length > 0 ? this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1] : 0,
        trend: this.calculateTrend(this.metrics.memoryUsage)
      }
    };
  }
  
  private getAverage(_values: number[]): number {
    if (_values.length === 0) return 0;
    return _values.reduce((_sum, _val) => _sum + _val, 0) / _values.length;
  }
  
  private getMin(_values: number[]): number {
    if (_values.length === 0) return 0;
    return Math.min(..._values);
  }
  
  private getMax(_values: number[]): number {
    if (_values.length === 0) return 0;
    return Math.max(..._values);
  }
  
  private calculateTrend(_values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (_values.length < 5) return 'stable';
    
    const recentValues = _values.slice(-5);
    const firstValue = recentValues[0];
    const lastValue = recentValues[recentValues.length - 1];
    
    const changePct = (lastValue - firstValue) / firstValue;
    
    if (changePct > 0.1) return 'increasing';
    if (changePct < -0.1) return 'decreasing';
    return 'stable';
  }
}

/**
 * Streaming performance metrics interface
 */
export interface StreamingMetrics {
  streamDuration: number;
  contentSize: number;
  chunkCount: number;
  avgChunkSize: number;
  windowWidth: number;
  domNodes?: number;
  memoryUsage?: unknown;
}

export const performanceMonitor = PerformanceMonitor.getInstance();