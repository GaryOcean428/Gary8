import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { QualityAssuranceAgent } from '@/lib/agents/quality-assurance';
import { thoughtLogger } from '@/lib/utils/logger';
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}

interface TestRunnerProps {
  code: string;
  tests?: string;
  onComplete?: (results: TestResult[]) => void;
}

export function TestRunner({
  code,
  tests,
  onComplete
}: TestRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [qaAgent] = useState(() => new QualityAssuranceAgent({
    name: 'test-runner',
    capabilities: ['testing', 'validation']
  }));

  const runTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);

    try {
      // Generate tests if not provided
      const testCode = tests || await qaAgent.generateTests(code);
      
      // Run tests
      const testResults = await qaAgent.runTests(code, testCode);
      setResults(testResults);
      
      if (onComplete) {
        onComplete(testResults);
      }
    } catch (error) {
      thoughtLogger.error('Test execution failed', { error });
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'skipped': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'skipped':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const summary = {
    total: results.length,
    passed: results.filter(r => r.status === 'passed').length,
    failed: results.filter(r => r.status === 'failed').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    duration: results.reduce((acc, r) => acc + r.duration, 0)
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">Test Runner</h3>
          {!isRunning && results.length > 0 && (
            <div className="flex gap-2">
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="w-3 h-3" />
                {summary.passed} Passed
              </Badge>
              <Badge variant="outline" className="gap-1">
                <XCircle className="w-3 h-3" />
                {summary.failed} Failed
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" />
                {(summary.duration / 1000).toFixed(2)}s
              </Badge>
            </div>
          )}
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={runTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Run Tests
        </Button>
      </div>

      {isRunning && (
        <div className="p-4 border-b">
          <Progress value={progress} className="w-full" />
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {results.map((result, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon status={result.status} />
                  <span className="font-medium">{result.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {result.duration}ms
                </span>
              </div>
              {result.error && (
                <div className="p-2 bg-red-500/10 rounded-md">
                  <code className="text-sm text-red-500">{result.error}</code>
                </div>
              )}
              {result.coverage && (
                <div className="grid grid-cols-4 gap-4 mt-2">
                  <div>
                    <div className="text-sm font-medium">Statements</div>
                    <div className="text-sm">{result.coverage.statements}%</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Branches</div>
                    <div className="text-sm">{result.coverage.branches}%</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Functions</div>
                    <div className="text-sm">{result.coverage.functions}%</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Lines</div>
                    <div className="text-sm">{result.coverage.lines}%</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
} 