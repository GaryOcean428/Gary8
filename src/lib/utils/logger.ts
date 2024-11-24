export const thoughtLogger = {
  log: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Thought] ${message}`, data || '');
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[Error] ${message}`, error || '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Debug] ${message}`, data || '');
    }
  }
}; 