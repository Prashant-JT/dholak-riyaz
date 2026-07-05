/**
 * SESSION WIZARD VIEW — Orquestador
 * Tres pasos: Configurar → Practicar (bloque a bloque) → Resumen.
 *
 * La lógica de cada paso vive en módulos separados:
 *   - wizardDraft.ts   → persistencia de borrador, plantillas y share URL
 *   - wizardStep1.ts   → configuración de sesión (formularios, plantillas)
 *   - wizardStep2.ts   → ejecución bloque a bloque (metrónomo, timer, patrón)
 *   - wizardStep3.ts   → resumen y guardado a Supabase
 */

import { createElement } from '../../core/utils.js';
import type { View, SessionBlock, SessionState } from '../../types.js';

import {
    saveSessionDraft,
    loadSessionDraft,
    clearSessionDraft,
    seedDefaultTemplates,
    hashToBlocks,
    type SessionDraft,
} from './wizardDraft.js';
export { updateSessionBadge } from './wizardDraft.js';

import {
    renderStep1,
    extractShareHash,
} from './wizardStep1.js';

import {
    renderStep2,
    type Step2State,
    type Step2Callbacks,
} from './wizardStep2.js';

import { renderStep3 } from './wizardStep3.js';

export class SessionWizardView implements View {
    private container!: HTMLElement;
    private sessionState!: SessionState;
    private blockStartTime: number = 0;

    // Step2 state — managed here so it can be passed by reference
    private step2State: Step2State = {
        metronome:     null,
        timerInterval: null,
        cycleCount:    0,
    };

    public render(): HTMLElement {
        seedDefaultTemplates();
        this.container = createElement('section', { id: 'riyaz', className: 'view-section' });

        // 1. Link compartido tiene prioridad absoluta
        const hashParam = extractShareHash();
        if (hashParam) {
            const parsed = hashToBlocks(hashParam);
            this.doStep1([], parsed ?? null);
            return this.container;
        }

        // 2. Recover interrupted session
        const draft = loadSessionDraft();
        if (draft) {
            this.renderDraftRecovery(draft);
            return this.container;
        }

        this.doStep1();
        return this.container;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step coordination
    // ─────────────────────────────────────────────────────────────────────────

    private doStep1(blocks: SessionBlock[] = [], share: { name: string; blocks: SessionBlock[] } | null = null): void {
        renderStep1(this.container, {
            onStart:  (b) => this.startSession(b),
            onStep1:  (b) => this.doStep1(b ?? []),
        }, blocks, share);
    }

    private startSession(blocks: SessionBlock[]): void {
        this.sessionState = {
            startedAt: Date.now(),
            blocks: blocks.map(b => ({ ...b })),
            currentBlockIndex: 0,
            notes: '',
        };
        this.blockStartTime = Date.now();
        saveSessionDraft(this.sessionState, this.blockStartTime);
        this.doStep2();
    }

    private doStep2(): void {
        this.step2State.cycleCount = 0;
        renderStep2(
            this.container,
            this.sessionState,
            this.blockStartTime,
            this.makeStep2Callbacks(),
        );
    }

    private makeStep2Callbacks(): Step2Callbacks {
        return {
            onComplete: () => {
                // currentBlockIndex was already incremented by completeCurrentBlock.
                // If the index exceeds the last block, the session is done.
                const done = this.sessionState.currentBlockIndex >= this.sessionState.blocks.length;
                if (!done) {
                    this.blockStartTime = Date.now();
                    this.doStep2();
                } else {
                    this.doStep3();
                }
            },
            getState: () => this.step2State,
            setState: (patch) => { Object.assign(this.step2State, patch); },
        };
    }

    private doStep3(): void {
        renderStep3(this.container, this.sessionState, {
            onNewSession: () => {
                clearSessionDraft();
                this.doStep1();
            },
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Interrupted session recovery banner
    // ─────────────────────────────────────────────────────────────────────────

    private renderDraftRecovery(draft: SessionDraft): void {
        this.container.innerHTML = '';

        if (draft.completed) {
            this.sessionState = draft.state;
            this.blockStartTime = 0;
            this.doStep3();
            return;
        }

        const elapsedMin = Math.round((Date.now() - draft.savedAt) / 60000);
        const timeLabel = elapsedMin < 1 ? 'hace menos de 1 min'
            : elapsedMin === 1 ? 'hace 1 min'
            : `hace ${elapsedMin} min`;

        const card = createElement('div', { className: 'session-draft-recovery' });
        card.appendChild(createElement('div', { className: 'session-draft-recovery__icon' }, '🔄'));
        card.appendChild(createElement('h3', { className: 'session-draft-recovery__title' }, 'Sesión interrumpida'));
        card.appendChild(createElement('p', { className: 'session-draft-recovery__meta' },
            `${draft.state.blocks.length} bloque${draft.state.blocks.length !== 1 ? 's' : ''} · Bloque ${draft.state.currentBlockIndex + 1} en curso · ${timeLabel}`));

        const list = createElement('ul', { className: 'session-draft-recovery__list' });
        draft.state.blocks.forEach((b, i) => {
            const isCurrent = i === draft.state.currentBlockIndex;
            const label = b.type === 'warmup'
                ? `Warm Up — ${b.kaydaName ?? ''}`
                : b.type === 'pickup'
                    ? `Pickup — ${b.pickupName ?? ''}`
                    : `${b.taalName ?? ''} · ${b.variationName ?? ''}`;
            const li = createElement('li', {
                className: isCurrent ? 'session-draft-recovery__list-item--current' : ''
            }, `${isCurrent ? '▶ ' : ''}${label}${b.durationSecs ? ` (${Math.floor(b.durationSecs / 60)}:${String(b.durationSecs % 60).padStart(2, '0')})` : ''}`);
            list.appendChild(li);
        });
        card.appendChild(list);

        const actions = createElement('div', { className: 'session-draft-recovery__actions' });

        const continueBtn = createElement('button', { className: 'btn-primary' }, '▶ Continuar sesión');
        continueBtn.addEventListener('click', () => {
            this.sessionState = draft.state;
            this.blockStartTime = Date.now() - draft.elapsedSecs * 1000;
            this.doStep2();
        });
        actions.appendChild(continueBtn);

        const discardBtn = createElement('button', { className: 'session-draft-recovery__discard' }, 'Descartar y empezar de nuevo');
        discardBtn.addEventListener('click', () => {
            clearSessionDraft();
            this.doStep1();
        });
        actions.appendChild(discardBtn);

        card.appendChild(actions);
        this.container.appendChild(card);
    }
}
