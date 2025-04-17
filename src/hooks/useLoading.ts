import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  message: string | null;
  setLoading: (isLoading: boolean, message?: string) => void;
}

export const useLoading = create<LoadingState>((set) => ({
  isLoading: false,
  message: null,
  setLoading: (isLoading: boolean, message?: string) => set({ isLoading, message: message || null }),
}));