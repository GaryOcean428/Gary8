import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedIconProps {
  readonly Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; // Added readonly
  readonly x: number; // Added readonly
  readonly y: number; // Added readonly
  readonly size: number;
  readonly color: string;
  readonly isPlaying: boolean;
  readonly delay?: number;
}

export function AnimatedIcon({
  Icon,
  x,
  y,
  size,
  color,
  isPlaying,
  delay = 0
}: AnimatedIconProps) {
  return (
    <motion.div
      className="animated-icon" // Ensure this class exists and is styled in a relevant CSS file (e.g., AnimationScene.css)
      style={{ position: 'absolute', left: x, top: y, color }} // Added position absolute
      animate={isPlaying ? {
        y: [0, -10, 0],
        rotate: [0, 5, -5, 0],
        scale: [1, 1.05, 1],
      } : {}}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      <Icon width={size} height={size} />
    </motion.div>
  );
}
