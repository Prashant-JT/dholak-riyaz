/**
 * STATS — Supabase space used: pure computations
 * Fetch: statsStorageData.ts · UI: statsStorageUI.ts
 */

import type { StorageUsage } from './statsTypes.js';

// Supabase free plan limits
export const RECORDINGS_LIMIT_BYTES = 1024 ** 3;          // 1 GB file storage
export const DB_LIMIT_BYTES         = 500 * 1024 ** 2;    // 500 MB database
export const STORAGE_WARN_PCT       = 80;

const num = (v: unknown): number => {
    const n = typeof v === 'string' ? Number(v) : v;
    return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : 0;
};

/** Validates the JSON returned by storage_usage(). */
export function parseStorageUsage(data: unknown): StorageUsage | null {
    if (!data || typeof data !== 'object') return null;
    const r = data as Record<string, unknown>;
    if (!('recordings_bytes' in r) || !('db_bytes' in r)) return null;
    return {
        recordingsBytes:    num(r.recordings_bytes),
        recordingsCount:    num(r.recordings_count),
        recordings30dBytes: num(r.recordings_30d_bytes),
        dbBytes:            num(r.db_bytes),
    };
}

/** Percentage used, 0–100 (rounded down so 79.9 % does not read as 80 %). */
export function usedPct(bytes: number, limit: number): number {
    if (limit <= 0) return 0;
    return Math.min(100, Math.floor((bytes / limit) * 100));
}

/** Days until `limit` is reached at the pace of the last 30 days; null if there is no growth. */
export function daysUntilFull(bytes: number, last30dBytes: number, limit: number): number | null {
    if (last30dBytes <= 0) return null;
    const remaining = limit - bytes;
    if (remaining <= 0) return 0;
    return Math.floor(remaining / (last30dBytes / 30));
}

/** Highest usage among recordings and database, to decide the warning. */
export function worstPct(u: StorageUsage): number {
    return Math.max(usedPct(u.recordingsBytes, RECORDINGS_LIMIT_BYTES), usedPct(u.dbBytes, DB_LIMIT_BYTES));
}
