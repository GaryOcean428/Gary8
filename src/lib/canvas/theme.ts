import { ThemeColors, ThemeSettings } from './types';

export const lightColors: ThemeColors = {
  background: '#ffffff',
  foreground: '#1A1B2E',
  primary: '#00BFFF',
  primaryForeground: '#ffffff',
  secondary: '#FFB6C8',
  secondaryForeground: '#1A1B2E',
  accent: '#7C3AED',
  accentForeground: '#ffffff',
  border: '#E2E8F0',
  muted: '#F8FAFC',
  mutedForeground: '#64748B',
  code: {
    background: '#F8FAFC',
    text: '#1A1B2E',
    comment: '#64748B',
    keyword: '#00BFFF',
    string: '#FFB6C8',
    function: '#7C3AED'
  }
};

export const darkColors: ThemeColors = {
  background: '#1A1B2E',
  foreground: '#ffffff',
  primary: '#00BFFF',
  primaryForeground: '#ffffff',
  secondary: '#FFB6C8',
  secondaryForeground: '#1A1B2E',
  accent: '#9F7AEA',
  accentForeground: '#ffffff',
  border: '#2D3748',
  muted: '#151623',
  mutedForeground: '#A0AEC0',
  code: {
    background: '#151623',
    text: '#ffffff',
    comment: '#A0AEC0',
    keyword: '#00BFFF',
    string: '#FFB6C8',
    function: '#9F7AEA'
  }
};

export const defaultTheme: ThemeSettings = {
  mode: 'dark',
  colors: darkColors
};

export const getThemeValue = (colors: ThemeColors, path: string): string => {
  return path.split('.').reduce((obj, key) => obj[key], colors as any);
};
