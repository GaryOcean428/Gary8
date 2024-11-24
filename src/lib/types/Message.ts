export interface Message {
  id: string;
  content: string;
  timestamp: string;
  type: 'user' | 'response' | 'error';
}