import React from 'react';
import { Canvas, Object as FabricObject, Text } from 'fabric';

interface CanvasPropertiesProps {
  selectedObject: FabricObject | null;
  onPropertyChange: (property: string, value: any) => void;
}

export function CanvasProperties({
  selectedObject,
  onPropertyChange
}: CanvasPropertiesProps) {
  if (!selectedObject) return null;

  return (
    <div className="absolute right-4 top-20 bg-white rounded-lg shadow-lg p-4 w-64">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Properties</h3>
      
      <div className="space-y-4">
        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="pos-x" className="block text-sm font-medium mb-1 text-gray-700">X</label>
            <input
              id="pos-x"
              type="number"
              value={Math.round(selectedObject.left || 0)}
              onChange={(e) => onPropertyChange('left', parseInt(e.target.value))}
              className="w-full px-2 py-1 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              title="X position"
              placeholder="X position"
            />
          </div>
          <div>
            <label htmlFor="pos-y" className="block text-sm font-medium mb-1 text-gray-700">Y</label>
            <input
              id="pos-y"
              type="number"
              value={Math.round(selectedObject.top || 0)}
              onChange={(e) => onPropertyChange('top', parseInt(e.target.value))}
              className="w-full px-2 py-1 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              title="Y position"
              placeholder="Y position"
            />
          </div>
        </div>

        {/* Size */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="obj-width" className="block text-sm font-medium mb-1 text-gray-700">Width</label>
            <input
              id="obj-width"
              type="number"
              value={Math.round(selectedObject.width || 0)}
              onChange={(e) => onPropertyChange('width', parseInt(e.target.value))}
              className="w-full px-2 py-1 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              title="Object width"
              placeholder="Width"
            />
          </div>
          <div>
            <label htmlFor="obj-height" className="block text-sm font-medium mb-1 text-gray-700">Height</label>
            <input
              id="obj-height"
              type="number"
              value={Math.round(selectedObject.height || 0)}
              onChange={(e) => onPropertyChange('height', parseInt(e.target.value))}
              className="w-full px-2 py-1 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              title="Object height"
              placeholder="Height"
            />
          </div>
        </div>

        {/* Style */}
        {selectedObject.type === 'rect' && (
          <>
            <div>
              <label htmlFor="fill-color" className="block text-sm font-medium mb-1 text-gray-700">Fill Color</label>
              <input
                id="fill-color"
                type="color"
                value={selectedObject.fill?.toString() || '#000000'}
                onChange={(e) => onPropertyChange('fill', e.target.value)}
                className="w-full h-8 rounded cursor-pointer"
                title="Fill color"
              />
            </div>
            <div>
              <label htmlFor="border-color" className="block text-sm font-medium mb-1 text-gray-700">Border Color</label>
              <input
                id="border-color"
                type="color"
                value={selectedObject.stroke?.toString() || '#000000'}
                onChange={(e) => onPropertyChange('stroke', e.target.value)}
                className="w-full h-8 rounded cursor-pointer"
                title="Border color"
              />
            </div>
            <div>
              <label htmlFor="border-width" className="block text-sm font-medium mb-1 text-gray-700">Border Width</label>
              <input
                id="border-width"
                type="number"
                value={selectedObject.strokeWidth || 0}
                onChange={(e) => onPropertyChange('strokeWidth', parseInt(e.target.value))}
                className="w-full px-2 py-1 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                title="Border width"
                placeholder="Border width"
              />
            </div>
          </>
        )}

        {/* Text Properties */}
        {selectedObject.type === 'text' && (
          <>
            <div>
              <label htmlFor="text-content" className="block text-sm font-medium mb-1 text-gray-700">Text</label>
              <input
                id="text-content"
                type="text"
                value={(selectedObject as Text).text}
                onChange={(e) => onPropertyChange('text', e.target.value)}
                className="w-full px-2 py-1 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                title="Text content"
                placeholder="Enter text"
              />
            </div>
            <div>
              <label htmlFor="font-size" className="block text-sm font-medium mb-1 text-gray-700">Font Size</label>
              <input
                id="font-size"
                type="number"
                value={(selectedObject as Text).fontSize || 16}
                onChange={(e) => onPropertyChange('fontSize', parseInt(e.target.value))}
                className="w-full px-2 py-1 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                title="Font size"
                placeholder="Font size"
              />
            </div>
            <div>
              <label htmlFor="text-color" className="block text-sm font-medium mb-1 text-gray-700">Text Color</label>
              <input
                id="text-color"
                type="color"
                value={(selectedObject as Text).fill?.toString() || '#000000'}
                onChange={(e) => onPropertyChange('fill', e.target.value)}
                className="w-full h-8 rounded cursor-pointer"
                title="Text color"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
