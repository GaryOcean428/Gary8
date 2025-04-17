import React from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';

interface LightingEffectsProps {
  theme: string;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  isPlaying: boolean;
}

export function LightingEffects({
  theme,
  mouseX,
  mouseY,
  isPlaying
}: LightingEffectsProps) {
  // Transform mouse position into spotlight position
  const spotlightX = useTransform(mouseX, [0, 1], ['0%', '100%']);
  const spotlightY = useTransform(mouseY, [0, 1], ['0%', '100%']);
  
  // Ambient shadow color based on theme
  const shadowColor = theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)';
  
  // Color theme for the lighting
  const accentColor = theme === 'dark' 
    ? 'rgba(139, 92, 246, 0.15)' // Purple for dark theme
    : 'rgba(59, 130, 246, 0.1)'; // Blue for light theme
    
  const highlightColor = theme === 'dark'
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(255, 255, 255, 0.2)';
    
  return (
    <>
      {/* Ambient lighting - subtle gradient overlay */}
      <div 
        className="absolute inset-0 z-10 opacity-30 animate-pulse"
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, rgba(0, 0, 0, 0) 70%)'
            : 'radial-gradient(circle at center, rgba(59, 130, 246, 0.05) 0%, rgba(0, 0, 0, 0) 70%)',
          animation: isPlaying ? 'pulse 10s ease-in-out infinite' : 'none',
        }}
      />
      
      {/* Dynamic spotlight that follows mouse position */}
      <motion.div
        className="absolute inset-0 z-10 opacity-40"
        style={{
          background: `radial-gradient(circle at ${spotlightX} ${spotlightY}, ${highlightColor} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      
      {/* Accent lighting from bottom */}
      <motion.div
        className="absolute inset-0 z-2 opacity-30"
        style={{
          background: `linear-gradient(to top, ${accentColor} 0%, transparent 50%)`,
        }}
        animate={isPlaying ? {
          opacity: [0.3, 0.4, 0.3],
        } : {}}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Moving shadow effect */}
      {theme === 'dark' && (
        <motion.div
          className="absolute inset-0 z-15"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%)',
            opacity: 0.3,
          }}
          animate={isPlaying ? {
            x: [-20, 20, -20],
            y: [-20, 20, -20],
          } : {}}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Volumetric light beams */}
      <div className="absolute inset-0 z-5 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={`light-beam-${i}`}
            className="absolute"
            style={{
              left: `${i * 30 + 10}%`,
              top: 0,
              bottom: 0,
              width: '20px',
              background: `linear-gradient(to bottom, transparent, ${highlightColor}, transparent)`,
              opacity: 0.15,
              transform: `skewX(${45 * (i % 2 === 0 ? 1 : -1)}deg)`,
              filter: 'blur(8px)',
            }}
            animate={isPlaying ? {
              x: [-50, 50, -50],
              opacity: [0.1, 0.2, 0.1],
            } : {}}
            transition={{
              duration: 15 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 2,
            }}
          />
        ))}
      </div>
    </>
  );
}