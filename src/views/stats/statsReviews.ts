/**
 * STATS — Recording reviews: pure logic (reactions, comments, scores)
 * Parsing of DB rows, reviewer identity (stored on this device), "new" tracking
 * and per-take summaries. No DB access here — see statsReviewsData.ts.
 */

import type { RecordingReview } from './statsTypes.js';

// Ordered best → worst: perfect, great, good | not convinced, repeat it, it slipped
export const REVIEW_REACTIONS: readonly string[] = ['💯', '🔥', '👏', '🤔', '🔁', '😬'];
export const NEG_REACTIONS_START = 3;   // index of the first "needs work" reaction
export const REVIEW_SCORE_MAX = 5;
export const REVIEWERS: readonly string[] = ['prashant', 'meera'];
export const REVIEW_BODY_MAX = 500;

// Set only after the password check (statsReviewsUI.ts); the old key held unverified picks
const LS_REVIEWER = 'dholak_reviewer_auth';
const LS_SEEN     = 'dholak_reviews_seen_';

// ── Parsing ───────────────────────────────────────────────────────────────────

/** Validates a DB row (untrusted: rows can be edited by hand). */
export function parseReview(row: unknown): RecordingReview | null {
    if (!row || typeof row !== 'object') return null;
    const r = row as Record<string, unknown>;
    if (typeof r.id !== 'string' || typeof r.recording_path !== 'string') return null;
    if (typeof r.author !== 'string' || !REVIEWERS.includes(r.author)) return null;
    if (typeof r.created_at !== 'string' || Number.isNaN(Date.parse(r.created_at))) return null;

    if (r.kind === 'reaction') {
        if (typeof r.emoji !== 'string' || !REVIEW_REACTIONS.includes(r.emoji)) return null;
        return { id: r.id, recording_path: r.recording_path, author: r.author, kind: 'reaction',
            emoji: r.emoji, score: null, body: null, at_secs: null, created_at: r.created_at };
    }
    if (r.kind === 'score') {
        if (!isValidScore(r.score)) return null;
        return { id: r.id, recording_path: r.recording_path, author: r.author, kind: 'score',
            emoji: null, score: r.score, body: null, at_secs: null, created_at: r.created_at };
    }
    if (r.kind === 'comment') {
        if (typeof r.body !== 'string' || r.body.trim() === '') return null;
        const at = typeof r.at_secs === 'number' && Number.isFinite(r.at_secs) && r.at_secs >= 0
            ? Math.floor(r.at_secs) : null;
        return { id: r.id, recording_path: r.recording_path, author: r.author, kind: 'comment',
            emoji: null, score: null, body: r.body.slice(0, REVIEW_BODY_MAX), at_secs: at, created_at: r.created_at };
    }
    return null;
}

export function isValidScore(v: unknown): v is number {
    return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= REVIEW_SCORE_MAX;
}

/** 42 → '0:42', 125 → '2:05', 3725 → '1:02:05' */
export function formatAtSecs(secs: number): string {
    const total = Math.max(0, Math.floor(secs));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = String(total % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

// ── Identity (per device) ─────────────────────────────────────────────────────

export function getReviewer(): string | null {
    const v = localStorage.getItem(LS_REVIEWER);
    return v && REVIEWERS.includes(v) ? v : null;
}

export function setReviewer(id: string): void {
    if (REVIEWERS.includes(id)) localStorage.setItem(LS_REVIEWER, id);
}

export function clearReviewer(): void {
    localStorage.removeItem(LS_REVIEWER);
}

// ── "New" tracking ────────────────────────────────────────────────────────────

export function readSeenAt(reviewer: string): string | null {
    return localStorage.getItem(LS_SEEN + reviewer);
}

/** Marks every loaded review as seen, using the server clock (latest created_at). */
export function markSeen(reviewer: string, items: RecordingReview[]): void {
    const latest = items.reduce<string | null>(
        (max, r) => (max === null || Date.parse(r.created_at) > Date.parse(max) ? r.created_at : max), null);
    if (latest) localStorage.setItem(LS_SEEN + reviewer, latest);
}

/** A review is new for `me` when someone else wrote it after my last visit. */
export function isNewReview(r: RecordingReview, me: string | null, seenAt: string | null): boolean {
    if (!me || r.author === me) return false;
    return seenAt === null || Date.parse(r.created_at) > Date.parse(seenAt);
}

/** Recording paths (among `paths`) that hold at least one new review for `me`. */
export function newReviewPaths(
    items: RecordingReview[], paths: Set<string>, me: string | null, seenAt: string | null
): Set<string> {
    const out = new Set<string>();
    items.forEach(r => {
        if (paths.has(r.recording_path) && isNewReview(r, me, seenAt)) out.add(r.recording_path);
    });
    return out;
}

/** How many reviews on `paths` are new for `me`. */
export function countNewReviews(
    items: RecordingReview[], paths: Set<string>, me: string | null, seenAt: string | null
): number {
    return items.filter(r => paths.has(r.recording_path) && isNewReview(r, me, seenAt)).length;
}

// ── Per-take summaries ────────────────────────────────────────────────────────

export function commentsFor(items: RecordingReview[], path: string): RecordingReview[] {
    return items
        .filter(r => r.kind === 'comment' && r.recording_path === path)
        .sort((a, b) => (a.at_secs ?? Infinity) - (b.at_secs ?? Infinity)
            || Date.parse(a.created_at) - Date.parse(b.created_at));
}

/** Authors per reaction emoji, in REVIEW_REACTIONS order (emojis without reactions included). */
export function reactionSummary(items: RecordingReview[], path: string): { emoji: string; authors: string[] }[] {
    return REVIEW_REACTIONS.map(emoji => ({
        emoji,
        authors: Array.from(new Set(items
            .filter(r => r.kind === 'reaction' && r.recording_path === path && r.emoji === emoji)
            .map(r => r.author))),
    }));
}

export function findReaction(
    items: RecordingReview[], path: string, author: string, emoji: string
): RecordingReview | undefined {
    return items.find(r => r.kind === 'reaction' && r.recording_path === path
        && r.author === author && r.emoji === emoji);
}

/** Score of one person on a take. */
export function findScore(items: RecordingReview[], path: string, author: string): RecordingReview | undefined {
    return items.find(r => r.kind === 'score' && r.recording_path === path && r.author === author);
}

/** Scores on a take, one per person, in REVIEWERS order. */
export function scoresFor(items: RecordingReview[], path: string): { author: string; score: number }[] {
    return REVIEWERS.flatMap(author => {
        const r = findScore(items, path, author);
        return r && r.score !== null ? [{ author, score: r.score }] : [];
    });
}
