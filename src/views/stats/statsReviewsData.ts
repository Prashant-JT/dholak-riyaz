/**
 * STATS — Recording reviews: Supabase access (table 'recording_reviews')
 * Schema and policies: scripts/recording_reviews.sql (local only, git-ignored)
 *
 * The table is reached through a narrow local type because the generated
 * supabase.ts (local and CI) only declares select/insert/update on `from`.
 */

import { db } from '../../core/supabase.js';
import type { RecordingReview } from './statsTypes.js';
import { parseReview, REVIEW_BODY_MAX } from './statsReviews.js';

const TABLE = 'recording_reviews';

interface DbError { message: string; }

interface ReviewsQuery extends PromiseLike<{ data: unknown; error: DbError | null }> {
    select: (columns?: string) => ReviewsQuery;
    insert: (row: object) => ReviewsQuery;
    update: (row: object) => ReviewsQuery;
    delete: () => ReviewsQuery;
    eq: (column: string, value: string) => ReviewsQuery;
    order: (column: string, opts?: { ascending: boolean }) => ReviewsQuery;
}

function table(): ReviewsQuery {
    return (db as unknown as { from: (name: string) => ReviewsQuery }).from(TABLE);
}

export interface NewReview {
    recording_path: string;
    author: string;
    kind: 'reaction' | 'comment' | 'score';
    emoji?: string;
    score?: number;
    body?: string;
    at_secs?: number | null;
}

/** Every review (two users — the table stays small). Throws if the table is unreachable. */
export async function fetchReviews(): Promise<RecordingReview[]> {
    const { data, error } = await table().select('*').order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (Array.isArray(data) ? data : []).map(parseReview).filter((r): r is RecordingReview => r !== null);
}

export async function addReview(input: NewReview): Promise<RecordingReview> {
    const row = {
        recording_path: input.recording_path,
        author:         input.author,
        kind:           input.kind,
        emoji:          input.kind === 'reaction' ? input.emoji ?? null : null,
        score:          input.kind === 'score' ? input.score ?? null : null,
        body:           input.kind === 'comment' ? (input.body ?? '').slice(0, REVIEW_BODY_MAX) : null,
        at_secs:        input.kind === 'comment' ? input.at_secs ?? null : null,
    };
    const { data, error } = await table().insert(row).select('*');
    if (error) throw new Error(error.message);
    const saved = parseReview(Array.isArray(data) ? data[0] : data);
    if (!saved) throw new Error('Invalid review returned by the server');
    return saved;
}

/** Changes an existing score and returns the stored row. */
export async function updateReviewScore(id: string, score: number): Promise<RecordingReview> {
    const { data, error } = await table().update({ score }).eq('id', id).select('*');
    if (error) throw new Error(error.message);
    const saved = parseReview(Array.isArray(data) ? data[0] : data);
    if (!saved) throw new Error('Invalid review returned by the server');
    return saved;
}

export async function deleteReview(id: string): Promise<void> {
    const { error } = await table().delete().eq('id', id);
    if (error) throw new Error(error.message);
}
