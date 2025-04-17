import React from 'react';
import { motion } from 'framer-motion';

interface EnvironmentProps {
  readonly type: string; // Corrected: Removed duplicate, made original readonly
  readonly theme: string;
}

export function Environment({ type, theme }: Readonly<EnvironmentProps>) { // Mark props as read-only
  const getDynamicGradient = () => {
    switch (type) {
      case 'space':
        return theme === 'dark' 
          ? 'from-indigo-950 via-violet-900 to-purple-950' 
          : 'from-indigo-600 via-violet-500 to-purple-600';
      case 'nature':
        return theme === 'dark'
          ? 'from-emerald-950 via-green-900 to-teal-900'
          : 'from-emerald-600 via-green-500 to-teal-500';
      case 'underwater':
        return theme === 'dark'
          ? 'from-blue-950 via-cyan-900 to-blue-900'
          : 'from-blue-600 via-cyan-500 to-blue-500';
      case 'abstract':
        return theme === 'dark'
          ? 'from-rose-950 via-purple-900 to-blue-950'
          : 'from-rose-600 via-purple-500 to-blue-600';
      default:
        return theme === 'dark'
          ? 'from-gray-950 via-gray-900 to-gray-950'
          : 'from-gray-200 via-white to-gray-200';
    }
  };

  const getBackgroundPatterns = () => {
    switch (type) {
      case 'space':
        return (
          <>
            {/* Stars */}
            {Array.from({ length: 100 }).map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute rounded-full bg-white"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${Math.random() * 2 + 1}px`,
                  height: `${Math.random() * 2 + 1}px`,
                  opacity: Math.random() * 0.7 + 0.3
                }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 5
                }}
              />
            ))}
            
            {/* Distant galaxies */}
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={`galaxy-${i}`}
                className="absolute rounded-full bg-opacity-20"
                style={{
                  background: `radial-gradient(circle, ${['rgba(138,43,226,0.2)', 'rgba(65,105,225,0.2)', 'rgba(255,105,180,0.2)'][i]} 0%, rgba(0,0,0,0) 70%)`,
                  left: `${Math.random() * 80 + 10}%`,
                  top: `${Math.random() * 80 + 10}%`,
                  width: `${Math.random() * 200 + 100}px`,
                  height: `${Math.random() * 200 + 100}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: Math.random() * 300 + 200,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            ))}
          </>
        );
      case 'nature':
        return (
          <>
            {/* Hills */}
            <motion.div 
              className="absolute bottom-0 left-0 right-0 rounded-t-full w-full"
              style={{ 
                height: '30%', 
                background: theme === 'dark' ? '#1F2937' : '#D1FAE5',
                opacity: 0.5,
              }}
            />
            <motion.div 
              className="absolute bottom-0 left-10 rounded-t-full"
              style={{ 
                height: '25%', 
                width: '60%',
                background: theme === 'dark' ? '#111827' : '#A7F3D0',
                opacity: 0.7,
              }}
            />
            
            {/* Clouds */}
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={`cloud-${i}`}
                className="absolute rounded-full"
                style={{
                  background: theme === 'dark' ? '#1F2937' : 'white',
                  boxShadow: 'inset 0 0 20px rgba(255,255,255,0.3)',
                  left: `${i * 30 + 10}%`,
                  top: `${i * 15 + 10}%`,
                  width: `${Math.random() * 80 + 100}px`,
                  height: `${Math.random() * 30 + 40}px`,
                  opacity: 0.8,
                  zIndex: 1
                }}
                animate={{
                  x: [`${Math.random() * -50}px`, `${Math.random() * 50}px`],
                }}
                transition={{
                  x: {
                    duration: Math.random() * 40 + 30,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: "easeInOut",
                  }
                }}
              />
            ))}
          </>
        );
      case 'underwater':
        return (
          <>
            {/* Water surface light rays */}
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={`ray-${i}`}
                className={`absolute ${theme === 'dark' ? 'bg-blue-400/10' : 'bg-blue-300/30'}`}
                style={{
                  top: 0,
                  left: `${i * 20 + Math.random() * 10}%`,
                  width: `${Math.random() * 20 + 10}px`,
                  height: '100%',
                  transformOrigin: 'top',
                  transform: 'skewX(20deg)',
                }}
                animate={{
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5
                }}
              />
            ))}
            
            {/* Seaweed */}
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={`seaweed-${i}`}
                className={`absolute rounded-t-full ${theme === 'dark' ? 'bg-green-900' : 'bg-green-600'}`}
                style={{
                  bottom: 0,
                  left: `${i * 20 + Math.random() * 5}%`,
                  width: `${Math.random() * 10 + 5}px`,
                  height: `${Math.random() * 100 + 100}px`,
                  opacity: 0.6,
                }}
                animate={{
                  skewX: [0, 10, 0, -10, 0],
                }}
                transition={{
                  duration: Math.random() * 5 + 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </>
        );
      case 'abstract':
        return (
          <>
            {/* Abstract shapes */}
            {Array.from({ length: 10 }).map((_, i) => {
              const shape = ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)];
              let colors: string[];
              if (theme === 'dark') {
                colors = ['#EC4899', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];
              } else {
                colors = ['#FB7185', '#A78BFA', '#60A5FA', '#34D399', '#FBBF24'];
              }
              const color = colors[Math.floor(Math.random() * colors.length)];
              
              let clipPath = '';
              if (shape === 'triangle') {
                clipPath = 'polygon(50% 0%, 100% 100%, 0% 100%)';
              }
              
              return (
                <motion.div
                  key={`shape-${i}`}
                  className="absolute"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${Math.random() * 60 + 20}px`,
                    height: shape === 'circle' || shape === 'square' ? `${Math.random() * 60 + 20}px` : `${Math.random() * 80 + 40}px`,
                    background: `${color}40`,
                    borderRadius: shape === 'circle' ? '50%' : shape === 'square' ? '8px' : '0',
                    clipPath: clipPath,
                    opacity: Math.random() * 0.3 + 0.1,
                    zIndex: 1
                  }}
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    rotate: {
                      duration: Math.random() * 40 + 20,
                      repeat: Infinity,
                      ease: "linear",
                    },
                    scale: {
                      duration: Math.random() * 10 + 5,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: "easeInOut",
                    }
                  }}
                />
              );
            })}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getDynamicGradient()} z-0`} />
      
      {/* Animated grain texture overlay */}
      <motion.div 
        className="absolute inset-0 opacity-20 bg-noise z-1" 
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: "linear",
        }}
      />
      
      {/* Scene-specific background elements */}
      {getBackgroundPatterns()}
    </>
  );
}
