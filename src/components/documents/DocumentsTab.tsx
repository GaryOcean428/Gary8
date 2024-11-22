import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileProcessor } from '@/lib/utils/file-processor';
import { HybridVectorStore } from '@/lib/vectors/hybrid-store';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload, Save, Search, Trash } from 'lucide-react';

export function DocumentsTab() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const { toast } = useToast();
  const vectorStore = new HybridVectorStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    try {
      const processedFiles = await FileProcessor.processFiles(acceptedFiles);
      
      for (const { text, metadata } of processedFiles) {
        const id = await vectorStore.addDocument(text, metadata);
        setDocuments(prev => [...prev, { id, metadata }]);
      }

      toast({
        title: 'Files processed successfully',
        description: `Added ${acceptedFiles.length} documents to local storage.`
      });
    } catch (error) {
      toast({
        title: 'Error processing files',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'text/javascript': ['.js'],
      'text/typescript': ['.ts', '.tsx']
    }
  });

  const makePermanent = async (id: string) => {
    try {
      await vectorStore.makePermanent(id);
      toast({
        title: 'Document saved',
        description: 'Document moved to permanent storage.'
      });
      // Update UI to reflect permanent status
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === id ? { ...doc, metadata: { ...doc.metadata, permanent: true }} : doc
        )
      );
    } catch (error) {
      toast({
        title: 'Error saving document',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Drag & drop files here, or click to select files
        </p>
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Processing files...</span>
        </div>
      )}

      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div>
              <p className="font-medium">{doc.metadata.filename}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(doc.metadata.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="flex space-x-2">
              {!doc.metadata.permanent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => makePermanent(doc.id)}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => vectorStore.search(doc.metadata.text)}
              >
                <Search className="h-4 w-4 mr-1" />
                Find Similar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 