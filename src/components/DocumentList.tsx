'use client';

import { FileText, Trash2, Tag, ExternalLink, Search, X } from 'lucide-react';
import type { Document } from '../lib/documents/types';
import { formatDistanceToNow } from 'date-fns';
import { Input, Button, Card } from '@nextui-org/react';
import { useState } from 'react';

interface DocumentListProps {
  documents: Document[];
  onDelete?: (id: string) => void;
  onSelect?: (doc: Document) => void;
}

export function DocumentList({ documents, onDelete, onSelect }: DocumentListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documents..."
          className="pl-10 pr-10"
          endContent={
            searchQuery && (
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )
          }
        />
      </div>

      <div className="space-y-2">
        {filteredDocs.map((doc) => (
          <Card
            key={doc.id}
            className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
            onClick={() => onSelect?.(doc)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 mt-1 text-primary" />
                <div>
                  <h3 className="font-medium">{doc.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(doc.lastModified), { addSuffix: true })}
                    </span>
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="text-xs">Source</span>
                      </a>
                    )}
                  </div>
                  {doc.tags.length > 0 && (
                    <div className="flex items-center space-x-2 mt-2">
                      <Tag className="w-3 h-3 text-muted-foreground" />
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-secondary rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {onDelete && (
                <Button
                  isIconOnly
                  variant="light"
                  color="danger"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(doc.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}