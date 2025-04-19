# Bench (Workbench) Documentation

## Overview

The Bench (formerly Canvas) component is an AI-powered development workbench that enables:

- Natural language design and code generation
- Real-time collaborative editing
- Component-based layouts and workflows
- Interactive workflow visualization
- Export to multiple formats

## Architecture

### Core Components

1. **AIDesigner**

   ```typescript
   interface DesignSpec {
     layout: LayoutElement[];
     components: ComponentSpec[];
     styles: StyleDefinitions;
   }
   ```

2. **BenchManager**

   ```typescript
   interface BenchState {
     elements: BenchElement[];
     selectedIds: string[];
     scale: number;
     history: {
       past: BenchElement[][];
       future: BenchElement[][];
     };
   }
   ```

3. **BenchToolbar**
   - Selection tools
   - Shape tools
   - Text tools
   - Drawing tools
   - Export options

4. **BenchProperties**
   - Position editing
   - Size controls
   - Style properties
   - Text formatting

5. **WorkflowVisualizer**

   ```typescript
   interface WorkflowSpec {
     nodes: WorkflowNode[];
     edges: WorkflowEdge[];
     taskStatus: Record<string, 'todo' | 'inprogress' | 'done' | 'error' | 'skipped'>;
   }
   ```

## Features

### 1. Design Generation

- Natural language input
- Component-based layouts
- Automatic styling
- Responsive design

### 2. Code Sandbox

- Multiple language support
- Secure execution environment
- Integrated console output
- Code export

### 3. Workflow Visualization

- Interactive mermaid diagrams
- Drag and drop interface
- Status tracking with visual indicators
- Integration with development tasks

### 4. Editing Tools

- Selection
- Transformation
- Property editing
- Layer management

### 5. Export Options

- React components
- HTML/CSS
- Image formats
- Design specs

## Usage Example

```typescript
// Generate design
await aiDesigner.generateDesign(
  "Create a modern landing page with hero section"
);

// Update element
benchManager.updateElement(id, {
  style: {
    fill: '#3b82f6',
    fontSize: 24
  }
});

// Create workflow
benchManager.createWorkflow({
  title: "App Development",
  steps: [
    { id: "setup", label: "Setup Environment", status: "done" },
    { id: "frontend", label: "Frontend Development", status: "inprogress" },
    { id: "backend", label: "Backend Integration", status: "todo" }
  ]
});

// Export design
const code = await benchManager.exportToCode('react');
```

## Best Practices

### 1. Design Generation

- Use clear, descriptive prompts
- Start with layout structure
- Refine details iteratively
- Maintain consistency

### 2. Component Management

- Use semantic naming
- Group related elements
- Maintain hierarchy
- Apply consistent styling

### 3. Workflow Design

- Break down tasks into clear steps
- Use consistent status indications
- Organize nodes logically
- Update status in real-time

### 4. Performance

- Optimize rendering
- Batch updates
- Use efficient data structures
- Implement undo/redo efficiently

### 5. Export

- Generate clean code
- Maintain accessibility
- Include documentation
- Support multiple formats

## Integration with Chat

The Bench integrates with Chat, enabling agents to:

- Reference Bench activity
- Create tools on-the-fly as needed
- Update workflow status
- Generate design components based on conversation

This integration allows for a seamless development experience where conversation-driven AI can directly manipulate the development workbench.
