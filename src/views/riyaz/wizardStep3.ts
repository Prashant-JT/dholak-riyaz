/**
 * WIZARD STEP 3 — Session summary and save
 * Post-session summary (blocks, per-taal breakdown, notes) and
 * save / discard actions behind the password modal.
 */

import { createElement, variationLabel } from '../../core/utils.js';
import { db } from '../../core/supabase.js';
import { t } from '../../i18n/index.js';
import type { SessionBlock, SessionState } from '../../types.js';
import { clearSessionDraft } from './wizardDraft.js';
import { formatTime } from './wizardStep2.js';
import { listTakes, flushRecordings } from './recordingDraft.js';
import { renderBlockNote, BLOCK_NOTE_MAX } from './blockNote.js';
import { TAKE_LABEL_MAX } from './recordingZone.js';
import { saveSessionDraft } from './wizardDraft.js';
import { buildRecordingPath, uploadRecording } from '../../core/recordingStorage.js';

/** SHA-256 via the native Web Crypto API */
async function hashPassword(plain: string): Promise<string> {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface Step3Callbacks {
    onNewSession: () => void;   // goes back to step 1
}

// ── Entry point ──────────────────────────────────────────────────────────────

export function renderStep3(
    container: HTMLElement,
    sessionState: SessionState,
    cb: Step3Callbacks
): void {
    container.innerHTML = '';

    const totalSecs = sessionState.blocks.reduce((sum, b) => sum + (b.durationSecs ?? 0), 0);

    // Header
    const header = createElement('div', { className: 'mb-8' });
    header.appendChild(createElement('h2', { className: 'section-title' }, t('step3.pageTitle')));
    header.appendChild(createElement('p', { className: 'section-subtitle' }, t('step3.totalTime', formatTime(totalSecs))));
    container.appendChild(header);

    // Blocks list
    container.appendChild(buildBlocksList(sessionState));

    // Time breakdown by taal
    const taalTimes: Record<string, number> = {};
    sessionState.blocks.forEach(b => {
        const key = b.type === 'warmup' ? t('step3.warmUp')
            : b.type === 'pickup' ? t('step3.pickup')
            : (b.taalName ?? t('stats.chartOther'));
        taalTimes[key] = (taalTimes[key] ?? 0) + (b.durationSecs ?? 0);
    });
    if (Object.keys(taalTimes).length > 0) {
        container.appendChild(buildTaalBreakdown(taalTimes, totalSecs));
    }

    // Free-form notes
    const notesCard = createElement('div', { className: 'card p-6 mb-4' });
    notesCard.appendChild(createElement('h3', { className: 'font-bold text-lg mb-3' }, t('step3.notesTitle')));
    const textarea = createElement('textarea', {
        className: 'w-full', rows: '5',
        placeholder: t('step3.notesPlaceholder'),
        style: {
            width: '100%', padding: '0.75rem', borderRadius: '8px',
            border: '1.5px solid var(--border-primary)', background: 'var(--card-bg)',
            color: 'var(--text-primary)', fontSize: '0.95rem', resize: 'vertical',
            boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: '1.6'
        }
    }) as HTMLTextAreaElement;
    textarea.addEventListener('input', () => { sessionState.notes = textarea.value; });
    notesCard.appendChild(textarea);

    // Joint session toggle
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
    const jointLabel = createElement('label', { for: 'joint-session-toggle' });
    jointLabel.style.cssText = 'cursor:pointer;font-size:0.95rem;user-select:none';
    jointLabel.textContent = t('step3.jointSession');
    jointRow.appendChild(jointCheckbox);
    jointRow.appendChild(jointLabel);
    notesCard.appendChild(jointRow);

    container.appendChild(notesCard);

    // Action buttons
    const actionArea = createElement('div', {});
    const saveBtn = createElement('button', { className: 'btn-primary session-start-btn' }, t('step3.saveBtn'));
    saveBtn.addEventListener('click', () => {
        showSaveModal(sessionState.notes, totalSecs, sessionState.blocks, jointCheckbox.checked, sessionState.startedAt, () => {
            clearSessionDraft();
            actionArea.innerHTML = '';
            const successMsg = createElement('div', { className: 'session-action-feedback session-action-feedback--success' });
            successMsg.innerHTML = t('step3.savedMsg');
            actionArea.appendChild(successMsg);
            setTimeout(() => cb.onNewSession(), 2000);
        });
    });
    actionArea.appendChild(saveBtn);

    // Discard with inline confirmation
    const discardWrapper = createElement('div', { style: { marginTop: '0.75rem' } });
    const discardBtn = createElement('button', { className: 'btn-secondary session-start-btn session-discard-btn' }, t('step3.discardBtn'));
    const confirmRow = createElement('div', { className: 'session-discard-confirm', style: { display: 'none' } });
    confirmRow.appendChild(createElement('span', { className: 'text-muted text-sm' }, t('step3.discardConfirm')));
    const confirmBtns = createElement('div', { className: 'flex gap-3 mt-3' });

    const yesBtn = createElement('button', { className: 'btn-danger flex-1' }, t('step3.discardYes'));
    yesBtn.addEventListener('click', () => {
        clearSessionDraft();
        actionArea.innerHTML = '';
        discardWrapper.innerHTML = '';
        const discardMsg = createElement('div', { className: 'session-action-feedback session-action-feedback--discard' });
        discardMsg.innerHTML = t('step3.discardedMsg');
        actionArea.appendChild(discardMsg);
        setTimeout(() => cb.onNewSession(), 2000);
    });

    const noBtn = createElement('button', { className: 'btn-secondary flex-1' }, t('step3.discardNo'));
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

// ── UI helpers ───────────────────────────────────────────────────────────────

function buildBlocksList(sessionState: SessionState): HTMLElement {
    const blocks = sessionState.blocks;
    const card = createElement('div', { className: 'card p-6 mb-4' });
    card.appendChild(createElement('h3', { className: 'font-bold text-lg mb-4' }, t('step3.blocksTitle')));

    blocks.forEach(block => {
        const row = createElement('div', {
            className: 'flex items-center justify-between py-2',
            style: { borderBottom: '1px solid var(--border-primary)' }
        });
        const name = block.type === 'warmup'
            ? `${t('step3.warmUp')} — ${block.kaydaName}`
            : block.type === 'pickup'
                ? `${t('step3.pickup')} — ${block.pickupName ?? ''}`
                : `${block.taalName} · ${variationLabel(block.variationName)}`;
        row.appendChild(createElement('span', { className: 'font-medium' }, name));

        const meta = createElement('span', { className: 'text-muted text-sm text-right' });
        const dur = formatTime(block.durationSecs ?? 0);
        const bpmInfo = block.supportType === 'metronome' && block.bpmStart ? ` · ${block.bpmEnd ?? block.bpmStart} BPM` : '';
        const cyclesInfo = block.cyclesCompleted ? ` · ${block.cyclesCompleted} ${t('step3.cycles')}` : '';
        const songInfo = block.supportRef && block.supportType !== 'metronome' ? ` · ${block.supportRef}` : '';
        meta.textContent = `${dur}${bpmInfo}${cyclesInfo}${songInfo}`;
        row.appendChild(meta);
        card.appendChild(row);
        // Block comment — editable here too, in case it was not written during practice
        card.appendChild(renderBlockNote(block, () => saveSessionDraft(sessionState, Date.now(), true)));
    });

    return card;
}

function buildTaalBreakdown(taalTimes: Record<string, number>, totalSecs: number): HTMLElement {
    const card = createElement('div', { className: 'card p-6 mb-4' });
    card.appendChild(createElement('h3', { className: 'font-bold text-lg mb-4' }, t('step3.taalBreakdown')));

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

// ── Save modal with authentication ───────────────────────────────────────────

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

    modal.appendChild(createElement('h3', { className: 'save-modal__title' }, t('step3.saveModalTitle')));

    if (jointSession) {
        modal.appendChild(createElement('p', { className: 'save-modal__sub' }, t('step3.saveModalJoint')));
        // In a joint session only Prashant's password is required for auth
        modal.appendChild(createElement('p', { className: 'save-modal__sub' }, t('step3.saveModalJointAuth')));
    } else {
        modal.appendChild(createElement('p', { className: 'save-modal__sub' }, t('step3.saveModalSub')));
    }

    // User selector (hidden for joint sessions, always prashant)
    const userField = createElement('div', { className: 'save-modal__field' });
    userField.appendChild(createElement('label', { className: 'save-modal__label' }, t('step3.saveModalUser')));
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
    passField.appendChild(createElement('label', { className: 'save-modal__label' }, t('step3.saveModalPass')));
    const passInput = createElement('input', {
        type: 'password', className: 'save-modal__pass-input', placeholder: t('step3.saveModalPassPlaceholder'),
    }) as HTMLInputElement;
    passField.appendChild(passInput);
    modal.appendChild(passField);

    const errorEl = createElement('p', { className: 'save-modal__error' });
    errorEl.style.display = 'none';
    modal.appendChild(errorEl);

    // Set synchronously so a double tap / Enter + click cannot insert the session twice
    let inFlight = false;

    const btnRow = createElement('div', { className: 'save-modal__btns' });
    const cancelBtn = createElement('button', { className: 'btn-secondary flex-1' }, t('step3.saveModalCancel'));
    // Locked while saving: closing mid-upload and saving again would insert the session twice
    cancelBtn.addEventListener('click', () => { if (!inFlight) overlay.remove(); });

    const confirmBtn = createElement('button', { className: 'btn-primary flex-1' }, t('step3.saveModalBtn'));
    // Takes already uploaded, by take id — a retry after a failure does not re-upload them
    const uploadedTakes = new Map<string, { path: string; label: string }>();
    // Kept takes per block id, in recording order (filled at upload time)
    const takesByBlock = new Map<string, string[]>();
    // Set after an upload failure when the user chooses to save the session without recordings
    let skipRecordings = false;

    const skipRecBtn = createElement('button', { className: 'save-modal__skip-rec' }, t('step3.saveModalSkipRec'));
    skipRecBtn.style.display = 'none';
    skipRecBtn.addEventListener('click', () => {
        skipRecordings = true;
        skipRecBtn.style.display = 'none';
        confirmBtn.click();
    });

    confirmBtn.addEventListener('click', async () => {
        if (inFlight) return;
        inFlight = true;
        const userId       = jointSession ? 'prashant' : userSelect.value;
        const passwordHash = await hashPassword(passInput.value.trim());

        if (passwordHash !== USERS[userId]) {
            inFlight = false;
            errorEl.textContent = t('step3.saveModalWrongPass');
            errorEl.style.display = 'block';
            passInput.value = '';
            passInput.focus();
            return;
        }

        confirmBtn.textContent = t('step3.saveModalSaving');
        confirmBtn.setAttribute('disabled', 'true');
        errorEl.style.display = 'none';

        // saved_at = session start time (ISO 8601)
        const savedAt = new Date(startedAt).toISOString();

        // Upload the takes kept during the session before inserting the rows
        if (!skipRecordings) {
            // A recording still stopping (last block) must be stored before it is listed
            await flushRecordings();
            const pending: { takeId: string; blob: Blob; mimeType: string; label: string }[] = [];
            for (const b of blocks) {
                const kept = (await listTakes(b.id)).filter(take => take.kept);
                takesByBlock.set(b.id, kept.map(take => take.takeId));
                kept.forEach(take => {
                    const label = take.label.trim().slice(0, TAKE_LABEL_MAX);
                    const done  = uploadedTakes.get(take.takeId);
                    if (done) done.label = label;     // label edited after a failed attempt
                    else pending.push({ takeId: take.takeId, blob: take.blob, mimeType: take.mimeType, label });
                });
            }
            try {
                for (let i = 0; i < pending.length; i++) {
                    const p = pending[i];
                    confirmBtn.textContent = t('step3.saveModalUploading', i + 1, pending.length);
                    const path = buildRecordingPath(userId, savedAt, p.mimeType, crypto.randomUUID());
                    uploadedTakes.set(p.takeId, { path: await uploadRecording(path, p.blob, p.mimeType), label: p.label });
                }
            } catch (err) {
                console.error('Error uploading recording:', err);
                errorEl.textContent = t('step3.saveModalRecError');
                errorEl.style.display = 'block';
                skipRecBtn.style.display = '';
                confirmBtn.textContent = t('step3.saveModalBtn');
                confirmBtn.removeAttribute('disabled');
                inFlight = false;
                return;
            }
            confirmBtn.textContent = t('step3.saveModalSaving');
        }

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
            recordings:       skipRecordings ? undefined : recordingsFor(b.id),
            note:             b.note?.trim().slice(0, BLOCK_NOTE_MAX) || undefined,
        }));

        function recordingsFor(blockId: string): { path: string; label?: string }[] | undefined {
            const list = (takesByBlock.get(blockId) ?? [])
                .map(id => uploadedTakes.get(id))
                .filter((r): r is { path: string; label: string } => r !== undefined)
                .map(r => (r.label ? { path: r.path, label: r.label } : { path: r.path }));
            return list.length > 0 ? list : undefined;
        }

        // Joint session inserts two records: one per user
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
            console.error('Error saving session:', err);
            errorEl.textContent = t('step3.saveModalError');
            errorEl.style.display = 'block';
            confirmBtn.textContent = t('step3.saveModalBtn');
            confirmBtn.removeAttribute('disabled');
            inFlight = false;
        }
    });
    modal.appendChild(skipRecBtn);

    passInput.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter') confirmBtn.click(); });

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);
    modal.appendChild(btnRow);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    setTimeout(() => passInput.focus(), 50);
}
