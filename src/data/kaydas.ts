/**
 * KAYDAS DATA
 * Actualiza este archivo cuando aprendas nuevas kaydas y variaciones
 */

import type { KaydasData } from '../types';

export const KAYDAS: KaydasData = {
    fundamental: {
        name: 'Kayda Fundamental',
        taal: 'Teental',
        beats: 16,
        description: 'Base Teental - 16 Tiempos',
        description_en: 'Base Teental - 16 Beats',
        rows: [
            {
                label: 'Bhari (Matras 1-8)',
                label_en: 'Bhari (Beats 1-8)',
                matras: [
                    { matra: 1, bol: 'Dha', technique: 'Taali' },
                    { matra: 2, bol: 'Dha', technique: '' },
                    { matra: 3, bol: 'Te', technique: '' },
                    { matra: 4, bol: 'Te', technique: '' },
                    { matra: 5, bol: 'Dha', technique: 'Taali' },
                    { matra: 6, bol: 'Dha', technique: '' },
                    { matra: 7, bol: 'Ti', technique: '' },
                    { matra: 8, bol: 'Na', technique: '' }
                ]
            },
            {
                label: 'Khali (Matras 9-16)',
                label_en: 'Khali (Beats 9-16)',
                matras: [
                    { matra: 9, bol: 'Ta', technique: 'Khali' },
                    { matra: 10, bol: 'Ta', technique: '' },
                    { matra: 11, bol: 'Te', technique: '' },
                    { matra: 12, bol: 'Te', technique: '' },
                    { matra: 13, bol: 'Dha', technique: 'Taali' },
                    { matra: 14, bol: 'Dha', technique: '' },
                    { matra: 15, bol: 'Dhi', technique: '' },
                    { matra: 16, bol: 'Na', technique: '' }
                ]
            }
        ]
    },

    kayda1: {
        name: 'Kayda 1',
        taal: 'Teental',
        beats: 16,
        description: 'Teental - 16 Tiempos',
        description_en: 'Teental - 16 Beats',
        rows: [
            {
                label: 'Parte 1 (Matras 1-8)',
                label_en: 'Part 1 (Beats 1-8)',
                matras: [
                    { matra: 1, bol: 'Dha', technique: '' },
                    { matra: 2, bol: 'Dha', technique: '' },
                    { matra: 3, bol: 'Te', technique: '' },
                    { matra: 4, bol: 'Te', technique: '' },
                    { matra: 5, bol: 'Dha', technique: '' },
                    { matra: 6, bol: 'Dha', technique: '' },
                    { matra: 7, bol: 'Ti', technique: '' },
                    { matra: 8, bol: 'Na', technique: '' }
                ]
            },
            {
                label: 'Parte 2 (Matras 9-16)',
                label_en: 'Part 2 (Beats 9-16)',
                matras: [
                    { matra: 9, bol: 'Ta', technique: '' },
                    { matra: 10, bol: 'Ta', technique: '' },
                    { matra: 11, bol: 'Te', technique: '' },
                    { matra: 12, bol: 'Te', technique: '' },
                    { matra: 13, bol: 'Dha', technique: '' },
                    { matra: 14, bol: 'Dha', technique: '' },
                    { matra: 15, bol: 'Dhi', technique: '' },
                    { matra: 16, bol: 'Na', technique: '' }
                ]
            }
        ]
    },

    kayda2: {
        name: 'Kayda 2',
        taal: 'Teental',
        beats: 16,
        description: 'Teental con Tirekite - 16 Tiempos',
        description_en: 'Teental with Tirekite - 16 Beats',
        rows: [
            {
                label: 'Parte 1 (Matras 1-8)',
                label_en: 'Part 1 (Beats 1-8)',
                matras: [
                    { matra: 1, bol: 'Dha', technique: '' },
                    { matra: 2, bol: 'Tirekite', technique: '' },
                    { matra: 3, bol: 'Take', technique: '' },
                    { matra: 4, bol: 'Ti', technique: '' },
                    { matra: 5, bol: 'Na', technique: '' },
                    { matra: 6, bol: 'Kite', technique: '' },
                    { matra: 7, bol: 'Take', technique: '' },
                    { matra: 8, bol: '—', technique: '' }
                ]
            },
            {
                label: 'Parte 2 (Matras 9-16)',
                label_en: 'Part 2 (Beats 9-16)',
                matras: [
                    { matra: 9, bol: 'Ta', technique: '' },
                    { matra: 10, bol: 'Tirekite', technique: '' },
                    { matra: 11, bol: 'Take', technique: '' },
                    { matra: 12, bol: 'Ti', technique: '' },
                    { matra: 13, bol: 'Na', technique: '' },
                    { matra: 14, bol: 'Kite', technique: '' },
                    { matra: 15, bol: 'Take', technique: '' },
                    { matra: 16, bol: 'Ghe', technique: '' }
                ]
            }
        ]
    },

    kayda3: {
        name: 'Kayda 3',
        taal: 'Teental',
        beats: 16,
        description: 'Teental con Tire Kite - 16 Tiempos',
        description_en: 'Teental with Tire Kite - 16 Beats',
        tutorial: 'https://www.youtube.com/watch?v=6KQpma0Fiw8',
        rows: [
            {
                label: 'Parte 1 (Matras 1-8)',
                label_en: 'Part 1 (Beats 1-8)',
                matras: [
                    { matra: 1, bol: 'Dha', technique: '' },
                    { matra: 2, bol: 'Dha', technique: '' },
                    { matra: 3, bol: 'Tire', technique: '' },
                    { matra: 4, bol: 'Kite', technique: '' },
                    { matra: 5, bol: 'Dha', technique: '' },
                    { matra: 6, bol: 'Dha', technique: '' },
                    { matra: 7, bol: 'Ti (Thapki)', technique: '' },
                    { matra: 8, bol: 'Na', technique: '' }
                ]
            },
            {
                label: 'Parte 2 (Matras 9-16)',
                label_en: 'Part 2 (Beats 9-16)',
                matras: [
                    { matra: 9, bol: 'Ta', technique: '' },
                    { matra: 10, bol: 'Ta', technique: '' },
                    { matra: 11, bol: 'Tire', technique: '' },
                    { matra: 12, bol: 'Kite', technique: '' },
                    { matra: 13, bol: 'Dha', technique: '' },
                    { matra: 14, bol: 'Dha', technique: '' },
                    { matra: 15, bol: 'Dhi', technique: '' },
                    { matra: 16, bol: 'Na', technique: '' }
                ]
            }
        ]
    },

    kayda4: {
        name: 'Kayda 4 (Tirekite)',
        taal: 'Keherwa',
        beats: 8,
        description: 'Keherwa con Tirekite - 8 Tiempos',
        description_en: 'Keherwa with Tirekite - 8 Beats',
        rows: [
            {
                label: 'Bhari (Matras 1-8)',
                label_en: 'Bhari (Beats 1-8)',
                matras: [
                    { matra: 1, bol: 'Dha',  technique: '' },
                    { matra: 2, bol: 'Ti',   technique: '' },
                    { matra: 3, bol: 'Re',   technique: '' },
                    { matra: 4, bol: 'Ki',   technique: '' },
                    { matra: 5, bol: 'Te',   technique: '' },
                    { matra: 6, bol: 'Ta',   technique: '' },
                    { matra: 7, bol: 'Ke',   technique: '' },
                    { matra: 8, bol: 'Ta',   technique: '' }
                ]
            },
            {
                label: 'Khali (Matras 1-8)',
                label_en: 'Khali (Beats 1-8)',
                matras: [
                    { matra: 1, bol: 'Ta',   technique: '' },
                    { matra: 2, bol: 'Ti',   technique: '' },
                    { matra: 3, bol: 'Re',   technique: '' },
                    { matra: 4, bol: 'Ki',   technique: '' },
                    { matra: 5, bol: 'Te',   technique: '' },
                    { matra: 6, bol: 'Ta',   technique: '' },
                    { matra: 7, bol: 'Ke',   technique: '' },
                    { matra: 8, bol: 'Dha',   technique: '' }
                ]
            }
        ]
    },

    kayda5: {
        name: 'Kayda 5 (Tirekite avanzado)',
        taal: 'Teental',
        beats: 16,
        description: 'Teental con Tirekite avanzado - 16 Tiempos',
        description_en: 'Teental with advanced Tirekite - 16 Beats',
        rows: [
            {
                label: 'Bhari (Matras 1-8)',
                label_en: 'Bhari (Beats 1-8)',
                matras: [
                    { matra: 1, bol: 'Dha',         technique: '' },
                    { matra: 2, bol: 'TireKite',    technique: '' },
                    { matra: 3, bol: 'TakTak',      technique: '' },
                    { matra: 4, bol: 'TireKiteTak', technique: '' },
                    { matra: 5, bol: 'Dha',         technique: '' },
                    { matra: 6, bol: 'TireKiteTak', technique: '' },
                    { matra: 7, bol: 'TiNa',        technique: '' },
                    { matra: 8, bol: 'KiteTak',     technique: '' }
                ]
            },
            {
                label: 'Khali (Matras 9-16)',
                label_en: 'Khali (Beats 9-16)',
                matras: [
                    { matra: 9,  bol: 'Ta',         technique: '' },
                    { matra: 10, bol: 'TireKite',   technique: '' },
                    { matra: 11, bol: 'TakTak',     technique: '' },
                    { matra: 12, bol: 'TireKiteTak',   technique: '' },
                    { matra: 13, bol: 'Dha',        technique: '' },
                    { matra: 14, bol: 'TireKiteTak',technique: '' },
                    { matra: 15, bol: 'DhiNa',      technique: '' },
                    { matra: 16, bol: 'KiteTak',    technique: '' }
                ]
            }
        ]
    },

    kayda6: {
        name: 'Kayda 6 (Paltas y Pickups)',
        taal: 'Teental',
        beats: 16,
        description: 'Teental — ideal para construir paltas y tihai',
        description_en: 'Teental — ideal for building paltas and tihai',
        rows: [
            {
                label: 'Bhari (Matras 1-8)',
                label_en: 'Bhari (Beats 1-8)',
                matras: [
                    { matra: 1,  bol: 'Dha',   technique: '' },
                    { matra: 2,  bol: 'Ti',    technique: '' },
                    { matra: 3,  bol: 'Dha',   technique: '' },
                    { matra: 4,  bol: 'Ge',    technique: '' },
                    { matra: 5,  bol: 'Ti',    technique: '' },
                    { matra: 6,  bol: 'Na',    technique: '' },
                    { matra: 7,  bol: 'Ki',    technique: '' },
                    { matra: 8,  bol: 'Na',    technique: '' }
                ]
            },
            {
                label: 'Khali (Matras 9-16)',
                label_en: 'Khali (Beats 9-16)',
                matras: [
                    { matra: 9,  bol: 'Ta',    technique: '' },
                    { matra: 10, bol: 'Ti',    technique: '' },
                    { matra: 11, bol: 'Dha',    technique: '' },
                    { matra: 12, bol: 'Ge',    technique: '' },
                    { matra: 13, bol: 'Dhi',   technique: '' },
                    { matra: 14, bol: 'Na',    technique: '' },
                    { matra: 15, bol: 'Ghi', technique: '' },
                    { matra: 16, bol: 'Na',  technique: '' }
                ]
            }
        ]
    },

    kayda7: {
        name: 'Kayda 7 (Velocidad y Agilidad)',
        taal: 'Teental',
        beats: 16,
        description: 'Teental — parejas de 2 notas por matra, ideal para pickups rápidos',
        description_en: 'Teental — pairs of 2 notes per beat, ideal for fast pickups',
        rows: [
            {
                label: 'Bhari (Matras 1-8)',
                label_en: 'Bhari (Beats 1-8)',
                matras: [
                    { matra: 1,  bol: 'GeNa',  technique: '' },
                    { matra: 2,  bol: 'DhaGe', technique: '' },
                    { matra: 3,  bol: 'TiNa',  technique: '' },
                    { matra: 4,  bol: 'KiNa',  technique: '' },
                    { matra: 5,  bol: 'GeNa',  technique: '' },
                    { matra: 6,  bol: 'DhaGe', technique: '' },
                    { matra: 7,  bol: 'DhiNa', technique: '' },
                    { matra: 8,  bol: 'GiNa',  technique: '' }
                ]
            },
            {
                label: 'Khali (Matras 9-16)',
                label_en: 'Khali (Beats 9-16)',
                matras: [
                    { matra: 9,  bol: 'KeNa',  technique: '' },
                    { matra: 10, bol: 'TaKe',  technique: '' },
                    { matra: 11, bol: 'TiNa',  technique: '' },
                    { matra: 12, bol: 'KiNa',  technique: '' },
                    { matra: 13, bol: 'GeNa',  technique: '' },
                    { matra: 14, bol: 'DhaGe', technique: '' },
                    { matra: 15, bol: 'DhiNa', technique: '' },
                    { matra: 16, bol: 'GiNa',  technique: '' }
                ]
            }
        ]
    },

    kayda8: {
        name: 'Kayda 8 de DhaTira KitaTaka TiraKita',
        taal: 'Teental',
        beats: 16,
        description: 'Teental — patrón de 3 sílabas por matra para velocidad y fluidez',
        description_en: 'Teental — 3-syllable pattern per beat for speed and fluency',
        tutorial: 'https://www.youtube.com/watch?v=hopp5I7Tjj0&t',
        rows: [
            {
                label: 'Bhari (Matras 1-8)',
                label_en: 'Bhari (Beats 1-8)',
                matras: [
                    { matra: 1,  bol: 'DhaTira',  technique: '' },
                    { matra: 2,  bol: 'KitaTaka', technique: '' },
                    { matra: 3,  bol: 'TiraKita', technique: '' },
                    { matra: 4,  bol: 'DhaTira',  technique: '' },
                    { matra: 5,  bol: 'KitaTaka', technique: '' },
                    { matra: 6,  bol: 'TiraKita', technique: '' },
                    { matra: 7,  bol: 'TaaTira',  technique: '' },
                    { matra: 8,  bol: 'KitaTaka', technique: '' }
                ]
            },
            {
                label: 'Khali (Matras 9-16)',
                label_en: 'Khali (Beats 9-16)',
                matras: [
                    { matra: 9,  bol: 'TaaTira',  technique: '' },
                    { matra: 10, bol: 'KitaTaka', technique: '' },
                    { matra: 11, bol: 'TiraKita', technique: '' },
                    { matra: 12, bol: 'TaaTira',  technique: '' },
                    { matra: 13, bol: 'KitaTaka', technique: '' },
                    { matra: 14, bol: 'TiraKita', technique: '' },
                    { matra: 15, bol: 'DhaTira',  technique: '' },
                    { matra: 16, bol: 'KitaTaka', technique: '' }
                ]
            }
        ]
    }
};

// Made with Bob
