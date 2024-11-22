import { fabric } from 'fabric';
import { CanvasElement, CanvasManager, CanvasState } from './types';

export class FabricCanvasManager implements CanvasManager {
  canvas: fabric.Canvas;
  state: CanvasState;

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = new fabric.Canvas(canvasElement);
    this.state = {
      elements: [],
      selectedIds: [],
      scale: 1,
      history: {
        past: [],
        future: []
      }
    };

    this.setupEventListeners();
  }

  initialize(): void {
    this.canvas.setDimensions({
      width: this.canvas.getElement().parentElement?.clientWidth || 800,
      height: this.canvas.getElement().parentElement?.clientHeight || 600
    });

    this.canvas.setBackgroundColor('#ffffff', () => {
      this.canvas.renderAll();
    });
  }

  canUndo(): boolean {
    return this.state.history.past.length > 0;
  }

  canRedo(): boolean {
    return this.state.history.future.length > 0;
  }

  private setupEventListeners(): void {
    this.canvas.on('object:added', (e) => {
      if (e.target) {
        const element = this.fabricObjectToElement(e.target);
        this.state.elements.push(element);
        this.saveHistoryState();
      }
    });

    this.canvas.on('object:modified', (e) => {
      if (e.target) {
        const element = this.fabricObjectToElement(e.target);
        const index = this.state.elements.findIndex(el => el.id === element.id);
        if (index !== -1) {
          this.state.elements[index] = element;
          this.saveHistoryState();
        }
      }
    });

    this.canvas.on('selection:created', (e) => {
      if (e.selected) {
        this.state.selectedIds = e.selected.map(obj => obj.data?.id || '');
      }
    });

    this.canvas.on('selection:cleared', () => {
      this.state.selectedIds = [];
    });
  }

  private fabricObjectToElement(obj: fabric.Object): CanvasElement {
    const style: CanvasElement['style'] = {
      fill: obj.fill?.toString() || '#000000',
      stroke: obj.stroke?.toString()
    };

    if (obj instanceof fabric.Text || obj instanceof fabric.Textbox) {
      style.fontSize = obj.fontSize;
      style.fontFamily = obj.fontFamily;
    }

    return {
      id: obj.data?.id || Math.random().toString(36).substr(2, 9),
      type: obj.data?.type || 'shape',
      data: obj.data || {},
      style,
      position: {
        x: obj.left || 0,
        y: obj.top || 0
      },
      size: {
        width: obj.width || 0,
        height: obj.height || 0
      }
    };
  }

  private elementToFabricObject(element: CanvasElement): Promise<fabric.Object> {
    return new Promise((resolve) => {
      const defaultData = element.data || {};
      
      switch (element.type) {
        case 'text':
          const text = new fabric.Text(defaultData.text || '', {
            left: element.position.x,
            top: element.position.y,
            fill: element.style?.fill,
            fontSize: element.style?.fontSize,
            fontFamily: element.style?.fontFamily
          });
          text.data = { id: element.id, type: element.type, ...defaultData };
          resolve(text);
          break;

        case 'code':
          const code = new fabric.Textbox(defaultData.code || '', {
            left: element.position.x,
            top: element.position.y,
            width: element.size.width,
            fill: element.style?.fill || '#000000',
            fontSize: element.style?.fontSize || 14,
            fontFamily: 'monospace'
          });
          code.data = { id: element.id, type: element.type, ...defaultData };
          resolve(code);
          break;

        default:
          const rect = new fabric.Rect({
            left: element.position.x,
            top: element.position.y,
            width: element.size.width,
            height: element.size.height,
            fill: element.style?.fill,
            stroke: element.style?.stroke
          });
          rect.data = { id: element.id, type: element.type, ...defaultData };
          resolve(rect);
      }
    });
  }

  private saveHistoryState(): void {
    this.state.history.past.push([...this.state.elements]);
    this.state.history.future = [];
  }

  async addElement(element: Partial<CanvasElement>): Promise<void> {
    const fullElement: CanvasElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: element.type || 'shape',
      data: element.data || {},
      style: element.style || {},
      position: element.position || { x: 0, y: 0 },
      size: element.size || { width: 100, height: 100 }
    };

    const fabricObject = await this.elementToFabricObject(fullElement);
    this.canvas.add(fabricObject);
    this.canvas.renderAll();
  }

  removeElement(id: string): void {
    const objects = this.canvas.getObjects();
    const object = objects.find(obj => obj.data?.id === id);
    if (object) {
      this.canvas.remove(object);
      this.state.elements = this.state.elements.filter(el => el.id !== id);
      this.saveHistoryState();
      this.canvas.renderAll();
    }
  }

  async updateElement(id: string, updates: Partial<CanvasElement>): Promise<void> {
    const element = this.state.elements.find(el => el.id === id);
    if (!element) return;

    const updatedElement: CanvasElement = {
      ...element,
      ...updates,
      style: { ...element.style, ...updates.style },
      position: { ...element.position, ...updates.position },
      size: { ...element.size, ...updates.size }
    };

    this.removeElement(id);
    const fabricObject = await this.elementToFabricObject(updatedElement);
    this.canvas.add(fabricObject);
    this.canvas.renderAll();
  }

  clear(): void {
    this.canvas.clear();
    this.state.elements = [];
    this.saveHistoryState();
  }

  undo(): void {
    if (!this.canUndo()) return;

    const current = [...this.state.elements];
    const previous = this.state.history.past.pop();

    if (previous) {
      this.state.history.future.push(current);
      this.state.elements = previous;
      this.canvas.clear();
      
      Promise.all(previous.map(element => 
        this.elementToFabricObject(element)
      )).then(objects => {
        objects.forEach(obj => this.canvas.add(obj));
        this.canvas.renderAll();
      });
    }
  }

  redo(): void {
    if (!this.canRedo()) return;

    const current = [...this.state.elements];
    const next = this.state.history.future.pop();

    if (next) {
      this.state.history.past.push(current);
      this.state.elements = next;
      this.canvas.clear();
      
      Promise.all(next.map(element => 
        this.elementToFabricObject(element)
      )).then(objects => {
        objects.forEach(obj => this.canvas.add(obj));
        this.canvas.renderAll();
      });
    }
  }

  async executeCode(code: string): Promise<any> {
    try {
      const func = new Function('canvas', 'fabric', code);
      return await func(this.canvas, fabric);
    } catch (error) {
      console.error('Error executing code:', error);
      throw error;
    }
  }
}
