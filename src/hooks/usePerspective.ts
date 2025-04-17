import { useState, useEffect } from 'react';
import { MotionValue, useTransform, useSpring } from 'framer-motion';

interface PerspectiveOptions {
  strength?: number;
  springConfig?: {
    stiffness?: number;
    damping?: number;
  };
}

/**
 * Custom hook that creates a perspective effect based on mouse input
 */
export function usePerspective(
  mouseX: MotionValue<number>,
  mouseY: MotionValue<number>,
  options: PerspectiveOptions = {}
) {
  const {
    strength = 10,
    springConfig = { stiffness: 400, damping: 30 }
  } = options;

  // Convert 0-1 values to degrees for rotation, centered at 0.5
  const rotateY = useTransform(mouseX, [0, 1], [strength, -strength]);
  const rotateX = useTransform(mouseY, [0, 1], [-strength, strength]);
  
  // Add spring physics for smoother motion
  const smoothRotateX = useSpring(rotateX, {
    stiffness: springConfig.stiffness,
    damping: springConfig.damping
  });
  
  const smoothRotateY = useSpring(rotateY, {
    stiffness: springConfig.stiffness,
    damping: springConfig.damping
  });

  return { rotateX: smoothRotateX, rotateY: smoothRotateY };
}