/**
 * JHAPTAL TAAL
 * 10 beats — estructura 2+3+2+3
 * Taal asimétrico muy usado en composiciones clásicas lentas (Vilambit)
 *
 * ESTADO: preparado, pendiente de activar en src/core/config.ts > NAVIGATION
 */

import type { Taal } from '../../types';

export const jhaptal: Taal = {
    name: 'Jhaptal',
    beats: 10,
    description: 'Taal asimétrico clásico',
    subtitle: 'Estructura 2+3+2+3 beats',
    rows: [
        [
            { matra: 1,  bol: 'Dhi',  technique: 'Taali' },
            { matra: 2,  bol: 'Na',   technique: '' },
            { matra: 3,  bol: 'Dhi',  technique: 'Taali' },
            { matra: 4,  bol: 'Dhi',  technique: '' },
            { matra: 5,  bol: 'Na',   technique: '' },
            { matra: 6,  bol: 'Ti',   technique: 'Khali' },
            { matra: 7,  bol: 'Na',   technique: '' },
            { matra: 8,  bol: 'Dhi',  technique: 'Taali' },
            { matra: 9,  bol: 'Dhi',  technique: '' },
            { matra: 10, bol: 'Na',   technique: '' }
        ]
    ],
    tip: {
        title: 'Grupos Asimétricos 2+3+2+3',
        text: 'Jhaptal tiene 4 vibhags de tamaños desiguales: dos grupos de 2 y dos de 3. La clave está en marcar internamente cada inicio de grupo: Sam (M1), Taali (M3), Khali (M6) y Taali (M8). Practica contando en voz alta "1-2 | 1-2-3 | 1-2 | 1-2-3" antes de tocar los bols.',
        color: 'amber'
    }
};

// Made with Bob
