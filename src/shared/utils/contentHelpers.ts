/**
 * Content helpers for working with chat message content
 */

/**
 * Checks if content needs virtualization based on length
 * @param _content Message content
 * @param _threshold Threshold length (default: 10000 characters)
 */
export function needsVirtualization(_content: string, _threshold = 10000): boolean {
  return _content.length > _threshold;
}

/**
 * Intelligently splits content into blocks for virtualized rendering
 * @param _content Message content
 */
export function splitContentBlocks(_content: string): string[] {
  // Handle empty content
  if (!_content) return [];
  
  // Split by paragraphs for better readability
  const blocks = _content
    .split('\n\n')
    .filter(_block => _block.trim().length > 0);
    
  // Handle case where there are no proper paragraphs
  if (blocks.length === 0) {
    return [_content];
  }
  
  // Process code blocks specially to keep them intact
  const processedBlocks: string[] = [];
  let inCodeBlock = false;
  let currentBlock = '';
  
  for (const block of blocks) {
    // Check for code block markers
    const codeBlockMarkers = block.match(/```/g)?.length || 0;
    
    if (!inCodeBlock && codeBlockMarkers % 2 === 1) {
      // Start of code block
      inCodeBlock = true;
      currentBlock = block;
    } else if (inCodeBlock && codeBlockMarkers % 2 === 1) {
      // End of code block
      inCodeBlock = false;
      processedBlocks.push(currentBlock + '\n\n' + block);
      currentBlock = '';
    } else if (inCodeBlock) {
      // Continue code block
      currentBlock += '\n\n' + block;
    } else {
      // Regular paragraph
      processedBlocks.push(block);
    }
  }
  
  // Add any remaining code block
  if (currentBlock) {
    processedBlocks.push(currentBlock);
  }
  
  return processedBlocks;
}

/**
 * Gets block height estimate based on content characteristics
 */
export function estimateBlockHeight(_block: string): number {
  // Base height for any block
  let height = 24;
  
  // Count lines - each newline adds to height
  const lineCount = (_block.match(/\n/g) || []).length + 1;
  
  // Increase height for multi-line blocks
  if (lineCount > 1) {
    height += (lineCount - 1) * 20;
  }
  
  // Extra height for code blocks
  if (_block.includes('```')) {
    height += 40;
  }
  
  // Extra height for complex content like tables
  if (_block.includes('|') && _block.includes('-') && _block.includes('\n')) {
    height += 80;
  }
  
  // Increase height based on text length (approx chars per line)
  const charsPerLine = 60;
  const textLines = Math.ceil(_block.length / charsPerLine);
  if (textLines > lineCount) {
    height += (textLines - lineCount) * 20;
  }
  
  return height;
}

/**
 * Determines if content is actively streaming based on timestamps and changes
 */
export function isActivelyStreaming(
  _content: string,
  _prevContent: string,
  _lastUpdateTime: number,
  _maxIdleTime = 1000 // ms
): boolean {
  // Content is definitely still changing
  if (_content !== _prevContent) {
    return true;
  }
  
  // Content hasn't changed, but we haven't been idle long
  const now = Date.now();
  if (now - _lastUpdateTime < _maxIdleTime) {
    return true;
  }
  
  return false;
}