export interface VectorEntry {
  id: string;
  vector: number[];
  metadata: {
    text: string;
    type: 'document' | 'memory' | 'chat';
    source: string;
    timestamp: number;
    filename?: string;
    mimeType?: string;
    permanent: boolean;
    chunkIndex?: number;
  };
}

export interface VectorSearchResult {
  id: string;
  score: number;
  content: string;
  metadata: VectorEntry['metadata'];
}

export type FileType = 
  | 'text/plain'
  | 'text/markdown'
  | 'text/csv'
  | 'application/json'
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // docx
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // xlsx
  | 'text/javascript'
  | 'text/typescript'; 