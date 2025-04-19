import { useState, useEffect } from 'react';
import { PersistenceManager } from '../lib/storage/persistence-manager';
import type { Message } from '../types';

export function usePersistence() {
  const [persistenceManager] = useState(() => PersistenceManager.getInstance());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    persistenceManager.init()
      .then(() => setIsLoading(false))
      .catch(_err => setError(_err));
  }, [persistenceManager]);

  const saveChat = async (_title: string, _messages: Message[], _tags?: string[]) => {
    try {
      return await persistenceManager.saveChat(_title, _messages, _tags);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const saveWorkflow = async (_workflow: unknown) => {
    try {
      return await persistenceManager.saveWorkflow(_workflow);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const saveSettings = async (_category: string, _values: Record<string, unknown>) => {
    try {
      await persistenceManager.saveSettings(_category, _values);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    isLoading,
    error,
    persistenceManager,
    saveChat,
    saveWorkflow,
    saveSettings
  };
}