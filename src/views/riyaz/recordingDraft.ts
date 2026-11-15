/**
 * RECORDING DRAFT
 * Local persistence of block recordings ("takes") during a session.
 * A block can hold several takes (e.g. one per song or bhajan); each take has
 * an optional label and a keep flag — only kept takes are uploaded on save.
 *
 * An in-memory map is the primary cache; IndexedDB mirrors it so takes
 * survive a page reload until the session is saved or discarded.
 * Every IndexedDB failure is swallowed — the in-memory copy still works.
 */

export interface RecordingTake {
    takeId: string;
    blockId: string;
    blob: Blob;
    mimeType: string;
    label: string;      // song / bhajan name, may be empty
    kept: boolean;      // uploaded with the session when true
    createdAt: number;
}

/** Upper bound per block so storage use stays predictable (~2 MB per 5-minute take). */
export const MAX_TAKES_PER_BLOCK = 8;

const DB_NAME    = 'dholak_recordings';
const DB_VERSION = 2;           // v1 stored a single recording per block
const STORE      = 'takes';

const memory = new Map<string, RecordingTake>();
let memoryLoaded = false;

// Writes started by recorders that are still stopping — flushRecordings() awaits them
const pendingWrites = new Set<Promise<void>>();

function openDb(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === 'undefined') return Promise.resolve(null);
    return new Promise(resolve => {
        try {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (db.objectStoreNames.contains('blocks')) db.deleteObjectStore('blocks');
                if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'takeId' });
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

/** Loads IndexedDB into memory once per page load (restores takes after a reload). */
async function ensureLoaded(): Promise<void> {
    if (memoryLoaded) return;
    const all = await runRequest<RecordingTake[]>('readonly', store => store.getAll() as IDBRequest<RecordingTake[]>);
    (all ?? []).forEach(take => {
        if (take && take.blob instanceof Blob && !memory.has(take.takeId)) memory.set(take.takeId, take);
    });
    memoryLoaded = true;
}

/** Registers an in-flight write so callers can wait for it with flushRecordings(). */
export function trackPendingWrite(write: Promise<void>): void {
    pendingWrites.add(write);
    void write.finally(() => pendingWrites.delete(write));
}

/** Resolves once every recording that was being stopped has been stored. */
export async function flushRecordings(): Promise<void> {
    await Promise.all([...pendingWrites]);
}

/** Stores a new take. */
export async function addTake(take: RecordingTake): Promise<void> {
    memory.set(take.takeId, take);
    await runRequest('readwrite', store => store.put(take));
}

/**
 * Updates the label or keep flag of a take. The in-memory copy changes
 * synchronously (the take objects handed out are the cached ones), so a save
 * started right after an edit already sees it; IndexedDB follows async.
 */
export async function updateTake(takeId: string, patch: Partial<Pick<RecordingTake, 'label' | 'kept'>>): Promise<void> {
    const take = memory.get(takeId);
    if (!take) return;
    Object.assign(take, patch);
    await runRequest('readwrite', store => store.put(take));
}

/** Takes of one block, oldest first. */
export async function listTakes(blockId: string): Promise<RecordingTake[]> {
    await ensureLoaded();
    return [...memory.values()]
        .filter(take => take.blockId === blockId)
        .sort((a, b) => a.createdAt - b.createdAt);
}

/** Removes every stored take — called when a session is saved, discarded or restarted. */
export async function clearRecordings(): Promise<void> {
    memory.clear();
    memoryLoaded = true;
    await runRequest('readwrite', store => store.clear());
}
