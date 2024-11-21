import React from 'react';
import { Chat } from './Chat';
import { CanvasPanel } from './panels/CanvasPanel';
import { AgentPanel } from './panels/AgentPanel';
import { ToolsPanel } from './panels/ToolsPanel';
import { DocumentPanel } from './panels/DocumentPanel';
import { SearchPanel } from './panels/SearchPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivePanel } from '../App';

interface MainContentProps {
  activePanel: ActivePanel;
}

export function MainContent({ activePanel }: MainContentProps) {
  const renderContent = () => {
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
          className="h-full"
        >
          {(() => {
            switch (activePanel) {
              case 'chat':
                return <Chat />;
              case 'canvas':
                return <CanvasPanel />;
              case 'agent':
                return <AgentPanel />;
              case 'tools':
                return <ToolsPanel />;
              case 'documents':
                return <DocumentPanel />;
              case 'search':
                return <SearchPanel />;
              case 'settings':
                return <SettingsPanel />;
              default:
                return <Chat />;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {renderContent()}
    </div>
  );
}