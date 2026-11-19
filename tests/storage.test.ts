/**
 * STORAGE USAGE TESTS
 * Pure logic in src/views/stats/statsStorage.ts
 */

import { describe, it, expect } from 'vitest';
import {
    parseStorageUsage, usedPct, daysUntilFull, worstPct, RECORDINGS_LIMIT_BYTES, DB_LIMIT_BYTES,
} from '../src/views/stats/statsStorage';

const MB = 1024 ** 2;

describe('parseStorageUsage', () => {
    it('reads numbers and numeric strings (bigint comes back as text)', () => {
        expect(parseStorageUsage({ recordings_bytes: '45000000', recordings_count: 19,
            recordings_30d_bytes: 45000000, db_bytes: 9000000 })).toEqual({
            recordingsBytes: 45000000, recordingsCount: 19, recordings30dBytes: 45000000, dbBytes: 9000000,
        });
    });

    it('rejects shapes without the totals and clamps bad values to 0', () => {
        expect(parseStorageUsage(null)).toBeNull();
        expect(parseStorageUsage({ foo: 1 })).toBeNull();
        expect(parseStorageUsage({ recordings_bytes: -5, db_bytes: 'x' })?.recordingsBytes).toBe(0);
    });
});

describe('usedPct', () => {
    it('rounds down and caps at 100', () => {
        expect(usedPct(0, 100)).toBe(0);
        expect(usedPct(79.9, 100)).toBe(79);
        expect(usedPct(80, 100)).toBe(80);
        expect(usedPct(250, 100)).toBe(100);
        expect(usedPct(5, 0)).toBe(0);
    });
});

describe('daysUntilFull', () => {
    it('projects from the last 30 days', () => {
        // 500 MB left, 300 MB per 30 days → 10 MB/day → 50 days
        expect(daysUntilFull(RECORDINGS_LIMIT_BYTES - 500 * MB, 300 * MB, RECORDINGS_LIMIT_BYTES)).toBe(50);
    });

    it('is null without growth and 0 when already full', () => {
        expect(daysUntilFull(100 * MB, 0, RECORDINGS_LIMIT_BYTES)).toBeNull();
        expect(daysUntilFull(RECORDINGS_LIMIT_BYTES, 10 * MB, RECORDINGS_LIMIT_BYTES)).toBe(0);
    });
});

describe('worstPct', () => {
    it('takes the fuller of recordings and database', () => {
        expect(worstPct({ recordingsBytes: RECORDINGS_LIMIT_BYTES * 0.5, recordingsCount: 1,
            recordings30dBytes: 0, dbBytes: DB_LIMIT_BYTES * 0.85 })).toBe(85);
    });
});
