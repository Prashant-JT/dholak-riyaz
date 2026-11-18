/**
 * RECORDING REVIEWS TESTS
 * Pure logic in src/views/stats/statsReviews.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    countNewReviews, parseReview, formatAtSecs, isNewReview, newReviewPaths, commentsFor,
    reactionSummary, findReaction, scoresFor, findScore, REVIEW_REACTIONS, getReviewer, setReviewer, markSeen, readSeenAt,
} from '../src/views/stats/statsReviews';
import type { RecordingReview } from '../src/views/stats/statsTypes';

const PATH = 'prashant/2026-11-15/abc-123.webm';

function review(over: Partial<RecordingReview>): RecordingReview {
    return {
        id: 'r1', recording_path: PATH, author: 'meera', kind: 'comment', emoji: null, score: null,
        body: 'Nice', at_secs: null, created_at: '2026-11-16T10:00:00Z', ...over,
    };
}

describe('parseReview', () => {
    it('accepts a valid comment and floors the second', () => {
        const r = parseReview({ id: 'a', recording_path: PATH, author: 'meera', kind: 'comment',
            body: 'Tempo drifts', at_secs: 42.7, created_at: '2026-11-16T10:00:00Z' });
        expect(r?.at_secs).toBe(42);
        expect(r?.body).toBe('Tempo drifts');
    });

    it('accepts a valid reaction', () => {
        const r = parseReview({ id: 'a', recording_path: PATH, author: 'prashant', kind: 'reaction',
            emoji: '🔥', created_at: '2026-11-16T10:00:00Z' });
        expect(r?.kind).toBe('reaction');
        expect(r?.emoji).toBe('🔥');
    });

    it('accepts a score from 1 to 5 only', () => {
        const base = { id: 'a', recording_path: PATH, author: 'meera', kind: 'score', created_at: '2026-11-16T10:00:00Z' };
        expect(parseReview({ ...base, score: 4 })?.score).toBe(4);
        expect(parseReview({ ...base, score: 0 })).toBeNull();
        expect(parseReview({ ...base, score: 6 })).toBeNull();
        expect(parseReview({ ...base, score: 3.5 })).toBeNull();
        expect(parseReview({ ...base, score: '4' })).toBeNull();
    });

    it('no longer accepts the removed 🎯 reaction', () => {
        expect(REVIEW_REACTIONS).not.toContain('🎯');
        expect(parseReview({ id: 'a', recording_path: PATH, author: 'meera', kind: 'reaction',
            emoji: '🎯', created_at: '2026-11-16T10:00:00Z' })).toBeNull();
    });

    it('rejects unknown authors, emojis and kinds', () => {
        const base = { id: 'a', recording_path: PATH, created_at: '2026-11-16T10:00:00Z' };
        expect(parseReview({ ...base, author: 'eve', kind: 'comment', body: 'x' })).toBeNull();
        expect(parseReview({ ...base, author: 'meera', kind: 'reaction', emoji: '💩' })).toBeNull();
        expect(parseReview({ ...base, author: 'meera', kind: 'rating', body: 'x' })).toBeNull();
        expect(parseReview({ ...base, author: 'meera', kind: 'comment', body: '   ' })).toBeNull();
        expect(parseReview(null)).toBeNull();
    });

    it('drops invalid seconds instead of rejecting the comment', () => {
        const r = parseReview({ id: 'a', recording_path: PATH, author: 'meera', kind: 'comment',
            body: 'ok', at_secs: -5, created_at: '2026-11-16T10:00:00Z' });
        expect(r?.at_secs).toBeNull();
    });
});

describe('formatAtSecs', () => {
    it('formats minutes and hours', () => {
        expect(formatAtSecs(0)).toBe('0:00');
        expect(formatAtSecs(42)).toBe('0:42');
        expect(formatAtSecs(125)).toBe('2:05');
        expect(formatAtSecs(3725)).toBe('1:02:05');
    });
});

describe('isNewReview / newReviewPaths', () => {
    it('is new only when written by someone else after the last visit', () => {
        const r = review({ created_at: '2026-11-16T10:00:00Z' });
        expect(isNewReview(r, 'prashant', null)).toBe(true);
        expect(isNewReview(r, 'prashant', '2026-11-15T10:00:00Z')).toBe(true);
        expect(isNewReview(r, 'prashant', '2026-11-16T10:00:00Z')).toBe(false);
        expect(isNewReview(r, 'meera', null)).toBe(false);
        expect(isNewReview(r, null, null)).toBe(false);
    });

    it('counts new reviews on the given paths only', () => {
        const items = [review({}), review({ id: 'r2' }), review({ id: 'r3', recording_path: 'meera/2026-11-15/x.webm' })];
        expect(countNewReviews(items, new Set([PATH]), 'prashant', null)).toBe(2);
        expect(countNewReviews(items, new Set([PATH]), 'meera', null)).toBe(0);
    });

    it('collects only the requested paths', () => {
        const items = [review({}), review({ id: 'r2', recording_path: 'meera/2026-11-15/x.webm' })];
        const out = newReviewPaths(items, new Set([PATH]), 'prashant', null);
        expect([...out]).toEqual([PATH]);
    });
});

describe('commentsFor / reactionSummary / findReaction', () => {
    const items: RecordingReview[] = [
        review({ id: 'c1', at_secs: 90 }),
        review({ id: 'c2', at_secs: 10 }),
        review({ id: 'c3', at_secs: null }),
        review({ id: 'x1', kind: 'reaction', emoji: '🔥', body: null, author: 'meera' }),
        review({ id: 'x2', kind: 'reaction', emoji: '🔥', body: null, author: 'prashant' }),
        review({ id: 'x3', kind: 'reaction', emoji: '👏', body: null, recording_path: 'other/2026-01-01/a.webm' }),
    ];

    it('sorts comments by second, untimed last', () => {
        expect(commentsFor(items, PATH).map(c => c.id)).toEqual(['c2', 'c1', 'c3']);
    });

    it('groups reaction authors per emoji for one take', () => {
        const fire = reactionSummary(items, PATH).find(r => r.emoji === '🔥');
        const clap = reactionSummary(items, PATH).find(r => r.emoji === '👏');
        expect(fire?.authors).toEqual(['meera', 'prashant']);
        expect(clap?.authors).toEqual([]);
    });

    it('finds my reaction on a take', () => {
        expect(findReaction(items, PATH, 'prashant', '🔥')?.id).toBe('x2');
        expect(findReaction(items, PATH, 'prashant', '👏')).toBeUndefined();
    });
});

describe('scoresFor / findScore', () => {
    const items: RecordingReview[] = [
        review({ id: 's1', kind: 'score', score: 3, body: null, author: 'meera' }),
        review({ id: 's2', kind: 'score', score: 5, body: null, author: 'prashant' }),
        review({ id: 's3', kind: 'score', score: 1, body: null, author: 'prashant', recording_path: 'other/2026-01-01/a.webm' }),
    ];

    it('returns one score per person for the take, in reviewer order', () => {
        expect(scoresFor(items, PATH)).toEqual([{ author: 'prashant', score: 5 }, { author: 'meera', score: 3 }]);
    });

    it('finds my score on a take', () => {
        expect(findScore(items, PATH, 'meera')?.id).toBe('s1');
        expect(findScore(items, 'none/2026-01-01/b.webm', 'meera')).toBeUndefined();
    });
});

describe('reviewer identity and seen marker', () => {
    beforeEach(() => localStorage.clear());

    it('stores only known reviewers', () => {
        expect(getReviewer()).toBeNull();
        setReviewer('eve');
        expect(getReviewer()).toBeNull();
        setReviewer('meera');
        expect(getReviewer()).toBe('meera');
    });

    it('marks the latest review as seen', () => {
        markSeen('prashant', [
            review({ created_at: '2026-11-16T10:00:00Z' }),
            review({ id: 'r2', created_at: '2026-11-17T08:00:00Z' }),
        ]);
        expect(readSeenAt('prashant')).toBe('2026-11-17T08:00:00Z');
    });
});
