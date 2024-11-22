// src/scripts/setupFirestore.ts

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ServiceAccount } from 'firebase-admin';
import serviceAccount from '../config/serviceAccountKey.json';

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
});

const db = getFirestore();

async function setupFirestore() {
  // Collection: users
  // Example user document
  await db.collection('users').doc('user_uid_123').set({
    id: 'user_uid_123',
    email: 'user@example.com',
    displayName: 'John Doe',
    photoURL: 'https://example.com/photo.jpg',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    settings: {
      theme: 'light',
      notifications: true,
      analytics: false,
    },
  });

  // Collection: chats
  await db.collection('chats').doc('chat_id_456').set({
    id: 'chat_id_456',
    userId: 'user_uid_123',
    title: 'Project Discussion',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    model: 'grok-beta',
    metadata: {
      tags: ['project', 'discussion'],
      category: 'development',
    },
  });

  // Collection: messages
  await db.collection('messages').doc('message_id_789').set({
    id: 'message_id_789',
    chatId: 'chat_id_456',
    userId: 'user_uid_123',
    content: 'Hello, can you assist me with the project setup?',
    role: 'user',
    timestamp: Date.now(),
    metadata: {
      tokens: 10,
      processingTime: 200,
      model: 'grok-beta',
    },
  });

  // Collection: memories
  await db.collection('memories').doc('memory_id_012').set({
    id: 'memory_id_012',
    userId: 'user_uid_123',
    type: 'fact',
    content: 'Project deadline is next Friday.',
    timestamp: Date.now(),
    metadata: {
      source: 'chat',
      relevance: 0.9,
    },
    embeddings: [0.1, -0.2, 0.3, /* ... */],
    tags: ['deadline', 'project'],
  });

  console.log('Firestore setup complete.');
}

setupFirestore().catch((error) => {
  console.error('Error setting up Firestore:', error);
});
