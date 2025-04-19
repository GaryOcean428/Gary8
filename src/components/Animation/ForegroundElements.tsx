import { motion } from 'framer-motion'; // Removed unused React import
import { Moon, Sun, Stars, Cloud, Wind, Zap } from 'lucide-react';
// Import from index file to resolve module resolution error
import { AnimatedIcon } from './index';
import { randomBetween } from '../../lib/utils/mathUtils';

interface ForegroundElementsProps {
  readonly type: string; // Added readonly
  readonly theme: string;
  readonly width: number; // Added readonly
  readonly height: number;
  readonly isPlaying: boolean;
}

export function ForegroundElements({
  type,
  theme,
  width,
  height,
  isPlaying
}: ForegroundElementsProps) {
  // Different foreground elements based on scene type
  switch (type) {
    case 'space': { // Use block scope for case
      const iconColor = theme === 'dark' ? '#E2E8F0' : '#FFA500';
      const IconComponent = theme === 'dark' ? Moon : Sun;
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
            Icon={IconComponent}
            x={width * 0.85}
            y={height * 0.15}
            size={48}
            color={iconColor}
            isPlaying={isPlaying}
            delay={0.2}
          />
        </>
      );
    }
    case 'nature': { // Use block scope for case
      const cloudColor = theme === 'dark' ? '#718096' : '#E2E8F0';
      const windColor = theme === 'dark' ? '#A0AEC0' : '#CBD5E0';
      return (
        <>
          <AnimatedIcon
            Icon={Cloud}
            x={width * 0.1}
            y={height * 0.2}
            size={36}
            color={cloudColor}
            isPlaying={isPlaying}
          />
          <AnimatedIcon
            Icon={Cloud}
            x={width * 0.7}
            y={height * 0.1}
            size={48}
            color={cloudColor}
            isPlaying={isPlaying}
            delay={0.3}
          />
          <AnimatedIcon
            Icon={Wind}
            x={width * 0.6}
            y={height * 0.5}
            size={24}
            color={windColor}
            isPlaying={isPlaying}
            delay={0.7}
          />
        </>
      );
    }
    case 'underwater':
      return (
        <>
          {/* Generated bubbles with more unique keys */}
          {Array.from({ length: 8 }).map((_, _i) => {
            // Create more unique key by adding randomized properties to the bubble's identity
            const size = randomBetween(5, 15);
            const positionX = randomBetween(10, 90);
            const positionY = randomBetween(10, 20);
            const uniqueKey = `bubble-${type}-${_i}-${size}-${positionX.toFixed(0)}`;
            
            return (
            <motion.div
              key={uniqueKey}
              className="absolute rounded-full bg-white/30 backdrop-blur-sm"
              style={{
                left: `${positionX}%`,
                bottom: `-${positionY}px`,
                width: `${size}px`,
                height: `${size}px`,
              }}
              animate={
                isPlaying
                  ? (() => {
                      const isEven = _i % 2 === 0;
                      const xAnim = isEven
                        ? [0, 20, 0, -20, 0]
                        : [0, -20, 0, 20, 0];
                      return {
                        y: [0, -height],
                        x: xAnim,
                      };
                    })()
                  : {}
              }
              transition={{
                y: { duration: randomBetween(10, 20), repeat: Infinity, ease: 'linear', delay: _i * 0.5 },
                x: { duration: randomBetween(3, 6), repeat: Infinity, ease: 'easeInOut', delay: _i * 0.5 },
              }}
            />
          )})}
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
          {([
            { shape: 'circle', x: 0.2, y: 0.7, size: 60, color: '#0EA5E9' },
            { shape: 'triangle', x: 0.8, y: 0.2, size: 50, color: '#8B5CF6' },
            { shape: 'rectangle', x: 0.5, y: 0.5, size: 40, color: '#EC4899' },
          ] as const).map((_item, _index) => { // Use 'as const' for better type inference, removed explicit types
            const heightValue = _item.shape === 'rectangle' ? _item.size * 0.6 : _item.size;
            const shapeHeight = `${heightValue}px`; // Renamed variable to avoid conflict

            // Refactored borderRadius logic (SonarQube fix & TS Error fix)
            let borderRadius: string;
            if (_item.shape === 'circle') {
              borderRadius = '50%';
            } else if (_item.shape === 'rectangle') {
              borderRadius = '4px';
            } else {
              borderRadius = '0%';
            }

            const clipPath =
              _item.shape === 'triangle'
                ? 'polygon(50% 0%, 100% 100%, 0% 100%)'
                : 'none'; // Corrected potential syntax issue

            return (
              <motion.div
                key={`shape-${_item.shape}-${_index}`} // Use index for unique key with shape
                className="animated-shape" // Ensure this class exists and is styled
                style={{
                  left: `${_item.x * width}px`, // Simplified number conversion
                  top: `${_item.y * height}px`, // Simplified number conversion
                  width: `${_item.size}px`,
                  height: shapeHeight, // Use renamed variable
                  backgroundColor: `${_item.color}40`, // Assuming alpha transparency
                  borderRadius,
                  clipPath, // Corrected potential syntax issue
                }}
                animate={
                  isPlaying
                    ? {
                        y: [0, -20, 0],
                        rotate: [0, _item.shape === 'rectangle' ? 360 : 180, 0],
                        scale: [1, 1.1, 1],
                      }
                    : {} // Ensure empty object when not playing
                }
                transition={{
                  duration: randomBetween(4, 8),
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: _index * 0.2,
                }} // Corrected potential syntax issue
              /> // Corrected potential syntax issue
            ); // Corrected potential syntax issue
          })}
        </> // Corrected potential syntax issue
      );
    default:
      return null;
  }
}
