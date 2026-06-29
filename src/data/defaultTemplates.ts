/**
 * DEFAULT SESSION TEMPLATES
 * Plantillas predefinidas para cada taal principal.
 * Se inyectan en localStorage la primera vez que el usuario abre el Riyaz.
 */

import type { SessionBlock } from '../types';

interface SavedTemplate { id: string; name: string; blocks: SessionBlock[]; }

const LEHRA_9MIN_URL   = 'https://www.youtube.com/embed/_iPJmUH0zqA';
const LEHRA_9MIN_LABEL = '200 BPM - 108 ciclos - 9 mins';

export const DEFAULT_TEMPLATES: SavedTemplate[] = [
    // ── KEHERWA ───────────────────────────────────────────────────────────────
    {
        id: 'default-keherwa',
        name: 'Foco Keherwa',
        blocks: [
            {
                id: 'dk-wu', type: 'warmup',
                lehraUrl: LEHRA_9MIN_URL, lehraLabel: LEHRA_9MIN_LABEL,
                kaydaId: 'kayda3', kaydaName: 'Kayda 3',
                timerMode: 'free',
            },
            {
                id: 'dk-1', type: 'practice',
                taalId: 'keherwa', taalName: 'Keherwa Taal',
                variationName: 'Patrón Principal',
                supportType: 'metronome', supportRef: '80 BPM', supportUrl: '',
                bpmStart: 80, timerMode: 'free',
            },
            {
                id: 'dk-2', type: 'practice',
                taalId: 'keherwa', taalName: 'Keherwa Taal',
                variationName: 'Patrón Principal',
                supportType: 'song',
                supportRef: 'Naa Kajre Ki Dhar — Bollywood',
                supportUrl: 'https://www.youtube.com/watch?v=v1rRI4GYTdY',
                timerMode: 'free',
            },
            {
                id: 'dk-3', type: 'practice',
                taalId: 'keherwa', taalName: 'Keherwa Taal',
                variationName: 'Keherwa variación 6 (Fast)',
                supportType: 'song',
                supportRef: 'Chappa Chappa — Bollywood',
                supportUrl: 'https://www.youtube.com/watch?v=HVa0owi2ZP4',
                timerMode: 'free',
            },
            {
                id: 'dk-4', type: 'practice',
                taalId: 'keherwa', taalName: 'Keherwa Taal',
                variationName: 'Keherwa variación Ghoomar (Rajasthani)',
                supportType: 'song',
                supportRef: 'Ghoomar — Bollywood',
                supportUrl: 'https://www.youtube.com/watch?v=nHhRWgkkpMk',
                timerMode: 'free',
            },
        ],
    },

    // ── DADRA ─────────────────────────────────────────────────────────────────
    {
        id: 'default-dadra',
        name: 'Foco Dadra',
        blocks: [
            {
                id: 'dd-wu', type: 'warmup',
                lehraUrl: LEHRA_9MIN_URL, lehraLabel: LEHRA_9MIN_LABEL,
                kaydaId: 'kayda3', kaydaName: 'Kayda 3',
                timerMode: 'free',
            },
            {
                id: 'dd-1', type: 'practice',
                taalId: 'dadra', taalName: 'Dadra Taal',
                variationName: 'Patrón Principal',
                supportType: 'metronome', supportRef: '120 BPM', supportUrl: '',
                bpmStart: 120, timerMode: 'free',
            },
            {
                id: 'dd-2', type: 'practice',
                taalId: 'dadra', taalName: 'Dadra Taal',
                variationName: 'Dandiya',
                supportType: 'song',
                supportRef: 'Hey Naam Re Sabse Bada Tera Naam - Devocional',
                supportUrl: 'https://www.youtube.com/watch?v=UaFTHjUnOao',
                timerMode: 'free',
            },
            {
                id: 'dd-3', type: 'practice',
                taalId: 'dadra', taalName: 'Dadra Taal',
                variationName: 'Dadra variación (famous theka)',
                supportType: 'song',
                supportRef: 'Aaye Ho Meri Zindagi Mein — Bollywood',
                supportUrl: 'https://www.youtube.com/watch?v=ixCnsZswdpU',
                timerMode: 'free',
            },
        ],
    },

    // ── RUPAK ─────────────────────────────────────────────────────────────────
    {
        id: 'default-rupak',
        name: 'Foco Rupak',
        blocks: [
            {
                id: 'dr-wu', type: 'warmup',
                lehraUrl: LEHRA_9MIN_URL, lehraLabel: LEHRA_9MIN_LABEL,
                kaydaId: 'kayda3', kaydaName: 'Kayda 3',
                timerMode: 'free',
            },
            {
                id: 'dr-1', type: 'practice',
                taalId: 'rupak', taalName: 'Rupak Taal',
                variationName: 'Patrón Principal',
                supportType: 'metronome', supportRef: '120 BPM', supportUrl: '',
                bpmStart: 120, timerMode: 'free',
            },
            {
                id: 'dr-2', type: 'practice',
                taalId: 'rupak', taalName: 'Rupak Taal',
                variationName: 'Rupak variación 1 (TiNa TeTe)',
                supportType: 'song',
                supportRef: 'Shri Ramchandra Kripalu Bhajamana — Devocional',
                supportUrl: 'https://youtu.be/i88txA3Qpc8?si=kTHNn1ErPuyIHeEs',
                timerMode: 'free',
            },
        ],
    },

    // ── DEEPCHANDI + RUPAK + KEHERWA PICKUP ──────────────────────────────────
    {
        id: 'default-deepchandi-rupak-pickup',
        name: 'Deepchandi + Rupak + Keherwa pickup sesión (foco en TeTe)',
        blocks: [
            {
                id: 'drp-wu', type: 'warmup',
                lehraUrl: LEHRA_9MIN_URL, lehraLabel: LEHRA_9MIN_LABEL,
                kaydaId: 'kayda3', kaydaName: 'Kayda 3',
                timerMode: 'free',
            },
            {
                id: 'drp-1', type: 'practice',
                taalId: 'deepchandi', taalName: 'Deepchandi Taal',
                variationName: 'Deepchandi variación 2 (NaNa TeTe)',
                supportType: 'metronome', supportRef: '120 BPM', supportUrl: '',
                bpmStart: 120, timerMode: 'free',
            },
            {
                id: 'drp-2', type: 'practice',
                taalId: 'deepchandi', taalName: 'Deepchandi Taal',
                variationName: 'Deepchandi variación 2 (NaNa TeTe)',
                supportType: 'song',
                supportRef: 'Aji Rooth Kar Ab Kahan Jaiyega — Bollywood',
                supportUrl: 'https://www.youtube.com/watch?v=tbVKu36_4ZU',
                timerMode: 'free',
            },
            {
                id: 'drp-3', type: 'practice',
                taalId: 'rupak', taalName: 'Rupak Taal',
                variationName: 'Rupak variación 1 (TiNa TeTe)',
                supportType: 'song',
                supportRef: 'Sharanagatam / Kisi Rah Par Kisi Mor Par — Bollywood',
                supportUrl: 'https://youtu.be/i88txA3Qpc8?si=kTHNn1ErPuyIHeEs',
                timerMode: 'free',
            },
            {
                id: 'drp-pk', type: 'pickup',
                pickupName: 'Ta (x8) Takite Ta Takite (x2) DhaGe NaDha DhaGeNa (x2)',
                pickupTaalCategory: 'Keherwa',
                pickupVideoUrl: 'https://www.youtube.com/watch?v=m5ryRabj5Fc',
                timerMode: 'free',
            },
        ],
    },

    // ── DEEPCHANDI ────────────────────────────────────────────────────────────
    {
        id: 'default-deepchandi',
        name: 'Foco Deepchandi',
        blocks: [
            {
                id: 'ddc-wu', type: 'warmup',
                lehraUrl: LEHRA_9MIN_URL, lehraLabel: LEHRA_9MIN_LABEL,
                kaydaId: 'kayda3', kaydaName: 'Kayda 3',
                timerMode: 'free',
            },
            {
                id: 'ddc-1', type: 'practice',
                taalId: 'deepchandi', taalName: 'Deepchandi Taal',
                variationName: 'Patrón Principal',
                supportType: 'metronome', supportRef: '60 BPM', supportUrl: '',
                bpmStart: 60, timerMode: 'free',
            },
            {
                id: 'ddc-2', type: 'practice',
                taalId: 'deepchandi', taalName: 'Deepchandi Taal',
                variationName: 'Patrón Principal',
                supportType: 'song',
                supportRef: 'Aaj Jaane Ki Zid Na Karo — Farida Khanum',
                supportUrl: 'https://www.youtube.com/watch?v=CfUDuYAasiE',
                timerMode: 'free',
            },
            {
                id: 'ddc-3', type: 'practice',
                taalId: 'deepchandi', taalName: 'Deepchandi Taal',
                variationName: 'Deepchandi variación 1 (Ta Tin Ta Tin)',
                supportType: 'song',
                supportRef: 'Phero Na Nazar Se Najariya — Bollywood',
                supportUrl: 'https://www.youtube.com/watch?v=1_WaSnOnu1Q',
                timerMode: 'free',
            },
        ],
    },
];

// Made with Bob
