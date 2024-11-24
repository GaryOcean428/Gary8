'use client';

import { useState } from 'react';
import { Card, Button, Progress } from '@nextui-org/react';
import { Play, Pause, X, RotateCcw } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  agent: string;
}

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Active Tasks</h3>
        <Button
          color="primary"
          startContent={<Play className="w-4 h-4" />}
        >
          New Task
        </Button>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div 
            key={task.id}
            className="border rounded p-4"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{task.name}</span>
              <div className="flex gap-2">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onClick={() => {/* Toggle task */}}
                >
                  {task.status === 'running' ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onClick={() => {/* Retry task */}}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  onClick={() => {/* Cancel task */}}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Progress 
              value={task.progress} 
              className="mb-2"
              color={
                task.status === 'completed' ? 'success' :
                task.status === 'failed' ? 'danger' :
                'primary'
              }
            />
            <div className="flex justify-between text-sm">
              <span>{task.agent}</span>
              <span>{task.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
} 