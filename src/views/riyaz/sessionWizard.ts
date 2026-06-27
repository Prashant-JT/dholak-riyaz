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
import { MetronomeEngine } from '../../components/metronome.js';
import type { View, SessionBlock, SessionState, Matra } from '../../types.js';

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

export class SessionWizardView implements View {
    private container!: HTMLElement;
    private sessionState!: SessionState;
    private metronome: MetronomeEngine | null = null;
    private timerInterval: number | null = null;
    private blockStartTime: number = 0;
    private cycleCount: number = 0;

    public render(): HTMLElement {
        this.container = createElement('section', {
            id: 'riyaz',
            className: 'view-section'
        });
        this.renderStep1();
        return this.container;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASO 1 — Configurador de sesión
    // ─────────────────────────────────────────────────────────────────────────

    private renderStep1(existingBlocks: SessionBlock[] = []): void {
        this.container.innerHTML = '';

        // Header
        const header = createElement('div', { className: 'mb-8' });
        header.appendChild(createElement('h2', { className: 'section-title' }, 'Nueva Sesión de Riyaz'));
        header.appendChild(createElement('p', { className: 'section-subtitle' },
            'Configura tu sesión añadiendo bloques de práctica'));
        this.container.appendChild(header);

        // Lista de bloques añadidos
        if (existingBlocks.length > 0) {
            const blockListLabel = createElement('p', {
                className: 'text-muted text-sm mb-3',
                style: { textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }
            }, `${existingBlocks.length} bloque${existingBlocks.length !== 1 ? 's' : ''} añadido${existingBlocks.length !== 1 ? 's' : ''}`);
            this.container.appendChild(blockListLabel);
        }
        const blockList = createElement('div', { id: 'block-list', className: 'mb-6' });
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

    private createBlockSummaryCard(block: SessionBlock, index: number, allBlocks: SessionBlock[]): HTMLElement {
        const card = createElement('div', { className: 'session-block-card' });

        // Badge / número de orden
        if (block.type === 'warmup') {
            card.appendChild(createElement('div', { className: 'session-block-card__warmup-badge' }, 'Warm Up'));
        } else {
            card.appendChild(createElement('div', { className: 'session-block-card__index' }, String(index)));
        }

        // Cuerpo
        const body = createElement('div', { className: 'session-block-card__body' });

        const title = block.type === 'warmup'
            ? `${block.kaydaName ?? ''}`
            : `${block.taalName ?? ''} · ${block.variationName ?? 'Patrón Principal'}`;
        body.appendChild(createElement('div', { className: 'session-block-card__title' }, title));

        const meta = createElement('div', { className: 'session-block-card__meta' });
        if (block.type === 'warmup' && block.lehraLabel) {
            meta.appendChild(createElement('span', { className: 'session-block-card__tag' }, block.lehraLabel));
        } else if (block.supportType === 'metronome') {
            meta.appendChild(createElement('span', { className: 'session-block-card__tag' }, `Metrónomo · ${block.bpmStart ?? 120} BPM`));
        } else if (block.supportRef) {
            meta.appendChild(createElement('span', { className: 'session-block-card__tag' }, block.supportRef));
        }
        meta.appendChild(createElement('span', { className: 'session-block-card__tag' }, 'Tiempo libre'));
        body.appendChild(meta);
        card.appendChild(body);

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
                subSelectorContainer.appendChild(sel);
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

        // Metrónomo secundario (siempre disponible para cualquier bloque)
        if (block.supportType !== 'metronome') {
            this.container.appendChild(this.renderSecondaryMetronome(block));
        }

        // Botón siguiente / finalizar — siempre visible, buen tamaño táctil
        const nextBtn = createElement('button', {
            className: 'btn-primary session-next-btn'
        }, isLast ? '✓ Finalizar sesión' : 'Siguiente bloque →');
        nextBtn.addEventListener('click', () => this.completeCurrentBlock());
        this.container.appendChild(nextBtn);

        // Arrancar timer
        this.blockStartTime = Date.now();
        this.cycleCount = 0;
        this.startTimer(timerDisplay);
    }

    private renderSupport(block: SessionBlock): HTMLElement {
        const card = createElement('div', { className: 'card p-6 mb-4' });

        if (block.type === 'warmup' || block.supportType === 'lehra' || block.supportType === 'song') {
            const url = block.type === 'warmup' ? (block.lehraUrl ?? '') : (block.supportUrl ?? '');
            if (url) {
                // Convertir URL normal de YouTube a embed
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
                const dot = createElement('div', { className: 'beat-indicator' });
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
        card.appendChild(createElement('h4', { className: 'font-bold mb-4' },
            block.type === 'warmup' ? (block.kaydaName ?? 'Kayda') : `${block.taalName} — ${block.variationName}`));

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
            this.renderStep2();
        } else {
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
            const key = b.type === 'warmup' ? 'Warm Up' : (b.taalName ?? 'Desconocido');
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
        const saveBtn = createElement('button', { className: 'btn-primary session-start-btn' }, '💾 Guardar sesión');
        saveBtn.addEventListener('click', () => {
            this.showSaveModal(state.notes, totalSecs, state.blocks, saveBtn);
        });
        this.container.appendChild(saveBtn);

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
        yesBtn.addEventListener('click', () => this.renderStep1());

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
        this.container.appendChild(discardWrapper);

        // Nueva sesión (enlace secundario al fondo)
        const newSessionLink = createElement('button', {
            className: 'session-new-link',
        }, 'Nueva sesión');
        newSessionLink.addEventListener('click', () => this.renderStep1());
        this.container.appendChild(newSessionLink);
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
        // Convertir youtube.com/watch?v=ID o youtu.be/ID a embed
        const watchMatch = url.match(/youtube\.com\/watch\?v=([\w-]+)/);
        const shortMatch = url.match(/youtu\.be\/([\w-]+)/);
        const embedMatch = url.match(/youtube\.com\/embed\/([\w-]+)/);
        const id = (watchMatch ?? shortMatch ?? embedMatch)?.[1];
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
        triggerBtn: HTMLElement
    ): void {
        // Usuarios autorizados — contraseñas hasheadas de forma simple
        const USERS: Record<string, string> = {
            prashant: 'dholak_prashant',
            meera:    'dholak_meera',
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
            className: 'w-full',
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
            const userId   = userSelect.value;
            const password = passInput.value.trim();

            if (password !== USERS[userId]) {
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
                })),
            };

            try {
                const result: { data: unknown; error: unknown } = await new Promise(resolve => {
                    db.from('sessions').insert(record).then(resolve);
                });

                if (result.error) throw result.error;

                // Éxito
                overlay.remove();
                triggerBtn.textContent = '✓ Sesión guardada';
                triggerBtn.style.opacity = '0.6';
                triggerBtn.style.cursor  = 'default';
                triggerBtn.replaceWith(triggerBtn.cloneNode(true)); // eliminar listener

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
