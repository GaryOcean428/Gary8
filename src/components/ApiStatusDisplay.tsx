import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, Loader, Server, RefreshCw } from 'lucide-react';
import { useConfigStore } from '../lib/config';
import { APIClient } from '../lib/api-client';
import { motion } from 'framer-motion';
import { getNetworkStatus, testSupabaseConnection } from '../core/supabase/supabase-client';

type StatusType = 'checking' | 'connected' | 'disconnected';

export function ApiStatusDisplay() {
  const configStore = useConfigStore();
  const [apiStatus, setApiStatus] = useState<StatusType>('checking');
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [failedProviders, setFailedProviders] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<StatusType>('checking');
  const [networkStatus, setNetworkStatus] = useState<boolean>(getNetworkStatus());
  const [edgeFunctionsStatus, setEdgeFunctionsStatus] = useState<StatusType>('checking');
  const [edgeFunctionDetails, setEdgeFunctionDetails] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const apiClient = APIClient.getInstance();

  // --- Refactored Helper Functions ---

  const checkSupabaseStatus = async (): Promise<boolean> => {
    setSupabaseStatus('checking');
    const isConnected = await testSupabaseConnection();
    setSupabaseStatus(isConnected ? 'connected' : 'disconnected');
    return isConnected;
  };

  const checkEdgeFunctionsStatus = async (): Promise<boolean> => {
    setEdgeFunctionsStatus('checking');
    try {
      const edgeFunctionStatuses = await apiClient.getEdgeFunctionStatuses();
      console.log('Edge Function Statuses:', edgeFunctionStatuses);
      setEdgeFunctionDetails(edgeFunctionStatuses);
      const anyFunctionWorking = Object.values(edgeFunctionStatuses).some(_status => _status);
      setEdgeFunctionsStatus(anyFunctionWorking ? 'connected' : 'disconnected');
      return anyFunctionWorking;
    } catch (error) {
      console.error('Edge Function check failed:', error);
      setEdgeFunctionsStatus('disconnected');
      return false;
    }
  };

  const checkApiProviders = async (): Promise<boolean> => {
    // Assuming apiKeys is Record<string, string | undefined | null>
    const apiKeys = configStore.getState().apiKeys as Record<string, string | undefined | null>;
    // Fix: Access key by index for type predicate
    const providersWithKeys = Object.entries(apiKeys)
      .filter((_entry): _entry is [string, string] => typeof _entry[1] === 'string' && _entry[1].trim().length > 10) 
      .map(([provider]) => provider);

    if (providersWithKeys.length === 0) {
      setApiStatus('disconnected');
      setError('No API keys configured. Please add at least one API key in settings.');
      return false;
    }

    try {
      const connectedProvs: string[] = [];
      const failedProvs: Record<string, string> = {};

      for (const provider of providersWithKeys) {
        try {
          console.log(`Testing connection for provider: ${provider}`);
          // testConnection returns { success: boolean; message?: string; error?: string }
          const raw = await apiClient.testConnection(provider);
          const result = raw as { success: boolean; message?: string; error?: string };
          if (result.success) {
            connectedProvs.push(provider);
            console.log(`✅ Provider ${provider} connected successfully`);
          } else {
            const errorMessage = result.message || result.error || 'Unknown connection error';
            failedProvs[provider] = errorMessage;
            console.error(`❌ Provider ${provider} connection failed:`, errorMessage);
          }
        } catch (providerError: unknown) {
          failedProvs[provider] = providerError instanceof Error
            ? providerError.message
            : 'Connection test failed';
          console.error(`❌ Provider ${provider} test threw error:`, providerError);
        }
      }

      setConnectedProviders(connectedProvs);
      setFailedProviders(failedProvs);

      if (connectedProvs.length > 0) {
        setApiStatus('connected');
        return true;
      } else {
        setApiStatus('disconnected');
        setError('Could not connect to any API providers with the configured keys.');
        return false;
      }
    } catch (error) {
      console.error('API provider checks failed:', error);
      setApiStatus('disconnected');
      setError(error instanceof Error ? error.message : String(error));
      return false;
    }
  };

  // --- Main Status Check Function ---

  const checkApiStatus = async () => {
    setIsRefreshing(true);
    try {
      setApiStatus('checking'); // Reset API status at the beginning
      setError(null); // Clear previous errors
      setConnectedProviders([]); // Reset provider lists
      setFailedProviders({});
      setEdgeFunctionDetails({}); // Reset edge function details

      // 1. Check Network
      const isOnline = getNetworkStatus();
      setNetworkStatus(isOnline);
      if (!isOnline) {
        setError('Network connection unavailable. Please check your internet connection.');
        setApiStatus('disconnected');
        setSupabaseStatus('disconnected');
        setEdgeFunctionsStatus('disconnected');
        return; // Stop checks if offline
      }

      // 2. Check Supabase (Database)
      await checkSupabaseStatus();

      // 3. Check Edge Functions
      await checkEdgeFunctionsStatus();

      // 4. Check API Providers (only sets apiStatus and related states)
      await checkApiProviders();

    } catch (error) {
      console.error('Uncaught error in checkApiStatus:', error);
      setError('An unexpected error occurred while checking connections');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkApiStatus();
    
    // Set up network status monitoring
    const handleOnline = () => {
      setNetworkStatus(true);
      checkApiStatus(); // Recheck everything when we come back online
    };
    
    const handleOffline = () => {
      setNetworkStatus(false);
      setApiStatus('disconnected');
      setSupabaseStatus('disconnected');
      setError('Network connection lost. Please check your internet connection.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Re-check API status when API keys change
    // Assuming state type has apiKeys: Record<string, string | undefined | null>
    type ApiKeysState = { apiKeys: Record<string, string | undefined | null> }; 
    const unsubscribe = useConfigStore.subscribe(
      (_state: ApiKeysState) => _state.apiKeys, // Add type to state
      () => checkApiStatus(),
      { 
        equalityFn: (_a: Record<string, string | undefined | null> | undefined, _b: Record<string, string | undefined | null> | undefined) => 
          JSON.stringify(_a) === JSON.stringify(_b) // Add types to a, b
      }
    );
    
    // Periodic check for status changes
    const intervalId = setInterval(() => {
      if (getNetworkStatus() !== networkStatus) {
        setNetworkStatus(getNetworkStatus());
        checkApiStatus();
      }
    }, 10000);
    
    return () => {
      unsubscribe();
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Keep dependencies minimal for initial load and setup

  // Display status icon based on API connection state
  const getStatusIcon = (_status: StatusType) => { // Use StatusType
    switch (_status) {
      case 'checking':
        return <Loader size={16} className="text-primary animate-spin" />;
      case 'connected':
        return <CheckCircle size={16} className="text-success" />;
      case 'disconnected':
        return <XCircle size={16} className="text-destructive" />;
    }
  };

  // Helper to get status text and class (addresses nested ternary warnings)
  const getStatusTextAndClass = (_status: StatusType): { text: string; className: string } => {
    switch (_status) {
      case 'checking':
        return { text: 'Checking...', className: 'text-muted-foreground' };
      case 'connected':
        return { text: 'Connected', className: 'text-success' };
      case 'disconnected':
        return { text: 'Disconnected', className: 'text-destructive' };
    }
  };

  // Helper to render status item (addresses nested ternary warnings)
  const renderStatusItem = (_label: string, _status: StatusType) => {
    const { text, className } = getStatusTextAndClass(_status);
    return (
      <div className="flex items-center justify-between mb-3 p-2 rounded-md bg-muted/30">
        <span className="text-sm">{_label}</span>
        <div className="flex items-center gap-1.5">
          {getStatusIcon(_status)}
          <span className={`text-xs ${className}`}>{text}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-lg p-4 bg-card/50 backdrop-blur-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          <h3 className="font-medium">Connection Status</h3>
        </div>
        <button 
          onClick={() => checkApiStatus()} 
          disabled={isRefreshing}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh connection status"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
        </button>
      </div>
      
      {/* Network Status */}
      <div className="flex items-center justify-between mb-3 p-2 rounded-md bg-muted/30">
        <span className="text-sm">Network Connection</span>
        <div className="flex items-center gap-1.5">
          {networkStatus ? 
            <CheckCircle size={16} className="text-success" /> : 
            <XCircle size={16} className="text-destructive" />
          }
          <span className={`text-xs ${networkStatus ? 'text-success' : 'text-destructive'}`}>
            {networkStatus ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      
      {/* Supabase Status */}
      {renderStatusItem("Database Connection", supabaseStatus)}
      
      {/* Edge Functions Status */}
      {renderStatusItem("Edge Functions", edgeFunctionsStatus)}
      
      {/* Edge Functions Details (collapsible) */}
      {Object.keys(edgeFunctionDetails).length > 0 && (
        <div className="mb-3 p-2 rounded-md bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Edge Function Details</span>
          </div>
          <div className="mt-2 space-y-1">
            {Object.entries(edgeFunctionDetails).map(([name, status]) => {
              const statusText = status ? 'Working' : 'Failed';
              const statusClass = status ? 'text-success' : 'text-destructive';
              const StatusIcon = status ? CheckCircle : XCircle;
              return (
                <div key={name} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{name}</span>
                  <div className="flex items-center gap-1">
                    <StatusIcon size={12} className={statusClass} />
                    <span className={statusClass}>{statusText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* API Status */}
      {renderStatusItem("API Services", apiStatus)}
      
      {/* API Provider Details */}
      {(connectedProviders.length > 0 || Object.keys(failedProviders).length > 0) && (
        <div className="mb-3 p-2 rounded-md bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">API Provider Details</span>
          </div>
          <div className="mt-2 space-y-1">
            {connectedProviders.map((_provider: string) => ( 
              <div key={_provider} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{_provider.charAt(0).toUpperCase() + _provider.slice(1)}</span>
                <div className="flex items-center gap-1">
                  <CheckCircle size={12} className="text-success" />
                  <span className="text-success">Connected</span>
                </div>
              </div>
            ))}
            
            {Object.entries(failedProviders).map((_entry) => {
              // Fix: Assert entry type here
              const [provider, errorMsg] = _entry as [string, string]; 
              return (
                <div key={provider} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{provider.charAt(0).toUpperCase() + provider.slice(1)}</span>
                  <div className="flex items-center gap-1">
                    <XCircle size={12} className="text-destructive" />
                    <span className="text-destructive" title={errorMsg}>Failed</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-destructive flex items-start gap-1.5 bg-destructive/10 rounded-md p-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      {/* Status Summary */}
      <div className="mt-3">
        {apiStatus === 'connected' && (
          <>
            <p className="text-xs text-muted-foreground mb-1">Connected with:</p>
            <div className="flex flex-wrap gap-1.5">
              {edgeFunctionsStatus === 'connected' && (
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-success/10 text-success border border-success/20"
                >
                  <Server size={12} className="mr-1" />
                  Edge Functions
                </motion.span>
              )}
              {connectedProviders.map((_provider: string) => ( 
                <motion.span 
                  key={_provider}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-success/10 text-success border border-success/20"
                >
                  <CheckCircle size={12} className="mr-1" />
                  {_provider.charAt(0).toUpperCase() + _provider.slice(1)}
                </motion.span>
              ))}
            </div>
          </>
        )}
        
        {apiStatus === 'disconnected' && (
          <div className="mt-2">
            <p className="text-sm">
              <a href="#/settings" className="text-primary hover:underline">
                Check API settings
              </a>
              {' '}to troubleshoot connection issues
            </p>
          </div>
        )}
        
        {(!networkStatus || apiStatus === 'disconnected') && (
          <div className="mt-3 bg-muted/30 p-2 rounded-md">
            <div className="mt-2 text-xs text-muted-foreground">
              <p className="font-medium">Troubleshooting:</p>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Check your internet connection</li>
                <li>Verify API keys are correctly entered</li>
                <li>Try using direct API connections (disable Edge Functions in settings)</li>
                <li>Check API credits/quotas for your providers</li>
                {networkStatus && <li>Try refreshing the page</li>}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
