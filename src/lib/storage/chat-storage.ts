import { dbInitializer } from './db-init';
import { DBConfig } from './db-config';
import { Message } from '../types';

export interface Chat {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
  metadata?: Record<string, unknown>;
}

export class ChatStorage {
  private static instance: ChatStorage;

  private constructor() {}

  static getInstance(): ChatStorage {
    if (!ChatStorage.instance) {
      ChatStorage.instance = new ChatStorage();
    }
    return ChatStorage.instance;
  }

  async saveChat(_chat: Chat): Promise<void> {
    const db = await dbInitializer.getDatabase();
    
    const transaction = db.transaction([DBConfig.STORES.CHATS, DBConfig.STORES.MESSAGES], 'readwrite');
    const chatsStore = transaction.objectStore(DBConfig.STORES.CHATS);
    const messagesStore = transaction.objectStore(DBConfig.STORES.MESSAGES);

    return new Promise((_resolve, _reject) => {
      // Save chat metadata
      const chatRequest = chatsStore.put({
        id: _chat.id,
        title: _chat.title,
        timestamp: _chat.timestamp,
        metadata: _chat.metadata
      });

      // Save messages
      const messagePromises = _chat.messages.map(_message => 
        new Promise<void>((_resolveMessage, _rejectMessage) => {
          const messageRequest = messagesStore.put({
            ..._message,
            chatId: _chat.id
          });
          messageRequest.onsuccess = () => _resolveMessage();
          messageRequest.onerror = () => _rejectMessage(messageRequest.error);
        })
      );

      Promise.all([
        new Promise<void>((_resolve, _reject) => {
          chatRequest.onsuccess = () => _resolve();
          chatRequest.onerror = () => _reject(chatRequest.error);
        }),
        ...messagePromises
      ]).then(() => _resolve())
        .catch(_reject);
    });
  }

  async getChat(_chatId: string): Promise<Chat | null> {
    const db = await dbInitializer.getDatabase();
    
    const transaction = db.transaction([DBConfig.STORES.CHATS, DBConfig.STORES.MESSAGES], 'readonly');
    const chatsStore = transaction.objectStore(DBConfig.STORES.CHATS);
    const messagesStore = transaction.objectStore(DBConfig.STORES.MESSAGES);
    const messageIndex = messagesStore.index('chatId');

    return new Promise((_resolve, _reject) => {
      const chatRequest = chatsStore.get(_chatId);

      chatRequest.onsuccess = () => {
        if (!chatRequest.result) {
          _resolve(null);
          return;
        }

        const messagesRequest = messageIndex.getAll(_chatId);
        messagesRequest.onsuccess = () => {
          _resolve({
            ...chatRequest.result,
            messages: messagesRequest.result
          });
        };
        messagesRequest.onerror = () => _reject(messagesRequest.error);
      };

      chatRequest.onerror = () => _reject(chatRequest.error);
    });
  }

  async getAllChats(): Promise<Chat[]> {
    const db = await dbInitializer.getDatabase();
    const transaction = db.transaction([DBConfig.STORES.CHATS], 'readonly');
    const store = transaction.objectStore(DBConfig.STORES.CHATS);

    return new Promise((_resolve, _reject) => {
      const request = store.getAll();
      request.onsuccess = () => _resolve(request.result);
      request.onerror = () => _reject(request.error);
    });
  }

  async deleteChat(_chatId: string): Promise<void> {
    const db = await dbInitializer.getDatabase();
    const transaction = db.transaction([DBConfig.STORES.CHATS, DBConfig.STORES.MESSAGES], 'readwrite');
    const chatsStore = transaction.objectStore(DBConfig.STORES.CHATS);
    const messagesStore = transaction.objectStore(DBConfig.STORES.MESSAGES);
    const messageIndex = messagesStore.index('chatId');

    return new Promise((_resolve, _reject) => {
      const deleteChat = chatsStore.delete(_chatId);
      const getMessages = messageIndex.getAll(_chatId);

      getMessages.onsuccess = () => {
        const messages = getMessages.result;
        const messagePromises = messages.map(_message =>
          new Promise<void>((_resolveMessage, _rejectMessage) => {
            const deleteMessage = messagesStore.delete(_message.id);
            deleteMessage.onsuccess = () => _resolveMessage();
            deleteMessage.onerror = () => _rejectMessage(deleteMessage.error);
          })
        );

        Promise.all([
          new Promise<void>((_resolve, _reject) => {
            deleteChat.onsuccess = () => _resolve();
            deleteChat.onerror = () => _reject(deleteChat.error);
          }),
          ...messagePromises
        ]).then(() => _resolve())
          .catch(_reject);
      };

      getMessages.onerror = () => _reject(getMessages.error);
    });
  }
}

export const chatStorage = ChatStorage.getInstance();