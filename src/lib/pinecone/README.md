# Pinecone Integration

This directory contains the Pinecone vector database integration for the Gary8 project.

## Setup

1. Create a `.env.local` file in the root directory
2. Add your Pinecone API key to the file:
   ```
   NEXT_PUBLIC_PINECONE_API_KEY=your-api-key
   ```

## Testing

To run the Pinecone integration tests:

1. Ensure your `.env.local` file is set up with the correct API key
2. Run the test:
   ```bash
   npm run test:pinecone
   ```

## Usage

```typescript
import { upsertVectors, queryVectors } from '@/lib/pinecone/client';

// Upsert vectors
await upsertVectors('namespace', [{
  id: 'vec1',
  values: [...], // vector values
  metadata: { key: 'value' }
}]);

// Query vectors
const results = await queryVectors('namespace', {
  vector: [...], // query vector
  topK: 10,
  filter: { key: 'value' }
});
```

## Security Notes

- Never commit API keys or sensitive credentials to version control
- Always use environment variables for sensitive configuration
- The `.env.local` file is automatically ignored by git
