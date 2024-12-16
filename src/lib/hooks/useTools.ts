import { useState, useCallback } from 'react';

import { Tool } from '../tools/types';

export const useTools = () => {
  const [tools, setTools] = useState<Tool[]>([]);

  const toggleTool = useCallback((toolId: string) => {
    setTools((prev: Tool[]) => prev.map((tool: Tool) => 
      tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool
    ));
  }, []);

  const executeTool = useCallback(async (tool: Tool): Promise => {
    try {
      console.log(`Executing tool: ${tool.id}`);
      // Add tool execution logic here
      return true;
    } catch (error) {
      console.error(`Failed to execute tool ${tool.id}:`, error);
      return false;
    }
  }, []);

  return {
    tools,
    toggleTool,
    executeTool
  };
};
