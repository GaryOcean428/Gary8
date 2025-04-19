import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToast = create<ToastState>((_set) => ({
  toasts: [],
  addToast: (_toast) => {
    const id = crypto.randomUUID();
    _set((_state) => ({
      toasts: [..._state.toasts, { ..._toast, id }],
    }));

    // Auto remove toast after duration
    if (_toast.duration !== 0) {
      setTimeout(() => {
        _set((_state) => ({
          toasts: _state.toasts.filter((_t) => _t.id !== id),
        }));
      }, _toast.duration || 5000);
    }
  },
  removeToast: (_id) =>
    _set((_state) => ({
      toasts: _state.toasts.filter((_t) => _t.id !== _id),
    })),
}));