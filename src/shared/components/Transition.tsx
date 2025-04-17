import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type TransitionVariant = 
  | 'fade'
  | 'fadeUp'
  | 'fadeDown'
  | 'fadeLeft'
  | 'fadeRight'
  | 'scale'
  | 'slideUp'
  | 'slideDown';

export interface TransitionProps extends HTMLMotionProps<'div'> {
  variant?: TransitionVariant;
  duration?: number;
  delay?: number;
  children: React.ReactNode;
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  fadeDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  fadeLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  fadeRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  slideUp: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
  },
  slideDown: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' },
  },
};

export const Transition = forwardRef<HTMLDivElement, TransitionProps>(
  ({ variant = 'fade', duration = 0.3, delay = 0, children, ...props }, ref) => {
    // Create transition settings
    const transition = {
      duration,
      delay,
      ease: [0.25, 0.1, 0.25, 1.0],
    };
    
    // Get variant settings
    const variantSettings = variants[variant];

    return (
      <motion.div
        ref={ref}
        initial={variantSettings.initial}
        animate={variantSettings.animate}
        exit={variantSettings.exit}
        transition={transition}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Transition.displayName = 'Transition';