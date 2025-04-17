import { useState, useCallback, useEffect } from 'react';
import { Message } from '../types';
import { AutoTagger } from '../lib/auto-tagger';
import { useLocalStorage } from './useLocalStorage';
import { useToast } from './useToast';
import { ContentManager } from '../lib/utils/ContentManager';
import { performanceMonitor } from '../lib/utils/PerformanceMonitor';

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
  const [contentManagers, setContentManagers] = useState<Map<string, ContentManager>>(new Map());
  const { addToast } = useToast();
  const autoTagger = AutoTagger.getInstance();

  // Create a content manager for a message
  const getContentManager = useCallback((messageId: string) => {
    if (!contentManagers.has(messageId)) {
      const updateContent = (content: string) => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, content } : msg
          )
        );
      };
      
      const contentManager = new ContentManager(updateContent);
      setContentManagers(prev => {
        const updated = new Map(prev);
        updated.set(messageId, contentManager);
        return updated;
      });
      
      return contentManager;
    }
    
    return contentManagers.get(messageId)!;
  }, [contentManagers]);

  const addMessage = useCallback((messageOrUpdater: Message | ((prev: Message[]) => Message[])) => {
    performanceMonitor.startMeasure('addMessage');
    setMessages(prev => {
      if (typeof messageOrUpdater === 'function') {
        return messageOrUpdater(prev);
      }
      
      // If it's a new assistant message, initialize its content manager
      if (messageOrUpdater.role === 'assistant') {
        getContentManager(messageOrUpdater.id);
      }
      
      return [...prev, messageOrUpdater];
    });
    performanceMonitor.endMeasure('addMessage');
    
    return Promise.resolve();
  }, [getContentManager]);

  const saveChat = useCallback(async (title: string) => {
    performanceMonitor.startMeasure('saveChat');
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

    performanceMonitor.endMeasure('saveChat');
    return newChat.id;
  }, [messages, setSavedChats, addToast, autoTagger]);

  const loadChat = useCallback(async (chatId: string) => {
    performanceMonitor.startMeasure('loadChat');
    const chat = savedChats.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setCurrentChatId(chatId);
      
      // Clear existing content managers
      setContentManagers(new Map());
      
      addToast({
        type: 'success',
        message: 'Chat loaded successfully',
        duration: 3000
      });
    }
    performanceMonitor.endMeasure('loadChat');
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
    setContentManagers(new Map());
  }, []);
  
  // Update message content through content manager
  const updateMessageContent = useCallback((messageId: string, content: string) => {
    const manager = getContentManager(messageId);
    manager.appendContent(content);
  }, [getContentManager]);
  
  // Set message pause status
  const setMessagePaused = useCallback((messageId: string, paused: boolean) => {
    const manager = contentManagers.get(messageId);
    if (manager) {
      paused ? manager.pause() : manager.resume();
    }
  }, [contentManagers]);

  // Clean up old content managers when messages change
  useEffect(() => {
    const activeMessageIds = new Set(messages.map(msg => msg.id));
    
    // Remove content managers for deleted messages
    setContentManagers(prev => {
      if (prev.size === 0) return prev;
      
      const updated = new Map(prev);
      let changed = false;
      
      for (const [id] of updated) {
        if (!activeMessageIds.has(id)) {
          updated.delete(id);
          changed = true;
        }
      }
      
      return changed ? updated : prev;
    });
  }, [messages]);

  return {
    messages,
    savedChats,
    currentChatId,
    addMessage,
    clearMessages,
    saveChat,
    loadChat,
    deleteChat,
    updateMessageContent,
    setMessagePaused
  };
}