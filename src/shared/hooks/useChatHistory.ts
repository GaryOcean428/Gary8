import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../core/supabase/supabase-client';
import { useAuth } from '../../core/auth/AuthProvider';
import { useToast } from './useToast';
import type { Message } from '../../types';

export interface SavedChat {
  id: string;
  title: string;
  messages: Message[];
  tags?: string[];
  timestamp: number;
}

export function useChatHistory() {
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { addToast } = useToast();

  // Fetch saved chats
  const fetchChats = useCallback(async () => {
    if (!user) {
      setSavedChats([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (chatError) throw chatError;
      
      const chats: SavedChat[] = [];
      
      for (const chat of chatData) {
        try {
          const { data: messageData, error: messageError } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: true });
            
          if (messageError) throw messageError;
          
          chats.push({
            id: chat.id,
            title: chat.title,
            messages: messageData.map(msg => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.created_at).getTime(),
              model: msg.model
            })),
            tags: chat.tags || [],
            timestamp: new Date(chat.created_at).getTime()
          });
        } catch (error) {
          console.error(`Failed to load messages for chat ${chat.id}:`, error);
        }
      }
      
      setSavedChats(chats);
    } catch (error) {
      console.error('Failed to load chats:', error);
      addToast({
        type: 'error',
        title: 'Error Loading Chats',
        message: 'Failed to load your chat history',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, addToast]);

  // Load chats on mount and when user changes
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Save a chat
  const saveChat = useCallback(async (
    title: string,
    messages: Message[],
    tags?: string[]
  ): Promise<string> => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Insert chat
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({
          title,
          user_id: user.id,
          tags,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (chatError) throw chatError;
      
      // Insert messages
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .insert(
          messages.map(msg => ({
            id: msg.id,
            chat_id: chatData.id,
            role: msg.role,
            content: msg.content,
            model: msg.model,
            created_at: new Date(msg.timestamp).toISOString()
          }))
        );
      
      if (messagesError) throw messagesError;
      
      // Add to state
      const newChat: SavedChat = {
        id: chatData.id,
        title,
        messages,
        tags,
        timestamp: Date.now()
      };
      
      setSavedChats(prev => [newChat, ...prev]);
      
      addToast({
        type: 'success',
        message: 'Chat saved successfully',
        duration: 3000
      });
      
      return chatData.id;
    } catch (error) {
      console.error('Failed to save chat:', error);
      addToast({
        type: 'error',
        title: 'Error Saving Chat',
        message: 'Failed to save your chat',
        duration: 5000
      });
      throw error;
    }
  }, [user, addToast]);

  // Delete a chat
  const deleteChat = useCallback(async (id: string): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Confirm user owns this chat
      const { data, error: fetchError } = await supabase
        .from('chats')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete chat (this will cascade delete messages)
      const { error: deleteError } = await supabase
        .from('chats')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      // Update state
      setSavedChats(prev => prev.filter(chat => chat.id !== id));
      
      addToast({
        type: 'success',
        message: 'Chat deleted successfully',
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to delete chat:', error);
      addToast({
        type: 'error',
        title: 'Error Deleting Chat',
        message: 'Failed to delete the chat',
        duration: 5000
      });
      throw error;
    }
  }, [user, addToast]);

  return {
    savedChats,
    isLoading,
    saveChat,
    deleteChat,
    refreshChats: fetchChats
  };
}