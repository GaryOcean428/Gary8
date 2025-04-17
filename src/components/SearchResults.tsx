import React, { useState } from 'react';
import { ExternalLink, Code, Search, FileText, Calendar, User, Star, Image, Newspaper, Book, Database } from 'lucide-react';
import { useSearch } from '../context/SearchContext';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from './ui/Badge';

interface SearchResultsProps {
  isStreaming: boolean;
  streamingPhase?: string;
}

export default function SearchResults({ isStreaming, streamingPhase }: SearchResultsProps) {
  const { results, isCached } = useSearch();
  const [expandedResultIds, setExpandedResultIds] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState<'all' | 'web' | 'images' | 'news' | 'academic'>('all');
  const [modalImage, setModalImage] = useState<string | null>(null);
  
  const toggleExpanded = (id: string) => {
    setExpandedResultIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getResultIcon = (type: string, url?: string) => {
    // Determine icon based on URL pattern or explicitly provided type
    if (type === 'code' || url?.includes('github.com')) {
      return <Code className="result-icon result-icon-code" />;
    } else if (type === 'document' || url?.endsWith('.pdf') || url?.includes('docs.')) {
      return <FileText className="result-icon result-icon-doc" />;
    } else if (url?.includes('scholar.') || url?.includes('academic') || type === 'academic') {
      return <Book className="result-icon result-icon-academic" />;
    } else if (url?.includes('news.') || url?.includes('nytimes') || url?.includes('bbc') || type === 'news') {
      return <Newspaper className="result-icon result-icon-news" />;
    } else if (type === 'image') {
      return <Image className="result-icon result-icon-image" />;
    } else if (type === 'database') {
      return <Database className="result-icon result-icon-database" />;
    } else {
      return <Search className="result-icon result-icon-web" />;
    }
  };

  // Get filtered results based on selected tab
  const getFilteredResults = () => {
    if (selectedTab === 'all') {
      return results;
    }
    
    return results.filter(result => {
      if (result.type === 'answer') return true;
      
      if (selectedTab === 'images' && result.type === 'image') return true;
      if (selectedTab === 'news' && (result.sourceType === 'news' || result.url?.includes('news'))) return true;
      if (selectedTab === 'academic' && (result.sourceType === 'academic' || result.url?.includes('scholar'))) return true;
      if (selectedTab === 'web' && result.type === 'source') return true;
      
      return false;
    });
  };

  // Helper to fetch favicon
  const getFavicon = (url?: string) => {
    if (!url) return null;
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  // Extract domain name from URL for display
  const getDomain = (url?: string) => {
    if (!url) return "";
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return "";
    }
  };

  const filteredResults = getFilteredResults();

  if (results.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Start searching to see results</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search result tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedTab('all')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            selectedTab === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
        >
          <Search className="w-3.5 h-3.5 inline-block mr-1" />
          <span>All Results</span>
        </button>
        
        <button
          onClick={() => setSelectedTab('web')}
          className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors ${
            selectedTab === 'web' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Web</span>
        </button>
        
        <button
          onClick={() => setSelectedTab('images')}
          className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors ${
            selectedTab === 'images' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          <span>Images</span>
        </button>
        
        <button
          onClick={() => setSelectedTab('news')}
          className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors ${
            selectedTab === 'news' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          <span>News</span>
        </button>
        
        <button
          onClick={() => setSelectedTab('academic')}
          className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors ${
            selectedTab === 'academic' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
        >
          <Book className="w-3.5 h-3.5" />
          <span>Academic</span>
        </button>
        
        {isCached && (
          <Badge variant="secondary" className="ml-auto" animation="none">
            Cached Results
          </Badge>
        )}
      </div>

      {/* Answer result (if present) */}
      {filteredResults.find(r => r.type === 'answer') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`card-elevated p-6 ${
            isStreaming ? 'streaming-cursor streaming-cursor-' + streamingPhase : ''
          }`}
        >
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>
              {filteredResults.find(r => r.type === 'answer')?.content || ''}
            </ReactMarkdown>
          </div>
          
          {filteredResults.find(r => r.type === 'answer')?.provider && (
            <div className="mt-3 flex items-center text-sm text-muted-foreground">
              <span>Source: {filteredResults.find(r => r.type === 'answer')?.provider}</span>
              
              {filteredResults.find(r => r.type === 'answer')?.warningNote && (
                <Badge variant="warning" className="ml-2">
                  {filteredResults.find(r => r.type === 'answer')?.warningNote}
                </Badge>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Source results */}
      <div className="space-y-4">
        {filteredResults
          .filter(result => result.type === 'source')
          .map((result, index) => (
            <motion.div
              key={`source-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="card-glass hover:card-elevated transition-all cursor-pointer"
              onClick={() => toggleExpanded(`source-${index}`)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getResultIcon(result.sourceType || 'web', result.url)}
                    <div>
                      <h3 className="text-lg font-medium">{result.title || 'Untitled Source'}</h3>
                      
                      {result.url && (
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          {getFavicon(result.url) && (
                            <img 
                              src={getFavicon(result.url) || ''} 
                              alt="" 
                              className="w-4 h-4 mr-1 rounded-sm"
                            />
                          )}
                          <span>{getDomain(result.url)}</span>
                          
                          {/* Metadata badges */}
                          <div className="flex ml-3 gap-2">
                            {result.timestamp && (
                              <span className="badge badge-secondary flex items-center gap-0.5">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {new Date(result.timestamp).toLocaleDateString()}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {result.url && (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary ml-2 p-1 rounded-full hover:bg-primary/10 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                </div>
                
                <div className={`mt-2 text-muted-foreground ${
                  expandedResultIds.has(`source-${index}`) ? '' : 'line-clamp-3'
                }`}>
                  {result.content}
                </div>
                
                {result.content?.length > 200 && !expandedResultIds.has(`source-${index}`) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(`source-${index}`);
                    }}
                    className="mt-1 text-primary hover:underline text-sm"
                  >
                    Show more
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        
        {/* Image results */}
        {filteredResults
          .filter(result => result.type === 'image')
          .length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-glass p-4"
            >
              <h3 className="font-medium mb-3 flex items-center">
                <Image className="w-4 h-4 mr-2" />
                Images
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredResults
                  .filter(result => result.type === 'image')
                  .map((result, index) => (
                    <div 
                      key={`image-${index}`}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => setModalImage(result.content)}
                    >
                      <img 
                        src={result.content} 
                        alt={result.title || 'Search result'} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                }
              </div>
            </motion.div>
          )
        }
      </div>
      
      {/* Image viewer modal */}
      <AnimatePresence>
        {modalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setModalImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-4xl max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <img 
                src={modalImage} 
                alt="Preview" 
                className="max-w-full max-h-[90vh] rounded-lg object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}