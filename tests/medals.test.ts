/**
 * MEDALS TESTS — recording and review medals (src/views/stats/medalsRecordings.ts)
 */

import { describe, it, expect } from 'vitest';
import { computeRecordingMedalData } from '../src/views/stats/medalsRecordings';
import type { SupabaseSession, RecordingReview } from '../src/views/stats/statsTypes';

const take = (n: number) => `meera/2026-11-18/${String(n).padStart(4, '0')}.m4a`;

function session(saved_at: string, paths: string[], legacy?: string): SupabaseSession {
    return {
        id: saved_at, user_id: 'meera', saved_at, total_secs: 60, notes: null,
        blocks: [{ type: 'practice', recordings: paths.map(path => ({ path })), ...(legacy ? { recording_path: legacy, recordings: undefined } : {}) }],
    };
}

function rv(over: Partial<RecordingReview>): RecordingReview {
    return { id: Math.random().toString(), recording_path: take(1), author: 'prashant', kind: 'reaction',
        emoji: '👏', score: null, body: null, at_secs: null, created_at: '2026-11-18T21:00:00Z', ...over };
}

describe('computeRecordingMedalData', () => {
    it('counts takes, including the legacy single path, and dates the milestones', () => {
        const sessions = [
            session('2026-11-17T10:00:00Z', [], 'meera/2026-11-17/legacy.webm'),
            session('2026-11-18T10:00:00Z', Array.from({ length: 24 }, (_, i) => take(i + 1))),
        ];
        const d = computeRecordingMedalData(sessions, 'meera', []);
        expect(d.takes).toBe(25);
        expect(d.firstTakeAt).toBe('2026-11-17T10:00:00Z');
        expect(d.archiveAt).toBe('2026-11-18T10:00:00Z');
    });

    it('only counts 5/5 and 💯 received from the other person on my takes', () => {
        const sessions = [session('2026-11-18T10:00:00Z', [take(1)])];
        const reviews = [
            rv({ kind: 'score', emoji: null, score: 5, author: 'meera' }),                                    // self
            rv({ kind: 'score', emoji: null, score: 5, recording_path: 'prashant/2026-11-18/x.m4a' }),        // not mine
            rv({ kind: 'score', emoji: null, score: 4, created_at: '2026-11-18T21:01:00Z' }),
            rv({ emoji: '💯', created_at: '2026-11-18T21:05:00Z' }),
        ];
        const d = computeRecordingMedalData(sessions, 'meera', reviews);
        expect(d.fiveStarsAt).toBeUndefined();
        expect(d.perfectAt).toBe('2026-11-18T21:05:00Z');
    });

    it('counts distinct takes of the other person I reviewed', () => {
        const sessions = [session('2026-11-18T10:00:00Z', [take(1)])];
        const reviews = [
            ...Array.from({ length: 25 }, (_, i) => rv({ author: 'meera', recording_path: `prashant/2026-11-18/${i}.m4a`,
                created_at: `2026-11-18T21:${String(i).padStart(2, '0')}:00Z` })),
            rv({ author: 'meera', kind: 'comment', emoji: null, body: 'x', recording_path: 'prashant/2026-11-18/0.m4a' }), // same take
            rv({ author: 'meera', recording_path: take(1) }),                                                             // my own take
        ];
        const d = computeRecordingMedalData(sessions, 'meera', reviews);
        expect(d.reviewedTakes).toBe(25);
        expect(d.mentorAt).toBe('2026-11-18T21:24:00Z');
    });
});
