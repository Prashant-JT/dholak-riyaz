/**
 * STATS — Heatmap card
 */

import { createElement } from '../../core/utils.js';
import { t, tArray } from '../../i18n/index.js';
import type { UserStats } from './statsTypes.js';

export function buildHeatmapLegend(): HTMLElement {
    const leg   = createElement('div', { className: 'stats-hm-legend' });
    const cells = createElement('div', { className: 'stats-hm-legend-cells' });
    leg.appendChild(createElement('span', {}, t('stats.heatmapLess')));
    [0, 1, 2, 3, 4].forEach(i => cells.appendChild(createElement('div', { className: `stats-hm-cell stats-hm-${i}` })));
    leg.appendChild(cells);
    leg.appendChild(createElement('span', {}, t('stats.heatmapMore')));
    return leg;
}

export function buildHeatmap(d: UserStats): void {
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
        const lbl  = createElement('div', { className: 'text-muted' });
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
