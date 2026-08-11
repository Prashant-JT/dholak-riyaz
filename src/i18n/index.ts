/**
 * I18N — función t() y gestión de idioma
 *
 * Uso básico:
 *   import { t } from '../i18n/index.js';
 *   t('metronome.start')          → 'Iniciar' | 'Start'
 *   t('songs.counter', 42)        → '42 canciones' | '42 songs'
 *
 * Cambiar idioma:
 *   import { setLang } from '../i18n/index.js';
 *   setLang('en');   // guarda en localStorage y recarga la app
 */

import { es } from './es.js';
import { en } from './en.js';
import type { Strings } from './es.js';

export type Lang = 'es' | 'en';

const LS_KEY = 'dholak_lang';

// ── Detectar idioma ────────────────────────────────────────────────────────────

function detectLang(): Lang {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === 'es' || saved === 'en') return saved as Lang;
    return navigator.language.startsWith('es') ? 'es' : 'en';
}

export let lang: Lang = detectLang();

const STRINGS: Record<Lang, Strings> = { es, en };

// ── Cambiar idioma ─────────────────────────────────────────────────────────────

export function setLang(l: Lang): void {
    localStorage.setItem(LS_KEY, l);
    location.reload();
}

export function getLang(): Lang {
    return lang;
}

// ── Función t() ───────────────────────────────────────────────────────────────
//
// Acepta una dot-path key y args opcionales para strings con función.
//
// Ejemplos:
//   t('metronome.start')             → 'Iniciar'
//   t('songs.counter', 42)           → '42 canciones'
//   t('step1.startBtn', 3)           → '▶ Comenzar sesión · 3 bloques'
//   t('recovery.timeAgoN', 5)        → 'hace 5 min'

export function t(key: string, ...args: any[]): string {
    const keys = key.split('.');
    let node: any = STRINGS[lang];

    for (const k of keys) {
        if (node == null) break;
        node = node[k];
    }

    if (node == null) {
        // Fallback: try the Spanish version before giving up
        node = STRINGS['es'];
        for (const k of keys) {
            if (node == null) break;
            node = node[k];
        }
    }

    if (node == null) return key;           // last resort: return the key itself
    if (typeof node === 'function') return String(node(...args));
    return String(node);
}

/**
 * Like t(), but returns the raw value as a string array.
 * Use for keys whose value is an array (e.g. monthsShort, dayNames).
 * Falls back to the Spanish strings if the key is missing.
 */
export function tArray(key: string): string[] {
    const keys = key.split('.');
    let node: any = STRINGS[lang];

    for (const k of keys) {
        if (node == null) break;
        node = node[k];
    }

    if (!Array.isArray(node)) {
        // Fallback to Spanish
        node = STRINGS['es'];
        for (const k of keys) {
            if (node == null) break;
            node = node[k];
        }
    }

    return Array.isArray(node) ? node as string[] : [];
}

// Made with Bob
