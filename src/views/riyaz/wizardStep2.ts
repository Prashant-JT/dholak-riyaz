/**
 * WIZARD STEP 2 — Ejecución bloque a bloque
 * Renderiza el player de práctica: timer, soporte rítmico (metrónomo /
 * canción / lehra), patrón visual y botón de siguiente / finalizar.
 */

import { createElement, applyBolIndicators, bolsHaveIndicators, createBolIndicatorsLegend } from '../../core/utils.js';
import { TAALS } from '../../data/taals/index.js';
import { KAYDAS } from '../../data/kaydas.js';
import { MetronomeEngine } from '../../components/metronome.js';
import type { SessionBlock, SessionState, Matra } from '../../types.js';
import { saveSessionDraft } from './wizardDraft.js';

/** Divide un array en grupos de tamaño n */
function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
}

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
    const isLast = sessionState.currentBlockIndex === sessionState.blocks.length - 1;
    const blockNum = sessionState.currentBlockIndex + 1;
    const totalBlocks = sessionState.blocks.length;

    // Header
    const header = createElement('div', { className: 'mb-6' });
    header.appendChild(createElement('h2', { className: 'section-title' }, `Bloque ${blockNum} de ${totalBlocks}`));
    const subtitle = block.type === 'warmup'
        ? `Warm Up — ${block.kaydaName}`
        : block.type === 'pickup'
            ? `Pickup — ${block.pickupTaalCategory ?? ''}`
            : `${block.taalName} · ${block.variationName}`;
    header.appendChild(createElement('p', { className: 'section-subtitle' }, subtitle));
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

    container.appendChild(renderSupport(block, cb));
    container.appendChild(renderPattern(block));

    if (block.type === 'pickup' || block.supportType !== 'metronome') {
        container.appendChild(renderSecondaryMetronome(block, cb));
    }

    const nextBtn = createElement('button', { className: 'btn-primary session-next-btn' },
        isLast ? '✓ Finalizar sesión' : 'Siguiente bloque →');
    nextBtn.addEventListener('click', () => completeCurrentBlock(container, sessionState, blockStartTime, cb));
    container.appendChild(nextBtn);

    cb.setState({
        cycleCount: sessionState.blocks[sessionState.currentBlockIndex]?.cyclesCompleted ?? 0
    });
    startTimer(timerDisplay, blockStartTime, cb);
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
    flash.innerHTML = isLast
        ? '<span class="session-block-complete-flash__icon">🎉</span><span>¡Sesión completada!</span>'
        : '<span class="session-block-complete-flash__icon">✓</span><span>Bloque completado</span>';
    container.appendChild(flash);
    flash.getBoundingClientRect();
    flash.classList.add('session-block-complete-flash--visible');

    setTimeout(() => {
        flash.classList.remove('session-block-complete-flash--visible');
        flash.classList.add('session-block-complete-flash--hide');
        setTimeout(() => {
            if (isLast) {
                saveSessionDraft(sessionState, blockStartTime, true);
            } else {
                sessionState.currentBlockIndex++;
                saveSessionDraft(sessionState, Date.now());
            }
            cb.onComplete();
        }, 350);
    }, 900);
}

// ─────────────────────────────────────────────────────────────────────────────
// Soporte rítmico
// ─────────────────────────────────────────────────────────────────────────────

function renderSupport(block: SessionBlock, cb: Step2Callbacks): HTMLElement {
    const card = createElement('div', { className: 'card p-6 mb-4' });

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
// UI del metrónomo
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
// Metrónomo secundario colapsable
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
// Patrón visual del taal / kayda
// ─────────────────────────────────────────────────────────────────────────────

function renderPattern(block: SessionBlock): HTMLElement {
    const card = createElement('div', { className: 'card p-6 mb-4' });

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

    // Bloque de práctica
    let rows: Matra[][] = [];
    if (block.taalId) {
        const taal = TAALS[block.taalId];
        if (taal) {
            rows = block.variationName === 'Patrón Principal'
                ? taal.rows
                : (taal.variations?.find(v => v.name === block.variationName)?.rows ?? taal.rows);
        }
    }

    rows.forEach((row, rowIndex) => {
        const rowDiv = createElement('div', { className: `taal-row-separator ${rowIndex > 0 ? 'mt-6' : ''}` });
        const grid = createElement('div', {
            className: 'grid gap-4 pt-6',
            style: { gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }
        });
        row.forEach((matra: Matra) => {
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

// ─────────────────────────────────────────────────────────────────────────────
// Timer y helpers
// ─────────────────────────────────────────────────────────────────────────────

function startTimer(display: HTMLElement, blockStartTime: number, cb: Step2Callbacks): void {
    const interval = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - blockStartTime) / 1000);
        display.textContent = formatTime(elapsed);
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
