import { fabric } from 'fabric';
import { thoughtLogger } from '../logging/thought-logger';
import type { CanvasElement, CanvasState } from './types';

export class CanvasManager {
  private static instance: CanvasManager;
  private canvas: fabric.Canvas | null = null;
  private state: CanvasState = {
    elements: [],
    selectedIds: [],
    scale: 1,
    history: {
      past: [],
      future: []
    }
  };

  private constructor() {}

  static getInstance(): CanvasManager {
    if (!CanvasManager.instance) {
      CanvasManager.instance = new CanvasManager();
    }
    return CanvasManager.instance;
  }

  initialize(canvas: fabric.Canvas): void {
    this.canvas = canvas;
    thoughtLogger.log('success', 'Canvas manager initialized');
  }

  addElement(element: Omit<CanvasElement, 'id'>): void {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    const id = crypto.randomUUID();
    const fabricObject = this.createFabricObject({ ...element, id });
    
    this.canvas.add(fabricObject);
    this.state.elements.push({ ...element, id });
    this.saveToHistory();

    thoughtLogger.log('success', 'Element added to canvas', { elementId: id });
  }

  private createFabricObject(element: CanvasElement): fabric.Object {
    switch (element.type) {
      case 'shape':
        if (element.data.type === 'button') {
          const group = new fabric.Group([], {
            left: element.x,
            top: element.y,
            width: element.width,
            height: element.height
          });

          const rect = new fabric.Rect({
            width: element.width,
            height: element.height,
            fill: element.style.fill,
            stroke: element.style.stroke,
            strokeWidth: element.style.strokeWidth,
            rx: 4,
            ry: 4
          });

          const text = new fabric.Text(element.data.text || '', {
            fontSize: 16,
            fill: '#ffffff',
            originX: 'center',
            originY: 'center',
            left: element.width / 2,
            top: element.height / 2
          });

          group.addWithUpdate(rect);
          group.addWithUpdate(text);
          return group;
        } else {
          return new fabric.Rect({
            left: element.x,
            top: element.y,
            width: element.width,
            height: element.height,
            fill: element.style.fill,
            stroke: element.style.stroke,
            strokeWidth: element.style.strokeWidth,
            opacity: element.style.opacity
          });
        }

      case 'text':
        return new fabric.Text(element.data.text || '', {
          left: element.x,
          top: element.y,
          fontSize: element.style.fontSize,
          fontFamily: element.style.fontFamily,
          fill: element.style.fill,
          width: element.width
        });

      case 'image':
        return new fabric.Image(element.data.src, {
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height
        });

      default:
        throw new Error(`Unsupported element type: ${element.type}`);
    }
  }

  updateElement(id: string, updates: Partial<CanvasElement>): void {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    const element = this.state.elements.find(e => e.id === id);
    if (!element) return;

    const fabricObject = this.canvas.getObjects().find(
      obj => (obj as any).id === id
    );

    if (fabricObject) {
      Object.assign(element, updates);
      fabricObject.set(updates as any);
      this.canvas.renderAll();
      this.saveToHistory();
    }
  }

  removeElement(id: string): void {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    const fabricObject = this.canvas.getObjects().find(
      obj => (obj as any).id === id
    );

    if (fabricObject) {
      this.canvas.remove(fabricObject);
      this.state.elements = this.state.elements.filter(e => e.id !== id);
      this.saveToHistory();
    }
  }

  private saveToHistory(): void {
    this.state.history.past.push([...this.state.elements]);
    this.state.history.future = [];

    // Limit history size
    if (this.state.history.past.length > 50) {
      this.state.history.past.shift();
    }
  }

  undo(): void {
    if (this.state.history.past.length === 0) return;

    const current = this.state.elements;
    const previous = this.state.history.past.pop()!;

    this.state.history.future.push(current);
    this.state.elements = previous;
    this.redrawCanvas();
  }

  redo(): void {
    if (this.state.history.future.length === 0) return;

    const current = this.state.elements;
    const next = this.state.history.future.pop()!;

    this.state.history.past.push(current);
    this.state.elements = next;
    this.redrawCanvas();
  }

  private redrawCanvas(): void {
    if (!this.canvas) return;

    this.canvas.clear();
    this.state.elements.forEach(element => {
      const fabricObject = this.createFabricObject(element);
      this.canvas.add(fabricObject);
    });
    this.canvas.renderAll();
  }

  exportToCode(format: 'react' | 'html'): string {
    switch (format) {
      case 'react':
        return this.generateReactCode();
      case 'html':
        return this.generateHTMLCode();
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private generateReactCode(): string {
    const components = this.state.elements.map(element => {
      switch (element.type) {
        case 'text':
          return `<Text
  style={{
    position: 'absolute',
    left: ${element.x},
    top: ${element.y},
    fontSize: ${element.style.fontSize},
    fontFamily: '${element.style.fontFamily}',
    color: '${element.style.fill}'
  }}
>
  ${element.data.text}
</Text>`;
        case 'shape':
          if (element.data.type === 'button') {
            return `<Button
  style={{
    position: 'absolute',
    left: ${element.x},
    top: ${element.y},
    width: ${element.width},
    height: ${element.height},
    backgroundColor: '${element.style.fill}',
    border: '${element.style.strokeWidth}px solid ${element.style.stroke}'
  }}
>
  ${element.data.text}
</Button>`;
          }
          return `<div
  style={{
    position: 'absolute',
    left: ${element.x},
    top: ${element.y},
    width: ${element.width},
    height: ${element.height},
    backgroundColor: '${element.style.fill}',
    border: '${element.style.strokeWidth}px solid ${element.style.stroke}',
    opacity: ${element.style.opacity}
  }}
/>`;
        default:
          return '';
      }
    });

    return `export default function GeneratedComponent() {
  return (
    <div className="relative">
      ${components.join('\n      ')}
    </div>
  );
}`;
  }

  private generateHTMLCode(): string {
    const styles = this.state.elements.map((element, index) => {
      return `.element-${index} {
  position: absolute;
  left: ${element.x}px;
  top: ${element.y}px;
  ${element.type === 'text' ? `
  font-size: ${element.style.fontSize}px;
  font-family: ${element.style.fontFamily};
  color: ${element.style.fill};` : `
  width: ${element.width}px;
  height: ${element.height}px;
  background-color: ${element.style.fill};
  border: ${element.style.strokeWidth}px solid ${element.style.stroke};
  opacity: ${element.style.opacity};`}
}`;
    }).join('\n\n');

    const elements = this.state.elements.map((element, index) => {
      switch (element.type) {
        case 'text':
          return `<div class="element-${index}">${element.data.text}</div>`;
        case 'shape':
          if (element.data.type === 'button') {
            return `<button class="element-${index}">${element.data.text}</button>`;
          }
          return `<div class="element-${index}"></div>`;
        default:
          return '';
      }
    });

    return `<!DOCTYPE html>
<html>
<head>
  <style>
    .container {
      position: relative;
      width: 100%;
      height: 100vh;
    }
    ${styles}
  </style>
</head>
<body>
  <div class="container">
    ${elements.join('\n    ')}
  </div>
</body>
</html>`;
  }
}