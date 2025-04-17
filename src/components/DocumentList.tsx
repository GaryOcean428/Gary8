import React from 'react';
import { FileText, Trash2, Tag, ExternalLink, Search, X } from 'lucide-react';
import type { Document } from '../lib/documents/types';
import { formatDistanceToNow } from 'date-fns';

interface DocumentListProps {
  readonly documents: Document[];
  readonly viewMode: 'grid' | 'list';
  readonly isLoading: boolean;
  readonly selectedTags: string[];
  readonly onTagSelect: (tags: string[]) => void;
  readonly onRefresh: () => void;
  readonly onSearch: (query: string) => void;
}

// Define props for sub-components
interface DocumentItemProps {
  readonly document: Document;
}

export function DocumentList({
  documents,
  viewMode,
  isLoading,
  selectedTags,
  onTagSelect,
  onRefresh,
  onSearch
}: Readonly<DocumentListProps>) { // Mark props as read-only
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Sort tags using localeCompare
  const allTags = React.useMemo(() => 
    Array.from(new Set(documents.flatMap(doc => doc.tags ?? []))) // Handle potentially undefined tags
         .sort((a, b) => a.localeCompare(b)), 
    [documents]
  );

  const handleTagClick = (tag: string) => { // Type already provided, but ensure filter callback has type
    if (selectedTags.includes(tag)) {
      onTagSelect(selectedTags.filter((t: string) => t !== tag)); // Add type for t
    } else {
      onTagSelect([...selectedTags, tag]);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Tag Sidebar */}
      <div className="w-full lg:w-64 bg-gray-800/50 backdrop-blur-sm p-4 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-700/50">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Document Tags</h3>
        <div className="flex flex-wrap lg:flex-col gap-2">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Tag className="w-3 h-3 mr-2" />
                <span>{tag}</span>
                {selectedTags.includes(tag) && (
                  <span className="ml-auto text-xs bg-blue-500 px-1.5 rounded-full">
                    {documents.filter(d => d.tags.includes(tag)).length}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} // Add type for e
              placeholder="Search documents..."
              className="w-full bg-gray-800/50 text-gray-100 rounded-lg pl-10 pr-10 py-2 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                aria-label="Clear search" // Add aria-label
              >
                <X size={18} />
              </button>
            )}
          </div>
        </form>

        {documents.length === 0 ? (
          <div className="text-center text-gray-400 mt-12">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No documents found</p>
          </div>
        ) : (
          // Extracted conditional rendering
          viewMode === 'grid' 
            ? <DocumentGrid documents={documents} /> 
            : <DocumentListItems documents={documents} />
        )}
      </div>
    </div>
  );
}

// Extracted Grid Component
function DocumentGrid({ documents }: { readonly documents: Document[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map(doc => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}

// Extracted List Component
function DocumentListItems({ documents }: { readonly documents: Document[] }) {
  return (
    <div className="space-y-2">
      {documents.map(doc => (
        <DocumentRow key={doc.id} document={doc} />
      ))}
    </div>
  );
}


function DocumentCard({ document }: Readonly<DocumentItemProps>) { // Use defined props interface
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 hover:bg-gray-800/70 transition-colors border border-gray-700/50">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-gray-100 truncate">{document.name}</h3>
            <p className="text-sm text-gray-400">
              {formatDistanceToNow(document.createdAt)} ago
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="text-gray-400 hover:text-gray-300" aria-label="Open document"> {/* Add aria-label */}
            <ExternalLink size={16} />
          </button>
          <button className="text-gray-400 hover:text-red-400" aria-label="Delete document"> {/* Add aria-label */}
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {document.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {document.tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-700/50 text-gray-300 border border-gray-600/50"
            >
              <Tag size={12} className="mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentRow({ document }: Readonly<DocumentItemProps>) { // Use defined props interface
  return (
    <div className="flex items-center justify-between bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 hover:bg-gray-800/70 transition-colors border border-gray-700/50">
      <div className="flex items-center space-x-3">
        <FileText className="w-5 h-5 text-blue-400" />
        <div>
          <h3 className="font-medium text-gray-100">{document.name}</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>{formatDistanceToNow(document.createdAt)} ago</span>
            {document.tags.length > 0 && (
              <>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  {document.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-700/50 border border-gray-600/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button className="p-2 text-gray-400 hover:text-gray-300 rounded" aria-label="Open document"> {/* Add aria-label */}
          <ExternalLink size={16} />
        </button>
        <button className="p-2 text-gray-400 hover:text-red-400 rounded" aria-label="Delete document"> {/* Add aria-label */}
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
