/**
 * TEENTAL TAAL
 * 16 beats — estructura 4+4+4+4
 * El taal más importante de la música clásica del norte de India (Hindustani)
 *
 * ESTADO: preparado pero NO mostrado en navegación todavía
 * Para activar: añadir { id: 'teental', label: 'Teental (16B)' } en src/core/config.ts > NAVIGATION
 */

import type { Taal } from '../../types';

export const teental: Taal = {
    name: 'Teental',
    beats: 16,
    description: 'El taal más popular del Hindustani clásico',
    subtitle: 'Estructura 4+4+4+4 beats',
    rows: [
        [
            { matra: 1,  bol: 'Dha',  technique: 'Taali' },
            { matra: 2,  bol: 'Dhin', technique: '' },
            { matra: 3,  bol: 'Dhin', technique: '' },
            { matra: 4,  bol: 'Dha',  technique: '' },
            { matra: 5,  bol: 'Dha',  technique: 'Taali' },
            { matra: 6,  bol: 'Dhin', technique: '' },
            { matra: 7,  bol: 'Dhin', technique: '' },
            { matra: 8,  bol: 'Dha',  technique: '' }
        ],
        [
            { matra: 9,  bol: 'Dha',  technique: 'Khali' },
            { matra: 10, bol: 'Tin',  technique: '' },
            { matra: 11, bol: 'Tin',  technique: '' },
            { matra: 12, bol: 'Ta',   technique: '' },
            { matra: 13, bol: 'Ta',   technique: 'Taali' },
            { matra: 14, bol: 'Dhin', technique: '' },
            { matra: 15, bol: 'Dhin', technique: '' },
            { matra: 16, bol: 'Dha',  technique: '' }
        ]
    ],
    tip: {
        title: 'El Taal Rey',
        text: 'Teental (también llamado Trital) es el ciclo de 16 tiempos más usado en la música clásica Hindustani. Su estructura simétrica 4+4+4+4 lo hace accesible como punto de entrada al aprendizaje clásico. El Sam (M1) y el Khali (M9) son los dos puntos de referencia fundamentales. Las kaydas del proyecto están en Teental.',
        color: 'blue'
    }
};

// Made with Bob
