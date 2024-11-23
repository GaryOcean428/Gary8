'use client';

import { useState } from 'react';
import { Card, Button, Input } from '@nextui-org/react';
import { Play, Pause, Settings, Monitor } from 'lucide-react';

export function AgentPanel() {
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Agent Control</h2>
        <div className="flex gap-2">
          <Button 
            color="primary"
            startContent={<Play className="w-4 h-4" />}
          >
            Start All
          </Button>
          <Button 
            color="danger"
            startContent={<Pause className="w-4 h-4" />}
          >
            Pause All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Orchestrator Agent */}
        <Card className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">Orchestrator</h3>
              <p className="text-sm text-gray-500">Task Planning & Coordination</p>
            </div>
            <Button isIconOnly variant="light">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Status: Active</span>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
            <div className="text-sm">Tasks: 3 running</div>
          </div>
        </Card>

        {/* WebSurfer Agent */}
        <Card className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">WebSurfer</h3>
              <p className="text-sm text-gray-500">Web Interaction & Research</p>
            </div>
            <Button isIconOnly variant="light">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Status: Ready</span>
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
            <div className="text-sm">Sessions: 1 active</div>
          </div>
        </Card>

        {/* Coder Agent */}
        <Card className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">Coder</h3>
              <p className="text-sm text-gray-500">Code Analysis & Generation</p>
            </div>
            <Button isIconOnly variant="light">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Status: Ready</span>
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
            <div className="text-sm">Files: 2 monitored</div>
          </div>
        </Card>
      </div>

      {/* Live Monitor */}
      <Card className="p-4 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Live Activity</h3>
          <Button 
            variant="light"
            startContent={<Monitor className="w-4 h-4" />}
          >
            Expand
          </Button>
        </div>
        <div className="h-64 overflow-auto bg-black/10 rounded-lg p-4">
          <pre className="text-sm font-mono">
            {`[Orchestrator] Planning task sequence...
[WebSurfer] Accessing documentation...
[Coder] Analyzing repository structure...
[Orchestrator] Coordinating with WebSurfer...`}
          </pre>
        </div>
      </Card>
    </div>
  );
}