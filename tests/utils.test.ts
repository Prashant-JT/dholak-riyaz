/**
 * UTILS TESTS
 * Unit tests for src/core/utils.ts pure functions
 */

import { describe, it, expect } from 'vitest';
import { chunkArray, bolsHaveIndicators, applyBolIndicators, VIBHAG_DIVIDERS } from '../src/core/utils';

// ── chunkArray ────────────────────────────────────────────────────────────────

describe('chunkArray', () => {
    it('splits an even array into equal chunks', () => {
        expect(chunkArray([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
    });

    it('handles arrays that are not evenly divisible', () => {
        expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('returns the whole array in one chunk when size >= length', () => {
        expect(chunkArray([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
    });

    it('returns an empty array for empty input', () => {
        expect(chunkArray([], 3)).toEqual([]);
    });

    it('works with strings', () => {
        expect(chunkArray(['a', 'b', 'c', 'd'], 2)).toEqual([['a', 'b'], ['c', 'd']]);
    });
});

// ── bolsHaveIndicators ────────────────────────────────────────────────────────

describe('bolsHaveIndicators', () => {
    it('returns true when rows contain (thapki)', () => {
        const rows = [[{ matra: 1, bol: 'Na (thapki)', technique: '' }]];
        expect(bolsHaveIndicators(rows)).toBe(true);
    });

    it('returns true when rows contain (ghuisa)', () => {
        const rows = [[{ matra: 1, bol: 'Ge (ghuisa)', technique: '' }]];
        expect(bolsHaveIndicators(rows)).toBe(true);
    });

    it('returns true when rows contain (ghisa)', () => {
        const rows = [[{ matra: 1, bol: 'Ge (ghisa)', technique: '' }]];
        expect(bolsHaveIndicators(rows)).toBe(true);
    });

    it('returns false when rows have no indicators', () => {
        const rows = [[{ matra: 1, bol: 'Dhin', technique: 'Taali' }]];
        expect(bolsHaveIndicators(rows)).toBe(false);
    });
});

// ── applyBolIndicators ────────────────────────────────────────────────────────

describe('applyBolIndicators', () => {
    it('strips (thapki) from bol text and sets clean name', () => {
        const div = document.createElement('div');
        applyBolIndicators(div, 'Na (thapki)');
        expect(div.textContent?.startsWith('Na')).toBe(true);
        expect(div.textContent).not.toContain('(thapki)');
    });

    it('strips (ghuisa) from bol text and sets clean name', () => {
        const div = document.createElement('div');
        applyBolIndicators(div, 'Ge (ghuisa)');
        expect(div.textContent?.startsWith('Ge')).toBe(true);
        expect(div.textContent).not.toContain('(ghuisa)');
    });

    it('appends a thapki indicator dot', () => {
        const div = document.createElement('div');
        applyBolIndicators(div, 'Na (thapki)');
        expect(div.querySelector('.bol-indicator--thapki')).not.toBeNull();
    });

    it('appends a ghuisa indicator dot', () => {
        const div = document.createElement('div');
        applyBolIndicators(div, 'Ge (ghuisa)');
        expect(div.querySelector('.bol-indicator--ghuisa')).not.toBeNull();
    });

    it('does not append any indicator for a plain bol', () => {
        const div = document.createElement('div');
        applyBolIndicators(div, 'Dhin');
        expect(div.querySelector('.bol-indicator')).toBeNull();
        expect(div.textContent).toBe('Dhin');
    });
});

// ── VIBHAG_DIVIDERS ───────────────────────────────────────────────────────────

describe('VIBHAG_DIVIDERS', () => {
    it('has an entry for every standard beat count', () => {
        const expectedBeats = [6, 7, 8, 12, 14, 16];
        expectedBeats.forEach(beats => {
            expect(VIBHAG_DIVIDERS).toHaveProperty(String(beats));
        });
    });

    it('Keherwa (8B) divides after matra 4', () => {
        expect(VIBHAG_DIVIDERS[8]).toEqual([4]);
    });

    it('Ektal (12B) has 5 dividers', () => {
        expect(VIBHAG_DIVIDERS[12]).toHaveLength(5);
    });

    it('Deepchandi (14B) divides at 3, 7, 10', () => {
        expect(VIBHAG_DIVIDERS[14]).toEqual([3, 7, 10]);
    });

    it('Addha/Teental (16B) divides after 4, 8, 12', () => {
        expect(VIBHAG_DIVIDERS[16]).toEqual([4, 8, 12]);
    });
});
