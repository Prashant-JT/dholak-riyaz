/**
 * STATS VIEW
 * Vista de estadísticas de práctica con gráficas Chart.js.
 * Conectado a Supabase — datos reales de sesiones guardadas.
 */

import { db } from '../core/supabase.js';
import { createElement } from '../core/utils.js';
import { TAALS } from '../data/taals/index.js';
import { CONFIG } from '../core/config.js';
import { t, tArray, getLang } from '../i18n/index.js';
import type { View } from '../types.js';

// IDs de taals activos (misma fuente de verdad que el Riyaz)
const ACTIVE_TAAL_IDS: string[] = CONFIG.NAVIGATION
    .map(item => item.id)
    .filter(id => id in TAALS);

// Metadatos visuales por taal: emoji y clase CSS de color para tags/medallas
const TAAL_META: Record<string, { emoji: string; tagCls: string }> = {
    keherwa:    { emoji: '🔔', tagCls: 'stats-tag--orange'  },
    dadra:      { emoji: '🌀', tagCls: 'stats-tag--blue'    },
    rupak:      { emoji: '🎭', tagCls: 'stats-tag--purple'  },
    deepchandi: { emoji: '🌊', tagCls: 'stats-tag--teal'    },
    addha:      { emoji: '🥁', tagCls: 'stats-tag--amber'   },
    teental:    { emoji: '👑', tagCls: 'stats-tag--blue'    },
    ektal:      { emoji: '🔁', tagCls: 'stats-tag--purple'  },
    jhaptal:    { emoji: '⚡', tagCls: 'stats-tag--teal'    },
};
// Fallback para taals futuros sin metadatos definidos
const DEFAULT_TAAL_META = { emoji: '🎵', tagCls: 'stats-tag--orange' };

// ── Timezone Gran Canaria ──────────────────────────────────────────────────────
const GC_TZ = CONFIG.TIMEZONE;

/** Devuelve 'YYYY-MM-DD' en hora canaria a partir de un ISO string UTC */
function gcDateStr(iso: string): string {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: GC_TZ }).format(new Date(iso));
}

/** Devuelve 'YYYY-MM-DD' de hoy en hora canaria */
function gcTodayStr(): string {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: GC_TZ }).format(new Date());
}

/** Devuelve el lunes de la semana ISO (YYYY-MM-DD) en hora canaria */
function gcMondayStr(isoDate: string): string {
    const d = new Date(isoDate + 'T00:00:00Z');
    const dow = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1));
    return d.toISOString().slice(0, 10);
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

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

interface UserStats {
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
    rawSessions: SupabaseSession[];   // todas las sesiones, para filtrado client-side
}

// ── Fetch from Supabase ──────────────────────────────────────────────────────

async function fetchUserStats(userId: string): Promise<UserStats> {
    // Supabase v2: QueryBuilder is a PromiseLike — direct await is correct
    const { data, error } = await db
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('saved_at', { ascending: true });

    if (error) throw error;
    return transformSessionsToStats((data as SupabaseSession[]) ?? []);
}

// ── Data transformation ───────────────────────────────────────────────────────

/**
 * Computes the real seconds for a session.
 * Uses the sum of blocks[].duration_secs as the source of truth
 * (so manual edits to the Supabase JSON are reflected),
 * and falls back to total_secs only if blocks have no recorded duration.
 */
function effectiveSecs(s: SupabaseSession): number {
    const fromBlocks = s.blocks.reduce((sum, b) => sum + (b.duration_secs ?? 0), 0);
    return fromBlocks > 0 ? fromBlocks : s.total_secs;
}

function transformSessionsToStats(sessions: SupabaseSession[]): UserStats {
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

    // ── Donut: segundos por taal ──────────────────────────────────────────────
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
        const gcStr = gcDateStr(s.saved_at);   // 'YYYY-MM-DD' in Canary time
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

        heatmap.push({ label: MONTH_FULL[ref.getUTCMonth()] ?? ref.toLocaleDateString(getLang() === 'en' ? 'en-GB' : 'es-ES', { timeZone: 'UTC', month: 'long' }), days });
    }

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const totalSecs = sessions.reduce((sum, s) => sum + effectiveSecs(s), 0);
    const totalMins = Math.round(totalSecs / 60);
    const timeStr = totalMins >= 60
        ? `${Math.floor(totalMins / 60)}h ${totalMins % 60 > 0 ? (totalMins % 60) + 'm' : ''}`.trim()
        : `${totalMins}m`;

    const allBpms = sessions.flatMap(s => s.blocks.map(b => b.bpm_end ?? 0));
    const maxBpm = allBpms.length > 0 ? Math.max(...allBpms) : 0;

    // Racha diaria — todas las fechas en hora canaria
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

    // Racha semanal — semanas ISO en hora canaria
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
        bpm: bpmMap,
        donut,
        cycles,
        history,
        heatmap,
        rawSessions: sessions,
    };
}

// ── Empty state for when there is no data ────────────────────────────────────

function emptyStats(): UserStats {
    const now = new Date();
    const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
    const MONTH_SHORT = tArray('stats.monthsShort');
    const weekLabels: string[] = [];
    for (let i = 15; i >= 0; i--) {
        const d = new Date(now.getTime() - i * MS_WEEK);
        weekLabels.push(`${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`);
    }
    return {
        kpi: { sessions: 0, time: '0m', bpm: 0, streak: 0, weekStreak: 0, maxStreak: 0 },
        insight: t('stats.insightNoSessions'),
        weekLabels,
        weekly:      new Array(16).fill(0),
        weekDays:    Array.from({ length: 16 }, () => new Array(7).fill(0)),
        bpm:         {},
        donut:       {},
        cycles:      [],
        history:     [],
        heatmap:     [],
        rawSessions: [],
    };
}

// ── Chart.js ──────────────────────────────────────────────────────────────────
declare const Chart: any;

// ── Colores ───────────────────────────────────────────────────────────────────
const C = {
    orange:  '#f97316',
    orangeA: 'rgba(249,115,22,0.7)',
    blue:    '#3b82f6',
    blueA:   'rgba(59,130,246,0.7)',
    purple:  '#8b5cf6',
    purpleA: 'rgba(139,92,246,0.7)',
    teal:    '#14b8a6',
    tealA:   'rgba(20,184,166,0.7)',
    amber:   '#f59e0b',
    grid:    () => getComputedStyle(document.documentElement).getPropertyValue('--border-primary').trim() || '#e2e8f0',
    text:    () => getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim()    || '#64748b',
    card:    () => getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim()       || '#ffffff',
};

const BPM_PALETTE = [
    { line: C.orange, bg: C.orangeA },
    { line: C.blue,   bg: C.blueA   },
    { line: C.purple, bg: C.purpleA },
    { line: C.teal,   bg: C.tealA   },
];

// ── Medallas ──────────────────────────────────────────────────────────────────

interface Medal {
    id: string;
    emoji: string;
    name: string;
    desc: string;
    earned: boolean;
    earnedAt?: string;
    progress?: string;
    progressPct?: number;
}

function computeMedals(sessions: SupabaseSession[], otherSessions: SupabaseSession[] = []): Medal[] {
    const MONTH_SHORT = tArray('stats.monthsShort');
    const fmt = (iso: string) => { const d = new Date(iso); return `${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

    const sorted = [...sessions].sort((a, b) => a.saved_at.localeCompare(b.saved_at));

    const totalMins = Math.round(sorted.reduce((s, x) => s + effectiveSecs(x), 0) / 60);
    const totalSessions = sorted.length;

    const allDayStrs = Array.from(new Set(sorted.map(s => gcDateStr(s.saved_at)))).sort();
    const allDays = allDayStrs.map(d => new Date(d + 'T00:00:00Z'));
    let maxStreak = 0; let curStreak = 0;
    for (let i = 0; i < allDays.length; i++) {
        if (i === 0) { curStreak = 1; }
        else {
            const diff = (allDays[i].getTime() - allDays[i-1].getTime()) / 86400000;
            curStreak = diff === 1 ? curStreak + 1 : 1;
        }
        if (curStreak > maxStreak) maxStreak = curStreak;
    }

    const sessionWeeks = Array.from(new Set(sorted.map(s => gcMondayStr(gcDateStr(s.saved_at))))).sort();
    let maxWeekStreak = 0; let curWStreak = 0;
    for (let i = 0; i < sessionWeeks.length; i++) {
        if (i === 0) { curWStreak = 1; }
        else {
            const prev = new Date(sessionWeeks[i-1] + 'T00:00:00Z'); prev.setUTCDate(prev.getUTCDate() + 7);
            curWStreak = prev.toISOString().slice(0,10) === sessionWeeks[i] ? curWStreak + 1 : 1;
        }
        if (curWStreak > maxWeekStreak) maxWeekStreak = curWStreak;
    }

    const taalsSet = new Set(sorted.flatMap(s => s.blocks.filter(b => b.type === 'practice' && b.taal_name).map(b => b.taal_name!)));
    const ALL_ACTIVE_TAAL_NAMES = ACTIVE_TAAL_IDS.map(id => TAALS[id].name);
    const hasAllActive = ALL_ACTIVE_TAAL_NAMES.every(tn => taalsSet.has(tn));
    const firstSessionByTaal: Record<string, string | undefined> = {};
    ACTIVE_TAAL_IDS.forEach(id => {
        const taalName = TAALS[id].name;
        firstSessionByTaal[id] = sorted.find(s =>
            s.blocks.some(b => b.type === 'practice' && b.taal_name === taalName)
        )?.saved_at;
    });

    const songSessions = sorted.filter(s => s.blocks.some(b => b.support_type === 'song'));
    const maxBpm = sorted.reduce((mx, s) => Math.max(mx, ...s.blocks.map(b => b.bpm_end ?? 0)), 0);
    const maxSessionMins = sorted.reduce((mx, s) => Math.max(mx, Math.round(effectiveSecs(s) / 60)), 0);

    const firstSession    = sorted[0]?.saved_at;
    const firstHourSession = sorted.find((_, i) => Math.round(sorted.slice(0, i+1).reduce((s,x) => s+effectiveSecs(x),0)/60) >= 60)?.saved_at;
    const first10hSession  = sorted.find((_, i) => Math.round(sorted.slice(0, i+1).reduce((s,x) => s+effectiveSecs(x),0)/60) >= 600)?.saved_at;
    const first50hSession  = sorted.find((_, i) => Math.round(sorted.slice(0, i+1).reduce((s,x) => s+effectiveSecs(x),0)/60) >= 3000)?.saved_at;
    const first100hSession = sorted.find((_, i) => Math.round(sorted.slice(0, i+1).reduce((s,x) => s+effectiveSecs(x),0)/60) >= 6000)?.saved_at;
    const longSession      = sorted.find(s => Math.round(effectiveSecs(s)/60) >= 60)?.saved_at;
    const marathonSession  = sorted.find(s => Math.round(effectiveSecs(s)/60) >= 90)?.saved_at;
    const streak7Session   = (() => { let c = 0; for (let i=0;i<allDays.length;i++) { c = i===0?1:(allDays[i].getTime()-allDays[i-1].getTime())/86400000===1?c+1:1; if (c>=7)   return sorted.find(s => gcDateStr(s.saved_at)===allDayStrs[i])?.saved_at; } return undefined; })();
    const streak30Session  = (() => { let c = 0; for (let i=0;i<allDays.length;i++) { c = i===0?1:(allDays[i].getTime()-allDays[i-1].getTime())/86400000===1?c+1:1; if (c>=30)  return sorted.find(s => gcDateStr(s.saved_at)===allDayStrs[i])?.saved_at; } return undefined; })();
    const streak60Session  = (() => { let c = 0; for (let i=0;i<allDays.length;i++) { c = i===0?1:(allDays[i].getTime()-allDays[i-1].getTime())/86400000===1?c+1:1; if (c>=60)  return sorted.find(s => gcDateStr(s.saved_at)===allDayStrs[i])?.saved_at; } return undefined; })();
    const streak100Session = (() => { let c = 0; for (let i=0;i<allDays.length;i++) { c = i===0?1:(allDays[i].getTime()-allDays[i-1].getTime())/86400000===1?c+1:1; if (c>=100) return sorted.find(s => gcDateStr(s.saved_at)===allDayStrs[i])?.saved_at; } return undefined; })();
    const streak365Session = (() => { let c = 0; for (let i=0;i<allDays.length;i++) { c = i===0?1:(allDays[i].getTime()-allDays[i-1].getTime())/86400000===1?c+1:1; if (c>=365) return sorted.find(s => gcDateStr(s.saved_at)===allDayStrs[i])?.saved_at; } return undefined; })();
    const week4Session     = (() => { let c = 0; for (let i=0;i<sessionWeeks.length;i++) { c = i===0?1:(()=>{const p=new Date(sessionWeeks[i-1]+'T00:00:00Z'); p.setUTCDate(p.getUTCDate()+7); return p.toISOString().slice(0,10)===sessionWeeks[i]?c+1:1;})(); if (c>=4)  return sorted.find(s => gcMondayStr(gcDateStr(s.saved_at))===sessionWeeks[i])?.saved_at; } return undefined; })();
    const bpm120Session    = sorted.find(s => s.blocks.some(b => (b.bpm_end ?? 0) >= 120))?.saved_at;
    const bpm180Session    = sorted.find(s => s.blocks.some(b => (b.bpm_end ?? 0) >= 180))?.saved_at;
    const bpm60Session     = sorted.find(s => s.blocks.some(b => b.support_type === 'metronome' && (b.bpm_start ?? 0) <= 60))?.saved_at;
    const explorer3Session = (() => { const seen = new Set<string>(); for (const s of sorted) { s.blocks.forEach(b => { if (b.type==='practice'&&b.taal_name) seen.add(b.taal_name); }); if (seen.size >= 3) return s.saved_at; } return undefined; })();
    const allActiveSession = (() => { const seen = new Set<string>(); for (const s of sorted) { s.blocks.forEach(b => { if (b.type==='practice'&&b.taal_name) seen.add(b.taal_name); }); if (ALL_ACTIVE_TAAL_NAMES.every(tn => seen.has(tn))) return s.saved_at; } return undefined; })();
    const song5Session     = (() => { let c=0; for (const s of sorted) { if (s.blocks.some(b=>b.support_type==='song')) { c++; if (c>=5) return s.saved_at; } } return undefined; })();
    const session5At       = sorted[4]?.saved_at;
    const session10At      = sorted[9]?.saved_at;
    const session15At      = sorted[14]?.saved_at;
    const session25At      = sorted[24]?.saved_at;
    const session50At      = sorted[49]?.saved_at;
    const session100At     = sorted[99]?.saved_at;
    const first3hSession   = sorted.find((_, i) => Math.round(sorted.slice(0, i+1).reduce((s,x) => s+effectiveSecs(x),0)/60) >= 180)?.saved_at;
    const first5hSession   = sorted.find((_, i) => Math.round(sorted.slice(0, i+1).reduce((s,x) => s+effectiveSecs(x),0)/60) >= 300)?.saved_at;
    const first25hSession  = sorted.find((_, i) => Math.round(sorted.slice(0, i+1).reduce((s,x) => s+effectiveSecs(x),0)/60) >= 1500)?.saved_at;
    const streak14Session  = (() => { let c = 0; for (let i=0;i<allDays.length;i++) { c = i===0?1:(allDays[i].getTime()-allDays[i-1].getTime())/86400000===1?c+1:1; if (c>=14)  return sorted.find(s => gcDateStr(s.saved_at)===allDayStrs[i])?.saved_at; } return undefined; })();
    const week8Session     = (() => { let c = 0; for (let i=0;i<sessionWeeks.length;i++) { c = i===0?1:(()=>{const p=new Date(sessionWeeks[i-1]+'T00:00:00Z'); p.setUTCDate(p.getUTCDate()+7); return p.toISOString().slice(0,10)===sessionWeeks[i]?c+1:1;})(); if (c>=8)  return sorted.find(s => gcMondayStr(gcDateStr(s.saved_at))===sessionWeeks[i])?.saved_at; } return undefined; })();
    const week12Session    = (() => { let c = 0; for (let i=0;i<sessionWeeks.length;i++) { c = i===0?1:(()=>{const p=new Date(sessionWeeks[i-1]+'T00:00:00Z'); p.setUTCDate(p.getUTCDate()+7); return p.toISOString().slice(0,10)===sessionWeeks[i]?c+1:1;})(); if (c>=12) return sorted.find(s => gcMondayStr(gcDateStr(s.saved_at))===sessionWeeks[i])?.saved_at; } return undefined; })();

    const mk = (id: string, emoji: string, name: string, desc: string, cond: boolean, when?: string, progress?: string, progressPct?: number): Medal => ({
        id, emoji, name, desc,
        earned: cond,
        earnedAt: cond && when ? fmt(when) : undefined,
        progress: cond ? undefined : progress,
        progressPct: cond ? undefined : progressPct,
    });

    const currentStreak = allDays.length > 0 ? (() => {
        let s = 1;
        for (let i = allDays.length - 1; i > 0; i--) {
            const diff = (allDays[i].getTime() - allDays[i-1].getTime()) / 86400000;
            if (diff === 1) s++; else break;
        }
        const last     = allDays[allDays.length - 1];
        const todayDay = new Date(gcTodayStr() + 'T00:00:00Z');
        const diffToToday = Math.round((todayDay.getTime() - last.getTime()) / 86400000);
        return diffToToday <= 1 ? s : 0;
    })() : 0;

    const currentWeekStreak = sessionWeeks.length > 0 ? (() => {
        let s = 1;
        for (let i = sessionWeeks.length - 1; i > 0; i--) {
            const prev = new Date(sessionWeeks[i-1] + 'T00:00:00Z'); prev.setUTCDate(prev.getUTCDate() + 7);
            if (prev.toISOString().slice(0,10) === sessionWeeks[i]) s++; else break;
        }
        const lastWeek   = new Date(sessionWeeks[sessionWeeks.length - 1] + 'T00:00:00Z');
        const todayGC2   = gcTodayStr();
        const todayD     = new Date(todayGC2 + 'T00:00:00Z');
        const dow2       = todayD.getUTCDay();
        const thisMonday = new Date(todayD); thisMonday.setUTCDate(todayD.getUTCDate() - (dow2 === 0 ? 6 : dow2 - 1));
        return lastWeek.toISOString().slice(0,10) === thisMonday.toISOString().slice(0,10) ? s : 0;
    })() : 0;

    return [
        mk('first',     '🌱', t('stats.medalFirst.name'),    t('stats.medalFirst.desc'),    totalSessions >= 1,   firstSession),
        mk('s5',        '⭐', t('stats.medalS5.name'),        t('stats.medalS5.desc'),        totalSessions >= 5,   session5At,
            t('stats.medalProgSessions', totalSessions, 5), Math.min(100, Math.round((totalSessions / 5) * 100))),
        mk('s10',       '🎯', t('stats.medalS10.name'),       t('stats.medalS10.desc'),       totalSessions >= 10,  session10At,
            t('stats.medalProgSessions', totalSessions, 10), Math.min(100, Math.round((totalSessions / 10) * 100))),
        mk('s15',       '🥉', t('stats.medalS15.name'),       t('stats.medalS15.desc'),       totalSessions >= 15,  session15At,
            t('stats.medalProgSessions', totalSessions, 15), Math.min(100, Math.round((totalSessions / 15) * 100))),
        mk('s25',       '🥈', t('stats.medalS25.name'),       t('stats.medalS25.desc'),       totalSessions >= 25,  session25At,
            t('stats.medalProgSessions', totalSessions, 25), Math.min(100, Math.round((totalSessions / 25) * 100))),
        mk('s50',       '🏅', t('stats.medalS50.name'),       t('stats.medalS50.desc'),       totalSessions >= 50,  session50At,
            t('stats.medalProgSessions', totalSessions, 50), Math.min(100, Math.round((totalSessions / 50) * 100))),
        mk('s100',      '🎗️', t('stats.medalS100.name'),      t('stats.medalS100.desc'),      totalSessions >= 100, session100At,
            t('stats.medalProgSessions', totalSessions, 100), Math.min(100, Math.round((totalSessions / 100) * 100))),
        mk('streak7',   '🔥', t('stats.medalStreak7.name'),   t('stats.medalStreak7.desc'),   maxStreak >= 7,   streak7Session,
            t('stats.medalProgStreak', currentStreak), Math.min(100, Math.round((currentStreak / 7) * 100))),
        mk('streak14',  '🌙', t('stats.medalStreak14.name'),  t('stats.medalStreak14.desc'),  maxStreak >= 14,  streak14Session,
            t('stats.medalProgStreak', currentStreak), Math.min(100, Math.round((currentStreak / 14) * 100))),
        mk('streak30',  '💎', t('stats.medalStreak30.name'),  t('stats.medalStreak30.desc'),  maxStreak >= 30,  streak30Session,
            t('stats.medalProgStreak', currentStreak), Math.min(100, Math.round((currentStreak / 30) * 100))),
        mk('streak60',  '🌟', t('stats.medalStreak60.name'),  t('stats.medalStreak60.desc'),  maxStreak >= 60,  streak60Session,
            t('stats.medalProgStreak', currentStreak), Math.min(100, Math.round((currentStreak / 60) * 100))),
        mk('streak100', '👑', t('stats.medalStreak100.name'), t('stats.medalStreak100.desc'), maxStreak >= 100, streak100Session,
            t('stats.medalProgStreak', currentStreak), Math.min(100, Math.round((currentStreak / 100) * 100))),
        mk('streak365', '🎖️', t('stats.medalStreak365.name'), t('stats.medalStreak365.desc'), maxStreak >= 365, streak365Session,
            t('stats.medalProgStreak', currentStreak), Math.min(100, Math.round((currentStreak / 365) * 100))),
        mk('week4',     '🗓️', t('stats.medalWeek4.name'),     t('stats.medalWeek4.desc'),     maxWeekStreak >= 4,  week4Session,
            t('stats.medalProgWeeks', currentWeekStreak, 4), Math.min(100, Math.round((currentWeekStreak / 4) * 100))),
        mk('week8',     '📆', t('stats.medalWeek8.name'),     t('stats.medalWeek8.desc'),     maxWeekStreak >= 8,  week8Session,
            t('stats.medalProgWeeks', currentWeekStreak, 8), Math.min(100, Math.round((currentWeekStreak / 8) * 100))),
        mk('week12',    '📅', t('stats.medalWeek12.name'),    t('stats.medalWeek12.desc'),    maxWeekStreak >= 12, week12Session,
            t('stats.medalProgWeeks', currentWeekStreak, 12), Math.min(100, Math.round((currentWeekStreak / 12) * 100))),
        mk('h1',        '⏱️', t('stats.medalH1.name'),        t('stats.medalH1.desc'),        totalMins >= 60,   firstHourSession,
            t('stats.medalProgMins', totalMins, 60), Math.min(100, Math.round((totalMins / 60) * 100))),
        mk('h3',        '🕑', t('stats.medalH3.name'),        t('stats.medalH3.desc'),        totalMins >= 180,  first3hSession,
            t('stats.medalProgHours', totalMins, 3), Math.min(100, Math.round((totalMins / 180) * 100))),
        mk('h5',        '🕔', t('stats.medalH5.name'),        t('stats.medalH5.desc'),        totalMins >= 300,  first5hSession,
            t('stats.medalProgHours', totalMins, 5), Math.min(100, Math.round((totalMins / 300) * 100))),
        mk('h10',       '🕐', t('stats.medalH10.name'),       t('stats.medalH10.desc'),       totalMins >= 600,  first10hSession,
            t('stats.medalProgHours', totalMins, 10), Math.min(100, Math.round((totalMins / 600) * 100))),
        mk('h25',       '🕰️', t('stats.medalH25.name'),       t('stats.medalH25.desc'),       totalMins >= 1500, first25hSession,
            t('stats.medalProgHours', totalMins, 25), Math.min(100, Math.round((totalMins / 1500) * 100))),
        mk('h50',       '🏆', t('stats.medalH50.name'),       t('stats.medalH50.desc'),       totalMins >= 3000, first50hSession,
            t('stats.medalProgHours', totalMins, 50), Math.min(100, Math.round((totalMins / 3000) * 100))),
        mk('h100',      '🥇', t('stats.medalH100.name'),      t('stats.medalH100.desc'),      totalMins >= 6000, first100hSession,
            t('stats.medalProgHours', totalMins, 100), Math.min(100, Math.round((totalMins / 6000) * 100))),
        mk('long',      '💪', t('stats.medalLong.name'),      t('stats.medalLong.desc'),      maxSessionMins >= 60, longSession,
            t('stats.medalProgSession', maxSessionMins, 60), Math.min(100, Math.round((maxSessionMins / 60) * 100))),
        mk('marathon',  '🦾', t('stats.medalMarathon.name'),  t('stats.medalMarathon.desc'),  maxSessionMins >= 90, marathonSession,
            t('stats.medalProgSession', maxSessionMins, 90), Math.min(100, Math.round((maxSessionMins / 90) * 100))),
        mk('explorer',  '🥁', t('stats.medalExplorer.name'),  t('stats.medalExplorer.desc'),  taalsSet.size >= 3, explorer3Session,
            t('stats.medalProgTaals', taalsSet.size, 3), Math.min(100, Math.round((taalsSet.size / 3) * 100))),
        ...ACTIVE_TAAL_IDS.map(id => {
            const taal  = TAALS[id];
            const meta  = TAAL_META[id] ?? DEFAULT_TAAL_META;
            const firstWord = taal.name.split(' ')[0];
            const when  = firstSessionByTaal[id];
            return mk(id, meta.emoji,
                t('stats.medalFirstTaal', firstWord),
                t('stats.medalFirstTaalDesc', taal.name),
                when !== undefined, when);
        }),
        mk('allActive', '🌐', t('stats.medalAllActive.name'),
            `${t('stats.medalAllActive.desc')}: ${ACTIVE_TAAL_IDS.map(id => TAALS[id].name.split(' ')[0]).join(', ')}`,
            hasAllActive, allActiveSession,
            t('stats.medalProgTaals', ALL_ACTIVE_TAAL_NAMES.filter(tn => taalsSet.has(tn)).length, ALL_ACTIVE_TAAL_NAMES.length),
            Math.min(100, Math.round((ALL_ACTIVE_TAAL_NAMES.filter(tn => taalsSet.has(tn)).length / ALL_ACTIVE_TAAL_NAMES.length) * 100))),
        mk('songs5',    '🎵', t('stats.medalSongs5.name'),    t('stats.medalSongs5.desc'),    songSessions.length >= 5, song5Session,
            t('stats.medalProgSessions', songSessions.length, 5), Math.min(100, Math.round((songSessions.length / 5) * 100))),
        mk('slow',      '🐢', t('stats.medalSlow.name'),      t('stats.medalSlow.desc'),      maxBpm > 0 && bpm60Session !== undefined, bpm60Session),
        mk('bpm120',    '⚡', t('stats.medalBpm120.name'),    t('stats.medalBpm120.desc'),    maxBpm >= 120, bpm120Session,
            t('stats.medalProgBpm', maxBpm > 0 ? maxBpm : 0), Math.min(100, Math.round((Math.min(maxBpm, 120) / 120) * 100))),
        mk('bpm180',    '🚀', t('stats.medalBpm180.name'),    t('stats.medalBpm180.desc'),    maxBpm >= 180, bpm180Session,
            t('stats.medalProgBpm', maxBpm > 0 ? maxBpm : 0), Math.min(100, Math.round((Math.min(maxBpm, 180) / 180) * 100))),
        ...(() => {
            if (otherSessions.length === 0) return [];
            const otherTimes    = new Set(otherSessions.map(s => s.saved_at));
            const jointSessions = sorted.filter(s => otherTimes.has(s.saved_at));
            const jointCount    = jointSessions.length;
            const jointMins     = Math.round(jointSessions.reduce((sum, s) => sum + effectiveSecs(s), 0) / 60);
            return [
                mk('jugalbandi', '🤝', t('stats.medalJugalbandi.name'),  t('stats.medalJugalbandi.desc'),  jointCount >= 1, jointSessions[0]?.saved_at),
                mk('duo5',       '🎶', t('stats.medalDuo5.name'),        t('stats.medalDuo5.desc'),        jointCount >= 5, jointSessions[4]?.saved_at,
                    t('stats.medalProgJoint', jointCount, 5), Math.min(100, Math.round((jointCount / 5) * 100))),
                mk('superjugal', '⚡', t('stats.medalSuperJugal.name'),  t('stats.medalSuperJugal.desc'),  jointMins >= 60,
                    jointSessions.find((_, i) => Math.round(jointSessions.slice(0, i + 1).reduce((s, x) => s + effectiveSecs(x), 0) / 60) >= 60)?.saved_at,
                    t('stats.medalProgJointMins', jointMins, 60), Math.min(100, Math.round((jointMins / 60) * 100))),
            ];
        })(),
    ];
}

// ── View ──────────────────────────────────────────────────────────────────────

export class StatsView implements View {
    private activeUser: string = 'prashant';
    private charts: any[] = [];
    private userData: Record<string, UserStats> = {};
    private dataLoaded: boolean = false;
    private section!: HTMLElement;
    private weeklyMode: 'weeks' | 'days' = 'weeks';
    private weeklySelectedIdx: number = 15;
    private weeklyChart: any = null;

    public render(): HTMLElement {
        this.section = createElement('section', { id: 'stats', className: 'view-section' });

        const header = createElement('div', { className: 'mb-6' });
        header.appendChild(createElement('h2', { className: 'section-title' }, t('stats.pageTitle')));
        header.appendChild(createElement('p', { className: 'section-subtitle' }, t('stats.pageSubtitle')));
        this.section.appendChild(header);

        const tabsWrap = createElement('div', { className: 'stats-user-tabs' });
        [
            { id: 'prashant', label: t('stats.tabPrashant') },
            { id: 'meera',    label: t('stats.tabMeera')    },
            { id: 'compare',  label: t('stats.tabCompare')  },
        ].forEach(({ id, label }, idx) => {
            const btn = createElement('button', {
                className: `stats-user-tab${idx === 0 ? ' active' : ''}${id === 'compare' ? ' stats-user-tab--compare' : ''}`,
                dataset: { user: id },
            }, label);
            btn.addEventListener('click', () => {
                if (!this.dataLoaded) return;
                tabsWrap.querySelectorAll('.stats-user-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeUser = id;
                this.renderContent();
            });
            tabsWrap.appendChild(btn);
        });
        this.section.appendChild(tabsWrap);

        const content = createElement('div', { id: 'stats-content' });
        this.section.appendChild(content);

        this.showLoading(content);
        this.loadAndRender(content);

        return this.section;
    }

    // ── Data loading ─────────────────────────────────────────────────────────

    private showLoading(container: HTMLElement): void {
        container.innerHTML = '';
        const wrap = createElement('div', { className: 'stats-loading' });

        const msg = createElement('p', { className: 'stats-loading__msg' }, t('stats.loading'));
        const barOuter = createElement('div', { className: 'stats-loading__bar-outer' });
        const barInner = createElement('div', { className: 'stats-loading__bar-inner', id: 'stats-progress-bar' });
        barOuter.appendChild(barInner);
        const hint = createElement('p', { className: 'stats-loading__hint' }, t('stats.loadingHint'));

        wrap.appendChild(msg);
        wrap.appendChild(barOuter);
        wrap.appendChild(hint);
        container.appendChild(wrap);

        let pct = 0;
        const tick = setInterval(() => {
            pct = pct < 70 ? pct + 8 : pct < 88 ? pct + 1 : pct;
            barInner.style.width = `${pct}%`;
        }, 300);
        (wrap as any)._stopProgress = () => {
            clearInterval(tick);
            barInner.style.width = '100%';
            barInner.style.transition = 'width 0.3s ease';
        };
    }

    private async loadAndRender(content: HTMLElement): Promise<void> {
        try {
            const [p, m] = await Promise.all([
                fetchUserStats('prashant').catch((err: unknown) => { console.warn('Stats prashant:', err); return emptyStats(); }),
                fetchUserStats('meera').catch((err: unknown)    => { console.warn('Stats meera:',    err); return emptyStats(); }),
            ]);

            const loadingWrap = content.querySelector('.stats-loading') as any;
            if (loadingWrap?._stopProgress) loadingWrap._stopProgress();

            await new Promise(r => setTimeout(r, 250));

            this.userData = { prashant: p, meera: m };
            this.dataLoaded = true;
            this.renderContent();
        } catch (err: unknown) {
            console.error('Error cargando estadísticas:', err);
            content.innerHTML = '';
            const errWrap = createElement('div', { className: 'stats-loading' });
            errWrap.innerHTML = `<p class="stats-loading__msg">${t('stats.errorMsg')}</p>
                <p class="stats-loading__hint">${t('stats.errorHint')}</p>`;
            const backBtn = createElement('button', { className: 'btn btn-primary' }, t('stats.backBtn'));
            backBtn.style.marginTop = '16px';
            backBtn.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('navigate', { detail: { viewId: 'riyaz' } }));
            });
            errWrap.appendChild(backBtn);
            content.appendChild(errWrap);
        }
    }

    private renderContent(): void {
        const content = document.getElementById('stats-content');
        if (!content) return;
        content.innerHTML = '';
        this.destroyCharts();

        if (this.activeUser === 'compare') {
            this.buildCompareView(content);
            return;
        }

        const d = this.userData[this.activeUser] ?? emptyStats();

        content.appendChild(this.buildKPIs(d));
        content.appendChild(this.buildInsight(d));
        content.appendChild(this.buildWeekCompare(d));
        content.appendChild(this.buildWeeklyCard(d));

        const heatCard = this.card();
        heatCard.appendChild(this.cardTitle(t('stats.heatmapTitle')));
        heatCard.appendChild(this.cardSub(t('stats.heatmapSub')));
        heatCard.appendChild(createElement('div', { id: 'stats-heatmap' }));
        heatCard.appendChild(this.buildHeatmapLegend());
        content.appendChild(heatCard);

        content.appendChild(this.buildHistoryCard(d));

        const row2 = createElement('div', { className: 'stats-chart-row' });
        row2.appendChild(this.buildChartCard(t('stats.chartBpmTitle'), t('stats.chartBpmSub'), 'stats-chart-bpm', 260, 'stats-canvas-medium'));
        row2.appendChild(this.buildChartCard(t('stats.chartDonutTitle'), t('stats.chartDonutSub'), 'stats-chart-donut', 260, 'stats-canvas-medium'));
        content.appendChild(row2);

        if (d.cycles.length > 0) {
            content.appendChild(this.buildChartCard(t('stats.chartCyclesTitle'), t('stats.chartCyclesSub'), 'stats-chart-cycles', 190, 'stats-canvas-short'));
        }

        content.appendChild(this.buildNextMedalCard(d));
        content.appendChild(this.buildMedalsCard(d));

        requestAnimationFrame(() => {
            this.mountCharts(d);
            this.buildHeatmap(d);
        });
    }

    // ── Helpers de UI ─────────────────────────────────────────────────────────

    private card(): HTMLElement {
        const c = createElement('div', { className: 'card' });
        c.style.padding      = '24px';
        c.style.marginBottom = '16px';
        return c;
    }

    private cardTitle(text: string): HTMLElement {
        const h = createElement('h4', { className: 'font-bold' }, text);
        h.style.fontSize     = '1rem';
        h.style.marginBottom = '4px';
        return h;
    }

    private cardSub(text: string): HTMLElement {
        const p = createElement('p', { className: 'text-muted' });
        p.style.fontSize     = '0.8rem';
        p.style.marginBottom = '16px';
        p.textContent = text;
        return p;
    }

    // ── Weekly chart with Weeks / Days toggle ────────────────────────────────

    private buildWeeklyCard(d: UserStats): HTMLElement {
        const card = this.card();

        const headerRow = createElement('div', { className: 'stats-weekly-header' });
        const titleWrap = createElement('div');
        titleWrap.appendChild(this.cardTitle(t('stats.weeklyTitle')));
        const subEl = createElement('p', { className: 'text-muted', id: 'stats-weekly-sub' });
        subEl.style.fontSize     = '0.8rem';
        subEl.style.marginBottom = '0';
        subEl.textContent = t('stats.weeklySub16');
        titleWrap.appendChild(subEl);
        headerRow.appendChild(titleWrap);

        const toggle = createElement('div', { className: 'stats-weekly-toggle' });
        const btnWeeks = createElement('button', { className: 'stats-weekly-btn active', id: 'stats-toggle-weeks' }, t('stats.weeklyBtnWeeks'));
        const btnDays  = createElement('button', { className: 'stats-weekly-btn',        id: 'stats-toggle-days'  }, t('stats.weeklyBtnDays'));
        toggle.appendChild(btnWeeks);
        toggle.appendChild(btnDays);
        headerRow.appendChild(toggle);
        card.appendChild(headerRow);

        const weekSel = createElement('div', { className: 'stats-week-selector', id: 'stats-week-selector' });
        weekSel.style.display = 'none';
        const selLabel = createElement('span', { className: 'text-muted' });
        selLabel.style.fontSize = '0.82rem';
        selLabel.textContent = t('stats.weeklySelLabel');
        const selPrev = createElement('button', { className: 'stats-week-nav', id: 'stats-week-prev' }, '‹');
        const selNext = createElement('button', { className: 'stats-week-nav', id: 'stats-week-next' }, '›');
        const selCurrent = createElement('span', { className: 'stats-week-label', id: 'stats-week-label' });
        weekSel.appendChild(selLabel);
        weekSel.appendChild(selPrev);
        weekSel.appendChild(selCurrent);
        weekSel.appendChild(selNext);
        card.appendChild(weekSel);

        const wrap = createElement('div', { className: 'stats-canvas-tall' });
        wrap.style.position = 'relative';
        wrap.style.height   = '230px';
        wrap.appendChild(createElement('canvas', { id: 'stats-chart-weekly' }));
        card.appendChild(wrap);

        const DAY_LABELS = t('stats.dayLabels') as unknown as string[];

        const updateSub = () => {
            const subNode = document.getElementById('stats-weekly-sub');
            if (!subNode) return;
            subNode.textContent = this.weeklyMode === 'weeks'
                ? t('stats.weeklySub16')
                : t('stats.weeklySubDay', d.weekLabels[this.weeklySelectedIdx]);
        };

        const updateWeekLabel = () => {
            const lbl = document.getElementById('stats-week-label');
            if (lbl) lbl.textContent = d.weekLabels[this.weeklySelectedIdx] ?? '';
        };

        const switchChart = () => {
            if (!this.weeklyChart) return;
            const chart = this.weeklyChart;
            if (this.weeklyMode === 'weeks') {
                const trend = d.weekly.map((_, i, arr) => {
                    const slice = arr.slice(Math.max(0, i - 2), i + 1);
                    return Math.round(slice.reduce((a: number, b: number) => a + b, 0) / slice.length);
                });
                chart.data.labels = d.weekLabels;
                chart.data.datasets[0].data = d.weekly;
                chart.data.datasets[0].backgroundColor = d.weekly.map((_: number, i: number) => i >= 12 ? C.orange : C.orangeA);
                chart.data.datasets[1].data = trend;
                chart.data.datasets[1].hidden = false;
            } else {
                const days = d.weekDays[this.weeklySelectedIdx] ?? new Array(7).fill(0);
                chart.data.labels = DAY_LABELS;
                chart.data.datasets[0].data = days;
                chart.data.datasets[0].backgroundColor = days.map((v: number) => v > 0 ? C.orange : C.orangeA);
                chart.data.datasets[1].data = new Array(7).fill(null);
                chart.data.datasets[1].hidden = true;
            }
            chart.update();
            updateSub();
        };

        btnWeeks.addEventListener('click', () => {
            this.weeklyMode = 'weeks';
            btnWeeks.classList.add('active');
            btnDays.classList.remove('active');
            weekSel.style.display = 'none';
            switchChart();
        });

        btnDays.addEventListener('click', () => {
            this.weeklyMode = 'days';
            btnDays.classList.add('active');
            btnWeeks.classList.remove('active');
            weekSel.style.display = 'flex';
            updateWeekLabel();
            switchChart();
        });

        selPrev.addEventListener('click', () => {
            if (this.weeklySelectedIdx > 0) {
                this.weeklySelectedIdx--;
                updateWeekLabel();
                switchChart();
            }
        });

        selNext.addEventListener('click', () => {
            if (this.weeklySelectedIdx < 15) {
                this.weeklySelectedIdx++;
                updateWeekLabel();
                switchChart();
            }
        });

        return card;
    }

    private mountWeeklyChart(d: UserStats): void {
        const canvas = document.getElementById('stats-chart-weekly') as HTMLCanvasElement | null;
        if (!canvas) return;

        const gridCol = C.grid();
        const textCol = C.text();

        const trend = d.weekly.map((_, i, arr) => {
            const slice = arr.slice(Math.max(0, i - 2), i + 1);
            return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
        });

        this.weeklyChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: d.weekLabels,
                datasets: [
                    {
                        label: t('stats.weeklyDataLabel'),
                        data: d.weekly,
                        backgroundColor: d.weekly.map((_, i) => i >= 12 ? C.orange : C.orangeA),
                        borderColor: C.orange, borderWidth: 1.5, borderRadius: 6, borderSkipped: false,
                    },
                    {
                        label: t('stats.weeklyTrend'),
                        data: trend,
                        type: 'line',
                        borderColor: C.blue, backgroundColor: 'transparent',
                        borderWidth: 2, pointRadius: 0, tension: 0.4,
                    },
                ],
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'top' as const, align: 'end' as const, labels: { boxWidth: 12, padding: 16, usePointStyle: true } } },
                scales: {
                    x: { grid: { color: gridCol }, ticks: { maxRotation: 45 } },
                    y: { grid: { color: gridCol }, beginAtZero: true, title: { display: true, text: 'min', color: textCol } },
                },
            },
        });
        this.charts.push(this.weeklyChart);

        if (this.weeklyMode === 'days') {
            const btnDays  = document.getElementById('stats-toggle-days');
            const btnWeeks = document.getElementById('stats-toggle-weeks');
            const weekSel  = document.getElementById('stats-week-selector');
            btnDays?.classList.add('active');
            btnWeeks?.classList.remove('active');
            if (weekSel) weekSel.style.display = 'flex';
            const days = d.weekDays[this.weeklySelectedIdx] ?? new Array(7).fill(0);
            const DAY_LABELS = t('stats.dayLabels') as unknown as string[];
            this.weeklyChart.data.labels = DAY_LABELS;
            this.weeklyChart.data.datasets[0].data = days;
            this.weeklyChart.data.datasets[0].backgroundColor = days.map((v: number) => v > 0 ? C.orange : C.orangeA);
            this.weeklyChart.data.datasets[1].hidden = true;
            this.weeklyChart.update();
        }
    }

    private buildChartCard(title: string, sub: string, canvasId: string, height: number, canvasCls = ''): HTMLElement {
        const card = this.card();
        card.appendChild(this.cardTitle(title));
        card.appendChild(this.cardSub(sub));
        const wrap = createElement('div', { className: canvasCls });
        wrap.style.position = 'relative';
        wrap.style.height   = `${height}px`;
        wrap.appendChild(createElement('canvas', { id: canvasId }));
        card.appendChild(wrap);
        return card;
    }

    // ── Vista comparativa ─────────────────────────────────────────────────────

    private buildCompareView(content: HTMLElement): void {
        const p = this.userData['prashant'] ?? emptyStats();
        const m = this.userData['meera']    ?? emptyStats();

        const kpiSection = this.card();
        kpiSection.appendChild(this.cardTitle(t('stats.compareTitleKpi')));
        kpiSection.appendChild(this.cardSub(t('stats.compareSubKpi')));

        const kpiDefs = [
            { label: t('stats.compareKpiSessions'),    p: String(p.kpi.sessions), m: String(m.kpi.sessions) },
            { label: t('stats.compareKpiTime'),        p: p.kpi.time,             m: m.kpi.time             },
            { label: t('stats.compareKpiBpm'),         p: p.kpi.bpm > 0 ? String(p.kpi.bpm) : '—', m: m.kpi.bpm > 0 ? String(m.kpi.bpm) : '—' },
            { label: t('stats.compareKpiStreak'),      p: `${p.kpi.streak}d`,        m: `${m.kpi.streak}d`        },
            { label: t('stats.compareKpiWeekStreak'),  p: `${p.kpi.weekStreak}sem`,  m: `${m.kpi.weekStreak}sem`  },
        ];

        const kpiGrid = createElement('div', { className: 'stats-compare-grid' });

        kpiGrid.appendChild(createElement('div', { className: 'stats-compare-cell stats-compare-header' }));
        ['Prashant', 'Meera'].forEach((name, i) => {
            kpiGrid.appendChild(createElement('div', {
                className: `stats-compare-cell stats-compare-name stats-compare-name--${i === 0 ? 'p' : 'm'}`,
            }, name));
        });

        kpiDefs.forEach(k => {
            kpiGrid.appendChild(createElement('div', { className: 'stats-compare-cell stats-compare-label' }, k.label));
            kpiGrid.appendChild(createElement('div', { className: 'stats-compare-cell stats-compare-val stats-compare-val--p' }, k.p));
            kpiGrid.appendChild(createElement('div', { className: 'stats-compare-cell stats-compare-val stats-compare-val--m' }, k.m));
        });

        kpiSection.appendChild(kpiGrid);
        content.appendChild(kpiSection);

        const chartCard = this.card();
        chartCard.appendChild(this.cardTitle(t('stats.compareWeeklyTitle')));
        chartCard.appendChild(this.cardSub(t('stats.compareWeeklySub')));
        const wrap = createElement('div', { className: 'stats-canvas-tall' });
        wrap.style.position = 'relative';
        wrap.style.height   = '250px';
        wrap.appendChild(createElement('canvas', { id: 'stats-chart-compare' }));
        chartCard.appendChild(wrap);
        content.appendChild(chartCard);

        const distRow = createElement('div', { className: 'stats-chart-row' });
        [
            { title: t('stats.compareDonutP'), id: 'stats-chart-compare-donut-p' },
            { title: t('stats.compareDonutM'), id: 'stats-chart-compare-donut-m' },
        ].forEach(({ title, id }) => {
            const c = this.card();
            c.appendChild(this.cardTitle(title));
            const w = createElement('div', { className: 'stats-canvas-medium' });
            w.style.position = 'relative';
            w.style.height   = '220px';
            w.appendChild(createElement('canvas', { id }));
            c.appendChild(w);
            distRow.appendChild(c);
        });
        content.appendChild(distRow);

        const pm = computeMedals(p.rawSessions, m.rawSessions);
        const mm = computeMedals(m.rawSessions, p.rawSessions);
        const pmById = Object.fromEntries(pm.map(x => [x.id, x]));
        const mmById = Object.fromEntries(mm.map(x => [x.id, x]));

        const COMPARE_GROUPS = [
            { label: t('stats.compareGroupConsistency'), ids: ['first','s10','s50','streak7','streak30','streak60','streak100','streak365','week4'] },
            { label: t('stats.compareGroupVolume'),      ids: ['h1','h10','h50','h100','long','marathon'] },
            { label: t('stats.compareGroupVariety'),     ids: ['explorer', ...ACTIVE_TAAL_IDS, 'allActive','songs5','slow','bpm120','bpm180'] },
            { label: t('stats.compareGroupJoint'),       ids: ['jugalbandi','duo5','superjugal'] },
        ];

        const pEarned = pm.filter(medal => medal.earned).length;
        const mEarned = mm.filter(medal => medal.earned).length;
        const total   = pm.length;

        const legendCard = this.card();
        legendCard.style.paddingBottom = '12px';
        legendCard.style.marginBottom  = '8px';
        const legendTitle = createElement('div', { className: 'medals-compare-legend' });
        legendTitle.appendChild(this.cardTitle(t('stats.compareMedalsTitle')));
        const dots = createElement('div', { className: 'medals-compare-legend-dots' });
        ([['p', 'Prashant', pEarned], ['m', 'Meera', mEarned]] as [string, string, number][]).forEach(([k, name, earned]) => {
            const item = createElement('span', { className: 'medals-compare-legend-item' });
            item.appendChild(createElement('span', { className: `medals-compare-dot medals-compare-dot--${k}` }));
            item.appendChild(document.createTextNode(`${name} `));
            item.appendChild(createElement('span', { className: `medals-compare-count medals-compare-count--${k}` }, `${earned}/${total}`));
            dots.appendChild(item);
        });
        legendTitle.appendChild(dots);
        legendCard.appendChild(legendTitle);
        content.appendChild(legendCard);

        const medalGrid = createElement('div', { className: 'medals-compare-grid' });

        COMPARE_GROUPS.forEach(group => {
            const card = this.card();
            card.style.marginBottom = '0';
            card.appendChild(createElement('p', { className: 'medals-group-label' }, group.label));

            const cellGrid = createElement('div', { className: 'medals-cmp-cell-grid' });

            group.ids.forEach(id => {
                const pm_ = pmById[id];
                const mm_ = mmById[id];
                if (!pm_ || !mm_) return;

                const cell = createElement('div', { className: 'medals-cmp-cell' });
                cell.title = pm_.desc;

                const emojiEl = createElement('span', {
                    className: `medals-cmp-emoji${(!pm_.earned && !mm_.earned) ? ' medals-cmp-emoji--locked' : ''}`,
                }, pm_.emoji);
                cell.appendChild(emojiEl);
                cell.appendChild(createElement('span', { className: 'medals-cmp-name' }, pm_.name));

                const dotsEl = createElement('div', { className: 'medals-cmp-dots' });
                [pm_, mm_].forEach((medal, ui) => {
                    const dot = createElement('span', {
                        className: `medals-cmp-dot medals-cmp-dot--${ui === 0 ? 'p' : 'm'}${medal.earned ? ' medals-cmp-dot--on' : ''}`,
                    });
                    if (medal.earned && medal.earnedAt) dot.title = medal.earnedAt;
                    dotsEl.appendChild(dot);
                });
                cell.appendChild(dotsEl);
                cellGrid.appendChild(cell);
            });

            card.appendChild(cellGrid);
            medalGrid.appendChild(card);
        });

        content.appendChild(medalGrid);

        requestAnimationFrame(() => { this.mountCompareCharts(p, m); });
    }

    private mountCompareCharts(p: UserStats, m: UserStats): void {
        const gridCol = C.grid();
        const textCol = C.text();
        const cardCol = C.card();

        Chart.defaults.font.family = 'inherit';
        Chart.defaults.font.size   = 12;
        Chart.defaults.color       = textCol;

        const compareCanvas = document.getElementById('stats-chart-compare') as HTMLCanvasElement | null;
        if (compareCanvas) {
            const trendP = p.weekly.map((_, i, arr) => {
                const slice = arr.slice(Math.max(0, i - 2), i + 1);
                return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
            });
            const trendM = m.weekly.map((_, i, arr) => {
                const slice = arr.slice(Math.max(0, i - 2), i + 1);
                return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
            });

            this.charts.push(new Chart(compareCanvas, {
                type: 'bar',
                data: {
                    labels: p.weekLabels,
                    datasets: [
                        { label: 'Prashant',                   data: p.weekly, backgroundColor: C.orangeA, borderColor: C.orange, borderWidth: 1.5, borderRadius: 4, borderSkipped: false },
                        { label: 'Meera',                      data: m.weekly, backgroundColor: C.blueA,   borderColor: C.blue,   borderWidth: 1.5, borderRadius: 4, borderSkipped: false },
                        { label: t('stats.chartTrendP'), data: trendP,  type: 'line' as const, borderColor: C.orange, backgroundColor: 'transparent', borderWidth: 2, borderDash: [4, 3], pointRadius: 0, tension: 0.4 },
                        { label: t('stats.chartTrendM'), data: trendM,  type: 'line' as const, borderColor: C.blue,   backgroundColor: 'transparent', borderWidth: 2, borderDash: [4, 3], pointRadius: 0, tension: 0.4 },
                    ],
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'top' as const, align: 'end' as const, labels: { boxWidth: 12, padding: 16, usePointStyle: true } } },
                    scales: {
                        x: { grid: { color: gridCol }, ticks: { maxRotation: 45 } },
                        y: { grid: { color: gridCol }, beginAtZero: true, title: { display: true, text: 'min', color: textCol } },
                    },
                },
            }));
        }

        const donutColors = [C.orange, C.blue, C.purple, C.teal, C.amber, '#ec4899'];
        [
            { canvasId: 'stats-chart-compare-donut-p', donut: p.donut },
            { canvasId: 'stats-chart-compare-donut-m', donut: m.donut },
        ].forEach(({ canvasId, donut }) => {
            const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
            if (!canvas) return;
            const entries = Object.entries(donut);
            this.charts.push(new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: entries.length > 0 ? entries.map(([k]) => k) : [t('stats.donutNoData')],
                    datasets: [{ data: entries.length > 0 ? entries.map(([, v]) => v) : [100], backgroundColor: entries.length > 0 ? donutColors : ['#e2e8f0'], borderWidth: 3, borderColor: cardCol, hoverOffset: 8 }],
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '60%',
                    plugins: {
                        legend: { position: 'bottom' as const, labels: { boxWidth: 10, padding: 10, usePointStyle: true, font: { size: 10 } } },
                        tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}%` } },
                    },
                },
            }));
        });
    }

    private buildKPIs(d: UserStats): HTMLElement {
        const grid = createElement('div', { className: 'stats-kpi-grid' });

        const avgMins = d.kpi.sessions > 0
            ? Math.round(d.rawSessions.reduce((s, x) => s + effectiveSecs(x), 0) / 60 / d.kpi.sessions)
            : 0;
        const avgStr = avgMins >= 60
            ? `${Math.floor(avgMins / 60)}h ${avgMins % 60 > 0 ? (avgMins % 60) + 'm' : ''}`.trim()
            : `${avgMins}m`;

        const DAY_NAMES_FULL = tArray('stats.dayNames');
        const sessionsByDay = new Array(7).fill(0);
        d.rawSessions.forEach(s => {
            const dow = new Date(gcDateStr(s.saved_at) + 'T12:00:00Z').getUTCDay();
            const idx = dow === 0 ? 6 : dow - 1;
            sessionsByDay[idx]++;
        });
        const bestDayIdx   = sessionsByDay.indexOf(Math.max(...sessionsByDay));
        const bestDayValue = d.kpi.sessions > 0 ? DAY_NAMES_FULL[bestDayIdx] : '—';
        const bestDaySub   = d.kpi.sessions > 0 ? t('stats.kpiBestDaySub', sessionsByDay[bestDayIdx]) : t('stats.kpiNoData');

        const maxSessionMins = d.kpi.sessions > 0
            ? Math.max(...d.rawSessions.map(s => Math.round(effectiveSecs(s) / 60)))
            : 0;
        const maxSessionStr = maxSessionMins >= 60
            ? `${Math.floor(maxSessionMins / 60)}h ${maxSessionMins % 60 > 0 ? (maxSessionMins % 60) + 'm' : ''}`.trim()
            : `${maxSessionMins}m`;

        const nowGC = new Date(gcTodayStr() + 'T12:00:00Z');
        const thisMonth = nowGC.getUTCMonth();
        const thisYear  = nowGC.getUTCFullYear();
        const daysInMonth = new Date(Date.UTC(thisYear, thisMonth + 1, 0)).getUTCDate();
        const daysThisMonth = new Set(
            d.rawSessions
                .map(s => gcDateStr(s.saved_at))
                .filter(dateStr => {
                    const d2 = new Date(dateStr + 'T12:00:00Z');
                    return d2.getUTCMonth() === thisMonth && d2.getUTCFullYear() === thisYear;
                })
        ).size;

        const kpis = [
            { label: t('stats.kpiSessions'),       value: String(d.kpi.sessions),                       sub: t('stats.kpiSessionsSub'),   badge: t('stats.kpiSessionsBadge'),   badgeCls: 'stats-badge--up' },
            { label: t('stats.kpiTime'),            value: d.kpi.time,                                   sub: t('stats.kpiTimeSub'),        badge: t('stats.kpiTimeBadge'),        badgeCls: 'stats-badge--up' },
            { label: t('stats.kpiAvg'),             value: d.kpi.sessions > 0 ? avgStr : '—',            sub: t('stats.kpiAvgSub'),         badge: t('stats.kpiAvgBadge'),         badgeCls: 'stats-badge--up' },
            { label: t('stats.kpiLongest'),         value: d.kpi.sessions > 0 ? maxSessionStr : '—',     sub: t('stats.kpiLongestSub'),     badge: t('stats.kpiLongestBadge'),     badgeCls: 'stats-badge--up' },
            { label: t('stats.kpiBpm'),             value: d.kpi.bpm > 0 ? String(d.kpi.bpm) : '—',     sub: t('stats.kpiBpmSub'),         badge: t('stats.kpiBpmBadge'),         badgeCls: 'stats-badge--up' },
            { label: t('stats.kpiBestDay'),         value: bestDayValue,                                  sub: bestDaySub,                   badge: t('stats.kpiBestDayBadge'),     badgeCls: 'stats-badge--up' },
            { label: t('stats.kpiDaysPracticed'),   value: d.kpi.sessions > 0 ? String(daysThisMonth) : '—', sub: t('stats.kpiDaysPracticedSub', daysInMonth), badge: t('stats.kpiDaysPracticedBadge'), badgeCls: 'stats-badge--up' },
        ];

        kpis.forEach(k => {
            const card = createElement('div', { className: 'card stats-kpi-card' });
            card.appendChild(createElement('div', { className: 'stats-kpi-label' }, k.label));
            card.appendChild(createElement('div', { className: 'stats-kpi-value' }, k.value));
            card.appendChild(createElement('div', { className: 'stats-kpi-sub'   }, k.sub));
            card.appendChild(createElement('span', { className: `stats-badge ${k.badgeCls}` }, k.badge));
            grid.appendChild(card);
        });

        const streakCard = createElement('div', { className: 'card stats-kpi-card stats-streak-card' });
        streakCard.appendChild(createElement('div', { className: 'stats-kpi-label' }, t('stats.streakLabel')));

        const streakRow = createElement('div', { className: 'stats-streak-row' });

        const dayBlock = createElement('div', { className: 'stats-streak-block' });
        dayBlock.appendChild(createElement('div', { className: 'stats-kpi-value' }, String(d.kpi.streak)));
        dayBlock.appendChild(createElement('div', { className: 'stats-kpi-sub' }, t('stats.streakDays')));
        streakRow.appendChild(dayBlock);

        streakRow.appendChild(createElement('div', { className: 'stats-streak-divider' }));

        const weekBlock = createElement('div', { className: 'stats-streak-block' });
        weekBlock.appendChild(createElement('div', { className: 'stats-kpi-value' }, String(d.kpi.weekStreak)));
        weekBlock.appendChild(createElement('div', { className: 'stats-kpi-sub' }, t('stats.streakWeeks')));
        streakRow.appendChild(weekBlock);

        streakRow.appendChild(createElement('div', { className: 'stats-streak-divider' }));

        const maxStreakBlock = createElement('div', { className: 'stats-streak-block stats-streak-block--record' });
        maxStreakBlock.appendChild(createElement('div', { className: 'stats-kpi-value stats-streak-record-value' }, String(d.kpi.maxStreak)));
        maxStreakBlock.appendChild(createElement('div', { className: 'stats-kpi-sub' }, t('stats.streakRecord')));
        streakRow.appendChild(maxStreakBlock);

        streakCard.appendChild(streakRow);
        const streakBadge = d.kpi.weekStreak > 0
            ? t('stats.streakBadge', d.kpi.weekStreak)
            : t('stats.streakNone');
        streakCard.appendChild(createElement('span', { className: 'stats-badge stats-badge--streak' }, streakBadge));
        grid.appendChild(streakCard);

        return grid;
    }

    // ── Insight ───────────────────────────────────────────────────────────────

    private buildInsight(d: UserStats): HTMLElement {
        const box = createElement('div', { className: 'stats-insight-box' });
        box.innerHTML = `💡 ${d.insight}`;
        return box;
    }

    // ── Esta semana vs semana pasada ──────────────────────────────────────────

    private buildWeekCompare(d: UserStats): HTMLElement {
        const minsThis = d.weekly[15] ?? 0;
        const minsPrev = d.weekly[14] ?? 0;

        const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
        const now = new Date();
        const getMonday = (ref: Date): Date => {
            const d = new Date(ref);
            const day = d.getDay();
            d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
            d.setHours(0, 0, 0, 0);
            return d;
        };
        const thisMonday = getMonday(now);
        const prevMonday = new Date(thisMonday.getTime() - MS_WEEK);

        const sessionsThis = d.rawSessions.filter(s => {
            const tv = new Date(s.saved_at).getTime();
            return tv >= thisMonday.getTime() && tv < thisMonday.getTime() + MS_WEEK;
        });
        const sessionsPrev = d.rawSessions.filter(s => {
            const tv = new Date(s.saved_at).getTime();
            return tv >= prevMonday.getTime() && tv < thisMonday.getTime();
        });

        const maxBpmOf = (ss: SupabaseSession[]) =>
            ss.flatMap(s => s.blocks.map(b => b.bpm_end ?? 0)).reduce((mv, v) => Math.max(mv, v), 0);
        const bpmThis = maxBpmOf(sessionsThis);
        const bpmPrev = maxBpmOf(sessionsPrev);

        const delta = (curr: number, prev: number, unit: string): { text: string; cls: string } => {
            if (prev === 0 && curr === 0) return { text: '—', cls: 'week-cmp-delta--neutral' };
            if (prev === 0) return { text: `+${curr} ${unit}`, cls: 'week-cmp-delta--up' };
            const diff = curr - prev;
            if (diff > 0) return { text: `+${diff} ${unit}`, cls: 'week-cmp-delta--up' };
            if (diff < 0) return { text: `${diff} ${unit}`, cls: 'week-cmp-delta--down' };
            return { text: t('stats.weekCmpEqual'), cls: 'week-cmp-delta--neutral' };
        };

        const minsDelta  = delta(minsThis,            minsPrev,            'min');
        const sessDelta  = delta(sessionsThis.length, sessionsPrev.length, 'ses.');
        const bpmDelta   = delta(bpmThis,             bpmPrev,             'BPM');

        const fmtMins = (mn: number) => mn >= 60 ? `${Math.floor(mn/60)}h ${mn%60 > 0 ? mn%60+'m' : ''}`.trim() : `${mn}m`;

        const metrics: { label: string; thisVal: string; prevVal: string; delta: { text: string; cls: string } }[] = [
            { label: t('stats.weekCmpMinutes'),  thisVal: fmtMins(minsThis),          prevVal: fmtMins(minsPrev),          delta: minsDelta },
            { label: t('stats.weekCmpSessions'), thisVal: String(sessionsThis.length), prevVal: String(sessionsPrev.length), delta: sessDelta },
            { label: t('stats.weekCmpBpm'),      thisVal: bpmThis > 0 ? String(bpmThis) : '—', prevVal: bpmPrev > 0 ? String(bpmPrev) : '—', delta: bpmDelta },
        ];

        const card = this.card();
        const headerRow = createElement('div', { className: 'week-cmp-header' });
        const titleWrap = createElement('div');
        titleWrap.appendChild(this.cardTitle(t('stats.weekCmpTitle')));
        titleWrap.appendChild(this.cardSub(t('stats.weekCmpSub')));
        headerRow.appendChild(titleWrap);

        const colLabels = createElement('div', { className: 'week-cmp-col-labels' });
        colLabels.appendChild(createElement('span', { className: 'week-cmp-col-label week-cmp-col-label--this' }, t('stats.weekCmpThis')));
        colLabels.appendChild(createElement('span', { className: 'week-cmp-col-label week-cmp-col-label--prev' }, t('stats.weekCmpPrev')));
        headerRow.appendChild(colLabels);
        card.appendChild(headerRow);

        const gridEl = createElement('div', { className: 'week-cmp-grid' });
        metrics.forEach(metric => {
            const row = createElement('div', { className: 'week-cmp-row' });
            row.appendChild(createElement('span', { className: 'week-cmp-metric-label' }, metric.label));

            const thisCell = createElement('div', { className: 'week-cmp-cell week-cmp-cell--this' });
            thisCell.appendChild(createElement('span', { className: 'week-cmp-value' }, metric.thisVal));
            thisCell.appendChild(createElement('span', { className: `week-cmp-delta ${metric.delta.cls}` }, metric.delta.text));
            row.appendChild(thisCell);

            row.appendChild(createElement('div', { className: 'week-cmp-cell week-cmp-cell--prev' }));
            const prevCell = row.lastElementChild as HTMLElement;
            prevCell.appendChild(createElement('span', { className: 'week-cmp-value week-cmp-value--muted' }, metric.prevVal));

            gridEl.appendChild(row);
        });
        card.appendChild(gridEl);

        return card;
    }

    // ── Heatmap ───────────────────────────────────────────────────────────────

    private buildHeatmapLegend(): HTMLElement {
        const leg = createElement('div', { className: 'stats-hm-legend' });
        leg.appendChild(createElement('span', {}, t('stats.heatmapLess')));
        const cells = createElement('div', { className: 'stats-hm-legend-cells' });
        [0,1,2,3,4].forEach(i => cells.appendChild(createElement('div', { className: `stats-hm-cell stats-hm-${i}` })));
        leg.appendChild(cells);
        leg.appendChild(createElement('span', {}, t('stats.heatmapMore')));
        return leg;
    }

    private buildHeatmap(d: UserStats): void {
        const container = document.getElementById('stats-heatmap');
        if (!container) return;
        container.innerHTML = '';

        if (d.heatmap.length === 0) {
            container.textContent = t('stats.heatmapNoData');
            return;
        }

        const tooltips = tArray('stats.heatmapTooltips');

        d.heatmap.forEach(({ label, days }) => {
            const wrap = createElement('div', { style: { marginBottom: '14px' } });
            const lbl = createElement('div', { className: 'text-muted' });
            Object.assign(lbl.style, { fontSize: '0.7rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' });
            lbl.textContent = label;
            wrap.appendChild(lbl);

            const row = createElement('div', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap' } });
            days.forEach(val => {
                const cell = createElement('div', { className: `stats-hm-cell stats-hm-${val}` });
                cell.title = tooltips[val] ?? '';
                row.appendChild(cell);
            });
            wrap.appendChild(row);
            container.appendChild(wrap);
        });
    }

    // ── Historial con filtros ─────────────────────────────────────────────────

    private buildHistoryCard(d: UserStats): HTMLElement {
        const PAGE_SIZE = 5;
        const card = this.card();
        card.appendChild(this.cardTitle(t('stats.historyTitle')));

        const filterRow = createElement('div', { className: 'stats-hist-filters' });

        const taalSel = createElement('select', { className: 'stats-hist-filter-sel' }) as HTMLSelectElement;
        const taalNames = [t('stats.historyTaalAll'), ...Array.from(
            new Set(d.rawSessions.flatMap(s => s.blocks.map(b => b.taal_name).filter(Boolean)))
        ).sort()];
        taalNames.forEach((name, i) => {
            taalSel.appendChild(createElement('option', { value: i === 0 ? '' : name! }, name!) as HTMLOptionElement);
        });
        filterRow.appendChild(taalSel);

        const MONTH_FULL = t('stats.monthsFull') as unknown as string[];
        const monthSel = createElement('select', { className: 'stats-hist-filter-sel' }) as HTMLSelectElement;
        monthSel.appendChild(createElement('option', { value: '' }, t('stats.historyMonthAll')) as HTMLOptionElement);
        const monthsSeen = new Set<string>();
        d.rawSessions.forEach(s => {
            const gc = gcDateStr(s.saved_at);
            monthsSeen.add(`${gc.slice(0,4)}-${String(parseInt(gc.slice(5,7)) - 1).padStart(2,'0')}`);
        });
        [...monthsSeen].sort().reverse().forEach(key => {
            const [yr, mo] = key.split('-');
            monthSel.appendChild(createElement('option', { value: key },
                `${MONTH_FULL[parseInt(mo)]} ${yr}`) as HTMLOptionElement);
        });
        filterRow.appendChild(monthSel);

        const resultCount = createElement('span', { className: 'stats-hist-count text-muted' });
        filterRow.appendChild(resultCount);
        card.appendChild(filterRow);

        const tableWrap = createElement('div', { style: { overflowX: 'auto' } });
        card.appendChild(tableWrap);

        const pagination = createElement('div', { className: 'stats-hist-pagination' });
        card.appendChild(pagination);

        const MONTH_SHORT = tArray('stats.monthsShort');

        let currentPage = 0;

        const render = (filtered: SupabaseSession[]) => {
            const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
            if (currentPage >= totalPages) currentPage = totalPages - 1;

            const shown = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

            const start = filtered.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;
            const end   = Math.min((currentPage + 1) * PAGE_SIZE, filtered.length);
            resultCount.textContent = filtered.length === 0
                ? t('stats.historyCountZero')
                : t('stats.historyCount', start, end, filtered.length);

            tableWrap.innerHTML = this.buildHistoryHTML(shown, MONTH_SHORT);
            this.bindHistoryNotes(tableWrap);

            pagination.innerHTML = '';
            if (totalPages <= 1) return;

            const prevBtn = createElement('button', { className: `stats-page-btn${currentPage === 0 ? ' stats-page-btn--disabled' : ''}` }, '‹');
            if (currentPage > 0) {
                prevBtn.addEventListener('click', () => { currentPage--; render(filtered); });
            }
            pagination.appendChild(prevBtn);

            const range = 2;
            const from  = Math.max(0, currentPage - range);
            const to    = Math.min(totalPages - 1, currentPage + range);
            if (from > 0) {
                pagination.appendChild(createElement('span', { className: 'stats-page-ellipsis' }, '…'));
            }
            for (let pg = from; pg <= to; pg++) {
                const btn = createElement('button', {
                    className: `stats-page-btn${pg === currentPage ? ' stats-page-btn--active' : ''}`
                }, String(pg + 1));
                const page = pg;
                btn.addEventListener('click', () => { currentPage = page; render(filtered); });
                pagination.appendChild(btn);
            }
            if (to < totalPages - 1) {
                pagination.appendChild(createElement('span', { className: 'stats-page-ellipsis' }, '…'));
            }

            const nextBtn = createElement('button', { className: `stats-page-btn${currentPage === totalPages - 1 ? ' stats-page-btn--disabled' : ''}` }, '›');
            if (currentPage < totalPages - 1) {
                nextBtn.addEventListener('click', () => { currentPage++; render(filtered); });
            }
            pagination.appendChild(nextBtn);
        };

        const applyFilters = () => {
            const taalFilter  = taalSel.value;
            const monthFilter = monthSel.value;

            let filtered = [...d.rawSessions].reverse();

            if (taalFilter) {
                filtered = filtered.filter(s =>
                    s.blocks.some(b => b.taal_name === taalFilter)
                );
            }
            if (monthFilter) {
                const [yr, mo] = monthFilter.split('-').map(Number);
                filtered = filtered.filter(s => {
                    const gc = gcDateStr(s.saved_at);
                    return parseInt(gc.slice(0,4)) === yr && parseInt(gc.slice(5,7)) - 1 === mo;
                });
            }

            currentPage = 0;
            render(filtered);
        };

        taalSel.addEventListener('change', applyFilters);
        monthSel.addEventListener('change', applyFilters);
        applyFilters();

        return card;
    }

    private buildHistoryHTML(sessions: SupabaseSession[], monthNames: string[]): string {
        if (sessions.length === 0) {
            return `<p class="text-muted text-sm" style="padding:12px 0">${t('stats.historyNoData')}</p>`;
        }

        const tagCls = (name: string) => {
            if (name === 'Warm Up' || name === 'Pickup') return 'stats-tag--slate';
            const match = ACTIVE_TAAL_IDS.find(id => TAALS[id].name.startsWith(name));
            return (match ? TAAL_META[match] : undefined)?.tagCls ?? DEFAULT_TAAL_META.tagCls;
        };

        const supportLabel = (b: SupabaseBlock): string => {
            if (!b.support_type) return '';
            if (b.support_type === 'metronome') return t('stats.historySupMetronome');
            if (b.support_type === 'song')      return t('stats.historySupSong',  b.support_ref ?? t('stats.historyPractice'));
            if (b.support_type === 'lehra')     return t('stats.historySupLehra', b.support_ref ?? 'Lehra');
            return b.support_type;
        };

        const rows = sessions.map((s, i) => {
            const gcStr = gcDateStr(s.saved_at);
            const date2 = new Date(gcStr + 'T12:00:00Z');
            const date  = `${date2.getUTCDate()} ${monthNames[date2.getUTCMonth()]} ${date2.getUTCFullYear()}`;
            const dur   = `${Math.round(effectiveSecs(s) / 60)} min`;
            const blockNames = s.blocks.map(b =>
                b.type === 'warmup' ? t('stats.historyWarmUp')
                : b.type === 'pickup' ? t('stats.historyPickup')
                : (b.taal_name ?? t('stats.historyPractice'))
            );
            const tags = blockNames.map(b => `<span class="stats-tag ${tagCls(b)}">${b}</span>`).join('');

            const noteText = s.notes
                ? s.notes.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                : '';
            const noteHtml = s.notes
                ? `<div class="stats-block-note">💬 ${noteText}</div>`
                : '';

            const detailId = `stats-detail-row-${i}`;
            const blockDetailRows = s.blocks.map((b, bi) => {
                const blockLabel = b.type === 'warmup' ? t('stats.historyWarmUp')
                    : b.type === 'pickup' ? `${t('stats.historyPickup')}: ${b.pickup_name ?? ''}`
                    : `${b.taal_name ?? t('stats.historyPractice')}${b.variation_name ? ` · ${b.variation_name}` : ''}`;
                const kayda   = b.kayda_name ? `<span class="stats-block-meta-item">📋 ${b.kayda_name}</span>` : '';
                const bpmStr2 = (b.bpm_start || b.bpm_end)
                    ? `<span class="stats-block-meta-item">🎯 ${b.bpm_start ?? '?'} → ${b.bpm_end ?? '?'} BPM</span>` : '';
                const durStr  = b.duration_secs
                    ? `<span class="stats-block-meta-item">⏱ ${Math.round(b.duration_secs / 60)} min</span>` : '';
                const cycStr  = b.cycles_completed
                    ? `<span class="stats-block-meta-item">${t('stats.historyCycles', b.cycles_completed)}</span>` : '';
                const supStr  = b.support_type
                    ? `<span class="stats-block-meta-item">${supportLabel(b)}</span>` : '';
                return `<div class="stats-block-detail-row">
                    <span class="stats-block-detail-num">${bi + 1}</span>
                    <div class="stats-block-detail-body">
                        <span class="stats-block-detail-label">${blockLabel}</span>
                        <div class="stats-block-meta">${bpmStr2}${durStr}${cycStr}${kayda}${supStr}</div>
                    </div>
                </div>`;
            }).join('');

            const detailRow = `<tr id="${detailId}" class="stats-detail-row" style="display:none">
                <td colspan="5" class="stats-detail-cell">
                    <div class="stats-detail-inner">
                        ${blockDetailRows}
                        ${noteHtml}
                    </div>
                </td>
            </tr>`;

            return `<tr class="stats-history-row stats-history-row--expandable" data-detail="${detailId}">
                <td style="white-space:nowrap;font-weight:600">${date}</td>
                <td style="white-space:nowrap;color:var(--text-muted)">${dur}</td>
                <td>${tags}</td>
                <td><span class="stats-expand-btn" title="${t('stats.expandBlocks')}">▶</span></td>
            </tr>${detailRow}`;
        }).join('');

        return `<table class="stats-history-table">
            <thead><tr>
                <th>${t('stats.historyColDate')}</th><th>${t('stats.historyColDur')}</th><th>${t('stats.historyColBlocks')}</th><th></th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
    }

    private bindHistoryNotes(container: HTMLElement): void {
        container.querySelectorAll<HTMLTableRowElement>('.stats-history-row--expandable').forEach(row => {
            row.addEventListener('click', () => {
                const targetId = row.dataset.detail ?? '';
                const detail = document.getElementById(targetId);
                if (!detail) return;
                const isOpen = detail.style.display !== 'none';
                detail.style.display = isOpen ? 'none' : 'table-row';
                const btn = row.querySelector<HTMLElement>('.stats-expand-btn');
                if (btn) btn.classList.toggle('stats-expand-btn--open', !isOpen);
            });
        });
    }

    // ── Próxima medalla ───────────────────────────────────────────────────────

    private buildNextMedalCard(d: UserStats): HTMLElement {
        const otherUser = this.activeUser === 'prashant' ? 'meera' : 'prashant';
        const otherSessions = this.userData[otherUser]?.rawSessions ?? [];
        const medals = computeMedals(d.rawSessions, otherSessions);

        const candidates = medals.filter(m => !m.earned && m.progressPct !== undefined && m.progressPct > 0);
        if (candidates.length === 0) return createElement('div');

        const next = candidates.reduce((best, m) => (m.progressPct! > best.progressPct! ? m : best), candidates[0]);

        const card = this.card();
        card.style.background = 'linear-gradient(135deg, var(--card-bg) 0%, color-mix(in srgb, var(--card-bg) 85%, #f97316 15%) 100%)';
        card.style.borderColor = '#f97316';

        const headerRow = createElement('div', { className: 'medals-header' });
        const titleWrap = createElement('div');
        titleWrap.appendChild(this.cardTitle(t('stats.nextMedalTitle')));
        titleWrap.appendChild(this.cardSub(t('stats.nextMedalSub')));
        headerRow.appendChild(titleWrap);
        card.appendChild(headerRow);

        const body = createElement('div', { className: 'stats-next-medal' });

        const emojiEl = createElement('div', { className: 'stats-next-medal__emoji' }, next.emoji);
        const info    = createElement('div', { className: 'stats-next-medal__info' });
        const name    = createElement('div', { className: 'stats-next-medal__name' }, next.name);
        const desc    = createElement('div', { className: 'stats-next-medal__desc' }, next.desc);

        const progressWrap = createElement('div', { className: 'stats-next-medal__progress-wrap' });
        const progressBar  = createElement('div', { className: 'stats-next-medal__progress-bar' });
        const progressFill = createElement('div', { className: 'stats-next-medal__progress-fill' });
        progressFill.style.width = `${next.progressPct}%`;
        progressBar.appendChild(progressFill);

        const progressText = createElement('span', { className: 'stats-next-medal__progress-text' }, `${next.progress} — ${next.progressPct}%`);
        progressWrap.appendChild(progressBar);
        progressWrap.appendChild(progressText);

        info.appendChild(name);
        info.appendChild(desc);
        info.appendChild(progressWrap);
        body.appendChild(emojiEl);
        body.appendChild(info);
        card.appendChild(body);

        return card;
    }

    // ── Medallas ──────────────────────────────────────────────────────────────

    private buildMedalsCard(d: UserStats): HTMLElement {
        const otherUser = this.activeUser === 'prashant' ? 'meera' : 'prashant';
        const otherSessions = this.userData[otherUser]?.rawSessions ?? [];
        const medals = computeMedals(d.rawSessions, otherSessions);
        const earned = medals.filter(m => m.earned).length;

        const card = this.card();
        const headerRow = createElement('div', { className: 'medals-header' });
        const titleWrap = createElement('div');
        titleWrap.appendChild(this.cardTitle(t('stats.medalsTitle')));
        titleWrap.appendChild(this.cardSub(t('stats.medalsSub', earned, medals.length)));
        headerRow.appendChild(titleWrap);

        const progressWrap = createElement('div', { className: 'medals-progress-wrap' });
        const progressBar = createElement('div', { className: 'medals-progress-bar' });
        const pct = medals.length > 0 ? Math.round((earned / medals.length) * 100) : 0;
        progressBar.style.width = `${pct}%`;
        progressWrap.appendChild(progressBar);
        headerRow.appendChild(progressWrap);
        card.appendChild(headerRow);

        const GROUPS = [
            { label: t('stats.medalsGroupConsistency'), ids: ['first','s5','s10','s15','s25','s50','s100','streak7','streak14','streak30','streak60','streak100','streak365','week4','week8','week12'] },
            { label: t('stats.medalsGroupVolume'),      ids: ['h1','h3','h5','h10','h25','h50','h100','long','marathon'] },
            { label: t('stats.medalsGroupVariety'),     ids: ['explorer', ...ACTIVE_TAAL_IDS, 'allActive','songs5'] },
            { label: t('stats.medalsGroupSpeed'),       ids: ['slow','bpm120','bpm180'] },
            { label: t('stats.medalsGroupJoint'),       ids: ['jugalbandi','duo5','superjugal'] },
        ];
        const byId = Object.fromEntries(medals.map(m => [m.id, m]));

        GROUPS.forEach(group => {
            const groupEl = createElement('div', { className: 'medals-group' });
            groupEl.appendChild(createElement('p', { className: 'medals-group-label' }, group.label));
            const grid = createElement('div', { className: 'medals-grid' });

            group.ids.forEach(id => {
                const m = byId[id];
                if (!m) return;
                const cell = createElement('div', { className: `medals-cell${m.earned ? ' medals-cell--earned' : ''}` });

                const emojiEl = createElement('span', { className: 'medals-emoji' }, m.emoji);
                const nameEl  = createElement('span', { className: 'medals-name' }, m.name);
                const descEl  = createElement('span', { className: 'medals-desc' }, m.earned && m.earnedAt ? m.earnedAt : m.desc);

                cell.appendChild(emojiEl);
                cell.appendChild(nameEl);
                cell.appendChild(descEl);

                if (!m.earned && m.progress !== undefined) {
                    const pWrap = createElement('div', { className: 'medals-cell-progress' });
                    const pText = createElement('span', { className: 'medals-cell-progress__text' }, m.progress);
                    pWrap.appendChild(pText);
                    if (m.progressPct !== undefined && m.progressPct > 0) {
                        const bar  = createElement('div', { className: 'medals-cell-progress__bar' });
                        const fill = createElement('div', { className: 'medals-cell-progress__fill' });
                        fill.style.width = `${m.progressPct}%`;
                        bar.appendChild(fill);
                        pWrap.appendChild(bar);
                    }
                    cell.appendChild(pWrap);
                }

                cell.title = m.earned ? `${m.name} · ${m.earnedAt ?? ''}` : (m.progress ? `${m.desc} · ${m.progress}` : m.desc);
                grid.appendChild(cell);
            });
            groupEl.appendChild(grid);
            card.appendChild(groupEl);
        });

        return card;
    }

    // ── Chart.js ──────────────────────────────────────────────────────────────

    private destroyCharts(): void {
        this.charts.forEach(c => { try { c.destroy(); } catch { /* noop */ } });
        this.charts = [];
        this.weeklyChart = null;
    }

    private mountCharts(d: UserStats): void {
        const gridCol = C.grid();
        const textCol = C.text();
        const cardCol = C.card();

        Chart.defaults.font.family = 'inherit';
        Chart.defaults.font.size   = 12;
        Chart.defaults.color       = textCol;

        this.mountWeeklyChart(d);

        const bpmCanvas = document.getElementById('stats-chart-bpm') as HTMLCanvasElement | null;
        if (bpmCanvas) {
            const bpmEntries = Object.entries(d.bpm);
            this.charts.push(new Chart(bpmCanvas, {
                type: 'line',
                data: {
                    labels: d.weekLabels,
                    datasets: bpmEntries.length > 0
                        ? bpmEntries.map(([name, vals], i) => ({
                            label: name, data: vals,
                            borderColor: BPM_PALETTE[i % BPM_PALETTE.length].line,
                            backgroundColor: BPM_PALETTE[i % BPM_PALETTE.length].bg,
                            borderWidth: 2.5, pointRadius: 3, pointHoverRadius: 7, tension: 0.4, fill: false,
                        }))
                        : [{ label: t('stats.chartNoData'), data: new Array(16).fill(null), borderColor: C.orange, borderWidth: 1.5 }],
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 14, usePointStyle: true } } },
                    scales: {
                        x: { grid: { color: gridCol }, ticks: { maxRotation: 45, font: { size: 10 } } },
                        y: { grid: { color: gridCol }, title: { display: true, text: 'BPM', color: textCol } },
                    },
                },
            }));
        }

        const donutCanvas = document.getElementById('stats-chart-donut') as HTMLCanvasElement | null;
        if (donutCanvas) {
            const entries = Object.entries(d.donut);
            const donutColors = [C.orange, C.blue, C.purple, C.teal, C.amber, '#ec4899'];
            this.charts.push(new Chart(donutCanvas, {
                type: 'doughnut',
                data: {
                    labels: entries.length > 0 ? entries.map(([k]) => k) : [t('stats.donutNoData')],
                    datasets: [{ data: entries.length > 0 ? entries.map(([,v]) => v) : [100], backgroundColor: entries.length > 0 ? donutColors : ['#e2e8f0'], borderWidth: 3, borderColor: cardCol, hoverOffset: 8 }],
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '65%',
                    plugins: {
                        legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 12, usePointStyle: true, font: { size: 11 } } },
                        tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}%` } },
                    },
                },
            }));
        }

        const cyclesCanvas = document.getElementById('stats-chart-cycles') as HTMLCanvasElement | null;
        if (cyclesCanvas && d.cycles.length > 0) {
            const maxCycles = Math.max(...d.cycles);
            this.charts.push(new Chart(cyclesCanvas, {
                type: 'bar',
                data: {
                    labels: d.cycles.map((_, i) => `S${i + 1}`),
                    datasets: [{
                        label: t('stats.chartCyclesTitle'),
                        data: d.cycles,
                        backgroundColor: d.cycles.map(v => v >= maxCycles * 0.8 ? C.orange : C.orangeA),
                        borderColor: C.orange, borderWidth: 1.5, borderRadius: 4, borderSkipped: false,
                    }],
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { color: gridCol } },
                        y: { grid: { color: gridCol }, beginAtZero: true, title: { display: true, text: 'ciclos', color: textCol } },
                    },
                },
            }));
        }
    }
}

// Made with Bob
