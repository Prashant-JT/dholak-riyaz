/**
 * WIZARD STEP 2 — Ejecución bloque a bloque
 * Renderiza el player de práctica: timer, soporte rítmico (metrónomo /
 * canción / lehra), patrón visual y botón de siguiente / finalizar.
 */

import { createElement, applyBolIndicators, bolsHaveIndicators, createBolIndicatorsLegend, chunkArray, VIBHAG_DIVIDERS } from '../../core/utils.js';
import { TAALS } from '../../data/taals/index.js';
import { KAYDAS } from '../../data/kaydas.js';
import { LEHRAS } from '../../data/lehras.js';
import { SONGS } from '../../data/songs.js';
import { FILLERS } from '../../data/fillers.js';
import { CONFIG } from '../../core/config.js';
import { MetronomeEngine } from '../../components/metronome.js';
import type { SessionBlock, SessionState, Matra } from '../../types.js';
import { saveSessionDraft } from './wizardDraft.js';

// IDs de taals activos: los que aparecen en NAVIGATION y existen en TAALS
const activeTaals: string[] = CONFIG.NAVIGATION
    .map(item => item.id)
    .filter(id => id in TAALS);

// Mapeo taalId → primera palabra del nombre (para filtrar canciones por taal)
const TAAL_SONG_PREFIXES: Record<string, string> = Object.fromEntries(
    activeTaals.map(id => [id, TAALS[id].name.split(' ')[0]])
);

export interface Step2State {
    metronome:      MetronomeEngine | null;
    timerInterval:  number | null;
    cycleCount:     number;
}

export interface Step2Callbacks {
    onComplete: () => void;   // bloque completado → siguiente o step3
    getState:   () => Step2State;
    setState:   (patch: Partial<Step2State>) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Punto de entrada
// ─────────────────────────────────────────────────────────────────────────────

export function renderStep2(
    container: HTMLElement,
    sessionState: SessionState,
    blockStartTime: number,
    cb: Step2Callbacks
): void {
    stopTimer(cb);
    stopMetronome(cb);
    container.innerHTML = '';

    const block = sessionState.blocks[sessionState.currentBlockIndex];
    // Safety guard: if the block index is out of bounds (e.g. a draft saved
    // mid-animation after the last block), show a recovery message instead of crashing.
    if (!block) {
        container.appendChild(Object.assign(document.createElement('p'), {
            className: 'text-muted text-center py-12',
            textContent: 'No se pudo cargar el bloque. Por favor, recarga la página.',
        }));
        return;
    }
    const isLast = sessionState.currentBlockIndex === sessionState.blocks.length - 1;
    const blockNum = sessionState.currentBlockIndex + 1;

    // Header con progress bar
    const header = createElement('div', { className: 'mb-4' });

    // Dots de progreso — un punto por bloque
    const dotsRow = createElement('div', { className: 'session-progress-dots' });
    sessionState.blocks.forEach((_b, i) => {
        const dot = createElement('div', {
            className: `session-progress-dot${i < blockNum ? ' session-progress-dot--done' : ''}${i === sessionState.currentBlockIndex ? ' session-progress-dot--current' : ''}`
        });
        dotsRow.appendChild(dot);
    });
    header.appendChild(dotsRow);

    const subtitleEl = createElement('p', { className: 'section-subtitle' });
    const getSubtitleText = (b: SessionBlock): string =>
        b.type === 'warmup'  ? `Warm Up — ${b.kaydaName}`
        : b.type === 'pickup'  ? `Pickup — ${b.pickupTaalCategory ?? ''}`
        : `${b.taalName} · ${b.variationName}`;
    subtitleEl.textContent = getSubtitleText(block);
    header.appendChild(subtitleEl);
    container.appendChild(header);

    // Timer display
    const timerCard = createElement('div', { className: 'card p-6 mb-4 text-center' });
    const timerDisplay = createElement('div', {
        className: 'mono-font text-center mb-1',
        style: { fontSize: '4rem', letterSpacing: '2px' }
    }, '00:00');
    timerCard.appendChild(timerDisplay);
    timerCard.appendChild(createElement('p', { className: 'text-muted text-sm' }, 'Cronómetro libre'));
    container.appendChild(timerCard);

    container.appendChild(renderSupportZone(block, cb));
    container.appendChild(renderPatternZone(block));

    if (block.type === 'pickup' || block.supportType !== 'metronome') {
        container.appendChild(renderSecondaryMetronome(block, cb));
    }

    // ✏️ Edit button + panel — just before the next/finish button
    const editBtn = createElement('button', { className: 'session-edit-btn' }, '✏️ Editar bloque');
    container.appendChild(editBtn);

    const editPanel = createElement('div', { className: 'session-edit-panel', style: { display: 'none' } });
    container.appendChild(editPanel);

    editBtn.addEventListener('click', () => {
        const isOpen = editPanel.style.display !== 'none';
        if (isOpen) {
            editPanel.style.display = 'none';
            editBtn.textContent = '✏️ Editar bloque';
        } else {
            editPanel.innerHTML = '';
            renderEditPanel(editPanel, block, sessionState, blockStartTime, cb, () => {
                stopTimer(cb);
                renderStep2(container, sessionState, blockStartTime, cb);
            });
            editPanel.style.display = '';
            editBtn.textContent = '✕ Cerrar';
        }
    });

    const nextBtn = createElement('button', { className: 'btn-primary session-next-btn' },
        isLast ? '✓ Finalizar sesión' : 'Siguiente bloque →');
    nextBtn.addEventListener('click', () => {
        // Disable immediately to prevent double-click triggering two completions
        nextBtn.setAttribute('disabled', 'true');
        completeCurrentBlock(container, sessionState, blockStartTime, cb);
    });
    container.appendChild(nextBtn);

    cb.setState({
        cycleCount: sessionState.blocks[sessionState.currentBlockIndex]?.cyclesCompleted ?? 0
    });
    startTimer(timerDisplay, blockStartTime, cb, sessionState);
}

// ─────────────────────────────────────────────────────────────────────────────
// Completar bloque actual
// ─────────────────────────────────────────────────────────────────────────────

export function completeCurrentBlock(
    container: HTMLElement,
    sessionState: SessionState,
    blockStartTime: number,
    cb: Step2Callbacks
): void {
    const block = sessionState.blocks[sessionState.currentBlockIndex];
    block.durationSecs = Math.floor((Date.now() - blockStartTime) / 1000);
    block.completedAt = Date.now();

    stopTimer(cb);
    stopMetronome(cb);

    const isLast = sessionState.currentBlockIndex === sessionState.blocks.length - 1;

    const flash = createElement('div', { className: 'session-block-complete-flash' });
    const iconSpan = createElement('span', { className: 'session-block-complete-flash__icon' }, isLast ? '🎉' : '✓');
    const textSpan = createElement('span', {}, isLast ? '¡Sesión completada!' : 'Bloque completado');
    flash.appendChild(iconSpan);
    flash.appendChild(textSpan);
    container.appendChild(flash);
    // Force reflow so the CSS transition fires (needed in all browsers including Safari)
    void flash.offsetWidth;
    flash.classList.add('session-block-complete-flash--visible');

    // Single timeout — advance state and navigate when the flash is done.
    // Guard: if the container was removed from the DOM (e.g. user navigated away),
    // still save the draft so no data is lost.
    setTimeout(() => {
        sessionState.currentBlockIndex++;
        if (isLast) {
            saveSessionDraft(sessionState, blockStartTime, true);
        } else {
            saveSessionDraft(sessionState, Date.now());
        }
        cb.onComplete();
    }, 900);
}

// ─────────────────────────────────────────────────────────────────────────────
// Rhythmic support
// ─────────────────────────────────────────────────────────────────────────────

function renderSupportZone(block: SessionBlock, cb: Step2Callbacks): HTMLElement {
    const card = createElement('div', { className: 'card p-6 mb-4 session-edit-support-zone' });

    if (block.type === 'pickup') {
        const patternDisplay = createElement('div', { className: 'session-pickup-pattern' });
        patternDisplay.textContent = block.pickupName ?? '';
        card.appendChild(patternDisplay);
        if (block.pickupVideoUrl) {
            card.appendChild(createElement('iframe', {
                src: toEmbedUrl(block.pickupVideoUrl),
                style: { width: '100%', height: '220px', border: 'none', borderRadius: '8px', marginTop: '0.75rem' },
                allowfullscreen: 'true'
            }));
        }
    } else if (block.type === 'warmup' || block.supportType === 'lehra' || block.supportType === 'song') {
        const url = block.type === 'warmup' ? (block.lehraUrl ?? '') : (block.supportUrl ?? '');
        if (url) {
            card.appendChild(createElement('iframe', {
                src: toEmbedUrl(url),
                style: { width: '100%', height: '220px', border: 'none', borderRadius: '8px' },
                allowfullscreen: 'true'
            }));
        }
        if (block.supportRef) {
            card.appendChild(createElement('p', { className: 'text-muted text-sm mt-2 text-center' }, block.supportRef));
        }
    } else if (block.supportType === 'metronome') {
        const taalField = createElement('div', { className: 'session-form-field mb-4' });
        taalField.appendChild(createElement('label', {
            style: {
                display: 'block', fontSize: '0.8125rem', fontWeight: '600',
                color: 'var(--text-secondary)', marginBottom: '0.375rem',
                textTransform: 'uppercase', letterSpacing: '0.04em'
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

        const metroBody = createElement('div', {});
        card.appendChild(metroBody);

        const buildForTaal = (taalId: string) => {
            metroBody.innerHTML = '';
            buildMetronomeUI(metroBody, TAALS[taalId]?.beats ?? 8, block.bpmStart ?? 120, block, cb);
        };
        taalSelect.addEventListener('change', () => { stopMetronome(cb); buildForTaal(taalSelect.value); });
        buildForTaal(taalSelect.value);
    }

    return card;
}

// ─────────────────────────────────────────────────────────────────────────────
// Metronome UI
// ─────────────────────────────────────────────────────────────────────────────

export function buildMetronomeUI(
    container: HTMLElement,
    initialBeats: number,
    initialBpm: number,
    block: SessionBlock | undefined,
    cb: Step2Callbacks
): void {
    if (cb.getState().metronome) cb.getState().metronome!.stop();
    const metro = new MetronomeEngine();
    metro.setBPM(initialBpm);
    metro.setBeatsPerMeasure(initialBeats);
    cb.setState({ metronome: metro });

    const indicatorsRow = createElement('div', { className: 'flex flex-wrap justify-center gap-3 mb-4' });
    let indicators: HTMLElement[] = [];

    const rebuildIndicators = (beats: number) => {
        indicatorsRow.innerHTML = '';
        indicators = [];
        for (let i = 0; i < beats; i++) {
            const dot = createElement('div', { className: 'beat-indicator', 'data-beat': String(i) });
            indicatorsRow.appendChild(dot);
            indicators.push(dot);
        }
    };
    rebuildIndicators(initialBeats);
    container.appendChild(indicatorsRow);

    metro.onBeat((beat: number) => {
        indicators.forEach((d, i) => d.classList.toggle('active', i === beat));
    });

    const bpmDisplay = createElement('div', {
        className: 'mono-font text-center mb-2', style: { fontSize: '3rem' }
    }, `${initialBpm} BPM`);
    container.appendChild(bpmDisplay);

    const cycleDisplay = createElement('div', { className: 'text-muted text-sm text-center mb-3' }, 'Ciclos: 0');
    container.appendChild(cycleDisplay);

    metro.onCycle((_cycle: number) => {
        const state = cb.getState();
        const newCount = state.cycleCount + 1;
        cb.setState({ cycleCount: newCount });
        cycleDisplay.textContent = `Ciclos: ${newCount}`;
        if (block) block.cyclesCompleted = newCount;
    });

    const bpmRow = createElement('div', { className: 'flex items-center justify-center gap-4 mb-4' });
    const minusBtn = createElement('button', { className: 'bpm-adj-btn' }, '−');
    const plusBtn  = createElement('button', { className: 'bpm-adj-btn' }, '+');
    let currentBpm = initialBpm;

    minusBtn.addEventListener('click', () => {
        currentBpm = Math.max(40, currentBpm - 5);
        cb.getState().metronome?.setBPM(currentBpm);
        bpmDisplay.textContent = `${currentBpm} BPM`;
        if (block) block.bpmEnd = currentBpm;
    });
    plusBtn.addEventListener('click', () => {
        currentBpm = Math.min(400, currentBpm + 5);
        cb.getState().metronome?.setBPM(currentBpm);
        bpmDisplay.textContent = `${currentBpm} BPM`;
        if (block) block.bpmEnd = currentBpm;
    });
    bpmRow.appendChild(minusBtn);
    bpmRow.appendChild(createElement('span', { className: 'text-muted text-sm' }, 'BPM'));
    bpmRow.appendChild(plusBtn);
    container.appendChild(bpmRow);

    const playBtn = createElement('button', {
        className: 'btn-primary w-full', style: { fontSize: '1.1rem', padding: '0.875rem' }
    }, '▶ Play');
    let playing = false;

    const stopPlayback = () => {
        playing = false;
        cb.getState().metronome?.stop();
        indicators.forEach(d => d.classList.remove('active'));
        playBtn.textContent = '▶ Play';
        playBtn.className = 'btn-primary w-full';
        (playBtn as HTMLElement).style.padding = '0.875rem';
    };

    playBtn.addEventListener('click', () => {
        playing = !playing;
        if (playing) {
            cb.setState({ cycleCount: 0 });
            cb.getState().metronome?.start();
            playBtn.textContent = '⏹ Stop';
            playBtn.className = 'btn-secondary w-full';
            (playBtn as HTMLElement).style.padding = '0.875rem';
        } else {
            stopPlayback();
        }
    });
    container.appendChild(playBtn);
    void stopPlayback;
}

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible secondary metronome
// ─────────────────────────────────────────────────────────────────────────────

function renderSecondaryMetronome(block: SessionBlock, cb: Step2Callbacks): HTMLElement {
    const wrapper = createElement('div', { className: 'session-metro-wrapper' });

    const toggleBtn = createElement('button', { className: 'btn-secondary session-metro-toggle' }, 'Metrónomo de apoyo');
    const metroCard = createElement('div', {
        className: 'card p-6 session-metro-card', style: { display: 'none' }
    });

    const taalField = createElement('div', { className: 'session-form-field mb-4' });
    taalField.appendChild(createElement('label', {
        style: {
            display: 'block', fontSize: '0.8125rem', fontWeight: '600',
            color: 'var(--text-secondary)', marginBottom: '0.375rem',
            textTransform: 'uppercase', letterSpacing: '0.04em'
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

    const metroBody = createElement('div', {});
    metroCard.appendChild(metroBody);

    const buildForTaal = (taalId: string) => {
        metroBody.innerHTML = '';
        buildMetronomeUI(metroBody, TAALS[taalId]?.beats ?? 8, block.bpmStart ?? 80, undefined, cb);
    };

    taalSelect.addEventListener('change', () => { stopMetronome(cb); buildForTaal(taalSelect.value); });

    let metroBuilt = false;
    toggleBtn.addEventListener('click', () => {
        const isOpen = metroCard.style.display !== 'none';
        if (isOpen) {
            stopMetronome(cb);
            metroCard.style.display = 'none';
            toggleBtn.textContent = 'Metrónomo de apoyo';
        } else {
            if (!metroBuilt) { buildForTaal(taalSelect.value); metroBuilt = true; }
            metroCard.style.display = '';
            toggleBtn.textContent = 'Ocultar metrónomo';
        }
    });

    wrapper.appendChild(toggleBtn);
    wrapper.appendChild(metroCard);
    return wrapper;
}

// ─────────────────────────────────────────────────────────────────────────────
// Taal / kayda visual pattern
// ─────────────────────────────────────────────────────────────────────────────

function renderPatternZone(block: SessionBlock): HTMLElement {
    const card = createElement('div', { className: 'card p-6 mb-4 session-edit-pattern-zone' });

    if (block.type === 'pickup') return createElement('div', {});

    const title = block.type === 'warmup'
        ? (block.kaydaName ?? 'Kayda')
        : `${block.taalName ?? ''} — ${block.variationName ?? ''}`;
    card.appendChild(createElement('h4', { className: 'font-bold mb-4' }, title));

    if (block.type === 'warmup' && block.kaydaId) {
        const kayda = KAYDAS[block.kaydaId];
        if (kayda) {
            card.appendChild(createElement('p', { className: 'text-muted text-sm mb-4' },
                `${kayda.taal} · ${kayda.beats} tiempos`));

            kayda.rows.forEach((row, rowIndex) => {
                const isMobile = window.innerWidth < 768;
                const groups: Matra[][] = isMobile ? chunkArray(row.matras, 4) : [row.matras];

                groups.forEach((group, groupIndex) => {
                    const isFirst = rowIndex === 0 && groupIndex === 0;
                    const rowDiv = createElement('div', { className: `taal-row-separator ${!isFirst ? 'mt-6' : ''}` });
                    if (groupIndex === 0) {
                        rowDiv.appendChild(createElement('h4', { className: 'text-sm font-semibold text-muted mt-4 mb-3' }, row.label));
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

            if (bolsHaveIndicators(kayda.rows)) card.appendChild(createBolIndicatorsLegend());
        }
        return card;
    }

    // Practice block
    let rows: Matra[][] = [];
    if (block.taalId) {
        const taal = TAALS[block.taalId];
        if (taal) {
            rows = block.variationName === 'Patrón Principal'
                ? taal.rows
                : (taal.variations?.find(v => v.name === block.variationName)?.rows ?? taal.rows);
        }
    }

    const taalBeats = block.taalId ? (TAALS[block.taalId]?.beats ?? 0) : 0;
    rows.forEach((row, rowIndex) => {
        const rowDiv = createElement('div', { className: `taal-row-separator ${rowIndex > 0 ? 'mt-6' : ''}` });
        const grid = createElement('div', {
            className: 'grid gap-4 pt-6',
            style: { gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }
        });
        row.forEach((matra: Matra) => {
            const cell = createElement('div', { className: 'bol-cell' });
            // Apply orange right-border dividers on desktop (same logic as taals view)
            if (window.innerWidth >= 768 && VIBHAG_DIVIDERS[taalBeats]?.includes(matra.matra)) {
                cell.style.borderRight = '4px solid var(--orange-500)';
                cell.style.paddingRight = '0.5rem';
            }
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

// ─────────────────────────────────────────────────────────────────────────────
// Timer y helpers
// ─────────────────────────────────────────────────────────────────────────────

function startTimer(
    display: HTMLElement,
    blockStartTime: number,
    cb: Step2Callbacks,
    sessionState: SessionState,
): void {
    // Render immediately so a recovered session shows the correct elapsed time
    // right away instead of showing 00:00 for the first second.
    display.textContent = formatTime(Math.floor((Date.now() - blockStartTime) / 1000));

    let tickCount = 0;
    const interval = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - blockStartTime) / 1000);
        display.textContent = formatTime(elapsed);
        // Every 10 ticks (10 s) persist durationSecs so a crash mid-block
        // does not lose elapsed practice time on draft recovery.
        tickCount++;
        if (tickCount % 10 === 0) {
            const block = sessionState.blocks[sessionState.currentBlockIndex];
            if (block) block.durationSecs = elapsed;
            saveSessionDraft(sessionState, blockStartTime);
        }
    }, 1000);
    cb.setState({ timerInterval: interval });
}

export function stopTimer(cb: Step2Callbacks): void {
    const { timerInterval } = cb.getState();
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        cb.setState({ timerInterval: null });
    }
}

export function stopMetronome(cb: Step2Callbacks): void {
    const { metronome } = cb.getState();
    if (metronome) {
        metronome.stop();
        cb.setState({ metronome: null });
    }
}

export function formatTime(totalSecs: number): string {
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function toEmbedUrl(url: string): string {
    const watchMatch  = url.match(/youtube\.com\/watch\?v=([\w-]+)/);
    const shortMatch  = url.match(/youtu\.be\/([\w-]+)/);
    const embedMatch  = url.match(/youtube\.com\/embed\/([\w-]+)/);
    const shortsMatch = url.match(/youtube\.com\/shorts\/([\w-]+)/);
    const id = (watchMatch ?? shortMatch ?? embedMatch ?? shortsMatch)?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : url;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline block edit panel during a session
// ─────────────────────────────────────────────────────────────────────────────

function renderEditPanel(
    panel: HTMLElement,
    block: SessionBlock,
    sessionState: SessionState,
    blockStartTime: number,
    cb: Step2Callbacks,
    onConfirm: () => void
): void {

    // ── WARM UP ───────────────────────────────────────────────────────────────
    if (block.type === 'warmup') {
        const lehraField = createElement('div', { className: 'session-form-field' });
        lehraField.appendChild(createElement('label', {}, 'Lehra'));
        const lehraSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
        LEHRAS.filter(l => l.url).forEach(l => {
            const opt = createElement('option', { value: l.url }, l.label) as HTMLOptionElement;
            if (l.url === block.lehraUrl) opt.selected = true;
            lehraSelect.appendChild(opt);
        });
        lehraField.appendChild(lehraSelect);
        panel.appendChild(lehraField);

        const kaydaField = createElement('div', { className: 'session-form-field' });
        kaydaField.appendChild(createElement('label', {}, 'Kayda'));
        const kaydaSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
        Object.entries(KAYDAS).forEach(([id, k]) => {
            const opt = createElement('option', { value: id }, k.name) as HTMLOptionElement;
            if (id === block.kaydaId) opt.selected = true;
            kaydaSelect.appendChild(opt);
        });
        kaydaField.appendChild(kaydaSelect);
        panel.appendChild(kaydaField);

        const confirmBtn = createElement('button', { className: 'btn-primary session-edit-confirm-btn' }, '✓ Confirmar cambios');
        confirmBtn.addEventListener('click', () => {
            const lehraIdx = LEHRAS.findIndex(l => l.url === lehraSelect.value);
            block.lehraUrl   = lehraSelect.value;
            block.lehraLabel = LEHRAS[lehraIdx]?.label ?? '';
            block.kaydaId    = kaydaSelect.value;
            block.kaydaName  = KAYDAS[kaydaSelect.value]?.name ?? '';
            saveSessionDraft(sessionState, blockStartTime);
            onConfirm();
        });
        panel.appendChild(confirmBtn);
        return;
    }

    // ── PICKUP ────────────────────────────────────────────────────────────────
    if (block.type === 'pickup') {
        const catField = createElement('div', { className: 'session-form-field' });
        catField.appendChild(createElement('label', {}, 'Taal / Categoría'));
        const catSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
        const categories = [...new Set(FILLERS.map(f => f.category))];
        categories.forEach(cat => {
            const opt = createElement('option', { value: cat }, cat) as HTMLOptionElement;
            if (cat === block.pickupTaalCategory) opt.selected = true;
            catSelect.appendChild(opt);
        });
        catField.appendChild(catSelect);
        panel.appendChild(catField);

        const patField = createElement('div', { className: 'session-form-field' });
        patField.appendChild(createElement('label', {}, 'Patrón'));
        const patSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
        patField.appendChild(patSelect);
        panel.appendChild(patField);

        const refreshPatterns = (category: string) => {
            patSelect.innerHTML = '';
            const patterns = FILLERS.find(f => f.category === category)?.patterns ?? [];
            patterns.forEach(p => {
                const opt = createElement('option', {
                    value: JSON.stringify({ name: p.name, link: p.link ?? '' })
                }, p.name) as HTMLOptionElement;
                if (p.name === block.pickupName) opt.selected = true;
                patSelect.appendChild(opt);
            });
        };
        refreshPatterns(catSelect.value);
        catSelect.addEventListener('change', () => refreshPatterns(catSelect.value));

        const confirmBtn = createElement('button', { className: 'btn-primary session-edit-confirm-btn' }, '✓ Confirmar cambios');
        confirmBtn.addEventListener('click', () => {
            try {
                const parsed = JSON.parse(patSelect.value) as { name: string; link: string };
                block.pickupName          = parsed.name;
                block.pickupVideoUrl      = parsed.link ?? '';
                block.pickupTaalCategory  = catSelect.value;
            } catch { /* no-op */ }
            saveSessionDraft(sessionState, blockStartTime);
            onConfirm();
        });
        panel.appendChild(confirmBtn);
        return;
    }

    // ── PRACTICE ──────────────────────────────────────────────────────────────
    const taalField = createElement('div', { className: 'session-form-field' });
    taalField.appendChild(createElement('label', {}, 'Taal'));
    const taalSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
    activeTaals.forEach(id => {
        const opt = createElement('option', { value: id }, TAALS[id]?.name ?? id) as HTMLOptionElement;
        if (id === block.taalId) opt.selected = true;
        taalSelect.appendChild(opt);
    });
    taalField.appendChild(taalSelect);
    panel.appendChild(taalField);

    const varField = createElement('div', { className: 'session-form-field' });
    varField.appendChild(createElement('label', {}, 'Variación'));
    const varSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
    varField.appendChild(varSelect);
    panel.appendChild(varField);

    const bolPreview = createElement('div', { className: 'session-bol-preview' });
    panel.appendChild(bolPreview);

    const getBolsPreview = (taalId: string, varValue: string): string => {
        const taal = TAALS[taalId];
        if (!taal) return '';
        const rows = varValue === '__main__'
            ? taal.rows
            : (taal.variations?.find(v => v.name === varValue)?.rows ?? taal.rows);
        return rows.flatMap(r => r.map(m => m.bol.replace(/\s*\([^)]*\)/g, ''))).join(' · ');
    };

    const refreshVariations = (taalId: string, currentVarName?: string) => {
        varSelect.innerHTML = '';
        varSelect.appendChild(createElement('option', { value: '__main__' }, 'Patrón Principal') as HTMLOptionElement);
        (TAALS[taalId]?.variations ?? []).forEach(v => {
            if (!v.special) {
                const opt = createElement('option', { value: v.name }, v.name) as HTMLOptionElement;
                if (v.name === (currentVarName ?? block.variationName)) opt.selected = true;
                varSelect.appendChild(opt);
            }
        });
        // Pre-select main pattern if it was the current block's variation
        if ((currentVarName ?? block.variationName) === 'Patrón Principal') {
            (varSelect.options[0] as HTMLOptionElement).selected = true;
        }
        bolPreview.textContent = getBolsPreview(taalId, varSelect.value);
    };
    refreshVariations(taalSelect.value);
    taalSelect.addEventListener('change', () => refreshVariations(taalSelect.value));
    varSelect.addEventListener('change', () => {
        bolPreview.textContent = getBolsPreview(taalSelect.value, varSelect.value);
    });

    const supportField = createElement('div', { className: 'session-form-field' });
    supportField.appendChild(createElement('label', {}, 'Soporte rítmico'));
    const supportSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
    ['song', 'lehra', 'metronome'].forEach(s => {
        const labels: Record<string, string> = { metronome: 'Metrónomo', song: 'Canción', lehra: 'Lehra' };
        const opt = createElement('option', { value: s }, labels[s]) as HTMLOptionElement;
        if (s === block.supportType) opt.selected = true;
        supportSelect.appendChild(opt);
    });
    supportField.appendChild(supportSelect);
    panel.appendChild(supportField);

    const subContainer = createElement('div', { className: 'session-form-field' });
    panel.appendChild(subContainer);

    const bpmRow = createElement('div', { className: 'session-form-field' });
    bpmRow.appendChild(createElement('label', {}, 'BPM inicial'));
    const bpmInput = createElement('input', {
        type: 'number', min: '40', max: '400',
        value: String(block.bpmStart ?? 120), className: 'w-full'
    }) as HTMLInputElement;
    bpmRow.appendChild(bpmInput);
    panel.appendChild(bpmRow);

    const refreshSubSelector = (supportType: string, currentUrl?: string) => {
        subContainer.innerHTML = '';
        bpmRow.style.display = supportType === 'metronome' ? '' : 'none';

        if (supportType === 'song') {
            subContainer.appendChild(createElement('label', {}, 'Canción'));

            // Song search
            const searchInput = createElement('input', {
                type: 'text', placeholder: '🔍 Buscar canción…',
                className: 'w-full session-song-search',
            }) as HTMLInputElement;
            subContainer.appendChild(searchInput);

            const sel = createElement('select', { className: 'w-full', 'data-sub-select': 'song' }) as HTMLSelectElement;
            const allSongs = SONGS.filter(s => s.taal.toLowerCase().startsWith(
                TAAL_SONG_PREFIXES[taalSelect.value]?.toLowerCase() ?? ''
            ));
            const selectedUrl = currentUrl ?? block.supportUrl;

            const customWrap = createElement('div', { className: 'session-custom-song' });
            customWrap.style.display = 'none';

            const rebuildOptions = (query: string) => {
                sel.innerHTML = '';
                const q = query.toLowerCase().trim();
                const visible = q ? allSongs.filter(s =>
                    s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
                ) : allSongs;
                if (visible.length === 0) {
                    sel.appendChild(createElement('option', { value: '' }, 'Sin resultados') as HTMLOptionElement);
                } else {
                    visible.forEach(s => {
                        const opt = createElement('option', { value: s.youtubeUrl }, `${s.title} — ${s.artist}`) as HTMLOptionElement;
                        if (s.youtubeUrl === selectedUrl) opt.selected = true;
                        sel.appendChild(opt);
                    });
                }
                sel.appendChild(createElement('option', { value: '__custom__' }, '＋ Otra canción (pegar URL)…') as HTMLOptionElement);
                customWrap.style.display = 'none';
            };

            const customTitle = createElement('input', {
                type: 'text', placeholder: 'Título de la canción', className: 'w-full session-custom-input', 'data-custom-title': 'true',
            }) as HTMLInputElement;
            const customUrl = createElement('input', {
                type: 'url', placeholder: 'URL de YouTube (https://…)', className: 'w-full session-custom-input', 'data-custom-url': 'true',
            }) as HTMLInputElement;
            customWrap.appendChild(customTitle);
            customWrap.appendChild(customUrl);

            rebuildOptions('');
            subContainer.appendChild(sel);
            subContainer.appendChild(customWrap);

            searchInput.addEventListener('input', () => rebuildOptions(searchInput.value));
            sel.addEventListener('change', () => { customWrap.style.display = sel.value === '__custom__' ? '' : 'none'; });
        } else if (supportType === 'lehra') {
            subContainer.appendChild(createElement('label', {}, 'Lehra'));
            const sel = createElement('select', { className: 'w-full', 'data-sub-select': 'lehra' }) as HTMLSelectElement;
            LEHRAS.filter(l => l.url).forEach(l => {
                const opt = createElement('option', { value: l.url }, l.label) as HTMLOptionElement;
                if (l.url === (currentUrl ?? block.supportUrl)) opt.selected = true;
                sel.appendChild(opt);
            });
            subContainer.appendChild(sel);
        }
    };
    refreshSubSelector(supportSelect.value, block.supportUrl);
    supportSelect.addEventListener('change', () => refreshSubSelector(supportSelect.value));
    taalSelect.addEventListener('change', () => {
        if (supportSelect.value === 'song') refreshSubSelector('song');
    });

    const confirmBtn = createElement('button', { className: 'btn-primary session-edit-confirm-btn' }, '✓ Confirmar cambios');
    confirmBtn.addEventListener('click', () => {
        const taalId     = taalSelect.value;
        const varName    = varSelect.value === '__main__' ? 'Patrón Principal' : varSelect.value;
        const supportType = supportSelect.value as 'metronome' | 'song' | 'lehra';
        const subSel     = subContainer.querySelector('[data-sub-select]') as HTMLSelectElement | null;

        block.taalId        = taalId;
        block.taalName      = TAALS[taalId]?.name ?? taalId;
        block.variationName = varName;
        block.supportType   = supportType;

        if (supportType === 'metronome') {
            block.bpmStart  = parseInt(bpmInput.value, 10);
            block.supportRef = `${bpmInput.value} BPM`;
            block.supportUrl = '';
            // Reset metronome with new taal and BPM
            stopMetronome(cb);
        } else if (supportType === 'song' && subSel?.value === '__custom__') {
            const ct = subContainer.querySelector('[data-custom-title]') as HTMLInputElement | null;
            const cu = subContainer.querySelector('[data-custom-url]') as HTMLInputElement | null;
            block.supportRef = ct?.value.trim() || 'Canción personalizada';
            block.supportUrl = cu?.value.trim() ?? '';
        } else if (subSel) {
            block.supportUrl = subSel.value;
            block.supportRef = subSel.options[subSel.selectedIndex]?.text ?? '';
        }

        saveSessionDraft(sessionState, blockStartTime);
        onConfirm();
    });
    panel.appendChild(confirmBtn);
}
