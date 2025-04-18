// CommonJS stub for supabase-client to support require() in tests and runtime
// Default implementations can be overridden via vi.mock in tests
/** @type {boolean} */
let isOnlineStub = true;

/**
 * Get current network status (online/offline).
 * Tests can override this via vi.mock or by setting isOnlineStub.
 */
function getNetworkStatus() {
  return isOnlineStub;
}

/**
 * Stub for Supabase client
 */
const supabase = {
  auth: {
    /**
     * Get current session (stubbed)
     */
    getSession: async () => ({ data: { session: null } })
  },
  functions: {
    /**
     * Invoke a Supabase Edge Function (stubbed)
     */
    invoke: async () => ({ data: null, error: null })
  }
};

/**
 * Stub for testing Supabase connection
 */
async function testSupabaseConnection() {
  return false;
}

// Export CJS interface
module.exports = {
  getNetworkStatus,
  supabase,
  testSupabaseConnection
};