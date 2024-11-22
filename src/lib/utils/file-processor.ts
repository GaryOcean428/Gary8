import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { FileType } from '../vectors/types';

export class FileProcessor {
  static async processFile(file: File): Promise<{ text: string; metadata: any }> {
    const buffer = await file.arrayBuffer();
    const loader = this.getLoader(file.type, buffer);
    
    try {
      const docs = await loader.load();
      return {
        text: docs.map(doc => doc.pageContent).join('\n'),
        metadata: {
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          lastModified: file.lastModified
        }
      };
    } catch (error) {
      throw new Error(`Failed to process file: ${error.message}`);
    }
  }

  static async processFiles(files: File[]): Promise<Array<{ text: string; metadata: any }>> {
    return Promise.all(files.map(file => this.processFile(file)));
  }

  private static getLoader(mimeType: string, buffer: ArrayBuffer) {
    switch (mimeType as FileType) {
      case 'application/pdf':
        return new PDFLoader(new Blob([buffer]));
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return new DocxLoader(new Blob([buffer]));
      case 'text/csv':
        return new CSVLoader(new Blob([buffer]));
      case 'text/plain':
      case 'text/markdown':
      case 'text/javascript':
      case 'text/typescript':
        return new TextLoader(new Blob([buffer]));
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  }
} 