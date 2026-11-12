// Offline storage and sync queue using IndexedDB
const DB_NAME = 'dayflow_offline_db';
const DB_VERSION = 1;

interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  collection: string;
  docId: string;
  data?: any;
  timestamp: number;
}

class OfflineStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async setCache<T>(key: string, data: T): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction('cache', 'readwrite');
      const store = tx.objectStore('cache');
      store.put({ key, data, updatedAt: Date.now() });
    } catch (e) {
      console.warn('IndexedDB setCache failed:', e);
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('cache', 'readonly');
        const store = tx.objectStore('cache');
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async queueOperation(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      const fullItem: SyncQueueItem = {
        ...item,
        id: `${item.collection}_${item.docId}_${Date.now()}`,
        timestamp: Date.now(),
      };
      store.add(fullItem);
    } catch (e) {
      console.warn('Sync queue failed:', e);
    }
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('syncQueue', 'readonly');
        const store = tx.objectStore('syncQueue');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  async clearQueueItem(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction('syncQueue', 'readwrite');
      tx.objectStore('syncQueue').delete(id);
    } catch (e) {
      console.warn('Failed clearing queue item:', e);
    }
  }
}

export const offlineStorage = new OfflineStorage();
