import React from 'react';
import { FileText, Upload } from 'lucide-react';

export function Documents() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">Documents</h1>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Upload className="w-4 h-4" />
          <span>Upload</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center text-foreground/60">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No documents uploaded yet</p>
          <p className="text-sm mt-2">Upload documents to get started</p>
        </div>
      </div>
    </div>
  );
}