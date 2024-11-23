import { useEffect, useRef } from 'react';
import * as fabric from 'fabric';

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas>();

  useEffect(() => {
    if (canvasRef.current && !fabricRef.current) {
      fabricRef.current = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
      });
    }

    return () => {
      fabricRef.current?.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} />;
}
