/**
 * STATS — History card with filters, pagination, expandable block detail rows
 */

import { createElement } from '../../core/utils.js';
import { t, tArray } from '../../i18n/index.js';
import { TAALS } from '../../data/taals/index.js';
import type { UserStats, SupabaseSession, SupabaseBlock } from './statsTypes.js';
import { gcDateStr } from './statsData.js';
import { TAAL_META, DEFAULT_TAAL_META } from './medals.js';
import { ACTIVE_TAAL_IDS } from './statsData.js';
import { cardEl, cardTitle, effectiveSecs } from './statsKPIs.js';
import { CONFIG } from '../../core/config.js';

const GC_TZ = CONFIG.TIMEZONE;

export function buildHistoryCard(d: UserStats): HTMLElement {
    const PAGE_SIZE = 5;
    const card = cardEl();
    card.appendChild(cardTitle(t('stats.historyTitle')));

    const filterRow = createElement('div', { className: 'stats-hist-filters' });

    const taalSel   = createElement('select', { className: 'stats-hist-filter-sel' }) as HTMLSelectElement;
    const taalNames = [t('stats.historyTaalAll'), ...Array.from(
        new Set(d.rawSessions.flatMap(s => s.blocks.map(b => b.taal_name).filter(Boolean)))
    ).sort()];
    taalNames.forEach((name, i) => {
        taalSel.appendChild(createElement('option', { value: i === 0 ? '' : name! }, name!) as HTMLOptionElement);
    });
    filterRow.appendChild(taalSel);

    const MONTH_FULL = tArray('stats.monthsFull');
    const monthSel   = createElement('select', { className: 'stats-hist-filter-sel' }) as HTMLSelectElement;
    monthSel.appendChild(createElement('option', { value: '' }, t('stats.historyMonthAll')) as HTMLOptionElement);
    const monthsSeen = new Set<string>();
    d.rawSessions.forEach(s => {
        const gc = gcDateStr(s.saved_at);
        monthsSeen.add(`${gc.slice(0, 4)}-${String(parseInt(gc.slice(5, 7)) - 1).padStart(2, '0')}`);
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

    const tableWrap  = createElement('div', { style: { overflowX: 'auto' } });
    card.appendChild(tableWrap);

    const pagination = createElement('div', { className: 'stats-hist-pagination' });
    card.appendChild(pagination);

    const MONTH_SHORT = tArray('stats.monthsShort');
    let currentPage   = 0;

    const renderPage = (filtered: SupabaseSession[]) => {
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        if (currentPage >= totalPages) currentPage = totalPages - 1;
        const shown = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

        const start = filtered.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;
        const end   = Math.min((currentPage + 1) * PAGE_SIZE, filtered.length);
        resultCount.textContent = filtered.length === 0
            ? t('stats.historyCountZero')
            : t('stats.historyCount', start, end, filtered.length);

        tableWrap.innerHTML = buildHistoryHTML(shown, MONTH_SHORT);
        bindHistoryNotes(tableWrap);

        pagination.innerHTML = '';
        if (totalPages <= 1) return;

        const prevBtn = createElement('button', { className: `stats-page-btn${currentPage === 0 ? ' stats-page-btn--disabled' : ''}` }, '‹');
        if (currentPage > 0) {
            prevBtn.addEventListener('click', () => { currentPage--; renderPage(filtered); });
        }
        pagination.appendChild(prevBtn);

        const range = 2;
        const from  = Math.max(0, currentPage - range);
        const to    = Math.min(totalPages - 1, currentPage + range);
        if (from > 0) pagination.appendChild(createElement('span', { className: 'stats-page-ellipsis' }, '…'));
        for (let pg = from; pg <= to; pg++) {
            const btn  = createElement('button', {
                className: `stats-page-btn${pg === currentPage ? ' stats-page-btn--active' : ''}`
            }, String(pg + 1));
            const page = pg;
            btn.addEventListener('click', () => { currentPage = page; renderPage(filtered); });
            pagination.appendChild(btn);
        }
        if (to < totalPages - 1) pagination.appendChild(createElement('span', { className: 'stats-page-ellipsis' }, '…'));

        const nextBtn = createElement('button', { className: `stats-page-btn${currentPage === totalPages - 1 ? ' stats-page-btn--disabled' : ''}` }, '›');
        if (currentPage < totalPages - 1) {
            nextBtn.addEventListener('click', () => { currentPage++; renderPage(filtered); });
        }
        pagination.appendChild(nextBtn);
    };

    const applyFilters = () => {
        const taalFilter  = taalSel.value;
        const monthFilter = monthSel.value;
        let filtered = [...d.rawSessions].reverse();
        if (taalFilter) {
            filtered = filtered.filter(s => s.blocks.some(b => b.taal_name === taalFilter));
        }
        if (monthFilter) {
            const [yr, mo] = monthFilter.split('-').map(Number);
            filtered = filtered.filter(s => {
                const gc = gcDateStr(s.saved_at);
                return parseInt(gc.slice(0, 4)) === yr && parseInt(gc.slice(5, 7)) - 1 === mo;
            });
        }
        currentPage = 0;
        renderPage(filtered);
    };

    taalSel.addEventListener('change', applyFilters);
    monthSel.addEventListener('change', applyFilters);
    applyFilters();

    return card;
}

export function buildHistoryHTML(sessions: SupabaseSession[], monthNames: string[]): string {
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

    const rows = sessions.map((s: import('./statsTypes.js').SupabaseSession, i: number) => {
        const gcStr  = gcDateStr(s.saved_at);
        const date2  = new Date(gcStr + 'T12:00:00Z');
        const date   = `${date2.getUTCDate()} ${monthNames[date2.getUTCMonth()]} ${date2.getUTCFullYear()}`;
        const timeStr = new Intl.DateTimeFormat('en-GB', {
            timeZone: GC_TZ, hour: '2-digit', minute: '2-digit', hour12: false
        }).format(new Date(s.saved_at));
        const dur = `${Math.round(effectiveSecs(s) / 60)} min`;

        const blockNames = s.blocks.map(b =>
            b.type === 'warmup'  ? t('stats.historyWarmUp')
            : b.type === 'pickup' ? t('stats.historyPickup')
            : (b.taal_name ?? t('stats.historyPractice'))
        );
        const tags = blockNames.map(b => `<span class="stats-tag ${tagCls(b)}">${b}</span>`).join('');

        const noteText = s.notes
            ? s.notes.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            : '';
        const noteHtml = s.notes ? `<div class="stats-block-note">💬 ${noteText}</div>` : '';

        const detailId = `stats-detail-row-${i}`;
        const blockDetailRows = s.blocks.map((b, bi) => {
            const blockLabel = b.type === 'warmup' ? t('stats.historyWarmUp')
                : b.type === 'pickup' ? `${t('stats.historyPickup')}: ${b.pickup_name ?? ''}`
                : `${b.taal_name ?? t('stats.historyPractice')}${b.variation_name ? ` · ${b.variation_name}` : ''}`;
            const kayda  = b.kayda_name ? `<span class="stats-block-meta-item">📋 ${b.kayda_name}</span>` : '';
            const bpmStr = (b.bpm_start || b.bpm_end)
                ? `<span class="stats-block-meta-item">🎯 ${b.bpm_start ?? '?'} → ${b.bpm_end ?? '?'} BPM</span>` : '';
            const durStr = b.duration_secs
                ? `<span class="stats-block-meta-item">⏱ ${Math.round(b.duration_secs / 60)} min</span>` : '';
            const cycStr = b.cycles_completed
                ? `<span class="stats-block-meta-item">${t('stats.historyCycles', b.cycles_completed)}</span>` : '';
            const supStr = b.support_type
                ? `<span class="stats-block-meta-item">${supportLabel(b)}</span>` : '';
            return `<div class="stats-block-detail-row">
                    <span class="stats-block-detail-num">${bi + 1}</span>
                    <div class="stats-block-detail-body">
                        <span class="stats-block-detail-label">${blockLabel}</span>
                        <div class="stats-block-meta">${bpmStr}${durStr}${cycStr}${kayda}${supStr}</div>
                    </div>
                </div>`;
        }).join('');

        const detailRow = `<tr id="${detailId}" class="stats-detail-row" style="display:none">
                <td colspan="5" class="stats-detail-cell">
                    <div class="stats-detail-inner">${blockDetailRows}${noteHtml}</div>
                </td>
            </tr>`;

        return `<tr class="stats-history-row stats-history-row--expandable" data-detail="${detailId}">
                <td style="white-space:nowrap;font-weight:600">${date}<br><span style="font-weight:400;font-size:0.75rem;color:var(--text-muted)">${t('stats.historyTimeAt')} ${timeStr}</span></td>
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

export function bindHistoryNotes(container: HTMLElement): void {
    container.querySelectorAll<HTMLTableRowElement>('.stats-history-row--expandable').forEach(row => {
        row.addEventListener('click', () => {
            const targetId = row.dataset.detail ?? '';
            const detail   = document.getElementById(targetId);
            if (!detail) return;
            const isOpen = detail.style.display !== 'none';
            detail.style.display = isOpen ? 'none' : 'table-row';
            const btn = row.querySelector<HTMLElement>('.stats-expand-btn');
            if (btn) btn.classList.toggle('stats-expand-btn--open', !isOpen);
        });
    });
}
