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
    combine(initialState, (_set, _get) => ({
      addMessage: (_messageOrUpdater: Message | ((prev: Message[]) => Message[])) => {
        performanceMonitor.startMeasure('addMessage');
        _set(_state => {
          if (typeof _messageOrUpdater === 'function') {
            return { messages: _messageOrUpdater(_state.messages) };
          }
          return { messages: [..._state.messages, _messageOrUpdater] };
        });
        performanceMonitor.endMeasure('addMessage');
      },

      saveChat: async (_title: string, _customMessages?: Message[]) => {
        performanceMonitor.startMeasure('saveChat');
        const messages = _customMessages || _get().messages;
        const autoTagger = AutoTagger.getInstance();

        const newChat: SavedChat = {
          id: crypto.randomUUID(),
          _title,
          messages,
          timestamp: Date.now(),
          tags: autoTagger.generateTags(messages)
        };

        _set(_state => ({ 
          savedChats: [..._state.savedChats, newChat],
          currentChatId: newChat.id
        }));
        
        performanceMonitor.endMeasure('saveChat');
        return newChat.id;
      },

      loadChat: (_chatId: string) => {
        performanceMonitor.startMeasure('loadChat');
        const chat = _get().savedChats.find(_c => _c.id === _chatId);
        if (chat) {
          _set({ 
            messages: chat.messages,
            currentChatId: _chatId
          });
        }
        performanceMonitor.endMeasure('loadChat');
      },

      deleteChat: (_chatId: string) => {
        _set(_state => {
          const newState = { 
            savedChats: _state.savedChats.filter(_chat => _chat.id !== _chatId) 
          };
          
          if (_state.currentChatId === _chatId) {
            newState.messages = [];
            newState.currentChatId = null;
          }
          
          return newState;
        });
      },

      clearMessages: () => {
        _set({ 
          messages: [],
          currentChatId: null
        });
      }
    })),
    {
      name: 'agent-one-chat-store',
      partialize: (_state) => ({
        savedChats: _state.savedChats
      })
    }
  )
);