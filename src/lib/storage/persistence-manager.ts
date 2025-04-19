import { Message } from '../types';
import { supabase } from '../supabase/supabase-client';
import { thoughtLogger } from '../logging/thought-logger';
import { useAuth } from '../auth/AuthProvider';

interface SavedChat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

interface SavedWorkflow {
  id: string;
  title: string;
  trigger?: {
    type: 'schedule' | 'event';
    config: Record<string, unknown>;
  };
  steps: Array<{
    type: string;
    config: Record<string, unknown>;
  }>;
  createdAt: number;
  updatedAt: number;
  lastRun?: number;
}

export class PersistenceManager {
  private static instance: PersistenceManager;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): PersistenceManager {
    if (!PersistenceManager.instance) {
      PersistenceManager.instance = new PersistenceManager();
    }
    return PersistenceManager.instance;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Check if Supabase is initialized properly
      const { data, error } = await supabase.from('settings').select('count');
      if (error) throw error;
      
      this.initialized = true;
      thoughtLogger.log('success', 'PersistenceManager initialized successfully');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize PersistenceManager', { error });
      throw error;
    }
  }

  // Chat Management
  async saveChat(_title: string, _messages: Message[], _tags?: string[]): Promise<string> {
    try {
      const { user } = useAuth();
      if (!user) throw new Error('User not authenticated');
      
      const id = crypto.randomUUID();
      const timestamp = Date.now();
      
      // Insert chat metadata
      const { error: chatError } = await supabase.from('chats').insert({
        id,
        user_id: user.id,
        _title,
        _tags,
        created_at: new Date(timestamp).toISOString(),
        updated_at: new Date(timestamp).toISOString()
      });
      
      if (chatError) throw chatError;
      
      // Insert all messages
      const { error: messagesError } = await supabase.from('chat_messages').insert(
        _messages.map(_msg => ({
          id: _msg.id,
          chat_id: id,
          role: _msg.role,
          content: _msg.content,
          model: _msg.model,
          created_at: new Date(_msg.timestamp).toISOString()
        }))
      );
      
      if (messagesError) throw messagesError;
      
      thoughtLogger.log('success', 'Chat saved successfully', { chatId: id });
      return id;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to save chat', { error });
      throw error;
    }
  }

  async listChats(): Promise<SavedChat[]> {
    try {
      const { user } = useAuth();
      if (!user) throw new Error('User not authenticated');
      
      const { data: chats, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (chatError) throw chatError;
      
      const savedChats: SavedChat[] = [];
      
      for (const chat of chats) {
        const { data: messages, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: true });
          
        if (messagesError) throw messagesError;
        
        savedChats.push({
          id: chat.id,
          title: chat.title,
          messages: messages.map(_msg => ({
            id: _msg.id,
            role: _msg.role,
            content: _msg.content,
            timestamp: new Date(_msg.created_at).getTime(),
            model: _msg.model
          })),
          createdAt: new Date(chat.created_at).getTime(),
          updatedAt: new Date(chat.updated_at).getTime(),
          tags: chat.tags
        });
      }
      
      return savedChats;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to list chats', { error });
      return [];
    }
  }

  async deleteChat(_id: string): Promise<void> {
    try {
      const { user } = useAuth();
      if (!user) throw new Error('User not authenticated');
      
      // Messages will cascade delete due to foreign key constraint
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', _id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      thoughtLogger.log('success', 'Chat deleted', { chatId: _id });
    } catch (error) {
      thoughtLogger.log('error', 'Failed to delete chat', { error });
      throw error;
    }
  }

  // Settings Management
  async saveSettings(_category: string, _values: Record<string, unknown>): Promise<void> {
    try {
      const { user } = useAuth();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error: selectError } = await supabase
        .from('settings')
        .select('id')
        .eq('user_id', user.id)
        .eq('category', _category)
        .maybeSingle();
      
      if (selectError) throw selectError;
      
      if (data) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('settings')
          .update({
            settings: _values,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);
          
        if (updateError) throw updateError;
      } else {
        // Insert new settings
        const { error: insertError } = await supabase
          .from('settings')
          .insert({
            user_id: user.id,
            _category,
            settings: _values
          });
          
        if (insertError) throw insertError;
      }
      
      thoughtLogger.log('success', 'Settings saved', { _category });
    } catch (error) {
      thoughtLogger.log('error', 'Failed to save settings', { error });
      throw error;
    }
  }

  async getSettings(_category: string): Promise<Record<string, unknown> | null> {
    try {
      const { user } = useAuth();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('settings')
        .select('settings')
        .eq('user_id', user.id)
        .eq('category', _category)
        .maybeSingle();
        
      if (error) throw error;
      return data?.settings || null;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to get settings', { error });
      return null;
    }
  }

  async getAllSettings(): Promise<Record<string, Record<string, unknown>>> {
    try {
      const { user } = useAuth();
      if (!user) return {};
      
      const { data, error } = await supabase
        .from('settings')
        .select('category, settings')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      return data.reduce((_acc, _setting) => {
        _acc[_setting.category] = _setting.settings;
        return _acc;
      }, {} as Record<string, Record<string, unknown>>);
    } catch (error) {
      thoughtLogger.log('error', 'Failed to get all settings', { error });
      return {};
    }
  }
}