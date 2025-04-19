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
  const getContentManager = useCallback((_messageId: string) => {
    if (!contentManagers.has(_messageId)) {
      const updateContent = (_content: string) => {
        setMessages(_prev => 
          _prev.map(_msg => 
            _msg.id === _messageId ? { ..._msg, _content } : _msg
          )
        );
      };
      
      const contentManager = new ContentManager(updateContent);
      setContentManagers(_prev => {
        const updated = new Map(_prev);
        updated.set(_messageId, contentManager);
        return updated;
      });
      
      return contentManager;
    }
    
    return contentManagers.get(_messageId)!;
  }, [contentManagers]);

  const addMessage = useCallback((_messageOrUpdater: Message | ((prev: Message[]) => Message[])) => {
    performanceMonitor.startMeasure('addMessage');
    setMessages(_prev => {
      if (typeof _messageOrUpdater === 'function') {
        return _messageOrUpdater(_prev);
      }
      
      // If it's a new assistant message, initialize its content manager
      if (_messageOrUpdater.role === 'assistant') {
        getContentManager(_messageOrUpdater.id);
      }
      
      return [..._prev, _messageOrUpdater];
    });
    performanceMonitor.endMeasure('addMessage');
    
    return Promise.resolve();
  }, [getContentManager]);

  const saveChat = useCallback(async (_title: string) => {
    performanceMonitor.startMeasure('saveChat');
    const newChat = {
      id: crypto.randomUUID(),
      _title,
      messages,
      timestamp: Date.now(),
      tags: autoTagger.generateTags(messages)
    };

    setSavedChats(_prev => [..._prev, newChat]);
    setCurrentChatId(newChat.id);
    
    addToast({
      type: 'success',
      message: 'Chat saved successfully',
      duration: 3000
    });

    performanceMonitor.endMeasure('saveChat');
    return newChat.id;
  }, [messages, setSavedChats, addToast, autoTagger]);

  const loadChat = useCallback(async (_chatId: string) => {
    performanceMonitor.startMeasure('loadChat');
    const chat = savedChats.find(_c => _c.id === _chatId);
    if (chat) {
      setMessages(chat.messages);
      setCurrentChatId(_chatId);
      
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

  const deleteChat = useCallback(async (_chatId: string) => {
    setSavedChats(_prev => _prev.filter(_chat => _chat.id !== _chatId));
    if (currentChatId === _chatId) {
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
  const updateMessageContent = useCallback((_messageId: string, _content: string) => {
    const manager = getContentManager(_messageId);
    manager.appendContent(_content);
  }, [getContentManager]);
  
  // Set message pause status
  const setMessagePaused = useCallback((_messageId: string, _paused: boolean) => {
    const manager = contentManagers.get(_messageId);
    if (manager) {
      _paused ? manager.pause() : manager.resume();
    }
  }, [contentManagers]);

  // Clean up old content managers when messages change
  useEffect(() => {
    const activeMessageIds = new Set(messages.map(_msg => _msg.id));
    
    // Remove content managers for deleted messages
    setContentManagers(_prev => {
      if (_prev.size === 0) return _prev;
      
      const updated = new Map(_prev);
      let changed = false;
      
      for (const [id] of updated) {
        if (!activeMessageIds.has(id)) {
          updated.delete(id);
          changed = true;
        }
      }
      
      return changed ? updated : _prev;
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