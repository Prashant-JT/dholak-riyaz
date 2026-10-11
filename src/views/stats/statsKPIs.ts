/**
 * STATS — KPI cards, Insight box, Week-vs-week comparison
 */

import { createElement } from '../../core/utils.js';
import { t, tArray } from '../../i18n/index.js';
import type { UserStats, SupabaseSession } from './statsTypes.js';
import { gcDateStr, gcTodayStr } from './statsData.js';

// ── Shared card helpers ───────────────────────────────────────────────────────

export function cardEl(): HTMLElement {
    const c = createElement('div', { className: 'card' });
    c.style.padding      = '24px';
    c.style.marginBottom = '16px';
    return c;
}

export function cardTitle(text: string): HTMLElement {
    const h = createElement('h4', { className: 'font-bold' }, text);
    h.style.fontSize     = '1rem';
    h.style.marginBottom = '4px';
    return h;
}

export function cardSub(text: string): HTMLElement {
    const p = createElement('p', { className: 'text-muted' });
    p.style.fontSize     = '0.8rem';
    p.style.marginBottom = '16px';
    p.textContent = text;
    return p;
}

// ── effectiveSecs helper (avoids cross-import from statsData) ─────────────────

export function effectiveSecs(s: SupabaseSession): number {
    const fromBlocks = s.blocks.reduce((sum, b) => sum + (b.duration_secs ?? 0), 0);
    return fromBlocks > 0 ? fromBlocks : s.total_secs;
}

// ── KPI grid ──────────────────────────────────────────────────────────────────

export function buildKPIs(d: UserStats): HTMLElement {
    const grid = createElement('div', { className: 'stats-kpi-grid' });

    const avgMins = d.kpi.sessions > 0
        ? Math.round(d.rawSessions.reduce((s, x) => s + effectiveSecs(x), 0) / 60 / d.kpi.sessions)
        : 0;
    const avgStr = avgMins >= 60
        ? `${Math.floor(avgMins / 60)}h ${avgMins % 60 > 0 ? (avgMins % 60) + 'm' : ''}`.trim()
        : `${avgMins}m`;

    const DAY_NAMES_FULL = tArray('stats.dayNames');
    const sessionsByDay  = new Array(7).fill(0);
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

    const nowGC       = new Date(gcTodayStr() + 'T12:00:00Z');
    const thisMonth   = nowGC.getUTCMonth();
    const thisYear    = nowGC.getUTCFullYear();
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
        { label: t('stats.kpiSessions'),     value: String(d.kpi.sessions),                           sub: t('stats.kpiSessionsSub'),              badge: t('stats.kpiSessionsBadge'),              badgeCls: 'stats-badge--up' },
        { label: t('stats.kpiTime'),          value: d.kpi.time,                                       sub: t('stats.kpiTimeSub'),                  badge: t('stats.kpiTimeBadge'),                  badgeCls: 'stats-badge--up' },
        { label: t('stats.kpiAvg'),           value: d.kpi.sessions > 0 ? avgStr : '—',                sub: t('stats.kpiAvgSub'),                   badge: t('stats.kpiAvgBadge'),                   badgeCls: 'stats-badge--up' },
        { label: t('stats.kpiLongest'),       value: d.kpi.sessions > 0 ? maxSessionStr : '—',         sub: t('stats.kpiLongestSub'),               badge: t('stats.kpiLongestBadge'),               badgeCls: 'stats-badge--up' },
        { label: t('stats.kpiBpm'),           value: d.kpi.bpm > 0 ? String(d.kpi.bpm) : '—',         sub: t('stats.kpiBpmSub'),                   badge: t('stats.kpiBpmBadge'),                   badgeCls: 'stats-badge--up' },
        { label: t('stats.kpiBestDay'),       value: bestDayValue,                                      sub: bestDaySub,                             badge: t('stats.kpiBestDayBadge'),               badgeCls: 'stats-badge--up' },
        { label: t('stats.kpiDaysPracticed'), value: d.kpi.sessions > 0 ? String(daysThisMonth) : '—', sub: t('stats.kpiDaysPracticedSub', daysInMonth), badge: t('stats.kpiDaysPracticedBadge'), badgeCls: 'stats-badge--up' },
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
    dayBlock.appendChild(createElement('div', { className: 'stats-kpi-sub'   }, t('stats.streakDays')));
    streakRow.appendChild(dayBlock);
    streakRow.appendChild(createElement('div', { className: 'stats-streak-divider' }));

    const weekBlock = createElement('div', { className: 'stats-streak-block' });
    weekBlock.appendChild(createElement('div', { className: 'stats-kpi-value' }, String(d.kpi.weekStreak)));
    weekBlock.appendChild(createElement('div', { className: 'stats-kpi-sub'   }, t('stats.streakWeeks')));
    streakRow.appendChild(weekBlock);
    streakRow.appendChild(createElement('div', { className: 'stats-streak-divider' }));

    const maxStreakBlock = createElement('div', { className: 'stats-streak-block stats-streak-block--record' });
    maxStreakBlock.appendChild(createElement('div', { className: 'stats-kpi-value stats-streak-record-value' }, String(d.kpi.maxStreak)));
    maxStreakBlock.appendChild(createElement('div', { className: 'stats-kpi-sub' }, t('stats.streakRecord')));
    streakRow.appendChild(maxStreakBlock);

    streakCard.appendChild(streakRow);
    const streakBadge = d.kpi.weekStreak > 0 ? t('stats.streakBadge', d.kpi.weekStreak) : t('stats.streakNone');
    streakCard.appendChild(createElement('span', { className: 'stats-badge stats-badge--streak' }, streakBadge));
    grid.appendChild(streakCard);

    return grid;
}

// ── Insight box ───────────────────────────────────────────────────────────────

export function buildInsight(d: UserStats): HTMLElement {
    const box = createElement('div', { className: 'stats-insight-box' });
    box.innerHTML = `💡 ${d.insight}`;
    return box;
}

// ── This week vs last week ────────────────────────────────────────────────────

export function buildWeekCompare(d: UserStats): HTMLElement {
    const minsThis = d.weekly[15] ?? 0;
    const minsPrev = d.weekly[14] ?? 0;

    const MS_WEEK    = 7 * 24 * 60 * 60 * 1000;
    const now        = new Date();
    const getMonday  = (ref: Date): Date => {
        const day = ref.getDay();
        const result = new Date(ref);
        result.setDate(ref.getDate() - (day === 0 ? 6 : day - 1));
        result.setHours(0, 0, 0, 0);
        return result;
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

    const minsDelta = delta(minsThis,            minsPrev,            'min');
    const sessDelta = delta(sessionsThis.length, sessionsPrev.length, 'ses.');
    const bpmDelta  = delta(bpmThis,             bpmPrev,             'BPM');

    const fmtMins = (mn: number) => mn >= 60 ? `${Math.floor(mn/60)}h ${mn%60 > 0 ? mn%60+'m' : ''}`.trim() : `${mn}m`;

    const metrics = [
        { label: t('stats.weekCmpMinutes'),  thisVal: fmtMins(minsThis),          prevVal: fmtMins(minsPrev),          delta: minsDelta },
        { label: t('stats.weekCmpSessions'), thisVal: String(sessionsThis.length), prevVal: String(sessionsPrev.length), delta: sessDelta },
        { label: t('stats.weekCmpBpm'),      thisVal: bpmThis > 0 ? String(bpmThis) : '—', prevVal: bpmPrev > 0 ? String(bpmPrev) : '—', delta: bpmDelta },
    ];

    const card      = cardEl();
    const headerRow = createElement('div', { className: 'week-cmp-header' });
    const titleWrap = createElement('div');
    titleWrap.appendChild(cardTitle(t('stats.weekCmpTitle')));
    titleWrap.appendChild(cardSub(t('stats.weekCmpSub')));
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
