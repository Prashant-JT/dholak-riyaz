/**
 * DATA VALIDATION TESTS
 * Validates structural integrity of all data files.
 * These tests protect against broken data when adding weekly content.
 */

import { describe, it, expect } from 'vitest';
import { TAALS } from '../src/data/taals/index';
import { SONGS } from '../src/data/songs';
import { KAYDAS } from '../src/data/kaydas';
import { FILLERS } from '../src/data/fillers';
import { CONFIG } from '../src/core/config';

// ── TAALS ─────────────────────────────────────────────────────────────────────

describe('TAALS data integrity', () => {
    const taalEntries = Object.entries(TAALS);

    it('has at least 7 taals defined', () => {
        expect(taalEntries.length).toBeGreaterThanOrEqual(7);
    });

    taalEntries.forEach(([id, taal]) => {
        describe(`Taal: ${id}`, () => {
            it('has required fields (name, beats, description, rows)', () => {
                expect(taal.name).toBeTruthy();
                expect(taal.beats).toBeGreaterThan(0);
                expect(taal.description).toBeTruthy();
                expect(Array.isArray(taal.rows)).toBe(true);
                expect(taal.rows.length).toBeGreaterThan(0);
            });

            it('has rows split into sub-arrays (vibhags, not a flat list)', () => {
                // Each element of rows must itself be an array
                taal.rows.forEach((row, i) => {
                    expect(Array.isArray(row), `rows[${i}] must be an array`).toBe(true);
                });
            });

            it('total matra count matches beats', () => {
                const total = taal.rows.flat().length;
                expect(total).toBe(taal.beats);
            });

            it('matra numbers are sequential starting at 1', () => {
                const matras = taal.rows.flat();
                matras.forEach((m, i) => {
                    expect(m.matra).toBe(i + 1);
                });
            });

            it('each matra has a non-empty bol', () => {
                taal.rows.flat().forEach(m => {
                    expect(m.bol).toBeTruthy();
                });
            });

            if (taal.variations) {
                taal.variations.forEach((variation, vi) => {
                    describe(`Variation ${vi}: ${variation.name}`, () => {
                        it('has rows split into sub-arrays', () => {
                            variation.rows.forEach((row, i) => {
                                expect(Array.isArray(row), `rows[${i}] must be an array`).toBe(true);
                            });
                        });

                        it('total matra count matches taal beats', () => {
                            const total = variation.rows.flat().length;
                            expect(total).toBe(taal.beats);
                        });
                    });
                });
            }
        });
    });
});

// ── SONGS ─────────────────────────────────────────────────────────────────────

describe('SONGS data integrity', () => {
    it('has at least one song', () => {
        expect(SONGS.length).toBeGreaterThan(0);
    });

    SONGS.forEach((song, i) => {
        it(`song[${i}] "${song.title}" has required fields`, () => {
            expect(song.title).toBeTruthy();
            expect(song.artist).toBeTruthy();
            expect(song.taal).toBeTruthy();
            expect(song.youtubeUrl).toBeTruthy();
        });

        it(`song[${i}] "${song.title}" has a valid YouTube URL`, () => {
            const isYoutube =
                song.youtubeUrl.startsWith('https://youtu.be/') ||
                song.youtubeUrl.startsWith('https://www.youtube.com/');
            expect(isYoutube, `"${song.youtubeUrl}" is not a valid YouTube URL`).toBe(true);
        });
    });
});

// ── KAYDAS ────────────────────────────────────────────────────────────────────

describe('KAYDAS data integrity', () => {
    const kaydaEntries = Object.entries(KAYDAS);

    it('has at least one kayda', () => {
        expect(kaydaEntries.length).toBeGreaterThan(0);
    });

    kaydaEntries.forEach(([id, kayda]) => {
        it(`kayda "${id}" has required fields`, () => {
            expect(kayda.name).toBeTruthy();
            expect(kayda.taal).toBeTruthy();
            expect(kayda.beats).toBeGreaterThan(0);
            expect(Array.isArray(kayda.rows)).toBe(true);
            expect(kayda.rows.length).toBeGreaterThan(0);
        });

        it(`kayda "${id}" each row has a label and at least one matra`, () => {
            kayda.rows.forEach((row, i) => {
                expect(row.label, `rows[${i}].label`).toBeTruthy();
                expect(row.matras.length, `rows[${i}].matras`).toBeGreaterThan(0);
            });
        });
    });
});

// ── FILLERS ───────────────────────────────────────────────────────────────────

describe('FILLERS data integrity', () => {
    it('has at least one filler category', () => {
        expect(FILLERS.length).toBeGreaterThan(0);
    });

    FILLERS.forEach((filler, i) => {
        it(`filler[${i}] "${filler.category}" has a category and patterns`, () => {
            expect(filler.category).toBeTruthy();
            expect(Array.isArray(filler.patterns)).toBe(true);
            expect(filler.patterns.length).toBeGreaterThan(0);
        });

        filler.patterns.forEach((pattern, pi) => {
            it(`filler[${i}].patterns[${pi}] has a non-empty name`, () => {
                expect(pattern.name).toBeTruthy();
            });
        });
    });
});

// ── CONFIG / NAVIGATION ───────────────────────────────────────────────────────

describe('CONFIG navigation integrity', () => {
    it('all taal nav items have a corresponding entry in TAALS', () => {
        const taalNavItems = CONFIG.NAVIGATION.filter(item => item.id in TAALS);
        taalNavItems.forEach(item => {
            expect(TAALS).toHaveProperty(item.id);
        });
    });

    it('BPM_MARKS are in ascending order', () => {
        const marks = CONFIG.METRONOME;
        expect(marks.MIN_BPM).toBeLessThan(marks.MAX_BPM);
        expect(marks.DEFAULT_BPM).toBeGreaterThanOrEqual(marks.MIN_BPM);
        expect(marks.DEFAULT_BPM).toBeLessThanOrEqual(marks.MAX_BPM);
    });

    it('each navigation item has a non-empty id and label', () => {
        CONFIG.NAVIGATION.forEach((item, i) => {
            expect(item.id, `nav[${i}].id`).toBeTruthy();
            expect(item.label, `nav[${i}].label`).toBeTruthy();
        });
    });
});
