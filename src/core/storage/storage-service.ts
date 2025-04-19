import { thoughtLogger } from '../../lib/logging/thought-logger';
import { supabase } from '../supabase/supabase-client';
import type { Document } from '../../features/documents/types';

export class StorageService {
  async uploadDocument(_file: File, _userId: string): Promise<Document> {
    thoughtLogger.log('execution', 'Uploading document to Supabase Storage', {
      fileName: _file.name,
      fileSize: _file.size
    });

    try {
      // Create storage path
      const filePath = `documents/${_userId}/${Date.now()}_${_file.name}`;
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, _file, {
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
          name: _file.name,
          mime_type: _file.type,
          size: _file.size,
          user_id: _userId,
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
        name: _file.name,
        content: urlData.publicUrl,
        mimeType: _file.type,
        tags: [],
        workspaceId: _userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
          fileSize: _file.size,
          storagePath: filePath
        }
      };
    } catch (error) {
      thoughtLogger.log('error', 'Failed to upload document', { error });
      throw error;
    }
  }

  async listDocuments(_userId: string): Promise<Document[]> {
    thoughtLogger.log('execution', 'Fetching documents from Supabase');

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', _userId);

      if (error) throw error;

      return (data || []).map(_doc => ({
        id: _doc.id,
        name: _doc.name,
        content: _doc.url || '',
        mimeType: _doc.mime_type,
        tags: _doc.tags || [],
        workspaceId: _doc.workspace_id || _userId,
        createdAt: new Date(_doc.created_at).getTime(),
        updatedAt: new Date(_doc.updated_at).getTime(),
        vectorId: _doc.vector_id,
        metadata: {
          fileSize: _doc.size,
          storagePath: _doc.storage_path
        }
      }));
    } catch (error) {
      thoughtLogger.log('error', 'Failed to fetch documents', { error });
      throw error;
    }
  }

  async deleteDocument(_document: Document, _userId: string): Promise<void> {
    thoughtLogger.log('execution', 'Deleting document', { documentId: _document.id });

    try {
      // Delete file from Supabase Storage
      if (_document.metadata?.storagePath) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([_document.metadata.storagePath]);
        
        if (storageError) throw storageError;
      }

      // Delete database record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', _document.id);

      if (error) throw error;

      thoughtLogger.log('success', 'Document deleted successfully');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to delete document', { error });
      throw error;
    }
  }
}