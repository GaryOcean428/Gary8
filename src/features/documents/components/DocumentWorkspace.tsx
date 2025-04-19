import React, { useEffect, useCallback } from 'react';
import type { Document } from '../types';
import { DocumentList } from './DocumentList';
import { DocumentUpload } from './DocumentUpload';
import { DocumentManager } from '../services/DocumentManager';
import { useAuth } from '../../../core/auth/AuthProvider';
import { Grid, List, Plus, AlertCircle, ArrowLeft } from 'lucide-react';
import { useLocalStorage } from '../../../shared/hooks/useLocalStorage';
import { motion, AnimatePresence } from 'framer-motion';
import type { SearchOptions } from '../types';

export function DocumentWorkspace() {
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>('docViewMode', 'grid');
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = React.useState<{
    success: boolean;
    message?: string;
  } | null>(null);
  const documentManager = DocumentManager.getInstance();
  const { user } = useAuth();

  // Load documents from database
  const loadDocuments = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const searchOptions: SearchOptions = {
        query: searchQuery,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        limit: 50
      };

      const results = await documentManager.searchDocuments(searchOptions);
      setDocuments(results.map(_r => _r.document));
    } catch (error) {
      console.error('Failed to load documents:', error);
      setError(error instanceof Error ? error.message : 'Document search failed');
    } finally {
      setIsLoading(false);
    }
  }, [user, searchQuery, selectedTags, documentManager]);

  // Load documents when search parameters change or on mount
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUploadComplete = async () => {
    setUploadStatus({
      success: true,
      message: 'Document uploaded successfully!'
    });
    
    setTimeout(() => {
      setIsUploadOpen(false);
      setUploadStatus(null);
    }, 2000);
    
    await loadDocuments();
  };

  const handleUploadError = (_error: Error) => {
    setUploadStatus({
      success: false,
      message: `Upload failed: ${_error.message}`
    });

    setTimeout(() => {
      setUploadStatus(null);
    }, 5000);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg">Please sign in to access documents</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-border backdrop-blur-sm bg-background/50 gap-4">
        <div className="flex-1 max-w-xl">
          <h1 className="text-xl font-bold mb-1">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Manage and search through your uploaded documents
          </p>
        </div>

        <div className="flex items-center w-full sm:w-auto gap-4">
          <div className="flex items-center space-x-2 bg-card/50 rounded-lg p-1 backdrop-blur-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-muted text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-muted text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List size={20} />
            </button>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto justify-center"
          >
            <Plus size={20} />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 border backdrop-blur-sm bg-destructive/10 border-destructive/50 text-destructive"
          >
            <div className="flex items-center space-x-2 max-w-4xl mx-auto">
              <AlertCircle className="w-5 h-5" />
              <p>Failed to load documents: {error}</p>
              <button 
                onClick={loadDocuments}
                className="ml-auto px-3 py-1 bg-background hover:bg-muted text-sm rounded-md transition-colors"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Status Messages */}
      <AnimatePresence>
        {uploadStatus && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`p-4 border backdrop-blur-sm ${
              uploadStatus.success
                ? 'bg-success/10 border-success/50 text-success'
                : 'bg-destructive/10 border-destructive/50 text-destructive'
            }`}
          >
            <div className="flex items-center space-x-2 max-w-4xl mx-auto">
              <AlertCircle className="w-5 h-5" />
              <p>{uploadStatus.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isUploadOpen ? (
          <div className="p-4">
            <div className="mb-4">
              <button
                onClick={() => setIsUploadOpen(false)}
                className="flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Documents
              </button>
            </div>

            <DocumentUpload
              workspaceId={user.id}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />
          </div>
        ) : (
          <DocumentList
            documents={documents}
            viewMode={viewMode}
            isLoading={isLoading}
            selectedTags={selectedTags}
            onTagSelect={setSelectedTags}
            onRefresh={loadDocuments}
            onSearch={setSearchQuery}
          />
        )}
      </div>
    </div>
  );
}