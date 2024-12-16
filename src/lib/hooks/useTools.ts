import { useState, useCallback } from 'react';

interface Tool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export const useTools = () => {
  const [tools, setTools] = useState<Tool[]>([]);

  const toggleTool = useCallback((toolId: string) => {
    setTools((prev: Tool[]) => prev.map((tool: Tool) => 
      tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool
    ));
  }, []);

  return {
    tools,
    toggleTool
  };
};
