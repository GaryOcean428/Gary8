# API Integration Documentation

## Model Integration

### Available Models

1. **OpenAI Models**
   - `chatgpt-4o-latest`: Versatile flagship model with text/image input (128K context)
   - `gpt-4o-mini`: Fast, affordable for focused tasks (128K context)
   - `o1`: Complex reasoning capabilities (200K context)
   - `o1-mini`: Fast reasoning for specialized tasks (128K context)
   - `o3-mini`: Latest small reasoning model (200K context)
   - `gpt-4o-realtime-preview`: Real-time audio/text responses over WebRTC/WebSocket
   - `gpt-4.5-preview`: Excels at creative thinking and conversation (128K context)

2. **Anthropic Models**
   - `claude-3-7-sonnet-20250219`: Most intelligent Claude model with text/image input (200K context)
   - `claude-3.5-sonnet-latest`: Advanced model with text/image input (200K context)
   - `claude-3.5-haiku-latest`: Fastest Claude 3.5 model (200K context)

3. **X.AI (Grok) Models**
   - `grok-3-latest`: Large context window for text (131K context)
   - `grok-3-fast-latest`: Faster inference for time-critical applications (131K context)
   - `grok-3-mini-latest`: Cost-efficient model for standard tasks (131K context)
   - `grok-3-mini-fast-latest`: Fastest and most cost-efficient Grok model (131K context)

4. **Groq Models**
   - `llama-3.3-70b-versatile`: Versatile large language model (128K context)
   - `llama3-groq-70b-8192-tool-use-preview`: Tool use specialized model (8K context)
   - `llama3-8b-8192`: Fast, efficient smaller model (8K context)
   - `llama-3.2-90b-vision-preview`: Large vision model for handling images (8K context)
   - `llama-3.2-11b-vision-preview`: Efficient vision model (8K context)

5. **Perplexity Models**
   - `sonar-deep-research`: Advanced research capabilities (128K context)
   - `sonar-reasoning-pro`: Fast online search with reasoning capabilities (128K context)
   - `sonar-reasoning`: Standard reasoning with search capabilities (128K context)
   - `sonar-pro`: Advanced reasoning with integrated search and larger context (200K context)
   - `sonar`: Standard chat completion with search capabilities (128K context)

## API Configuration

### Authentication
```typescript
interface APIConfig {
  apiKeys: {
    groq: string;
    perplexity: string;
    xai: string;
    anthropic: string;
    openai: string;
  };
  services: {
    groq: {
      baseUrl: string;
      models: Record<string, string>;
      maxTokens: number; // Default: 32768
      temperature: number;
    };
    perplexity: {
      baseUrl: string;
      defaultModel: string;
      maxTokens: number; // Default: 8192
      temperature: number;
    };
    xai: {
      baseUrl: string;
      defaultModel: string;
      maxTokens: number; // Default: 131072
      temperature: number;
    };
    anthropic: {
      baseUrl: string;
      defaultModel: string;
      maxTokens: number; // Default: 200000
      temperature: number;
    };
    openai: {
      baseUrl: string;
      defaultModel: string;
      maxTokens: number; // Default: 200000
      temperature: number;
    };
  };
}
```

### Rate Limits
- OpenAI: 500 requests per minute
- Anthropic: 100 requests per minute
- X.AI (Grok): 100 requests per minute
- Groq: 100 requests per minute
- Perplexity: 150 requests per minute

## Usage Examples

### Chat Completion
```typescript
const response = await modelAPI.chat(
  messages,
  'grok-3-latest',
  content => console.log('Streaming:', content)
);
```

### Vector Search
```typescript
const results = await vectorStore.search(query, {
  minSimilarity: 0.7,
  limit: 10
});
```

### Document Processing
```typescript
const document = await documentManager.addDocument(
  workspaceId,
  file,
  userTags
);
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

1. **Rate Limiting**
   - Implement exponential backoff
   - Track token usage
   - Handle rate limit errors

2. **Error Handling**
   - Catch specific error types
   - Provide detailed error messages
   - Implement retry logic

3. **Performance**
   - Use streaming for long responses
   - Implement caching
   - Batch requests when possible

4. **Security**
   - Validate API keys
   - Sanitize inputs
   - Handle sensitive data