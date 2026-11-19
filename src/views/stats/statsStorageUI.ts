/**
 * STATS — Supabase space used: warning banner and usage card
 */

import { createElement } from '../../core/utils.js';
import { t, getLang } from '../../i18n/index.js';
import type { StorageUsage } from './statsTypes.js';
import {
    RECORDINGS_LIMIT_BYTES, DB_LIMIT_BYTES, STORAGE_WARN_PCT, usedPct, daysUntilFull, worstPct,
} from './statsStorage.js';
import { cardEl, cardTitle, cardSub } from './statsKPIs.js';

function formatBytes(bytes: number): string {
    const locale = getLang() === 'es' ? 'es-ES' : 'en-GB';
    const gb = bytes / 1024 ** 3;
    if (gb >= 1) return `${gb.toLocaleString(locale, { maximumFractionDigits: 2 })} GB`;
    const mb = bytes / 1024 ** 2;
    return `${mb.toLocaleString(locale, { maximumFractionDigits: mb < 10 ? 1 : 0 })} MB`;
}

/** Shown above the KPIs when recordings or the database pass the warning threshold. */
export function buildStorageWarning(u: StorageUsage | null): HTMLElement | null {
    if (!u) return null;
    const pct = worstPct(u);
    if (pct < STORAGE_WARN_PCT) return null;
    return createElement('p', {
        className: `storage-warn${pct >= 95 ? ' storage-warn--critical' : ''}`, role: 'status',
    }, t('stats.storageWarn', pct));
}

export function buildStorageCard(u: StorageUsage | null): HTMLElement | null {
    if (!u) return null;
    const card = cardEl();
    card.appendChild(cardTitle(t('stats.storageTitle')));
    card.appendChild(cardSub(t('stats.storageSub')));

    card.appendChild(buildMeter(t('stats.storageRecordings', u.recordingsCount), u.recordingsBytes, RECORDINGS_LIMIT_BYTES));
    card.appendChild(buildMeter(t('stats.storageDb'), u.dbBytes, DB_LIMIT_BYTES));

    const days = daysUntilFull(u.recordingsBytes, u.recordings30dBytes, RECORDINGS_LIMIT_BYTES);
    const forecast = days === null ? t('stats.storageNoGrowth')
        : days === 0 ? t('stats.storageFull')
        : days > 365 ? t('stats.storageYears')
        : t('stats.storageDaysLeft', days, formatBytes(u.recordings30dBytes));
    card.appendChild(createElement('p', { className: 'storage-forecast text-muted' }, forecast));
    return card;
}

function buildMeter(label: string, bytes: number, limit: number): HTMLElement {
    const pct = usedPct(bytes, limit);
    const level = pct >= 95 ? ' storage-meter--critical' : pct >= STORAGE_WARN_PCT ? ' storage-meter--warn' : '';
    const wrap = createElement('div', { className: `storage-meter${level}` });

    const head = createElement('div', { className: 'storage-meter__head' });
    head.appendChild(createElement('span', { className: 'storage-meter__label' }, label));
    head.appendChild(createElement('span', { className: 'storage-meter__value' },
        t('stats.storageOf', formatBytes(bytes), formatBytes(limit), pct)));
    wrap.appendChild(head);

    const track = createElement('div', {
        className: 'storage-meter__track', role: 'progressbar',
        'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': label,
    });
    const fill = createElement('div', { className: 'storage-meter__fill' });
    // At least a sliver so a tiny usage is still visible
    fill.style.width = `${bytes > 0 ? Math.max(pct, 1) : 0}%`;
    track.appendChild(fill);
    wrap.appendChild(track);
    return wrap;
}
