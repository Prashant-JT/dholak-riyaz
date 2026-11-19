/**
 * STATS — Recording reviews: UI under each take in the session history
 * Score (1–5 stars), reactions (one tap), comments pinned to a second of the take and reviewer picker. Mounted into placeholders left by buildHistoryHTML.
 */

import { createElement } from '../../core/utils.js';
import { t } from '../../i18n/index.js';
import type { ReviewStore, RecordingReview } from './statsTypes.js';
import {
    NEG_REACTIONS_START, REVIEWERS, clearReviewer, REVIEW_SCORE_MAX, findScore, scoresFor, REVIEW_BODY_MAX,
    getReviewer, setReviewer, commentsFor, reactionSummary, findReaction, formatAtSecs,
} from './statsReviews.js';
import { addReview, deleteReview, updateReviewScore } from './statsReviewsData.js';
import { verifyPassword } from '../../core/auth.js';

// One listener scope per take: re-rendering aborts the previous player listeners
const slotScopes = new WeakMap<HTMLElement, AbortController>();

const reviewerName = (id: string): string => (id === 'meera' ? t('stats.tabMeera') : t('stats.tabPrashant'));

// ── Header: reviewer picker ──────────────────────────────

export function buildReviewHeader(store: ReviewStore, onChange: () => void): HTMLElement {
    const wrap = createElement('div', { className: 'rec-review-head' });
    if (!store.enabled) return wrap;

    const me = getReviewer();

    // Identified: "Prashant · change". Not identified: "I'm  Prashant · Meera" (asks the password)
    const who = createElement('div', { className: 'rec-review-who' });
    if (me) {
        who.appendChild(createElement('span', { className: 'rec-review-who__me' }, reviewerName(me)));
        who.appendChild(createElement('span', { className: 'rec-review-who__dot', 'aria-hidden': 'true' }, '·'));
        const change = createElement('button', { type: 'button', className: 'rec-review-who__btn' }, t('stats.reviewWhoChange'));
        change.addEventListener('click', () => { clearReviewer(); onChange(); });
        who.appendChild(change);
    } else {
        who.appendChild(createElement('span', { className: 'rec-review-who__label' }, t('stats.reviewWhoLabel')));
        REVIEWERS.forEach((id, i) => {
            if (i > 0) who.appendChild(createElement('span', { className: 'rec-review-who__dot', 'aria-hidden': 'true' }, '·'));
            const btn = createElement('button', { type: 'button', className: 'rec-review-who__btn' }, reviewerName(id));
            btn.addEventListener('click', () => openReviewerAuth(id, () => { setReviewer(id); onChange(); }));
            who.appendChild(btn);
        });
    }
    wrap.appendChild(who);
    return wrap;
}

/** Password prompt (same passwords as saving a session); asked once per device. */
function openReviewerAuth(userId: string, onSuccess: () => void): void {
    const overlay = createElement('div', { className: 'save-modal-overlay' });
    const modal = createElement('div', { className: 'save-modal', role: 'dialog', 'aria-modal': 'true' });
    modal.appendChild(createElement('h3', { className: 'save-modal__title' }, t('stats.reviewAuthTitle', reviewerName(userId))));
    modal.appendChild(createElement('p', { className: 'save-modal__sub' }, t('stats.reviewAuthSub')));

    const form = createElement('form', { className: 'save-modal__field' }) as HTMLFormElement;
    const input = createElement('input', {
        type: 'password', className: 'save-modal__pass-input', autocomplete: 'current-password',
        placeholder: t('step3.saveModalPassPlaceholder'), 'aria-label': t('step3.saveModalPass'),
    }) as HTMLInputElement;
    form.appendChild(input);

    const errorEl = createElement('p', { className: 'save-modal__error', role: 'alert' });
    errorEl.style.display = 'none';

    const btns = createElement('div', { className: 'save-modal__btns' });
    const cancel = createElement('button', { type: 'button', className: 'btn-secondary flex-1' }, t('step3.saveModalCancel'));
    const ok = createElement('button', { type: 'submit', className: 'btn-primary flex-1' }, t('stats.reviewAuthOk'));
    btns.appendChild(cancel);
    btns.appendChild(ok);

    const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    cancel.addEventListener('click', close);
    overlay.addEventListener('click', (e: Event) => { if (e.target === overlay) close(); });

    let busy = false;
    const submit = async () => {
        if (busy) return;
        busy = true;
        const valid = await verifyPassword(userId, input.value);
        busy = false;
        if (valid) { close(); onSuccess(); return; }
        errorEl.textContent = t('step3.saveModalWrongPass');
        errorEl.style.display = 'block';
        input.value = '';
        input.focus();
    };
    form.addEventListener('submit', (e: Event) => { e.preventDefault(); void submit(); });
    ok.addEventListener('click', (e: Event) => { e.preventDefault(); void submit(); });

    modal.appendChild(form);
    modal.appendChild(errorEl);
    modal.appendChild(btns);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    input.focus();
}

// ── Per-take mounting ─────────────────────────────────────────────────────────

/**
 * Fills every `.rec-review[data-rec-path]` placeholder in `container`.
 * `onAuthNeeded` scrolls to the reviewer picker.
 */
export function mountReviews(container: HTMLElement, store: ReviewStore, onAuthNeeded: () => void): void {
    if (!store.enabled) return;
    const me = getReviewer();
    container.querySelectorAll<HTMLElement>('.rec-review[data-rec-path]').forEach(slot => {
        const path = slot.dataset.recPath ?? '';
        const audio = slot.closest('.stats-block-rec')?.querySelector<HTMLAudioElement>('audio') ?? null;
        renderTakeReviews(slot, path, audio, store, me, onAuthNeeded);
    });
}

function renderTakeReviews(
    slot: HTMLElement, path: string, audio: HTMLAudioElement | null,
    store: ReviewStore, me: string | null, onAuthNeeded: () => void
): void {
    slot.innerHTML = '';
    slotScopes.get(slot)?.abort();
    const scope = new AbortController();
    slotScopes.set(slot, scope);
    const rerender = () => renderTakeReviews(slot, path, audio, store, getReviewer(), onAuthNeeded);

    const showError = (msg: string) => {
        const err = createElement('p', { className: 'rec-review-error', role: 'alert' }, msg);
        slot.appendChild(err);
        window.setTimeout(() => err.remove(), 4000);
    };

    // Score and reactions share one quiet toolbar
    const bar = createElement('div', { className: 'rec-review-bar' });
    bar.appendChild(buildScoreRow(path, store, me, onAuthNeeded, rerender, showError));
    bar.appendChild(createElement('span', { className: 'rec-review-bar__sep', 'aria-hidden': 'true' }));

    // ── Reactions ──
    const reactRow = createElement('div', { className: 'rec-review-reacts' });
    reactionSummary(store.items, path).forEach(({ emoji, authors }, idx) => {
        const mine = me !== null && authors.includes(me);
        const label = authors.length > 0 ? authors.map(reviewerName).join(', ') : t('stats.reviewReactHint');
        const btn = createElement('button', {
            type: 'button',
            className: `rec-review-react${mine ? ' is-active' : ''}${idx === NEG_REACTIONS_START ? ' rec-review-react--neg-start' : ''}`,
            title: label,
            'aria-label': `${emoji} ${label}`,
            'aria-pressed': String(mine),
        });
        btn.appendChild(createElement('span', { 'aria-hidden': 'true' }, emoji));
        if (authors.length > 0) btn.appendChild(createElement('span', { className: 'rec-review-react__n' }, String(authors.length)));
        btn.addEventListener('click', async () => {
            const who = getReviewer();
            if (!who) { onAuthNeeded(); return; }
            btn.setAttribute('disabled', 'true');
            try {
                const existing = findReaction(store.items, path, who, emoji);
                if (existing) {
                    await deleteReview(existing.id);
                    store.items = store.items.filter(r => r.id !== existing.id);
                } else {
                    store.items = [...store.items, await addReview({ recording_path: path, author: who, kind: 'reaction', emoji })];
                }
                rerender();
            } catch (err: unknown) {
                console.warn('Review reaction:', err);
                btn.removeAttribute('disabled');
                showError(t('stats.reviewError'));
            }
        });
        reactRow.appendChild(btn);
    });
    bar.appendChild(reactRow);
    slot.appendChild(bar);

    // ── Comments ──
    const comments = commentsFor(store.items, path);
    if (comments.length > 0) {
        const list = createElement('ul', { className: 'rec-review-list' });
        comments.forEach(c => list.appendChild(buildComment(c, audio, me, async () => {
            try {
                await deleteReview(c.id);
                store.items = store.items.filter(r => r.id !== c.id);
                rerender();
            } catch (err: unknown) {
                console.warn('Review delete:', err);
                showError(t('stats.reviewError'));
            }
        })));
        slot.appendChild(list);
    }

    slot.appendChild(buildCommentForm(path, audio, store, scope.signal, onAuthNeeded, rerender, showError));
}

/** Star row: my score (tap the same star again to clear it) + everyone else's score. */
function buildScoreRow(
    path: string, store: ReviewStore, me: string | null,
    onAuthNeeded: () => void, rerender: () => void, showError: (msg: string) => void
): HTMLElement {
    const row = createElement('div', { className: 'rec-review-score' });

    const mine = me ? findScore(store.items, path, me)?.score ?? null : null;
    const stars = createElement('div', { className: 'rec-review-stars', role: 'group', 'aria-label': t('stats.reviewScoreLabel') });
    for (let n = 1; n <= REVIEW_SCORE_MAX; n++) {
        const filled = mine !== null && n <= mine;
        const star = createElement('button', {
            type: 'button',
            className: `rec-review-star${filled ? ' is-filled' : ''}`,
            'aria-label': t('stats.reviewScoreN', n, REVIEW_SCORE_MAX),
            'aria-pressed': String(mine === n),
        }, filled ? '★' : '☆');
        star.addEventListener('click', async () => {
            const who = getReviewer();
            if (!who) { onAuthNeeded(); return; }
            stars.querySelectorAll('button').forEach(b => b.setAttribute('disabled', 'true'));
            try {
                const existing = findScore(store.items, path, who);
                if (existing && existing.score === n) {
                    await deleteReview(existing.id);
                    store.items = store.items.filter(r => r.id !== existing.id);
                } else if (existing) {
                    const saved = await updateReviewScore(existing.id, n);
                    store.items = store.items.map(r => (r.id === existing.id ? saved : r));
                } else {
                    store.items = [...store.items, await addReview({ recording_path: path, author: who, kind: 'score', score: n })];
                }
                rerender();
            } catch (err: unknown) {
                console.warn('Review score:', err);
                stars.querySelectorAll('button').forEach(b => b.removeAttribute('disabled'));
                showError(t('stats.reviewError'));
            }
        });
        stars.appendChild(star);
    }
    row.appendChild(stars);

    const others = scoresFor(store.items, path).filter(s => s.author !== me);
    if (others.length > 0) {
        row.appendChild(createElement('span', { className: 'rec-review-score__others' },
            others.map(s => t('stats.reviewScoreBy', reviewerName(s.author), s.score, REVIEW_SCORE_MAX)).join(' · ')));
    }
    return row;
}

function buildComment(
    c: RecordingReview, audio: HTMLAudioElement | null, me: string | null, onDelete: () => void
): HTMLElement {
    const li = createElement('li', { className: 'rec-review-comment' });
    const head = createElement('div', { className: 'rec-review-comment__head' });
    head.appendChild(createElement('span', { className: 'rec-review-comment__author' }, reviewerName(c.author)));

    if (c.at_secs !== null) {
        const at = c.at_secs;
        const stamp = createElement('button', {
            type: 'button', className: 'rec-review-stamp', title: t('stats.reviewJumpTo', formatAtSecs(at)),
        }, `▶ ${formatAtSecs(at)}`);
        if (audio) {
            stamp.addEventListener('click', () => {
                audio.currentTime = at;
                void audio.play().catch(() => { /* autoplay blocked: the position is still set */ });
            });
        } else {
            stamp.setAttribute('disabled', 'true');
        }
        head.appendChild(stamp);
    }

    if (me !== null && c.author === me) {
        const del = createElement('button', {
            type: 'button', className: 'rec-review-del', 'aria-label': t('stats.reviewDelete'), title: t('stats.reviewDelete'),
        }, '×');
        del.addEventListener('click', () => {
            if (window.confirm(t('stats.reviewDeleteConfirm'))) onDelete();
        });
        head.appendChild(del);
    }

    li.appendChild(head);
    li.appendChild(createElement('p', { className: 'rec-review-comment__body' }, c.body ?? ''));
    return li;
}

function buildCommentForm(
    path: string, audio: HTMLAudioElement | null, store: ReviewStore, signal: AbortSignal,
    onAuthNeeded: () => void, rerender: () => void, showError: (msg: string) => void
): HTMLElement {
    const form = createElement('form', { className: 'rec-review-form' }) as HTMLFormElement;
    const input = createElement('textarea', {
        className: 'rec-review-form__input',
        rows: '1',
        enterkeyhint: 'send',
        maxLength: String(REVIEW_BODY_MAX),
        placeholder: t('stats.reviewPlaceholder'),
        'aria-label': t('stats.reviewPlaceholder'),
    }) as HTMLTextAreaElement;

    // Time chip: follows the player; tapping it pins or unpins the current second
    let pinned: number | null = null;
    const chip = createElement('button', { type: 'button', className: 'rec-review-chip' });
    const currentSecs = (): number => Math.floor(audio?.currentTime ?? 0);
    const paintChip = () => {
        const on = pinned !== null;
        chip.classList.toggle('is-active', on);
        chip.setAttribute('aria-pressed', String(on));
        chip.textContent = on ? t('stats.reviewAtOn', formatAtSecs(pinned!)) : t('stats.reviewAtOff', formatAtSecs(currentSecs()));
    };
    if (audio) {
        chip.addEventListener('click', () => { pinned = pinned === null ? currentSecs() : null; paintChip(); });
        // Starting to type while the take has been played pins that moment automatically
        input.addEventListener('focus', () => { if (pinned === null && currentSecs() > 0) { pinned = currentSecs(); paintChip(); } });
        audio.addEventListener('timeupdate', () => { if (pinned === null) paintChip(); }, { signal });
        paintChip();
    } else {
        chip.style.display = 'none';
    }

    const send = createElement('button', {
        type: 'submit', className: 'rec-review-send', 'aria-label': t('stats.reviewSend'), title: t('stats.reviewSend'),
    }, '↑');

    form.addEventListener('submit', async (e: Event) => {
        e.preventDefault();
        const body = input.value.trim();
        if (!body) { input.focus(); return; }
        const who = getReviewer();
        if (!who) { onAuthNeeded(); return; }
        send.setAttribute('disabled', 'true');
        try {
            const saved = await addReview({ recording_path: path, author: who, kind: 'comment', body, at_secs: pinned });
            store.items = [...store.items, saved];
            rerender();
        } catch (err: unknown) {
            console.warn('Review comment:', err);
            send.removeAttribute('disabled');
            showError(t('stats.reviewError'));
        }
    });

    // Enter sends, Shift+Enter adds a line
    input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
    });
    // Grows with the text instead of showing a resize handle
    input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = `${input.scrollHeight}px`; });

    form.appendChild(input);
    form.appendChild(chip);
    form.appendChild(send);
    return form;
}
