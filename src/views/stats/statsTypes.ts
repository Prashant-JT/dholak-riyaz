/**
 * STATS — Type definitions
 * Database record shapes (Supabase) and computed stats structures.
 */

export interface SupabaseSession {
    id: string;
    user_id: string;
    saved_at: string;       // ISO 8601
    total_secs: number;
    notes: string | null;
    blocks: SupabaseBlock[];
}

export interface SupabaseBlock {
    type: 'warmup' | 'practice' | 'pickup';
    taal_name?: string;
    variation_name?: string;
    kayda_name?: string;
    support_type?: string;
    support_ref?: string;
    bpm_start?: number;
    bpm_end?: number;
    duration_secs?: number;
    cycles_completed?: number;
    pickup_name?: string;
    pickup_taal?: string;
    recording_path?: string;   // legacy (v2.4.0): single recording path in the 'recordings' bucket
    recordings?: { path: string; label?: string }[];   // takes in the 'recordings' bucket
    note?: string;             // per-block comment
}

export interface UserStats {
    kpi: { sessions: number; time: string; bpm: number; streak: number; weekStreak: number; maxStreak: number };
    insight: string;
    weekLabels: string[];
    weekly: number[];
    weekDays: number[][];   // 16 weeks × 7 days (Mon-Sun), minutes per day
    monthLabels: string[];  // 12 month labels
    monthly: number[];      // 12 months × total minutes
    bpm: Record<string, number[]>;
    donut: Record<string, number>;
    cycles: number[];
    heatmap: { label: string; days: number[] }[];
    rawSessions: SupabaseSession[];
}

export interface Medal {
    id: string;
    emoji: string;
    name: string;
    desc: string;
    earned: boolean;
    earnedAt?: string;
    progress?: string;
    progressPct?: number;
}

/** One reaction, comment or score on a recording take (table 'recording_reviews'). */
export interface RecordingReview {
    id: string;
    recording_path: string;     // same path as in block.recordings[] — shared by joint session copies
    author: string;             // 'prashant' | 'meera'
    kind: 'reaction' | 'comment' | 'score';
    emoji: string | null;       // reactions only
    score: number | null;       // scores only: 1..REVIEW_SCORE_MAX
    body: string | null;        // comments only
    at_secs: number | null;     // comments only: second of the take the comment points to
    created_at: string;         // ISO 8601, set by the server
}

/** Reviews loaded for one Stats visit. */
export interface ReviewStore {
    enabled: boolean;                       // false when the table is missing or unreachable
    items: RecordingReview[];
    seenAt: Record<string, string | null>;  // per reviewer: last review already seen on this device
}
