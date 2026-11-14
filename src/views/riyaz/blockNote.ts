/**
 * BLOCK NOTE — per-block comment field
 * Shared by step 2 (while practising) and step 3 (summary review).
 * Writes straight into block.note; the caller persists the draft via onChange.
 */

import { createElement } from '../../core/utils.js';
import { t } from '../../i18n/index.js';
import type { SessionBlock } from '../../types.js';

export const BLOCK_NOTE_MAX = 500;

export function renderBlockNote(block: SessionBlock, onChange: () => void): HTMLElement {
    const field = createElement('div', { className: 'session-block-note' });
    const inputId = `block-note-${block.id}`;
    field.appendChild(createElement('label', { className: 'session-block-note__label', for: inputId }, t('step2.blockNoteLabel')));

    const textarea = createElement('textarea', {
        id: inputId,
        className: 'session-block-note__input',
        rows: '2',
        maxLength: String(BLOCK_NOTE_MAX),
        placeholder: t('step2.blockNotePlaceholder'),
    }) as HTMLTextAreaElement;
    textarea.value = block.note ?? '';

    // Debounced so typing does not rewrite localStorage on every key
    let timer: number | null = null;
    textarea.addEventListener('input', () => {
        block.note = textarea.value;
        if (timer !== null) clearTimeout(timer);
        timer = window.setTimeout(() => { timer = null; onChange(); }, 400);
    });
    textarea.addEventListener('blur', () => {
        if (timer !== null) { clearTimeout(timer); timer = null; onChange(); }
    });

    field.appendChild(textarea);
    return field;
}
