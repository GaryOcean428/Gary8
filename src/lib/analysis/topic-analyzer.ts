import { HybridVectorStore } from '../vectors/hybrid-store';
import { ModelAPI } from '../api/model-api';
import { db } from '../firebase/config';
import { thoughtLogger } from '../utils/logger';

interface TopicTrend {
  topic: string;
  frequency: number;
  documents: string[];
  sentiment: number;
  timeRange: {
    start: Date;
    end: Date;
  };
  relatedTopics: string[];
}

export class TopicAnalyzer {
  private modelApi: ModelAPI;

  constructor(private vectorStore: HybridVectorStore) {
    this.modelApi = new ModelAPI();
  }

  async analyzeTopicTrends(timeRange: { start: Date; end: Date }): Promise<TopicTrend[]> {
    try {
      // Get documents from the specified time range
      const docs = await db.collection('documents')
        .where('timestamp', '>=', timeRange.start)
        .where('timestamp', '<=', timeRange.end)
        .get();

      const documents = docs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Extract and analyze topics
      const topics = await this.extractTopics(documents);
      const trends = await this.analyzeTrends(topics, documents);

      // Store analysis results
      await this.saveAnalysis(trends, timeRange);

      return trends;
    } catch (error) {
      thoughtLogger.log('error', 'Topic trend analysis failed', { error });
      throw error;
    }
  }

  private async extractTopics(documents: any[]): Promise<string[]> {
    const response = await this.modelApi.chat([
      {
        role: 'system',
        content: 'Extract key topics from these documents. Return as JSON array of strings.'
      },
      {
        role: 'user',
        content: documents.map(d => d.content).join('\n\n')
      }
    ]);

    return JSON.parse(response.content);
  }

  private async analyzeTrends(topics: string[], documents: any[]): Promise<TopicTrend[]> {
    return Promise.all(topics.map(async topic => {
      const relevantDocs = documents.filter(doc => 
        doc.content.toLowerCase().includes(topic.toLowerCase())
      );

      const sentiment = await this.analyzeSentiment(
        relevantDocs.map(d => d.content).join('\n')
      );

      return {
        topic,
        frequency: relevantDocs.length,
        documents: relevantDocs.map(d => d.id),
        sentiment,
        timeRange: {
          start: new Date(Math.min(...relevantDocs.map(d => d.timestamp))),
          end: new Date(Math.max(...relevantDocs.map(d => d.timestamp)))
        },
        relatedTopics: await this.findRelatedTopics(topic, topics)
      };
    }));
  }

  private async saveAnalysis(trends: TopicTrend[], timeRange: { start: Date; end: Date }) {
    await db.collection('analyses').add({
      type: 'topic-trends',
      trends,
      timeRange,
      timestamp: new Date(),
      metadata: {
        documentCount: trends.reduce((sum, t) => sum + t.documents.length, 0),
        topicCount: trends.length
      }
    });
  }

  private async analyzeSentiment(text: string): Promise<number> {
    const response = await this.modelApi.chat([
      {
        role: 'system',
        content: 'Analyze the sentiment of this text. Return a number between -1 (negative) and 1 (positive).'
      },
      {
        role: 'user',
        content: text
      }
    ]);

    return parseFloat(response.content);
  }

  private async findRelatedTopics(topic: string, allTopics: string[]): Promise<string[]> {
    const response = await this.modelApi.chat([
      {
        role: 'system',
        content: 'From the given list of topics, identify which ones are most related to the main topic. Return as JSON array.'
      },
      {
        role: 'user',
        content: `Main topic: ${topic}\nAll topics: ${allTopics.join(', ')}`
      }
    ]);

    return JSON.parse(response.content);
  }
} 