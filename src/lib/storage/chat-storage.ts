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

  async saveChat(chat: Chat): Promise<void> {
    const db = await dbInitializer.getDatabase();
    
    const transaction = db.transaction([DBConfig.STORES.CHATS, DBConfig.STORES.MESSAGES], 'readwrite');
    const chatsStore = transaction.objectStore(DBConfig.STORES.CHATS);
    const messagesStore = transaction.objectStore(DBConfig.STORES.MESSAGES);

    return new Promise((resolve, reject) => {
      // Save chat metadata
      const chatRequest = chatsStore.put({
        id: chat.id,
        title: chat.title,
        timestamp: chat.timestamp,
        metadata: chat.metadata
      });

      // Save messages
      const messagePromises = chat.messages.map(message => 
        new Promise<void>((resolveMessage, rejectMessage) => {
          const messageRequest = messagesStore.put({
            ...message,
            chatId: chat.id
          });
          messageRequest.onsuccess = () => resolveMessage();
          messageRequest.onerror = () => rejectMessage(messageRequest.error);
        })
      );

      Promise.all([
        new Promise<void>((resolve, reject) => {
          chatRequest.onsuccess = () => resolve();
          chatRequest.onerror = () => reject(chatRequest.error);
        }),
        ...messagePromises
      ]).then(() => resolve())
        .catch(reject);
    });
  }

  async getChat(chatId: string): Promise<Chat | null> {
    const db = await dbInitializer.getDatabase();
    
    const transaction = db.transaction([DBConfig.STORES.CHATS, DBConfig.STORES.MESSAGES], 'readonly');
    const chatsStore = transaction.objectStore(DBConfig.STORES.CHATS);
    const messagesStore = transaction.objectStore(DBConfig.STORES.MESSAGES);
    const messageIndex = messagesStore.index('chatId');

    return new Promise((resolve, reject) => {
      const chatRequest = chatsStore.get(chatId);

      chatRequest.onsuccess = () => {
        if (!chatRequest.result) {
          resolve(null);
          return;
        }

        const messagesRequest = messageIndex.getAll(chatId);
        messagesRequest.onsuccess = () => {
          resolve({
            ...chatRequest.result,
            messages: messagesRequest.result
          });
        };
        messagesRequest.onerror = () => reject(messagesRequest.error);
      };

      chatRequest.onerror = () => reject(chatRequest.error);
    });
  }

  async getAllChats(): Promise<Chat[]> {
    const db = await dbInitializer.getDatabase();
    const transaction = db.transaction([DBConfig.STORES.CHATS], 'readonly');
    const store = transaction.objectStore(DBConfig.STORES.CHATS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteChat(chatId: string): Promise<void> {
    const db = await dbInitializer.getDatabase();
    const transaction = db.transaction([DBConfig.STORES.CHATS, DBConfig.STORES.MESSAGES], 'readwrite');
    const chatsStore = transaction.objectStore(DBConfig.STORES.CHATS);
    const messagesStore = transaction.objectStore(DBConfig.STORES.MESSAGES);
    const messageIndex = messagesStore.index('chatId');

    return new Promise((resolve, reject) => {
      const deleteChat = chatsStore.delete(chatId);
      const getMessages = messageIndex.getAll(chatId);

      getMessages.onsuccess = () => {
        const messages = getMessages.result;
        const messagePromises = messages.map(message =>
          new Promise<void>((resolveMessage, rejectMessage) => {
            const deleteMessage = messagesStore.delete(message.id);
            deleteMessage.onsuccess = () => resolveMessage();
            deleteMessage.onerror = () => rejectMessage(deleteMessage.error);
          })
        );

        Promise.all([
          new Promise<void>((resolve, reject) => {
            deleteChat.onsuccess = () => resolve();
            deleteChat.onerror = () => reject(deleteChat.error);
          }),
          ...messagePromises
        ]).then(() => resolve())
          .catch(reject);
      };

      getMessages.onerror = () => reject(getMessages.error);
    });
  }
}

export const chatStorage = ChatStorage.getInstance();