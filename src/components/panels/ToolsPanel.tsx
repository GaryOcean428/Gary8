'use client';

import { Tabs, Tab } from "@nextui-org/react";
import { Tool } from "@/lib/tools/types";
import { useTools } from "@/lib/hooks/useTools";

export function ToolsPanel() {
  const { tools, executeTool } = useTools();

  const categories = Array.from(
    new Set(tools.map((tool: Tool) => tool.category))
  ) as string[];

  return (
    <div className="h-full w-full p-4">
      <h2 className="text-2xl font-bold mb-4">Tools</h2>
      <Tabs>
        {categories.map((category: string) => (
          <Tab key={category} title={category}>
            <div className="grid gap-4">
              {tools
                .filter((tool: Tool) => tool.category === category)
                .map((tool: Tool) => (
                  <ToolCard key={tool.id} tool={tool} onExecute={executeTool} />
                ))}
            </div>
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}

function ToolCard({ tool, onExecute }: { tool: Tool; onExecute: (tool: Tool) => void }) {
  return (
    <div className="p-4 border rounded-lg bg-card hover:bg-card/80 transition-colors cursor-pointer"
         onClick={() => onExecute(tool)}>
      <h3 className="font-semibold">{tool.name}</h3>
      <p className="text-sm text-muted-foreground">{tool.description}</p>
    </div>
  );
}
