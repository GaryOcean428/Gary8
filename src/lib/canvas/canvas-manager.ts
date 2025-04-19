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

  initialize(_canvas: fabric.Canvas): void {
    this.canvas = _canvas;
    thoughtLogger.log('success', 'Canvas manager initialized');
  }

  addElement(_element: Omit<CanvasElement, 'id'>): void {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    const id = crypto.randomUUID();
    const fabricObject = this.createFabricObject({ ..._element, id });
    
    this.canvas.add(fabricObject);
    this.state.elements.push({ ..._element, id });
    this.saveToHistory();

    thoughtLogger.log('success', 'Element added to canvas', { elementId: id });
  }

  private createFabricObject(_element: CanvasElement): fabric.Object {
    switch (_element.type) {
      case 'shape':
        if (_element.data.type === 'button') {
          const group = new fabric.Group([], {
            left: _element.x,
            top: _element.y,
            width: _element.width,
            height: _element.height
          });

          const rect = new fabric.Rect({
            width: _element.width,
            height: _element.height,
            fill: _element.style.fill,
            stroke: _element.style.stroke,
            strokeWidth: _element.style.strokeWidth,
            rx: 4,
            ry: 4
          });

          const text = new fabric.Text(_element.data.text || '', {
            fontSize: 16,
            fill: '#ffffff',
            originX: 'center',
            originY: 'center',
            left: _element.width / 2,
            top: _element.height / 2
          });

          group.addWithUpdate(rect);
          group.addWithUpdate(text);
          return group;
        } else {
          return new fabric.Rect({
            left: _element.x,
            top: _element.y,
            width: _element.width,
            height: _element.height,
            fill: _element.style.fill,
            stroke: _element.style.stroke,
            strokeWidth: _element.style.strokeWidth,
            opacity: _element.style.opacity
          });
        }

      case 'text':
        return new fabric.Text(_element.data.text || '', {
          left: _element.x,
          top: _element.y,
          fontSize: _element.style.fontSize,
          fontFamily: _element.style.fontFamily,
          fill: _element.style.fill,
          width: _element.width
        });

      case 'image':
        return new fabric.Image(_element.data.src, {
          left: _element.x,
          top: _element.y,
          width: _element.width,
          height: _element.height
        });

      default:
        throw new Error(`Unsupported element type: ${_element.type}`);
    }
  }

  updateElement(_id: string, _updates: Partial<CanvasElement>): void {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    const element = this.state.elements.find(_e => _e.id === _id);
    if (!element) return;

    const fabricObject = this.canvas.getObjects().find(
      _obj => (_obj as any).id === _id
    );

    if (fabricObject) {
      Object.assign(element, _updates);
      fabricObject.set(_updates as any);
      this.canvas.renderAll();
      this.saveToHistory();
    }
  }

  removeElement(_id: string): void {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    const fabricObject = this.canvas.getObjects().find(
      _obj => (_obj as any).id === _id
    );

    if (fabricObject) {
      this.canvas.remove(fabricObject);
      this.state.elements = this.state.elements.filter(_e => _e.id !== _id);
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
    this.state.elements.forEach(_element => {
      const fabricObject = this.createFabricObject(_element);
      this.canvas.add(fabricObject);
    });
    this.canvas.renderAll();
  }

  exportToCode(_format: 'react' | 'html'): string {
    switch (_format) {
      case 'react':
        return this.generateReactCode();
      case 'html':
        return this.generateHTMLCode();
      default:
        throw new Error(`Unsupported export format: ${_format}`);
    }
  }

  private generateReactCode(): string {
    const components = this.state.elements.map(_element => {
      switch (_element.type) {
        case 'text':
          return `<Text
  style={{
    position: 'absolute',
    left: ${_element.x},
    top: ${_element.y},
    fontSize: ${_element.style.fontSize},
    fontFamily: '${_element.style.fontFamily}',
    color: '${_element.style.fill}'
  }}
>
  ${_element.data.text}
</Text>`;
        case 'shape':
          if (_element.data.type === 'button') {
            return `<Button
  style={{
    position: 'absolute',
    left: ${_element.x},
    top: ${_element.y},
    width: ${_element.width},
    height: ${_element.height},
    backgroundColor: '${_element.style.fill}',
    border: '${_element.style.strokeWidth}px solid ${_element.style.stroke}'
  }}
>
  ${_element.data.text}
</Button>`;
          }
          return `<div
  style={{
    position: 'absolute',
    left: ${_element.x},
    top: ${_element.y},
    width: ${_element.width},
    height: ${_element.height},
    backgroundColor: '${_element.style.fill}',
    border: '${_element.style.strokeWidth}px solid ${_element.style.stroke}',
    opacity: ${_element.style.opacity}
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
    const styles = this.state.elements.map((_element, _index) => {
      return `.element-${_index} {
  position: absolute;
  left: ${_element.x}px;
  top: ${_element.y}px;
  ${_element.type === 'text' ? `
  font-size: ${_element.style.fontSize}px;
  font-family: ${_element.style.fontFamily};
  color: ${_element.style.fill};` : `
  width: ${_element.width}px;
  height: ${_element.height}px;
  background-color: ${_element.style.fill};
  border: ${_element.style.strokeWidth}px solid ${_element.style.stroke};
  opacity: ${_element.style.opacity};`}
}`;
    }).join('\n\n');

    const elements = this.state.elements.map((_element, _index) => {
      switch (_element.type) {
        case 'text':
          return `<div class="element-${_index}">${_element.data.text}</div>`;
        case 'shape':
          if (_element.data.type === 'button') {
            return `<button class="element-${_index}">${_element.data.text}</button>`;
          }
          return `<div class="element-${_index}"></div>`;
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