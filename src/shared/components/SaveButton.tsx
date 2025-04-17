import React from 'react';
import { Save } from 'lucide-react';
import { thoughtLogger } from '../../lib/logging/thought-logger';

interface SaveButtonProps {
  onSave: () => Promise<void>;
  isDirty: boolean;
}

export function SaveButton({ onSave, isDirty }: SaveButtonProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSave = async () => {
    if (!isDirty || isSaving) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      await onSave();
      thoughtLogger.log('success', 'Changes saved successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save changes';
      setError(message);
      thoughtLogger.log('error', 'Failed to save changes', { error: err });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleSave}
        disabled={!isDirty || isSaving}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isDirty
            ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        }`}
      >
        <Save className="w-4 h-4" />
        <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
      </button>
      
      {error && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-destructive text-destructive-foreground text-sm rounded-lg p-2">
          {error}
        </div>
      )}
    </div>
  );
}