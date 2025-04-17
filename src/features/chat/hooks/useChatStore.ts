import { create } from 'zustand';
import { combine, persist } from 'zustand/middleware';
import { Message } from '../../../types';
import { AutoTagger } from '../../../lib/auto-tagger';
import { performanceMonitor } from '../../../shared/utils/PerformanceMonitor';

export interface SavedChat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
  tags?: string[];
}

interface ChatState {
  messages: Message[];
  savedChats: SavedChat[];
  currentChatId: string | null;
}

const initialState: ChatState = {
  messages: [],
  savedChats: [],
  currentChatId: null
};

export const useChatStore = create(
  persist(
    combine(initialState, (set, get) => ({
      addMessage: (messageOrUpdater: Message | ((prev: Message[]) => Message[])) => {
        performanceMonitor.startMeasure('addMessage');
        set(state => {
          if (typeof messageOrUpdater === 'function') {
            return { messages: messageOrUpdater(state.messages) };
          }
          return { messages: [...state.messages, messageOrUpdater] };
        });
        performanceMonitor.endMeasure('addMessage');
      },

      saveChat: async (title: string, customMessages?: Message[]) => {
        performanceMonitor.startMeasure('saveChat');
        const messages = customMessages || get().messages;
        const autoTagger = AutoTagger.getInstance();

        const newChat: SavedChat = {
          id: crypto.randomUUID(),
          title,
          messages,
          timestamp: Date.now(),
          tags: autoTagger.generateTags(messages)
        };

        set(state => ({ 
          savedChats: [...state.savedChats, newChat],
          currentChatId: newChat.id
        }));
        
        performanceMonitor.endMeasure('saveChat');
        return newChat.id;
      },

      loadChat: (chatId: string) => {
        performanceMonitor.startMeasure('loadChat');
        const chat = get().savedChats.find(c => c.id === chatId);
        if (chat) {
          set({ 
            messages: chat.messages,
            currentChatId: chatId
          });
        }
        performanceMonitor.endMeasure('loadChat');
      },

      deleteChat: (chatId: string) => {
        set(state => {
          const newState = { 
            savedChats: state.savedChats.filter(chat => chat.id !== chatId) 
          };
          
          if (state.currentChatId === chatId) {
            newState.messages = [];
            newState.currentChatId = null;
          }
          
          return newState;
        });
      },

      clearMessages: () => {
        set({ 
          messages: [],
          currentChatId: null
        });
      }
    })),
    {
      name: 'agent-one-chat-store',
      partialize: (state) => ({
        savedChats: state.savedChats
      })
    }
  )
);