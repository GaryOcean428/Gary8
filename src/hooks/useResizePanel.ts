import { useState, useEffect } from 'react';

export function useResizePanel(
  _initialWidth: number,
  _setWidth: (width: number) => void,
  _minWidth = 300,
  _maxWidth = 800
) {
  const [isDragging, setIsDragging] = useState(false);

  const startResize = (_event: React.MouseEvent) => {
    _event.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleResize = (_event: MouseEvent) => {
      if (!isDragging) return;

      const newWidth = window.innerWidth - _event.clientX;
      if (newWidth >= _minWidth && newWidth <= _maxWidth) {
        _setWidth(newWidth);
      }
    };

    const stopResize = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
    }

    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    };
  }, [isDragging, _setWidth, _minWidth, _maxWidth]);

  return { isDragging, startResize };
}