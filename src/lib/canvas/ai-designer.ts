import { thoughtLogger } from '../logging/thought-logger';
import { CanvasManager } from './canvas-manager';
import { ModelRouter } from '../routing/model-router';
import type { CanvasElement, DesignSpec } from './types';
import { fabric } from 'fabric';

export class AIDesigner {
  private static instance: AIDesigner;
  private canvasManager: CanvasManager;
  private modelRouter: ModelRouter;

  private constructor() {
    this.canvasManager = CanvasManager.getInstance();
    this.modelRouter = new ModelRouter();
  }

  static getInstance(): AIDesigner {
    if (!AIDesigner.instance) {
      AIDesigner.instance = new AIDesigner();
    }
    return AIDesigner.instance;
  }

  async generateDesign(_prompt: string, _canvas: fabric.Canvas): Promise<void> {
    thoughtLogger.log('plan', 'Generating design from prompt', { _prompt });

    try {
      // Route to appropriate model for design generation
      const routerConfig = await this.modelRouter.route(_prompt, []);

      // Generate design specification
      const designSpec = await this.generateDesignSpec(_prompt, routerConfig);

      // Clear canvas
      _canvas.clear();

      // Create layout containers
      for (const layout of designSpec.layout) {
        const container = new fabric.Rect({
          left: layout.x,
          top: layout.y,
          width: layout.width,
          height: layout.height,
          fill: 'transparent',
          stroke: '#e5e7eb',
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          selectable: false
        });
        _canvas.add(container);
      }

      // Create components
      for (const component of designSpec.components) {
        let element: fabric.Object;

        switch (component.type) {
          case 'text':
            element = new fabric.Text(component.text || '', {
              left: component.x,
              top: component.y,
              fontSize: this.getFontSize(component.variant || 'body'),
              fontFamily: 'Inter',
              fill: '#1f2937'
            });
            break;

          case 'button':
            const buttonGroup = new fabric.Group([], {
              left: component.x,
              top: component.y
            });

            const buttonBg = new fabric.Rect({
              width: component.width || 120,
              height: component.height || 40,
              fill: '#3b82f6',
              rx: 6,
              ry: 6
            });

            const buttonText = new fabric.Text(component.text || 'Button', {
              fontSize: 14,
              fill: '#ffffff',
              originX: 'center',
              originY: 'center',
              left: (component.width || 120) / 2,
              top: (component.height || 40) / 2
            });

            buttonGroup.addWithUpdate(buttonBg);
            buttonGroup.addWithUpdate(buttonText);
            element = buttonGroup;
            break;

          case 'input':
            const inputGroup = new fabric.Group([], {
              left: component.x,
              top: component.y
            });

            const inputBg = new fabric.Rect({
              width: component.width || 200,
              height: component.height || 40,
              fill: '#ffffff',
              stroke: '#d1d5db',
              strokeWidth: 1,
              rx: 6,
              ry: 6
            });

            const placeholder = new fabric.Text(component.text || 'Enter text...', {
              fontSize: 14,
              fill: '#9ca3af',
              left: 12,
              top: (component.height || 40) / 2 - 7
            });

            inputGroup.addWithUpdate(inputBg);
            inputGroup.addWithUpdate(placeholder);
            element = inputGroup;
            break;

          default:
            element = new fabric.Rect({
              left: component.x,
              top: component.y,
              width: component.width || 100,
              height: component.height || 100,
              fill: '#ffffff',
              stroke: '#d1d5db',
              strokeWidth: 1
            });
        }

        // Apply styles
        if (designSpec.styles[component.type]) {
          element.set(designSpec.styles[component.type]);
        }

        _canvas.add(element);
      }

      _canvas.renderAll();
      thoughtLogger.log('success', 'Design generated successfully');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to generate design', { error });
      throw error;
    }
  }

  private async generateDesignSpec(_prompt: string, _config: unknown): Promise<DesignSpec> {
    // This would normally call an LLM to generate the design spec
    // For now, return a simple example spec
    return {
      layout: [
        {
          type: 'container',
          x: 50,
          y: 50,
          width: 800,
          height: 600,
          name: 'main'
        }
      ],
      components: [
        {
          type: 'text',
          x: 100,
          y: 100,
          text: 'Welcome to Your Design',
          variant: 'h1'
        },
        {
          type: 'button',
          x: 100,
          y: 200,
          width: 120,
          height: 40,
          text: 'Get Started'
        },
        {
          type: 'input',
          x: 100,
          y: 300,
          width: 200,
          height: 40,
          text: 'Enter your email...'
        }
      ],
      styles: {
        text: {
          fontFamily: 'Inter',
          fill: '#1f2937'
        },
        button: {
          fill: '#3b82f6',
          stroke: null
        },
        input: {
          fill: '#ffffff',
          stroke: '#d1d5db',
          strokeWidth: 1
        }
      }
    };
  }

  private getFontSize(_variant: string): number {
    switch (_variant) {
      case 'h1': return 40;
      case 'h2': return 32;
      case 'h3': return 28;
      case 'h4': return 24;
      case 'h5': return 20;
      case 'h6': return 18;
      case 'body': return 16;
      case 'small': return 14;
      default: return 16;
    }
  }
}