import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import { ThemeContextType, ThemeColors } from '../lib/canvas/types';
import { darkColors, lightColors } from '../lib/canvas/theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme: nextTheme, setTheme: setNextTheme } = useNextTheme();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<ThemeColors>(darkColors);

  useEffect(() => {
    const isDark = nextTheme === 'dark';
    setIsDarkMode(isDark);
    setCurrentTheme(isDark ? darkColors : lightColors);
  }, [nextTheme]);

  const toggleTheme = () => {
    const newMode = isDarkMode ? 'light' : 'dark';
    setNextTheme(newMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme: currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
