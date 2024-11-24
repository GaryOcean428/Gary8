# X.AI Integration Documentation

## API Configuration

The X.AI API integration uses the following configuration:

```typescript
{
  baseUrl: 'https://api.x.ai/v1',
  apiVersion: '2024-01',
  models: {
    beta: 'grok-beta',
    pro: 'grok-pro'
  },
  rateLimits: {
    requestsPerMinute: 60,
    tokensPerMinute: 100000
  }
}
```plaintext

### Authentication

Authentication is done using an API key passed in the Authorization header:

```

Authorization: Bearer YOUR_API_KEY

```plaintext

### Rate Limits

- 60 requests per minute
- 100,000 tokens per minute

### Models

- `grok-beta`: Latest beta version of Grok
- `grok-pro`: Production version of Grok

### Endpoints

Chat Completions:

```plaintext

POST /chat/completions

```

Request body:

```json
{
  "messages": [{"role": "user", "content": "Hello"}],
  "model": "grok-beta",
  "temperature": 0.7,
  "max_tokens": 4096,
  "stream": false
}
```

### Streaming

To enable streaming responses, set `stream: true` in the request. The response will be a stream of server-sent events in the format:

```plaintext
data: {"choices": [{"delta": {"content": "Hello"}}]}
data: {"choices": [{"delta": {"content": " world"}}]}
data: [DONE]
```

### Error Handling

Errors are returned in the format:

```json
{
  "error": {
    "message": "Error message",
    "type": "error_type",
    "code": "error_code"
  }
}
```

### Best Practices

1. Always check rate limits before making requests
2. Use streaming for long responses
3. Handle API errors gracefully
4. Include API version header
5. Validate API key before making requests
