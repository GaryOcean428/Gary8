import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

// Initialize OpenAI client only on server-side
const openai = typeof window === 'undefined' ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
  environment: process.env.PINECONE_ENVIRONMENT!,
  host: process.env.PINECONE_HOST
});

const index = pinecone.index(process.env.PINECONE_INDEX!);

export async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    input: text,
    model: "text-embedding-3-large",
    dimensions: 3072
  });
  
  return response.data[0].embedding;
}

export async function upsertVector({ id, values, metadata }: {
  id: string;
  values: number[];
  metadata: Record<string, any>;
}) {
  await index.upsert([{
    id,
    values,
    metadata,
    metric: 'cosine'
  }]);
}

export async function queryVector(vector: number[], topK: number = 5) {
  const results = await index.query({
    vector,
    topK,
    includeMetadata: true,
    metric: 'cosine'
  });
  
  return results.matches || [];
} 