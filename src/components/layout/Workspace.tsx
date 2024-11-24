import { useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { CanvasWorkspace } from '@/components/canvas/CanvasWorkspace';
import { ToolPanel } from '@/components/tools/ToolPanel';
import { AgentPanel } from '@/components/agents/AgentPanel';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { Toolbar } from '@/components/ui/Toolbar';

export function Workspace() {
  const [showAgents, setShowAgents] = useState(true);
  const [showTools, setShowTools] = useState(true);

  return (
    <div className="h-screen flex flex-col">
      <Toolbar />
      
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {showAgents && (
          <>
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <AgentPanel />
            </ResizablePanel>
            <ResizableHandle />
          </>
        )}

        <ResizablePanel defaultSize={60}>
          <CanvasWorkspace />
        </ResizablePanel>

        {showTools && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <ToolPanel />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <CommandPalette />
    </div>
  );
} 