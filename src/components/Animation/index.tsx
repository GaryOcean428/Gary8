import React, { useState } from 'react';
import { AnimationScene } from './AnimationScene';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import { Settings, RefreshCw, Palette, Save, Share2 } from 'lucide-react';

interface AnimationControlsProps {
  theme: string;
  onThemeChange: (theme: 'dark' | 'light') => void;
  sceneType: string;
  onSceneTypeChange: (type: string) => void;
  onReset: () => void;
}

function AnimationControls({ 
  theme, 
  onThemeChange, 
  sceneType, 
  onSceneTypeChange, 
  onReset 
}: AnimationControlsProps) {
  const [showControls, setShowControls] = useState(false);
  
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30">
      <div className="flex justify-center mb-2">
        <Button 
          variant="glass" 
          size="sm"
          onClick={() => setShowControls(!showControls)}
        >
          <Settings size={16} className="mr-1" />
          {showControls ? 'Hide Controls' : 'Show Controls'}
        </Button>
      </div>
      
      {showControls && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/50 backdrop-blur-md p-3 flex flex-wrap gap-2 justify-center"
        >
          {/* Theme toggle */}
          <Button
            variant="glass"
            size="sm"
            onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
          >
            <Palette size={16} className="mr-1" />
            {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
          </Button>
          
          {/* Scene type selector */}
          <div className="flex gap-1">
            {['nature', 'space', 'underwater', 'abstract'].map(type => (
              <Button
                key={type}
                variant={sceneType === type ? 'neon-blue' : 'glass'}
                size="sm"
                onClick={() => onSceneTypeChange(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
          
          {/* Reset button */}
          <Button
            variant="glass"
            size="sm"
            onClick={onReset}
          >
            <RefreshCw size={16} className="mr-1" />
            Reset
          </Button>
        </motion.div>
      )}
    </div>
  );
}

export function Animation() {
  const [sceneType, setSceneType] = useState<'nature' | 'space' | 'abstract' | 'underwater'>('abstract');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [key, setKey] = useState(0);
  
  // Get container size based on viewport
  const getContainerSize = () => {
    const width = Math.min(window.innerWidth - 40, 1200);
    // Maintain 16:9 aspect ratio with a minimum height
    const height = Math.max(width * 0.5625, 400); 
    return { width, height };
  };
  
  const { width, height } = getContainerSize();

  // Reset animation with new key to force remount
  const handleReset = () => {
    setKey(prevKey => prevKey + 1);
  };
  
  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Visually Stunning Animation
      </h2>
      
      <div className="relative rounded-xl overflow-hidden shadow-2xl">
        <AnimationScene
          key={key}
          width={width}
          height={height}
          theme={theme}
          sceneType={sceneType}
          characterCount={5}
          className="bg-black"
        />
        
        <AnimationControls
          theme={theme}
          onThemeChange={setTheme}
          sceneType={sceneType}
          onSceneTypeChange={(type) => setSceneType(type as any)}
          onReset={handleReset}
        />
      </div>
      
      <div className="mt-6 flex gap-4 justify-center">
        <Button variant="default" leftIcon={<Save size={18} />}>
          Save Animation
        </Button>
        <Button variant="secondary" leftIcon={<Share2 size={18} />}>
          Share Animation
        </Button>
      </div>
      
      <div className="mt-8 max-w-2xl">
        <h3 className="text-xl font-semibold mb-3">Animation Features:</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Interactive 3D Perspective:</strong> Move your cursor over the animation to see the responsive 3D effect.
          </li>
          <li>
            <strong>Dynamic Character Design:</strong> Each character has fluid movements and expressive features.
          </li>
          <li>
            <strong>Rich Color Palettes:</strong> Theme-specific color schemes that enhance visual impact.
          </li>
          <li>
            <strong>Advanced Lighting:</strong> Includes ambient occlusion and volumetric lighting effects.
          </li>
          <li>
            <strong>Particle Systems:</strong> Dynamic particles that respond to the scene type.
          </li>
          <li>
            <strong>Multiple Visual Layers:</strong> Background, midground, and foreground elements add depth.
          </li>
          <li>
            <strong>Performance Optimized:</strong> Animations pause when tab is inactive to save resources.
          </li>
        </ul>
      </div>
    </div>
  );
}