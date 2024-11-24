import { useState, useCallback } from 'react';
import { Tool } from '../tools/types';

// Example tools - these would typically come from a configuration or API
const defaultTools: Tool[] = [
  {
    id: 'search',
    name: 'Search',
    description: 'Search through documents and code',
    category: 'Document Tools'
  },
  {
    id: 'analyze',
    name: 'Analyze',
    description: 'Analyze code and provide insights',
    category: 'Code Tools'
  }
];

export function useTools() {
  const [tools] = useState<Tool[]>(defaultTools);

  const executeTool = useCallback((tool: Tool) => {
    // Implementation would depend on how tools should be executed
    console.log(`Executing tool: ${tool.name}`);
    // Add actual tool execution logic here
  }, []);

  return {
    tools,
    executeTool
  };
}
