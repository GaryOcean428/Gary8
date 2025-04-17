import React, { useRef, useEffect, useState } from 'react';
import { motion, useAnimation, AnimatePresence, MotionValue, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Sun, Moon, Cloud, Stars, Wind, Zap } from 'lucide-react';
import { Character } from './Character';
import { Environment } from './Environment';
import { ParticleSystem } from './ParticleSystem';
import { LightingEffects } from './LightingEffects';
import { usePerspective } from '../../hooks/usePerspective';
import { randomBetween } from '../../lib/utils/mathUtils';

interface AnimationSceneProps {
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
  sceneType?: 'nature' | 'space' | 'abstract' | 'underwater';
  characterCount?: number;
  className?: string;
}

export function AnimationScene({
  width = 800,
  height = 600,
  theme = 'dark',
  sceneType = 'nature',
  characterCount = 3,
  className = '',
}: AnimationSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainControls = useAnimation();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Control z-depth based on mouse position for parallax effect
  const { rotateX, rotateY } = usePerspective(mouseX, mouseY, { strength: 10 });
  
  // Track pointer movement for interactive effects
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    mouseX.set(x);
    mouseY.set(y);
  };

  // Array of characters with varying properties
  const characters = Array.from({ length: characterCount }).map((_, index) => ({
    id: `character-${index}`,
    x: randomBetween(width * 0.1, width * 0.9),
    y: randomBetween(height * 0.1, height * 0.9),
    scale: randomBetween(0.7, 1.3),
    rotation: randomBetween(-15, 15),
    color: getRandomColor(theme),
    delay: index * 0.2,
    duration: randomBetween(2, 4),
    depth: randomBetween(0, 2)
  }));

  // Track document visibility to pause/resume animations when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPlaying(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Setup animation sequence on component mount
  useEffect(() => {
    setIsMounted(true);
    
    const sequence = async () => {
      // Initial appearance animation
      await mainControls.start({
        opacity: 1,
        scale: 1,
        transition: { duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }
      });
      
      // Continuous subtle movement
      mainControls.start({
        y: [0, -20, 0],
        transition: {
          duration: 8,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut'
        }
      });
    };
    
    sequence();

    return () => {
      mainControls.stop();
    };
  }, [mainControls]);

  return (
    <div 
      className={`perspective-container overflow-hidden relative rounded-xl ${className}`}
      style={{ width, height }}
      onMouseMove={handleMouseMove}
    >
      {/* Main scene container with perspective effect */}
      <motion.div
        ref={containerRef}
        className="w-full h-full relative"
        style={{ 
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={mainControls}
      >
        {/* Environment background with depth layers */}
        <Environment type={sceneType} theme={theme} />
        
        {/* Lighting effects */}
        <LightingEffects 
          theme={theme} 
          mouseX={mouseX} 
          mouseY={mouseY}
          isPlaying={isPlaying}
        />
        
        {/* Characters */}
        <AnimatePresence>
          {isMounted && characters.map((character) => (
            <Character
              key={character.id}
              x={character.x}
              y={character.y}
              scale={character.scale}
              rotation={character.rotation}
              color={character.color}
              delay={character.delay}
              duration={character.duration}
              depth={character.depth}
              isPlaying={isPlaying}
            />
          ))}
        </AnimatePresence>
        
        {/* Particle systems */}
        <ParticleSystem
          count={50}
          type={sceneType === 'space' ? 'stars' : sceneType === 'underwater' ? 'bubbles' : 'dust'}
          width={width}
          height={height}
          isPlaying={isPlaying}
        />
        
        {/* Foreground decorative elements */}
        <ForegroundElements 
          type={sceneType}
          theme={theme} 
          width={width}
          height={height}
          isPlaying={isPlaying}
        />
      </motion.div>
    </div>
  );
}

function ForegroundElements({ 
  type, 
  theme, 
  width, 
  height,
  isPlaying 
}: { 
  type: string;
  theme: string;
  width: number;
  height: number;
  isPlaying: boolean;
}) {
  // Different foreground elements based on scene type
  switch (type) {
    case 'space':
      return (
        <>
          <AnimatedIcon
            Icon={Stars}
            x={width * 0.2}
            y={height * 0.3}
            size={24}
            color="#FFD700"
            isPlaying={isPlaying}
          />
          <AnimatedIcon
            Icon={Stars}
            x={width * 0.8}
            y={height * 0.7}
            size={32}
            color="#FFD700"
            isPlaying={isPlaying}
            delay={0.5}
          />
          <AnimatedIcon
            Icon={theme === 'dark' ? Moon : Sun}
            x={width * 0.85}
            y={height * 0.15}
            size={48}
            color={theme === 'dark' ? '#E2E8F0' : '#FFA500'}
            isPlaying={isPlaying}
            delay={0.2}
          />
        </>
      );
    case 'nature':
      return (
        <>
          <AnimatedIcon
            Icon={Cloud}
            x={width * 0.1}
            y={height * 0.2}
            size={36}
            color={theme === 'dark' ? '#718096' : '#E2E8F0'}
            isPlaying={isPlaying}
          />
          <AnimatedIcon
            Icon={Cloud}
            x={width * 0.7}
            y={height * 0.1}
            size={48}
            color={theme === 'dark' ? '#718096' : '#E2E8F0'}
            isPlaying={isPlaying}
            delay={0.3}
          />
          <AnimatedIcon
            Icon={Wind}
            x={width * 0.6}
            y={height * 0.5}
            size={24}
            color={theme === 'dark' ? '#A0AEC0' : '#CBD5E0'}
            isPlaying={isPlaying}
            delay={0.7}
          />
        </>
      );
    case 'underwater':
      return (
        <>
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`bubble-${i}`}
              className="absolute rounded-full bg-white/30 backdrop-blur-sm"
              style={{
                left: `${randomBetween(10, 90)}%`,
                bottom: `-${randomBetween(10, 20)}px`,
                width: `${randomBetween(5, 15)}px`,
                height: `${randomBetween(5, 15)}px`,
              }}
              animate={isPlaying ? {
                y: [0, -height],
                x: (i % 2 === 0) ? [0, 20, 0, -20, 0] : [0, -20, 0, 20, 0],
              } : {}}
              transition={{
                y: {
                  duration: randomBetween(10, 20),
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.5,
                },
                x: {
                  duration: randomBetween(3, 6),
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5,
                }
              }}
            />
          ))}
        </>
      );
    case 'abstract':
      return (
        <>
          <AnimatedIcon
            Icon={Zap}
            x={width * 0.3}
            y={height * 0.3}
            size={32}
            color="#8B5CF6"
            isPlaying={isPlaying}
          />
          <AnimatedIcon
            Icon={Zap}
            x={width * 0.7}
            y={height * 0.6}
            size={24}
            color="#EC4899"
            isPlaying={isPlaying}
            delay={0.4}
          />
          {/* Abstract floating shapes */}
          {[
            { shape: 'circle', x: 0.2, y: 0.7, size: 60, color: '#0EA5E9' },
            { shape: 'triangle', x: 0.8, y: 0.2, size: 50, color: '#8B5CF6' },
            { shape: 'rectangle', x: 0.5, y: 0.5, size: 40, color: '#EC4899' },
          ].map((item, index) => (
            <motion.div
              key={`shape-${index}`}
              className="absolute rounded-full backdrop-blur-md"
              style={{
                left: `${item.x * width}px`,
                top: `${item.y * height}px`,
                width: `${item.size}px`,
                height: item.shape === 'rectangle' ? `${item.size * 0.6}px` : `${item.size}px`,
                backgroundColor: `${item.color}40`,
                borderRadius: item.shape === 'circle' ? '50%' : item.shape === 'rectangle' ? '4px' : '0%',
                clipPath: item.shape === 'triangle' ? 'polygon(50% 0%, 100% 100%, 0% 100%)' : 'none',
                zIndex: 5,
              }}
              animate={isPlaying ? {
                y: [0, -20, 0],
                rotate: [0, item.shape === 'rectangle' ? 360 : 180, 0],
                scale: [1, 1.1, 1],
              } : {}}
              transition={{
                duration: randomBetween(4, 8),
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.2,
              }}
            />
          ))}
        </>
      );
    default:
      return null;
  }
}

function AnimatedIcon({ 
  Icon, 
  x, 
  y, 
  size, 
  color, 
  isPlaying,
  delay = 0 
}: { 
  Icon: React.ComponentType<any>;
  x: number;
  y: number;
  size: number;
  color: string;
  isPlaying: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      className="absolute z-10 filter drop-shadow-lg"
      style={{ left: x, top: y, color }}
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
      <Icon size={size} />
    </motion.div>
  );
}

function getRandomColor(theme: string): string {
  const lightPalette = [
    '#3B82F6', // blue
    '#EC4899', // pink
    '#10B981', // emerald
    '#F59E0B', // amber
    '#8B5CF6', // purple
    '#06B6D4', // cyan
  ];
  
  const darkPalette = [
    '#60A5FA', // blue
    '#F472B6', // pink
    '#34D399', // emerald
    '#FBBF24', // amber
    '#A78BFA', // purple
    '#22D3EE', // cyan
  ];
  
  const palette = theme === 'light' ? lightPalette : darkPalette;
  return palette[Math.floor(Math.random() * palette.length)];
}