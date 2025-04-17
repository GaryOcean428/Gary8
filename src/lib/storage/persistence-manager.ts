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
    config: Record<string, any>;
  };
  steps: Array<{
    type: string;
    config: Record<string, any>;
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
  async saveChat(title: string, messages: Message[], tags?: string[]): Promise<string> {
    try {
      const { user } = useAuth();
      if (!user) throw new Error('User not authenticated');
      
      const id = crypto.randomUUID();
      const timestamp = Date.now();
      
      // Insert chat metadata
      const { error: chatError } = await supabase.from('chats').insert({
        id,
        user_id: user.id,
        title,
        tags,
        created_at: new Date(timestamp).toISOString(),
        updated_at: new Date(timestamp).toISOString()
      });
      
      if (chatError) throw chatError;
      
      // Insert all messages
      const { error: messagesError } = await supabase.from('chat_messages').insert(
        messages.map(msg => ({
          id: msg.id,
          chat_id: id,
          role: msg.role,
          content: msg.content,
          model: msg.model,
          created_at: new Date(msg.timestamp).toISOString()
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
          messages: messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at).getTime(),
            model: msg.model
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

  async deleteChat(id: string): Promise<void> {
    try {
      const { user } = useAuth();
      if (!user) throw new Error('User not authenticated');
      
      // Messages will cascade delete due to foreign key constraint
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      thoughtLogger.log('success', 'Chat deleted', { chatId: id });
    } catch (error) {
      thoughtLogger.log('error', 'Failed to delete chat', { error });
      throw error;
    }
  }

  // Settings Management
  async saveSettings(category: string, values: Record<string, any>): Promise<void> {
    try {
      const { user } = useAuth();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error: selectError } = await supabase
        .from('settings')
        .select('id')
        .eq('user_id', user.id)
        .eq('category', category)
        .maybeSingle();
      
      if (selectError) throw selectError;
      
      if (data) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('settings')
          .update({
            settings: values,
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
            category,
            settings: values
          });
          
        if (insertError) throw insertError;
      }
      
      thoughtLogger.log('success', 'Settings saved', { category });
    } catch (error) {
      thoughtLogger.log('error', 'Failed to save settings', { error });
      throw error;
    }
  }

  async getSettings(category: string): Promise<Record<string, any> | null> {
    try {
      const { user } = useAuth();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('settings')
        .select('settings')
        .eq('user_id', user.id)
        .eq('category', category)
        .maybeSingle();
        
      if (error) throw error;
      return data?.settings || null;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to get settings', { error });
      return null;
    }
  }

  async getAllSettings(): Promise<Record<string, Record<string, any>>> {
    try {
      const { user } = useAuth();
      if (!user) return {};
      
      const { data, error } = await supabase
        .from('settings')
        .select('category, settings')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      return data.reduce((acc, setting) => {
        acc[setting.category] = setting.settings;
        return acc;
      }, {} as Record<string, Record<string, any>>);
    } catch (error) {
      thoughtLogger.log('error', 'Failed to get all settings', { error });
      return {};
    }
  }
}