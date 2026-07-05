/**
 * EKTAL TAAL
 * 12 beats — estructura 2+2+2+2+2+2 (6 vibhags iguales)
 * Muy usado en Khyal clásico lento (Vilambit) y en bhajans
 *
 * ESTADO: activo en navegación (src/core/config.ts > NAVIGATION)
 */

import type { Taal } from '../../types';

export const ektal: Taal = {
    name: 'Ektal',
    beats: 12,
    description: 'Seis vibhags iguales de 2 beats',
    subtitle: 'Estructura 2+2+2+2+2+2 beats',
    rows: [
        [
            { matra: 1,  bol: 'Dhin',     technique: 'Taali' },
            { matra: 2,  bol: 'Dhin',     technique: '' },
            { matra: 3,  bol: 'DhaGe',    technique: 'Taali' },
            { matra: 4,  bol: 'TireKite', technique: '' },
            { matra: 5,  bol: 'Tin',      technique: 'Khali' },
            { matra: 6,  bol: 'Na',       technique: '' }
        ],
        [
            { matra: 7,  bol: 'Ke',       technique: 'Taali' },
            { matra: 8,  bol: 'Ta',       technique: '' },
            { matra: 9,  bol: 'DhaGe',    technique: 'Taali' },
            { matra: 10, bol: 'TireKite', technique: '' },
            { matra: 11, bol: 'Dhi',      technique: 'Khali' },
            { matra: 12, bol: 'Na',       technique: '' }
        ]
    ],
    tip: {
        title: 'Seis Grupos de Dos',
        text: 'Ektal tiene 6 vibhags de 2 tiempos cada uno, lo que crea una sensación de flujo continuo muy diferente a Teental. En Vilambit (tempo lento) cada Matra se estira enormemente, dando espacio para ornamentación. Comienza a 40-50 BPM para sentir la amplitud de cada ciclo antes de añadir melodía.',
        color: 'indigo'
    }
};

// Made with Bob
