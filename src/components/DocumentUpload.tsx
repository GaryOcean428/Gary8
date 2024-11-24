import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { DocumentManager } from '../lib/documents/document-manager';
import { thoughtLogger } from '../lib/logging/thought-logger';

interface DocumentUploadProps {
  workspaceId: string;
  onUploadComplete?: () => void;
  onUploadError?: () => void;
}

export function DocumentUpload({ workspaceId, onUploadComplete, onUploadError }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentManager = DocumentManager.getInstance();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setError(null);
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const uploadFiles = async () => {
    setIsUploading(true);
    setError(null);

    try {
      thoughtLogger.log('execution', 'Starting document upload', {
        fileCount: files.length,
        workspaceId
      });

      await Promise.all(
        files.map(async (file, index) => {
          try {
            setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
            
            const progressInterval = setInterval(() => {
              setUploadProgress(prev => ({
                ...prev,
                [file.name]: Math.min((prev[file.name] || 0) + 10, 90)
              }));
            }, 200);

            await documentManager.addDocument(workspaceId, file);
            
            clearInterval(progressInterval);
            setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
            
            thoughtLogger.log('success', 'Document uploaded successfully', {
              fileName: file.name
            });
          } catch (error) {
            thoughtLogger.log('error', `Failed to upload ${file.name}`, { error });
            throw error;
          }
        })
      );

      setFiles([]);
      onUploadComplete?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
      onUploadError?.();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50/5'
            : 'border-gray-600 hover:border-gray-500'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.docx,.txt,.md"
        />

        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-300">
          Drag and drop files here, or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-400 hover:text-blue-300"
          >
            browse
          </button>
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Supported formats: PDF, DOCX, TXT, MD
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-800/50 backdrop-blur-sm rounded-lg p-3"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{file.name}</p>
                  {uploadProgress[file.name] !== undefined && (
                    <div className="mt-1 h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-200"
                        style={{ width: `${uploadProgress[file.name]}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="ml-2 p-2 text-gray-400 hover:text-gray-300"
                disabled={isUploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setFiles([])}
              className="px-4 py-2 text-gray-400 hover:text-gray-300 w-full sm:w-auto"
              disabled={isUploading}
            >
              Clear All
            </button>
            <button
              onClick={uploadFiles}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors w-full sm:w-auto"
            >
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-400">Upload Failed</h4>
              <p className="text-sm text-red-300/90 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}