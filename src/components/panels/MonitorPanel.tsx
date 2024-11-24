'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Progress } from '@nextui-org/react';
import { 
  Activity, 
  Cpu, 
  Database, 
  Memory, 
  AlertCircle,
  CheckCircle2,
  Clock,
  HardDrive
} from 'lucide-react';

export function MonitorPanel() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [logs, setLogs] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Monitor</h2>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant={selectedTimeframe === '1h' ? 'solid' : 'light'}
            onClick={() => setSelectedTimeframe('1h')}
          >
            1h
          </Button>
          <Button 
            size="sm"
            variant={selectedTimeframe === '24h' ? 'solid' : 'light'}
            onClick={() => setSelectedTimeframe('24h')}
          >
            24h
          </Button>
          <Button 
            size="sm"
            variant={selectedTimeframe === '7d' ? 'solid' : 'light'}
            onClick={() => setSelectedTimeframe('7d')}
          >
            7d
          </Button>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4" />
            <h3 className="font-semibold">CPU Usage</h3>
          </div>
          <Progress 
            value={45} 
            className="mb-2"
            color="primary"
          />
          <span className="text-sm">45% utilized</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4" />
            <h3 className="font-semibold">Memory</h3>
          </div>
          <Progress 
            value={60} 
            className="mb-2"
            color="secondary"
          />
          <span className="text-sm">3.2GB / 8GB</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4" />
            <h3 className="font-semibold">Storage</h3>
          </div>
          <Progress 
            value={25} 
            className="mb-2"
            color="success"
          />
          <span className="text-sm">25% used</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4" />
            <h3 className="font-semibold">Network</h3>
          </div>
          <Progress 
            value={30} 
            className="mb-2"
            color="warning"
          />
          <span className="text-sm">3MB/s</span>
        </Card>
      </div>

      {/* Agent Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Agent Status</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Orchestrator</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span>WebSurfer</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>Coder</span>
            </div>
          </div>
        </div>
      </Card>

      {/* System Logs */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Logs</h3>
        <div className="h-96 overflow-auto bg-black/10 rounded-lg p-4">
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-gray-500">
                  {new Date().toISOString()}
                </span>
                <span className={`
                  px-2 py-0.5 rounded text-xs
                  ${i % 3 === 0 ? 'bg-green-500/20 text-green-700' : 
                    i % 3 === 1 ? 'bg-yellow-500/20 text-yellow-700' : 
                    'bg-red-500/20 text-red-700'}
                `}>
                  {i % 3 === 0 ? 'INFO' : i % 3 === 1 ? 'WARN' : 'ERROR'}
                </span>
                <span>
                  {i % 3 === 0 ? 'Task completed successfully' :
                   i % 3 === 1 ? 'Resource usage high' :
                   'Failed to connect to external service'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
} 