/**
 * STATS — Medals
 * Computes the full medal list for a user given their session history.
 * Visual metadata (emoji, tag colour) per taal also lives here.
 */

import { TAALS } from '../../data/taals/index.js';
import { t, tArray } from '../../i18n/index.js';
import { gcDateStr, gcTodayStr, gcMondayStr, effectiveSecs, ACTIVE_TAAL_IDS } from './statsData.js';
import type { SupabaseSession, Medal } from './statsTypes.js';

// ── Visual metadata per taal ──────────────────────────────────────────────────

export const TAAL_META: Record<string, { emoji: string; tagCls: string }> = {
    keherwa:    { emoji: '🔔', tagCls: 'stats-tag--orange'  },
    dadra:      { emoji: '🌀', tagCls: 'stats-tag--blue'    },
    rupak:      { emoji: '🎭', tagCls: 'stats-tag--purple'  },
    deepchandi: { emoji: '🌊', tagCls: 'stats-tag--teal'    },
    addha:      { emoji: '🥁', tagCls: 'stats-tag--amber'   },
    teental:    { emoji: '👑', tagCls: 'stats-tag--blue'    },
    ektal:      { emoji: '🔁', tagCls: 'stats-tag--purple'  },
    jhaptal:    { emoji: '⚡', tagCls: 'stats-tag--teal'    },
};

/** Fallback metadata for future taals not yet listed in TAAL_META. */
export const DEFAULT_TAAL_META = { emoji: '🎵', tagCls: 'stats-tag--orange' };

// ── Medal computation ─────────────────────────────────────────────────────────

export function computeMedals(sessions: SupabaseSession[], otherSessions: SupabaseSession[] = []): Medal[] {
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
                mk('maestro',    '🎓', t('stats.medalMaestro.name'),     t('stats.medalMaestro.desc'),     jointCount >= 10, jointSessions[9]?.saved_at,
                    t('stats.medalProgJoint', jointCount, 10), Math.min(100, Math.round((jointCount / 10) * 100))),
                mk('duolegend',  '🌟', t('stats.medalDuoLegend.name'),   t('stats.medalDuoLegend.desc'),   jointMins >= 120,
                    jointSessions.find((_, i) => Math.round(jointSessions.slice(0, i + 1).reduce((s, x) => s + effectiveSecs(x), 0) / 60) >= 120)?.saved_at,
                    t('stats.medalProgJointMins', jointMins, 120), Math.min(100, Math.round((jointMins / 120) * 100))),
                mk('duo10h',     '🕰️', t('stats.medalDuo10h.name'),      t('stats.medalDuo10h.desc'),      jointMins >= 600,
                    jointSessions.find((_, i) => Math.round(jointSessions.slice(0, i + 1).reduce((s, x) => s + effectiveSecs(x), 0) / 60) >= 600)?.saved_at,
                    t('stats.medalProgJointMins', jointMins, 600), Math.min(100, Math.round((jointMins / 600) * 100))),
            ];
        })(),
    ];
}

// Made with Bob
