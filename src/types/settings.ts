export interface Settings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  lineHeight: number;
  showLineNumbers: boolean;
  enableAutocomplete: boolean;
  enableLinting: boolean;
  tabSize: number;
  wordWrap: boolean;
  // Add any other settings your application needs
}

export const defaultSettings: Settings = {
  theme: 'system',
  fontSize: 14,
  lineHeight: 1.5,
  showLineNumbers: true,
  enableAutocomplete: true,
  enableLinting: true,
  tabSize: 2,
  wordWrap: true,
}; 