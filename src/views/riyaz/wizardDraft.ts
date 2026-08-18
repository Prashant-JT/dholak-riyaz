/**
 * WIZARD DRAFT & TEMPLATES
 * localStorage persistence: session draft, saved templates,
 * block serialisation for URL sharing, and sidebar badge.
 */

import { t } from '../../i18n/index.js';
import type { SessionBlock, SessionState } from '../../types.js';
import { DEFAULT_TEMPLATES } from '../../data/defaultTemplates.js';
import { CONFIG } from '../../core/config.js';

// ─── Active session draft ─────────────────────────────────────────────────────

export const LS_DRAFT_KEY = 'dholak_session_draft';

export interface SessionDraft {
    savedAt: number;
    state: SessionState;
    elapsedSecs: number;
    completed?: boolean;
}

export function saveSessionDraft(state: SessionState, blockStartTime: number, completed = false): void {
    const elapsedSecs = completed ? 0 : Math.floor((Date.now() - blockStartTime) / 1000);
    const draft: SessionDraft = { savedAt: Date.now(), state, elapsedSecs, completed };
    try { localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(draft)); } catch { /* no-op */ }
    updateSessionBadge();
}

export function loadSessionDraft(): SessionDraft | null {
    try {
        const raw = localStorage.getItem(LS_DRAFT_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as SessionDraft;
    } catch { return null; }
}

export function clearSessionDraft(): void {
    localStorage.removeItem(LS_DRAFT_KEY);
    updateSessionBadge();
}

/** Updates the "session in progress" badge in the sidebar */
export function updateSessionBadge(): void {
    const badge = document.getElementById('session-active-badge');
    if (!badge) return;
    const draft = loadSessionDraft();
    if (draft) {
        badge.textContent = draft.completed ? t('recovery.badgePending') : t('recovery.badgeInProgress');
        badge.style.display = '';
    } else {
        badge.style.display = 'none';
    }
}

// ─── Saved templates ──────────────────────────────────────────────────────────

export interface SavedTemplate { id: string; name: string; blocks: SessionBlock[]; }

const LS_TEMPLATES_KEY = 'dholak_session_templates';
// Increment CONFIG.LS_SEEDED_KEY every time default templates are added or modified.
const LS_SEEDED_KEY    = CONFIG.LS_SEEDED_KEY;

export function loadSavedTemplates(): SavedTemplate[] {
    try { return JSON.parse(localStorage.getItem(LS_TEMPLATES_KEY) ?? '[]'); } catch { return []; }
}

export function saveSavedTemplates(t: SavedTemplate[]): void {
    localStorage.setItem(LS_TEMPLATES_KEY, JSON.stringify(t));
}

export function seedDefaultTemplates(): void {
    if (localStorage.getItem(LS_SEEDED_KEY)) return;
    const existing = loadSavedTemplates();
    const defaultIds = new Set(DEFAULT_TEMPLATES.map(t => t.id));
    // Replace existing defaults with the new ones and keep user templates
    const userTemplates = existing.filter(t => !defaultIds.has(t.id));
    saveSavedTemplates([...DEFAULT_TEMPLATES, ...userTemplates]);
    localStorage.setItem(LS_SEEDED_KEY, '1');
}

// ─── URL share serialisation ──────────────────────────────────────────────────

type ShareableBlock = Omit<SessionBlock, 'durationSecs' | 'completedAt' | 'cyclesCompleted' | 'bpmEnd'>;

export function blocksToHash(name: string, blocks: ShareableBlock[]): string {
    return btoa(encodeURIComponent(JSON.stringify({ name, blocks })));
}

export function hashToBlocks(hash: string): { name: string; blocks: SessionBlock[] } | null {
    try {
        const payload = JSON.parse(decodeURIComponent(atob(hash)));
        if (typeof payload.name !== 'string' || !Array.isArray(payload.blocks)) return null;
        return payload as { name: string; blocks: SessionBlock[] };
    } catch { return null; }
}
