/**
 * STATS — Next-medal card and medals grid
 */

import { createElement } from '../../core/utils.js';
import { t } from '../../i18n/index.js';
import type { UserStats } from './statsTypes.js';
import { computeMedals } from './medals.js';
import { cardEl, cardTitle, cardSub } from './statsKPIs.js';

export function buildNextMedalCard(d: UserStats, otherSessions: import('./statsTypes.js').SupabaseSession[]): HTMLElement {
    const medals     = computeMedals(d.rawSessions, otherSessions);
    const candidates = medals.filter(m => !m.earned && m.progressPct !== undefined && m.progressPct > 0);
    if (candidates.length === 0) return createElement('div', {});

    const next = candidates.reduce((best, m) => (m.progressPct! > best.progressPct! ? m : best), candidates[0]);

    const card = cardEl();
    card.style.background  = 'linear-gradient(135deg, var(--card-bg) 0%, color-mix(in srgb, var(--card-bg) 85%, #f97316 15%) 100%)';
    card.style.borderColor = '#f97316';

    const headerRow = createElement('div', { className: 'medals-header' });
    const titleWrap = createElement('div');
    titleWrap.appendChild(cardTitle(t('stats.nextMedalTitle')));
    titleWrap.appendChild(cardSub(t('stats.nextMedalSub')));
    headerRow.appendChild(titleWrap);
    card.appendChild(headerRow);

    const body    = createElement('div', { className: 'stats-next-medal' });
    const emojiEl = createElement('div', { className: 'stats-next-medal__emoji' }, next.emoji);
    const info    = createElement('div', { className: 'stats-next-medal__info' });
    const nameEl  = createElement('div', { className: 'stats-next-medal__name' }, next.name);
    const descEl  = createElement('div', { className: 'stats-next-medal__desc' }, next.desc);
    const pWrap   = createElement('div', { className: 'stats-next-medal__progress-wrap' });
    const pBar    = createElement('div', { className: 'stats-next-medal__progress-bar' });
    const pFill   = createElement('div', { className: 'stats-next-medal__progress-fill' });
    pFill.style.width = `${next.progressPct}%`;
    pBar.appendChild(pFill);
    const pText = createElement('span', { className: 'stats-next-medal__progress-text' }, `${next.progress} — ${next.progressPct}%`);
    pWrap.appendChild(pBar);
    pWrap.appendChild(pText);
    info.appendChild(nameEl);
    info.appendChild(descEl);
    info.appendChild(pWrap);
    body.appendChild(emojiEl);
    body.appendChild(info);
    card.appendChild(body);

    return card;
}

export function buildMedalsCard(
    d: UserStats,
    otherSessions: import('./statsTypes.js').SupabaseSession[],
    medalGroups: { label: string; ids: string[] }[]
): HTMLElement {
    const medals = computeMedals(d.rawSessions, otherSessions);
    const earned = medals.filter(m => m.earned).length;

    const card       = cardEl();
    const headerRow  = createElement('div', { className: 'medals-header' });
    const titleWrap  = createElement('div');
    titleWrap.appendChild(cardTitle(t('stats.medalsTitle')));
    titleWrap.appendChild(cardSub(t('stats.medalsSub', earned, medals.length)));
    headerRow.appendChild(titleWrap);

    const progressWrap = createElement('div', { className: 'medals-progress-wrap' });
    const progressBar  = createElement('div', { className: 'medals-progress-bar' });
    const pct = medals.length > 0 ? Math.round((earned / medals.length) * 100) : 0;
    progressBar.style.width = `${pct}%`;
    progressWrap.appendChild(progressBar);
    headerRow.appendChild(progressWrap);
    card.appendChild(headerRow);

    const byId = Object.fromEntries(medals.map(m => [m.id, m]));

    medalGroups.forEach(group => {
        const groupEl = createElement('div', { className: 'medals-group' });
        groupEl.appendChild(createElement('p', { className: 'medals-group-label' }, group.label));
        const grid = createElement('div', { className: 'medals-grid' });

        group.ids.forEach(id => {
            const m = byId[id];
            if (!m) return;
            const cell    = createElement('div', { className: `medals-cell${m.earned ? ' medals-cell--earned' : ''}` });
            const emojiEl = createElement('span', { className: 'medals-emoji' }, m.emoji);
            const nameEl  = createElement('span', { className: 'medals-name'  }, m.name);
            const descEl  = createElement('span', { className: 'medals-desc'  }, m.desc);
            cell.appendChild(emojiEl);
            cell.appendChild(nameEl);
            cell.appendChild(descEl);
            if (m.earned && m.earnedAt) {
                cell.appendChild(createElement('span', { className: 'medals-date' }, m.earnedAt));
            }
            if (!m.earned && m.progress !== undefined) {
                const pWrap = createElement('div', { className: 'medals-cell-progress' });
                pWrap.appendChild(createElement('span', { className: 'medals-cell-progress__text' }, m.progress));
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
