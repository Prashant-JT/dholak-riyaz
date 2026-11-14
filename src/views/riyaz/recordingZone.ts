/**
 * RECORDING ZONE — per-block microphone recorder
 * Records the block, previews it, offers a download, and keeps the take in
 * the local recording draft so it is uploaded when the session is saved.
 */

import { createElement } from '../../core/utils.js';
import { t } from '../../i18n/index.js';
import type { SessionBlock } from '../../types.js';
import { putRecording, getRecording, deleteRecording } from './recordingDraft.js';
import { formatTime } from './wizardStep2.js';

// Active recording zones register a release function so the mic is freed on teardown
const recorderReleasers = new Set<() => void>();

/** Stop any in-progress recording and release the microphone. */
export function releaseRecorders(): void {
    recorderReleasers.forEach(release => release());
    recorderReleasers.clear();
}


// ── Audio recording zone — microphone only, with preview before download ─────

export function renderRecordingZone(block: SessionBlock): HTMLElement {
    const wrapper = createElement('div', { className: 'session-rec-zone' });

    // Check browser support
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        wrapper.appendChild(createElement('p', { className: 'text-muted text-sm' }, t('step2.recUnsupported')));
        return wrapper;
    }

    let mediaRecorder: MediaRecorder | null = null;
    let chunks: BlobPart[] = [];
    let allTracks: MediaStreamTrack[] = [];
    let previewUrl: string | null = null;

    const recBtn    = createElement('button', { className: 'session-rec-btn' }, t('step2.recStart')) as HTMLButtonElement;
    const statusEl  = createElement('span',   { className: 'session-rec-status' });
    // Preview area — shown after recording stops, hidden initially
    const previewArea = createElement('div',  { className: 'session-rec-preview', style: { display: 'none' } });

    wrapper.appendChild(recBtn);
    wrapper.appendChild(statusEl);
    wrapper.appendChild(previewArea);

    // ── Build descriptive filename ──────────────────────────────────────────
    const buildFilename = (ext: string): string => {
        const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9À-ÿ]+/g, '_').replace(/^_|_$/g, '');
        const date = new Date().toISOString().slice(0, 10);

        if (block.type === 'warmup') {
            const kayda = sanitize(block.kaydaName ?? 'WarmUp');
            const lehra = block.lehraLabel ? `_${sanitize(block.lehraLabel)}` : '';
            return `WarmUp_${kayda}${lehra}_${date}.${ext}`;
        }
        if (block.type === 'pickup') {
            const pattern = sanitize(block.pickupName ?? 'Pickup');
            return `Pickup_${pattern}_${date}.${ext}`;
        }
        // Practice block
        const taal      = sanitize(block.taalName ?? '');
        const variation = block.variationName && block.variationName !== 'Patrón Principal'
            ? `_${sanitize(block.variationName)}`
            : '';
        const support   = block.supportRef ? `_${sanitize(block.supportRef)}` : '';
        const bpm       = block.bpmEnd ?? block.bpmStart;
        const bpmPart   = bpm ? `_${bpm}BPM` : '';
        return `${taal}${variation}${support}${bpmPart}_${date}.${ext}`;
    };

    // ── Show preview + download button after recording ──────────────────────
    const showPreview = (blob: Blob, mimeType: string, kept: boolean): void => {
        // Build list of available extensions for the format dropdown.
        // The blob content is always the recorded mimeType — only the file
        // extension changes so the OS/app associates it correctly.
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const nativeExt = isIOS ? 'm4a'
            : (mimeType.includes('ogg') || mimeType.includes('opus')) ? 'ogg'
            : mimeType.includes('mp4') ? 'm4a'
            : 'webm';
        // Offer all common extensions — only the filename changes, not the content.
        // m4a/mp4 = same AAC container, ogg = opus, webm = opus/vp8.
        const allExts = ['m4a', 'mp4', 'ogg', 'webm'].filter(e => e !== nativeExt);
        const exts = [nativeExt, ...allExts]; // native first (recommended)

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const url = URL.createObjectURL(blob);
        previewUrl = url;

        previewArea.innerHTML = '';
        previewArea.style.display = '';

        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = url;
        audio.className = 'session-rec-audio';
        previewArea.appendChild(audio);

        // Keep-with-session toggle: kept recordings are uploaded when the session is saved
        const keepRow   = createElement('label', { className: 'session-rec-keep' });
        const keepCheck = createElement('input', { type: 'checkbox', className: 'session-rec-keep__check' }) as HTMLInputElement;
        keepCheck.checked = kept;
        keepCheck.addEventListener('change', () => {
            void (keepCheck.checked
                ? putRecording(block.id, blob, mimeType)
                : deleteRecording(block.id));
        });
        keepRow.appendChild(keepCheck);
        keepRow.appendChild(createElement('span', {}, t('step2.recKeep')));
        previewArea.appendChild(keepRow);

        const dlRow = createElement('div', { className: 'session-rec-dl-row' });

        const extSelect = createElement('select', { className: 'session-rec-ext-select' }) as HTMLSelectElement;
        exts.forEach(e => {
            const opt = createElement('option', { value: e }, `.${e}`) as HTMLOptionElement;
            extSelect.appendChild(opt);
        });
        dlRow.appendChild(extSelect);

        const dlBtn = createElement('button', { className: 'btn-secondary session-rec-dl-btn' }, t('step2.recDownload')) as HTMLButtonElement;
        dlBtn.addEventListener('click', () => {
            // The object URL stays alive for the preview player; it is revoked on re-record
            const a = document.createElement('a');
            a.href     = url;
            a.download = buildFilename(extSelect.value);
            a.click();
        });
        dlRow.appendChild(dlBtn);
        previewArea.appendChild(dlRow);
    };

    // Restore a recording already made for this block (jump back, page reload)
    void getRecording(block.id).then(rec => {
        if (rec && !mediaRecorder && previewArea.childElementCount === 0) {
            showPreview(rec.blob, rec.mimeType, true);
        }
    });

    // ── Start / stop handler ────────────────────────────────────────────────
    recBtn.addEventListener('click', async () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            return;
        }

        // Hide any previous preview
        previewArea.style.display = 'none';
        previewArea.innerHTML = '';
        chunks = [];
        allTracks = [];

        // MP4/AAC first: it is the only format every phone, browser and desktop
        // player can open. WebM/Ogg (Opus) only as a fallback (e.g. Firefox).
        const mimeType = [
            'audio/mp4; codecs=mp4a.40.2', 'audio/mp4',
            'audio/webm; codecs=opus', 'audio/ogg; codecs=opus', 'audio/ogg', 'audio/webm',
        ].find(m => MediaRecorder.isTypeSupported(m)) ?? '';

        // ── Acquire microphone stream ────────────────────────────────────────
        // Disable echo cancellation and noise suppression so the lehra/song
        // playing from the speaker is captured alongside the dholak.
        let micStream: MediaStream;
        try {
            micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl:  false,
                },
                video: false,
            });
        } catch {
            statusEl.textContent = t('step2.recNoMic');
            return;
        }
        micStream.getAudioTracks().forEach(tr => allTracks.push(tr));

        // ── Mic gain via Web Audio API ───────────────────────────────────────
        // Routes: micStream → AudioContext source → GainNode → MediaStreamDestination
        // The destination stream is what MediaRecorder actually captures.
        const audioCtx  = new AudioContext();
        const source    = audioCtx.createMediaStreamSource(micStream);
        const gainNode  = audioCtx.createGain();
        gainNode.gain.value = 1.3;
        const dest      = audioCtx.createMediaStreamDestination();
        source.connect(gainNode);
        gainNode.connect(dest);
        const boostedStream = dest.stream;

        // ── Start MediaRecorder on the boosted stream ────────────────────────
        // 48 kbps keeps percussion clear while a 5-minute block stays under ~2 MB
        const recOptions: MediaRecorderOptions = { audioBitsPerSecond: 48_000 };
        if (mimeType) recOptions.mimeType = mimeType;
        mediaRecorder = new MediaRecorder(boostedStream, recOptions);

        mediaRecorder.addEventListener('dataavailable', (e: BlobEvent) => {
            if (e.data.size > 0) chunks.push(e.data);
        });

        mediaRecorder.addEventListener('stop', () => {
            allTracks.forEach(tr => tr.stop());
            // track.stop() does not fire 'ended', so close the context explicitly
            void audioCtx.close();
            recorderReleasers.delete(release);

            const recordedType = mimeType || mediaRecorder?.mimeType || 'audio/webm';
            const blob = new Blob(chunks, { type: recordedType });
            // Kept by default: stored locally now, uploaded when the session is saved
            void putRecording(block.id, blob, recordedType);
            if (wrapper.isConnected) showPreview(blob, recordedType, true);

            recBtn.textContent = t('step2.recStart');
            recBtn.classList.remove('session-rec-btn--recording');
            statusEl.textContent = '';
            mediaRecorder = null;
        });

        const release = (): void => {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
        };
        recorderReleasers.add(release);

        mediaRecorder.start();
        recBtn.textContent   = t('step2.recStop');
        recBtn.classList.add('session-rec-btn--recording');

        // Live elapsed counter
        const recStartTime = Date.now();
        const recTick = window.setInterval(() => {
            if (!mediaRecorder || mediaRecorder.state !== 'recording') {
                clearInterval(recTick);
                return;
            }
            statusEl.textContent = `⏺ ${formatTime(Math.floor((Date.now() - recStartTime) / 1000))}`;
        }, 1000);
    });

    return wrapper;
}
