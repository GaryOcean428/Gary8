# Database Schema Setup Guide

This guide provides step-by-step instructions to set up the database schema for the project. It includes details on naming the database, defining collections and documents, field types and values, hierarchy, and how to find essential identifiers like the Firebase Auth UID.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Naming](#database-naming)
3. [Setting Up Firebase Project](#setting-up-firebase-project)
4. [Initializing Firebase in Your Project](#initializing-firebase-in-your-project)
5. [Database Schemas](#database-schemas)
    - [Collection: users](#collection-users)
    - [Collection: chats](#collection-chats)
    - [Collection: messages](#collection-messages)
    - [Collection: memories](#collection-memories)
6. [Hierarchical Structure and Relationships](#hierarchical-structure-and-relationships)
7. [Finding the Firebase Auth UID](#finding-the-firebase-auth-uid)
8. [Database Configuration](#database-configuration)
    - [Firebase Setup](#firebase-setup)
    - [Vector Database Setup](#vector-database-setup)
9. [Usage Examples](#usage-examples)
10. [Best Practices](#best-practices)
11. [Additional Tips](#additional-tips)
12. [Resources](#resources)

---

## Prerequisites

Ensure you have the following before starting:

- Node.js and npm installed
- Firebase project created
- Necessary npm packages installed

### Installing Required NPM Packages

```bash
# Install Firebase dependencies
npm install firebase firebase-admin

# Install vector database SDK (if using Pinecone)
npm install @pinecone-database/pinecone
```

---

## Database Naming

The database used in this project is **Firestore**, a NoSQL document database provided by Firebase. You don't need to name the database explicitly as it is managed within your Firebase project. However, for reference, we will consider the database as part of the **agent-one** project.

---

## Setting Up Firebase Project

1. **Create a Firebase Project:**

   Visit the [Firebase Console](https://console.firebase.google.com/) and create a new project named **agent-one**.

2. **Enable Firestore Database:**

   - Navigate to **Firestore Database** in the Firebase Console.
   - Click **Create Database**.
   - Select **Start in Production Mode**.
   - Choose the appropriate Cloud Firestore location.

3. **Enable Authentication:**

   - Go to **Authentication** in the Firebase Console.
   - Click on **Get Started**.
   - Enable the **Email/Password** sign-in method or any other methods required for your project.

---

## Initializing Firebase in Your Project

Create a Firebase configuration file to initialize Firebase services in your application.

```typescript
// src/lib/firebase.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',           // Replace with your API key
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',     // Replace with your Project ID
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',             // Replace with your App ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
```

**Note:** Replace placeholders like `YOUR_API_KEY`, `YOUR_PROJECT_ID`, etc., with actual values from your Firebase project settings.

---

## Database Schemas

The database consists of the following top-level collections:

- `users`
- `chats`
- `messages`
- `memories`

### Collection: users

- **Document ID**: Use the Firebase Auth UID.
- **Parent Path**: Root (`/users`).

**Fields:**

| Field              | Type     | Description                              |
|--------------------|----------|------------------------------------------|
| id                 | string   | User's UID (same as Document ID)         |
| email              | string   | User's email address                     |
| displayName        | string   | Optional. User's display name            |
| photoURL           | string   | Optional. URL to user's profile image    |
| createdAt          | number   | Timestamp of account creation (ms)       |
| lastLoginAt        | number   | Timestamp of last login (ms)             |
| settings           | map      | User settings                            |
| ├── theme          | string   | "light" or "dark"                        |
| ├── notifications  | boolean  | Enable notifications                     |
| └── analytics      | boolean  | Enable analytics                         |

**Example Document Path:** `/users/{uid}`

**Example Values:**

```json
{
  "id": "user_uid_123",
  "email": "user@example.com",
  "displayName": "John Doe",
  "photoURL": "https://example.com/photo.jpg",
  "createdAt": 1627847260000,
  "lastLoginAt": 1627847360000,
  "settings": {
    "theme": "light",
    "notifications": true,
    "analytics": false
  }
}
```

### Collection: chats

- **Document ID**: Auto-generated ID.
- **Parent Path**: Root (`/chats`).

**Fields:**

| Field          | Type     | Description                              |
|----------------|----------|------------------------------------------|
| id             | string   | Auto-generated Document ID               |
| userId         | string   | UID of the user who owns the chat        |
| title          | string   | Title of the chat                        |
| createdAt      | number   | Timestamp when chat was created (ms)     |
| updatedAt      | number   | Timestamp when chat was last updated (ms)|
| model          | string   | AI model used (e.g., "grok-beta")        |
| metadata       | map      | Optional. Additional metadata            |

**Example Document Path:** `/chats/{chatId}`

**Example Values:**

```json
{
  "id": "chat_id_456",
  "userId": "user_uid_123",
  "title": "Project Discussion",
  "createdAt": 1627847360000,
  "updatedAt": 1627847460000,
  "model": "grok-beta",
  "metadata": {
    "tags": ["project", "discussion"],
    "category": "development"
  }
}
```

### Collection: messages

- **Document ID**: Auto-generated ID.
- **Parent Path**: Root (`/messages`).

**Fields:**

| Field             | Type     | Description                              |
|-------------------|----------|------------------------------------------|
| id                | string   | Auto-generated Document ID               |
| chatId            | string   | ID of the chat this message belongs to   |
| userId            | string   | UID of the user who sent the message     |
| content           | string   | Content of the message                   |
| role              | string   | "user", "assistant", or "system"         |
| timestamp         | number   | Timestamp when message was sent (ms)     |
| metadata          | map      | Optional. Additional metadata            |
| ├── tokens        | number   | Number of tokens in the message          |
| ├── processingTime| number   | Processing time in milliseconds          |
| ├── model         | string   | Model used to generate the message       |
| └── codeBlocks    | array    | Optional. Code snippets included         |

**Example Document Path:** `/messages/{messageId}`

**Example Values:**

```json
{
  "id": "message_id_789",
  "chatId": "chat_id_456",
  "userId": "user_uid_123",
  "content": "Hello, can you assist me with the project setup?",
  "role": "user",
  "timestamp": 1627847460000,
  "metadata": {
    "tokens": 10,
    "processingTime": 200,
    "model": "grok-beta"
  }
}
```

### Collection: memories

- **Document ID**: Auto-generated ID.
- **Parent Path**: Root (`/memories`).

**Fields:**

| Field             | Type     | Description                              |
|-------------------|----------|------------------------------------------|
| id                | string   | Auto-generated Document ID               |
| userId            | string   | UID of the user who owns the memory      |
| type              | string   | Type of memory (e.g., "code", "fact")    |
| content           | string   | Content of the memory                    |
| context           | string   | Optional. Context related to the memory  |
| timestamp         | number   | Timestamp when memory was created (ms)   |
| metadata          | map      | Optional. Additional metadata            |
| ├── source        | string   | Source of the memory                     |
| ├── relevance     | number   | Relevance score (0.0 to 1.0)             |
| └── embeddings    | array    | Embedding vector                         |
| tags              | array    | Tags associated with the memory          |

**Example Document Path:** `/memories/{memoryId}`

**Example Values:**

```json
{
  "id": "memory_id_012",
  "userId": "user_uid_123",
  "type": "fact",
  "content": "Project deadline is next Friday.",
  "timestamp": 1627847560000,
  "metadata": {
    "source": "chat",
    "relevance": 0.9
  },
  "embeddings": [0.1, -0.2, 0.3, ...],  // 384-dimensional vector
  "tags": ["deadline", "project"]
}
```

---

## Hierarchical Structure and Relationships

- **users** (Collection)
  - Documents: Each document represents a user.
- **chats** (Collection)
  - Documents: Each document represents a chat session.
  - Relationship: Each chat is associated with a user via `userId`.
- **messages** (Collection)
  - Documents: Each document represents a message.
  - Relationship: Each message is associated with a chat via `chatId` and a user via `userId`.
- **memories** (Collection)
  - Documents: Each document represents a memory.
  - Relationship: Each memory is associated with a user via `userId`.

---

## Finding the Firebase Auth UID

The Firebase Auth UID is a unique identifier for each authenticated user. It's essential for linking user data across different collections.

### On the Client Side

#### After User Sign-In

```typescript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();

const signIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  console.log('User UID:', uid);
  return uid;
};
```

#### Getting Current User's UID

```typescript
const auth = getAuth();
const user = auth.currentUser;

if (user) {
  const uid = user.uid;
  console.log('Current User UID:', uid);
} else {
  console.log('No user is signed in.');
}
```

#### Listening for Authentication State Changes

```typescript
import { onAuthStateChanged } from 'firebase/auth';

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User is signed in:', user.uid);
  } else {
    console.log('No user is signed in.');
  }
});
```

### On the Server Side (Firebase Admin SDK)

```typescript
import { getAuth } from 'firebase-admin/auth';

const getUserByUID = async (uid: string) => {
  const userRecord = await getAuth().getUser(uid);
  console.log('User record:', userRecord);
};
```

---

## Database Configuration

### Firebase Setup

- **Enable Firestore** in your Firebase project.
- **Set up security rules** to control access.
- **Configure indexes** for efficient querying.

#### Security Rules Example

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    match /chats/{chatId} {
      allow read, write: if request.auth.uid != null;
    }

    match /messages/{messageId} {
      allow read, write: if request.auth.uid != null;
    }

    match /memories/{memoryId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

**Note:** Adjust these rules based on your application's requirements.

### Vector Database Setup

If using a vector database like Pinecone, define your configuration:

```typescript
interface VectorStoreConfig {
  dimensions: number;           // Vector dimensions (e.g., 384)
  metric: 'cosine' | 'euclidean' | 'dotproduct';
  pods: number;                 // Number of pods
  replicas: number;             // Number of replicas
}
```

---

## Usage Examples

### Initializing Firebase Services

```typescript
import { auth, db } from './firebase';

// Now you can use `auth` and `db` throughout your app
```

### Creating a New User Document

```typescript
import { setDoc, doc, Timestamp } from 'firebase/firestore';

const createUserProfile = async (user: User) => {
  await setDoc(doc(db, 'users', user.uid), {
    id: user.uid,
    email: user.email,
    displayName: user.displayName || 'Anonymous',
    photoURL: user.photoURL || '',
    createdAt: Timestamp.now().toMillis(),
    lastLoginAt: Timestamp.now().toMillis(),
    settings: {
      theme: 'light',
      notifications: true,
      analytics: true,
    },
  });
};
```

### Creating a New Chat

```typescript
import { addDoc, collection, Timestamp } from 'firebase/firestore';

const createChat = async (userId: string, title: string) => {
  const chatRef = await addDoc(collection(db, 'chats'), {
    userId,
    title,
    createdAt: Timestamp.now().toMillis(),
    updatedAt: Timestamp.now().toMillis(),
    model: 'grok-beta',
  });
  return chatRef.id;
};
```

### Storing a Memory with Embeddings

```typescript
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { generateEmbeddings } from './embeddingService';

const storeMemory = async (userId: string, content: string) => {
  const embeddings = await generateEmbeddings(content);
  await addDoc(collection(db, 'memories'), {
    userId,
    type: 'fact',
    content,
    timestamp: Timestamp.now().toMillis(),
    embeddings,
    tags: ['example', 'test'],
  });
};
```

---

## Best Practices

1. **Data Validation**
   - Validate all data before writing to Firestore.
   - Use TypeScript interfaces to enforce data types.
   - Implement server-side validation where necessary.

2. **Security**
   - Use Firebase Security Rules to protect data.
   - Ensure users can only access their own data.
   - Regularly review and update security policies.

3. **Performance**
   - Optimize queries and use indexing.
   - Batch write operations when possible.
   - Monitor read/write costs in the Firebase Console.

4. **Maintenance**
   - Version control your schema and rules.
   - Document any changes thoroughly.
   - Regularly back up your database.

---

## Additional Tips

- **Dynamic System Prompts**: System prompts are assigned dynamically based on the requirements of the agentic flow and are not stored in the database. Ensure that your application logic handles system prompts appropriately without relying on static database fields.
- **Document IDs**: Use meaningful IDs where possible, but avoid exposing sensitive information.
- **Timestamps**: Store timestamps in milliseconds since epoch for consistency.
- **Error Handling**: Implement robust error handling for all database operations.
- **Testing**: Use Firebase Emulator Suite for local testing.

---

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Security Rules Guide](https://firebase.google.com/docs/rules)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
