import { useEffect, useState } from 'react';
import { Loader2, Wifi, WifiOff, GitBranch, Users } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface StatusBarProps {
  position?: { x: number; y: number };
  connected?: boolean;
  collaborators?: number;
  saving?: boolean;
  branch?: string;
}

export function StatusBar({
  position = { x: 0, y: 0 },
  connected = true,
  collaborators = 0,
  saving = false,
  branch = 'main'
}: StatusBarProps) {
  const [showSaved, setShowSaved] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (saving) {
      setShowSaved(false);
    } else {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [saving]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-8 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t flex items-center px-4 text-sm text-muted-foreground">
      <div className="flex-1 flex items-center gap-4">
        <div className="flex items-center gap-1">
          <GitBranch className="w-4 h-4" />
          {branch}
        </div>

        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {collaborators} online
        </div>

        <div className="flex items-center gap-1">
          {connected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : showSaved ? (
            <span className="text-green-500">Saved</span>
          ) : null}
        </div>

        <div>
          {position.x}, {position.y}
        </div>
      </div>
    </div>
  );
} 