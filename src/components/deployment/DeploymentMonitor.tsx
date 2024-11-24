import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DeploymentService } from '@/lib/services/deployment-service';
import { thoughtLogger } from '@/lib/utils/logger';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GitBranch,
  GitPullRequest,
  Server,
  Clock
} from 'lucide-react';

interface DeploymentStatus {
  id: string;
  status: 'pending' | 'running' | 'success' | 'failure';
  environment: string;
  branch: string;
  startTime: number;
  endTime?: number;
  logs: string[];
  error?: string;
  url?: string;
}

export function DeploymentMonitor() {
  const [deployments, setDeployments] = useState<DeploymentStatus[]>([]);
  const [activeDeployment, setActiveDeployment] = useState<string | null>(null);
  const deployment = DeploymentService.getInstance();

  useEffect(() => {
    const interval = setInterval(fetchDeploymentStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDeploymentStatus() {
    try {
      const statuses = await deployment.getDeploymentStatuses();
      setDeployments(statuses);
      
      const active = statuses.find(s => s.status === 'running');
      if (active) {
        setActiveDeployment(active.id);
      }
    } catch (error) {
      thoughtLogger.error('Failed to fetch deployment status', { error });
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failure':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const formatDuration = (start: number, end?: number) => {
    const duration = (end || Date.now()) - start;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5" />
          <h3 className="font-semibold">Deployments</h3>
        </div>
        <div className="flex gap-2">
          {deployments.some(d => d.status === 'running') && (
            <Badge variant="outline" className="animate-pulse">
              Deployment in Progress
            </Badge>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {deployments.map((deployment) => (
            <Card key={deployment.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(deployment.status)}
                    <span className="font-medium">
                      Deployment to {deployment.environment}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <GitBranch className="w-4 h-4" />
                      {deployment.branch}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(deployment.startTime, deployment.endTime)}
                    </div>
                  </div>
                </div>
                {deployment.url && (
                  <a
                    href={deployment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    View Deployment
                  </a>
                )}
              </div>

              {deployment.status === 'running' && (
                <Progress
                  value={45}
                  className="mt-4"
                />
              )}

              {deployment.logs.length > 0 && (
                <div className="mt-4">
                  <ScrollArea className="h-32 rounded-md border bg-muted p-2">
                    <pre className="text-xs font-mono">
                      {deployment.logs.join('\n')}
                    </pre>
                  </ScrollArea>
                </div>
              )}

              {deployment.error && (
                <div className="mt-4 p-2 rounded-md bg-red-500/10 text-red-500 text-sm">
                  {deployment.error}
                </div>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
} 