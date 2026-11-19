/**
 * STATS — Recording and review medal data (pure: no DB access, testable)
 * Feeds the "Recordings" medal group in medals.ts.
 */

import type { SupabaseSession, RecordingReview } from './statsTypes.js';

export const REC_ARCHIVE_GOAL = 25;   // takes recorded
export const MENTOR_GOAL      = 25;   // takes of the other person reviewed

export interface RecordingMedalData {
    takes: number;
    firstTakeAt?: string;             // saved_at of the session with the first take
    archiveAt?: string;               // saved_at of the session that reached REC_ARCHIVE_GOAL
    fiveStarsAt?: string;             // created_at of the first 5/5 received
    perfectAt?: string;               // created_at of the first 💯 received
    reviewedTakes: number;            // distinct takes of the other person I reviewed
    mentorAt?: string;                // created_at of the review that reached MENTOR_GOAL
}

/** Recording paths of one session (takes list, or the legacy single path). */
function sessionPaths(s: SupabaseSession): string[] {
    return s.blocks.flatMap(b => {
        if (Array.isArray(b.recordings)) {
            return b.recordings.filter(r => r && typeof r.path === 'string').map(r => r.path);
        }
        return typeof b.recording_path === 'string' ? [b.recording_path] : [];
    });
}

/**
 * @param sessions  the user's sessions (joint takes appear in both users' copies)
 * @param userId    the user the medals are for
 * @param reviews   every review loaded from the table
 */
export function computeRecordingMedalData(
    sessions: SupabaseSession[], userId: string, reviews: RecordingReview[]
): RecordingMedalData {
    const sorted = [...sessions].sort((a, b) => a.saved_at.localeCompare(b.saved_at));
    const myPaths = new Set<string>();
    let firstTakeAt: string | undefined;
    let archiveAt: string | undefined;
    for (const s of sorted) {
        sessionPaths(s).forEach(p => myPaths.add(p));
        if (!firstTakeAt && myPaths.size >= 1) firstTakeAt = s.saved_at;
        if (!archiveAt && myPaths.size >= REC_ARCHIVE_GOAL) archiveAt = s.saved_at;
    }

    const byTime = [...reviews].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
    const received = byTime.filter(r => r.author !== userId && myPaths.has(r.recording_path));
    const fiveStarsAt = received.find(r => r.kind === 'score' && r.score === 5)?.created_at;
    const perfectAt   = received.find(r => r.kind === 'reaction' && r.emoji === '💯')?.created_at;

    // Giving: distinct takes of the other person I reviewed (any reaction, score or comment)
    const reviewed = new Set<string>();
    let mentorAt: string | undefined;
    byTime.forEach(r => {
        if (r.author !== userId || myPaths.has(r.recording_path)) return;
        reviewed.add(r.recording_path);
        if (!mentorAt && reviewed.size >= MENTOR_GOAL) mentorAt = r.created_at;
    });

    return { takes: myPaths.size, firstTakeAt, archiveAt, fiveStarsAt, perfectAt, reviewedTakes: reviewed.size, mentorAt };
}
