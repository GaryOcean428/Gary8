import { config } from 'dotenv';
import { resolve } from 'path';
import { PineconeClient } from './client';
import type { PineconeVector, PineconeQueryOptions } from '../../types';
import { thoughtLogger } from '../logging/thought-logger';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function testPineconeOperations() {
  thoughtLogger.info('Starting Pinecone test operations...');

  // Create a vector of specified dimension (3072 to match the index configuration)
  const createVector = (seed: number): number[] => {
    return Array.from({ length: 3072 }, (_, i) => (Math.sin(i * seed) + 1) / 2);
  };

  // Test vectors with 3072-dimensional vectors
  const testVectors: PineconeVector[] = [
    {
      id: 'test-vec1',
      values: createVector(0.1),
      metadata: { genre: 'drama', title: 'Test Vector 1' }
    },
    {
      id: 'test-vec2',
      values: createVector(0.2),
      metadata: { genre: 'action', title: 'Test Vector 2' }
    }
  ];

  try {
    // Test upsert
    thoughtLogger.info('Upserting test vectors...', {
      vectorCount: testVectors.length,
      dimension: testVectors[0].values.length
    });

    const pineconeClient = PineconeClient.getInstance();
    const upsertResult = await pineconeClient.upsertVectors('test-namespace', testVectors);
    thoughtLogger.info('Upsert successful', { result: upsertResult });

    // Test query
    const queryOptions: PineconeQueryOptions = {
      vector: createVector(0.1),
      topK: 2,
      filter: { genre: { $eq: 'action' } },
      includeValues: true,
      includeMetadata: true
    };

    thoughtLogger.info('Querying vectors...', { options: queryOptions });
    const queryResult = await pineconeClient.queryVectors('test-namespace', queryOptions);
    thoughtLogger.info('Query successful', { result: queryResult });

  } catch (error) {
    thoughtLogger.error('Pinecone test failed', { error });
    throw error;
  }
}

// Only run if called directly
if (require.main === module) {
  testPineconeOperations()
    .then(() => thoughtLogger.info('Test completed successfully'))
    .catch(error => {
      thoughtLogger.error('Test failed', { error });
      process.exit(1);
    });
}

export { testPineconeOperations };
