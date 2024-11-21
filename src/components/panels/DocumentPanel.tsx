import React, { useState } from 'react';
import { FileText, Upload, Grid, List, Search, Filter } from 'lucide-react';
import { DocumentList } from '../DocumentList';
import { DocumentUpload } from '../DocumentUpload';
import { DocumentManager } from '../../lib/documents/document-manager';
import type { Document, SearchOptions } from '../../lib/documents/types';

export function DocumentPanel() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadSuccess, setUploadSuccess] = useState<boolean | null>(null);

  React.useEffect(() => {
    loadDocuments();
  }, [searchQuery, selectedTags]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const searchOptions: SearchOptions = {
        query: searchQuery,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        limit: 50
      };

      const results = await DocumentManager.getInstance().searchDocuments(searchOptions);
      setDocuments(results.map(r => r.document));
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadComplete = async () => {
    setUploadSuccess(true);
    setIsUploadOpen(false);
    await loadDocuments();

    setTimeout(() => {
      setUploadSuccess(null);
    }, 3000);
  };

  const handleUploadError = () => {
    setUploadSuccess(false);
    setTimeout(() => {
      setUploadSuccess(null);
    }, 3000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-border bg-background/50 backdrop-blur-sm gap-4">
        <div className="flex-1 max-w-xl">
          <h1 className="text-xl font-bold mb-1">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Manage and search through your documents
          </p>
        </div>

        <div className="flex items-center w-full sm:w-auto gap-4">
          <div className="flex items-center space-x-2 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
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
            <Upload size={20} />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Upload Status Messages */}
      {uploadSuccess !== null && (
        <div
          className={`p-4 ${
            uploadSuccess
              ? 'bg-green-500/10 border-green-500/50 text-green-400'
              : 'bg-destructive/10 border-destructive/50 text-destructive'
          } border backdrop-blur-sm`}
        >
          <div className="flex items-center space-x-2 max-w-4xl mx-auto">
            <FileText className="w-5 h-5" />
            <p>
              {uploadSuccess
                ? 'Document uploaded successfully!'
                : 'Failed to upload document. Please try again.'}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isUploadOpen ? (
          <div className="p-4">
            <DocumentUpload
              workspaceId="default"
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