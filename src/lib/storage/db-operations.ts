import { dbInitializer } from './db-init';

export async function dbGet(_storeName: string, _key: string | number): Promise<unknown> {
  const db = await dbInitializer.getDatabase();
  return new Promise((_resolve, _reject) => {
    const transaction = db.transaction(_storeName, 'readonly');
    const store = transaction.objectStore(_storeName);
    const request = store.get(_key);

    request.onsuccess = () => _resolve(request.result);
    request.onerror = () => _reject(request.error);
  });
}

export async function dbPut(_storeName: string, _value: unknown): Promise<unknown> {
  const db = await dbInitializer.getDatabase();
  return new Promise((_resolve, _reject) => {
    const transaction = db.transaction(_storeName, 'readwrite');
    const store = transaction.objectStore(_storeName);
    const request = store.put(_value);

    request.onsuccess = () => _resolve(request.result);
    request.onerror = () => _reject(request.error);
  });
}

export async function dbGetAll(_storeName: string): Promise<any[]> {
  const db = await dbInitializer.getDatabase();
  return new Promise((_resolve, _reject) => {
    const transaction = db.transaction(_storeName, 'readonly');
    const store = transaction.objectStore(_storeName);
    const request = store.getAll();

    request.onsuccess = () => _resolve(request.result);
    request.onerror = () => _reject(request.error);
  });
}

export async function dbDelete(_storeName: string, _key: string | number): Promise<void> {
  const db = await dbInitializer.getDatabase();
  return new Promise((_resolve, _reject) => {
    const transaction = db.transaction(_storeName, 'readwrite');
    const store = transaction.objectStore(_storeName);
    const request = store.delete(_key);

    request.onsuccess = () => _resolve();
    request.onerror = () => _reject(request.error);
  });
}

export async function dbClear(_storeName: string): Promise<void> {
  const db = await dbInitializer.getDatabase();
  return new Promise((_resolve, _reject) => {
    const transaction = db.transaction(_storeName, 'readwrite');
    const store = transaction.objectStore(_storeName);
    const request = store.clear();

    request.onsuccess = () => _resolve();
    request.onerror = () => _reject(request.error);
  });
}