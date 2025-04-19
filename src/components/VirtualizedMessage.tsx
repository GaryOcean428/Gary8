import React, { useMemo, useRef, useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import ReactMarkdown from 'react-markdown';
import throttle from 'lodash.throttle';
import { splitContentBlocks, estimateBlockHeight } from '../lib/utils/contentHelpers';

interface VirtualizedMessageProps {
  content: string;
  maxHeight?: number;
  className?: string;
  isStreaming?: boolean;
}

/**
 * Virtualized message component for efficiently rendering long messages
 * Uses react-window to only render visible content for improved performance
 */
export function VirtualizedMessage({ 
  content, 
  maxHeight = 400, 
  className = '',
  isStreaming = false
}: VirtualizedMessageProps) {
  // Determine if virtualization is needed based on content length and streaming state
  const shouldVirtualize = content.length > 10000 && !isStreaming;
  const [listWidth, setListWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Update width on resize
  useEffect(() => {
    if (!shouldVirtualize || !containerRef.current) return;
    
    setListWidth(containerRef.current.clientWidth);
    
    const handleResize = throttle(() => {
      if (containerRef.current) {
        setListWidth(containerRef.current.clientWidth);
      }
    }, 100);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [shouldVirtualize]);
  
  // Split content into blocks for virtualization
  const blocks = useMemo(() => {
    if (!shouldVirtualize) return [];
    return splitContentBlocks(content);
  }, [content, shouldVirtualize]);
  
  // Calculate average block height for virtualization
  const itemHeight = useMemo(() => {
    if (blocks.length === 0) return 40;
    
    // Sample up to 10 blocks to estimate average height
    const samplesToTake = Math.min(10, blocks.length);
    let totalHeight = 0;
    
    for (let i = 0; i < samplesToTake; i++) {
      const blockIndex = Math.floor(i * (blocks.length / samplesToTake));
      totalHeight += estimateBlockHeight(blocks[blockIndex]);
    }
    
    return Math.max(40, Math.ceil(totalHeight / samplesToTake));
  }, [blocks]);
  
  // Calculate list height
  const listHeight = useMemo(() => {
    if (!shouldVirtualize) return 'auto';
    return Math.min(maxHeight, blocks.length * itemHeight);
  }, [blocks.length, maxHeight, itemHeight, shouldVirtualize]);
  
  // Component to render each virtualized item
  const Row = useMemo(() => {
    // Throttle to prevent too many rerenders during scrolling
    return throttle(({ index, style }: { index: number; style: React.CSSProperties }) => (
      <div className={`px-1 py-1 ${className}`} style={style}>
        <ReactMarkdown>{blocks[index]}</ReactMarkdown>
      </div>
    ), 50);
  }, [blocks]);
  
  if (!shouldVirtualize) {
    // Render normally for shorter content
    return (
      <div className={`prose prose-invert max-w-none ${className}`}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className={className} ref={containerRef}>
      {listWidth > 0 && (
        <List
          height={typeof listHeight === 'number' ? listHeight : 400}
          width={listWidth}
          itemCount={blocks.length}
          itemSize={itemHeight}
          overscanCount={5} // Render extra items for smoother scrolling
          className="prose prose-invert max-w-none"
        >
          {Row}
        </List>
      )}
    </div>
  );
}
