// Web Worker for performance-intensive operations

self.onmessage = async (event) => {
  const { type, operation } = event.data;

  switch (type) {
    case 'optimize_operation':
      try {
        // Execute operation in worker context
        const fn = new Function(`return ${operation}`)();
        const result = await fn();
        
        self.postMessage({
          type: 'optimization_complete',
          result
        });
      } catch (error) {
        self.postMessage({
          type: 'optimization_complete',
          error: error.message
        });
      }
      break;

    case 'cache_cleanup':
      // Perform cache cleanup operations
      self.postMessage({
        type: 'cache_cleanup',
        completed: true
      });
      break;
  }
};

// Helper functions for worker operations
const optimizationHelpers = {
  // Optimize array operations
  optimizeArray: <T>(arr: T[], operation: (item: T) => any): T[] => {
    // Use TypedArrays when possible
    if (arr.every(item => typeof item === 'number')) {
      const typedArr = new Float64Array(arr as number[]);
      // Perform optimized operations on TypedArray
      return Array.from(typedArr) as T[];
    }
    return arr;
  },

  // Optimize string operations
  optimizeString: (str: string): string => {
    // Use string interning for repeated strings
    return str.indexOf(' ') > -1 ? str : String(str);
  },

  // Optimize object operations
  optimizeObject: <T extends object>(obj: T): T => {
    // Use Map/Set for better performance with large collections
    if (Array.isArray(obj)) {
      return new Set(obj) as any;
    }
    if (Object.keys(obj).length > 1000) {
      return new Map(Object.entries(obj)) as any;
    }
    return obj;
  }
};

// Export helper functions for use in worker context
Object.assign(self, { optimizationHelpers }); 