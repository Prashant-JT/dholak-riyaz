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
    }
};

// Made with Bob
