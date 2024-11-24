'use client';

import { Chat } from './Chat';
import { CanvasPanel } from './panels/CanvasPanel';
import { DocumentPanel } from './panels/DocumentPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { ToolsPanel } from './panels/ToolsPanel';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivePanel } from '../types';

interface MainContentProps {
  activePanel: ActivePanel;
}

export function MainContent({ activePanel }: MainContentProps) {
  const variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activePanel}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2 }}
        className="h-full p-6"
      >
        {(() => {
          switch (activePanel) {
            case 'chat':
              return <Chat />;
            case 'canvas':
              return <CanvasPanel />;
            case 'documents':
              return <DocumentPanel />;
            case 'tools':
              return <ToolsPanel />;
            case 'settings':
              return <SettingsPanel />;
            default:
              return <Chat />;
          }
        })()}
      </motion.div>
    </AnimatePresence>
  );
}
