import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import { useConfigStore } from '../../lib/config';
import { APIClient } from '../../lib/api-client';
import { motion } from 'framer-motion';
import { getNetworkStatus, testSupabaseConnection, supabase } from '../../core/supabase/supabase-client';
import { useSettings } from '../../features/settings/hooks/useSettings';

export function ApiStatusDisplay() {
  const configStore = useConfigStore();
  const { settings } = useSettings();
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [networkStatus, setNetworkStatus] = useState<boolean>(getNetworkStatus());
  const [edgeFunctionsStatus, setEdgeFunctionsStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    const checkApiStatus = async () => {
      setApiStatus('checking');
      setError(null);
      setConnectedProviders([]);
      
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
        const { error } = await supabase.functions.invoke('test-connection', {
          body: { provider: 'openai' } // Just checking if the function works
        });
        
        setEdgeFunctionsStatus(error ? 'disconnected' : 'connected');
        
        // If edge functions are enabled and working, we're good to go
        if (!error && settings.useEdgeFunctions !== false) {
          setApiStatus('connected');
          return;
        }
      } catch (error) {
        setEdgeFunctionsStatus('disconnected');
        if (settings.useEdgeFunctions !== false) {
          setError('Edge Functions are enabled but not working. Please check your Supabase configuration or disable Edge Functions in settings.');
        }
        // Continue checking direct API keys if edge functions are disabled
      }
      
      // Check API providers if edge functions are disabled or failed
      const apiKeys = configStore.apiKeys;
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
        
        for (const provider of providersWithKeys) {
          const apiClient = APIClient.getInstance();
          const result = await apiClient.testConnection(provider);
          
          if (result.success) {
            connectedProvs.push(provider);
          }
        }
        
        setConnectedProviders(connectedProvs);
        
        if (connectedProvs.length > 0) {
          setApiStatus('connected');
        } else {
          setApiStatus('disconnected');
          setError('Could not connect to any API providers with the configured keys.');
        }
      } catch (error) {
        setApiStatus('disconnected');
        setError(error instanceof Error ? error.message : String(error));
      }
    };
    
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
    const unsubscribe = useConfigStore.subscribe(() => {
      checkApiStatus();
    });
    
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
  }, [settings.useEdgeFunctions]);

  // Display status icon based on API connection state
  const getStatusIcon = (_status: 'checking' | 'connected' | 'disconnected') => {
    switch (_status) {
      case 'checking':
        return <Loader width={16} height={16} className="text-primary animate-spin" />;
      case 'connected':
        return <CheckCircle width={16} height={16} className="text-success" />;
      case 'disconnected':
        return <XCircle width={16} height={16} className="text-destructive" />;
    }
  };

  return (
    <div className="rounded-lg p-4 bg-card/50 backdrop-blur-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield width={16} height={16} className="text-primary" />
          <h3 className="font-medium">Connection Status</h3>
        </div>
      </div>
      
      {/* Network Status */}
      <div className="flex items-center justify-between mb-3 p-2 rounded-md bg-muted/30">
        <span className="text-sm">Network Connection</span>
        <div className="flex items-center gap-1.5">
          {networkStatus ?
            <CheckCircle width={16} height={16} className="text-success" /> :
            <XCircle width={16} height={16} className="text-destructive" />
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
          {settings.useEdgeFunctions === false && edgeFunctionsStatus === 'connected' && (
            <span className="text-xs text-muted-foreground">(Disabled)</span>
          )}
        </div>
      </div>
      
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
              {settings.useEdgeFunctions !== false && edgeFunctionsStatus === 'connected' && (
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-success/10 text-success border border-success/20"
                >
                  <CheckCircle width={12} height={12} className="mr-1" />
                  Edge Functions
                </motion.span>
              )}
              {connectedProviders.map(_provider => (
                <motion.span 
                  key={_provider}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-success/10 text-success border border-success/20"
                >
                  <CheckCircle width={12} height={12} className="mr-1" />
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
                <li>Make sure you're signed in</li>
                {networkStatus && <li>Try refreshing the page</li>}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}