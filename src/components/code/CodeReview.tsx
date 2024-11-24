import { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeAgent } from '@/lib/agents/code-agent';
import { QualityAssuranceAgent } from '@/lib/agents/quality-assurance';
import { thoughtLogger } from '@/lib/utils/logger';
import {
  Check,
  AlertTriangle,
  X,
  MessageSquare,
  GitPullRequest,
  RefreshCw
} from 'lucide-react';

interface CodeReviewProps {
  code: string;
  language?: string;
  onApprove?: () => void;
  onReject?: () => void;
}

interface ReviewComment {
  line: number;
  type: 'error' | 'warning' | 'suggestion';
  message: string;
  fix?: string;
}

export function CodeReview({
  code,
  language = 'typescript',
  onApprove,
  onReject
}: CodeReviewProps) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [metrics, setMetrics] = useState({
    complexity: 0,
    maintainability: 0,
    testCoverage: 0
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [qaAgent] = useState(() => new QualityAssuranceAgent({
    name: 'qa-agent',
    capabilities: ['analysis', 'testing', 'validation']
  }));

  useEffect(() => {
    reviewCode();
  }, [code]);

  async function reviewCode() {
    setIsReviewing(true);
    try {
      // Perform code analysis
      const analysis = await qaAgent.validateCode(code);
      
      // Generate review comments
      const reviewComments = analysis.issues.map(issue => ({
        line: issue.line,
        type: issue.severity as 'error' | 'warning' | 'suggestion',
        message: issue.message,
        fix: issue.suggestion
      }));
      setComments(reviewComments);

      // Calculate metrics
      setMetrics({
        complexity: analysis.metrics.complexity,
        maintainability: analysis.metrics.maintainability,
        testCoverage: analysis.metrics.coverage
      });

      // Generate suggestions
      setSuggestions(analysis.suggestions);
    } catch (error) {
      thoughtLogger.error('Code review failed', { error });
    } finally {
      setIsReviewing(false);
    }
  }

  const getSeverityColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'suggestion': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">Code Review</h3>
          {isReviewing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <div className="flex gap-2">
              <Badge variant="outline" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                {comments.filter(c => c.type === 'error').length} Issues
              </Badge>
              <Badge variant="outline" className="gap-1">
                <MessageSquare className="w-3 h-3" />
                {suggestions.length} Suggestions
              </Badge>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {onApprove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onApprove}
              disabled={comments.some(c => c.type === 'error')}
              className="text-green-500"
            >
              <Check className="w-4 h-4 mr-1" />
              Approve
            </Button>
          )}
          {onReject && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReject}
              className="text-red-500"
            >
              <X className="w-4 h-4 mr-1" />
              Reject
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="issues" className="flex-1">
        <TabsList className="px-4">
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="flex-1 p-0">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="p-4 space-y-4">
              {comments.map((comment, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 mt-2 rounded-full ${getSeverityColor(comment.type)}`} />
                    <div>
                      <div className="font-medium">Line {comment.line}</div>
                      <div className="text-sm text-muted-foreground">{comment.message}</div>
                      {comment.fix && (
                        <div className="mt-2 p-2 bg-muted rounded-md">
                          <code className="text-sm">{comment.fix}</code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="metrics" className="p-4">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium">Complexity Score</div>
              <div className="text-2xl">{metrics.complexity}/10</div>
            </div>
            <div>
              <div className="text-sm font-medium">Maintainability Index</div>
              <div className="text-2xl">{metrics.maintainability}/100</div>
            </div>
            <div>
              <div className="text-sm font-medium">Test Coverage</div>
              <div className="text-2xl">{metrics.testCoverage}%</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="p-4">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-4">
              {suggestions.map((suggestion, i) => (
                <div key={i} className="p-4 bg-muted rounded-lg">
                  <div className="text-sm">{suggestion}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
} 