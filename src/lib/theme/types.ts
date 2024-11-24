export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  muted: string;
  mutedForeground: string;
  code: {
    background: string;
    text: string;
    comment: string;
    keyword: string;
    string: string;
    function: string;
  };
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  overlay: string;
  shadow: {
    sm: string;
    md: string;
    lg: string;
  };
  status: {
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  components: {
    commandPalette: {
      background: string;
      itemHover: string;
      search: string;
      divider: string;
    };
    canvas: {
      grid: string;
      selection: string;
      handle: string;
      guide: string;
    };
  };
}

export type ThemeMode = 'light' | 'dark';

export interface ThemeSettings {
  mode: ThemeMode;
  colors: ThemeColors;
}

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: ThemeColors;
}

export const defaultLightTheme: ThemeColors = {
  background: '#ffffff',
  foreground: '#000000',
  primary: '#007bff',
  primaryForeground: '#ffffff',
  secondary: '#6c757d',
  secondaryForeground: '#ffffff',
  accent: '#17a2b8',
  accentForeground: '#ffffff',
  border: '#dee2e6',
  muted: '#f8f9fa',
  mutedForeground: '#6c757d',
  code: {
    background: '#f8f9fa',
    text: '#212529',
    comment: '#6c757d',
    keyword: '#007bff',
    string: '#28a745',
    function: '#dc3545'
  },
  surface: '#ffffff',
  surfaceHover: '#f8f9fa',
  surfaceActive: '#e9ecef',
  overlay: '#000000',
  shadow: {
    sm: '#000000',
    md: '#000000',
    lg: '#000000'
  },
  status: {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  },
  components: {
    commandPalette: {
      background: '#ffffff',
      itemHover: '#f8f9fa',
      search: '#007bff',
      divider: '#dee2e6'
    },
    canvas: {
      grid: '#f8f9fa',
      selection: '#007bff',
      handle: '#6c757d',
      guide: '#6c757d'
    }
  }
};

export const defaultDarkTheme: ThemeColors = {
  background: '#212529',
  foreground: '#ffffff',
  primary: '#0d6efd',
  primaryForeground: '#ffffff',
  secondary: '#6c757d',
  secondaryForeground: '#ffffff',
  accent: '#0dcaf0',
  accentForeground: '#000000',
  border: '#495057',
  muted: '#343a40',
  mutedForeground: '#adb5bd',
  code: {
    background: '#2b3035',
    text: '#f8f9fa',
    comment: '#6c757d',
    keyword: '#0d6efd',
    string: '#198754',
    function: '#dc3545'
  },
  surface: '#343a40',
  surfaceHover: '#495057',
  surfaceActive: '#545b62',
  overlay: '#ffffff',
  shadow: {
    sm: '#ffffff',
    md: '#ffffff',
    lg: '#ffffff'
  },
  status: {
    success: '#198754',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#0dcaf0'
  },
  components: {
    commandPalette: {
      background: '#343a40',
      itemHover: '#495057',
      search: '#0d6efd',
      divider: '#545b62'
    },
    canvas: {
      grid: '#343a40',
      selection: '#0d6efd',
      handle: '#6c757d',
      guide: '#6c757d'
    }
  }
};
