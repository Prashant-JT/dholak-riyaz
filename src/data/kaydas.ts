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
        rows: [
            {
                label: 'Bhari (Matras 1-8)',
                matras: [
                    { matra: 1, bol: 'Dha', technique: 'Taali' },
                    { matra: 2, bol: 'Dha', technique: '' },
                    { matra: 3, bol: 'Te', technique: '' },
                    { matra: 4, bol: 'Te', technique: '' },
                    { matra: 5, bol: 'Dha', technique: 'Taali' },
                    { matra: 6, bol: 'Dha', technique: '' },
                    { matra: 7, bol: 'Thi', technique: '' },
                    { matra: 8, bol: 'Na', technique: '' }
                ]
            },
            {
                label: 'Khali (Matras 9-16)',
                matras: [
                    { matra: 9, bol: 'Taa', technique: 'Khali' },
                    { matra: 10, bol: 'Taa', technique: '' },
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
        rows: [
            {
                label: 'Parte 1 (Matras 1-8)',
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
        rows: [
            {
                label: 'Parte 1 (Matras 1-8)',
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
        tutorial: 'https://www.youtube.com/watch?v=6KQpma0Fiw8',
        rows: [
            {
                label: 'Parte 1 (Matras 1-8)',
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
    }
};

// Made with Bob
