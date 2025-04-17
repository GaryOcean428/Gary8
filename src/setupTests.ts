// Polyfill global crypto and navigator for Node.js test environment
import { webcrypto } from 'node:crypto';

// Polyfill crypto.randomUUID
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

// Polyfill navigator.onLine
if (typeof (globalThis as any).navigator === 'undefined') {
  (globalThis as any).navigator = { onLine: true };
}