import React from 'react';
import { useLoading } from '../../hooks/useLoading';
import { Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LoadingOverlay() {
  const { isLoading, message } = useLoading();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          role="alert"
          aria-busy="true"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="card-glass p-8 rounded-xl shadow-xl flex items-center space-x-4 max-w-md"
          >
            <div className="bg-primary/20 rounded-full p-3 glow-primary">
              <Loader className="w-6 h-6 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">{message || 'Loading...'}</h3>
              <p className="text-sm text-muted-foreground">Please wait while we process your request</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}