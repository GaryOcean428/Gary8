import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../hooks/useToast';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export function Toast() {
  const { toasts, removeToast } = useToast();

  const getIcon = (type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div 
      aria-live="polite" 
      aria-atomic="true" 
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`
              min-w-[300px] max-w-md p-4 rounded-lg shadow-lg backdrop-blur-sm
              ${toast.type === 'success' ? 'bg-green-500/10 border border-green-500/20' :
                toast.type === 'error' ? 'bg-red-500/10 border border-red-500/20' :
                'bg-blue-500/10 border border-blue-500/20'}
            `}
          >
            <div className="flex items-start gap-3">
              {getIcon(toast.type)}
              <div className="flex-1">
                {toast.title && (
                  <h3 className="font-medium mb-1">{toast.title}</h3>
                )}
                <p className="text-sm opacity-90">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-300"
                aria-label="Close notification"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}