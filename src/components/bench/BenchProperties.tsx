import { fabric } from 'fabric';

interface BenchPropertiesProps {
  readonly selectedObject: fabric.Object | null;
  readonly onPropertyChange: (property: string, value: unknown) => void;
}

export function BenchProperties({
  selectedObject,
  onPropertyChange
}: BenchPropertiesProps) {
  if (!selectedObject) return null;

  return (
    <div className="absolute right-4 top-20 bg-white rounded-lg shadow-lg p-4 w-64">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Properties</h3>
      
      <div className="space-y-4">
        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="bench-properties-left" className="block text-sm font-medium mb-1 text-gray-700">X</label>
            <input
              id="bench-properties-left"
              type="number"
              value={Math.round(selectedObject.left || 0)}
              onChange={(_e) => onPropertyChange('left', parseInt(_e.target.value))}
              className="w-full px-2 py-1 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="bench-properties-top" className="block text-sm font-medium mb-1 text-gray-700">Y</label>
            <input
              id="bench-properties-top"
              type="number"
              value={Math.round(selectedObject.top || 0)}
              onChange={(_e) => onPropertyChange('top', parseInt(_e.target.value))}
              className="w-full px-2 py-1 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Size */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="bench-properties-width" className="block text-sm font-medium mb-1 text-gray-700">Width</label>
            <input
              id="bench-properties-width"
              type="number"
              value={Math.round(selectedObject.width || 0)}
              onChange={(_e) => onPropertyChange('width', parseInt(_e.target.value))}
              className="w-full px-2 py-1 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="bench-properties-height" className="block text-sm font-medium mb-1 text-gray-700">Height</label>
            <input
              id="bench-properties-height"
              type="number"
              value={Math.round(selectedObject.height || 0)}
              onChange={(_e) => onPropertyChange('height', parseInt(_e.target.value))}
              className="w-full px-2 py-1 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Style */}
        {selectedObject.type === 'rect' && (
          <>
            <div>
              <label htmlFor="bench-properties-fill-color" className="block text-sm font-medium mb-1 text-gray-700">Fill Color</label>
              <input
                id="bench-properties-fill-color"
                type="color"
                value={typeof selectedObject.fill === 'string' ? selectedObject.fill : '#000000'}
                onChange={(_e) => onPropertyChange('fill', _e.target.value)}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="bench-properties-stroke-color" className="block text-sm font-medium mb-1 text-gray-700">Border Color</label>
              <input
                id="bench-properties-stroke-color"
                type="color"
                value={typeof selectedObject.stroke === 'string' ? selectedObject.stroke : '#000000'}
                onChange={(_e) => onPropertyChange('stroke', _e.target.value)}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="bench-properties-stroke-width" className="block text-sm font-medium mb-1 text-gray-700">Border Width</label>
              <input
                id="bench-properties-stroke-width"
                type="number"
                value={selectedObject.strokeWidth || 0}
                onChange={(_e) => onPropertyChange('strokeWidth', parseInt(_e.target.value))}
                className="w-full px-2 py-1 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        )}

        {/* Text Properties */}
        {selectedObject.type === 'text' && (
          <>
            <div>
              <label htmlFor="bench-properties-text" className="block text-sm font-medium mb-1 text-gray-700">Text</label>
              <input
                id="bench-properties-text"
                type="text"
                value={(selectedObject as fabric.Text).text}
                onChange={(_e) => onPropertyChange('text', _e.target.value)}
                className="w-full px-2 py-1 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="bench-properties-font-size" className="block text-sm font-medium mb-1 text-gray-700">Font Size</label>
              <input
                id="bench-properties-font-size"
                type="number"
                value={(selectedObject as fabric.Text).fontSize || 16}
                onChange={(_e) => onPropertyChange('fontSize', parseInt(_e.target.value))}
                className="w-full px-2 py-1 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="bench-properties-text-color" className="block text-sm font-medium mb-1 text-gray-700">Text Color</label>
              {/* Use a string-only value for the color input */}
              <input
                id="bench-properties-text-color"
                type="color"
                value={(() => {
                  const fill = (selectedObject as fabric.Text).fill;
                  return typeof fill === 'string' ? fill : '#000000';
                })()}
                onChange={(_e) => onPropertyChange('fill', _e.target.value)}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
