/**
 * STATS VIEW
 * Vista de estadísticas de práctica con gráficas Chart.js.
 * Conectado a Supabase — datos reales de sesiones guardadas.
 */

import { db } from '../core/supabase.js';
import { createElement } from '../core/utils.js';
import { TAALS } from '../data/taals/index.js';
import { CONFIG } from '../core/config.js';
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
    kpi: { sessions: number; time: string; bpm: number; streak: number; weekStreak: number };
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

    const MONTH_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const weekLabels = weekStarts.map(d => `${d.getDate()} ${MONTH_ES[d.getMonth()]}`);

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
                    : (b.taal_name ?? 'Otro');
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
        const date = `${d.getUTCDate()} ${MONTH_ES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
        const dur  = `${Math.round(effectiveSecs(s) / 60)} min`;
        const blocks = s.blocks.map(b =>
            b.type === 'warmup'
                ? 'Warm Up'
                : b.type === 'pickup'
                    ? `Pickup`
                    : (b.taal_name ?? 'Práctica')
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
    for (let m = 3; m >= 0; m--) {
        const gcNow = gcTodayStr();
        const refYear  = parseInt(gcNow.slice(0, 4));
        const refMonth = parseInt(gcNow.slice(5, 7)) - 1 - m;   // puede ser negativo, Date lo normaliza
        const ref = new Date(Date.UTC(refYear, refMonth, 1));
        const daysInMonth = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0)).getUTCDate();
        const days = new Array(daysInMonth).fill(0);

        sessions.forEach(s => {
            const sd = new Date(gcDateStr(s.saved_at) + 'T12:00:00Z');
            if (sd.getUTCFullYear() === ref.getUTCFullYear() && sd.getUTCMonth() === ref.getUTCMonth()) {
                const dayIdx = sd.getUTCDate() - 1;
                const mins = Math.round(effectiveSecs(s) / 60);
                // Minimum level 1 for any recorded session (even short or test sessions)
                const level = mins >= 60 ? 4 : mins >= 30 ? 3 : mins >= 15 ? 2 : mins >= 1 ? 1 : effectiveSecs(s) > 0 ? 1 : 0;
                days[dayIdx] = Math.min(4, days[dayIdx] + level);
            }
        });

        heatmap.push({ label: ref.toLocaleDateString('es-ES', { timeZone: 'UTC', month: 'long' }), days });
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
    let streak = 0;
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
    // Exclude Warm Up and Pickups from the taal insight
    const taalOnlyEntries = Object.entries(donutSecs).filter(([k]) => !k.startsWith('Warm Up') && !k.startsWith('Pickup'));
    const topTaal   = taalOnlyEntries.reduce((best, cur) => cur[1] > best[1] ? cur : best, taalOnlyEntries[0] ?? ['—', 0])[0];
    const leastTaal = taalOnlyEntries.reduce((worst, cur) => cur[1] < worst[1] ? cur : worst, taalOnlyEntries[0] ?? ['—', 0])[0];
    const insight = sessions.length === 0
        ? 'Aún no hay sesiones guardadas. ¡Completa tu primera práctica y guárdala!'
        : taalOnlyEntries.length <= 1
            ? `<strong>Taal más practicado:</strong> ${topTaal}. Prueba a añadir otros taals en tus sesiones para equilibrar tu práctica.`
            : `<strong>Taal más practicado:</strong> ${topTaal}. <strong>A equilibrar:</strong> ${leastTaal} tiene el menor tiempo registrado — prueba a incluirlo más en tus sesiones.`;

    return {
        kpi: { sessions: sessions.length, time: timeStr, bpm: maxBpm, streak, weekStreak },
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
    const MONTH_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const weekLabels: string[] = [];
    for (let i = 15; i >= 0; i--) {
        const d = new Date(now.getTime() - i * MS_WEEK);
        weekLabels.push(`${d.getDate()} ${MONTH_ES[d.getMonth()]}`);
    }
    return {
        kpi: { sessions: 0, time: '0m', bpm: 0, streak: 0, weekStreak: 0 },
        insight: 'Aún no hay sesiones guardadas. ¡Completa tu primera práctica y guárdala!',
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
    orangeA: 'rgba(249,115,22,0.15)',
    blue:    '#3b82f6',
    blueA:   'rgba(59,130,246,0.15)',
    purple:  '#8b5cf6',
    purpleA: 'rgba(139,92,246,0.15)',
    teal:    '#14b8a6',
    tealA:   'rgba(20,184,166,0.15)',
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
    earnedAt?: string;   // human-readable date if earned
    progress?: string;   // progress text for locked cells
    progressPct?: number; // 0-100 for progress bar
}

function computeMedals(sessions: SupabaseSession[], otherSessions: SupabaseSession[] = []): Medal[] {
    const MONTH_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const fmt = (iso: string) => { const d = new Date(iso); return `${d.getDate()} ${MONTH_ES[d.getMonth()]} ${d.getFullYear()}`; };

    // Sessions sorted chronologically
    const sorted = [...sessions].sort((a, b) => a.saved_at.localeCompare(b.saved_at));

    const totalMins = Math.round(sorted.reduce((s, x) => s + effectiveSecs(x), 0) / 60);
    const totalSessions = sorted.length;

    // Maximum daily streak — dates in Canary time
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

    // Maximum weekly streak — weeks in Canary time
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

    // Taals distintos practicados
    const taalsSet = new Set(sorted.flatMap(s => s.blocks.filter(b => b.type === 'practice' && b.taal_name).map(b => b.taal_name!)));
    // Full names of active taals (e.g. 'Keherwa Taal') to compare with taal_name stored in DB
    const ALL_ACTIVE_TAAL_NAMES = ACTIVE_TAAL_IDS.map(id => TAALS[id].name);
    const hasAllActive = ALL_ACTIVE_TAAL_NAMES.every(t => taalsSet.has(t));
    // First session in which each active taal was practised
    const firstSessionByTaal: Record<string, string | undefined> = {};
    ACTIVE_TAAL_IDS.forEach(id => {
        const taalName = TAALS[id].name;
        firstSessionByTaal[id] = sorted.find(s =>
            s.blocks.some(b => b.type === 'practice' && b.taal_name === taalName)
        )?.saved_at;
    });

    // Sessions with a song
    const songSessions = sorted.filter(s => s.blocks.some(b => b.support_type === 'song'));

    // Global maximum BPM
    const maxBpm = sorted.reduce((mx, s) => Math.max(mx, ...s.blocks.map(b => b.bpm_end ?? 0)), 0);

    // Longest session
    const maxSessionMins = sorted.reduce((mx, s) => Math.max(mx, Math.round(effectiveSecs(s) / 60)), 0);

    // Fechas para when-earned
    const firstSession = sorted[0]?.saved_at;
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
    const week4Session     = (() => { let c = 0; for (let i=0;i<sessionWeeks.length;i++) { c = i===0?1:(()=>{const p=new Date(sessionWeeks[i-1]+'T00:00:00Z'); p.setUTCDate(p.getUTCDate()+7); return p.toISOString().slice(0,10)===sessionWeeks[i]?c+1:1;})(); if (c>=4) return sorted.find(s => gcMondayStr(gcDateStr(s.saved_at))===sessionWeeks[i])?.saved_at; } return undefined; })();
    const bpm120Session    = sorted.find(s => s.blocks.some(b => (b.bpm_end ?? 0) >= 120))?.saved_at;
    const bpm180Session    = sorted.find(s => s.blocks.some(b => (b.bpm_end ?? 0) >= 180))?.saved_at;
    const bpm60Session     = sorted.find(s => s.blocks.some(b => b.support_type === 'metronome' && (b.bpm_start ?? 0) <= 60))?.saved_at;
    const explorer3Session = (() => { const seen = new Set<string>(); for (const s of sorted) { s.blocks.forEach(b => { if (b.type==='practice'&&b.taal_name) seen.add(b.taal_name); }); if (seen.size >= 3) return s.saved_at; } return undefined; })();
    const allActiveSession = (() => { const seen = new Set<string>(); for (const s of sorted) { s.blocks.forEach(b => { if (b.type==='practice'&&b.taal_name) seen.add(b.taal_name); }); if (ALL_ACTIVE_TAAL_NAMES.every(t => seen.has(t))) return s.saved_at; } return undefined; })();
    const song5Session     = (() => { let c=0; for (const s of sorted) { if (s.blocks.some(b=>b.support_type==='song')) { c++; if (c>=5) return s.saved_at; } } return undefined; })();
    const session10At      = sorted[9]?.saved_at;
    const session50At      = sorted[49]?.saved_at;

    const mk = (id: string, emoji: string, name: string, desc: string, cond: boolean, when?: string, progress?: string, progressPct?: number): Medal => ({
        id, emoji, name, desc,
        earned: cond,
        earnedAt: cond && when ? fmt(when) : undefined,
        progress: cond ? undefined : progress,
        progressPct: cond ? undefined : progressPct,
    });

    // Racha actual (para celdas de logros no ganadas) — hora canaria
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

    // Racha semanal actual — hora canaria
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
        // Constancia
        mk('first',     '🌱', 'Primera sesión',    'Guardaste tu primera sesión',                    totalSessions >= 1,  firstSession),
        mk('s10',       '🎯', '10 sesiones',        '10 sesiones guardadas',                           totalSessions >= 10, session10At,
            `${totalSessions} de 10 sesiones`, Math.min(100, Math.round((totalSessions / 10) * 100))),
        mk('s50',       '🏅', '50 sesiones',        '50 sesiones guardadas',                           totalSessions >= 50, session50At,
            `${totalSessions} de 50 sesiones`, Math.min(100, Math.round((totalSessions / 50) * 100))),
        mk('streak7',   '🔥', 'Racha de 7 días',    '7 días consecutivos practicando',                maxStreak >= 7,   streak7Session,
            `racha actual: ${currentStreak} día${currentStreak !== 1 ? 's' : ''}`, Math.min(100, Math.round((currentStreak / 7) * 100))),
        mk('streak30',  '💎', 'Racha de 30 días',   '30 días consecutivos sin parar',                 maxStreak >= 30,  streak30Session,
            `racha actual: ${currentStreak} día${currentStreak !== 1 ? 's' : ''}`, Math.min(100, Math.round((currentStreak / 30) * 100))),
        mk('streak60',  '🌟', 'Racha de 60 días',   '60 días consecutivos practicando',               maxStreak >= 60,  streak60Session,
            `racha actual: ${currentStreak} día${currentStreak !== 1 ? 's' : ''}`, Math.min(100, Math.round((currentStreak / 60) * 100))),
        mk('streak100', '👑', 'Racha de 100 días',  '100 días consecutivos sin fallar',               maxStreak >= 100, streak100Session,
            `racha actual: ${currentStreak} día${currentStreak !== 1 ? 's' : ''}`, Math.min(100, Math.round((currentStreak / 100) * 100))),
        mk('streak365', '🎖️', 'Un año entero',      '365 días consecutivos — leyenda absoluta',       maxStreak >= 365, streak365Session,
            `racha actual: ${currentStreak} día${currentStreak !== 1 ? 's' : ''}`, Math.min(100, Math.round((currentStreak / 365) * 100))),
        mk('week4',     '🗓️', '4 semanas seguidas', 'Practicado al menos una vez en 4 semanas seguidas', maxWeekStreak >= 4, week4Session,
            `${currentWeekStreak} de 4 semanas`, Math.min(100, Math.round((currentWeekStreak / 4) * 100))),
        // Volumen
        mk('h1',        '⏱️', 'Primera hora',       'Acumulado total ≥ 1 hora',                        totalMins >= 60,   firstHourSession,
            `${totalMins} de 60 min`, Math.min(100, Math.round((totalMins / 60) * 100))),
        mk('h10',       '🕐', '10 horas',           'Acumulado total ≥ 10 horas',                      totalMins >= 600,  first10hSession,
            `${Math.round(totalMins / 60 * 10) / 10} de 10 h`, Math.min(100, Math.round((totalMins / 600) * 100))),
        mk('h50',       '🏆', '50 horas',           'Acumulado total ≥ 50 horas',                      totalMins >= 3000, first50hSession,
            `${Math.round(totalMins / 60 * 10) / 10} de 50 h`, Math.min(100, Math.round((totalMins / 3000) * 100))),
        mk('h100',      '🥇', '100 horas',          'Acumulado total ≥ 100 horas',                     totalMins >= 6000, first100hSession,
            `${Math.round(totalMins / 60 * 10) / 10} de 100 h`, Math.min(100, Math.round((totalMins / 6000) * 100))),
        mk('long',      '💪', 'Sesión larga',       'Una sesión de al menos 60 minutos',               maxSessionMins >= 60, longSession,
            `máx. sesión: ${maxSessionMins} min`, Math.min(100, Math.round((maxSessionMins / 60) * 100))),
        mk('marathon',  '🦾', 'Maratoniano',        'Una sesión de al menos 90 minutos',               maxSessionMins >= 90, marathonSession,
            `máx. sesión: ${maxSessionMins} min`, Math.min(100, Math.round((maxSessionMins / 90) * 100))),
        // Variety
        mk('explorer',   '🥁', 'Explorador',         'Practicado 3 taals distintos',                     taalsSet.size >= 3,             explorer3Session,
            `${taalsSet.size} de 3 taals`, Math.min(100, Math.round((taalsSet.size / 3) * 100))),
        // "First <Taal>" badges — generated dynamically from ACTIVE_TAAL_IDS
        ...ACTIVE_TAAL_IDS.map(id => {
            const taal    = TAALS[id];
            const meta    = TAAL_META[id] ?? DEFAULT_TAAL_META;
            const firstWord = taal.name.split(' ')[0];   // ej. 'Keherwa', 'Addha'
            const when    = firstSessionByTaal[id];
            return mk(id, meta.emoji, `Primer ${firstWord}`, `Primera sesión practicando ${taal.name}`, when !== undefined, when);
        }),
        mk('allActive',  '🌐', 'Polirítmico',
            `Todos los taals activos: ${ACTIVE_TAAL_IDS.map(id => TAALS[id].name.split(' ')[0]).join(', ')}`,
            hasAllActive, allActiveSession,
            `${ALL_ACTIVE_TAAL_NAMES.filter(t => taalsSet.has(t)).length} de ${ALL_ACTIVE_TAAL_NAMES.length} taals`,
            Math.min(100, Math.round((ALL_ACTIVE_TAAL_NAMES.filter(t => taalsSet.has(t)).length / ALL_ACTIVE_TAAL_NAMES.length) * 100))),
        mk('songs5',     '🎵', 'Melómano',           'Practicado con canción en 5 sesiones',             songSessions.length >= 5,       song5Session,
            `${songSessions.length} de 5 sesiones`, Math.min(100, Math.round((songSessions.length / 5) * 100))),
        // BPM badges
        mk('slow',      '🐢', 'Base sólida',        'Practicado con metrónomo a ≤ 60 BPM',             maxBpm > 0 && bpm60Session !== undefined, bpm60Session),
        mk('bpm120',    '⚡', 'Velocista',          'Alcanzado ≥ 120 BPM en metrónomo',                maxBpm >= 120, bpm120Session,
            `máx. actual: ${maxBpm > 0 ? maxBpm : 0} BPM`, Math.min(100, Math.round((Math.min(maxBpm, 120) / 120) * 100))),
        mk('bpm180',    '🚀', 'Fuego',              'Alcanzado ≥ 180 BPM en metrónomo',                maxBpm >= 180, bpm180Session,
            `máx. actual: ${maxBpm > 0 ? maxBpm : 0} BPM`, Math.min(100, Math.round((Math.min(maxBpm, 180) / 180) * 100))),
        // Joint session badges
        ...(() => {
            if (otherSessions.length === 0) return [];
            const otherTimes    = new Set(otherSessions.map(s => s.saved_at));
            const jointSessions = sorted.filter(s => otherTimes.has(s.saved_at));
            const jointCount    = jointSessions.length;
            const jointMins     = Math.round(jointSessions.reduce((sum, s) => sum + effectiveSecs(s), 0) / 60);
            return [
                mk('jugalbandi', '🤝', 'Jugalbandi',       'Primera sesión conjunta con tu compañero',    jointCount >= 1,  jointSessions[0]?.saved_at),
                mk('duo5',       '🎶', 'Dúo en armonía',   '5 sesiones conjuntas con tu compañero',       jointCount >= 5,  jointSessions[4]?.saved_at,
                    `${jointCount} de 5 sesiones conjuntas`, Math.min(100, Math.round((jointCount / 5) * 100))),
                mk('superjugal', '⚡', 'Super Jugalbandi', '60 min acumulados en sesiones conjuntas',     jointMins  >= 60, jointSessions.find((_, i) => Math.round(jointSessions.slice(0, i + 1).reduce((s, x) => s + effectiveSecs(x), 0) / 60) >= 60)?.saved_at,
                    `${jointMins} de 60 min`, Math.min(100, Math.round((jointMins / 60) * 100))),
            ];
        })(),
    ];
}

// ── View ──────────────────────────────────────────────────────────────────────

export class StatsView implements View {
    private activeUser: string = 'prashant';   // 'prashant' | 'meera' | 'compare'
    private charts: any[] = [];
    private userData: Record<string, UserStats> = {};
    private section!: HTMLElement;
    private weeklyMode: 'weeks' | 'days' = 'weeks';
    private weeklySelectedIdx: number = 15;   // active week index in days mode
    private weeklyChart: any = null;

    public render(): HTMLElement {
        this.section = createElement('section', { id: 'stats', className: 'view-section' });

        // Header
        const header = createElement('div', { className: 'mb-6' });
        header.appendChild(createElement('h2', { className: 'section-title' }, 'Estadísticas'));
        header.appendChild(createElement('p', { className: 'section-subtitle' },
            'Progresión y análisis de práctica · datos reales'));
        this.section.appendChild(header);

        // Selector de usuario + comparar
        const tabsWrap = createElement('div', { className: 'stats-user-tabs' });
        [
            { id: 'prashant', label: 'Prashant' },
            { id: 'meera',    label: 'Meera'    },
            { id: 'compare',  label: 'Comparar' },
        ].forEach(({ id, label }, idx) => {
            const btn = createElement('button', {
                className: `stats-user-tab${idx === 0 ? ' active' : ''}${id === 'compare' ? ' stats-user-tab--compare' : ''}`,
                dataset: { user: id },
            }, label);
            btn.addEventListener('click', () => {
                tabsWrap.querySelectorAll('.stats-user-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeUser = id;
                this.renderContent();
            });
            tabsWrap.appendChild(btn);
        });
        this.section.appendChild(tabsWrap);

        // Dynamic container
        const content = createElement('div', { id: 'stats-content' });
        this.section.appendChild(content);

        // Show loading and load data — pass direct reference
        // to avoid depending on document.getElementById (which fails before mount)
        this.showLoading(content);
        this.loadAndRender(content);

        return this.section;
    }

    // ── Data loading ─────────────────────────────────────────────────────────

    private showLoading(container: HTMLElement): void {
        container.innerHTML = '';
        const wrap = createElement('div', { className: 'stats-loading' });

        const msg = createElement('p', { className: 'stats-loading__msg' }, 'Conectando con Supabase…');
        const barOuter = createElement('div', { className: 'stats-loading__bar-outer' });
        const barInner = createElement('div', { className: 'stats-loading__bar-inner', id: 'stats-progress-bar' });
        barOuter.appendChild(barInner);
        const hint = createElement('p', { className: 'stats-loading__hint' }, 'Esto puede tardar unos segundos la primera vez.');

        wrap.appendChild(msg);
        wrap.appendChild(barOuter);
        wrap.appendChild(hint);
        container.appendChild(wrap);

        // Indeterminate progress animation: advances to ~90% while loading
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
            // Cargar ambos usuarios en paralelo
            const [p, m] = await Promise.all([
                fetchUserStats('prashant').catch((err: unknown) => { console.warn('Stats prashant:', err); return emptyStats(); }),
                fetchUserStats('meera').catch((err: unknown)    => { console.warn('Stats meera:',    err); return emptyStats(); }),
            ]);

            // Completar barra antes de renderizar
            const loadingWrap = content.querySelector('.stats-loading') as any;
            if (loadingWrap?._stopProgress) loadingWrap._stopProgress();

            // Pausa breve para que el usuario vea el 100%
            await new Promise(r => setTimeout(r, 250));

            this.userData = { prashant: p, meera: m };
            this.renderContent();
        } catch (err: unknown) {
            console.error('Error cargando estadísticas:', err);
            content.innerHTML = '';
            const errWrap = createElement('div', { className: 'stats-loading' });
            errWrap.innerHTML = `<p class="stats-loading__msg">Error al conectar con Supabase.</p>
                <p class="stats-loading__hint">Revisa la consola del navegador (F12) para más detalles.</p>`;
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

        const row2 = createElement('div', { className: 'stats-chart-row' });
        row2.appendChild(this.buildChartCard('Evolución de BPM por taal', 'Progresión técnica real', 'stats-chart-bpm', 260, 'stats-canvas-medium'));
        row2.appendChild(this.buildChartCard('Distribución de práctica', 'Tiempo por taal / tipo', 'stats-chart-donut', 260, 'stats-canvas-medium'));
        content.appendChild(row2);

        if (d.cycles.length > 0) {
            content.appendChild(this.buildChartCard('Ciclos completados por sesión', 'Resistencia — últimas sesiones con metrónomo', 'stats-chart-cycles', 190, 'stats-canvas-short'));
        }

        const heatCard = this.card();
        heatCard.appendChild(this.cardTitle('Mapa de actividad'));
        heatCard.appendChild(this.cardSub('Intensidad de práctica por día (minutos)'));
        heatCard.appendChild(createElement('div', { id: 'stats-heatmap' }));
        heatCard.appendChild(this.buildHeatmapLegend());
        content.appendChild(heatCard);

        content.appendChild(this.buildHistoryCard(d));
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

        // Header: title + toggle
        const headerRow = createElement('div', { className: 'stats-weekly-header' });
        const titleWrap = createElement('div');
        titleWrap.appendChild(this.cardTitle('Minutos practicados'));
        const subEl = createElement('p', { className: 'text-muted', id: 'stats-weekly-sub' });
        subEl.style.fontSize     = '0.8rem';
        subEl.style.marginBottom = '0';
        subEl.textContent = 'Últimas 16 semanas';
        titleWrap.appendChild(subEl);
        headerRow.appendChild(titleWrap);

        // Weeks / Days toggle
        const toggle = createElement('div', { className: 'stats-weekly-toggle' });
        const btnWeeks = createElement('button', { className: 'stats-weekly-btn active', id: 'stats-toggle-weeks' }, 'Semanas');
        const btnDays  = createElement('button', { className: 'stats-weekly-btn',        id: 'stats-toggle-days'  }, 'Días');
        toggle.appendChild(btnWeeks);
        toggle.appendChild(btnDays);
        headerRow.appendChild(toggle);
        card.appendChild(headerRow);

        // Selector de semana (oculto en modo "Semanas")
        const weekSel = createElement('div', { className: 'stats-week-selector', id: 'stats-week-selector' });
        weekSel.style.display = 'none';
        const selLabel = createElement('span', { className: 'text-muted' });
        selLabel.style.fontSize = '0.82rem';
        selLabel.textContent = 'Semana:';
        const selPrev = createElement('button', { className: 'stats-week-nav', id: 'stats-week-prev' }, '‹');
        const selNext = createElement('button', { className: 'stats-week-nav', id: 'stats-week-next' }, '›');
        const selCurrent = createElement('span', { className: 'stats-week-label', id: 'stats-week-label' });
        weekSel.appendChild(selLabel);
        weekSel.appendChild(selPrev);
        weekSel.appendChild(selCurrent);
        weekSel.appendChild(selNext);
        card.appendChild(weekSel);

        // Canvas
        const wrap = createElement('div', { className: 'stats-canvas-tall' });
        wrap.style.position = 'relative';
        wrap.style.height   = '230px';
        wrap.appendChild(createElement('canvas', { id: 'stats-chart-weekly' }));
        card.appendChild(wrap);

        // Toggle logic
        const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        const updateSub = () => {
            const subNode = document.getElementById('stats-weekly-sub');
            if (!subNode) return;
            if (this.weeklyMode === 'weeks') {
                subNode.textContent = 'Últimas 16 semanas';
            } else {
                subNode.textContent = `Semana del ${d.weekLabels[this.weeklySelectedIdx]}`;
            }
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
                        label: 'Minutos',
                        data: d.weekly,
                        backgroundColor: d.weekly.map((_, i) => i >= 12 ? C.orange : C.orangeA),
                        borderColor: C.orange, borderWidth: 1.5, borderRadius: 6, borderSkipped: false,
                    },
                    {
                        label: 'Tendencia',
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

        // Restore toggle state if previously in days mode
        if (this.weeklyMode === 'days') {
            const btnDays  = document.getElementById('stats-toggle-days');
            const btnWeeks = document.getElementById('stats-toggle-weeks');
            const weekSel  = document.getElementById('stats-week-selector');
            btnDays?.classList.add('active');
            btnWeeks?.classList.remove('active');
            if (weekSel) weekSel.style.display = 'flex';
            const days = d.weekDays[this.weeklySelectedIdx] ?? new Array(7).fill(0);
            this.weeklyChart.data.labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
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

    // ── KPIs ──────────────────────────────────────────────────────────────────

    // ── Vista comparativa ─────────────────────────────────────────────────────

    private buildCompareView(content: HTMLElement): void {
        const p = this.userData['prashant'] ?? emptyStats();
        const m = this.userData['meera']    ?? emptyStats();

        // ── KPIs lado a lado ──────────────────────────────────────────────────
        const kpiSection = this.card();
        kpiSection.appendChild(this.cardTitle('Estadísticas comparadas'));
        kpiSection.appendChild(this.cardSub('Prashant vs Meera · datos históricos'));

        const kpiDefs = [
            { label: 'Sesiones',     p: String(p.kpi.sessions), m: String(m.kpi.sessions) },
            { label: 'Tiempo total', p: p.kpi.time,             m: m.kpi.time             },
            { label: 'BPM máx.',     p: p.kpi.bpm > 0 ? String(p.kpi.bpm) : '—', m: m.kpi.bpm > 0 ? String(m.kpi.bpm) : '—' },
            { label: 'Racha días',     p: `${p.kpi.streak}d`,           m: `${m.kpi.streak}d`           },
            { label: 'Racha semanas',  p: `${p.kpi.weekStreak}sem`,      m: `${m.kpi.weekStreak}sem`      },
        ];

        const kpiGrid = createElement('div', { className: 'stats-compare-grid' });

        // Cabecera con nombres
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

        // ── Dual weekly chart ──────────────────────────────────────────────────
        const chartCard = this.card();
        chartCard.appendChild(this.cardTitle('Minutos por semana'));
        chartCard.appendChild(this.cardSub('Prashant (naranja) · Meera (azul) · últimas 16 semanas'));
        const wrap = createElement('div', { className: 'stats-canvas-tall' });
        wrap.style.position = 'relative';
        wrap.style.height   = '250px';
        wrap.appendChild(createElement('canvas', { id: 'stats-chart-compare' }));
        chartCard.appendChild(wrap);
        content.appendChild(chartCard);

        // ── Side-by-side distribution ─────────────────────────────────────────
        const distRow = createElement('div', { className: 'stats-chart-row' });
        [
            { title: 'Distribución · Prashant', id: 'stats-chart-compare-donut-p' },
            { title: 'Distribución · Meera',    id: 'stats-chart-compare-donut-m' },
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

        // ── Medallas lado a lado (3 cards en grid) ────────────────────────────
        const pm = computeMedals(p.rawSessions, m.rawSessions);
        const mm = computeMedals(m.rawSessions, p.rawSessions);
        const pmById = Object.fromEntries(pm.map(x => [x.id, x]));
        const mmById = Object.fromEntries(mm.map(x => [x.id, x]));

        const COMPARE_GROUPS = [
            { label: 'Constancia',           ids: ['first','s10','s50','streak7','streak30','streak60','streak100','streak365','week4'] },
            { label: 'Volumen',              ids: ['h1','h10','h50','h100','long','marathon'] },
            { label: 'Variedad + Velocidad', ids: ['explorer', ...ACTIVE_TAAL_IDS, 'allActive','songs5','slow','bpm120','bpm180'] },
            { label: 'Conjunto',             ids: ['jugalbandi','duo5','superjugal'] },
        ];

        // Leyenda una sola vez
        const pEarned = pm.filter(m => m.earned).length;
        const mEarned = mm.filter(m => m.earned).length;
        const total   = pm.length;

        const legendCard = this.card();
        legendCard.style.paddingBottom = '12px';
        legendCard.style.marginBottom  = '8px';
        const legendTitle = createElement('div', { className: 'medals-compare-legend' });
        legendTitle.appendChild(this.cardTitle('Medallas'));
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

        // Grid de 3 cards
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

                // Emoji — do not apply grayscale here, only opacity
                const emojiEl = createElement('span', {
                    className: `medals-cmp-emoji${(!pm_.earned && !mm_.earned) ? ' medals-cmp-emoji--locked' : ''}`,
                }, pm_.emoji);
                cell.appendChild(emojiEl);

                cell.appendChild(createElement('span', { className: 'medals-cmp-name' }, pm_.name));

                // Dos dots de color
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

        // Dual weekly chart
        const compareCanvas = document.getElementById('stats-chart-compare') as HTMLCanvasElement | null;
        if (compareCanvas) {
            this.charts.push(new Chart(compareCanvas, {
                type: 'bar',
                data: {
                    labels: p.weekLabels,
                    datasets: [
                        { label: 'Prashant', data: p.weekly, backgroundColor: C.orangeA, borderColor: C.orange, borderWidth: 1.5, borderRadius: 4, borderSkipped: false },
                        { label: 'Meera',    data: m.weekly, backgroundColor: C.blueA,   borderColor: C.blue,   borderWidth: 1.5, borderRadius: 4, borderSkipped: false },
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

        // Distribution donuts
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
                    labels: entries.length > 0 ? entries.map(([k]) => k) : ['Sin datos'],
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

        const kpis = [
            { label: 'Sesiones totales',   value: String(d.kpi.sessions), sub: 'registradas',  badge: '📊 histórico',  badgeCls: 'stats-badge--up'     },
            { label: 'Tiempo total',       value: d.kpi.time,             sub: 'acumulado',     badge: '⏱ en práctica', badgeCls: 'stats-badge--up'     },
            { label: 'BPM máx. alcanzado', value: d.kpi.bpm > 0 ? String(d.kpi.bpm) : '—', sub: 'mejor marca', badge: '🎯 récord', badgeCls: 'stats-badge--up' },
        ];

        kpis.forEach(k => {
            const card = createElement('div', { className: 'card stats-kpi-card' });
            card.appendChild(createElement('div', { className: 'stats-kpi-label' }, k.label));
            card.appendChild(createElement('div', { className: 'stats-kpi-value' }, k.value));
            card.appendChild(createElement('div', { className: 'stats-kpi-sub'   }, k.sub));
            card.appendChild(createElement('span', { className: `stats-badge ${k.badgeCls}` }, k.badge));
            grid.appendChild(card);
        });

        // Streak — special card with two values: days and weeks
        const streakCard = createElement('div', { className: 'card stats-kpi-card stats-streak-card' });
        streakCard.appendChild(createElement('div', { className: 'stats-kpi-label' }, 'Racha activa'));

        const streakRow = createElement('div', { className: 'stats-streak-row' });

        const dayBlock = createElement('div', { className: 'stats-streak-block' });
        dayBlock.appendChild(createElement('div', { className: 'stats-kpi-value' }, String(d.kpi.streak)));
        dayBlock.appendChild(createElement('div', { className: 'stats-kpi-sub' }, 'días'));
        streakRow.appendChild(dayBlock);

        const divider = createElement('div', { className: 'stats-streak-divider' });
        streakRow.appendChild(divider);

        const weekBlock = createElement('div', { className: 'stats-streak-block' });
        weekBlock.appendChild(createElement('div', { className: 'stats-kpi-value' }, String(d.kpi.weekStreak)));
        weekBlock.appendChild(createElement('div', { className: 'stats-kpi-sub' }, 'semanas'));
        streakRow.appendChild(weekBlock);

        streakCard.appendChild(streakRow);
        const streakBadge = d.kpi.weekStreak > 0
            ? `🔥 ${d.kpi.weekStreak} sem. consecutiva${d.kpi.weekStreak !== 1 ? 's' : ''}`
            : '— sin racha semanal';
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
        // weekly[15] = esta semana, weekly[14] = semana pasada
        const minsThis = d.weekly[15] ?? 0;
        const minsPrev = d.weekly[14] ?? 0;

        // Sesiones esta semana / semana pasada
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
            const t = new Date(s.saved_at).getTime();
            return t >= thisMonday.getTime() && t < thisMonday.getTime() + MS_WEEK;
        });
        const sessionsPrev = d.rawSessions.filter(s => {
            const t = new Date(s.saved_at).getTime();
            return t >= prevMonday.getTime() && t < thisMonday.getTime();
        });

        // Max BPM this week / last week
        const maxBpmOf = (ss: SupabaseSession[]) =>
            ss.flatMap(s => s.blocks.map(b => b.bpm_end ?? 0)).reduce((m, v) => Math.max(m, v), 0);
        const bpmThis = maxBpmOf(sessionsThis);
        const bpmPrev = maxBpmOf(sessionsPrev);

        // Helper: delta with arrow and colour
        const delta = (curr: number, prev: number, unit: string): { text: string; cls: string } => {
            if (prev === 0 && curr === 0) return { text: '—', cls: 'week-cmp-delta--neutral' };
            if (prev === 0) return { text: `+${curr} ${unit}`, cls: 'week-cmp-delta--up' };
            const diff = curr - prev;
            if (diff > 0) return { text: `+${diff} ${unit}`, cls: 'week-cmp-delta--up' };
            if (diff < 0) return { text: `${diff} ${unit}`, cls: 'week-cmp-delta--down' };
            return { text: `= igual`, cls: 'week-cmp-delta--neutral' };
        };

        const minsDelta   = delta(minsThis,              minsPrev,              'min');
        const sessDelta   = delta(sessionsThis.length,   sessionsPrev.length,   'ses.');
        const bpmDelta    = delta(bpmThis,               bpmPrev,               'BPM');

        const fmtMins = (m: number) => m >= 60 ? `${Math.floor(m/60)}h ${m%60 > 0 ? m%60+'m' : ''}`.trim() : `${m}m`;

        const metrics: { label: string; thisVal: string; prevVal: string; delta: { text: string; cls: string } }[] = [
            { label: 'Minutos',  thisVal: fmtMins(minsThis),          prevVal: fmtMins(minsPrev),          delta: minsDelta  },
            { label: 'Sesiones', thisVal: String(sessionsThis.length), prevVal: String(sessionsPrev.length), delta: sessDelta  },
            { label: 'BPM máx', thisVal: bpmThis > 0 ? String(bpmThis) : '—', prevVal: bpmPrev > 0 ? String(bpmPrev) : '—', delta: bpmDelta },
        ];

        const card = this.card();
        const headerRow = createElement('div', { className: 'week-cmp-header' });
        const titleWrap = createElement('div');
        titleWrap.appendChild(this.cardTitle('Esta semana vs semana pasada'));
        titleWrap.appendChild(this.cardSub('Progreso semanal en tiempo real'));
        headerRow.appendChild(titleWrap);

        // Etiquetas de columna
        const colLabels = createElement('div', { className: 'week-cmp-col-labels' });
        colLabels.appendChild(createElement('span', { className: 'week-cmp-col-label week-cmp-col-label--this' }, 'Esta semana'));
        colLabels.appendChild(createElement('span', { className: 'week-cmp-col-label week-cmp-col-label--prev' }, 'Semana pasada'));
        headerRow.appendChild(colLabels);
        card.appendChild(headerRow);

        const grid = createElement('div', { className: 'week-cmp-grid' });
        metrics.forEach(m => {
            const row = createElement('div', { className: 'week-cmp-row' });

            row.appendChild(createElement('span', { className: 'week-cmp-metric-label' }, m.label));

            const thisCell = createElement('div', { className: 'week-cmp-cell week-cmp-cell--this' });
            thisCell.appendChild(createElement('span', { className: 'week-cmp-value' }, m.thisVal));
            thisCell.appendChild(createElement('span', { className: `week-cmp-delta ${m.delta.cls}` }, m.delta.text));
            row.appendChild(thisCell);

            row.appendChild(createElement('div', { className: 'week-cmp-cell week-cmp-cell--prev' },));
            const prevCell = row.lastElementChild as HTMLElement;
            prevCell.appendChild(createElement('span', { className: 'week-cmp-value week-cmp-value--muted' }, m.prevVal));

            grid.appendChild(row);
        });
        card.appendChild(grid);

        return card;
    }

    // ── Heatmap ───────────────────────────────────────────────────────────────

    private buildHeatmapLegend(): HTMLElement {
        const leg = createElement('div', { className: 'stats-hm-legend' });
        leg.appendChild(createElement('span', {}, 'Menos'));
        const cells = createElement('div', { className: 'stats-hm-legend-cells' });
        [0,1,2,3,4].forEach(i => cells.appendChild(createElement('div', { className: `stats-hm-cell stats-hm-${i}` })));
        leg.appendChild(cells);
        leg.appendChild(createElement('span', {}, 'Más'));
        return leg;
    }

    private buildHeatmap(d: UserStats): void {
        const container = document.getElementById('stats-heatmap');
        if (!container) return;
        container.innerHTML = '';

        if (d.heatmap.length === 0) {
            container.textContent = 'Sin datos aún.';
            return;
        }

        d.heatmap.forEach(({ label, days }) => {
            const wrap = createElement('div', { style: { marginBottom: '14px' } });
            const lbl = createElement('div', { className: 'text-muted' });
            Object.assign(lbl.style, { fontSize: '0.7rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' });
            lbl.textContent = label;
            wrap.appendChild(lbl);

            const row = createElement('div', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap' } });
            const tooltips = ['Sin práctica', '~15 min', '~30 min', '~45 min', '~60+ min'];
            days.forEach(val => {
                const cell = createElement('div', { className: `stats-hm-cell stats-hm-${val}` });
                cell.title = tooltips[val] ?? '';
                row.appendChild(cell);
            });
            wrap.appendChild(row);
            container.appendChild(wrap);
        });
    }

    // ── Historial ─────────────────────────────────────────────────────────────

    // ── Historial con filtros ─────────────────────────────────────────────────

    private buildHistoryCard(d: UserStats): HTMLElement {
        const card = this.card();
        card.appendChild(this.cardTitle('Historial de sesiones'));

        // ── Filtros ───────────────────────────────────────────────────────────
        const filterRow = createElement('div', { className: 'stats-hist-filters' });

        // Selector de taal
        const taalSel = createElement('select', { className: 'stats-hist-filter-sel' }) as HTMLSelectElement;
        const taalNames = ['Todos los taals', ...Array.from(
            new Set(d.rawSessions.flatMap(s => s.blocks.map(b => b.taal_name).filter(Boolean)))
        ).sort()];
        taalNames.forEach((name, i) => {
            taalSel.appendChild(createElement('option', { value: i === 0 ? '' : name! }, name!) as HTMLOptionElement);
        });
        filterRow.appendChild(taalSel);

        // Selector de mes
        const MONTH_ES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const monthSel = createElement('select', { className: 'stats-hist-filter-sel' }) as HTMLSelectElement;
        monthSel.appendChild(createElement('option', { value: '' }, 'Todos los meses') as HTMLOptionElement);
        const monthsSeen = new Set<string>();
        d.rawSessions.forEach(s => {
            const gc = gcDateStr(s.saved_at);   // 'YYYY-MM-DD' hora canaria
            monthsSeen.add(`${gc.slice(0,4)}-${String(parseInt(gc.slice(5,7)) - 1).padStart(2,'0')}`);
        });
        [...monthsSeen].sort().reverse().forEach(key => {
            const [yr, mo] = key.split('-');
            monthSel.appendChild(createElement('option', { value: key },
                `${MONTH_ES_FULL[parseInt(mo)]} ${yr}`) as HTMLOptionElement);
        });
        filterRow.appendChild(monthSel);

        // Contador de resultados
        const resultCount = createElement('span', { className: 'stats-hist-count text-muted' });
        filterRow.appendChild(resultCount);

        card.appendChild(filterRow);

        // ── Tabla ─────────────────────────────────────────────────────────────
        const tableWrap = createElement('div', { style: { overflowX: 'auto' } });
        card.appendChild(tableWrap);

        const MONTH_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

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

            // Limitar a 25 resultados
            const shown = filtered.slice(0, 25);
            resultCount.textContent = filtered.length > 25
                ? `Mostrando 25 de ${filtered.length}`
                : `${filtered.length} sesión${filtered.length !== 1 ? 'es' : ''}`;

            // Convertir a formato history — fechas en hora canaria
            const histEntries = shown.map(s => {
                const gcStr = gcDateStr(s.saved_at);
                const date2 = new Date(gcStr + 'T12:00:00Z');
                const date  = `${date2.getUTCDate()} ${MONTH_ES[date2.getUTCMonth()]} ${date2.getUTCFullYear()}`;
                const dur   = `${Math.round(effectiveSecs(s) / 60)} min`;
                const blocks = s.blocks.map(b =>
                    b.type === 'warmup' ? 'Warm Up'
                    : b.type === 'pickup' ? 'Pickup'
                    : (b.taal_name ?? 'Práctica')
                );
                const maxBpm = s.blocks.filter(b => b.bpm_end).reduce((m, b) => Math.max(m, b.bpm_end ?? 0), 0);
                return { date, dur, blocks, bpm: maxBpm > 0 ? String(maxBpm) : '—', notes: s.notes ?? null };
            });

            const fakeD = { ...d, history: histEntries };
            tableWrap.innerHTML = this.buildHistoryHTML(fakeD);
            this.bindHistoryNotes(tableWrap);
        };

        taalSel.addEventListener('change', applyFilters);
        monthSel.addEventListener('change', applyFilters);
        applyFilters();

        return card;
    }

    private buildHistoryHTML(d: UserStats): string {
        if (d.history.length === 0) {
            return '<p class="text-muted text-sm" style="padding:12px 0">Sin sesiones registradas todavía.</p>';
        }

        // Colores de tags derivados de TAAL_META — funciona para cualquier taal activo presente o futuro
        const tagCls = (b: string) => {
            if (b === 'Warm Up') return 'stats-tag--slate';
            if (b === 'Pickup')  return 'stats-tag--slate';
            // Buscar por primera palabra del nombre del taal (ej. 'Keherwa', 'Addha')
            const match = ACTIVE_TAAL_IDS.find(id => TAALS[id].name.startsWith(b));
            return (match ? TAAL_META[match] : undefined)?.tagCls ?? DEFAULT_TAAL_META.tagCls;
        };

        const rows = d.history.map((r, i) => {
            const tags   = r.blocks.map(b => `<span class="stats-tag ${tagCls(b)}">${b}</span>`).join('');
            const noteId = `stats-note-row-${i}`;
            const noteCell = r.notes
                ? `<button class="stats-note-btn" data-target="${noteId}" title="Ver nota">📝</button>`
                : `<span style="color:var(--text-muted)">—</span>`;
            // Escapar el texto de la nota para HTML
            const noteText = r.notes
                ? r.notes.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                : '';
            const noteRow = r.notes
                ? `<tr id="${noteId}" class="stats-note-row" style="display:none">
                       <td colspan="5" class="stats-note-cell">💬 ${noteText}</td>
                   </tr>`
                : '';
            return `<tr class="stats-history-row${r.notes ? ' stats-history-row--has-note' : ''}" data-note="${noteId}">
                <td style="white-space:nowrap;font-weight:600">${r.date}</td>
                <td style="white-space:nowrap;color:var(--text-muted)">${r.dur}</td>
                <td>${tags}</td>
                <td class="stats-col-bpm" style="font-weight:700;color:var(--orange-500)">${r.bpm}</td>
                <td>${noteCell}</td>
            </tr>${noteRow}`;
        }).join('');

        return `<table class="stats-history-table">
            <thead><tr>
                <th>Fecha</th><th>Duración</th><th>Bloques</th>
                <th class="stats-col-bpm">BPM final</th><th>Notas</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
    }

    private bindHistoryNotes(container: HTMLElement): void {
        container.querySelectorAll<HTMLButtonElement>('.stats-note-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = document.getElementById(btn.dataset.target ?? '');
                if (!target) return;
                const isOpen = target.style.display !== 'none';
                target.style.display = isOpen ? 'none' : 'table-row';
                btn.classList.toggle('stats-note-btn--open', !isOpen);
            });
        });
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
        titleWrap.appendChild(this.cardTitle('Medallas'));
        titleWrap.appendChild(this.cardSub(`${earned} de ${medals.length} conseguidas`));
        headerRow.appendChild(titleWrap);

        // Progreso visual
        const progressWrap = createElement('div', { className: 'medals-progress-wrap' });
        const progressBar = createElement('div', { className: 'medals-progress-bar' });
        const pct = medals.length > 0 ? Math.round((earned / medals.length) * 100) : 0;
        progressBar.style.width = `${pct}%`;
        progressWrap.appendChild(progressBar);
        headerRow.appendChild(progressWrap);
        card.appendChild(headerRow);

        // Grid de medallas
        const GROUPS = [
            { label: 'Constancia', ids: ['first','s10','s50','streak7','streak30','streak60','streak100','streak365','week4'] },
            { label: 'Volumen',    ids: ['h1','h10','h50','h100','long','marathon'] },
            { label: 'Variedad',   ids: ['explorer', ...ACTIVE_TAAL_IDS, 'allActive','songs5'] },
            { label: 'Velocidad',  ids: ['slow','bpm120','bpm180'] },
            { label: 'Conjunto',   ids: ['jugalbandi','duo5','superjugal'] },
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

                // Progreso visual para celdas bloqueadas
                if (!m.earned && m.progress !== undefined) {
                    const progressWrap = createElement('div', { className: 'medals-cell-progress' });
                    const progressText = createElement('span', { className: 'medals-cell-progress__text' }, m.progress);
                    progressWrap.appendChild(progressText);
                    if (m.progressPct !== undefined && m.progressPct > 0) {
                        const bar = createElement('div', { className: 'medals-cell-progress__bar' });
                        const fill = createElement('div', { className: 'medals-cell-progress__fill' });
                        fill.style.width = `${m.progressPct}%`;
                        bar.appendChild(fill);
                        progressWrap.appendChild(bar);
                    }
                    cell.appendChild(progressWrap);
                }

                // Tooltip with full description on hover (native title attribute)
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

        // 1. Minutos por semana — delegado a mountWeeklyChart
        this.mountWeeklyChart(d);

        // 2. BPM por taal
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
                        : [{ label: 'Sin datos', data: new Array(16).fill(null), borderColor: C.orange, borderWidth: 1.5 }],
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

        // 3. Donut
        const donutCanvas = document.getElementById('stats-chart-donut') as HTMLCanvasElement | null;
        if (donutCanvas) {
            const entries = Object.entries(d.donut);
            const donutColors = [C.orange, C.blue, C.purple, C.teal, C.amber, '#ec4899'];
            this.charts.push(new Chart(donutCanvas, {
                type: 'doughnut',
                data: {
                    labels: entries.length > 0 ? entries.map(([k]) => k) : ['Sin datos'],
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

        // 4. Ciclos
        const cyclesCanvas = document.getElementById('stats-chart-cycles') as HTMLCanvasElement | null;
        if (cyclesCanvas && d.cycles.length > 0) {
            const maxCycles = Math.max(...d.cycles);
            this.charts.push(new Chart(cyclesCanvas, {
                type: 'bar',
                data: {
                    labels: d.cycles.map((_, i) => `S${i + 1}`),
                    datasets: [{ label: 'Ciclos', data: d.cycles, backgroundColor: d.cycles.map((v, i) => i === d.cycles.length - 1 ? C.orange : v >= maxCycles * 0.85 ? 'rgba(249,115,22,0.55)' : C.orangeA), borderColor: C.orange, borderWidth: 1.5, borderRadius: 5, borderSkipped: false }],
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { x: { grid: { display: false } }, y: { grid: { color: gridCol }, beginAtZero: true, title: { display: true, text: 'ciclos', color: textCol } } },
                },
            }));
        }
    }
}

// Made with Bob
