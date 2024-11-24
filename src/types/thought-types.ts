export type ThoughtType = 'error' | 'success' | 'info' | 'warning' | 'debug';

export interface Thought {
  id: string;
  type: ThoughtType;
  message: string;
  timestamp: string;
  data?: any;
}

export const getThoughtTypes = (): ThoughtType[] => [
  'error',
  'success',
  'info',
  'warning',
  'debug'
];
