import React from 'react';
import * as Toast from '@radix-ui/react-toast';
import { useToast } from '../hooks/useToast';
import { cn } from '../lib/utils';
import { X } from 'lucide-react';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useToast();

  return (
    <Toast.Provider>
      {children}
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          className={cn(
            'fixed bottom-4 right-4 z-50 flex items-start gap-4',
            'bg-background border border-border rounded-lg shadow-lg p-4 w-96',
            'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
            'data-[swipe=end]:animate-fade-out'
          )}
        >
          <div className="flex-1">
            {toast.title && (
              <Toast.Title className="font-semibold mb-1">
                {toast.title}
              </Toast.Title>
            )}
            <Toast.Description className="text-foreground/80">
              {toast.message}
            </Toast.Description>
          </div>
          <Toast.Close
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            onClick={() => removeToast(toast.id)}
          >
            <X className="w-4 h-4" />
          </Toast.Close>
        </Toast.Root>
      ))}
      <Toast.Viewport />
    </Toast.Provider>
  );
}