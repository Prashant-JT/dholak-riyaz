/**
 * RECORDING DRAFT
 * Local persistence of block recordings during a session, keyed by block id.
 * An in-memory map is the primary cache; IndexedDB mirrors it so recordings
 * survive a page reload until the session is saved or discarded.
 * Every IndexedDB failure is swallowed — the in-memory copy still works.
 */

export interface StoredRecording {
    blockId: string;
    blob: Blob;
    mimeType: string;
    savedAt: number;
}

const DB_NAME = 'dholak_recordings';
const STORE   = 'blocks';

const memory = new Map<string, StoredRecording>();

function openDb(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === 'undefined') return Promise.resolve(null);
    return new Promise(resolve => {
        try {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = () => {
                req.result.createObjectStore(STORE, { keyPath: 'blockId' });
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror   = () => resolve(null);
            req.onblocked = () => resolve(null);
        } catch {
            resolve(null);
        }
    });
}

/** Runs one request in its own transaction; resolves with its result or null on failure. */
async function runRequest<T>(
    mode: IDBTransactionMode,
    makeRequest: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T | null> {
    const db = await openDb();
    if (!db) return null;
    return new Promise(resolve => {
        try {
            const tx  = db.transaction(STORE, mode);
            const req = makeRequest(tx.objectStore(STORE));
            tx.oncomplete = () => { db.close(); resolve(req.result ?? null); };
            tx.onerror    = () => { db.close(); resolve(null); };
            tx.onabort    = () => { db.close(); resolve(null); };
        } catch {
            db.close();
            resolve(null);
        }
    });
}

/** Stores (or replaces) the recording of a block. */
export async function putRecording(blockId: string, blob: Blob, mimeType: string): Promise<void> {
    const rec: StoredRecording = { blockId, blob, mimeType, savedAt: Date.now() };
    memory.set(blockId, rec);
    await runRequest('readwrite', store => store.put(rec));
}

/** Returns the stored recording of a block, or null if none is kept. */
export async function getRecording(blockId: string): Promise<StoredRecording | null> {
    const cached = memory.get(blockId);
    if (cached) return cached;
    const rec = await runRequest<StoredRecording | undefined>('readonly', store => store.get(blockId));
    if (rec && rec.blob instanceof Blob) {
        memory.set(blockId, rec);
        return rec;
    }
    return null;
}

/** Removes the recording of a block (the user chose not to keep it). */
export async function deleteRecording(blockId: string): Promise<void> {
    memory.delete(blockId);
    await runRequest('readwrite', store => store.delete(blockId));
}

/** Removes every stored recording — called when a session is saved, discarded or restarted. */
export async function clearRecordings(): Promise<void> {
    memory.clear();
    await runRequest('readwrite', store => store.clear());
}
