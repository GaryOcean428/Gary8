import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  message: string | null;
  setLoading: (isLoading: boolean, message?: string) => void;
}

export const useLoading = create<LoadingState>((_set) => ({
  isLoading: false,
  message: null,
  setLoading: (_isLoading: boolean, _message?: string) => _set({ _isLoading, message: _message || null }),
}));