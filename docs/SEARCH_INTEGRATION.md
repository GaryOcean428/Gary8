# Search Integration Documentation

## Overview

The search integration provides a robust, multi-provider search system with fallback mechanisms, result aggregation, and RAG processing capabilities.

## Architecture

### Components

1. **Search Service**
   - Provider management
   - Request routing
   - Result aggregation
   - Error handling

2. **Search Providers**
   - Perplexity API
   - Tavily API
   - Google Search API
   - SERP API

3. **Processing Pipeline**
   - RAG Processor
   - MoA Aggregator
   - Result formatter

## Configuration

```typescript
interface SearchConfig {
  providers: {
    perplexity: {
      apiKey: string;
      model: string;
      maxTokens: number;
    };
    tavily: {
      apiKey: string;
      searchDepth: 'basic' | 'advanced';
    };
    google: {
      apiKey: string;
      searchEngineId: string;
    };
    serp: {
      apiKey: string;
      resultsPerPage: number;
    };
  };
  rag: {
    enabled: boolean;
    similarityThreshold: number;
    maxResults: number;
  };
  moa: {
    numHeads: number;
    temperature: number;
  };
}
```

## API Reference

### Search Operations

```typescript
// Perform search
async search(query: string): Promise<string>

// Process with RAG
async processWithRAG(
  results: SearchResult[]
): Promise<SearchResult[]>

// Aggregate results
async aggregateResults(
  results: SearchResult[]
): Promise<string>
```

### Provider-Specific Operations

```typescript
// Perplexity search
async perplexitySearch(query: string): Promise<SearchResult>

// Tavily search
async tavilySearch(query: string): Promise<SearchResult>

// Google search
async googleSearch(query: string): Promise<SearchResult>

// SERP search
async serpSearch(query: string): Promise<SearchResult>
```

## Search Flow

1. **Query Processing**
   ```typescript
   // Initialize search
   const searchService = SearchService.getInstance();
   await searchService.initialize();

   // Perform search
   const results = await searchService.search(query);
   ```

2. **Provider Selection**
   ```typescript
   // Primary providers
   const primaryResults = await Promise.allSettled([
     perplexitySearch(query),
     tavilySearch(query)
   ]);

   // Fallback providers
   if (needsFallback) {
     const fallbackResults = await Promise.allSettled([
       googleSearch(query),
       serpSearch(query)
     ]);
   }
   ```

3. **Result Processing**
   ```typescript
   // Process with RAG
   const ragResults = await ragProcessor.process(results);

   // Aggregate with MoA
   const finalResult = await moaAggregator.aggregate(ragResults);
   ```

## Error Handling

```typescript
try {
  const results = await searchService.search(query);
} catch (error) {
  if (error instanceof AppError) {
    switch (error.code) {
      case 'SEARCH_ERROR':
        // Handle search errors
        break;
      case 'PROVIDER_ERROR':
        // Handle provider errors
        break;
      case 'PROCESSING_ERROR':
        // Handle processing errors
        break;
    }
  }
}
```

## Best Practices

1. **Provider Management**
   - Implement fallback mechanisms
   - Monitor provider health
   - Cache common queries
   - Handle rate limits

2. **Result Processing**
   - Validate results
   - Remove duplicates
   - Ensure relevance
   - Format consistently

3. **Error Handling**
   - Use specific error types
   - Implement retries
   - Log errors properly
   - Provide feedback

4. **Performance**
   - Use concurrent requests
   - Implement caching
   - Optimize processing
   - Monitor latency

## Examples

### Basic Search

```typescript
const searchService = SearchService.getInstance();
await searchService.initialize();

const results = await searchService.search(
  'What are the latest developments in AI?'
);
```

### Advanced Search

```typescript
const results = await searchService.search(query, {
  providers: ['perplexity', 'tavily'],
  rag: {
    enabled: true,
    threshold: 0.8
  },
  moa: {
    heads: 4,
    temperature: 0.7
  }
});
```

### Error Handling

```typescript
try {
  const results = await searchService.search(query);
} catch (error) {
  logger.error('Search failed', {
    query,
    error: error instanceof AppError ? {
      code: error.code,
      message: error.message,
      details: error.details
    } : error
  });
}
```