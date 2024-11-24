import { CanvasRef } from '../../components/Canvas';
import { CanvasElement } from '../canvas/types';

interface Template {
  name: string;
  code: string;
  description: string;
}

export class CanvasAgent {
  private canvas: CanvasRef | null = null;
  private templates: Template[] = [
    {
      name: 'interactive-demo',
      description: 'Creates an interactive group with shapes and text',
      code: `
        const group = new fabric.Group([], {
          left: 100,
          top: 100
        });

        const rect = new fabric.Rect({
          width: 100,
          height: 100,
          fill: '#3b82f6',
          originX: 'center',
          originY: 'center'
        });
        group.addWithUpdate(rect);

        const text = new fabric.Text('Drag me!', {
          fontSize: 16,
          fill: '#ffffff',
          originX: 'center',
          originY: 'center'
        });
        group.addWithUpdate(text);

        group.set({
          selectable: true,
          hasControls: true,
          hasBorders: true
        });

        canvas.add(group);
        canvas.renderAll();

        group.on('moving', () => {
          console.log('Group is moving');
        });
      `
    },
    {
      name: 'grid',
      description: 'Creates a responsive grid layout',
      code: `
        const gridSize = 50;
        const width = canvas.width;
        const height = canvas.height;
        
        for (let x = 0; x < width; x += gridSize) {
          const line = new fabric.Line([x, 0, x, height], {
            stroke: '#e2e8f0',
            selectable: false
          });
          canvas.add(line);
        }
        
        for (let y = 0; y < height; y += gridSize) {
          const line = new fabric.Line([0, y, width, y], {
            stroke: '#e2e8f0',
            selectable: false
          });
          canvas.add(line);
        }
        
        canvas.renderAll();
      `
    }
  ];

  setCanvas(canvasRef: CanvasRef) {
    this.canvas = canvasRef;
  }

  async executeCommand(command: string): Promise<any> {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    const normalizedCommand = command.toLowerCase().trim();

    // Shape creation commands
    if (normalizedCommand.includes('create') || normalizedCommand.includes('add')) {
      if (normalizedCommand.includes('circle')) {
        return this.createCircle(this.extractColor(command));
      } else if (normalizedCommand.includes('rectangle')) {
        return this.createRectangle(this.extractColor(command));
      } else if (normalizedCommand.includes('text')) {
        const text = command.match(/text\s+["'](.+?)["']/i)?.[1] || 'Sample Text';
        return this.createText(text);
      }
    }

    // Template commands
    if (normalizedCommand.includes('template')) {
      const templateName = this.templates.find(t => 
        normalizedCommand.includes(t.name)
      )?.name;
      
      if (templateName) {
        return this.applyTemplate(templateName);
      }
    }

    // Layout commands
    if (normalizedCommand.includes('layout')) {
      if (normalizedCommand.includes('grid')) {
        return this.applyTemplate('grid');
      }
    }

    // Style commands
    if (normalizedCommand.includes('style') || normalizedCommand.includes('color')) {
      const id = this.extractId(command);
      const color = this.extractColor(command);
      if (id && color) {
        return this.updateElementStyle(id, { fill: color });
      }
    }

    // Position commands
    if (normalizedCommand.includes('move')) {
      const id = this.extractId(command);
      const position = this.extractPosition(command);
      if (id && position) {
        return this.updateElementPosition(id, position);
      }
    }

    // Basic commands
    if (normalizedCommand.includes('clear')) {
      this.canvas.clear();
      return 'Canvas cleared';
    }

    if (normalizedCommand.includes('undo')) {
      this.canvas.undo();
      return 'Action undone';
    }

    if (normalizedCommand.includes('redo')) {
      this.canvas.redo();
      return 'Action redone';
    }

    // Code execution
    if (normalizedCommand.includes('execute')) {
      const codeMatch = command.match(/execute\s+code\s*:\s*`([^`]+)`/i);
      if (codeMatch) {
        return this.canvas.executeCode(codeMatch[1]);
      }
    }

    throw new Error('Unknown command');
  }

  private extractColor(command: string): string {
    const colorMatch = command.match(/colou?r[:]?\s*([#\w]+)/i);
    return colorMatch?.[1] || '#3b82f6';
  }

  private extractId(command: string): string | null {
    const idMatch = command.match(/id[:]?\s*([#\w]+)/i);
    return idMatch?.[1] || null;
  }

  private extractPosition(command: string): { x: number, y: number } | null {
    const posMatch = command.match(/position[:]?\s*(\d+)\s*[,\s]\s*(\d+)/i);
    return posMatch ? { x: parseInt(posMatch[1]), y: parseInt(posMatch[2]) } : null;
  }

  private async createCircle(color: string) {
    if (!this.canvas) return;

    const code = `
      const circle = new fabric.Circle({
        radius: 50,
        fill: '${color}',
        left: Math.random() * (canvas.width - 100) + 50,
        top: Math.random() * (canvas.height - 100) + 50
      });
      canvas.add(circle);
      canvas.renderAll();
    `;

    return this.canvas.executeCode(code);
  }

  private async createRectangle(color: string) {
    if (!this.canvas) return;

    await this.canvas.addElement({
      type: 'shape',
      position: {
        x: Math.random() * 300 + 50,
        y: Math.random() * 300 + 50
      },
      size: { width: 100, height: 100 },
      style: { fill: color }
    });
  }

  private async createText(text: string) {
    if (!this.canvas) return;

    await this.canvas.addElement({
      type: 'text',
      position: {
        x: Math.random() * 300 + 50,
        y: Math.random() * 300 + 50
      },
      data: { text },
      style: {
        fill: '#000000',
        fontSize: 24,
        fontFamily: 'Arial'
      }
    });
  }

  private async updateElementStyle(id: string, style: Partial<CanvasElement['style']>) {
    if (!this.canvas) return;
    await this.canvas.updateElement(id, { style });
  }

  private async updateElementPosition(id: string, position: { x: number, y: number }) {
    if (!this.canvas) return;
    await this.canvas.updateElement(id, { position });
  }

  private async applyTemplate(name: string) {
    if (!this.canvas) return;
    
    const template = this.templates.find(t => t.name === name);
    if (!template) {
      throw new Error(`Template "${name}" not found`);
    }

    return this.canvas.executeCode(template.code);
  }

  getTemplates(): Template[] {
    return this.templates;
  }

  addTemplate(template: Template) {
    this.templates.push(template);
  }
}
