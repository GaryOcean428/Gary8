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
      .catch(err => setError(err));
  }, [persistenceManager]);

  const saveChat = async (title: string, messages: Message[], tags?: string[]) => {
    try {
      return await persistenceManager.saveChat(title, messages, tags);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const saveWorkflow = async (workflow: any) => {
    try {
      return await persistenceManager.saveWorkflow(workflow);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const saveSettings = async (category: string, values: Record<string, any>) => {
    try {
      await persistenceManager.saveSettings(category, values);
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