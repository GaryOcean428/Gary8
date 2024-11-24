import { fabric } from 'fabric';
import { CanvasElement, CanvasState } from './types';
import { thoughtLogger } from '../utils/logger';

export class CanvasManager {
  private canvas: fabric.Canvas;
  private state: CanvasState;

  constructor(canvasId: string) {
    this.canvas = new fabric.Canvas(canvasId);
    this.state = {
      elements: new Map(),
      selectedIds: new Set(),
      history: {
        past: [],
        future: []
      },
      viewport: {
        zoom: 1,
        pan: { x: 0, y: 0 }
      }
    };

    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    this.canvas.on('selection:created', this.handleSelection);
    this.canvas.on('object:modified', this.handleModification);
    this.canvas.on('object:added', this.handleAddition);
  }

  async addElement(element: CanvasElement): Promise<void> {
    try {
      const fabricObject = await this.createFabricObject(element);
      this.canvas.add(fabricObject);
      this.state.elements.set(element.id, element);
      this.saveHistoryState();
    } catch (error) {
      thoughtLogger.error('Failed to add canvas element', { element, error });
      throw new AppError('Failed to add element to canvas', 'CANVAS_ERROR');
    }
  }

  private saveHistoryState(): void {
    const currentState = Array.from(this.state.elements.values());
    this.state.history.past.push(currentState);
    this.state.history.future = [];
  }
}