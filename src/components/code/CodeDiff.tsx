import { useEffect, useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Check,
  X,
  Copy,
  Download,
  GitPullRequest
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { DeploymentService } from '@/lib/services/deployment-service';

interface CodeDiffProps {
  original: string;
  modified: string;
  language?: string;
  onAccept?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}

export function CodeDiff({
  original,
  modified,
  language = 'typescript',
  onAccept,
  onReject,
  showActions = true
}: CodeDiffProps) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const deployment = DeploymentService.getInstance();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(modified);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreatePR = async () => {
    try {
      const prUrl = await deployment.createPullRequest(modified, {
        repository: process.env.NEXT_PUBLIC_GITHUB_REPO!,
        branch: 'main'
      });
      window.open(prUrl, '_blank');
    } catch (error) {
      console.error('Failed to create PR:', error);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b">
        <span className="font-medium">Code Changes</span>
        {showActions && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreatePR}
            >
              <GitPullRequest className="w-4 h-4" />
            </Button>
            {onAccept && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAccept}
                className="text-green-500"
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
            {onReject && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReject}
                className="text-red-500"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1">
        <DiffEditor
          original={original}
          modified={modified}
          language={language}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            readOnly: true,
            renderSideBySide: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            diffWordWrap: 'on'
          }}
        />
      </div>
    </Card>
  );
} 