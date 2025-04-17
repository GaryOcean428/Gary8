import React from 'react';
import { motion } from 'framer-motion';
import { randomBetween } from '../../lib/utils/mathUtils';

interface CharacterProps {
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  color?: string;
  delay?: number;
  duration?: number;
  depth?: number;
  isPlaying?: boolean;
}

export function Character({
  x,
  y,
  scale = 1,
  rotation = 0,
  color = '#3B82F6',
  delay = 0,
  duration = 3,
  depth = 0,
  isPlaying = true,
}: CharacterProps) {
  // Apply design variations
  const eyeStyle = Math.floor(randomBetween(0, 3));
  const mouthStyle = Math.floor(randomBetween(0, 3));
  const bodyStyle = Math.floor(randomBetween(0, 3));
  
  // Create character's body shape based on bodyStyle
  const getBodyPath = () => {
    switch (bodyStyle) {
      case 0: // Rounded blob
        return (
          <motion.path
            d="M25,50 C37.5,70 62.5,70 75,50 C87.5,30 87.5,20 75,10 C62.5,0 37.5,0 25,10 C12.5,20 12.5,30 25,50 Z"
            fill={color}
            animate={isPlaying ? {
              d: [
                "M25,50 C37.5,70 62.5,70 75,50 C87.5,30 87.5,20 75,10 C62.5,0 37.5,0 25,10 C12.5,20 12.5,30 25,50 Z",
                "M20,45 C32.5,75 67.5,75 80,45 C92.5,25 87.5,15 75,5 C62.5,-5 37.5,-5 25,5 C12.5,15 7.5,25 20,45 Z",
                "M25,50 C37.5,70 62.5,70 75,50 C87.5,30 87.5,20 75,10 C62.5,0 37.5,0 25,10 C12.5,20 12.5,30 25,50 Z",
              ]
            } : {}}
            transition={{
              duration: duration * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      case 1: // Star-like shape
        return (
          <motion.path
            d="M50,10 L60,40 L90,50 L60,60 L50,90 L40,60 L10,50 L40,40 Z"
            fill={color}
            animate={isPlaying ? {
              d: [
                "M50,10 L60,40 L90,50 L60,60 L50,90 L40,60 L10,50 L40,40 Z",
                "M50,5 L65,35 L95,45 L65,55 L50,95 L35,55 L5,45 L35,35 Z",
                "M50,10 L60,40 L90,50 L60,60 L50,90 L40,60 L10,50 L40,40 Z",
              ]
            } : {}}
            transition={{
              duration: duration * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      case 2: // Triangular character
        return (
          <motion.path
            d="M50,10 L90,80 L10,80 Z"
            fill={color}
            animate={isPlaying ? {
              d: [
                "M50,10 L90,80 L10,80 Z",
                "M50,5 L95,85 L5,85 Z",
                "M50,10 L90,80 L10,80 Z",
              ]
            } : {}}
            transition={{
              duration: duration * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      default: // Circular character
        return (
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill={color}
            animate={isPlaying ? {
              r: [40, 42, 38, 40]
            } : {}}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
    }
  };

  // Eyes based on eyeStyle
  const getEyes = () => {
    const baseEyeX1 = 35;
    const baseEyeX2 = 65;
    const baseEyeY = 40;
    
    switch (eyeStyle) {
      case 0: // Round eyes
        return (
          <>
            <motion.circle cx={baseEyeX1} cy={baseEyeY} r="5" fill="#FFF" />
            <motion.circle cx={baseEyeX2} cy={baseEyeY} r="5" fill="#FFF" />
            <motion.circle 
              cx={baseEyeX1} 
              cy={baseEyeY} 
              r="2" 
              fill="#000" 
              animate={isPlaying ? {
                cx: [baseEyeX1 - 1, baseEyeX1 + 1, baseEyeX1 - 1],
                cy: [baseEyeY - 1, baseEyeY, baseEyeY - 1]
              } : {}}
              transition={{
                duration: duration / 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.circle 
              cx={baseEyeX2} 
              cy={baseEyeY} 
              r="2" 
              fill="#000" 
              animate={isPlaying ? {
                cx: [baseEyeX2 - 1, baseEyeX2 + 1, baseEyeX2 - 1],
                cy: [baseEyeY - 1, baseEyeY, baseEyeY - 1]
              } : {}}
              transition={{
                duration: duration / 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </>
        );
      case 1: // Rectangular eyes
        return (
          <>
            <motion.rect x={baseEyeX1-5} y={baseEyeY-3} width="10" height="6" fill="#FFF" rx="1" />
            <motion.rect x={baseEyeX2-5} y={baseEyeY-3} width="10" height="6" fill="#FFF" rx="1" />
            <motion.circle 
              cx={baseEyeX1} 
              cy={baseEyeY} 
              r="1.5" 
              fill="#000" 
              animate={isPlaying ? { 
                cx: [baseEyeX1 - 2, baseEyeX1 + 2, baseEyeX1 - 2] 
              } : {}}
              transition={{
                duration: duration / 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.circle 
              cx={baseEyeX2} 
              cy={baseEyeY} 
              r="1.5" 
              fill="#000" 
              animate={isPlaying ? { 
                cx: [baseEyeX2 - 2, baseEyeX2 + 2, baseEyeX2 - 2] 
              } : {}}
              transition={{
                duration: duration / 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </>
        );
      case 2: // Expressive eyes
        return (
          <>
            <motion.ellipse cx={baseEyeX1} cy={baseEyeY} rx="6" ry="8" fill="#FFF" />
            <motion.ellipse cx={baseEyeX2} cy={baseEyeY} rx="6" ry="8" fill="#FFF" />
            <motion.ellipse 
              cx={baseEyeX1} 
              cy={baseEyeY} 
              rx="3" 
              ry="4" 
              fill="#000" 
              animate={isPlaying ? {
                cy: [baseEyeY - 2, baseEyeY + 2, baseEyeY - 2],
                rx: [3, 2.5, 3],
                ry: [4, 3, 4]
              } : {}}
              transition={{
                duration: duration / 1.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.ellipse 
              cx={baseEyeX2} 
              cy={baseEyeY} 
              rx="3" 
              ry="4" 
              fill="#000" 
              animate={isPlaying ? {
                cy: [baseEyeY - 2, baseEyeY + 2, baseEyeY - 2],
                rx: [3, 2.5, 3],
                ry: [4, 3, 4]
              } : {}}
              transition={{
                duration: duration / 1.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </>
        );
      default:
        return null;
    }
  };

  // Mouth based on mouthStyle
  const getMouth = () => {
    switch (mouthStyle) {
      case 0: // Smile
        return (
          <motion.path
            d="M35,60 Q50,70 65,60"
            stroke="#000"
            strokeWidth="2"
            fill="none"
            animate={isPlaying ? {
              d: ["M35,60 Q50,70 65,60", "M35,63 Q50,75 65,63", "M35,60 Q50,70 65,60"]
            } : {}}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        );
      case 1: // Oval mouth
        return (
          <motion.ellipse
            cx="50"
            cy="65"
            rx="10"
            ry="5"
            fill="#000"
            animate={isPlaying ? {
              ry: [5, 6, 4, 5],
              rx: [10, 8, 12, 10]
            } : {}}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        );
      case 2: // Expressive mouth
        return (
          <motion.path
            d="M35,65 Q50,55 65,65 Q50,75 35,65 Z"
            fill="#000"
            animate={isPlaying ? {
              d: [
                "M35,65 Q50,55 65,65 Q50,75 35,65 Z",
                "M35,63 Q50,53 65,63 Q50,73 35,63 Z",
                "M35,65 Q50,55 65,65 Q50,75 35,65 Z"
              ]
            } : {}}
            transition={{
              duration: duration * 1.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        );
      default: // Simple line
        return (
          <motion.line
            x1="35"
            y1="65"
            x2="65"
            y2="65"
            stroke="#000"
            strokeWidth="2"
            animate={isPlaying ? {
              x1: [35, 37, 35],
              x2: [65, 63, 65]
            } : {}}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        );
    }
  };

  return (
    <motion.div
      className="absolute"
      style={{ 
        x, 
        y,
        zIndex: 10 + depth * 5,
        filter: `drop-shadow(0 10px 15px rgba(0, 0, 0, 0.2))`
      }}
      initial={{ opacity: 0, scale: 0, rotate: rotation - 20 }}
      animate={{ 
        opacity: 1, 
        scale: scale,
        rotate: rotation,
        x: isPlaying ? [x, x + randomBetween(-20, 20), x] : x,
        y: isPlaying ? [y, y + randomBetween(-20, 20), y] : y,
      }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.8, delay },
        rotate: { duration: 0.8, delay },
        x: { duration, repeat: Infinity, ease: "easeInOut" },
        y: { duration, repeat: Infinity, ease: "easeInOut" }
      }}
    >
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* Character body */}
        {getBodyPath()}
        
        {/* Eyes */}
        {getEyes()}
        
        {/* Mouth */}
        {getMouth()}
      </svg>
    </motion.div>
  );
}