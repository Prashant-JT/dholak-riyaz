/**
 * RECORDING ZONE — per-block microphone recorder
 * Recording is optional. A block can hold several takes (e.g. one per song or
 * bhajan); each take can be labelled, previewed, downloaded and kept or not.
 * Kept takes live in the local recording draft and are uploaded when the
 * session is saved.
 */

import { createElement, MAIN_PATTERN_NAME } from '../../core/utils.js';
import { t } from '../../i18n/index.js';
import type { SessionBlock } from '../../types.js';
import {
    addTake, updateTake, listTakes, trackPendingWrite,
    MAX_TAKES_PER_BLOCK, type RecordingTake,
} from './recordingDraft.js';
import { formatTime } from './wizardStep2.js';

export const TAKE_LABEL_MAX = 80;

// Mounted zones register a release function: stops an in-progress recording
// (so the take is stored) and revokes the zone's object URLs.
const recorderReleasers = new Set<() => void>();

/** Stop any in-progress recording, release the microphone and free object URLs. */
export function releaseRecorders(): void {
    recorderReleasers.forEach(release => release());
    recorderReleasers.clear();
}

/** Descriptive download filename built from the block and the take label. */
function buildFilename(block: SessionBlock, label: string, ext: string): string {
    const sanitize = (s: string): string => s.replace(/[^a-zA-Z0-9À-ÿ]+/g, '_').replace(/^_|_$/g, '');
    const date  = new Date().toISOString().slice(0, 10);
    const take  = label ? `_${sanitize(label)}` : '';

    if (block.type === 'warmup') {
        const kayda = sanitize(block.kaydaName ?? 'WarmUp');
        const lehra = block.lehraLabel ? `_${sanitize(block.lehraLabel)}` : '';
        return `WarmUp_${kayda}${lehra}${take}_${date}.${ext}`;
    }
    if (block.type === 'pickup') {
        return `Pickup_${sanitize(block.pickupName ?? 'Pickup')}${take}_${date}.${ext}`;
    }
    const taal      = sanitize(block.taalName ?? '');
    const variation = block.variationName && block.variationName !== MAIN_PATTERN_NAME
        ? `_${sanitize(block.variationName)}` : '';
    const support   = block.supportRef ? `_${sanitize(block.supportRef)}` : '';
    const bpm       = block.bpmEnd ?? block.bpmStart;
    return `${taal}${variation}${support}${take}${bpm ? `_${bpm}BPM` : ''}_${date}.${ext}`;
}

/** Download extensions offered for a take — native first. Only the name changes, not the content. */
function downloadExtensions(mimeType: string): string[] {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const nativeExt = isIOS || mimeType.includes('mp4') ? 'm4a'
        : (mimeType.includes('ogg') || mimeType.includes('opus')) ? 'ogg'
        : 'webm';
    return [nativeExt, ...['m4a', 'mp4', 'ogg', 'webm'].filter(e => e !== nativeExt)];
}

export function renderRecordingZone(block: SessionBlock): HTMLElement {
    const wrapper = createElement('div', { className: 'session-rec-zone' });

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        wrapper.appendChild(createElement('p', { className: 'text-muted text-sm' }, t('step2.recUnsupported')));
        return wrapper;
    }

    let mediaRecorder: MediaRecorder | null = null;
    let starting = false;                         // guards a second tap while the mic prompt is open
    let stopped: Promise<void> | null = null;     // resolves once the current take is stored
    const objectUrls: string[] = [];
    const renderedTakes = new Set<string>();
    let takeCount = 0;
    let keptCount = 0;

    // [Record]  hint (muted) — the hint gives way to the live timer while recording
    const controls = createElement('div', { className: 'session-rec-controls' });
    const recBtn   = createElement('button', { className: 'session-rec-btn' }, t('step2.recStart')) as HTMLButtonElement;
    const statusEl = createElement('span', { className: 'session-rec-status' });
    const hintEl   = createElement('p', { className: 'session-rec-hint text-muted' }, t('step2.recOptional'));
    controls.appendChild(recBtn);
    controls.appendChild(statusEl);
    controls.appendChild(hintEl);
    wrapper.appendChild(controls);
    const syncHint = (): void => {
        hintEl.style.display = mediaRecorder || statusEl.textContent ? 'none' : '';
    };

    const takesList = createElement('div', { className: 'session-rec-takes' });
    wrapper.appendChild(takesList);

    const refreshLimit = (): void => {
        const full = keptCount >= MAX_TAKES_PER_BLOCK;
        if (!mediaRecorder) recBtn.disabled = full;
        if (full) statusEl.textContent = t('step2.recLimit', MAX_TAKES_PER_BLOCK);
        else if (!mediaRecorder && statusEl.textContent === t('step2.recLimit', MAX_TAKES_PER_BLOCK)) statusEl.textContent = '';
        syncHint();
    };

    // ── One take card ───────────────────────────────────────────────────────
    const renderTake = (take: RecordingTake): void => {
        if (renderedTakes.has(take.takeId)) return;
        renderedTakes.add(take.takeId);
        takeCount++;
        if (take.kept) keptCount++;

        // Layout: [Take N ........ ☑ Save with the session] / label / player / [.ext ▾] [Download]
        const card = createElement('div', { className: 'session-rec-take' });
        const head = createElement('div', { className: 'session-rec-take__head' });
        head.appendChild(createElement('span', { className: 'session-rec-take__title' }, t('step2.recTake', takeCount)));
        card.appendChild(head);

        const labelInput = createElement('input', {
            type: 'text',
            className: 'session-rec-take__label',
            maxLength: String(TAKE_LABEL_MAX),
            placeholder: t('step2.recTakeLabel'),
            'aria-label': t('step2.recTakeLabel'),
        }) as HTMLInputElement;
        labelInput.value = take.label;
        // The cached take is updated on every key (a save right after typing sees it);
        // the IndexedDB write is debounced
        let labelTimer: number | null = null;
        const persistLabel = (): void => {
            if (labelTimer !== null) { clearTimeout(labelTimer); labelTimer = null; }
            void updateTake(take.takeId, { label: take.label });
        };
        labelInput.addEventListener('input', () => {
            take.label = labelInput.value.trim();
            if (labelTimer !== null) clearTimeout(labelTimer);
            labelTimer = window.setTimeout(persistLabel, 400);
        });
        labelInput.addEventListener('blur', persistLabel);
        card.appendChild(labelInput);

        const url = URL.createObjectURL(take.blob);
        objectUrls.push(url);
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = url;
        audio.className = 'session-rec-audio';
        card.appendChild(audio);

        const keepRow   = createElement('label', { className: 'session-rec-keep' });
        const keepCheck = createElement('input', { type: 'checkbox', className: 'session-rec-keep__check' }) as HTMLInputElement;
        keepCheck.checked = take.kept;
        keepCheck.addEventListener('change', () => {
            if (keepCheck.checked && keptCount >= MAX_TAKES_PER_BLOCK) {
                keepCheck.checked = false;
                return;
            }
            take.kept = keepCheck.checked;
            keptCount += take.kept ? 1 : -1;
            card.classList.toggle('session-rec-take--discarded', !take.kept);
            void updateTake(take.takeId, { kept: take.kept });
            refreshLimit();
        });
        card.classList.toggle('session-rec-take--discarded', !take.kept);
        keepRow.appendChild(keepCheck);
        keepRow.appendChild(createElement('span', {}, t('step2.recKeep')));
        head.appendChild(keepRow);

        const dlRow = createElement('div', { className: 'session-rec-dl-row' });
        const extSelect = createElement('select', { className: 'session-rec-ext-select' }) as HTMLSelectElement;
        downloadExtensions(take.mimeType).forEach(e => {
            extSelect.appendChild(createElement('option', { value: e }, `.${e}`) as HTMLOptionElement);
        });
        dlRow.appendChild(extSelect);
        const dlBtn = createElement('button', { className: 'btn-secondary session-rec-dl-btn' }, t('step2.recDownload'));
        dlBtn.addEventListener('click', () => {
            const a = document.createElement('a');
            a.href     = url;
            a.download = buildFilename(block, labelInput.value.trim(), extSelect.value);
            a.click();
        });
        dlRow.appendChild(dlBtn);
        card.appendChild(dlRow);

        takesList.appendChild(card);
        refreshLimit();
    };

    // Restore takes already made for this block (jump back, page reload)
    void listTakes(block.id).then(takes => takes.forEach(renderTake));

    // ── Teardown: stop the recorder (the take is still stored) and free URLs ─
    const release = (): void => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            if (stopped) trackPendingWrite(stopped);
            mediaRecorder.stop();
        }
        objectUrls.forEach(u => URL.revokeObjectURL(u));
        objectUrls.length = 0;
    };
    recorderReleasers.add(release);

    // ── Start / stop handler ────────────────────────────────────────────────
    recBtn.addEventListener('click', async () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            if (stopped) trackPendingWrite(stopped);
            mediaRecorder.stop();
            return;
        }
        if (starting || keptCount >= MAX_TAKES_PER_BLOCK) return;
        starting = true;
        recBtn.disabled = true;

        // MP4/AAC first: it is the only format every phone, browser and desktop
        // player can open. WebM/Ogg (Opus) only as a fallback (e.g. Firefox).
        const mimeType = [
            'audio/mp4; codecs=mp4a.40.2', 'audio/mp4',
            'audio/webm; codecs=opus', 'audio/ogg; codecs=opus', 'audio/ogg', 'audio/webm',
        ].find(m => MediaRecorder.isTypeSupported(m)) ?? '';

        // Echo cancellation and noise suppression off so the lehra/song
        // playing from the speaker is captured alongside the dholak.
        let micStream: MediaStream;
        try {
            micStream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
                video: false,
            });
        } catch {
            statusEl.textContent = t('step2.recNoMic');
            starting = false;
            recBtn.disabled = false;
            syncHint();
            return;
        }
        // The user may have left the block while the mic prompt was open
        if (!wrapper.isConnected) {
            micStream.getTracks().forEach(tr => tr.stop());
            starting = false;
            return;
        }

        // Mic gain: micStream → source → GainNode (1.3×) → destination stream
        const audioCtx = new AudioContext();
        const source   = audioCtx.createMediaStreamSource(micStream);
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 1.3;
        const dest     = audioCtx.createMediaStreamDestination();
        source.connect(gainNode);
        gainNode.connect(dest);

        // 48 kbps keeps percussion clear while a 5-minute take stays under ~2 MB
        const recOptions: MediaRecorderOptions = { audioBitsPerSecond: 48_000 };
        if (mimeType) recOptions.mimeType = mimeType;
        const recorder = new MediaRecorder(dest.stream, recOptions);
        mediaRecorder = recorder;
        const chunks: BlobPart[] = [];

        let markStored: () => void = () => {};
        stopped = new Promise<void>(resolve => { markStored = resolve; });

        recorder.addEventListener('dataavailable', (e: BlobEvent) => {
            if (e.data.size > 0) chunks.push(e.data);
        });

        recorder.addEventListener('stop', () => {
            micStream.getTracks().forEach(tr => tr.stop());
            // track.stop() does not fire 'ended', so close the context explicitly
            void audioCtx.close();
            clearInterval(recTick);

            const recordedType = mimeType || recorder.mimeType || 'audio/webm';
            const take: RecordingTake = {
                takeId:    crypto.randomUUID(),
                blockId:   block.id,
                blob:      new Blob(chunks, { type: recordedType }),
                mimeType:  recordedType,
                label:     '',
                kept:      true,     // kept by default — uncheck to leave it out of the session
                createdAt: Date.now(),
            };
            void addTake(take).finally(markStored);
            if (wrapper.isConnected) renderTake(take);

            mediaRecorder = null;
            stopped = null;
            recBtn.textContent = t('step2.recStart');
            recBtn.classList.remove('session-rec-btn--recording');
            statusEl.textContent = '';
            refreshLimit();
        });

        recorder.start();
        starting = false;
        recBtn.disabled = false;
        recBtn.textContent = t('step2.recStop');
        recBtn.classList.add('session-rec-btn--recording');

        const recStartTime = Date.now();
        statusEl.textContent = formatTime(0);
        syncHint();
        const recTick = window.setInterval(() => {
            statusEl.textContent = formatTime(Math.floor((Date.now() - recStartTime) / 1000));
        }, 1000);
    });

    return wrapper;
}
