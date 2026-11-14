/**
 * RECORDING STORAGE
 * Upload of block recordings to the Supabase Storage bucket and public URL lookup.
 *
 * The bucket is public-read: files are only reachable through their exact path,
 * which contains a random UUID, so links cannot be guessed.
 *
 * The storage client is reached through a narrow local type because the
 * generated supabase.ts (local and CI) only declares `from` and `auth`.
 */

import { db } from './supabase.js';

export const RECORDINGS_BUCKET = 'recordings';

interface StorageError { message: string; }

interface StorageBucket {
    upload: (
        path: string,
        file: Blob,
        opts?: { contentType?: string; upsert?: boolean; cacheControl?: string }
    ) => Promise<{ data: { path: string } | null; error: StorageError | null }>;
    getPublicUrl: (path: string) => { data: { publicUrl: string } };
}

interface StorageClient {
    from: (bucket: string) => StorageBucket;
}

function getBucket(): StorageBucket | null {
    const storage = (db as unknown as { storage?: StorageClient }).storage;
    return storage ? storage.from(RECORDINGS_BUCKET) : null;
}

/** MIME type without codec parameters ('audio/webm; codecs=opus' → 'audio/webm'). */
export function baseMimeType(mimeType: string): string {
    return (mimeType.split(';')[0] ?? '').trim().toLowerCase() || 'audio/webm';
}

/** File extension matching the recorded container. */
export function extensionForMime(mimeType: string): string {
    const base = baseMimeType(mimeType);
    if (base.includes('mp4') || base.includes('aac') || base.includes('m4a')) return 'm4a';
    if (base.includes('ogg')) return 'ogg';
    return 'webm';
}

/** Storage path: <user>/<YYYY-MM-DD>/<uuid>.<ext> */
export function buildRecordingPath(userId: string, savedAtIso: string, mimeType: string, uuid: string): string {
    const safeUser = userId.replace(/[^a-z0-9_-]/gi, '') || 'unknown';
    const day      = savedAtIso.slice(0, 10);
    return `${safeUser}/${day}/${uuid}.${extensionForMime(mimeType)}`;
}

/** Uploads one recording and returns its storage path. Throws on failure. */
export async function uploadRecording(path: string, blob: Blob, mimeType: string): Promise<string> {
    const bucket = getBucket();
    if (!bucket) throw new Error('Supabase storage is not available');
    const { data, error } = await bucket.upload(path, blob, {
        contentType:  baseMimeType(mimeType),
        upsert:       false,
        cacheControl: '31536000',
    });
    if (error) throw new Error(error.message);
    return data?.path ?? path;
}

/** MIME type served for a stored path, derived from its extension. */
export function mimeForPath(path: string): string {
    if (/\.m4a$/i.test(path)) return 'audio/mp4';
    if (/\.ogg$/i.test(path)) return 'audio/ogg';
    return 'audio/webm';
}

/** Whether this browser can play the given recording path in an <audio> element. */
export function canPlayRecording(path: string): boolean {
    if (typeof document === 'undefined') return true;
    return document.createElement('audio').canPlayType(mimeForPath(path)) !== '';
}

/** Public URL of a stored recording, or null if storage is unavailable or the path is invalid. */
export function getRecordingUrl(path: string): string | null {
    // Paths are produced by buildRecordingPath — reject anything else coming from the DB
    if (!/^[a-z0-9_-]+\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]+\.(webm|ogg|m4a)$/i.test(path)) return null;
    const bucket = getBucket();
    if (!bucket) return null;
    const url = bucket.getPublicUrl(path).data.publicUrl;
    return /^https:\/\//i.test(url) ? url : null;
}
