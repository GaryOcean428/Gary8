import React, { useRef, useEffect, useState } from 'react';
import { motion, useAnimation, AnimatePresence, useMotionValue } from 'framer-motion';
// Removed unused lucide-react imports: Moon, Sun, Stars, Cloud, Wind, Zap
import './AnimationScene.css'; // Import the CSS file
import { Character } from './Character';
import { Environment } from './Environment';
import { ParticleSystem } from './ParticleSystem';
import { LightingEffects } from './LightingEffects';
import { ForegroundElements } from './ForegroundElements'; // Added import
// Removed unused AnimatedIcon import
import { usePerspective } from '../../hooks/usePerspective';
import { randomBetween } from '../../lib/utils/mathUtils';
import { getRandomColor } from '../../lib/utils/colorUtils'; // Added import

interface AnimationSceneProps {
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
  sceneType?: 'nature' | 'space' | 'abstract' | 'underwater';
  readonly characterCount?: number;
  readonly className?: string;
}

export function AnimationScene({
  width = 800,
  height = 600,
  theme = 'dark',
  sceneType = 'nature',
  characterCount = 3,
  className = '',
}: Readonly<AnimationSceneProps>) { // Mark props as read-only
  const containerRef = useRef<HTMLDivElement>(null);
  const mainControls = useAnimation();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Control z-depth based on mouse position for parallax effect
  const { rotateX, rotateY } = usePerspective(mouseX, mouseY, { strength: 10 });
  
  // Track pointer movement for interactive effects
  const handleMouseMove = (_e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = _e.currentTarget.getBoundingClientRect();
    const x = (_e.clientX - left) / width;
    const y = (_e.clientY - top) / height;
    mouseX.set(x);
    mouseY.set(y);
  };

  // Array of characters with varying properties
  const characters = Array.from({ length: characterCount }).map((_, _index) => ({
    id: `character-${_index}`,
    x: randomBetween(width * 0.1, width * 0.9),
    y: randomBetween(height * 0.1, height * 0.9),
    scale: randomBetween(0.7, 1.3),
    rotation: randomBetween(-15, 15),
    color: getRandomColor(theme),
    delay: _index * 0.2,
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

  // Calculate particle type based on sceneType (SonarQube fix)
  let particleType: 'stars' | 'bubbles' | 'dust' = 'dust';
  if (sceneType === 'space') {
    particleType = 'stars';
  } else if (sceneType === 'underwater') {
    particleType = 'bubbles';
  }

  return (
    <>
      {/* 
        Dynamic width/height required, cannot move to CSS (Edge Tools warning acknowledged).
        This is an animation scene container that tracks mouse movement for visual effects,
        not a traditional interactive control requiring keyboard navigation.
        
        Using CSS variables to handle dimensions - these are handled in AnimationScene.css
      */}
      <section
        data-width={width}
        data-height={height}
        className={`animation-scene-container perspective-container overflow-hidden relative rounded-xl ${className}`}
        onMouseMove={handleMouseMove}
        aria-label={`${sceneType} themed animation scene with parallax effects that respond to mouse movement`}
        tabIndex={-1}
      >
        {/* Main scene container with perspective effect */}
        <motion.div
          ref={containerRef}
          className="perspective-transform-container" // Use CSS class
          style={{
            rotateX,
            rotateY,
            // transformStyle is now in CSS
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
            {isMounted && characters.map((_character) => (
              <Character
                key={_character.id}
                x={_character.x}
                y={_character.y}
                scale={_character.scale}
                rotation={_character.rotation}
                color={_character.color}
                delay={_character.delay}
                duration={_character.duration}
                depth={_character.depth}
                isPlaying={isPlaying}
              />
            ))}
          </AnimatePresence>
          
          {/* Particle systems - Logic extracted to variable below (SonarQube fix) */}
          <ParticleSystem
            count={50}
            type={particleType} // Use pre-calculated type
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
      </section>
    </>
  );
}
