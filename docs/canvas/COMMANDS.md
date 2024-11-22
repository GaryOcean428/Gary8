# Canvas Commands Guide

## Natural Language Commands

The CanvasAgent supports various natural language commands for interacting with the canvas. Here are the core command categories and examples:

### Shape Creation

```typescript
// Circles
"create circle"                    // Creates default circle
"create circle color: #00a8ff"     // Creates blue circle
"add circle size: 100"             // Creates circle with specific size

// Rectangles
"create rectangle"                 // Creates default rectangle
"add rectangle color: #ff69b4"     // Creates pink rectangle
"create rectangle size: 200x100"   // Creates rectangle with dimensions

// Text
"create text 'Hello World'"        // Creates text element
"add text 'Click me'"              // Creates interactive text
```

### Element Modification

```typescript
// Position
"move id:123 position: 100,200"    // Moves element to coordinates
"center id:123"                    // Centers element on canvas

// Style
"style id:123 color: #00ff00"      // Changes element color
"update id:123 size: 150"          // Updates element size

// Properties
"make id:123 interactive"          // Makes element interactive
"rotate id:123 45degrees"          // Rotates element
```

### Templates

```typescript
// Built-in Templates
"template interactive-demo"         // Creates interactive demo
"template grid"                    // Creates grid layout
"template code-editor"             // Creates code editor

// Custom Templates
"template custom-layout"           // Applies custom template
"template responsive-grid"         // Creates responsive grid
```

### Canvas Operations

```typescript
// Basic Operations
"clear"                           // Clears canvas
"undo"                           // Undoes last action
"redo"                           // Redoes last action

// View Operations
"zoom in"                        // Zooms in canvas
"zoom out"                       // Zooms out canvas
"reset view"                     // Resets canvas view
```

## Code Execution

The canvas supports direct code execution for more complex operations:

### Basic Shapes

```typescript
// Circle
await canvas.executeCode(`
  const circle = new fabric.Circle({
    radius: 50,
    fill: '#00a8ff',
    left: 100,
    top: 100
  });
  canvas.add(circle);
  canvas.renderAll();
`);

// Rectangle
await canvas.executeCode(`
  const rect = new fabric.Rect({
    width: 100,
    height: 100,
    fill: '#ff69b4',
    left: 200,
    top: 200
  });
  canvas.add(rect);
  canvas.renderAll();
`);
```

### Interactive Elements

```typescript
// Interactive Text
await canvas.executeCode(`
  const text = new fabric.Text('Click me!', {
    left: 100,
    top: 100,
    fontSize: 20,
    fill: '#000000'
  });
  
  text.on('mousedown', function() {
    this.set('fill', '#ff0000');
    canvas.renderAll();
  });
  
  text.on('mouseup', function() {
    this.set('fill', '#000000');
    canvas.renderAll();
  });
  
  canvas.add(text);
  canvas.renderAll();
`);
```

### Animations

```typescript
// Simple Animation
await canvas.executeCode(`
  const rect = new fabric.Rect({
    width: 50,
    height: 50,
    fill: '#00a8ff',
    left: 100,
    top: 100
  });
  
  canvas.add(rect);
  
  (function animate() {
    rect.animate('left', rect.left === 100 ? 300 : 100, {
      duration: 1000,
      onChange: canvas.renderAll.bind(canvas),
      onComplete: animate
    });
  })();
`);
```

### Groups and Layouts

```typescript
// Element Group
await canvas.executeCode(`
  const group = new fabric.Group([], {
    left: 100,
    top: 100
  });
  
  const background = new fabric.Rect({
    width: 200,
    height: 100,
    fill: '#f0f0f0'
  });
  
  const text = new fabric.Text('Group Example', {
    fontSize: 16,
    fill: '#000000',
    left: 50,
    top: 40
  });
  
  group.addWithUpdate(background);
  group.addWithUpdate(text);
  
  canvas.add(group);
  canvas.renderAll();
`);
```

## Command Response Handling

When using commands, always handle potential errors and responses:

```typescript
try {
  const result = await agent.executeCommand('create circle color: #00a8ff');
  console.log('Command executed:', result);
} catch (error) {
  if (error.code === 'INVALID_COMMAND') {
    console.error('Invalid command:', error.message);
  } else if (error.code === 'EXECUTION_ERROR') {
    console.error('Execution failed:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Command Chaining

Multiple commands can be chained together:

```typescript
async function createScene() {
  await agent.executeCommand('clear');
  await agent.executeCommand('template grid');
  await agent.executeCommand('create circle color: #00a8ff');
  await agent.executeCommand('create text "Hello World"');
  await agent.executeCommand('move id:2 position: 150,150');
}
```

## Best Practices

1. Always handle command errors appropriately
2. Use template strings for complex code execution
3. Chain related commands for better organization
4. Provide feedback for long-running operations
5. Validate user input before execution
6. Use appropriate error messages for failed commands
7. Implement proper cleanup after command execution
8. Monitor performance during command chains
