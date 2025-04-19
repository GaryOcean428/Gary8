import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../shared/hooks/useToast';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { Transition } from '../../shared/components/Transition';

export function Toast() {
  const { toasts, removeToast } = useToast();

  const getIcon = (_type: 'success' | 'error' | 'info') => {
    switch (_type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const getToastClasses = (_type: 'success' | 'error' | 'info') => {
    switch (_type) {
      case 'success':
        return 'bg-success/10 border-success/20';
      case 'error':
        return 'bg-destructive/10 border-destructive/20';
      default:
        return 'bg-primary/10 border-primary/20';
    }
  };

  return (
    <div 
      aria-live="polite" 
      aria-atomic="true" 
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      <AnimatePresence>
        {toasts.map(_toast => (
          <Transition
            key={_toast.id}
            variant="fadeLeft"
            duration={0.3}
            className={`card-glass p-4 min-w-[300px] max-w-md ${getToastClasses(_toast.type)}`}
          >
            <div className="flex items-start gap-3">
              {getIcon(_toast.type)}
              <div className="flex-1">
                {_toast.title && (
                  <h3 className="font-medium mb-1">{_toast.title}</h3>
                )}
                <p className="text-sm opacity-90">{_toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(_toast.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close notification"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </Transition>
        ))}
      </AnimatePresence>
    </div>
  );
}