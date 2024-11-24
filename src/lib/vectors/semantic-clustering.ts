import { HybridVectorStore } from './hybrid-store';
import { createEmbedding } from '../utils/pinecone-client';
import { thoughtLogger } from '../utils/logger';

interface ClusteringOptions {
  minClusterSize?: number;
  similarityThreshold?: number;
  maxClusters?: number;
}

interface Cluster {
  id: string;
  centroid: number[];
  documents: Array<{
    id: string;
    content: string;
    similarity: number;
  }>;
  metadata: {
    size: number;
    averageSimilarity: number;
    commonTopics: string[];
  };
}

export class SemanticClustering {
  constructor(private vectorStore: HybridVectorStore) {}

  async clusterDocuments(
    documentIds: string[],
    options: ClusteringOptions = {}
  ): Promise<Cluster[]> {
    const {
      minClusterSize = 2,
      similarityThreshold = 0.8,
      maxClusters = 10
    } = options;

    try {
      // Get all documents and their embeddings
      const documents = await Promise.all(
        documentIds.map(async id => {
          const doc = await this.vectorStore.getDocument(id);
          return {
            id,
            content: doc.content,
            embedding: doc.vector
          };
        })
      );

      // Initialize clusters
      const clusters: Cluster[] = [];
      const assigned = new Set<string>();

      // Clustering algorithm
      for (const doc of documents) {
        if (assigned.has(doc.id)) continue;

        // Find similar documents
        const similar = documents
          .filter(d => !assigned.has(d.id))
          .map(d => ({
            ...d,
            similarity: this.cosineSimilarity(doc.embedding, d.embedding)
          }))
          .filter(d => d.similarity >= similarityThreshold)
          .sort((a, b) => b.similarity - a.similarity);

        if (similar.length >= minClusterSize) {
          const cluster: Cluster = {
            id: crypto.randomUUID(),
            centroid: this.calculateCentroid(similar.map(d => d.embedding)),
            documents: similar.map(d => ({
              id: d.id,
              content: d.content,
              similarity: d.similarity
            })),
            metadata: {
              size: similar.length,
              averageSimilarity: similar.reduce((sum, d) => sum + d.similarity, 0) / similar.length,
              commonTopics: await this.extractCommonTopics(similar.map(d => d.content))
            }
          };

          clusters.push(cluster);
          similar.forEach(d => assigned.add(d.id));
        }

        if (clusters.length >= maxClusters) break;
      }

      return clusters;
    } catch (error) {
      thoughtLogger.log('error', 'Document clustering failed', { error });
      throw new Error('Failed to cluster documents');
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private calculateCentroid(vectors: number[][]): number[] {
    const dimension = vectors[0].length;
    const centroid = new Array(dimension).fill(0);
    
    for (const vector of vectors) {
      for (let i = 0; i < dimension; i++) {
        centroid[i] += vector[i];
      }
    }
    
    for (let i = 0; i < dimension; i++) {
      centroid[i] /= vectors.length;
    }
    
    return centroid;
  }

  private async extractCommonTopics(contents: string[]): Promise<string[]> {
    try {
      const combinedContent = contents.join('\n');
      const response = await this.vectorStore.modelApi.chat([
        {
          role: 'system',
          content: 'Extract 3-5 common topics/themes from these related documents. Return as JSON array.'
        },
        {
          role: 'user',
          content: combinedContent
        }
      ]);

      return JSON.parse(response.content);
    } catch (error) {
      return ['topic-extraction-failed'];
    }
  }
} 