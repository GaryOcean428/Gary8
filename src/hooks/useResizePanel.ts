import { useState, useEffect } from 'react';

export function useResizePanel(
  initialWidth: number,
  setWidth: (width: number) => void,
  minWidth = 300,
  maxWidth = 800
) {
  const [isDragging, setIsDragging] = useState(false);

  const startResize = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleResize = (event: MouseEvent) => {
      if (!isDragging) return;

      const newWidth = window.innerWidth - event.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
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
  }, [isDragging, setWidth, minWidth, maxWidth]);

  return { isDragging, startResize };
}