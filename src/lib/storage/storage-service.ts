import { thoughtLogger } from '../logging/thought-logger';
import { supabase } from '../supabase/supabase-client';
import type { Document } from '../documents/types';

export class StorageService {
  async uploadDocument(file: File, userId: string): Promise<Document> {
    thoughtLogger.log('execution', 'Uploading document to Supabase Storage', {
      fileName: file.name,
      fileSize: file.size
    });

    try {
      // Create storage path
      const filePath = `documents/${userId}/${Date.now()}_${file.name}`;
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        thoughtLogger.log('error', 'Storage upload failed', { error: uploadError });
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Create document metadata in Supabase
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          mime_type: file.type,
          size: file.size,
          user_id: userId,
          storage_path: filePath,
          url: urlData.publicUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (docError) {
        thoughtLogger.log('error', 'Document record creation failed', { error: docError });
        throw docError;
      }

      thoughtLogger.log('success', 'Document uploaded successfully', {
        documentId: docData.id
      });

      return {
        id: docData.id,
        name: file.name,
        content: urlData.publicUrl,
        mimeType: file.type,
        tags: [],
        workspaceId: userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
          fileSize: file.size,
          storagePath: filePath
        }
      };
    } catch (error) {
      thoughtLogger.log('error', 'Failed to upload document', { error });
      throw error;
    }
  }

  async listDocuments(userId: string): Promise<Document[]> {
    thoughtLogger.log('execution', 'Fetching documents from Supabase');

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      return (data || []).map(doc => ({
        id: doc.id,
        name: doc.name,
        content: doc.url || '',
        mimeType: doc.mime_type,
        tags: doc.tags || [],
        workspaceId: doc.workspace_id || userId,
        createdAt: new Date(doc.created_at).getTime(),
        updatedAt: new Date(doc.updated_at).getTime(),
        vectorId: doc.vector_id,
        metadata: {
          fileSize: doc.size,
          storagePath: doc.storage_path
        }
      }));
    } catch (error) {
      thoughtLogger.log('error', 'Failed to fetch documents', { error });
      throw error;
    }
  }

  async deleteDocument(document: Document, userId: string): Promise<void> {
    thoughtLogger.log('execution', 'Deleting document', { documentId: document.id });

    try {
      // Delete file from Supabase Storage
      if (document.metadata?.storagePath) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([document.metadata.storagePath]);
        
        if (storageError) throw storageError;
      }

      // Delete database record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (error) throw error;

      thoughtLogger.log('success', 'Document deleted successfully');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to delete document', { error });
      throw error;
    }
  }
}