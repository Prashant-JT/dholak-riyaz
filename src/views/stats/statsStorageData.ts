/**
 * STATS — Supabase space used: fetch
 * Totals come from the SQL function storage_usage() (scripts/storage_usage.sql, local only).
 */

import { db } from '../../core/supabase.js';
import type { StorageUsage } from './statsTypes.js';
import { parseStorageUsage } from './statsStorage.js';

interface RpcClient {
    rpc: (fn: string) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

/** Space totals, or null when the function is missing or unreachable. */
export async function fetchStorageUsage(): Promise<StorageUsage | null> {
    const client = db as unknown as Partial<RpcClient>;
    if (typeof client.rpc !== 'function') return null;
    try {
        const { data, error } = await client.rpc('storage_usage');
        if (error) throw new Error(error.message);
        return parseStorageUsage(data);
    } catch (err: unknown) {
        console.warn('Storage usage unavailable:', err);
        return null;
    }
}

