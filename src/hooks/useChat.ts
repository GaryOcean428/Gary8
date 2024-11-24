import { useState, useCallback } from 'react';
import { Message } from '../types';
import { AutoTagger } from '../lib/auto-tagger';
import { useLocalStorage } from './useLocalStorage';
import { useToast } from './useToast';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [savedChats, setSavedChats] = useLocalStorage<Array<{
    id: string;
    title: string;
    messages: Message[];
    timestamp: number;
    tags?: string[];
  }>>('chat-history', []);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { addToast } = useToast();
  const autoTagger = AutoTagger.getInstance();

  const addMessage = useCallback((messageOrUpdater: Message | ((prev: Message[]) => Message[])) => {
    setMessages(prev => {
      if (typeof messageOrUpdater === 'function') {
        return messageOrUpdater(prev);
      }
      return [...prev, messageOrUpdater];
    });
  }, []);

  const saveChat = useCallback(async (title: string) => {
    const newChat = {
      id: crypto.randomUUID(),
      title,
      messages,
      timestamp: Date.now(),
      tags: autoTagger.generateTags(messages)
    };

    setSavedChats(prev => [...prev, newChat]);
    setCurrentChatId(newChat.id);
    
    addToast({
      type: 'success',
      message: 'Chat saved successfully',
      duration: 3000
    });

    return newChat.id;
  }, [messages, setSavedChats, addToast]);

  const loadChat = useCallback(async (chatId: string) => {
    const chat = savedChats.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setCurrentChatId(chatId);
      
      addToast({
        type: 'success',
        message: 'Chat loaded successfully',
        duration: 3000
      });
    }
  }, [savedChats, addToast]);

  const deleteChat = useCallback(async (chatId: string) => {
    setSavedChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setMessages([]);
      setCurrentChatId(null);
    }
    
    addToast({
      type: 'success',
      message: 'Chat deleted successfully',
      duration: 3000
    });
  }, [currentChatId, setSavedChats, addToast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentChatId(null);
  }, []);

  return {
    messages,
    savedChats,
    currentChatId,
    addMessage,
    clearMessages,
    saveChat,
    loadChat,
    deleteChat
  };
}