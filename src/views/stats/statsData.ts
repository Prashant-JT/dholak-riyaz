/**
 * STATS — Data layer
 * Supabase fetch, data transformation, timezone helpers, and empty-state factory.
 */

import { db } from '../../core/supabase.js';
import { TAALS } from '../../data/taals/index.js';
import { CONFIG } from '../../core/config.js';
import { t, tArray, getLang } from '../../i18n/index.js';
import type { SupabaseSession, UserStats } from './statsTypes.js';

// ── Active taal IDs ───────────────────────────────────────────────────────────

export const ACTIVE_TAAL_IDS: string[] = CONFIG.NAVIGATION
    .map(item => item.id)
    .filter(id => id in TAALS);

// ── Timezone helpers (Gran Canaria) ──────────────────────────────────────────

const GC_TZ = CONFIG.TIMEZONE;

/** Returns 'YYYY-MM-DD' in Canary Island time from a UTC ISO string. */
export function gcDateStr(iso: string): string {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: GC_TZ }).format(new Date(iso));
}

/** Returns 'YYYY-MM-DD' for today in Canary Island time. */
export function gcTodayStr(): string {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: GC_TZ }).format(new Date());
}

/** Returns the ISO Monday of the week ('YYYY-MM-DD') for a given date string. */
export function gcMondayStr(isoDate: string): string {
    const d = new Date(isoDate + 'T00:00:00Z');
    const dow = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1));
    return d.toISOString().slice(0, 10);
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function fetchUserStats(userId: string): Promise<UserStats> {
    // Supabase v2: QueryBuilder is a PromiseLike — direct await is correct
    const { data, error } = await db
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('saved_at', { ascending: true });

    if (error) throw error;
    return transformSessionsToStats((data as SupabaseSession[]) ?? []);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Computes the real seconds for a session.
 * Uses the sum of blocks[].duration_secs as the source of truth
 * (so manual edits to the Supabase JSON are reflected),
 * and falls back to total_secs only if blocks have no recorded duration.
 */
export function effectiveSecs(s: SupabaseSession): number {
    const fromBlocks = s.blocks.reduce((sum, b) => sum + (b.duration_secs ?? 0), 0);
    return fromBlocks > 0 ? fromBlocks : s.total_secs;
}

// ── Data transformation ───────────────────────────────────────────────────────

export function transformSessionsToStats(sessions: SupabaseSession[]): UserStats {
    const now   = new Date();
    const MS_WEEK = 7 * 24 * 60 * 60 * 1000;

    // ── Last 16 weeks from today ──────────────────────────────────────────────
    const weekStarts: Date[] = [];
    for (let i = 15; i >= 0; i--) {
        const d = new Date(now.getTime() - i * MS_WEEK);
        // Monday of that week
        const day = d.getDay();
        const diff = (day === 0 ? -6 : 1 - day);
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        weekStarts.push(d);
    }

    const MONTH_SHORT = tArray('stats.monthsShort');
    const weekLabels = weekStarts.map(d => `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`);

    // ── Session → week index ──────────────────────────────────────────────────
    const getWeekIdx = (isoDate: string): number => {
        const d = new Date(isoDate);
        for (let i = weekStarts.length - 1; i >= 0; i--) {
            const end = new Date(weekStarts[i].getTime() + MS_WEEK);
            if (d >= weekStarts[i] && d < end) return i;
        }
        return -1;
    };

    // ── Weekly minutes + daily breakdown (Mon=0 … Sun=6) ─────────────────────
    const weekly  = new Array(16).fill(0);
    const weekDays: number[][] = Array.from({ length: 16 }, () => new Array(7).fill(0));
    sessions.forEach(s => {
        const idx = getWeekIdx(s.saved_at);
        if (idx < 0) return;
        const mins = Math.round(effectiveSecs(s) / 60);
        weekly[idx] += mins;
        // Day of week normalised to Mon=0 … Sun=6
        const dow = new Date(gcDateStr(s.saved_at) + 'T12:00:00Z').getUTCDay();
        const dayIdx = dow === 0 ? 6 : dow - 1;
        weekDays[idx][dayIdx] += mins;
    });

    // ── Max BPM per taal per week ─────────────────────────────────────────────
    const bpmMap: Record<string, number[]> = {};
    sessions.forEach(s => {
        const idx = getWeekIdx(s.saved_at);
        if (idx < 0) return;
        s.blocks.forEach(b => {
            if (b.type === 'practice' && b.taal_name && b.bpm_end) {
                if (!bpmMap[b.taal_name]) bpmMap[b.taal_name] = new Array(16).fill(null);
                const cur = bpmMap[b.taal_name][idx];
                if (cur === null || b.bpm_end > cur) bpmMap[b.taal_name][idx] = b.bpm_end;
            }
        });
    });
    // Fill nulls with the last known value (carry-forward)
    Object.values(bpmMap).forEach(arr => {
        let last: number | null = null;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] !== null) { last = arr[i]; }
            else if (last !== null) { arr[i] = last; }
        }
        // Remove leading nulls using the first found value (carry-back)
        let first: number | null = null;
        for (let i = 0; i < arr.length; i++) { if (arr[i] !== null) { first = arr[i]; break; } }
        for (let i = 0; i < arr.length; i++) { if (arr[i] === null) arr[i] = first ?? 0; }
    });

    // ── Donut: seconds per taal ───────────────────────────────────────────────
    const donutSecs: Record<string, number> = {};
    sessions.forEach(s => {
        s.blocks.forEach(b => {
            const key = b.type === 'warmup'
                ? 'Warm Up'
                : b.type === 'pickup'
                    ? 'Pickups'
                    : (b.taal_name ?? t('stats.chartOther'));
            donutSecs[key] = (donutSecs[key] ?? 0) + (b.duration_secs ?? 0);
        });
    });
    const totalDonutSecs = Object.values(donutSecs).reduce((a, b) => a + b, 0);
    const donut: Record<string, number> = {};
    Object.entries(donutSecs).forEach(([k, v]) => {
        donut[k] = totalDonutSecs > 0 ? Math.round((v / totalDonutSecs) * 100) : 0;
    });

    // ── Cycles: last 20 sessions with metronome ───────────────────────────────
    const metroSessions = [...sessions]
        .reverse()
        .filter(s => s.blocks.some(b => b.support_type === 'metronome' && b.cycles_completed))
        .slice(0, 20)
        .reverse();
    const cycles = metroSessions.map(s =>
        s.blocks.filter(b => b.support_type === 'metronome')
                .reduce((sum, b) => sum + (b.cycles_completed ?? 0), 0)
    );

    // ── History: last 10 sessions ─────────────────────────────────────────────
    const recentSessions = [...sessions].reverse().slice(0, 10);
    const history = recentSessions.map(s => {
        const gcStr = gcDateStr(s.saved_at);
        const d = new Date(gcStr + 'T12:00:00Z');
        const date = `${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
        const dur  = `${Math.round(effectiveSecs(s) / 60)} min`;
        const blocks = s.blocks.map(b =>
            b.type === 'warmup'
                ? t('stats.historyWarmUp')
                : b.type === 'pickup'
                    ? t('stats.historyPickup')
                    : (b.taal_name ?? t('stats.historyPractice'))
        );
        const maxBpm = s.blocks
            .filter(b => b.bpm_end)
            .reduce((max, b) => Math.max(max, b.bpm_end ?? 0), 0);
        return {
            date,
            dur,
            blocks,
            bpm: maxBpm > 0 ? String(maxBpm) : '—',
            notes: s.notes ?? null,
        };
    });

    // ── Monthly minutes: last 12 months ──────────────────────────────────────
    const MONTH_SHORT_M = tArray('stats.monthsShort');
    const gcNowForMonths = gcTodayStr();
    const refYearM  = parseInt(gcNowForMonths.slice(0, 4));
    const refMonthM = parseInt(gcNowForMonths.slice(5, 7)) - 1; // 0-based
    const monthly: number[] = new Array(12).fill(0);
    const monthLabels: string[] = [];
    for (let i = 11; i >= 0; i--) {
        let m = refMonthM - i;
        let y = refYearM;
        if (m < 0) { m += 12; y -= 1; }
        monthLabels.push(`${MONTH_SHORT_M[m]} ${y}`);
    }
    sessions.forEach(s => {
        const sd = new Date(gcDateStr(s.saved_at) + 'T12:00:00Z');
        const sy = sd.getUTCFullYear();
        const sm = sd.getUTCMonth(); // 0-based
        for (let i = 11; i >= 0; i--) {
            let tm = refMonthM - i;
            let ty = refYearM;
            if (tm < 0) { tm += 12; ty -= 1; }
            if (sy === ty && sm === tm) {
                monthly[11 - i] += Math.round(effectiveSecs(s) / 60);
                break;
            }
        }
    });

    // ── Heatmap: last 4 months ────────────────────────────────────────────────
    const heatmap: { label: string; days: number[] }[] = [];
    const MONTH_FULL = tArray('stats.monthsFull');
    for (let m = 3; m >= 0; m--) {
        const gcNow = gcTodayStr();
        const refYear  = parseInt(gcNow.slice(0, 4));
        const refMonth = parseInt(gcNow.slice(5, 7)) - 1 - m;
        const ref = new Date(Date.UTC(refYear, refMonth, 1));
        const daysInMonth = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0)).getUTCDate();
        const days = new Array(daysInMonth).fill(0);

        sessions.forEach(s => {
            const sd = new Date(gcDateStr(s.saved_at) + 'T12:00:00Z');
            if (sd.getUTCFullYear() === ref.getUTCFullYear() && sd.getUTCMonth() === ref.getUTCMonth()) {
                const dayIdx = sd.getUTCDate() - 1;
                const mins = Math.round(effectiveSecs(s) / 60);
                const level = mins >= 60 ? 4 : mins >= 30 ? 3 : mins >= 15 ? 2 : mins >= 1 ? 1 : effectiveSecs(s) > 0 ? 1 : 0;
                days[dayIdx] = Math.min(4, days[dayIdx] + level);
            }
        });

        heatmap.push({
            label: MONTH_FULL[ref.getUTCMonth()] ?? ref.toLocaleDateString(
                getLang() === 'en' ? 'en-GB' : 'es-ES',
                { timeZone: 'UTC', month: 'long' }
            ),
            days,
        });
    }

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const totalSecs = sessions.reduce((sum, s) => sum + effectiveSecs(s), 0);
    const totalMins = Math.round(totalSecs / 60);
    const timeStr = totalMins >= 60
        ? `${Math.floor(totalMins / 60)}h ${totalMins % 60 > 0 ? (totalMins % 60) + 'm' : ''}`.trim()
        : `${totalMins}m`;

    const allBpms = sessions.flatMap(s => s.blocks.map(b => b.bpm_end ?? 0));
    const maxBpm = allBpms.length > 0 ? Math.max(...allBpms) : 0;

    // Daily streak — all session dates in Canary Island time
    const todayGC = gcTodayStr();
    const sessionDaysSet = new Set(sessions.map(s => gcDateStr(s.saved_at)));
    const allDaysKpi = Array.from(sessionDaysSet).sort();
    let streak = 0; let maxStreak = 0;
    if (allDaysKpi.length > 0) {
        let s = 1;
        for (let i = allDaysKpi.length - 1; i > 0; i--) {
            const curr = new Date(allDaysKpi[i] + 'T00:00:00Z');
            const prev = new Date(allDaysKpi[i - 1] + 'T00:00:00Z');
            const diff = (curr.getTime() - prev.getTime()) / 86400000;
            if (diff === 1) s++; else break;
        }
        const lastDay  = new Date(allDaysKpi[allDaysKpi.length - 1] + 'T00:00:00Z');
        const todayDay = new Date(todayGC + 'T00:00:00Z');
        const diffToToday = Math.round((todayDay.getTime() - lastDay.getTime()) / 86400000);
        streak = diffToToday <= 1 ? s : 0;
        // Max historical streak
        let cur = 1;
        for (let i = 1; i < allDaysKpi.length; i++) {
            const diff = (new Date(allDaysKpi[i] + 'T00:00:00Z').getTime() - new Date(allDaysKpi[i-1] + 'T00:00:00Z').getTime()) / 86400000;
            cur = diff === 1 ? cur + 1 : 1;
            if (cur > maxStreak) maxStreak = cur;
        }
        if (allDaysKpi.length === 1) maxStreak = 1;
    }

    // Weekly streak — ISO weeks in Canary Island time
    const sessionWeeksArr = Array.from(new Set(sessions.map(s => gcMondayStr(gcDateStr(s.saved_at))))).sort();
    let weekStreak = 0;
    if (sessionWeeksArr.length > 0) {
        let ws = 1;
        for (let i = sessionWeeksArr.length - 1; i > 0; i--) {
            const prev = new Date(sessionWeeksArr[i - 1] + 'T00:00:00Z');
            prev.setUTCDate(prev.getUTCDate() + 7);
            if (prev.toISOString().slice(0, 10) === sessionWeeksArr[i]) ws++; else break;
        }
        const lastWeek   = new Date(sessionWeeksArr[sessionWeeksArr.length - 1] + 'T00:00:00Z');
        const todayDay2  = new Date(todayGC + 'T00:00:00Z');
        const todayDow   = todayDay2.getUTCDay();
        const thisMonday = new Date(todayDay2);
        thisMonday.setUTCDate(todayDay2.getUTCDate() - (todayDow === 0 ? 6 : todayDow - 1));
        weekStreak = lastWeek.toISOString().slice(0, 10) === thisMonday.toISOString().slice(0, 10) ? ws : 0;
    }

    // ── Automatic insight ─────────────────────────────────────────────────────
    const taalOnlyEntries = Object.entries(donutSecs).filter(([k]) => !k.startsWith('Warm Up') && !k.startsWith('Pickup'));
    const topTaal   = taalOnlyEntries.reduce((best, cur) => cur[1] > best[1] ? cur : best, taalOnlyEntries[0] ?? ['—', 0])[0];
    const leastTaal = taalOnlyEntries.reduce((worst, cur) => cur[1] < worst[1] ? cur : worst, taalOnlyEntries[0] ?? ['—', 0])[0];
    const insight = sessions.length === 0
        ? t('stats.insightNoSessions')
        : taalOnlyEntries.length <= 1
            ? t('stats.insightOneTaal', topTaal)
            : t('stats.insightMultiTaal', topTaal, leastTaal);

    return {
        kpi: { sessions: sessions.length, time: timeStr, bpm: maxBpm, streak, weekStreak, maxStreak },
        insight,
        weekLabels,
        weekly,
        weekDays,
        monthLabels,
        monthly,
        bpm: bpmMap,
        donut,
        cycles,
        history,
        heatmap,
        rawSessions: sessions,
    };
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function emptyStats(): UserStats {
    const now = new Date();
    const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
    const MONTH_SHORT = tArray('stats.monthsShort');
    const weekLabels: string[] = [];
    for (let i = 15; i >= 0; i--) {
        const d = new Date(now.getTime() - i * MS_WEEK);
        weekLabels.push(`${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`);
    }
    const refM = now.getMonth();
    const refY = now.getFullYear();
    const monthLabels: string[] = [];
    for (let i = 11; i >= 0; i--) {
        let m = refM - i; let y = refY;
        if (m < 0) { m += 12; y -= 1; }
        monthLabels.push(`${MONTH_SHORT[m]} ${y}`);
    }
    return {
        kpi: { sessions: 0, time: '0m', bpm: 0, streak: 0, weekStreak: 0, maxStreak: 0 },
        insight: t('stats.insightNoSessions'),
        weekLabels,
        weekly:      new Array(16).fill(0),
        weekDays:    Array.from({ length: 16 }, () => new Array(7).fill(0)),
        monthLabels,
        monthly:     new Array(12).fill(0),
        bpm:         {},
        donut:       {},
        cycles:      [],
        history:     [],
        heatmap:     [],
        rawSessions: [],
    };
}

// Made with Bob
