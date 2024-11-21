import React from 'react';
import { useLoading } from '../../hooks/useLoading';
import { Loader } from 'lucide-react';

export function LoadingOverlay() {
  const { isLoading, message } = useLoading();

  if (!isLoading) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      role="alert"
      aria-busy="true"
    >
      <div className="bg-gray-800 rounded-lg p-6 flex items-center space-x-4">
        <Loader className="w-6 h-6 text-blue-400 animate-spin" />
        <p className="text-lg">{message || 'Loading...'}</p>
      </div>
    </div>
  );
}