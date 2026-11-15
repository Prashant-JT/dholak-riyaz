/**
 * STATS — Compare view building blocks (Prashant vs Meera)
 * Head-to-head metric bars and the medals board grouped by who earned each medal.
 */

import { createElement } from '../../core/utils.js';
import { t } from '../../i18n/index.js';
import type { UserStats, Medal } from './statsTypes.js';
import { effectiveSecs } from './statsData.js';
import { cardEl, cardTitle, cardSub } from './statsKPIs.js';

const NAMES = { p: 'Prashant', m: 'Meera' } as const;

/** '63h 22m' / '41m' from minutes. */
function fmtMins(mins: number): string {
    if (mins < 60) return `${mins}m`;
    const rest = mins % 60;
    return `${Math.floor(mins / 60)}h${rest > 0 ? ` ${rest}m` : ''}`;
}

/** Card header: title (+ optional subtitle) on the left, two coloured names on the right. */
function compareHeader(title: string, pLabel: string, mLabel: string, sub?: string): HTMLElement {
    const head = createElement('div', { className: 'cmp-h2h__head' });
    const titleWrap = createElement('div');
    titleWrap.appendChild(cardTitle(title));
    if (sub) titleWrap.appendChild(cardSub(sub));
    head.appendChild(titleWrap);

    const names = createElement('div', { className: 'cmp-h2h__names' });
    names.appendChild(createElement('span', { className: 'cmp-name cmp-name--p' }, pLabel));
    names.appendChild(createElement('span', { className: 'cmp-name cmp-name--m' }, mLabel));
    head.appendChild(names);
    return head;
}

// ── Head-to-head metrics ──────────────────────────────────────────────────────

interface Metric {
    label: string;
    p: number;
    m: number;
    format: (v: number) => string;
}

/**
 * One row per metric: [Prashant value  ████|███  Meera value].
 * Each side's bar is its share of the pair, so the longer side is the leader
 * at a glance; the leader's value is emphasised.
 */
export function buildHeadToHead(p: UserStats, m: UserStats): HTMLElement {
    const totalMins = (d: UserStats): number =>
        Math.round(d.rawSessions.reduce((sum, s) => sum + effectiveSecs(s), 0) / 60);
    const avgMins = (d: UserStats): number =>
        d.kpi.sessions > 0 ? Math.round(totalMins(d) / d.kpi.sessions) : 0;

    const metrics: Metric[] = [
        { label: t('stats.compareKpiSessions'),   p: p.kpi.sessions,   m: m.kpi.sessions,   format: v => String(v) },
        { label: t('stats.compareKpiTime'),       p: totalMins(p),     m: totalMins(m),     format: fmtMins },
        { label: t('stats.compareKpiAvg'),        p: avgMins(p),       m: avgMins(m),       format: v => (v > 0 ? fmtMins(v) : '—') },
        { label: t('stats.compareKpiBpm'),        p: p.kpi.bpm,        m: m.kpi.bpm,        format: v => (v > 0 ? String(v) : '—') },
        { label: t('stats.compareKpiStreak'),     p: p.kpi.streak,     m: m.kpi.streak,     format: v => String(v) },
        { label: t('stats.compareKpiWeekStreak'), p: p.kpi.weekStreak, m: m.kpi.weekStreak, format: v => String(v) },
    ];

    const card = cardEl();
    card.appendChild(compareHeader(t('stats.compareTitleKpi'), NAMES.p, NAMES.m, t('stats.compareSubKpi')));

    const list = createElement('div', { className: 'cmp-h2h' });
    metrics.forEach(metric => {
        const sum  = metric.p + metric.m;
        const pPct = sum > 0 ? (metric.p / sum) * 100 : 50;
        const lead = metric.p === metric.m ? '' : metric.p > metric.m ? 'p' : 'm';

        const row = createElement('div', { className: 'cmp-h2h__row' });
        row.appendChild(createElement('span', { className: 'cmp-h2h__label' }, metric.label));

        const values = createElement('div', { className: 'cmp-h2h__values' });
        values.appendChild(createElement('span', {
            className: `cmp-h2h__val cmp-h2h__val--p${lead === 'p' ? ' cmp-h2h__val--lead' : ''}`,
        }, metric.format(metric.p)));

        const bar = createElement('div', { className: 'cmp-h2h__bar' });
        if (sum > 0) {
            const pBar = createElement('span', { className: 'cmp-h2h__fill cmp-h2h__fill--p' });
            pBar.style.width = `${pPct}%`;
            const mBar = createElement('span', { className: 'cmp-h2h__fill cmp-h2h__fill--m' });
            mBar.style.width = `${100 - pPct}%`;
            bar.appendChild(pBar);
            bar.appendChild(mBar);
        }
        values.appendChild(bar);

        values.appendChild(createElement('span', {
            className: `cmp-h2h__val cmp-h2h__val--m${lead === 'm' ? ' cmp-h2h__val--lead' : ''}`,
        }, metric.format(metric.m)));
        row.appendChild(values);
        list.appendChild(row);
    });
    card.appendChild(list);
    return card;
}

// ── Medals board grouped by who earned them ───────────────────────────────────

export function buildCompareMedals(pm: Medal[], mm: Medal[], orderedIds: string[]): HTMLElement {
    const pById = Object.fromEntries(pm.map(x => [x.id, x]));
    const mById = Object.fromEntries(mm.map(x => [x.id, x]));
    const ids   = orderedIds.filter(id => pById[id] && mById[id]);

    const both  = ids.filter(id => pById[id].earned && mById[id].earned);
    const onlyP = ids.filter(id => pById[id].earned && !mById[id].earned);
    const onlyM = ids.filter(id => !pById[id].earned && mById[id].earned);
    const none  = ids.filter(id => !pById[id].earned && !mById[id].earned);

    const card = cardEl();
    card.appendChild(compareHeader(
        t('stats.compareMedalsTitle'),
        `${NAMES.p} ${both.length + onlyP.length}/${ids.length}`,
        `${NAMES.m} ${both.length + onlyM.length}/${ids.length}`,
    ));

    const sections: { label: string; ids: string[]; cls: string }[] = [
        { label: t('stats.compareMedalsOnlyP'), ids: onlyP, cls: 'p' },
        { label: t('stats.compareMedalsOnlyM'), ids: onlyM, cls: 'm' },
        { label: t('stats.compareMedalsBoth'),  ids: both,  cls: 'both' },
        { label: t('stats.compareMedalsNone'),  ids: none,  cls: 'none' },
    ];

    sections.filter(sec => sec.ids.length > 0).forEach(sec => {
        const group = createElement('div', { className: `cmp-medals__group cmp-medals__group--${sec.cls}` });
        group.appendChild(createElement('p', { className: 'medals-group-label' }, `${sec.label} · ${sec.ids.length}`));
        const chips = createElement('div', { className: 'cmp-medals__chips' });
        sec.ids.forEach(id => {
            const medal = pById[id];
            const chip  = createElement('span', { className: 'cmp-medal-chip' });
            chip.title  = medal.desc;
            chip.appendChild(createElement('span', { className: 'cmp-medal-chip__emoji' }, medal.emoji));
            chip.appendChild(createElement('span', {}, medal.name));
            chips.appendChild(chip);
        });
        group.appendChild(chips);
        card.appendChild(group);
    });

    return card;
}
