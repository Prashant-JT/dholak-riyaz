/**
 * SESSION WIZARD VIEW
 * Módulo de sesiones de Riyaz guiadas e interactivas.
 * Tres pasos: Configurar → Practicar (bloque a bloque) → Resumen
 */

import { db } from '../../core/supabase.js';
import { createElement, applyBolIndicators, bolsHaveIndicators, createBolIndicatorsLegend } from '../../core/utils.js';
import { TAALS } from '../../data/taals/index.js';
import { KAYDAS } from '../../data/kaydas.js';
import { LEHRAS } from '../../data/lehras.js';
import { SONGS } from '../../data/songs.js';
import { FILLERS } from '../../data/fillers.js';
// FILLERS used for pickup blocks
import { MetronomeEngine } from '../../components/metronome.js';
import type { View, SessionBlock, SessionState, Matra } from '../../types.js';
import { DEFAULT_TEMPLATES } from '../../data/defaultTemplates.js';

/** Divide un array en grupos de tamaño n */
function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
}

// Mapeo de taalId → prefijo del campo taal en SONGS
const TAAL_SONG_PREFIXES: Record<string, string> = {
    keherwa:    'Keherwa',
    dadra:      'Dadra',
    rupak:      'Rupak',
    deepchandi: 'Deepchandi',
};

/** Calcula el hash SHA-256 de un string usando la Web Crypto API nativa del navegador */
async function hashPassword(plain: string): Promise<string> {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Draft de sesión en curso (recuperación tras recarga) ──────────────────
const LS_DRAFT_KEY = 'dholak_session_draft';

interface SessionDraft {
    savedAt: number;            // timestamp para mostrar "hace X min"
    state: SessionState;
    elapsedSecs: number;        // segundos ya transcurridos en el bloque actual al guardar
}

function saveSessionDraft(state: SessionState, blockStartTime: number): void {
    const elapsedSecs = Math.floor((Date.now() - blockStartTime) / 1000);
    const draft: SessionDraft = { savedAt: Date.now(), state, elapsedSecs };
    try { localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(draft)); } catch { /* no-op */ }
}

function loadSessionDraft(): SessionDraft | null {
    try {
        const raw = localStorage.getItem(LS_DRAFT_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as SessionDraft;
    } catch { return null; }
}

function clearSessionDraft(): void {
    localStorage.removeItem(LS_DRAFT_KEY);
}

// ─── Plantillas guardadas en localStorage ──────────────────────────────────
interface SavedTemplate { id: string; name: string; blocks: SessionBlock[]; }
const LS_TEMPLATES_KEY = 'dholak_session_templates';
const LS_SEEDED_KEY    = 'dholak_templates_seeded_v1';

function loadSavedTemplates(): SavedTemplate[] {
    try { return JSON.parse(localStorage.getItem(LS_TEMPLATES_KEY) ?? '[]'); } catch { return []; }
}
function saveSavedTemplates(t: SavedTemplate[]): void {
    localStorage.setItem(LS_TEMPLATES_KEY, JSON.stringify(t));
}
/** Inyecta plantillas por defecto la primera vez */
function seedDefaultTemplates(): void {
    if (localStorage.getItem(LS_SEEDED_KEY)) return;
    const existing = loadSavedTemplates();
    const defaultIds = new Set(DEFAULT_TEMPLATES.map(t => t.id));
    if (!existing.some(t => defaultIds.has(t.id))) {
        saveSavedTemplates([...DEFAULT_TEMPLATES, ...existing]);
    }
    localStorage.setItem(LS_SEEDED_KEY, '1');
}

// ─── Serialización de bloques para URL ─────────────────────────────────────
/** Campos que se incluyen en la URL (excluye resultados de ejecución) */
type ShareableBlock = Omit<SessionBlock, 'durationSecs'|'completedAt'|'cyclesCompleted'|'bpmEnd'>;

function blocksToHash(name: string, blocks: ShareableBlock[]): string {
    const payload = JSON.stringify({ name, blocks });
    return btoa(encodeURIComponent(payload));
}

function hashToBlocks(hash: string): { name: string; blocks: SessionBlock[] } | null {
    try {
        const payload = JSON.parse(decodeURIComponent(atob(hash)));
        if (typeof payload.name !== 'string' || !Array.isArray(payload.blocks)) return null;
        return payload as { name: string; blocks: SessionBlock[] };
    } catch { return null; }
}

export class SessionWizardView implements View {
    private container!: HTMLElement;
    private sessionState!: SessionState;
    private metronome: MetronomeEngine | null = null;
    private timerInterval: number | null = null;
    private blockStartTime: number = 0;
    private cycleCount: number = 0;

    public render(): HTMLElement {
        seedDefaultTemplates();
        this.container = createElement('section', {
            id: 'riyaz',
            className: 'view-section'
        });

        // 1. Link compartido tiene prioridad absoluta
        const hashParam = this.extractShareHash();
        if (hashParam) {
            const parsed = hashToBlocks(hashParam);
            this.renderStep1([], parsed ?? null);
            return this.container;
        }

        // 2. Recuperar sesión interrumpida
        const draft = loadSessionDraft();
        if (draft) {
            this.renderDraftRecovery(draft);
            return this.container;
        }

        this.renderStep1();
        return this.container;
    }

    /** Banner de recuperación de sesión interrumpida */
    private renderDraftRecovery(draft: SessionDraft): void {
        this.container.innerHTML = '';

        const elapsedMin = Math.round((Date.now() - draft.savedAt) / 60000);
        const timeLabel = elapsedMin < 1 ? 'hace menos de 1 min'
            : elapsedMin === 1 ? 'hace 1 min'
            : `hace ${elapsedMin} min`;

        const card = createElement('div', { className: 'session-draft-recovery' });
        card.appendChild(createElement('div', { className: 'session-draft-recovery__icon' }, '🔄'));
        card.appendChild(createElement('h3', { className: 'session-draft-recovery__title' }, 'Sesión interrumpida'));
        card.appendChild(createElement('p', { className: 'session-draft-recovery__meta' },
            `${draft.state.blocks.length} bloque${draft.state.blocks.length !== 1 ? 's' : ''} · Bloque ${draft.state.currentBlockIndex + 1} en curso · ${timeLabel}`));

        // Lista de bloques
        const list = createElement('ul', { className: 'session-draft-recovery__list' });
        draft.state.blocks.forEach((b, i) => {
            const isCurrent = i === draft.state.currentBlockIndex;
            const label = b.type === 'warmup'
                ? `Warm Up — ${b.kaydaName ?? ''}`
                : b.type === 'pickup'
                    ? `Pickup — ${b.pickupName ?? ''}`
                    : `${b.taalName ?? ''} · ${b.variationName ?? ''}`;
            const li = createElement('li', { className: isCurrent ? 'session-draft-recovery__list-item--current' : '' },
                `${isCurrent ? '▶ ' : ''}${label}${b.durationSecs ? ` (${Math.floor(b.durationSecs / 60)}:${String(b.durationSecs % 60).padStart(2,'0')})` : ''}`);
            list.appendChild(li);
        });
        card.appendChild(list);

        const actions = createElement('div', { className: 'session-draft-recovery__actions' });

        const continueBtn = createElement('button', { className: 'btn-primary' }, '▶ Continuar sesión');
        continueBtn.addEventListener('click', () => {
            this.sessionState = draft.state;
            // Ajustar blockStartTime para que el timer continúe desde donde se pausó
            this.blockStartTime = Date.now() - draft.elapsedSecs * 1000;
            this.renderStep2();
        });
        actions.appendChild(continueBtn);

        const discardBtn = createElement('button', { className: 'session-draft-recovery__discard' }, 'Descartar y empezar de nuevo');
        discardBtn.addEventListener('click', () => {
            clearSessionDraft();
            this.renderStep1();
        });
        actions.appendChild(discardBtn);

        card.appendChild(actions);
        this.container.appendChild(card);
    }

    /** Extrae el valor de #share=... de la URL y limpia el hash */
    private extractShareHash(): string | null {
        const hash = window.location.hash;
        const prefix = '#share=';
        if (!hash.startsWith(prefix)) return null;
        const value = hash.slice(prefix.length);
        history.replaceState(null, '', window.location.pathname + window.location.search);
        return value || null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASO 1 — Configurador de sesión
    // ─────────────────────────────────────────────────────────────────────────

    private renderStep1(existingBlocks: SessionBlock[] = [], incomingShare: { name: string; blocks: SessionBlock[] } | null = null): void {
        this.container.innerHTML = '';

        // Header
        const header = createElement('div', { className: 'mb-6' });
        header.appendChild(createElement('h2', { className: 'section-title' }, 'Nueva Sesión de Riyaz'));
        header.appendChild(createElement('p', { className: 'section-subtitle' },
            'Configura tu sesión añadiendo bloques de práctica'));
        this.container.appendChild(header);

        // ── Modal de sesión compartida recibida ─────────────────────────────
        if (incomingShare) {
            this.container.appendChild(this.renderShareModal(incomingShare));
            return; // el modal tiene sus propios botones para continuar
        }

        // ── Panel de plantillas guardadas ───────────────────────────────────
        this.container.appendChild(this.renderTemplatesPanel(existingBlocks));

        // ── Resumen en vivo + botón compartir ───────────────────────────────
        if (existingBlocks.length > 0) {
            this.container.appendChild(this.renderPlanBar(existingBlocks));
        }

        // Lista de bloques con botones ↑↓
        const blockList = createElement('div', { id: 'block-list', className: 'mb-4' });
        existingBlocks.forEach((block, i) => {
            blockList.appendChild(this.createBlockSummaryCard(block, i, existingBlocks));
        });
        this.container.appendChild(blockList);

        // Formulario para añadir Warm Up (si no existe ya)
        const hasWarmUp = existingBlocks.some(b => b.type === 'warmup');
        if (!hasWarmUp) {
            this.container.appendChild(this.createWarmUpForm(existingBlocks));
        }

        // Formulario para añadir bloque de práctica
        this.container.appendChild(this.createPracticeBlockForm(existingBlocks));

        // Formulario para añadir bloque de pickup
        this.container.appendChild(this.createPickupBlockForm(existingBlocks));

        // Botón Comenzar
        const canStart = existingBlocks.length > 0;
        const startBtn = createElement('button', {
            className: canStart ? 'btn-primary session-start-btn' : 'btn-secondary session-start-btn',
            style: { opacity: canStart ? '1' : '0.45', cursor: canStart ? 'pointer' : 'not-allowed' }
        }, canStart
            ? `▶ Comenzar sesión · ${existingBlocks.length} bloque${existingBlocks.length !== 1 ? 's' : ''}`
            : 'Añade al menos un bloque para empezar');

        if (canStart) {
            startBtn.addEventListener('click', () => this.startSession(existingBlocks));
        }
        this.container.appendChild(startBtn);
    }

    // ── Barra de resumen en vivo + botón compartir ──────────────────────────
    private renderPlanBar(blocks: SessionBlock[]): HTMLElement {
        const bar = createElement('div', { className: 'session-plan-bar mb-4' });

        const chips = createElement('div', { className: 'session-plan-chips' });
        blocks.forEach(b => {
            const chip = createElement('span', {
                className: b.type === 'warmup' ? 'session-plan-chip session-plan-chip--warmup' : 'session-plan-chip'
            });
            if (b.type === 'warmup') {
                chip.textContent = '🥁 Warm Up';
            } else {
                const ref = b.supportType === 'metronome'
                    ? `${b.bpmStart ?? 120} BPM`
                    : b.supportRef
                        ? (b.supportRef.length > 20 ? b.supportRef.slice(0, 18) + '…' : b.supportRef)
                        : '';
                chip.textContent = `${b.taalName ?? b.taalId ?? '—'}${ref ? ' · ' + ref : ''}`;
            }
            chips.appendChild(chip);
        });
        bar.appendChild(chips);

        // Botón compartir
        const shareBtn = createElement('button', { className: 'session-share-btn', title: 'Generar link para compartir' }, '📤');
        shareBtn.addEventListener('click', () => this.showSharePopup(blocks, shareBtn));
        bar.appendChild(shareBtn);
        return bar;
    }

    /** Muestra el popup con la URL copiable y opción de nombre */
    private showSharePopup(blocks: SessionBlock[], anchor: HTMLElement): void {
        document.querySelector('.session-share-popup')?.remove();

        const popup = createElement('div', { className: 'session-share-popup' });

        popup.appendChild(createElement('p', { className: 'session-share-popup__label' }, 'Nombre de la sesión:'));
        const nameInput = createElement('input', {
            type: 'text',
            placeholder: 'Ej: Foco Keherwa',
            className: 'session-share-popup__input',
        }) as HTMLInputElement;
        popup.appendChild(nameInput);

        const genBtn = createElement('button', { className: 'btn-primary session-share-popup__gen' }, '📤 Generar y copiar link') as HTMLButtonElement;
        genBtn.addEventListener('click', () => {
            const name = nameInput.value.trim() || 'Sesión compartida';
            const hash = blocksToHash(name, blocks);
            const url = `${window.location.origin}${window.location.pathname}#share=${hash}`;
            navigator.clipboard.writeText(url).then(() => {
                genBtn.textContent = '✓ Link copiado';
                setTimeout(() => { genBtn.textContent = '📤 Generar y copiar link'; }, 2500);
            });
        });
        popup.appendChild(genBtn);

        const closeBtn = createElement('button', { className: 'session-share-popup__close' }, '✕');
        closeBtn.addEventListener('click', () => popup.remove());
        popup.appendChild(closeBtn);

        anchor.parentElement?.after(popup);
    }

    // ── Modal de sesión recibida via URL ────────────────────────────────────
    private renderShareModal(share: { name: string; blocks: SessionBlock[] }): HTMLElement {
        const modal = createElement('div', { className: 'session-share-modal' });

        modal.appendChild(createElement('div', { className: 'session-share-modal__icon' }, '📋'));
        modal.appendChild(createElement('h3', { className: 'session-share-modal__title' }, 'Sesión recibida'));
        modal.appendChild(createElement('p', { className: 'session-share-modal__name' }, share.name));
        modal.appendChild(createElement('p', { className: 'session-share-modal__meta' },
            `${share.blocks.length} bloque${share.blocks.length !== 1 ? 's' : ''}`));

        // Resumen de bloques
        const list = createElement('ul', { className: 'session-share-modal__list' });
        share.blocks.forEach(b => {
            const text = b.type === 'warmup'
                ? `🥁 Warm Up — ${b.kaydaName ?? ''}`
                : `${b.taalName ?? b.taalId} · ${b.variationName ?? 'Patrón Principal'}${b.supportRef ? ' · ' + b.supportRef : ''}`;
            list.appendChild(createElement('li', {}, text));
        });
        modal.appendChild(list);

        const actions = createElement('div', { className: 'session-share-modal__actions' });

        // Cargar directamente
        const loadBtn = createElement('button', { className: 'btn-primary' }, '▶ Cargar y practicar');
        loadBtn.addEventListener('click', () => {
            const fresh = share.blocks.map(b => ({ ...b, id: crypto.randomUUID() }));
            this.renderStep1(fresh);
        });
        actions.appendChild(loadBtn);

        // Guardar como plantilla + cargar
        const saveInput = createElement('input', {
            type: 'text',
            className: 'session-share-modal__save-input',
            placeholder: 'Nombre para guardar como plantilla…',
            value: share.name,
        }) as HTMLInputElement;
        const saveBtn = createElement('button', { className: 'btn-secondary' }, '💾 Guardar plantilla');
        saveBtn.addEventListener('click', () => {
            const name = saveInput.value.trim() || share.name;
            const existing = loadSavedTemplates();
            saveSavedTemplates([...existing, {
                id: crypto.randomUUID(),
                name,
                blocks: share.blocks.map(b => ({ ...b, id: crypto.randomUUID() })),
            }]);
            saveBtn.textContent = '✓ Guardada';
            (saveBtn as HTMLButtonElement).disabled = true;
        });

        const saveRow = createElement('div', { className: 'session-share-modal__save-row' });
        saveRow.appendChild(saveInput);
        saveRow.appendChild(saveBtn);
        actions.appendChild(saveRow);

        // Descartar
        const discardBtn = createElement('button', { className: 'session-share-modal__discard' }, 'Descartar');
        discardBtn.addEventListener('click', () => this.renderStep1());
        actions.appendChild(discardBtn);

        modal.appendChild(actions);
        return modal;
    }

    // ── Panel de plantillas guardadas (colapsable) ──────────────────────────
    private renderTemplatesPanel(currentBlocks: SessionBlock[]): HTMLElement {
        const templates = loadSavedTemplates();
        const wrap = createElement('div', { className: 'session-templates-panel mb-6' });

        const toggle = createElement('button', { className: 'session-templates-toggle' }) as HTMLButtonElement;
        const rebuildToggleLabel = () => {
            const count = loadSavedTemplates().length;
            toggle.innerHTML = `<span>📋 Plantillas</span>${count > 0 ? `<span class="session-templates-badge">${count}</span>` : ''}<span class="session-templates-arrow">›</span>`;
        };
        rebuildToggleLabel();
        wrap.appendChild(toggle);

        const body = createElement('div', { className: 'session-templates-body' });
        body.style.display = 'none';

        const rebuildBody = () => {
            body.innerHTML = '';
            const list = loadSavedTemplates();

            if (list.length === 0) {
                body.appendChild(createElement('p', { className: 'text-muted text-sm' },
                    'Sin plantillas. Configura bloques, genera un link y guárdalo aquí.'));
            } else {
                list.forEach(t => {
                    const row = createElement('div', { className: 'session-template-row' });

                    const info = createElement('div', { className: 'session-template-row__info' });
                    info.appendChild(createElement('span', { className: 'session-template-row__name' }, t.name));
                    info.appendChild(createElement('span', { className: 'session-template-row__meta' },
                        `${t.blocks.length} bloque${t.blocks.length !== 1 ? 's' : ''}`));
                    row.appendChild(info);

                    const acts = createElement('div', { className: 'session-template-row__actions' });

                    const loadBtn = createElement('button', { className: 'btn-secondary session-template-btn' }, 'Cargar');
                    loadBtn.addEventListener('click', () => {
                        const fresh = t.blocks.map(b => ({ ...b, id: crypto.randomUUID() }));
                        this.renderStep1(fresh);
                    });
                    acts.appendChild(loadBtn);

                    // Botón compartir plantilla
                    const shareBtn = createElement('button', { className: 'session-template-share-btn', title: 'Compartir como link' }, '📤');
                    shareBtn.addEventListener('click', () => this.showSharePopup(t.blocks, shareBtn));
                    acts.appendChild(shareBtn);

                    const delBtn = createElement('button', { className: 'session-template-delete' }, '✕') as HTMLButtonElement;
                    delBtn.title = 'Eliminar plantilla';
                    delBtn.addEventListener('click', () => {
                        saveSavedTemplates(loadSavedTemplates().filter(x => x.id !== t.id));
                        rebuildBody();
                        rebuildToggleLabel();
                    });
                    acts.appendChild(delBtn);

                    row.appendChild(acts);
                    body.appendChild(row);
                });
            }

            // Guardar sesión actual como plantilla (solo si hay bloques)
            if (currentBlocks.length > 0) {
                const saveRow = createElement('div', { className: 'session-template-save-row' });
                const nameInput = createElement('input', {
                    type: 'text',
                    placeholder: 'Nombre para guardar sesión actual…',
                    className: 'session-template-save-input',
                }) as HTMLInputElement;
                const saveBtn = createElement('button', { className: 'btn-primary session-template-btn' }, '💾 Guardar') as HTMLButtonElement;
                saveBtn.addEventListener('click', () => {
                    const name = nameInput.value.trim() || `Sesión ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
                    saveSavedTemplates([...loadSavedTemplates(), {
                        id: crypto.randomUUID(),
                        name,
                        blocks: currentBlocks.map(b => ({ ...b })),
                    }]);
                    nameInput.value = '';
                    rebuildBody();
                    rebuildToggleLabel();
                });
                saveRow.appendChild(nameInput);
                saveRow.appendChild(saveBtn);
                body.appendChild(saveRow);
            }
        };

        toggle.addEventListener('click', () => {
            const open = body.style.display !== 'none';
            body.style.display = open ? 'none' : '';
            const arrow = toggle.querySelector('.session-templates-arrow') as HTMLElement | null;
            if (arrow) arrow.style.transform = open ? '' : 'rotate(90deg)';
            if (!open) rebuildBody();
        });

        wrap.appendChild(body);

        // Auto-abrir si hay plantillas y no hay bloques configurados
        if (templates.length > 0 && currentBlocks.length === 0) {
            body.style.display = '';
            const arrow = toggle.querySelector('.session-templates-arrow') as HTMLElement | null;
            if (arrow) arrow.style.transform = 'rotate(90deg)';
            rebuildBody();
        }

        return wrap;
    }

    private createBlockSummaryCard(block: SessionBlock, index: number, allBlocks: SessionBlock[]): HTMLElement {
        const card = createElement('div', { className: 'session-block-card' });

        // Badge / número de orden
        if (block.type === 'warmup') {
            card.appendChild(createElement('div', { className: 'session-block-card__warmup-badge' }, 'Warm Up'));
        } else if (block.type === 'pickup') {
            card.appendChild(createElement('div', { className: 'session-block-card__pickup-badge' }, 'Pickup'));
        } else {
            const practiceIdx = allBlocks.slice(0, index).filter(b => b.type === 'practice').length + 1;
            card.appendChild(createElement('div', { className: 'session-block-card__index' }, String(practiceIdx)));
        }

        // Cuerpo
        const body = createElement('div', { className: 'session-block-card__body' });

        const title = block.type === 'warmup'
            ? `${block.kaydaName ?? ''}`
            : block.type === 'pickup'
                ? `${block.pickupName ?? ''}`
                : `${block.taalName ?? ''} · ${block.variationName ?? 'Patrón Principal'}`;
        body.appendChild(createElement('div', { className: 'session-block-card__title' }, title));

        const meta = createElement('div', { className: 'session-block-card__meta' });
        if (block.type === 'warmup' && block.lehraLabel) {
            meta.appendChild(createElement('span', { className: 'session-block-card__tag' }, block.lehraLabel));
        } else if (block.type === 'pickup') {
            if (block.pickupTaalCategory) {
                meta.appendChild(createElement('span', { className: 'session-block-card__tag' }, block.pickupTaalCategory));
            }
            if (block.pickupVideoUrl) {
                meta.appendChild(createElement('span', { className: 'session-block-card__tag' }, '▶ Tutorial'));
            }
        } else if (block.supportType === 'metronome') {
            meta.appendChild(createElement('span', { className: 'session-block-card__tag' }, `Metrónomo · ${block.bpmStart ?? 120} BPM`));
        } else if (block.supportRef) {
            meta.appendChild(createElement('span', { className: 'session-block-card__tag' }, block.supportRef));
        }
        meta.appendChild(createElement('span', { className: 'session-block-card__tag' }, 'Tiempo libre'));
        body.appendChild(meta);
        card.appendChild(body);

        // Botones ↑ ↓
        const reorder = createElement('div', { className: 'session-block-card__reorder' });
        const upBtn = createElement('button', { className: 'session-block-card__reorder-btn', title: 'Mover arriba' }, '↑') as HTMLButtonElement;
        upBtn.disabled = index === 0;
        upBtn.addEventListener('click', () => {
            const updated = [...allBlocks];
            [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
            this.renderStep1(updated);
        });
        const downBtn = createElement('button', { className: 'session-block-card__reorder-btn', title: 'Mover abajo' }, '↓') as HTMLButtonElement;
        downBtn.disabled = index === allBlocks.length - 1;
        downBtn.addEventListener('click', () => {
            const updated = [...allBlocks];
            [updated[index + 1], updated[index]] = [updated[index], updated[index + 1]];
            this.renderStep1(updated);
        });
        reorder.appendChild(upBtn);
        reorder.appendChild(downBtn);
        card.appendChild(reorder);

        // Botón quitar
        const removeBtn = createElement('button', { className: 'session-block-card__remove' }, 'Quitar');
        removeBtn.addEventListener('click', () => {
            const updated = allBlocks.filter((_, i) => i !== index);
            this.renderStep1(updated);
        });
        card.appendChild(removeBtn);
        return card;
    }

    private createWarmUpForm(existingBlocks: SessionBlock[]): HTMLElement {
        // Cabecera de sección
        const section = createElement('div', {});
        const sectionHeader = createElement('div', { className: 'session-section-header' });
        sectionHeader.appendChild(createElement('span', { className: 'session-section-label' }, 'Warm Up'));
        sectionHeader.appendChild(createElement('div', { className: 'session-section-divider' }));
        section.appendChild(sectionHeader);

        const wrapper = createElement('div', { className: 'session-form-card' });
        wrapper.appendChild(createElement('h3', { className: 'session-form-card__title' }, 'Warm Up'));

        const lehraField = createElement('div', { className: 'session-form-field' });
        lehraField.appendChild(createElement('label', {}, 'Lehra'));
        const lehraSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
        LEHRAS.filter(l => l.url).forEach(l => {
            lehraSelect.appendChild(createElement('option', { value: l.url }, l.label) as HTMLOptionElement);
        });
        lehraField.appendChild(lehraSelect);
        wrapper.appendChild(lehraField);

        const kaydaField = createElement('div', { className: 'session-form-field' });
        kaydaField.appendChild(createElement('label', {}, 'Kayda'));
        const kaydaSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
        Object.entries(KAYDAS).forEach(([id, k]) => {
            kaydaSelect.appendChild(createElement('option', { value: id }, k.name) as HTMLOptionElement);
        });
        kaydaField.appendChild(kaydaSelect);
        wrapper.appendChild(kaydaField);

        // Botón añadir
        const addBtn = createElement('button', { className: 'btn-primary session-add-btn' }, '+ Añadir Warm Up');
        addBtn.addEventListener('click', () => {
            const lehraIdx = LEHRAS.findIndex(l => l.url === lehraSelect.value);
            const block: SessionBlock = {
                id: crypto.randomUUID(),
                type: 'warmup',
                lehraLabel: LEHRAS[lehraIdx]?.label ?? '',
                lehraUrl: lehraSelect.value,
                kaydaId: kaydaSelect.value,
                kaydaName: KAYDAS[kaydaSelect.value]?.name ?? '',
                timerMode: 'free',
            };
            this.renderStep1([block, ...existingBlocks]);
        });
        wrapper.appendChild(addBtn);
        section.appendChild(wrapper);
        return section;
    }


    private createPickupBlockForm(existingBlocks: SessionBlock[]): HTMLElement {
        const section = createElement('div', {});
        const sectionHeader = createElement('div', { className: 'session-section-header' });
        sectionHeader.appendChild(createElement('span', { className: 'session-section-label' }, 'Pickup / Filler'));
        sectionHeader.appendChild(createElement('div', { className: 'session-section-divider' }));
        section.appendChild(sectionHeader);

        const wrapper = createElement('div', { className: 'session-form-card' });
        wrapper.appendChild(createElement('h3', { className: 'session-form-card__title' }, 'Pickup / Filler'));

        // Selector de categoría (taal)
        const catField = createElement('div', { className: 'session-form-field' });
        catField.appendChild(createElement('label', {}, 'Taal / Categoría'));
        const catSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
        // Categorías únicas presentes en FILLERS
        const categories = [...new Set(FILLERS.map(f => f.category))];
        categories.forEach(cat => {
            catSelect.appendChild(createElement('option', { value: cat }, cat) as HTMLOptionElement);
        });
        catField.appendChild(catSelect);
        wrapper.appendChild(catField);

        // Selector de patrón
        const patField = createElement('div', { className: 'session-form-field' });
        patField.appendChild(createElement('label', {}, 'Patrón'));
        const patSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
        wrapper.appendChild(patField);

        // Preview del patrón
        const patPreview = createElement('div', { className: 'session-bol-preview' });
        wrapper.appendChild(patPreview);

        const refreshPatterns = (category: string) => {
            patSelect.innerHTML = '';
            patPreview.textContent = '';
            const patterns = FILLERS.find(f => f.category === category)?.patterns ?? [];
            if (patterns.length === 0) {
                patSelect.appendChild(createElement('option', { value: '' }, 'Sin pickups para esta categoría') as HTMLOptionElement);
            } else {
                patterns.forEach(p => {
                    patSelect.appendChild(createElement('option', {
                        value: JSON.stringify({ name: p.name, link: p.link ?? '' })
                    }, p.name) as HTMLOptionElement);
                });
                // Mostrar preview del primero
                try {
                    const first = JSON.parse(patSelect.value) as { name: string; link: string };
                    patPreview.textContent = first.name;
                } catch { /* no-op */ }
            }
        };

        patField.appendChild(patSelect);

        refreshPatterns(catSelect.value);
        catSelect.addEventListener('change', () => refreshPatterns(catSelect.value));
        patSelect.addEventListener('change', () => {
            try {
                const p = JSON.parse(patSelect.value) as { name: string; link: string };
                patPreview.textContent = p.name;
            } catch { patPreview.textContent = ''; }
        });

        const addBtn = createElement('button', { className: 'btn-primary session-add-btn' }, '+ Añadir Pickup');
        addBtn.addEventListener('click', () => {
            let pickupName = '';
            let pickupVideoUrl = '';
            try {
                const parsed = JSON.parse(patSelect.value) as { name: string; link: string };
                pickupName = parsed.name;
                pickupVideoUrl = parsed.link ?? '';
            } catch {
                pickupName = patSelect.options[patSelect.selectedIndex]?.text ?? '';
            }
            if (!pickupName) return;
            const block: SessionBlock = {
                id: crypto.randomUUID(),
                type: 'pickup',
                pickupName,
                pickupTaalCategory: catSelect.value,
                pickupVideoUrl,
                timerMode: 'free',
            };
            this.renderStep1([...existingBlocks, block]);
        });
        wrapper.appendChild(addBtn);
        section.appendChild(wrapper);
        return section;
    }


    private createPracticeBlockForm(existingBlocks: SessionBlock[]): HTMLElement {
        // Cabecera de sección
        const section = createElement('div', {});
        const sectionHeader = createElement('div', { className: 'session-section-header' });
        sectionHeader.appendChild(createElement('span', { className: 'session-section-label' }, 'Bloque de práctica'));
        sectionHeader.appendChild(createElement('div', { className: 'session-section-divider' }));
        section.appendChild(sectionHeader);

        const wrapper = createElement('div', { className: 'session-form-card' });
        wrapper.appendChild(createElement('h3', { className: 'session-form-card__title' }, 'Bloque de práctica'));

        // Selector Taal
        const taalField = createElement('div', { className: 'session-form-field' });
        taalField.appendChild(createElement('label', {}, 'Taal'));
        const taalSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
        const activeTaals = ['keherwa', 'dadra', 'rupak', 'deepchandi'];
        activeTaals.forEach(id => {
            taalSelect.appendChild(createElement('option', { value: id }, TAALS[id]?.name ?? id) as HTMLOptionElement);
        });
        taalField.appendChild(taalSelect);
        wrapper.appendChild(taalField);

        // Selector Variación + preview de bols
        const varField = createElement('div', { className: 'session-form-field' });
        varField.appendChild(createElement('label', {}, 'Variación'));
        const varSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
        varField.appendChild(varSelect);
        wrapper.appendChild(varField);

        const bolPreview = createElement('div', { className: 'session-bol-preview' });
        wrapper.appendChild(bolPreview);

        const getBolsPreview = (taalId: string, varValue: string): string => {
            const taal = TAALS[taalId];
            if (!taal) return '';
            const rows = varValue === '__main__'
                ? taal.rows
                : (taal.variations?.find(v => v.name === varValue)?.rows ?? taal.rows);
            return rows.flatMap(r => r.map(m => m.bol.replace(/\s*\([^)]*\)/g, ''))).join(' · ');
        };

        const refreshVariations = (taalId: string) => {
            varSelect.innerHTML = '';
            varSelect.appendChild(createElement('option', { value: '__main__' }, 'Patrón Principal') as HTMLOptionElement);
            (TAALS[taalId]?.variations ?? []).forEach(v => {
                if (!v.special) {
                    varSelect.appendChild(createElement('option', { value: v.name }, v.name) as HTMLOptionElement);
                }
            });
            bolPreview.textContent = getBolsPreview(taalId, varSelect.value);
        };

        refreshVariations(taalSelect.value);
        taalSelect.addEventListener('change', () => refreshVariations(taalSelect.value));
        varSelect.addEventListener('change', () => {
            bolPreview.textContent = getBolsPreview(taalSelect.value, varSelect.value);
        });

        // Selector Soporte
        const supportField = createElement('div', { className: 'session-form-field' });
        supportField.appendChild(createElement('label', {}, 'Soporte rítmico'));
        const supportSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
        ['metronome', 'song', 'lehra'].forEach(s => {
            const labels: Record<string, string> = { metronome: 'Metrónomo', song: 'Canción', lehra: 'Lehra' };
            supportSelect.appendChild(createElement('option', { value: s }, labels[s]) as HTMLOptionElement);
        });
        supportField.appendChild(supportSelect);
        wrapper.appendChild(supportField);

        // Sub-selector dinámico según soporte
        const subSelectorContainer = createElement('div', { className: 'session-form-field' });
        wrapper.appendChild(subSelectorContainer);

        // BPM para metrónomo
        const bpmRow = createElement('div', { className: 'session-form-field' });
        bpmRow.appendChild(createElement('label', {}, 'BPM inicial'));
        const bpmInput = createElement('input', {
            type: 'number', min: '40', max: '400', value: '120', className: 'w-full'
        }) as HTMLInputElement;
        bpmRow.appendChild(bpmInput);
        wrapper.appendChild(bpmRow);

        const refreshSubSelector = (supportType: string) => {
            subSelectorContainer.innerHTML = '';
            bpmRow.style.display = supportType === 'metronome' ? '' : 'none';

            if (supportType === 'song') {
                subSelectorContainer.appendChild(createElement('label', {}, 'Canción'));
                const sel = createElement('select', { className: 'w-full', 'data-sub-select': 'song' }) as HTMLSelectElement;
                const filtered = SONGS.filter(s => s.taal.toLowerCase().startsWith(
                    TAAL_SONG_PREFIXES[taalSelect.value]?.toLowerCase() ?? ''
                ));
                if (filtered.length === 0) {
                    const opt = createElement('option', { value: '' }, 'No hay canciones para este taal') as HTMLOptionElement;
                    sel.appendChild(opt);
                } else {
                    filtered.forEach(s => {
                        const opt = createElement('option', { value: s.youtubeUrl }, `${s.title} — ${s.artist}`) as HTMLOptionElement;
                        sel.appendChild(opt);
                    });
                }
                // Opción para URL personalizada al final de la lista
                sel.appendChild(createElement('option', { value: '__custom__' }, '＋ Otra canción (pegar URL)…') as HTMLOptionElement);
                subSelectorContainer.appendChild(sel);

                // Campos adicionales — visibles solo al elegir "Otra canción"
                const customWrap = createElement('div', { className: 'session-custom-song' });
                customWrap.style.display = 'none';
                const customTitle = createElement('input', {
                    type: 'text', placeholder: 'Título de la canción', className: 'w-full session-custom-input',
                    'data-custom-title': 'true',
                }) as HTMLInputElement;
                const customUrl = createElement('input', {
                    type: 'url', placeholder: 'URL de YouTube (https://…)', className: 'w-full session-custom-input',
                    'data-custom-url': 'true',
                }) as HTMLInputElement;
                customWrap.appendChild(customTitle);
                customWrap.appendChild(customUrl);
                subSelectorContainer.appendChild(customWrap);

                sel.addEventListener('change', () => {
                    customWrap.style.display = sel.value === '__custom__' ? '' : 'none';
                });
            } else if (supportType === 'lehra') {
                subSelectorContainer.appendChild(createElement('label', {}, 'Lehra'));
                const sel = createElement('select', { className: 'w-full', 'data-sub-select': 'lehra' }) as HTMLSelectElement;
                LEHRAS.filter(l => l.url).forEach(l => {
                    sel.appendChild(createElement('option', { value: l.url }, l.label) as HTMLOptionElement);
                });
                subSelectorContainer.appendChild(sel);
            }
        };
        refreshSubSelector(supportSelect.value);
        supportSelect.addEventListener('change', () => refreshSubSelector(supportSelect.value));
        // Actualizar canciones cuando cambia el taal
        taalSelect.addEventListener('change', () => {
            if (supportSelect.value === 'song') refreshSubSelector('song');
        });

        // Botón añadir
        const addBtn = createElement('button', { className: 'btn-primary session-add-btn' }, '+ Añadir bloque');
        addBtn.addEventListener('click', () => {
            const taalId = taalSelect.value;
            const varName = varSelect.value === '__main__' ? 'Patrón Principal' : varSelect.value;
            const supportType = supportSelect.value as 'metronome' | 'song' | 'lehra';
            const subSel = subSelectorContainer.querySelector('[data-sub-select]') as HTMLSelectElement | null;

            let supportRef = '';
            let supportUrl = '';
            if (supportType === 'metronome') {
                supportRef = `${bpmInput.value} BPM`;
            } else if (supportType === 'song' && subSel?.value === '__custom__') {
                const customTitle = subSelectorContainer.querySelector('[data-custom-title]') as HTMLInputElement | null;
                const customUrl = subSelectorContainer.querySelector('[data-custom-url]') as HTMLInputElement | null;
                supportRef = customTitle?.value.trim() || 'Canción personalizada';
                supportUrl = customUrl?.value.trim() ?? '';
            } else if (subSel) {
                supportUrl = subSel.value;
                supportRef = subSel.options[subSel.selectedIndex]?.text ?? '';
            }

            const block: SessionBlock = {
                id: crypto.randomUUID(),
                type: 'practice',
                taalId,
                taalName: TAALS[taalId]?.name ?? taalId,
                variationName: varName,
                supportType,
                supportRef,
                supportUrl,
                bpmStart: supportType === 'metronome' ? parseInt(bpmInput.value, 10) : undefined,
                timerMode: 'free',
            };
            this.renderStep1([...existingBlocks, block]);
        });
        wrapper.appendChild(addBtn);
        section.appendChild(wrapper);
        return section;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASO 2 — Ejecución bloque a bloque
    // ─────────────────────────────────────────────────────────────────────────

    private startSession(blocks: SessionBlock[]): void {
        this.sessionState = {
            startedAt: Date.now(),
            blocks: blocks.map(b => ({ ...b })),
            currentBlockIndex: 0,
            notes: ''
        };
        this.blockStartTime = Date.now();
        saveSessionDraft(this.sessionState, this.blockStartTime);
        this.renderStep2();
    }

    private renderStep2(): void {
        this.stopTimer();
        this.stopMetronome();
        this.container.innerHTML = '';

        const state = this.sessionState;
        const block = state.blocks[state.currentBlockIndex];
        const isLast = state.currentBlockIndex === state.blocks.length - 1;
        const blockNum = state.currentBlockIndex + 1;
        const totalBlocks = state.blocks.length;

        // Header
        const header = createElement('div', { className: 'mb-6' });
        header.appendChild(createElement('h2', { className: 'section-title' },
            `Bloque ${blockNum} de ${totalBlocks}`));
        const subtitle = block.type === 'warmup'
            ? `Warm Up — ${block.kaydaName}`
            : block.type === 'pickup'
                ? `Pickup — ${block.pickupTaalCategory ?? ''}`
                : `${block.taalName} · ${block.variationName}`;
        header.appendChild(createElement('p', { className: 'section-subtitle' }, subtitle));
        this.container.appendChild(header);

        // Timer display
        const timerCard = createElement('div', { className: 'card p-6 mb-4 text-center' });
        const timerDisplay = createElement('div', {
            className: 'mono-font text-center mb-1',
            style: { fontSize: '4rem', letterSpacing: '2px' }
        }, '00:00');
        timerCard.appendChild(timerDisplay);
        timerCard.appendChild(createElement('p', { className: 'text-muted text-sm' }, 'Cronómetro libre'));
        this.container.appendChild(timerCard);

        // Soporte rítmico principal
        this.container.appendChild(this.renderSupport(block));

        // Patrón visual
        this.container.appendChild(this.renderPattern(block));

        // Metrónomo secundario — para práctica sin metrónomo y para pickup
        if (block.type === 'pickup' || block.supportType !== 'metronome') {
            this.container.appendChild(this.renderSecondaryMetronome(block));
        }

        // Botón siguiente / finalizar — siempre visible, buen tamaño táctil
        const nextBtn = createElement('button', {
            className: 'btn-primary session-next-btn'
        }, isLast ? '✓ Finalizar sesión' : 'Siguiente bloque →');
        nextBtn.addEventListener('click', () => this.completeCurrentBlock());
        this.container.appendChild(nextBtn);

        // Arrancar timer
        // blockStartTime ya fue asignado en startSession o en completeCurrentBlock
        // o restaurado desde draft — NO resetear aquí
        this.cycleCount = this.sessionState.blocks[this.sessionState.currentBlockIndex]?.cyclesCompleted ?? 0;
        this.startTimer(timerDisplay);
    }

    private renderSupport(block: SessionBlock): HTMLElement {
        const card = createElement('div', { className: 'card p-6 mb-4' });

        if (block.type === 'pickup') {
            // Patrón de bols en grande
            const patternDisplay = createElement('div', { className: 'session-pickup-pattern' });
            patternDisplay.textContent = block.pickupName ?? '';
            card.appendChild(patternDisplay);
            // Si tiene tutorial embeber video
            if (block.pickupVideoUrl) {
                const embedUrl = this.toEmbedUrl(block.pickupVideoUrl);
                const iframe = createElement('iframe', {
                    src: embedUrl,
                    style: { width: '100%', height: '220px', border: 'none', borderRadius: '8px', marginTop: '0.75rem' },
                    allowfullscreen: 'true'
                });
                card.appendChild(iframe);
            }
        } else if (block.type === 'warmup' || block.supportType === 'lehra' || block.supportType === 'song') {
            const url = block.type === 'warmup' ? (block.lehraUrl ?? '') : (block.supportUrl ?? '');
            if (url) {
                const embedUrl = this.toEmbedUrl(url);
                const iframe = createElement('iframe', {
                    src: embedUrl,
                    style: { width: '100%', height: '220px', border: 'none', borderRadius: '8px' },
                    allowfullscreen: 'true'
                });
                card.appendChild(iframe);
            }
            if (block.supportRef) {
                card.appendChild(createElement('p', { className: 'text-muted text-sm mt-2 text-center' }, block.supportRef));
            }
        } else if (block.supportType === 'metronome') {
            // ── Selector de Taal ──────────────────────────────────────────────
            const taalField = createElement('div', { className: 'session-form-field mb-4' });
            taalField.appendChild(createElement('label', {
                style: {
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.375rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                }
            }, 'Taal'));
            const taalSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
            Object.keys(TAALS).forEach(id => {
                const opt = createElement('option', { value: id }, TAALS[id]?.name ?? id) as HTMLOptionElement;
                if (id === (block.taalId ?? 'keherwa')) opt.selected = true;
                taalSelect.appendChild(opt);
            });
            taalField.appendChild(taalSelect);
            card.appendChild(taalField);

            // ── Contenedor del metrónomo (se reconstruye al cambiar taal) ─────
            const metroBody = createElement('div', {});
            card.appendChild(metroBody);

            const buildForTaal = (taalId: string) => {
                metroBody.innerHTML = '';
                const beats = TAALS[taalId]?.beats ?? 8;
                this.buildMetronomeUI(metroBody, beats, block.bpmStart ?? 120, block);
            };

            taalSelect.addEventListener('change', () => {
                this.stopMetronome();
                buildForTaal(taalSelect.value);
            });

            buildForTaal(taalSelect.value);
        }

        return card;
    }

    /**
     * Construye la UI del metrónomo (beat indicators + BPM + ciclos + Play/Stop).
     * @param container  Elemento donde se monta la UI
     * @param initialBeats  Número de beats del compás inicial
     * @param initialBpm    BPM inicial
     * @param block         Bloque al que se asocian los ciclos (opcional)
     */
    private buildMetronomeUI(
        container: HTMLElement,
        initialBeats: number,
        initialBpm: number,
        block?: SessionBlock
    ): void {
        if (this.metronome) {
            this.metronome.stop();
        }
        this.metronome = new MetronomeEngine();
        this.metronome.setBPM(initialBpm);
        this.metronome.setBeatsPerMeasure(initialBeats);

        // ── Indicadores de beat ───────────────────────────────────────────
        const indicatorsRow = createElement('div', {
            className: 'flex flex-wrap justify-center gap-3 mb-4'
        });
        let indicators: HTMLElement[] = [];

        const rebuildIndicators = (beats: number) => {
            indicatorsRow.innerHTML = '';
            indicators = [];
            for (let i = 0; i < beats; i++) {
                // data-beat="0" activa el acento rojo del Sam vía CSS
                const dot = createElement('div', { className: 'beat-indicator', 'data-beat': String(i) });
                indicatorsRow.appendChild(dot);
                indicators.push(dot);
            }
        };
        rebuildIndicators(initialBeats);
        container.appendChild(indicatorsRow);

        this.metronome.onBeat((beat: number) => {
            indicators.forEach((d, i) => d.classList.toggle('active', i === beat));
        });

        // ── BPM display ───────────────────────────────────────────────────
        const bpmDisplay = createElement('div', {
            className: 'mono-font text-center mb-2',
            style: { fontSize: '3rem' }
        }, `${initialBpm} BPM`);
        container.appendChild(bpmDisplay);

        // ── Ciclos ────────────────────────────────────────────────────────
        const cycleDisplay = createElement('div', {
            className: 'text-muted text-sm text-center mb-3'
        }, 'Ciclos: 0');
        container.appendChild(cycleDisplay);

        this.metronome.onCycle((_cycle: number) => {
            this.cycleCount++;
            cycleDisplay.textContent = `Ciclos: ${this.cycleCount}`;
            if (block) block.cyclesCompleted = this.cycleCount;
        });

        // ── +/- BPM ───────────────────────────────────────────────────────
        const bpmRow = createElement('div', { className: 'flex items-center justify-center gap-4 mb-4' });
        const minusBtn = createElement('button', { className: 'bpm-adj-btn' }, '−');
        const plusBtn  = createElement('button', { className: 'bpm-adj-btn' }, '+');
        let currentBpm = initialBpm;

        minusBtn.addEventListener('click', () => {
            currentBpm = Math.max(40, currentBpm - 5);
            this.metronome?.setBPM(currentBpm);
            bpmDisplay.textContent = `${currentBpm} BPM`;
            if (block) block.bpmEnd = currentBpm;
        });
        plusBtn.addEventListener('click', () => {
            currentBpm = Math.min(400, currentBpm + 5);
            this.metronome?.setBPM(currentBpm);
            bpmDisplay.textContent = `${currentBpm} BPM`;
            if (block) block.bpmEnd = currentBpm;
        });
        bpmRow.appendChild(minusBtn);
        bpmRow.appendChild(createElement('span', { className: 'text-muted text-sm' }, 'BPM'));
        bpmRow.appendChild(plusBtn);
        container.appendChild(bpmRow);

        // ── Play/Stop ─────────────────────────────────────────────────────
        const playBtn = createElement('button', {
            className: 'btn-primary w-full',
            style: { fontSize: '1.1rem', padding: '0.875rem' }
        }, '▶ Play');
        let playing = false;

        const stopPlayback = () => {
            playing = false;
            this.metronome?.stop();
            indicators.forEach(d => d.classList.remove('active'));
            playBtn.textContent = '▶ Play';
            playBtn.className = 'btn-primary w-full';
            (playBtn as HTMLElement).style.padding = '0.875rem';
        };

        playBtn.addEventListener('click', () => {
            playing = !playing;
            if (playing) {
                this.cycleCount = 0;
                this.metronome?.start();
                playBtn.textContent = '⏹ Stop';
                playBtn.className = 'btn-secondary w-full';
                (playBtn as HTMLElement).style.padding = '0.875rem';
            } else {
                stopPlayback();
            }
        });
        container.appendChild(playBtn);

        // Exponer función de parada para el selector de taal
        return; // (stopPlayback queda en closure, usada desde taalSelect abajo)

        // (TS no llega aquí — función auxiliar en closure accesible por taalSelect)
        void stopPlayback;
    }

    /**
     * Metrónomo secundario colapsable — disponible en bloques de canción/lehra.
     * Incluye selector de taal para elegir el compás libremente.
     */
    private renderSecondaryMetronome(block: SessionBlock): HTMLElement {
        const wrapper = createElement('div', { className: 'session-metro-wrapper' });

        // Toggle button
        const toggleBtn = createElement('button', {
            className: 'btn-secondary session-metro-toggle'
        }, 'Metrónomo de apoyo');

        const metroCard = createElement('div', {
            className: 'card p-6 session-metro-card',
            style: { display: 'none' }
        });

        // ── Selector de Taal ──────────────────────────────────────────────
        const taalField = createElement('div', { className: 'session-form-field mb-4' });
        taalField.appendChild(createElement('label', {
            style: {
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '0.375rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
            }
        }, 'Taal'));
        const taalSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
        Object.keys(TAALS).forEach(id => {
            const opt = createElement('option', { value: id }, TAALS[id]?.name ?? id) as HTMLOptionElement;
            if (id === (block.taalId ?? 'keherwa')) opt.selected = true;
            taalSelect.appendChild(opt);
        });
        taalField.appendChild(taalSelect);
        metroCard.appendChild(taalField);

        // ── Contenedor de la UI del metrónomo (se reconstruye al cambiar taal) ──
        const metroBody = createElement('div', {});
        metroCard.appendChild(metroBody);

        const buildForTaal = (taalId: string) => {
            metroBody.innerHTML = '';
            const beats = TAALS[taalId]?.beats ?? 8;
            const bpm = block.bpmStart ?? 80;
            this.buildMetronomeUI(metroBody, beats, bpm, undefined);
        };

        taalSelect.addEventListener('change', () => {
            this.stopMetronome();
            buildForTaal(taalSelect.value);
        });

        let metroBuilt = false;
        toggleBtn.addEventListener('click', () => {
            const isOpen = metroCard.style.display !== 'none';
            if (isOpen) {
                this.stopMetronome();
                metroCard.style.display = 'none';
                toggleBtn.textContent = 'Metrónomo de apoyo';
            } else {
                if (!metroBuilt) {
                    buildForTaal(taalSelect.value);
                    metroBuilt = true;
                }
                metroCard.style.display = '';
                toggleBtn.textContent = 'Ocultar metrónomo';
            }
        });

        wrapper.appendChild(toggleBtn);
        wrapper.appendChild(metroCard);
        return wrapper;
    }

    private renderPattern(block: SessionBlock): HTMLElement {
        const card = createElement('div', { className: 'card p-6 mb-4' });

        // Los bloques pickup no tienen patrón de taal — devolver tarjeta vacía
        if (block.type === 'pickup') return createElement('div', {});

        const title = block.type === 'warmup'
            ? (block.kaydaName ?? 'Kayda')
            : `${block.taalName ?? ''} — ${block.variationName ?? ''}`;
        card.appendChild(createElement('h4', { className: 'font-bold mb-4' }, title));

        // ── Bloque de Warm Up (Kayda) ─────────────────────────────────────────
        if (block.type === 'warmup' && block.kaydaId) {
            const kayda = KAYDAS[block.kaydaId];
            if (kayda) {
                card.appendChild(createElement('p', { className: 'text-muted text-sm mb-4' },
                    `${kayda.taal} · ${kayda.beats} tiempos`));

                kayda.rows.forEach((row, rowIndex) => {
                    const isMobile = window.innerWidth < 768;
                    const groups: Matra[][] = isMobile
                        ? chunkArray(row.matras, 4)
                        : [row.matras];

                    groups.forEach((group, groupIndex) => {
                        const isFirst = rowIndex === 0 && groupIndex === 0;
                        const rowDiv = createElement('div', {
                            className: `taal-row-separator ${!isFirst ? 'mt-6' : ''}`
                        });

                        // Label solo en el primer grupo de cada fila
                        if (groupIndex === 0) {
                            rowDiv.appendChild(createElement('h4', {
                                className: 'text-sm font-semibold text-muted mt-4 mb-3'
                            }, row.label));
                        }

                        const grid = createElement('div', {
                            className: 'grid gap-4 pt-6',
                            style: { gridTemplateColumns: `repeat(${group.length}, minmax(0, 1fr))` }
                        });

                        group.forEach(matra => {
                            const cell = createElement('div', { className: 'bol-cell' });
                            cell.appendChild(createElement('div', { className: 'matra-number mono-font' }, `M${matra.matra}`));
                            const bolEl = createElement('div', { className: 'bol-text' });
                            applyBolIndicators(bolEl, matra.bol);
                            cell.appendChild(bolEl);
                            if (matra.technique === 'Taali' || matra.technique === 'Khali' || matra.technique === 'Bhari') {
                                cell.appendChild(createElement('span', { className: 'technique-badge' }, matra.technique));
                            }
                            grid.appendChild(cell);
                        });

                        rowDiv.appendChild(grid);
                        card.appendChild(rowDiv);
                    });
                });

                if (bolsHaveIndicators(kayda.rows)) {
                    card.appendChild(createBolIndicatorsLegend());
                }
            }
            return card;
        }

        // ── Bloque de Práctica (Taal) ─────────────────────────────────────────
        let rows: Matra[][] = [];
        if (block.taalId) {
            const taal = TAALS[block.taalId];
            if (taal) {
                if (block.variationName === 'Patrón Principal') {
                    rows = taal.rows;
                } else {
                    const variation = taal.variations?.find(v => v.name === block.variationName);
                    rows = variation ? variation.rows : taal.rows;
                }
            }
        }

        rows.forEach((row, rowIndex) => {
            const rowDiv = createElement('div', {
                className: `taal-row-separator ${rowIndex > 0 ? 'mt-6' : ''}`
            });
            const grid = createElement('div', {
                className: 'grid gap-4 pt-6',
                style: { gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }
            });

            row.forEach(matra => {
                const cell = createElement('div', { className: 'bol-cell' });
                cell.appendChild(createElement('div', { className: 'matra-number mono-font' }, `M${matra.matra}`));
                const bolEl = createElement('div', { className: 'bol-text' });
                applyBolIndicators(bolEl, matra.bol);
                cell.appendChild(bolEl);
                if (matra.technique === 'Taali' || matra.technique === 'Khali' || matra.technique === 'Bhari') {
                    cell.appendChild(createElement('span', { className: 'technique-badge' }, matra.technique));
                }
                grid.appendChild(cell);
            });

            rowDiv.appendChild(grid);
            card.appendChild(rowDiv);
        });

        return card;
    }

    private startTimer(display: HTMLElement): void {
        // Siempre cronómetro libre — cuenta hacia arriba
        this.timerInterval = window.setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.blockStartTime) / 1000);
            display.textContent = this.formatTime(elapsed);
        }, 1000);
    }

    private completeCurrentBlock(): void {
        const block = this.sessionState.blocks[this.sessionState.currentBlockIndex];
        block.durationSecs = Math.floor((Date.now() - this.blockStartTime) / 1000);
        block.completedAt = Date.now();

        this.stopTimer();
        this.stopMetronome();

        if (this.sessionState.currentBlockIndex < this.sessionState.blocks.length - 1) {
            this.sessionState.currentBlockIndex++;
            this.blockStartTime = Date.now();
            saveSessionDraft(this.sessionState, this.blockStartTime);
            this.renderStep2();
        } else {
            // Sesión completa — limpiar draft antes del resumen
            clearSessionDraft();
            this.renderStep3();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASO 3 — Resumen de sesión
    // ─────────────────────────────────────────────────────────────────────────

    private renderStep3(): void {
        this.container.innerHTML = '';

        const state = this.sessionState;
        const totalSecs = state.blocks.reduce((sum, b) => sum + (b.durationSecs ?? 0), 0);

        // Header
        const header = createElement('div', { className: 'mb-8' });
        header.appendChild(createElement('h2', { className: 'section-title' }, 'Sesión completada'));
        header.appendChild(createElement('p', { className: 'section-subtitle' },
            `Tiempo total: ${this.formatTime(totalSecs)}`));
        this.container.appendChild(header);

        // Lista de bloques
        const blocksCard = createElement('div', { className: 'card p-6 mb-4' });
        blocksCard.appendChild(createElement('h3', { className: 'font-bold text-lg mb-4' }, 'Bloques practicados'));

        state.blocks.forEach((block, i) => {
            const row = createElement('div', {
                className: 'flex items-center justify-between py-2',
                style: { borderBottom: '1px solid var(--border-primary)' }
            });

            const name = block.type === 'warmup'
                ? `Warm Up — ${block.kaydaName}`
                : block.type === 'pickup'
                    ? `Pickup — ${block.pickupName ?? ''}`
                    : `${i}. ${block.taalName} · ${block.variationName}`;
            row.appendChild(createElement('span', { className: 'font-medium' }, name));

            const meta = createElement('span', { className: 'text-muted text-sm text-right' });
            const dur = this.formatTime(block.durationSecs ?? 0);
            const bpmInfo = block.supportType === 'metronome' && block.bpmStart
                ? ` · ${block.bpmEnd ?? block.bpmStart} BPM`
                : '';
            const cyclesInfo = block.cyclesCompleted
                ? ` · ${block.cyclesCompleted} ciclos`
                : '';
            const songInfo = block.supportRef && block.supportType !== 'metronome' ? ` · ${block.supportRef}` : '';
            meta.textContent = `${dur}${bpmInfo}${cyclesInfo}${songInfo}`;
            row.appendChild(meta);
            blocksCard.appendChild(row);
        });
        this.container.appendChild(blocksCard);

        // Breakdown por taal
        const taalTimes: Record<string, number> = {};
        state.blocks.forEach(b => {
            const key = b.type === 'warmup'
                ? 'Warm Up'
                : b.type === 'pickup'
                    ? 'Pickups'
                    : (b.taalName ?? 'Desconocido');
            taalTimes[key] = (taalTimes[key] ?? 0) + (b.durationSecs ?? 0);
        });

        if (Object.keys(taalTimes).length > 0) {
            const breakdownCard = createElement('div', { className: 'card p-6 mb-4' });
            breakdownCard.appendChild(createElement('h3', { className: 'font-bold text-lg mb-4' }, 'Tiempo por taal'));

            Object.entries(taalTimes).forEach(([name, secs]) => {
                const pct = totalSecs > 0 ? Math.round((secs / totalSecs) * 100) : 0;
                const rowEl = createElement('div', { className: 'mb-3' });
                const labelRow = createElement('div', { className: 'flex justify-between text-sm mb-1' });
                labelRow.appendChild(createElement('span', { className: 'font-medium' }, name));
                labelRow.appendChild(createElement('span', { className: 'text-muted' }, `${this.formatTime(secs)} (${pct}%)`));
                rowEl.appendChild(labelRow);

                const track = createElement('div', { className: 'w-full', style: { height: '8px', background: 'var(--border-primary)', borderRadius: '4px', overflow: 'hidden' } });
                const fill = createElement('div', { style: { height: '100%', width: `${pct}%`, background: 'var(--orange-500)', borderRadius: '4px', transition: 'width 0.5s ease' } });
                track.appendChild(fill);
                rowEl.appendChild(track);
                breakdownCard.appendChild(rowEl);
            });
            this.container.appendChild(breakdownCard);
        }

        // Notas libres
        const notesCard = createElement('div', { className: 'card p-6 mb-4' });
        notesCard.appendChild(createElement('h3', { className: 'font-bold text-lg mb-3' }, 'Notas de la sesión'));
        notesCard.appendChild(createElement('p', { className: 'text-muted text-sm mb-3' }, '¿Qué ha ido bien? ¿Qué mejorar?'));
        const textarea = createElement('textarea', {
            className: 'w-full',
            rows: '5',
            placeholder: 'Escribe aquí tus observaciones...',
            style: {
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                border: '1.5px solid var(--border-primary)', background: 'var(--card-bg)',
                color: 'var(--text-primary)', fontSize: '0.95rem', resize: 'vertical',
                boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: '1.6'
            }
        }) as HTMLTextAreaElement;
        textarea.addEventListener('input', () => { state.notes = textarea.value; });
        notesCard.appendChild(textarea);
        this.container.appendChild(notesCard);

        // ── Botones de acción ────────────────────────────────────────────────

        // Guardar sesión
        const actionArea = createElement('div', {});
        const saveBtn = createElement('button', { className: 'btn-primary session-start-btn' }, '💾 Guardar sesión');
        saveBtn.addEventListener('click', () => {
            this.showSaveModal(state.notes, totalSecs, state.blocks, () => {
                clearSessionDraft();
                actionArea.innerHTML = '';
                const successMsg = createElement('div', { className: 'session-action-feedback session-action-feedback--success' });
                successMsg.innerHTML = '✓ <strong>Sesión guardada.</strong> Redirigiendo...';
                actionArea.appendChild(successMsg);
                setTimeout(() => this.renderStep1(), 2000);
            });
        });
        actionArea.appendChild(saveBtn);

        // Descartar sesión (con confirmación inline)
        const discardWrapper = createElement('div', { style: { marginTop: '0.75rem' } });

        const discardBtn = createElement('button', { className: 'btn-secondary session-start-btn session-discard-btn' }, 'Descartar sesión');
        const confirmRow = createElement('div', {
            className: 'session-discard-confirm',
            style: { display: 'none' }
        });
        confirmRow.appendChild(createElement('span', { className: 'text-muted text-sm' },
            '¿Seguro que quieres descartar esta sesión? No se guardará nada.'));
        const confirmBtns = createElement('div', { className: 'flex gap-3 mt-3' });

        const yesBtn = createElement('button', { className: 'btn-danger flex-1' }, 'Sí, descartar');
        yesBtn.addEventListener('click', () => {
            clearSessionDraft();
            actionArea.innerHTML = '';
            discardWrapper.innerHTML = '';
            const discardMsg = createElement('div', { className: 'session-action-feedback session-action-feedback--discard' });
            discardMsg.innerHTML = '✕ <strong>Sesión descartada.</strong> Redirigiendo...';
            actionArea.appendChild(discardMsg);
            setTimeout(() => this.renderStep1(), 2000);
        });

        const noBtn = createElement('button', { className: 'btn-secondary flex-1' }, 'Cancelar');
        noBtn.addEventListener('click', () => {
            confirmRow.style.display = 'none';
            discardBtn.style.display = '';
        });

        confirmBtns.appendChild(yesBtn);
        confirmBtns.appendChild(noBtn);
        confirmRow.appendChild(confirmBtns);

        discardBtn.addEventListener('click', () => {
            discardBtn.style.display = 'none';
            confirmRow.style.display = '';
        });

        discardWrapper.appendChild(discardBtn);
        discardWrapper.appendChild(confirmRow);
        actionArea.appendChild(discardWrapper);

        this.container.appendChild(actionArea);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private formatTime(totalSecs: number): string {
        const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
        const s = (totalSecs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    private toEmbedUrl(url: string): string {
        const watchMatch = url.match(/youtube\.com\/watch\?v=([\w-]+)/);
        const shortMatch = url.match(/youtu\.be\/([\w-]+)/);
        const embedMatch = url.match(/youtube\.com\/embed\/([\w-]+)/);
        const shortsMatch = url.match(/youtube\.com\/shorts\/([\w-]+)/);
        const id = (watchMatch ?? shortMatch ?? embedMatch ?? shortsMatch)?.[1];
        return id ? `https://www.youtube.com/embed/${id}` : url;
    }

    private stopTimer(): void {
        if (this.timerInterval !== null) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    private stopMetronome(): void {
        if (this.metronome) {
            this.metronome.stop();
            this.metronome = null;
        }
    }

    // ── Modal de guardado ─────────────────────────────────────────────────────

    private showSaveModal(
        notes: string,
        totalSecs: number,
        blocks: SessionBlock[],
        onSuccess: () => void
    ): void {
        // SHA-256 hashes de las contraseñas — calculados en build time con openssl.
        // Las contraseñas reales nunca están en el código fuente.
        const USERS: Record<string, string> = {
            prashant: '08ff26c5a6661c7bcf74134fc684717aabba4a66c2d0cfa06c4be231755c1a91',
            meera:    'ea4198f9dc6c89087fd7a47d6023c65e9eaaf8ed2a219b8fda98f5b5b765ede9',
        };

        // ── Overlay ───────────────────────────────────────────────────────────
        const overlay = createElement('div', { className: 'save-modal-overlay' });
        const modal   = createElement('div', { className: 'save-modal' });

        modal.appendChild(createElement('h3', { className: 'save-modal__title' }, '💾 Guardar sesión'));
        modal.appendChild(createElement('p', { className: 'save-modal__sub' },
            'Introduce tus credenciales para guardar en la base de datos'));

        // ── Usuario ───────────────────────────────────────────────────────────
        const userField = createElement('div', { className: 'save-modal__field' });
        userField.appendChild(createElement('label', { className: 'save-modal__label' }, 'Usuario'));
        const userSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
        ['prashant', 'meera'].forEach(u => {
            userSelect.appendChild(createElement('option', { value: u },
                u.charAt(0).toUpperCase() + u.slice(1)) as HTMLOptionElement);
        });
        userField.appendChild(userSelect);
        modal.appendChild(userField);

        // ── Contraseña ────────────────────────────────────────────────────────
        const passField = createElement('div', { className: 'save-modal__field' });
        passField.appendChild(createElement('label', { className: 'save-modal__label' }, 'Contraseña'));
        const passInput = createElement('input', {
            type: 'password',
            className: 'save-modal__pass-input',
            placeholder: '••••••••',
        }) as HTMLInputElement;
        passField.appendChild(passInput);
        modal.appendChild(passField);

        // ── Error ─────────────────────────────────────────────────────────────
        const errorEl = createElement('p', { className: 'save-modal__error' });
        errorEl.style.display = 'none';
        modal.appendChild(errorEl);

        // ── Botones ───────────────────────────────────────────────────────────
        const btnRow = createElement('div', { className: 'save-modal__btns' });

        const cancelBtn = createElement('button', { className: 'btn-secondary flex-1' }, 'Cancelar');
        cancelBtn.addEventListener('click', () => overlay.remove());

        const confirmBtn = createElement('button', { className: 'btn-primary flex-1' }, 'Guardar');
        confirmBtn.addEventListener('click', async () => {
            const userId       = userSelect.value;
            const passwordHash = await hashPassword(passInput.value.trim());

            if (passwordHash !== USERS[userId]) {
                errorEl.textContent = 'Contraseña incorrecta';
                errorEl.style.display = 'block';
                passInput.value = '';
                passInput.focus();
                return;
            }

            // Deshabilitar mientras guarda
            confirmBtn.textContent = 'Guardando...';
            confirmBtn.setAttribute('disabled', 'true');
            errorEl.style.display = 'none';

            const record = {
                user_id:    userId,
                total_secs: totalSecs,
                notes:      notes || null,
                blocks:     blocks.map(b => ({
                    type:              b.type,
                    taal_name:         b.taalName,
                    variation_name:    b.variationName,
                    kayda_name:        b.kaydaName,
                    support_type:      b.supportType,
                    support_ref:       b.supportRef,
                    bpm_start:         b.bpmStart,
                    bpm_end:           b.bpmEnd,
                    duration_secs:     b.durationSecs,
                    cycles_completed:  b.cyclesCompleted,
                    // Pickup fields
                    pickup_name:       b.pickupName,
                    pickup_taal:       b.pickupTaalCategory,
                })),
            };

            try {
                const { error } = await db.from('sessions').insert(record);

                if (error) throw error;

                // Éxito
                overlay.remove();
                onSuccess();

            } catch (err) {
                console.error('Error guardando sesión:', err);
                errorEl.textContent = 'Error al guardar. Revisa tu conexión e inténtalo de nuevo.';
                errorEl.style.display = 'block';
                confirmBtn.textContent = 'Guardar';
                confirmBtn.removeAttribute('disabled');
            }
        });

        // Guardar al pulsar Enter en la contraseña
        passInput.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') confirmBtn.click();
        });

        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(confirmBtn);
        modal.appendChild(btnRow);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Focus en contraseña tras abrir
        setTimeout(() => passInput.focus(), 50);
    }

}

// Made with Bob
