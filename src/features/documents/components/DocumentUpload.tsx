import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { DocumentManager } from '../services/DocumentManager';
import { thoughtLogger } from '../../../lib/logging/thought-logger';
import { useAuth } from '../../../core/auth/AuthProvider';

interface DocumentUploadProps {
  workspaceId?: string;
  onUploadComplete?: () => void;
  onUploadError?: (error: Error) => void;
}

export function DocumentUpload({ 
  workspaceId, 
  onUploadComplete, 
  onUploadError 
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentManager = DocumentManager.getInstance();
  const { user } = useAuth();

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
    if (!user) {
      setError('You must be signed in to upload documents');
      onUploadError?.(new Error('User not authenticated'));
      return;
    }
    
    setIsUploading(true);
    setError(null);

    try {
      thoughtLogger.log('execution', 'Starting document upload', {
        fileCount: files.length,
        userId: user.id
      });

      // Use user ID as workspace if not specified
      const targetWorkspaceId = workspaceId || user.id;

      await Promise.all(
        files.map(async (file, index) => {
          try {
            setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
            
            // Simulate progress updates
            const progressInterval = setInterval(() => {
              setUploadProgress(prev => ({
                ...prev,
                [file.name]: Math.min((prev[file.name] || 0) + 10, 90)
              }));
            }, 200);

            // Upload document with workspace ID
            await documentManager.addDocument(targetWorkspaceId, file);
            
            clearInterval(progressInterval);
            setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
            
            thoughtLogger.log('success', 'Document uploaded successfully', {
              fileName: file.name
            });
          } catch (error) {
            thoughtLogger.log('error', `Failed to upload ${file.name}`, { error });
            setError(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
          }
        })
      );

      setFiles([]);
      onUploadComplete?.();
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Upload failed';
        
      setError(errorMessage);
      onUploadError?.(error instanceof Error ? error : new Error(errorMessage));
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
        className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground/50'
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

        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
        <p className="mt-2 text-sm text-foreground">
          Drag and drop files here, or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-primary hover:text-primary/80 font-medium"
            type="button"
          >
            browse
          </button>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Supported formats: PDF, DOCX, TXT, MD
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-card/50 backdrop-blur-sm rounded-lg p-3 border border-border"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{file.name}</p>
                  {uploadProgress[file.name] !== undefined && (
                    <div className="mt-1 h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-200"
                        style={{ width: `${uploadProgress[file.name]}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="ml-2 p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                disabled={isUploading}
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
            <button
              onClick={() => setFiles([])}
              className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors w-full sm:w-auto"
              disabled={isUploading}
              type="button"
            >
              Clear All
            </button>
            <button
              onClick={uploadFiles}
              disabled={isUploading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors w-full sm:w-auto"
              type="button"
            >
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-destructive">Upload Failed</h4>
              <p className="text-sm text-destructive/90 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}