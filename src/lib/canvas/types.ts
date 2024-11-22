// Theme Types
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

// Canvas Types
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface CanvasElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'connection' | 'code';
  position: Position;
  size: Size;
  data?: Record<string, any>;
  style?: {
    fill?: string;
    stroke?: string;
    fontSize?: number;
    fontFamily?: string;
  };
}

export interface CanvasState {
  elements: CanvasElement[];
  selectedIds: string[];
  scale: number;
  history: {
    past: CanvasElement[][];
    future: CanvasElement[][];
  };
}

export interface CanvasManager {
  canvas: fabric.Canvas;
  state: CanvasState;
  initialize(): void;
  addElement(element: Partial<CanvasElement>): Promise<void>;
  removeElement(id: string): void;
  updateElement(id: string, updates: Partial<CanvasElement>): Promise<void>;
  clear(): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  executeCode(code: string): Promise<any>;
}
