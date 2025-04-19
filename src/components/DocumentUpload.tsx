import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { DocumentManager } from '../lib/documents/document-manager';
import { thoughtLogger } from '../lib/logging/thought-logger';
import { useAuth } from '../lib/auth/AuthProvider';
import './DocumentUpload.css'; // Import CSS file

interface DocumentUploadProps {
  readonly workspaceId?: string;
  readonly onUploadComplete?: () => void;
  readonly onUploadError?: (error: Error) => void;
}

export function DocumentUpload({ 
  workspaceId, 
  onUploadComplete, 
  onUploadError 
}: Readonly<DocumentUploadProps>) { // Props marked as read-only
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentManager = DocumentManager.getInstance();
  const { user } = useAuth();

  const handleDragOver = (_e: React.DragEvent<HTMLLabelElement>) => { // Type added
    _e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (_e: React.DragEvent<HTMLLabelElement>) => { // Type added
    _e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (_e: React.DragEvent<HTMLLabelElement>) => { // Type added
    _e.preventDefault();
    setIsDragging(false);
    setError(null);
    
    const droppedFiles = Array.from(_e.dataTransfer.files);
    setFiles((_prev: File[]) => [..._prev, ...droppedFiles]); // Type added
  };

  const handleFileSelect = (_e: React.ChangeEvent<HTMLInputElement>) => { // Type added
    if (_e.target.files) {
      setError(null);
      const selectedFiles = Array.from(_e.target.files);
      setFiles((_prev: File[]) => [..._prev, ...selectedFiles]); // Type added
    }
  };

  const removeFile = (_index: number) => {
    setFiles((_prev: File[]) => _prev.filter((_: File, _i: number) => _i !== _index)); // Types added
    setError(null);
  };

  // Extracted function to handle single file upload logic (Refactor for nesting)
  const uploadSingleFile = async (_file: File, _targetWorkspaceId: string) => {
    try {
      setUploadProgress((_prev: Record<string, number>) => ({ ..._prev, [_file.name]: 0 })); // Type added
      
      // Simulate progress updates (replace with actual progress if available)
      const progressInterval = setInterval(() => {
        setUploadProgress((_prev: Record<string, number>) => ({ // Type added
          ..._prev,
          [_file.name]: Math.min((_prev[_file.name] ?? 0) + 10, 90) // Use ??
        }));
      }, 200);

      // Upload document with workspace ID
      await documentManager.addDocument(_targetWorkspaceId, _file);
      
      clearInterval(progressInterval);
      setUploadProgress((_prev: Record<string, number>) => ({ ..._prev, [_file.name]: 100 })); // Type added
      
      thoughtLogger.log('success', 'Document uploaded successfully', { fileName: _file.name });
    } catch (uploadError) { // Renamed error variable
      thoughtLogger.log('error', `Failed to upload ${_file.name}`, { error: uploadError });
      setError(`Failed to upload ${_file.name}: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
      throw uploadError; // Re-throw to be caught by Promise.all
    }
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
      const targetWorkspaceId = workspaceId ?? user.id; // Use ??

      // Use the extracted function within Promise.all
      await Promise.all(files.map(_file => uploadSingleFile(_file, targetWorkspaceId)));

      setFiles([]); // Clear files after successful upload
      onUploadComplete?.();
    } catch (uploadError) { // Renamed error variable
      const errorMessage = uploadError instanceof Error 
        ? uploadError.message 
        : 'Upload failed';
        
      setError(errorMessage);
      onUploadError?.(uploadError instanceof Error ? uploadError : new Error(errorMessage));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone - Added role, tabIndex, onKeyDown and wrapped input in label */}
      <label 
        htmlFor="fileUploadInput" // Associate label with input
        role="button" // Make it behave like a button for accessibility
        tabIndex={0} // Make it focusable
        onKeyDown={(_e: React.KeyboardEvent<HTMLLabelElement>) => { // Handle keyboard interaction
          if (_e.key === 'Enter' || _e.key === ' ') {
            _e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`block border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors cursor-pointer ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground/50'
        }`}
      >
        <input
          id="fileUploadInput" // Add id for label association
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden" // Keep input hidden
          accept=".pdf,.docx,.txt,.md"
          aria-label="File upload input" // Added aria-label for screen readers
        />
        {/* Content inside the label acts as the visible control */}
        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
        <p className="mt-2 text-sm text-foreground">
          Drag and drop files here, or{' '}
          <span className="text-primary hover:text-primary/80 font-medium">
            browse
          </span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Supported formats: PDF, DOCX, TXT, MD
        </p>
      </label>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((_file: File) => ( // Add type for file
            <div
              key={_file.name} // Use file.name as key
              className="flex items-center justify-between bg-card/50 backdrop-blur-sm rounded-lg p-3 border border-border"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{_file.name}</p>
                  {uploadProgress[_file.name] !== undefined && (
                    <div className="mt-1 h-1 w-full bg-muted rounded-full overflow-hidden">
                      {/* Apply CSS class and keep dynamic width */}
                      <div 
                        className="upload-progress-bar" // Apply CSS class
                        style={{ width: `${uploadProgress[_file.name]}%` }} 
                      />
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeFile(files.indexOf(_file))} // Find index for removal
                className="ml-2 p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                disabled={isUploading}
                type="button"
                aria-label="Remove file" // Add aria-label
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
