import React, { useState, useEffect } from 'react';
import { AnimationScene } from './Animation/AnimationScene';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import { Badge } from './ui/Badge';
import { motion } from 'framer-motion';
import { Palette, RefreshCw, Zap, Play } from 'lucide-react'; // Removed ArrowRight
import { useNavigate } from 'react-router-dom';

export function AnimationDemo() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sceneType, setSceneType] = useState<'nature' | 'space' | 'abstract' | 'underwater'>('abstract');
  const [key, setKey] = useState(0);
  const navigate = useNavigate();
  
  type SceneType = 'nature' | 'space' | 'abstract' | 'underwater';
  type ThemeType = 'dark' | 'light';

  // Auto-change scene types for demo effect
  useEffect(() => {
    const interval = setInterval(() => {
      setSceneType((_prev: SceneType) => { // Add type for prev
        const types: Array<SceneType> = ['nature', 'space', 'abstract', 'underwater'];
        const currentIndex = types.indexOf(_prev);
        const nextIndex = (currentIndex + 1) % types.length;
        return types[nextIndex];
      });
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Get size based on viewport
  const getSize = () => {
    const width = Math.min(window.innerWidth - 40, 600);
    const height = width * 0.75;
    return { width, height };
  };
  
  const { width, height } = getSize();
  
  return (
    <Card variant="elevated" className="mb-8 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Interactive Animation Demo</span>
          <Badge variant="secondary" animation="pulse">
            <Zap className="w-3.5 h-3.5 mr-1" />
            Interactive
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <div className="relative rounded-md overflow-hidden mx-4">
        <AnimationScene
          key={key}
          width={width}
          height={height}
          theme={theme}
          sceneType={sceneType}
          className="border border-border rounded-md"
        />
        
        <motion.div
          className="absolute bottom-4 right-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="neon-blue"
            size="sm"
            leftIcon={<Play size={16} />}
            onClick={() => navigate('/animation')}
          >
            Full Animation
          </Button>
        </motion.div>
      </div>
      
      <CardContent className="pt-4">
        <div className="flex flex-wrap gap-2 justify-center">
          <Button 
            variant="outline"
            size="sm"
            leftIcon={<Palette size={16} />}
            onClick={() => setTheme((_prev: ThemeType) => _prev === 'dark' ? 'light' : 'dark')} // Add type for prev
          >
            {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
          </Button>
          
          <div className="flex gap-1">
            {['nature', 'space', 'underwater', 'abstract'].map(_type => (
              <Button
                key={_type}
                variant={sceneType === _type ? 'secondary' : 'outline'}
                size="sm"
            onClick={() => setSceneType(_type as SceneType)}
              >
                {_type.charAt(0).toUpperCase() + _type.slice(1)}
              </Button>
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw size={16} />}
            onClick={() => setKey((_prevKey: number) => _prevKey + 1)} // Add type for prevKey
          >
            Reset
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="text-center text-sm text-muted-foreground">
        <p>Move your mouse over the animation to see the interactive 3D effect. Try different scene types!</p>
      </CardFooter>
    </Card>
  );
}
