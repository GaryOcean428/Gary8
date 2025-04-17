import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, Loader, Server, RefreshCw } from 'lucide-react';
import { useConfigStore } from '../lib/config';
import { APIClient } from '../lib/api-client';
import { motion } from 'framer-motion';
import { getNetworkStatus, testSupabaseConnection } from '../core/supabase/supabase-client';

export function ApiStatusDisplay() {
  const configStore = useConfigStore();
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [failedProviders, setFailedProviders] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [networkStatus, setNetworkStatus] = useState<boolean>(getNetworkStatus());
  const [edgeFunctionsStatus, setEdgeFunctionsStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [edgeFunctionDetails, setEdgeFunctionDetails] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const apiClient = APIClient.getInstance();

  const checkApiStatus = async () => {
    try {
      setApiStatus('checking');
      setError(null);
      setConnectedProviders([]);
      setFailedProviders({});
      setIsRefreshing(true);
      
      // First check network connectivity
      const isOnline = getNetworkStatus();
      setNetworkStatus(isOnline);
      
      if (!isOnline) {
        setApiStatus('disconnected');
        setSupabaseStatus('disconnected');
        setEdgeFunctionsStatus('disconnected');
        setError('Network connection unavailable. Please check your internet connection.');
        return;
      }
      
      // Check Supabase connection
      setSupabaseStatus('checking');
      const isSupabaseConnected = await testSupabaseConnection();
      setSupabaseStatus(isSupabaseConnected ? 'connected' : 'disconnected');
      
      // Check Edge Functions
      setEdgeFunctionsStatus('checking');
      try {
        const edgeFunctionStatuses = await apiClient.getEdgeFunctionStatuses();
        console.log('Edge Function Statuses:', edgeFunctionStatuses);
        setEdgeFunctionDetails(edgeFunctionStatuses);
        
        // If any edge function is working, consider it connected
        const anyFunctionWorking = Object.values(edgeFunctionStatuses).some(status => status);
        setEdgeFunctionsStatus(anyFunctionWorking ? 'connected' : 'disconnected');
      } catch (error) {
        console.error('Edge Function check failed:', error);
        setEdgeFunctionsStatus('disconnected');
      }
      
      // Check API providers
      const apiKeys = configStore.getState().apiKeys;
      const providersWithKeys = Object.entries(apiKeys)
        .filter(([_, key]) => key && key.trim().length > 10)
        .map(([provider]) => provider);
        
      if (providersWithKeys.length === 0) {
        setApiStatus('disconnected');
        setError('No API keys configured. Please add at least one API key in settings.');
        return;
      }
        
      // Test each provider with a key
      try {
        const connectedProvs = [];
        const failedProvs: Record<string, string> = {};
        
        for (const provider of providersWithKeys) {
          try {
            console.log(`Testing connection for provider: ${provider}`);
            const result = await apiClient.testConnection(provider);
            
            if (result.success) {
              connectedProvs.push(provider);
              console.log(`✅ Provider ${provider} connected successfully`);
            } else {
              failedProvs[provider] = result.error || 'Unknown error';
              console.error(`❌ Provider ${provider} connection failed:`, result.error);
            }
          } catch (providerError) {
            failedProvs[provider] = providerError instanceof Error ? 
              providerError.message : 'Connection test failed';
            console.error(`❌ Provider ${provider} test threw error:`, providerError);
          }
        }
        
        setConnectedProviders(connectedProvs);
        setFailedProviders(failedProvs);
        
        if (connectedProvs.length > 0) {
          setApiStatus('connected');
        } else {
          setApiStatus('disconnected');
          setError('Could not connect to any API providers with the configured keys.');
        }
      } catch (error) {
        console.error('API provider checks failed:', error);
        setApiStatus('disconnected');
        setError(error instanceof Error ? error.message : String(error));
      }
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
    const unsubscribe = useConfigStore.subscribe(
      state => state.apiKeys,
      () => checkApiStatus(),
      { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
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
  }, []);

  // Display status icon based on API connection state
  const getStatusIcon = (status: 'checking' | 'connected' | 'disconnected') => {
    switch (status) {
      case 'checking':
        return <Loader size={16} className="text-primary animate-spin" />;
      case 'connected':
        return <CheckCircle size={16} className="text-success" />;
      case 'disconnected':
        return <XCircle size={16} className="text-destructive" />;
    }
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
      <div className="flex items-center justify-between mb-3 p-2 rounded-md bg-muted/30">
        <span className="text-sm">Database Connection</span>
        <div className="flex items-center gap-1.5">
          {getStatusIcon(supabaseStatus)}
          <span className={`text-xs ${
            supabaseStatus === 'connected' ? 'text-success' :
            supabaseStatus === 'disconnected' ? 'text-destructive' :
            'text-muted-foreground'
          }`}>
            {supabaseStatus === 'checking' ? 'Checking...' :
             supabaseStatus === 'connected' ? 'Connected' :
             'Disconnected'}
          </span>
        </div>
      </div>
      
      {/* Edge Functions Status */}
      <div className="flex items-center justify-between mb-3 p-2 rounded-md bg-muted/30">
        <span className="text-sm">Edge Functions</span>
        <div className="flex items-center gap-1.5">
          {getStatusIcon(edgeFunctionsStatus)}
          <span className={`text-xs ${
            edgeFunctionsStatus === 'connected' ? 'text-success' :
            edgeFunctionsStatus === 'disconnected' ? 'text-destructive' :
            'text-muted-foreground'
          }`}>
            {edgeFunctionsStatus === 'checking' ? 'Checking...' :
             edgeFunctionsStatus === 'connected' ? 'Connected' :
             'Disconnected'}
          </span>
        </div>
      </div>
      
      {/* Edge Functions Details (collapsible) */}
      {Object.keys(edgeFunctionDetails).length > 0 && (
        <div className="mb-3 p-2 rounded-md bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Edge Function Details</span>
          </div>
          <div className="mt-2 space-y-1">
            {Object.entries(edgeFunctionDetails).map(([name, status]) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{name}</span>
                <div className="flex items-center gap-1">
                  {status ? 
                    <CheckCircle size={12} className="text-success" /> : 
                    <XCircle size={12} className="text-destructive" />
                  }
                  <span className={status ? 'text-success' : 'text-destructive'}>
                    {status ? 'Working' : 'Failed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* API Status */}
      <div className="flex items-center justify-between mb-3 p-2 rounded-md bg-muted/30">
        <span className="text-sm">API Services</span>
        <div className="flex items-center gap-1.5">
          {getStatusIcon(apiStatus)}
          <span className={`text-xs ${
            apiStatus === 'connected' ? 'text-success' :
            apiStatus === 'disconnected' ? 'text-destructive' :
            'text-muted-foreground'
          }`}>
            {apiStatus === 'checking' ? 'Checking...' :
             apiStatus === 'connected' ? 'Connected' :
             'Disconnected'}
          </span>
        </div>
      </div>
      
      {/* API Provider Details */}
      {(connectedProviders.length > 0 || Object.keys(failedProviders).length > 0) && (
        <div className="mb-3 p-2 rounded-md bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">API Provider Details</span>
          </div>
          <div className="mt-2 space-y-1">
            {connectedProviders.map(provider => (
              <div key={provider} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{provider.charAt(0).toUpperCase() + provider.slice(1)}</span>
                <div className="flex items-center gap-1">
                  <CheckCircle size={12} className="text-success" />
                  <span className="text-success">Connected</span>
                </div>
              </div>
            ))}
            
            {Object.entries(failedProviders).map(([provider, errorMsg]) => (
              <div key={provider} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{provider.charAt(0).toUpperCase() + provider.slice(1)}</span>
                <div className="flex items-center gap-1">
                  <XCircle size={12} className="text-destructive" />
                  <span className="text-destructive" title={errorMsg}>Failed</span>
                </div>
              </div>
            ))}
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
              {connectedProviders.map(provider => (
                <motion.span 
                  key={provider}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-success/10 text-success border border-success/20"
                >
                  <CheckCircle size={12} className="mr-1" />
                  {provider.charAt(0).toUpperCase() + provider.slice(1)}
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