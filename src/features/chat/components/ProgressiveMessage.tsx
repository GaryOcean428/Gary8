import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VirtualizedMessage } from './VirtualizedMessage';
import { needsVirtualization } from '../../../shared/utils/contentHelpers';

interface ProgressiveMessageProps {
  content: string;
  isLoading?: boolean;
  streamingPhase?: string;
  className?: string;
}

/**
 * Progressively renders content with intelligent chunking
 * Ensures readable blocks of content are rendered together
 */
export function ProgressiveMessage({ 
  content, 
  isLoading,
  streamingPhase,
  className = '' 
}: ProgressiveMessageProps) {
  // Track if message is being actively streamed
  const [isStreaming, setIsStreaming] = useState(false);
  // Content to show - may be full content or partial based on streaming state
  const [visibleContent, setVisibleContent] = useState(content);
  // Paragraphs completed flag to improve readability
  const [completedParagraph, setCompletedParagraph] = useState(true);
  
  // Previous content for change detection
  const prevContentRef = useRef('');
  // Last time content was updated
  const lastUpdateRef = useRef(Date.now());
  // Track if virtualization is needed for this content
  const needsVirtualizationRef = useRef(false);

  // Detect if streaming is happening by comparing current and previous content
  useEffect(() => {
    let streamingTimeout: number;
    
    const checkStreaming = () => {
      const currentLength = content.length;
      const prevLength = prevContentRef.current.length;
      const isCurrentlyStreaming = currentLength > prevLength;
      
      // Update last activity timestamp
      if (isCurrentlyStreaming) {
        lastUpdateRef.current = Date.now();
        setIsStreaming(true);
        // Finding usable content thresholds for better readability
        updateVisibleContent(content);
      } else if (isStreaming) {
        // Check if we've been idle for a while (streaming might have ended)
        const idleTime = Date.now() - lastUpdateRef.current;
        if (idleTime > 500) {
          setIsStreaming(false);
          setVisibleContent(content);
        }
      }
      
      // Check if content needs virtualization
      needsVirtualizationRef.current = needsVirtualization(content);
      
      prevContentRef.current = content;
    };
    
    checkStreaming();
    
    return () => {
      if (streamingTimeout) clearTimeout(streamingTimeout);
    };
  }, [content, isStreaming]);

  // Update visible content with usable thresholds for better UX
  const updateVisibleContent = useCallback((_fullContent: string) => {
    const paragraphs = _fullContent.split('\n\n');
    
    // Show all completed paragraphs and potentially the current one if it looks complete
    let usableContent = '';
    let newCompletedParagraph = false;
    
    if (paragraphs.length > 1) {
      // Always show completed paragraphs
      usableContent = paragraphs.slice(0, -1).join('\n\n');
      
      // Check if the last paragraph looks complete enough to show
      const lastParagraph = paragraphs[paragraphs.length - 1];
      
      // A paragraph is likely complete if it ends with sentence-ending punctuation
      // or if it's longer than a certain threshold
      const seemsComplete = /[.!?]\s*$/.test(lastParagraph) || 
                           lastParagraph.length > 80 ||
                           lastParagraph.includes('```') ||  // Code blocks
                           lastParagraph.includes('|'); // Tables
      
      if (seemsComplete) {
        usableContent += '\n\n' + lastParagraph;
        newCompletedParagraph = true;
      } else {
        newCompletedParagraph = false;
      }
    } else if (paragraphs.length === 1) {
      // Only one paragraph - use the entire content
      usableContent = _fullContent;
      newCompletedParagraph = false;
    }
    
    setVisibleContent(usableContent || _fullContent);
    setCompletedParagraph(newCompletedParagraph);
  }, []);
  
  // Determine the cursor style based on streaming phase
  const getCursorClass = useCallback(() => {
    if (!isLoading && !isStreaming) return '';
    
    const baseClass = 'streaming-cursor';
    if (!streamingPhase) return baseClass;
    
    switch (streamingPhase) {
      case 'searching':
        return `${baseClass} streaming-cursor-search`;
      case 'processing':
      case 'analyzing':
        return `${baseClass} streaming-cursor-process`;
      case 'thinking':
      case 'reasoning':
        return `${baseClass} streaming-cursor-reasoning`;
      default:
        return `${baseClass} streaming-cursor-final`;
    }
  }, [isLoading, isStreaming, streamingPhase]);

  return (
    <div className={`${className} ${getCursorClass()}`}>
      <VirtualizedMessage 
        content={visibleContent} 
        isStreaming={isStreaming}
      />
    </div>
  );
}