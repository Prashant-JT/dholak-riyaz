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
}

export interface UserStats {
    kpi: { sessions: number; time: string; bpm: number; streak: number; weekStreak: number; maxStreak: number };
    insight: string;
    weekLabels: string[];
    weekly: number[];
    weekDays: number[][];   // 16 weeks × 7 days (Mon-Sun), minutes per day
    bpm: Record<string, number[]>;
    donut: Record<string, number>;
    cycles: number[];
    history: { date: string; dur: string; blocks: string[]; bpm: string; notes: string | null }[];
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

// Made with Bob
