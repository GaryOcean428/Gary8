import React from 'react';
import { DocumentList } from './DocumentList';
import { DocumentUpload } from './DocumentUpload';
import { DocumentManager } from '../lib/documents/document-manager';
import { Search, Grid, List, Plus, AlertCircle } from 'lucide-react';
import type { Document, SearchOptions } from '../lib/documents/types';

export function DocumentWorkspace() {
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [uploadSuccess, setUploadSuccess] = React.useState<boolean | null>(null);
  const documentManager = DocumentManager.getInstance();

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

      const results = await documentManager.searchDocuments(searchOptions);
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
    <div className="flex-1 flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/50 gap-4">
        <div className="flex-1 max-w-xl">
          <h1 className="text-xl font-bold mb-1">Documents</h1>
          <p className="text-sm text-gray-400">
            Manage and search through your uploaded documents
          </p>
        </div>

        <div className="flex items-center w-full sm:w-auto gap-4">
          <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-1 backdrop-blur-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-gray-700 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-gray-700 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <List size={20} />
            </button>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
          >
            <Plus size={20} />
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
              : 'bg-red-500/10 border-red-500/50 text-red-400'
          } border backdrop-blur-sm`}
        >
          <div className="flex items-center space-x-2 max-w-4xl mx-auto">
            <AlertCircle className="w-5 h-5" />
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