/**
 * WIZARD DRAFT & TEMPLATES
 * Persistencia en localStorage: borrador de sesión, plantillas guardadas,
 * serialización de bloques para compartir por URL y badge del sidebar.
 */

import type { SessionBlock, SessionState } from '../../types.js';
import { DEFAULT_TEMPLATES } from '../../data/defaultTemplates.js';

// ─── Draft de sesión en curso ────────────────────────────────────────────────

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

/** Actualiza el badge de "sesión en curso" en el sidebar */
export function updateSessionBadge(): void {
    const badge = document.getElementById('session-active-badge');
    if (!badge) return;
    const draft = loadSessionDraft();
    if (draft) {
        badge.textContent = draft.completed ? '🥁 Sesión pendiente de guardar' : '🥁 Sesión en curso';
        badge.style.display = '';
    } else {
        badge.style.display = 'none';
    }
}

// ─── Plantillas guardadas ─────────────────────────────────────────────────────

export interface SavedTemplate { id: string; name: string; blocks: SessionBlock[]; }

const LS_TEMPLATES_KEY = 'dholak_session_templates';
// Incrementar este número cada vez que se añadan/modifiquen plantillas default.
const LS_SEEDED_KEY    = 'dholak_templates_seeded_v3';

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
    // Reemplaza las default existentes con las nuevas y conserva las del usuario
    const userTemplates = existing.filter(t => !defaultIds.has(t.id));
    saveSavedTemplates([...DEFAULT_TEMPLATES, ...userTemplates]);
    localStorage.setItem(LS_SEEDED_KEY, '1');
}

// ─── Serialización para compartir por URL ────────────────────────────────────

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
