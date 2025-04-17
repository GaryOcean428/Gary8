import { useState, useEffect, useRef, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Get function to retrieve from localStorage
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      // Parse stored JSON or return initialValue if no item exists
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  // State to store value
  // Pass function to useState to avoid re-renders on init
  const [storedValue, setStoredValue] = useState<T>(readValue);
  
  // Initial load (once)
  const initialLoad = useRef(true);
  
  // Update localStorage when the state changes
  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }

    try {
      // Allow storage of functions
      const valueToStore = typeof storedValue === 'function' 
        ? JSON.stringify(String(storedValue))
        : JSON.stringify(storedValue);
      
      window.localStorage.setItem(key, valueToStore);
      
      // Trigger an event so other components can respond to the change
      window.dispatchEvent(new Event('local-storage'));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Listen to changes in localStorage from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setStoredValue];
}