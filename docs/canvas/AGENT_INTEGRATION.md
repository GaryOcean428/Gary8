# Canvas Agent Integration Guide

## Overview

The Canvas system provides deep integration with AI agents, allowing them to:
- Execute natural language commands
- Generate and run code
- Create and manage templates
- Build custom tools
- Provide visual feedback
- Iterate on designs

## Agent Capabilities

### 1. Natural Language Processing

The CanvasAgent can interpret various natural language commands:

```typescript
// Basic shape creation
"create circle color: #00a8ff"
"add rectangle size: 200x100"

// Complex operations
"create interactive button with hover effect"
"build responsive grid layout 3x3"

// Style modifications
"make all circles blue"
"apply gradient to selected elements"

// Layout operations
"arrange elements in circle"
"distribute elements evenly"
```

### 2. Code Generation & Execution

Agents can generate and execute code based on high-level instructions:

```typescript
const agent = new CanvasAgent();
agent.setCanvas(canvasRef.current);

// Generate and execute code
await agent.executeCommand(`
  execute code:
  const button = new fabric.Group([], {
    left: 100,
    top: 100
  });

  const bg = new fabric.Rect({
    width: 120,
    height: 40,
    fill: '${theme.primary}',
    rx: 8
  });

  const text = new fabric.Text('Click Me', {
    fill: '${theme.background}',
    fontSize: 16,
    left: 30,
    top: 10
  });

  button.addWithUpdate(bg);
  button.addWithUpdate(text);
  canvas.add(button);
`);
```

### 3. Template Management

Agents can create, modify, and apply templates:

```typescript
// Define new template
agent.addTemplate({
  name: 'custom-button',
  description: 'Creates a styled button with hover effects',
  code: `
    const createButton = (text, options = {}) => {
      const button = new fabric.Group([], {
        left: options.left || 100,
        top: options.top || 100
      });

      const bg = new fabric.Rect({
        width: options.width || 120,
        height: options.height || 40,
        fill: options.fill || '${theme.primary}',
        rx: options.rx || 8
      });

      const label = new fabric.Text(text, {
        fill: options.textColor || '${theme.background}',
        fontSize: options.fontSize || 16,
        left: 30,
        top: 10
      });

      button.addWithUpdate(bg);
      button.addWithUpdate(label);

      // Add hover effects
      button.on('mouseover', () => {
        bg.set('fill', options.hoverFill || '${theme.secondary}');
        canvas.renderAll();
      });

      button.on('mouseout', () => {
        bg.set('fill', options.fill || '${theme.primary}');
        canvas.renderAll();
      });

      return button;
    };

    // Create and add button to canvas
    const button = createButton('Click Me', {
      left: 100,
      top: 100,
      width: 150,
      height: 50
    });
    
    canvas.add(button);
    canvas.renderAll();
  `
});

// Use template
await agent.executeCommand('template custom-button');
```

### 4. Tool Building

Agents can create their own tools for common operations:

```typescript
class CanvasTools {
  constructor(private agent: CanvasAgent) {}

  // Create a tool for generating forms
  async createForm(fields: Array<{label: string, type: string}>) {
    const formCode = `
      const form = new fabric.Group([], {
        left: 50,
        top: 50
      });

      const bg = new fabric.Rect({
        width: 300,
        height: ${fields.length * 60 + 40},
        fill: '${theme.background}',
        stroke: '${theme.border}',
        rx: 8
      });
      form.addWithUpdate(bg);

      ${fields.map((field, i) => `
        const ${field.label}Label = new fabric.Text('${field.label}:', {
          left: 20,
          top: ${i * 60 + 20},
          fill: '${theme.text.primary}',
          fontSize: 16
        });
        form.addWithUpdate(${field.label}Label);

        const ${field.label}Input = new fabric.Textbox('', {
          left: 120,
          top: ${i * 60 + 20},
          width: 150,
          height: 30,
          fill: '${theme.text.primary}',
          backgroundColor: '${theme.code.background}',
          fontSize: 14
        });
        form.addWithUpdate(${field.label}Input);
      `).join('\n')}

      canvas.add(form);
      canvas.renderAll();
    `;

    await this.agent.executeCommand(`execute code: ${formCode}`);
  }

  // Create a tool for generating charts
  async createChart(data: Array<{label: string, value: number}>) {
    const chartCode = `
      const chart = new fabric.Group([], {
        left: 50,
        top: 50
      });

      const bg = new fabric.Rect({
        width: 400,
        height: 300,
        fill: '${theme.background}',
        stroke: '${theme.border}'
      });
      chart.addWithUpdate(bg);

      const maxValue = ${Math.max(...data.map(d => d.value))};
      const barWidth = 30;
      const spacing = 20;

      ${data.map((d, i) => `
        const bar${i} = new fabric.Rect({
          left: ${i * (barWidth + spacing) + 40},
          top: ${300 - (d.value / maxValue * 250) - 20},
          width: ${barWidth},
          height: ${d.value / maxValue * 250},
          fill: '${theme.primary}'
        });
        chart.addWithUpdate(bar${i});

        const label${i} = new fabric.Text('${d.label}', {
          left: ${i * (barWidth + spacing) + 40},
          top: 260,
          fill: '${theme.text.primary}',
          fontSize: 12,
          angle: -45
        });
        chart.addWithUpdate(label${i});
      `).join('\n')}

      canvas.add(chart);
      canvas.renderAll();
    `;

    await this.agent.executeCommand(`execute code: ${chartCode}`);
  }

  // Create a tool for generating navigation menus
  async createNavMenu(items: Array<string>) {
    const menuCode = `
      const menu = new fabric.Group([], {
        left: 50,
        top: 50
      });

      const bg = new fabric.Rect({
        width: ${items.length * 120 + 40},
        height: 60,
        fill: '${theme.background}',
        stroke: '${theme.border}',
        rx: 8
      });
      menu.addWithUpdate(bg);

      ${items.map((item, i) => `
        const item${i} = new fabric.Text('${item}', {
          left: ${i * 120 + 30},
          top: 20,
          fill: '${theme.text.primary}',
          fontSize: 16
        });

        item${i}.on('mouseover', function() {
          this.set('fill', '${theme.primary}');
          canvas.renderAll();
        });

        item${i}.on('mouseout', function() {
          this.set('fill', '${theme.text.primary}');
          canvas.renderAll();
        });

        menu.addWithUpdate(item${i});
      `).join('\n')}

      canvas.add(menu);
      canvas.renderAll();
    `;

    await this.agent.executeCommand(`execute code: ${menuCode}`);
  }
}

// Usage example
const tools = new CanvasTools(agent);

// Create a form
await tools.createForm([
  { label: 'Name', type: 'text' },
  { label: 'Email', type: 'email' },
  { label: 'Message', type: 'textarea' }
]);

// Create a chart
await tools.createChart([
  { label: 'A', value: 100 },
  { label: 'B', value: 150 },
  { label: 'C', value: 75 }
]);

// Create a navigation menu
await tools.createNavMenu([
  'Home',
  'About',
  'Services',
  'Contact'
]);
```

### 5. Iteration & Feedback

Agents can iterate on designs based on feedback:

```typescript
class DesignIterator {
  constructor(private agent: CanvasAgent) {}

  async iterate(feedback: string) {
    // Parse feedback and make adjustments
    if (feedback.includes('larger')) {
      await this.agent.executeCommand('scale selected 1.2');
    }
    
    if (feedback.includes('brighter')) {
      await this.agent.executeCommand('adjust brightness +20');
    }
    
    if (feedback.includes('center')) {
      await this.agent.executeCommand('center selected');
    }

    // Provide visual feedback
    await this.agent.executeCommand(`
      execute code:
      const feedback = new fabric.Text('Applied changes: ${feedback}', {
        left: 10,
        top: 10,
        fill: '${theme.text.secondary}',
        fontSize: 12
      });
      canvas.add(feedback);
      setTimeout(() => {
        canvas.remove(feedback);
        canvas.renderAll();
      }, 3000);
    `);
  }
}

// Usage example
const iterator = new DesignIterator(agent);
await iterator.iterate('make the button larger and center it');
```

## Best Practices

1. **Code Generation**
   - Generate clean, readable code
   - Include error handling
   - Use theme variables
   - Add comments for clarity

2. **Tool Building**
   - Make tools reusable
   - Support customization
   - Provide clear feedback
   - Handle edge cases

3. **Template Management**
   - Document templates clearly
   - Version templates
   - Test thoroughly
   - Support parameters

4. **Performance**
   - Batch operations
   - Optimize rendering
   - Clean up resources
   - Cache results

5. **Security**
   - Validate input
   - Sanitize code
   - Limit scope
   - Handle errors
