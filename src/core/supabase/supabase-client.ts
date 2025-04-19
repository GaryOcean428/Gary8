import { createClient } from '@supabase/supabase-js';

// Get environment variables from .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing required environment variables: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

// Network status tracking with better reliability
let isOnline = navigator.onLine;
let lastPingSuccess = Date.now(); // Track last successful ping
let pingInterval: number | null = null;
const PING_FREQUENCY = 30000; // 30 seconds

// Update online status using both event listeners and ping
window.addEventListener('online', () => { isOnline = true; });
window.addEventListener('offline', () => { isOnline = false; });

// Start periodic ping to check real connectivity
function startConnectivityPing() {
  if (pingInterval) return; // Already running
  
  pingInterval = window.setInterval(async () => {
    try {
      // Use a tiny request that will almost certainly succeed to test connectivity
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors', // This prevents CORS issues
        cache: 'no-store', // Don't cache the result
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(5000) // 5-second timeout
      });
      
      // If fetch succeeds, we're online
      if (response) {
        isOnline = true;
        lastPingSuccess = Date.now();
      }
    } catch (e) {
      // If fetch fails, we might be offline or the network is unreliable
      if (Date.now() - lastPingSuccess > 60000) { // If no successful ping in the last minute
        isOnline = false;
      }
    }
  }, PING_FREQUENCY);
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
  });
}

// Start connectivity checking
startConnectivityPing();

// More reliable network status check
export const getNetworkStatus = (): boolean => {
  return isOnline;
};

// Create a single supabase client for the application
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: (..._args) => {
      // Add better timeout handling
      const [url, options = {}] = _args;
      options.signal = AbortSignal.timeout(30000); // 30 second timeout
      return fetch(url, options);
    }
  }
});

// Test connection to Supabase
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    if (!getNetworkStatus()) {
      return false;
    }
    
    // Set a timeout to avoid hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const { error } = await supabase.from('settings').select('count', { count: 'exact' }).limit(1).abortSignal(controller.signal);
      clearTimeout(timeoutId);
      return !error;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Failed to connect to Supabase:', error);
      return false;
    }
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    return false;
  }
};