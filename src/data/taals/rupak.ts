/**
 * RUPAK TAAL
 * 7 beats — estructura 3+2+2
 * Actualiza este archivo con nuevas variaciones de Rupak
 */

import type { Taal } from '../../types';

export const rupak: Taal = {
    name: 'Rupak Taal',
    beats: 7,
    description: 'Métrica asimétrica',
    subtitle: 'Estructura 3+2+2',
    rows: [
        [
            { matra: 1, bol: 'Ti', technique: 'Khali' },
            { matra: 2, bol: 'Ti', technique: '' },
            { matra: 3, bol: 'Na', technique: '' },
            { matra: 4, bol: 'Dhi', technique: 'Taali' },
            { matra: 5, bol: 'Na', technique: '' },
            { matra: 6, bol: 'Dhi', technique: 'Taali' },
            { matra: 7, bol: 'Na', technique: '' }
        ]
    ],
    tip: {
        title: 'Desafío Técnico',
        text: 'Rupak es uno de los taals más desafiantes debido a su estructura asimétrica 3+2+2. La división irregular requiere un fuerte sentido interno del pulso. Comienza muy lento (60 BPM) y enfócate en sentir los tres grupos distintos antes de aumentar la velocidad.',
        color: 'amber'
    }
};

// Made with Bob
