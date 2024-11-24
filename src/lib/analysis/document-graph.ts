import { HybridVectorStore } from '../vectors/hybrid-store';
import { db } from '../firebase/config';
import { thoughtLogger } from '../utils/logger';

interface DocumentNode {
  id: string;
  type: string;
  metadata: Record<string, any>;
  connections: Array<{
    targetId: string;
    strength: number;
    type: 'reference' | 'similarity' | 'topic' | 'temporal';
  }>;
}

export class DocumentGraph {
  constructor(private vectorStore: HybridVectorStore) {}

  async buildGraph(options = {
    minSimilarity: 0.7,
    maxConnections: 5,
    includeReferences: true,
    includeTopics: true
  }): Promise<Map<string, DocumentNode>> {
    const graph = new Map<string, DocumentNode>();

    try {
      // Get all documents
      const docs = await db.collection('documents').get();
      const documents = docs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Build nodes
      for (const doc of documents) {
        const node: DocumentNode = {
          id: doc.id,
          type: doc.type,
          metadata: doc.metadata,
          connections: []
        };

        // Find similar documents
        const similar = await this.vectorStore.search(doc.content, {
          limit: options.maxConnections,
          minScore: options.minSimilarity
        });

        // Add similarity connections
        node.connections.push(...similar
          .filter(s => s.id !== doc.id)
          .map(s => ({
            targetId: s.id,
            strength: s.score,
            type: 'similarity' as const
          })));

        // Add reference connections if enabled
        if (options.includeReferences) {
          const references = await this.findReferences(doc);
          node.connections.push(...references);
        }

        // Add topic-based connections if enabled
        if (options.includeTopics) {
          const topicConnections = await this.findTopicConnections(doc, documents);
          node.connections.push(...topicConnections);
        }

        graph.set(doc.id, node);
      }

      // Store graph in database
      await this.saveGraph(graph);

      return graph;
    } catch (error) {
      thoughtLogger.log('error', 'Document graph building failed', { error });
      throw error;
    }
  }

  private async findReferences(doc: any): Promise<DocumentNode['connections']> {
    // Implement reference finding logic (e.g., URLs, citations, etc.)
    return [];
  }

  private async findTopicConnections(
    doc: any,
    allDocs: any[]
  ): Promise<DocumentNode['connections']> {
    const topics = await this.extractTopics(doc.content);
    const connections: DocumentNode['connections'] = [];

    for (const otherDoc of allDocs) {
      if (otherDoc.id === doc.id) continue;

      const otherTopics = await this.extractTopics(otherDoc.content);
      const commonTopics = topics.filter(t => otherTopics.includes(t));

      if (commonTopics.length > 0) {
        connections.push({
          targetId: otherDoc.id,
          strength: commonTopics.length / Math.max(topics.length, otherTopics.length),
          type: 'topic'
        });
      }
    }

    return connections;
  }

  private async saveGraph(graph: Map<string, DocumentNode>) {
    const graphData = {
      nodes: Array.from(graph.values()),
      timestamp: new Date(),
      metadata: {
        nodeCount: graph.size,
        connectionCount: Array.from(graph.values())
          .reduce((sum, node) => sum + node.connections.length, 0)
      }
    };

    await db.collection('documentGraphs').add(graphData);
  }

  private async extractTopics(content: string): Promise<string[]> {
    // Implement topic extraction (can reuse from TopicAnalyzer)
    return [];
  }
} 