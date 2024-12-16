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
    } catch (err) {
      console.error(`Failed to execute tool ${tool.id}:`, err);
      throw err;
    }
  }, []);

  return {
    tools,
    toggleTool,
    executeTool
  };
};
