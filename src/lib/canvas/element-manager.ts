import { fabric } from 'fabric';
import { thoughtLogger } from '../utils/logger';
import { ErrorHandler } from '../error/error-handler';

interface ElementStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: string;
  opacity?: number;
  shadow?: fabric.Shadow;
}

interface ElementConfig {
  type: 'container' | 'text' | 'image' | 'button' | 'input' | 'section';
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: ElementStyle;
  content?: string;
  metadata?: {
    htmlTag?: string;
    cssClasses?: string[];
    responsive?: {
      breakpoints: {
        sm?: Partial<ElementStyle>;
        md?: Partial<ElementStyle>;
        lg?: Partial<ElementStyle>;
      };
    };
  };
}

export class ElementManager {
  private canvas: fabric.Canvas;
  private elements: Map<string, fabric.Object>;

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas;
    this.elements = new Map();
  }

  async createWebElement(config: ElementConfig): Promise<string> {
    try {
      let element: fabric.Object;

      switch (config.type) {
        case 'container':
          element = await this.createContainer(config);
          break;
        case 'text':
          element = await this.createText(config);
          break;
        case 'button':
          element = await this.createButton(config);
          break;
        case 'section':
          element = await this.createSection(config);
          break;
        default:
          throw new Error(`Unsupported element type: ${config.type}`);
      }

      const id = crypto.randomUUID();
      element.set('id', id);
      
      // Add metadata for code generation
      element.set('metadata', {
        ...config.metadata,
        elementType: config.type,
        exportable: true
      });

      this.elements.set(id, element);
      this.canvas.add(element);
      this.canvas.renderAll();

      return id;
    } catch (error) {
      throw ErrorHandler.handleWithThrow(error, 'create web element');
    }
  }

  private async createContainer(config: ElementConfig): Promise<fabric.Rect> {
    const container = new fabric.Rect({
      left: config.position.x,
      top: config.position.y,
      width: config.size.width,
      height: config.size.height,
      fill: config.style?.fill || 'transparent',
      stroke: config.style?.stroke || '#e5e7eb',
      strokeWidth: config.style?.strokeWidth || 1,
      strokeDashArray: [5, 5],
      rx: 8,
      ry: 8
    });

    // Add container-specific metadata
    container.set('metadata', {
      ...config.metadata,
      htmlTag: 'div',
      cssClasses: ['container', ...(config.metadata?.cssClasses || [])]
    });

    return container;
  }

  private async createText(config: ElementConfig): Promise<fabric.Text> {
    const text = new fabric.Text(config.content || '', {
      left: config.position.x,
      top: config.position.y,
      fontSize: config.style?.fontSize || 16,
      fontFamily: config.style?.fontFamily || 'Inter',
      fill: config.style?.fill || '#1f2937',
      textAlign: config.style?.textAlign as any || 'left'
    });

    // Add text-specific metadata
    text.set('metadata', {
      ...config.metadata,
      htmlTag: 'p',
      cssClasses: ['text', ...(config.metadata?.cssClasses || [])]
    });

    return text;
  }

  private async createButton(config: ElementConfig): Promise<fabric.Group> {
    const bg = new fabric.Rect({
      width: config.size.width,
      height: config.size.height,
      fill: config.style?.fill || '#3b82f6',
      rx: 8,
      ry: 8
    });

    const text = new fabric.Text(config.content || 'Button', {
      fontSize: config.style?.fontSize || 16,
      fontFamily: config.style?.fontFamily || 'Inter',
      fill: '#ffffff',
      top: (config.size.height - (config.style?.fontSize || 16)) / 2,
      left: (config.size.width - (config.content?.length || 6) * 8) / 2
    });

    const button = new fabric.Group([bg, text], {
      left: config.position.x,
      top: config.position.y
    });

    // Add button-specific metadata
    button.set('metadata', {
      ...config.metadata,
      htmlTag: 'button',
      cssClasses: ['btn', ...(config.metadata?.cssClasses || [])],
      interactive: true
    });

    return button;
  }

  private async createSection(config: ElementConfig): Promise<fabric.Rect> {
    const section = new fabric.Rect({
      left: config.position.x,
      top: config.position.y,
      width: config.size.width,
      height: config.size.height,
      fill: config.style?.fill || '#f9fafb',
      stroke: config.style?.stroke || '#e5e7eb',
      strokeWidth: config.style?.strokeWidth || 1
    });

    // Add section-specific metadata
    section.set('metadata', {
      ...config.metadata,
      htmlTag: 'section',
      cssClasses: ['section', ...(config.metadata?.cssClasses || [])],
      responsive: config.metadata?.responsive
    });

    return section;
  }

  async generateCode(): Promise<{ html: string; css: string }> {
    const elements = Array.from(this.elements.values());
    let html = '';
    let css = '';

    // Sort elements by position (top to bottom)
    elements.sort((a, b) => (a.top || 0) - (b.top || 0));

    // Generate HTML
    elements.forEach(element => {
      const metadata = element.get('metadata');
      if (!metadata?.exportable) return;

      const tag = metadata.htmlTag;
      const classes = metadata.cssClasses.join(' ');
      const content = element instanceof fabric.Text ? element.text : '';

      html += `<${tag} class="${classes}">${content}</${tag}>\n`;
    });

    // Generate CSS
    const uniqueClasses = new Set<string>();
    elements.forEach(element => {
      const metadata = element.get('metadata');
      if (!metadata?.exportable) return;

      metadata.cssClasses.forEach(className => {
        if (uniqueClasses.has(className)) return;
        uniqueClasses.add(className);

        css += `.${className} {\n`;
        css += `  position: relative;\n`;
        if (element.fill) css += `  background-color: ${element.fill};\n`;
        if (element instanceof fabric.Text) {
          css += `  font-size: ${element.fontSize}px;\n`;
          css += `  font-family: ${element.fontFamily};\n`;
          css += `  color: ${element.fill};\n`;
        }
        css += `}\n\n`;

        // Add responsive styles
        if (metadata.responsive?.breakpoints) {
          Object.entries(metadata.responsive.breakpoints).forEach(([breakpoint, styles]) => {
            css += `@media (min-width: ${breakpoint === 'sm' ? '640px' : breakpoint === 'md' ? '768px' : '1024px'}) {\n`;
            css += `  .${className} {\n`;
            Object.entries(styles).forEach(([property, value]) => {
              css += `    ${property}: ${value};\n`;
            });
            css += `  }\n`;
            css += `}\n\n`;
          });
        }
      });
    });

    return { html, css };
  }
} 