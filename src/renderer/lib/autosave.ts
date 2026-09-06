import type {SitemapDocument} from '@/lib/sitemap.ts';

const DATABASE_NAME = 'sitemap-builder';
const STORE_NAME = 'recovery';
const RECORD_KEY = 'current';
const LEGACY_KEY = 'sitemap-builder-autosave';
const CLEARED_AT_KEY = 'sitemap-builder-autosave-cleared-at';

export type AutosaveRecord = {
    document: SitemapDocument;
    savedAt: string;
};

let databasePromise: Promise<IDBDatabase> | null = null;

function database(): Promise<IDBDatabase> {
    databasePromise ??= new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, 1);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Autosave-Datenbank konnte nicht geöffnet werden.'));
        request.onblocked = () => reject(new Error('Autosave-Datenbank ist blockiert.'));
    });
    return databasePromise;
}

async function runTransaction<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
    const db = await database();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const request = operation(transaction.objectStore(STORE_NAME));
        let result: T;
        request.onsuccess = () => {
            result = request.result;
        };
        request.onerror = () => reject(request.error ?? new Error('Autosave-Operation fehlgeschlagen.'));
        transaction.oncomplete = () => resolve(result);
        transaction.onabort = () => reject(transaction.error ?? new Error('Autosave-Transaktion abgebrochen.'));
        transaction.onerror = () => reject(transaction.error ?? new Error('Autosave-Transaktion fehlgeschlagen.'));
    });
}

export async function saveAutosave(document: SitemapDocument): Promise<void> {
    const record: AutosaveRecord = {document, savedAt: new Date().toISOString()};
    try {
        await runTransaction('readwrite', (store) => store.put(record, RECORD_KEY));
        localStorage.removeItem(LEGACY_KEY);
        localStorage.removeItem(CLEARED_AT_KEY);
    } catch (error) {
        // Legacy fallback keeps recovery working where IndexedDB is unavailable.
        localStorage.setItem(LEGACY_KEY, JSON.stringify(record));
        localStorage.removeItem(CLEARED_AT_KEY);
        if (!localStorage.getItem(LEGACY_KEY)) throw error;
    }
}

export async function loadAutosave(): Promise<AutosaveRecord | null> {
    try {
        const record = await runTransaction<AutosaveRecord | undefined>('readonly', (store) => store.get(RECORD_KEY));
        const clearedAt = localStorage.getItem(CLEARED_AT_KEY);
        if (record && (!clearedAt || record.savedAt > clearedAt)) return record;
    } catch {
        // Try legacy storage below.
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    return legacy ? JSON.parse(legacy) as AutosaveRecord : null;
}

export async function clearAutosave(): Promise<void> {
    localStorage.removeItem(LEGACY_KEY);
    localStorage.setItem(CLEARED_AT_KEY, new Date().toISOString());
    try {
        await runTransaction('readwrite', (store) => store.delete(RECORD_KEY));
    } catch {
        // No recovery record remains in fallback storage; database may be unavailable.
    }
}
