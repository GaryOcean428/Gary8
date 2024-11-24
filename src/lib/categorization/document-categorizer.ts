import { ModelAPI } from '../api/model-api';
import { db } from '../firebase/config';
import { thoughtLogger } from '../utils/logger';
import { AppError } from '../errors/AppError';

interface Category {
  id: string;
  name: string;
  description: string;
  rules: string[];
  parentId?: string;
  metadata: {
    documentCount: number;
    lastUpdated: Date;
    confidence: number;
  };
}

export class DocumentCategorizer {
  private modelApi: ModelAPI;
  private categories: Map<string, Category> = new Map();

  constructor() {
    this.modelApi = new ModelAPI();
    this.initializeCategories();
  }

  private async initializeCategories() {
    try {
      const categoriesSnapshot = await db.collection('categories').get();
      categoriesSnapshot.docs.forEach(doc => {
        this.categories.set(doc.id, { id: doc.id, ...doc.data() } as Category);
      });
      thoughtLogger.log('info', 'Categories initialized', { 
        count: this.categories.size 
      });
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize categories', { error });
      throw new AppError('Category initialization failed', 'INIT_ERROR');
    }
  }

  async categorizeDocument(content: string, metadata: Record<string, any>): Promise<string[]> {
    try {
      // Prepare categorization prompt
      const categoryRules = Array.from(this.categories.values())
        .map(cat => `${cat.name}: ${cat.description}\nRules: ${cat.rules.join(', ')}`)
        .join('\n\n');

      const response = await this.modelApi.chat([
        {
          role: 'system',
          content: `You are a document categorization expert. Analyze the document and assign relevant categories based on these rules:\n\n${categoryRules}\n\nReturn categories as JSON array.`
        },
        {
          role: 'user',
          content: `Document content: ${content}\nMetadata: ${JSON.stringify(metadata)}`
        }
      ]);

      const assignedCategories = JSON.parse(response.content) as string[];
      await this.updateCategoryStats(assignedCategories);

      return assignedCategories;
    } catch (error) {
      thoughtLogger.log('error', 'Document categorization failed', { error });
      throw new AppError('Categorization failed', 'PROCESSING_ERROR');
    }
  }

  private async updateCategoryStats(categoryIds: string[]) {
    const batch = db.batch();

    for (const categoryId of categoryIds) {
      const categoryRef = db.collection('categories').doc(categoryId);
      batch.update(categoryRef, {
        'metadata.documentCount': db.FieldValue.increment(1),
        'metadata.lastUpdated': new Date()
      });
    }

    await batch.commit();
  }

  async createCategory(category: Omit<Category, 'id' | 'metadata'>): Promise<string> {
    try {
      const docRef = await db.collection('categories').add({
        ...category,
        metadata: {
          documentCount: 0,
          lastUpdated: new Date(),
          confidence: 1.0
        }
      });

      this.categories.set(docRef.id, {
        id: docRef.id,
        ...category,
        metadata: {
          documentCount: 0,
          lastUpdated: new Date(),
          confidence: 1.0
        }
      });

      return docRef.id;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to create category', { error });
      throw new AppError('Category creation failed', 'DB_ERROR');
    }
  }

  async suggestCategories(documents: Array<{ content: string; metadata: any }>): Promise<Category[]> {
    try {
      const response = await this.modelApi.chat([
        {
          role: 'system',
          content: 'Analyze these documents and suggest new categories. Return as JSON array of category objects with name, description, and rules.'
        },
        {
          role: 'user',
          content: JSON.stringify(documents)
        }
      ]);

      const suggestions = JSON.parse(response.content);
      return suggestions.map((s: any) => ({
        ...s,
        id: crypto.randomUUID(),
        metadata: {
          documentCount: 0,
          lastUpdated: new Date(),
          confidence: 0.8
        }
      }));
    } catch (error) {
      thoughtLogger.log('error', 'Category suggestion failed', { error });
      throw new AppError('Failed to suggest categories', 'PROCESSING_ERROR');
    }
  }

  async getDocumentsByCategory(categoryId: string): Promise<any[]> {
    try {
      const docs = await db.collection('documents')
        .where('categories', 'array-contains', categoryId)
        .get();

      return docs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      thoughtLogger.log('error', 'Failed to get documents by category', { error });
      throw new AppError('Document retrieval failed', 'DB_ERROR');
    }
  }
} 