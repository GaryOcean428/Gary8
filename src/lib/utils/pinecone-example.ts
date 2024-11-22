import { createEmbedding, upsertVector, queryVector } from './pinecone-client';

// Example usage
export const examplePineconeUsage = async () => {
  try {
    // Create embedding for a text
    const text = "Example text to embed";
    const embedding = await createEmbedding(text);

    // Upsert the vector with metadata
    await upsertVector("unique-id-1", embedding, {
      text: text,
      timestamp: new Date().toISOString(),
    });

    // Query similar vectors
    const similarVectors = await queryVector(embedding, 3);
    console.log('Similar vectors:', similarVectors);

  } catch (error) {
    console.error('Error:', error);
  }
}; 