# Canvas Theming System

## Color Palette

The theme system is based on the Gary8 logo colors:

### Core Colors
```typescript
// Dark Theme (Default)
{
  background: '#1a1b2e',  // Dark navy from logo
  foreground: '#f8f9fa',  // Light gray
  primary: '#00a8ff',     // Bright blue from logo
  secondary: '#ff69b4',   // Pink from logo
  accent: '#00a8ff',      // Bright blue glow effect
  border: '#2d3748'       // Dark gray
}

// Light Theme
{
  background: '#f8f9fa',  // Light gray
  foreground: '#1a1b2e',  // Dark navy
  primary: '#00a8ff',     // Bright blue
  secondary: '#ff69b4',   // Pink
  accent: '#00a8ff',      // Bright blue
  border: '#e2e8f0'       // Light gray
}
```

### Text Colors
```typescript
// Dark Theme
{
  text: {
    primary: '#f8f9fa',    // Light gray
    secondary: '#a0aec0',  // Muted gray
    accent: '#00a8ff'      // Bright blue
  }
}

// Light Theme
{
  text: {
    primary: '#1a1b2e',    // Dark navy
    secondary: '#4a5568',  // Dark gray
    accent: '#00a8ff'      // Bright blue
  }
}
```

### Code Colors
```typescript
// Dark Theme
{
  code: {
    background: '#2d3748',  // Dark gray
    text: '#f8f9fa',       // Light gray
    comment: '#a0aec0',    // Muted gray
    keyword: '#00a8ff',    // Bright blue
    string: '#ff69b4',     // Pink
    function: '#9f7aea'    // Purple
  }
}

// Light Theme
{
  code: {
    background: '#f1f5f9',  // Very light gray
    text: '#1a1b2e',       // Dark navy
    comment: '#64748b',    // Medium gray
    keyword: '#00a8ff',    // Bright blue
    string: '#ff69b4',     // Pink
    function: '#7c3aed'    // Purple
  }
}
```

## Theme Integration

### Component Usage

```typescript
import { useTheme } from '../../hooks/useTheme';

function MyComponent() {
  const { theme, isDark } = useTheme();
  
  return (
    <div style={{ 
      background: theme.background,
      color: theme.text.primary 
    }}>
      <h1 style={{ color: theme.primary }}>
        Title
      </h1>
      <p style={{ color: theme.text.secondary }}>
        Content
      </p>
      <button style={{ 
        background: theme.primary,
        color: theme.background 
      }}>
        Action
      </button>
    </div>
  );
}
```

### Canvas Theme Application

```typescript
// In Canvas component
useEffect(() => {
  if (canvasRef.current) {
    const theme = isDark ? darkTheme : lightTheme;
    
    // Update canvas background
    canvasRef.current.executeCode(`
      canvas.setBackgroundColor('${theme.background}', () => {
        canvas.renderAll();
      });
    `);

    // Update text elements
    canvasRef.current.executeCode(`
      canvas.getObjects('text').forEach(obj => {
        obj.set('fill', '${theme.text.primary}');
      });
      canvas.renderAll();
    `);

    // Update shapes
    canvasRef.current.executeCode(`
      canvas.getObjects().forEach(obj => {
        if (obj.type !== 'text') {
          obj.set('stroke', '${theme.border}');
        }
      });
      canvas.renderAll();
    `);
  }
}, [isDark]);
```

### Theme Switching

```typescript
function App() {
  const [isDark, setIsDark] = useState(true);
  
  const toggleTheme = () => {
    setIsDark(!isDark);
  };
  
  return (
    <ThemeProvider isDark={isDark}>
      <div className="app">
        <button onClick={toggleTheme}>
          Toggle Theme
        </button>
        <Canvas isDarkMode={isDark} />
      </div>
    </ThemeProvider>
  );
}
```

## Element Theming

### Shapes
```typescript
// Circle with theme colors
await canvas.executeCode(`
  const circle = new fabric.Circle({
    radius: 50,
    fill: '${theme.primary}',
    stroke: '${theme.border}',
    left: 100,
    top: 100
  });
  canvas.add(circle);
`);

// Rectangle with theme colors
await canvas.executeCode(`
  const rect = new fabric.Rect({
    width: 100,
    height: 100,
    fill: '${theme.secondary}',
    stroke: '${theme.border}',
    left: 200,
    top: 200
  });
  canvas.add(rect);
`);
```

### Text
```typescript
// Regular text
await canvas.executeCode(`
  const text = new fabric.Text('Hello World', {
    left: 100,
    top: 100,
    fill: '${theme.text.primary}',
    fontSize: 24
  });
  canvas.add(text);
`);

// Code text
await canvas.executeCode(`
  const code = new fabric.Textbox('console.log("Hello");', {
    left: 100,
    top: 200,
    width: 300,
    fill: '${theme.code.text}',
    backgroundColor: '${theme.code.background}',
    fontFamily: 'monospace',
    fontSize: 14
  });
  canvas.add(code);
`);
```

### Interactive Elements
```typescript
// Button with hover effect
await canvas.executeCode(`
  const button = new fabric.Group([], {
    left: 100,
    top: 100
  });

  const background = new fabric.Rect({
    width: 120,
    height: 40,
    fill: '${theme.primary}',
    rx: 8,
    ry: 8
  });

  const text = new fabric.Text('Click Me', {
    fill: '${theme.background}',
    fontSize: 16,
    left: 30,
    top: 10
  });

  button.addWithUpdate(background);
  button.addWithUpdate(text);

  button.on('mouseover', () => {
    background.set('fill', '${theme.secondary}');
    canvas.renderAll();
  });

  button.on('mouseout', () => {
    background.set('fill', '${theme.primary}');
    canvas.renderAll();
  });

  canvas.add(button);
`);
```

## Best Practices

1. **Color Usage**
   - Use primary color for main actions and focus
   - Use secondary color for highlights and accents
   - Use text colors appropriately for hierarchy
   - Maintain good contrast ratios

2. **Theme Switching**
   - Animate theme transitions when possible
   - Update all elements consistently
   - Preserve element states during switch
   - Handle theme-specific assets

3. **Performance**
   - Batch theme updates
   - Cache theme values
   - Minimize redraws
   - Use efficient selectors

4. **Accessibility**
   - Ensure sufficient contrast
   - Support system theme preferences
   - Provide theme toggle feedback
   - Maintain readability

5. **Maintenance**
   - Keep theme definitions centralized
   - Document color usage
   - Version theme changes
   - Test both themes thoroughly
