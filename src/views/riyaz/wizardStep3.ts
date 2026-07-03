/**
 * WIZARD STEP 3 — Resumen y guardado de sesión
 * Renderiza el resumen post-sesión: bloques, breakdown por taal, notas
 * y botones de guardar / descartar con modal de autenticación.
 */

import { createElement } from '../../core/utils.js';
import { db } from '../../core/supabase.js';
import type { SessionBlock, SessionState } from '../../types.js';
import { clearSessionDraft } from './wizardDraft.js';
import { formatTime } from './wizardStep2.js';

/** SHA-256 usando la Web Crypto API nativa */
async function hashPassword(plain: string): Promise<string> {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface Step3Callbacks {
    onNewSession: () => void;   // redirige de vuelta al step 1
}

// ─────────────────────────────────────────────────────────────────────────────
// Punto de entrada
// ─────────────────────────────────────────────────────────────────────────────

export function renderStep3(
    container: HTMLElement,
    sessionState: SessionState,
    cb: Step3Callbacks
): void {
    container.innerHTML = '';

    const totalSecs = sessionState.blocks.reduce((sum, b) => sum + (b.durationSecs ?? 0), 0);

    // Header
    const header = createElement('div', { className: 'mb-8' });
    header.appendChild(createElement('h2', { className: 'section-title' }, 'Sesión completada'));
    header.appendChild(createElement('p', { className: 'section-subtitle' },
        `Tiempo total: ${formatTime(totalSecs)}`));
    container.appendChild(header);

    // Lista de bloques
    container.appendChild(buildBlocksList(sessionState.blocks));

    // Breakdown por taal
    const taalTimes: Record<string, number> = {};
    sessionState.blocks.forEach(b => {
        const key = b.type === 'warmup' ? 'Warm Up'
            : b.type === 'pickup' ? 'Pickups'
            : (b.taalName ?? 'Desconocido');
        taalTimes[key] = (taalTimes[key] ?? 0) + (b.durationSecs ?? 0);
    });
    if (Object.keys(taalTimes).length > 0) {
        container.appendChild(buildTaalBreakdown(taalTimes, totalSecs));
    }

    // Notas libres
    const notesCard = createElement('div', { className: 'card p-6 mb-4' });
    notesCard.appendChild(createElement('h3', { className: 'font-bold text-lg mb-3' }, 'Notas de la sesión'));
    notesCard.appendChild(createElement('p', { className: 'text-muted text-sm mb-3' }, '¿Qué ha ido bien? ¿Qué mejorar?'));
    const textarea = createElement('textarea', {
        className: 'w-full', rows: '5',
        placeholder: 'Escribe aquí tus observaciones...',
        style: {
            width: '100%', padding: '0.75rem', borderRadius: '8px',
            border: '1.5px solid var(--border-primary)', background: 'var(--card-bg)',
            color: 'var(--text-primary)', fontSize: '0.95rem', resize: 'vertical',
            boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: '1.6'
        }
    }) as HTMLTextAreaElement;
    textarea.addEventListener('input', () => { sessionState.notes = textarea.value; });
    notesCard.appendChild(textarea);

    // Toggle sesión conjunta
    const jointRow = createElement('div', {
        style: {
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            marginTop: '1rem', padding: '0.75rem 1rem',
            background: 'var(--bg-secondary)', borderRadius: '8px',
            border: '1.5px solid var(--border-primary)',
        }
    });
    const jointCheckbox = createElement('input', { type: 'checkbox', id: 'joint-session-toggle' }) as HTMLInputElement;
    jointCheckbox.style.cssText = 'width:18px;height:18px;cursor:pointer;accent-color:var(--orange-500)';
    const jointLabel = createElement('label', { htmlFor: 'joint-session-toggle' });
    jointLabel.style.cssText = 'cursor:pointer;font-size:0.95rem;user-select:none';
    jointLabel.textContent = 'Sesión conjunta';
    jointRow.appendChild(jointCheckbox);
    jointRow.appendChild(jointLabel);
    notesCard.appendChild(jointRow);

    container.appendChild(notesCard);

    // Botones de acción
    const actionArea = createElement('div', {});
    const saveBtn = createElement('button', { className: 'btn-primary session-start-btn' }, '💾 Guardar sesión');
    saveBtn.addEventListener('click', () => {
        showSaveModal(sessionState.notes, totalSecs, sessionState.blocks, jointCheckbox.checked, sessionState.startedAt, () => {
            clearSessionDraft();
            actionArea.innerHTML = '';
            const successMsg = createElement('div', { className: 'session-action-feedback session-action-feedback--success' });
            successMsg.innerHTML = '✓ <strong>Sesión guardada.</strong> Redirigiendo...';
            actionArea.appendChild(successMsg);
            setTimeout(() => cb.onNewSession(), 2000);
        });
    });
    actionArea.appendChild(saveBtn);

    // Descartar con confirmación inline
    const discardWrapper = createElement('div', { style: { marginTop: '0.75rem' } });
    const discardBtn = createElement('button', { className: 'btn-secondary session-start-btn session-discard-btn' }, 'Descartar sesión');
    const confirmRow = createElement('div', { className: 'session-discard-confirm', style: { display: 'none' } });
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
        setTimeout(() => cb.onNewSession(), 2000);
    });

    const noBtn = createElement('button', { className: 'btn-secondary flex-1' }, 'Cancelar');
    noBtn.addEventListener('click', () => {
        confirmRow.style.display = 'none';
        discardBtn.style.display = '';
    });

    confirmBtns.appendChild(yesBtn);
    confirmBtns.appendChild(noBtn);
    confirmRow.appendChild(confirmBtns);
    discardBtn.addEventListener('click', () => { discardBtn.style.display = 'none'; confirmRow.style.display = ''; });
    discardWrapper.appendChild(discardBtn);
    discardWrapper.appendChild(confirmRow);
    actionArea.appendChild(discardWrapper);

    container.appendChild(actionArea);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de UI
// ─────────────────────────────────────────────────────────────────────────────

function buildBlocksList(blocks: SessionBlock[]): HTMLElement {
    const card = createElement('div', { className: 'card p-6 mb-4' });
    card.appendChild(createElement('h3', { className: 'font-bold text-lg mb-4' }, 'Bloques practicados'));

    blocks.forEach((block, i) => {
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
        const dur = formatTime(block.durationSecs ?? 0);
        const bpmInfo = block.supportType === 'metronome' && block.bpmStart ? ` · ${block.bpmEnd ?? block.bpmStart} BPM` : '';
        const cyclesInfo = block.cyclesCompleted ? ` · ${block.cyclesCompleted} ciclos` : '';
        const songInfo = block.supportRef && block.supportType !== 'metronome' ? ` · ${block.supportRef}` : '';
        meta.textContent = `${dur}${bpmInfo}${cyclesInfo}${songInfo}`;
        row.appendChild(meta);
        card.appendChild(row);
    });

    return card;
}

function buildTaalBreakdown(taalTimes: Record<string, number>, totalSecs: number): HTMLElement {
    const card = createElement('div', { className: 'card p-6 mb-4' });
    card.appendChild(createElement('h3', { className: 'font-bold text-lg mb-4' }, 'Tiempo por taal'));

    Object.entries(taalTimes).forEach(([name, secs]) => {
        const pct = totalSecs > 0 ? Math.round((secs / totalSecs) * 100) : 0;
        const rowEl = createElement('div', { className: 'mb-3' });
        const labelRow = createElement('div', { className: 'flex justify-between text-sm mb-1' });
        labelRow.appendChild(createElement('span', { className: 'font-medium' }, name));
        labelRow.appendChild(createElement('span', { className: 'text-muted' }, `${formatTime(secs)} (${pct}%)`));
        rowEl.appendChild(labelRow);

        const track = createElement('div', { className: 'w-full', style: { height: '8px', background: 'var(--border-primary)', borderRadius: '4px', overflow: 'hidden' } });
        const fill = createElement('div', { style: { height: '100%', width: `${pct}%`, background: 'var(--orange-500)', borderRadius: '4px', transition: 'width 0.5s ease' } });
        track.appendChild(fill);
        rowEl.appendChild(track);
        card.appendChild(rowEl);
    });

    return card;
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de guardado con autenticación
// ─────────────────────────────────────────────────────────────────────────────

function showSaveModal(
    notes: string,
    totalSecs: number,
    blocks: SessionBlock[],
    jointSession: boolean,
    startedAt: number,
    onSuccess: () => void
): void {
    const USERS: Record<string, string> = {
        prashant: '08ff26c5a6661c7bcf74134fc684717aabba4a66c2d0cfa06c4be231755c1a91',
        meera:    'ea4198f9dc6c89087fd7a47d6023c65e9eaaf8ed2a219b8fda98f5b5b765ede9',
    };

    const overlay = createElement('div', { className: 'save-modal-overlay' });
    const modal   = createElement('div', { className: 'save-modal' });

    modal.appendChild(createElement('h3', { className: 'save-modal__title' }, '💾 Guardar sesión'));

    if (jointSession) {
        modal.appendChild(createElement('p', { className: 'save-modal__sub' },
            'Sesión conjunta — se guardará para Prashant y Meera'));
        // En sesión conjunta solo se autentica con la contraseña de Prashant
        modal.appendChild(createElement('p', { className: 'save-modal__sub' },
            'Introduce la contraseña de Prashant para confirmar'));
    } else {
        modal.appendChild(createElement('p', { className: 'save-modal__sub' },
            'Introduce tus credenciales para guardar en la base de datos'));
    }

    // Selector de usuario (oculto en sesión conjunta, siempre prashant)
    const userField = createElement('div', { className: 'save-modal__field' });
    userField.appendChild(createElement('label', { className: 'save-modal__label' }, 'Usuario'));
    const userSelect = createElement('select', { className: 'w-full' }) as HTMLSelectElement;
    ['prashant', 'meera'].forEach(u => {
        userSelect.appendChild(createElement('option', { value: u },
            u.charAt(0).toUpperCase() + u.slice(1)) as HTMLOptionElement);
    });
    userField.appendChild(userSelect);
    if (jointSession) {
        userField.style.display = 'none';
        userSelect.value = 'prashant';
    }
    modal.appendChild(userField);

    const passField = createElement('div', { className: 'save-modal__field' });
    passField.appendChild(createElement('label', { className: 'save-modal__label' }, 'Contraseña'));
    const passInput = createElement('input', {
        type: 'password', className: 'save-modal__pass-input', placeholder: '••••••••',
    }) as HTMLInputElement;
    passField.appendChild(passInput);
    modal.appendChild(passField);

    const errorEl = createElement('p', { className: 'save-modal__error' });
    errorEl.style.display = 'none';
    modal.appendChild(errorEl);

    const btnRow = createElement('div', { className: 'save-modal__btns' });
    const cancelBtn = createElement('button', { className: 'btn-secondary flex-1' }, 'Cancelar');
    cancelBtn.addEventListener('click', () => overlay.remove());

    const confirmBtn = createElement('button', { className: 'btn-primary flex-1' }, 'Guardar');
    confirmBtn.addEventListener('click', async () => {
        const userId       = jointSession ? 'prashant' : userSelect.value;
        const passwordHash = await hashPassword(passInput.value.trim());

        if (passwordHash !== USERS[userId]) {
            errorEl.textContent = 'Contraseña incorrecta';
            errorEl.style.display = 'block';
            passInput.value = '';
            passInput.focus();
            return;
        }

        confirmBtn.textContent = 'Guardando...';
        confirmBtn.setAttribute('disabled', 'true');
        errorEl.style.display = 'none';

        const blocksMapped = blocks.map(b => ({
            type:             b.type,
            taal_name:        b.taalName,
            variation_name:   b.variationName,
            kayda_name:       b.kaydaName,
            support_type:     b.supportType,
            support_ref:      b.supportRef,
            bpm_start:        b.bpmStart,
            bpm_end:          b.bpmEnd,
            duration_secs:    b.durationSecs,
            cycles_completed: b.cyclesCompleted,
            pickup_name:      b.pickupName,
            pickup_taal:      b.pickupTaalCategory,
        }));

        // saved_at = momento de inicio de la sesión (ISO 8601)
        const savedAt = new Date(startedAt).toISOString();

        // En sesión conjunta se insertan dos registros: uno por usuario
        const records = jointSession
            ? [
                { user_id: 'prashant', saved_at: savedAt, total_secs: totalSecs, notes: notes || null, blocks: blocksMapped },
                { user_id: 'meera',    saved_at: savedAt, total_secs: totalSecs, notes: notes || null, blocks: blocksMapped },
              ]
            : [{ user_id: userId, saved_at: savedAt, total_secs: totalSecs, notes: notes || null, blocks: blocksMapped }];

        try {
            const { error } = await db.from('sessions').insert(records);
            if (error) throw error;
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

    passInput.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter') confirmBtn.click(); });

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);
    modal.appendChild(btnRow);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    setTimeout(() => passInput.focus(), 50);
}
