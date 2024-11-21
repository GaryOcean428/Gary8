export interface CanvasElement {
  id: string;
  type: 'shape' | 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  data: Record<string, any>;
  style: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
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

export interface DesignSpec {
  layout: {
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
  }[];
  components: {
    type: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    content?: string;
    variant?: string;
    text?: string;
  }[];
  styles: Record<string, Record<string, any>>;
}