/**
 * WIZARD STEP 1 — Configuración de sesión
 * Renderiza el formulario de configuración: plantillas, lista de bloques,
 * formularios de Warm Up / Práctica / Pickup y botón de inicio.
 */

import { createElement } from '../../core/utils.js';
import { TAALS } from '../../data/taals/index.js';
import { KAYDAS } from '../../data/kaydas.js';
import { LEHRAS } from '../../data/lehras.js';
import { SONGS } from '../../data/songs.js';
import { FILLERS } from '../../data/fillers.js';
import type { SessionBlock } from '../../types.js';
import {
    loadSavedTemplates,
    saveSavedTemplates,
    blocksToHash,
    type SavedTemplate,
} from './wizardDraft.js';

// Mapeo de taalId → prefijo del campo taal en SONGS
const TAAL_SONG_PREFIXES: Record<string, string> = {
    keherwa:    'Keherwa',
    dadra:      'Dadra',
    rupak:      'Rupak',
    deepchandi: 'Deepchandi',
};

export interface Step1Callbacks {
    onStart:    (blocks: SessionBlock[]) => void;
    onStep1:    (blocks?: SessionBlock[]) => void;  // re-render step1 (con bloques actualizados)
}

// ─────────────────────────────────────────────────────────────────────────────
// Punto de entrada
// ─────────────────────────────────────────────────────────────────────────────

export function renderStep1(
    container: HTMLElement,
    cb: Step1Callbacks,
    existingBlocks: SessionBlock[] = [],
    incomingShare: { name: string; blocks: SessionBlock[] } | null = null
): void {
    container.innerHTML = '';

    const header = createElement('div', { className: 'mb-6' });
    header.appendChild(createElement('h2', { className: 'section-title' }, 'Nueva Sesión de Riyaz'));
    header.appendChild(createElement('p', { className: 'section-subtitle' },
        'Configura tu sesión añadiendo bloques de práctica'));
    container.appendChild(header);

    if (incomingShare) {
        container.appendChild(renderShareModal(incomingShare, cb));
        return;
    }

    container.appendChild(renderTemplatesPanel(existingBlocks, cb));

    if (existingBlocks.length > 0) {
        container.appendChild(renderPlanBar(existingBlocks, cb));
    }

    const blockList = createElement('div', { id: 'block-list', className: 'mb-4' });
    existingBlocks.forEach((block, i) => {
        blockList.appendChild(createBlockSummaryCard(block, i, existingBlocks, cb));
    });
    container.appendChild(blockList);

    const hasWarmUp = existingBlocks.some(b => b.type === 'warmup');
    if (!hasWarmUp) container.appendChild(createWarmUpForm(existingBlocks, cb));

    container.appendChild(createPracticeBlockForm(existingBlocks, cb));
    container.appendChild(createPickupBlockForm(existingBlocks, cb));

    const canStart = existingBlocks.length > 0;
    const startBtn = createElement('button', {
        className: canStart ? 'btn-primary session-start-btn' : 'btn-secondary session-start-btn',
        style: { opacity: canStart ? '1' : '0.45', cursor: canStart ? 'pointer' : 'not-allowed' }
    }, canStart
        ? `▶ Comenzar sesión · ${existingBlocks.length} bloque${existingBlocks.length !== 1 ? 's' : ''}`
        : 'Añade al menos un bloque para empezar');

    if (canStart) startBtn.addEventListener('click', () => cb.onStart(existingBlocks));
    container.appendChild(startBtn);
}

/** Extrae el valor de #share=... de la URL y limpia el hash */
export function extractShareHash(): string | null {
    const hash = window.location.hash;
    const prefix = '#share=';
    if (!hash.startsWith(prefix)) return null;
    const value = hash.slice(prefix.length);
    history.replaceState(null, '', window.location.pathname + window.location.search);
    return value || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Barra de resumen + botón compartir
// ─────────────────────────────────────────────────────────────────────────────

function renderPlanBar(blocks: SessionBlock[], _cb: Step1Callbacks): HTMLElement {
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

    const shareBtn = createElement('button', { className: 'session-share-btn', title: 'Generar link para compartir' }, '📤');
    shareBtn.addEventListener('click', () => showSharePopup(blocks, shareBtn));
    bar.appendChild(shareBtn);
    return bar;
}

function showSharePopup(blocks: SessionBlock[], anchor: HTMLElement): void {
    document.querySelector('.session-share-popup')?.remove();

    const popup = createElement('div', { className: 'session-share-popup' });
    popup.appendChild(createElement('p', { className: 'session-share-popup__label' }, 'Nombre de la sesión:'));
    const nameInput = createElement('input', {
        type: 'text', placeholder: 'Ej: Foco Keherwa', className: 'session-share-popup__input',
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

// ─────────────────────────────────────────────────────────────────────────────
// Modal de sesión recibida vía URL
// ─────────────────────────────────────────────────────────────────────────────

function renderShareModal(share: { name: string; blocks: SessionBlock[] }, cb: Step1Callbacks): HTMLElement {
    const modal = createElement('div', { className: 'session-share-modal' });

    modal.appendChild(createElement('div', { className: 'session-share-modal__icon' }, '📋'));
    modal.appendChild(createElement('h3', { className: 'session-share-modal__title' }, 'Sesión recibida'));
    modal.appendChild(createElement('p', { className: 'session-share-modal__name' }, share.name));
    modal.appendChild(createElement('p', { className: 'session-share-modal__meta' },
        `${share.blocks.length} bloque${share.blocks.length !== 1 ? 's' : ''}`));

    const list = createElement('ul', { className: 'session-share-modal__list' });
    share.blocks.forEach(b => {
        const text = b.type === 'warmup'
            ? `🥁 Warm Up — ${b.kaydaName ?? ''}`
            : `${b.taalName ?? b.taalId} · ${b.variationName ?? 'Patrón Principal'}${b.supportRef ? ' · ' + b.supportRef : ''}`;
        list.appendChild(createElement('li', {}, text));
    });
    modal.appendChild(list);

    const actions = createElement('div', { className: 'session-share-modal__actions' });

    const loadBtn = createElement('button', { className: 'btn-primary' }, '▶ Cargar y practicar');
    loadBtn.addEventListener('click', () => {
        cb.onStep1(share.blocks.map(b => ({ ...b, id: crypto.randomUUID() })));
    });
    actions.appendChild(loadBtn);

    const saveInput = createElement('input', {
        type: 'text', className: 'session-share-modal__save-input',
        placeholder: 'Nombre para guardar como plantilla…', value: share.name,
    }) as HTMLInputElement;
    const saveBtn = createElement('button', { className: 'btn-secondary' }, '💾 Guardar plantilla');
    saveBtn.addEventListener('click', () => {
        const name = saveInput.value.trim() || share.name;
        const existing = loadSavedTemplates();
        saveSavedTemplates([...existing, {
            id: crypto.randomUUID(), name,
            blocks: share.blocks.map(b => ({ ...b, id: crypto.randomUUID() })),
        }]);
        saveBtn.textContent = '✓ Guardada';
        (saveBtn as HTMLButtonElement).disabled = true;
    });

    const saveRow = createElement('div', { className: 'session-share-modal__save-row' });
    saveRow.appendChild(saveInput);
    saveRow.appendChild(saveBtn);
    actions.appendChild(saveRow);

    const discardBtn = createElement('button', { className: 'session-share-modal__discard' }, 'Descartar');
    discardBtn.addEventListener('click', () => cb.onStep1());
    actions.appendChild(discardBtn);

    modal.appendChild(actions);
    return modal;
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel de plantillas
// ─────────────────────────────────────────────────────────────────────────────

function renderTemplatesPanel(currentBlocks: SessionBlock[], cb: Step1Callbacks): HTMLElement {
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
            list.forEach((t: SavedTemplate) => {
                const row = createElement('div', { className: 'session-template-row' });

                const info = createElement('div', { className: 'session-template-row__info' });
                info.appendChild(createElement('span', { className: 'session-template-row__name' }, t.name));
                info.appendChild(createElement('span', { className: 'session-template-row__meta' },
                    `${t.blocks.length} bloque${t.blocks.length !== 1 ? 's' : ''}`));
                row.appendChild(info);

                const acts = createElement('div', { className: 'session-template-row__actions' });

                const loadBtn = createElement('button', { className: 'btn-secondary session-template-btn' }, 'Cargar');
                loadBtn.addEventListener('click', () => {
                    cb.onStep1(t.blocks.map(b => ({ ...b, id: crypto.randomUUID() })));
                });
                acts.appendChild(loadBtn);

                const shareBtn = createElement('button', { className: 'session-template-share-btn', title: 'Compartir como link' }, '📤');
                shareBtn.addEventListener('click', () => showSharePopup(t.blocks, shareBtn));
                acts.appendChild(shareBtn);

                const delBtn = createElement('button', { className: 'session-template-delete' }, '✕') as HTMLButtonElement;
                delBtn.title = 'Eliminar plantilla';
                delBtn.addEventListener('click', () => {
                    saveSavedTemplates(loadSavedTemplates().filter((x: SavedTemplate) => x.id !== t.id));
                    rebuildBody();
                    rebuildToggleLabel();
                });
                acts.appendChild(delBtn);

                row.appendChild(acts);
                body.appendChild(row);
            });
        }

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
                    id: crypto.randomUUID(), name, blocks: currentBlocks.map(b => ({ ...b })),
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
    return wrap;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tarjeta de resumen de bloque (con botones ↑ ↓ y quitar)
// ─────────────────────────────────────────────────────────────────────────────

function createBlockSummaryCard(
    block: SessionBlock,
    index: number,
    allBlocks: SessionBlock[],
    cb: Step1Callbacks
): HTMLElement {
    const card = createElement('div', { className: 'session-block-card' });

    if (block.type === 'warmup') {
        card.appendChild(createElement('div', { className: 'session-block-card__warmup-badge' }, 'Warm Up'));
    } else if (block.type === 'pickup') {
        card.appendChild(createElement('div', { className: 'session-block-card__pickup-badge' }, 'Pickup'));
    } else {
        const practiceIdx = allBlocks.slice(0, index).filter(b => b.type === 'practice').length + 1;
        card.appendChild(createElement('div', { className: 'session-block-card__index' }, String(practiceIdx)));
    }

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
        if (block.pickupTaalCategory) meta.appendChild(createElement('span', { className: 'session-block-card__tag' }, block.pickupTaalCategory));
        if (block.pickupVideoUrl) meta.appendChild(createElement('span', { className: 'session-block-card__tag' }, '▶ Tutorial'));
    } else if (block.supportType === 'metronome') {
        meta.appendChild(createElement('span', { className: 'session-block-card__tag' }, `Metrónomo · ${block.bpmStart ?? 120} BPM`));
    } else if (block.supportRef) {
        meta.appendChild(createElement('span', { className: 'session-block-card__tag' }, block.supportRef));
    }
    meta.appendChild(createElement('span', { className: 'session-block-card__tag' }, 'Tiempo libre'));
    body.appendChild(meta);
    card.appendChild(body);

    const reorder = createElement('div', { className: 'session-block-card__reorder' });
    const upBtn = createElement('button', { className: 'session-block-card__reorder-btn', title: 'Mover arriba' }, '↑') as HTMLButtonElement;
    upBtn.disabled = index === 0;
    upBtn.addEventListener('click', () => {
        const updated = [...allBlocks];
        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
        cb.onStep1(updated);
    });
    const downBtn = createElement('button', { className: 'session-block-card__reorder-btn', title: 'Mover abajo' }, '↓') as HTMLButtonElement;
    downBtn.disabled = index === allBlocks.length - 1;
    downBtn.addEventListener('click', () => {
        const updated = [...allBlocks];
        [updated[index + 1], updated[index]] = [updated[index], updated[index + 1]];
        cb.onStep1(updated);
    });
    reorder.appendChild(upBtn);
    reorder.appendChild(downBtn);
    card.appendChild(reorder);

    const removeBtn = createElement('button', { className: 'session-block-card__remove' }, 'Quitar');
    removeBtn.addEventListener('click', () => cb.onStep1(allBlocks.filter((_, i) => i !== index)));
    card.appendChild(removeBtn);
    return card;
}

// ─────────────────────────────────────────────────────────────────────────────
// Formularios de adición de bloques
// ─────────────────────────────────────────────────────────────────────────────

function createWarmUpForm(existingBlocks: SessionBlock[], cb: Step1Callbacks): HTMLElement {
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

    const addBtn = createElement('button', { className: 'btn-primary session-add-btn' }, '+ Añadir Warm Up');
    addBtn.addEventListener('click', () => {
        const lehraIdx = LEHRAS.findIndex(l => l.url === lehraSelect.value);
        const block: SessionBlock = {
            id: crypto.randomUUID(), type: 'warmup',
            lehraLabel: LEHRAS[lehraIdx]?.label ?? '',
            lehraUrl: lehraSelect.value,
            kaydaId: kaydaSelect.value,
            kaydaName: KAYDAS[kaydaSelect.value]?.name ?? '',
            timerMode: 'free',
        };
        cb.onStep1([block, ...existingBlocks]);
    });
    wrapper.appendChild(addBtn);
    section.appendChild(wrapper);
    return section;
}

function createPickupBlockForm(existingBlocks: SessionBlock[], cb: Step1Callbacks): HTMLElement {
    const section = createElement('div', {});
    const sectionHeader = createElement('div', { className: 'session-section-header' });
    sectionHeader.appendChild(createElement('span', { className: 'session-section-label' }, 'Pickup / Filler'));
    sectionHeader.appendChild(createElement('div', { className: 'session-section-divider' }));
    section.appendChild(sectionHeader);

    const wrapper = createElement('div', { className: 'session-form-card' });
    wrapper.appendChild(createElement('h3', { className: 'session-form-card__title' }, 'Pickup / Filler'));

    const catField = createElement('div', { className: 'session-form-field' });
    catField.appendChild(createElement('label', {}, 'Taal / Categoría'));
    const catSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
    const categories = [...new Set(FILLERS.map(f => f.category))];
    categories.forEach(cat => catSelect.appendChild(createElement('option', { value: cat }, cat) as HTMLOptionElement));
    catField.appendChild(catSelect);
    wrapper.appendChild(catField);

    const patField = createElement('div', { className: 'session-form-field' });
    patField.appendChild(createElement('label', {}, 'Patrón'));
    const patSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
    wrapper.appendChild(patField);

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
            id: crypto.randomUUID(), type: 'pickup',
            pickupName, pickupTaalCategory: catSelect.value,
            pickupVideoUrl, timerMode: 'free',
        };
        cb.onStep1([...existingBlocks, block]);
    });
    wrapper.appendChild(addBtn);
    section.appendChild(wrapper);
    return section;
}

function createPracticeBlockForm(existingBlocks: SessionBlock[], cb: Step1Callbacks): HTMLElement {
    const section = createElement('div', {});
    const sectionHeader = createElement('div', { className: 'session-section-header' });
    sectionHeader.appendChild(createElement('span', { className: 'session-section-label' }, 'Bloque de práctica'));
    sectionHeader.appendChild(createElement('div', { className: 'session-section-divider' }));
    section.appendChild(sectionHeader);

    const wrapper = createElement('div', { className: 'session-form-card' });
    wrapper.appendChild(createElement('h3', { className: 'session-form-card__title' }, 'Bloque de práctica'));

    const taalField = createElement('div', { className: 'session-form-field' });
    taalField.appendChild(createElement('label', {}, 'Taal'));
    const taalSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
    const activeTaals = ['keherwa', 'dadra', 'rupak', 'deepchandi'];
    activeTaals.forEach(id => {
        taalSelect.appendChild(createElement('option', { value: id }, TAALS[id]?.name ?? id) as HTMLOptionElement);
    });
    taalField.appendChild(taalSelect);
    wrapper.appendChild(taalField);

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
            if (!v.special) varSelect.appendChild(createElement('option', { value: v.name }, v.name) as HTMLOptionElement);
        });
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
        supportSelect.appendChild(createElement('option', { value: s }, labels[s]) as HTMLOptionElement);
    });
    supportField.appendChild(supportSelect);
    wrapper.appendChild(supportField);

    const subSelectorContainer = createElement('div', { className: 'session-form-field' });
    wrapper.appendChild(subSelectorContainer);

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

            // Búsqueda de canciones
            const searchInput = createElement('input', {
                type: 'text', placeholder: '🔍 Buscar canción…',
                className: 'w-full session-song-search',
            }) as HTMLInputElement;
            subSelectorContainer.appendChild(searchInput);

            const sel = createElement('select', { className: 'w-full', 'data-sub-select': 'song' }) as HTMLSelectElement;
            const allSongs = SONGS.filter(s => s.taal.toLowerCase().startsWith(
                TAAL_SONG_PREFIXES[taalSelect.value]?.toLowerCase() ?? ''
            ));

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
                        sel.appendChild(createElement('option', { value: s.youtubeUrl }, `${s.title} — ${s.artist}`) as HTMLOptionElement);
                    });
                }
                sel.appendChild(createElement('option', { value: '__custom__' }, '＋ Otra canción (pegar URL)…') as HTMLOptionElement);
                customWrap.style.display = 'none';
            };

            const customWrap = createElement('div', { className: 'session-custom-song' });
            customWrap.style.display = 'none';
            const customTitle = createElement('input', {
                type: 'text', placeholder: 'Título de la canción', className: 'w-full session-custom-input', 'data-custom-title': 'true',
            }) as HTMLInputElement;
            const customUrl = createElement('input', {
                type: 'url', placeholder: 'URL de YouTube (https://…)', className: 'w-full session-custom-input', 'data-custom-url': 'true',
            }) as HTMLInputElement;
            customWrap.appendChild(customTitle);
            customWrap.appendChild(customUrl);

            rebuildOptions('');
            subSelectorContainer.appendChild(sel);
            subSelectorContainer.appendChild(customWrap);

            searchInput.addEventListener('input', () => rebuildOptions(searchInput.value));
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
    taalSelect.addEventListener('change', () => {
        if (supportSelect.value === 'song') refreshSubSelector('song');
    });

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
            const ct = subSelectorContainer.querySelector('[data-custom-title]') as HTMLInputElement | null;
            const cu = subSelectorContainer.querySelector('[data-custom-url]') as HTMLInputElement | null;
            supportRef = ct?.value.trim() || 'Canción personalizada';
            supportUrl = cu?.value.trim() ?? '';
        } else if (subSel) {
            supportUrl = subSel.value;
            supportRef = subSel.options[subSel.selectedIndex]?.text ?? '';
        }

        const block: SessionBlock = {
            id: crypto.randomUUID(), type: 'practice',
            taalId, taalName: TAALS[taalId]?.name ?? taalId,
            variationName: varName, supportType, supportRef, supportUrl,
            bpmStart: supportType === 'metronome' ? parseInt(bpmInput.value, 10) : undefined,
            timerMode: 'free',
        };
        cb.onStep1([...existingBlocks, block]);
    });
    wrapper.appendChild(addBtn);
    section.appendChild(wrapper);
    return section;
}
