import { useState, useCallback, useEffect } from 'react';
import { CodespaceClient } from '../lib/github/codespace-client';
import { useToast } from './useToast';

export function useCodespace() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [codespaceInfo, setCodespaceInfo] = useState<any>(null);
  const { addToast } = useToast();
  const client = CodespaceClient.getInstance();

  const checkAvailability = useCallback(async () => {
    setIsLoading(true);
    try {
      const available = await client.verifyCodespaceAccess();
      setIsAvailable(available);
      
      if (available) {
        const info = await client.getCurrentCodespaceInfo();
        setCodespaceInfo(info);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Codespace Error',
        message: error instanceof Error ? error.message : 'Failed to check Codespace availability'
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const syncWithRepository = useCallback(async () => {
    if (!isAvailable) return;

    setIsLoading(true);
    try {
      await client.syncWithRepository();
      addToast({
        type: 'success',
        title: 'Sync Complete',
        message: 'Successfully synced with repository'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Sync Failed',
        message: error instanceof Error ? error.message : 'Failed to sync with repository'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, addToast]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  return {
    isAvailable,
    isLoading,
    codespaceInfo,
    syncWithRepository,
    checkAvailability
  };
}