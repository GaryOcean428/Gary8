export const DBConfig = {
  DB_NAME: 'agent-one',
  DB_VERSION: 1,
  STORES: {
    MESSAGES: 'messages',
    MEMORY: 'memory',
    USER: 'user',
    SETTINGS: 'settings',
    CHATS: 'chats',
    WORKFLOWS: 'workflows'
  }
} as const;