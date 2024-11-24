'use client';

import { useState } from 'react';
import { DocumentList } from '../DocumentList';
import type { Document } from '@/lib/documents/types';
import { Card } from '@nextui-org/react';

export function DocumentPanel() {
  const [documents] = useState<Document[]>([
    {
      id: '1',
      title: 'Project Requirements',
      content: 'Detailed requirements for the project...',
      tags: ['requirements', 'planning'],
      lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'API Documentation',
      content: 'API endpoints and usage...',
      url: 'https://api.example.com/docs',
      tags: ['api', 'documentation'],
      lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ]);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Documents</h2>
      <DocumentList 
        documents={documents}
        onDelete={(id) => console.log('Delete', id)}
        onSelect={(doc) => console.log('Select', doc)}
      />
    </Card>
  );
}