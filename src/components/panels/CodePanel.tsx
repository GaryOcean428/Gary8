'use client';

import { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CodeAgent } from '@/lib/agents/code-agent';
import { DeepSeekService } from '@/lib/services/deepseek-service';
import { RAGPipeline } from '@/lib/rag/rag-pipeline';
import { ErrorReporting } from '@/lib/error/error-reporting';
import { MonitoringService } from '@/lib/monitoring/monitoring-service';
import { TestRunner } from '@/components/code/TestRunner';
import { CodeReview } from '@/components/code/CodeReview';
import { DeploymentMonitor } from '@/components/deployment/DeploymentMonitor';
import { thoughtLogger } from '@/lib/utils/logger';
import {
  Play,
  Save,
  GitBranch,
  Code,
  Terminal,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Layers,
  Search,
  Bug,
  CheckCircle
} from 'lucide-react';

interface CodePanelProps {
  onCodeExecute?: (code: string) => Promise<void>;
}

export function CodePanel({ onCodeExecute }: CodePanelProps) {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<'local' | 'codespace'>('local');
  const [activeTab, setActiveTab] = useState('editor');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Services
  const deepseek = DeepSeekService.getInstance();
  const rag = RAGPipeline.getInstance();
  const errorReporting = ErrorReporting.getInstance();
  const monitoring = MonitoringService.getInstance();

  useEffect(() => {
    monitoring.trackOperation('code_panel_init', async () => {
      // Initialize services and load any saved state
    });
  }, []);

  const handleExecuteCode = async () => {
    setIsExecuting(true);
    setOutput('Executing code...\n');

    try {
      // Track execution
      const result = await monitoring.trackOperation('code_execution', async () => {
        if (selectedEnvironment === 'local') {
          return await onCodeExecute?.(code);
        } else {
          return await deepseek.generateCode(code);
        }
      });

      setOutput(prev => prev + `\nExecution successful:\n${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      await errorReporting.reportError(error, {
        operation: 'code_execution',
        code,
        environment: selectedEnvironment,
        timestamp: Date.now()
      });
      setOutput(prev => prev + `\nError: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const results = await rag.process({
        query: searchQuery,
        type: 'code',
        filters: {
          language: 'typescript'
        }
      });

      setOutput(results.content);
    } catch (error) {
      await errorReporting.reportError(error, {
        operation: 'code_search',
        query: searchQuery,
        timestamp: Date.now()
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          <h3 className="font-semibold">Code Editor</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search code..."
              className="pl-8 h-8 rounded-md border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Select
            value={selectedEnvironment}
            onValueChange={(value: 'local' | 'codespace') => 
              setSelectedEnvironment(value)
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local</SelectItem>
              <SelectItem value="codespace">Codespace</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="default"
            size="sm"
            onClick={handleExecuteCode}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="flex-1 p-0">
          <Editor
            height="100%"
            defaultLanguage="typescript"
            value={code}
            onChange={value => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true
            }}
          />
        </TabsContent>

        <TabsContent value="output" className="flex-1 p-0">
          <ScrollArea className="h-full">
            <pre className="p-4 font-mono text-sm whitespace-pre-wrap">
              {output}
            </pre>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="review" className="flex-1 p-0">
          <CodeReview
            code={code}
            language="typescript"
            onApprove={() => {}}
            onReject={() => {}}
          />
        </TabsContent>

        <TabsContent value="tests" className="flex-1 p-0">
          <TestRunner
            code={code}
            onComplete={(results) => {
              thoughtLogger.info('Test results', { results });
            }}
          />
        </TabsContent>

        <TabsContent value="deployment" className="flex-1 p-0">
          <DeploymentMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
} 