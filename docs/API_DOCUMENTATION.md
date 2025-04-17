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
   - `grok-2-latest`: Large context window for text (131K context)
   - `grok-2-vision-1212`: Vision tasks with text output (32K context)
   - `grok-vision-beta`: Image-to-text generation (Beta)

4. **Groq Models**
   - `llama-3.3-70b-versatile`: Versatile large language model (128K context)
   - `llama3-groq-70b-8192-tool-use-preview`: Tool use specialized model

5. **Perplexity Models**
   - `sonar-reasoning-pro`: Fast online search capabilities (128K context)
   - `sonar-pro`: Advanced reasoning with integrated search (200K context)

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
  'grok-2-latest',
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