'use client';

import { useEffect, useRef } from 'react';
import { Canvas as FabricCanvas } from 'fabric/fabric-impl';

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas>();

  useEffect(() => {
    if (canvasRef.current && !fabricRef.current) {
      fabricRef.current = new FabricCanvas(canvasRef.current, {
        width: 800,
        height: 600,
      });
    }

    return () => {
      fabricRef.current?.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-background border border-border rounded-lg">
      <canvas ref={canvasRef} />
    </div>
  );
}
