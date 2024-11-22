# API Integration Documentation

## Core Services

### 1. GitHub Integration
```typescript
interface GitHubConfig {
  apiKey: string;
  baseUrl: string;
  scopes: string[];
}

// Repository Operations
async function listRepositories(): Promise<Repository[]>
async function getRepository(owner: string, repo: string): Promise<Repository>
async function getFileContent(owner: string, repo: string, path: string): Promise<string>
async function createPullRequest(params: PullRequestParams): Promise<PullRequest>
```

### 2. Search Integration
```typescript
interface SearchConfig {
  providers: {
    perplexity: PerplexityConfig;
    tavily: TavilyConfig;
    google: GoogleConfig;
    serp: SerpConfig;
  };
  fallbackStrategy: 'sequential' | 'parallel';
}

// Search Operations
async function search(query: string): Promise<SearchResult>
async function processWithRAG(results: SearchResult[]): Promise<SearchResult[]>
async function aggregateResults(results: SearchResult[]): Promise<string>
```

### 3. Firebase Integration

## Model Integration

### Available Models

1. **Groq Models**
   - `llama-3.2-3b-preview`: Simple tasks
   - `llama-3.2-7b-preview`: Balanced performance
   - `llama-3.2-70b-preview`: Complex tasks
   - `llama3-groq-8b-8192-tool-use-preview`: Tool interactions
   - `llama3-groq-70b-8192-tool-use-preview`: Advanced reasoning

2. **Perplexity Models**
   - `llama-3.1-sonar-small-128k-online`: 8B parameters
   - `llama-3.1-sonar-large-128k-online`: 70B parameters
   - `llama-3.1-sonar-huge-128k-online`: 405B parameters

3. **X.AI Models**
   - `grok-beta`: Expert-level queries

4. **Granite Models**
   - `granite-3b-code-base-2k`: Code-focused tasks

## API Configuration

### Authentication
```typescript
interface APIConfig {
  apiKeys: {
    github: string;
    groq: string;
    perplexity: string;
    xai: string;
    huggingface: string;
    tavily: string;
    google: string;
    serp: string;
  };
}
```

### Rate Limits
- GitHub: 5000 requests/hour
- Groq: 60 requests/minute
- Perplexity: 100 requests/minute
- X.AI: 50 requests/minute
- Tavily: 60 requests/minute
- Google: 100 requests/day
- SERP: 100 requests/month

## Usage Examples

### GitHub Operations
```typescript
// Initialize GitHub client
const github = GitHubClient.getInstance();
await github.initialize();

// List repositories
const repos = await github.listRepositories({
  type: 'all',
  sort: 'updated'
});

// Get file content
const content = await github.getFileContent(
  owner,
  repo,
  'path/to/file.ts'
);
```

### Search Operations
```typescript
// Initialize search service
const search = SearchService.getInstance();
await search.initialize();

// Perform search
const results = await search.search('query');

// Process with RAG
const processedResults = await search.processWithRAG(results);
```

## Error Handling

```typescript
try {
  const result = await api.request();
} catch (error) {
  if (error instanceof APIError) {
    console.error(`API Error: ${error.message}`, {
      status: error.status,
      details: error.details
    });
  }
}
```

## Best Practices

1. **Initialization**
   - Always initialize services before use
   - Handle initialization failures gracefully
   - Verify API keys and permissions

2. **Error Handling**
   - Use specific error types
   - Implement retry logic
   - Log errors appropriately

3. **Rate Limiting**
   - Implement token bucket algorithm
   - Use exponential backoff
   - Monitor usage limits

4. **Security**
   - Validate API keys
   - Sanitize inputs
   - Use secure connections
   - Handle sensitive data properly