import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { randomBetween } from '../../lib/utils/mathUtils';

interface ParticleSystemProps {
  count: number;
  type: 'stars' | 'dust' | 'bubbles';
  width: number;
  height: number;
  readonly isPlaying: boolean;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
  duration: number;
}

export function ParticleSystem({ count, type, width, height, isPlaying }: Readonly<ParticleSystemProps>) { // Mark props as read-only
  // Generate particles with random positions and properties
  const particles: Particle[] = useMemo(() => { // Add Particle type
    return Array.from({ length: count }).map((_, i) => {
      const size = getParticleSize(type);
      const delay = randomBetween(0, 5);
      const duration = randomBetween(5, 20);
      const x = randomBetween(0, width);
      const y = randomBetween(0, height);
      
      return {
        id: `particle-${i}`,
        x,
        y,
        size,
        opacity: randomBetween(0.3, 0.8),
        delay,
        duration,
      };
    });
  }, [count, type, width, height]);

  // Define particle styling based on type
  const getParticleStyle = (type: string) => {
    switch (type) {
      case 'stars':
        return 'rounded-full bg-white';
      case 'dust':
        return 'rounded-full bg-amber-200/30 backdrop-blur-sm';
      case 'bubbles':
        return 'rounded-full bg-white/30 backdrop-blur-sm';
      default:
        return 'rounded-full bg-white/50';
    }
  };

  // Define particle animations based on type
  const getParticleAnimation = (type: string, particle: Particle) => { // Use Particle type
    switch (type) {
      case 'stars':
        return isPlaying ? {
          opacity: [particle.opacity, particle.opacity * 2, particle.opacity],
          scale: [1, 1.2, 1],
        } : {};
      case 'dust':
        return isPlaying ? {
          x: [particle.x, particle.x + randomBetween(-30, 30)],
          y: [particle.y, particle.y + randomBetween(-30, 30)],
          opacity: [particle.opacity, particle.opacity * 0.7, particle.opacity],
        } : {};
      case 'bubbles':
        return isPlaying ? {
          y: [particle.y, particle.y - randomBetween(50, 200)],
          x: [particle.x, particle.x + randomBetween(-20, 20)],
          opacity: [particle.opacity, 0],
        } : {};
      default:
        return {};
    }
  };

  // Define particle transition timing based on type
  const getParticleTransition = (type: string, particle: Particle) => { // Use Particle type
    switch (type) {
      case 'stars':
        return {
          duration: particle.duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: particle.delay,
        };
      case 'dust':
        return {
          duration: particle.duration,
          repeat: Infinity,
          repeatType: "reverse" as const,
          ease: "easeInOut",
          delay: particle.delay,
        };
      case 'bubbles':
        return {
          duration: particle.duration,
          repeat: Infinity,
          ease: "linear",
          delay: particle.delay,
        };
      default:
        return {};
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden z-20">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute ${getParticleStyle(type)}`}
          style={{
            x: particle.x,
            y: particle.y,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
          }}
          animate={getParticleAnimation(type, particle)}
          transition={getParticleTransition(type, particle)}
        />
      ))}
    </div>
  );
}

function getParticleSize(type: string) {
  switch (type) {
    case 'stars':
      return randomBetween(1, 3);
    case 'dust':
      return randomBetween(2, 6);
    case 'bubbles':
      return randomBetween(3, 12);
    default:
      return randomBetween(1, 4);
  }
}
