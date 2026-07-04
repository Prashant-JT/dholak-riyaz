/**
 * ADDHA TAAL
 * 16 beats — estructura 4+4+4+4
 * Taal popular en música folk, bhajan y semiclásica del norte de India.
 * Su theka es: Dha Dha Dhin Ta | Tet Dha Dhin Ta | Dha Tin Tin Ta | Tet Dha Dhin Ta
 */

import type { Taal } from '../../types';

export const addha: Taal = {
    name: 'Addha Taal',
    beats: 16,
    description: 'Taal folk semiclásico de 16 beats',
    subtitle: 'Estructura 4+4+4+4 beats',
    rows: [
        [
            { matra: 1,  bol: 'Dha',  technique: 'Taali' },
            { matra: 2,  bol: 'Dha',  technique: '' },
            { matra: 3,  bol: 'Dhin', technique: '' },
            { matra: 4,  bol: 'Ta',   technique: '' },
            { matra: 5,  bol: 'Tet',  technique: 'Taali' },
            { matra: 6,  bol: 'Dha',  technique: '' },
            { matra: 7,  bol: 'Dhin', technique: '' },
            { matra: 8,  bol: 'Ta',   technique: '' }
        ],
        [
            { matra: 9,  bol: 'Dha',  technique: 'Khali' },
            { matra: 10, bol: 'Tin',  technique: '' },
            { matra: 11, bol: 'Tin',  technique: '' },
            { matra: 12, bol: 'Ta',   technique: '' },
            { matra: 13, bol: 'Tet',  technique: 'Taali' },
            { matra: 14, bol: 'Dha',  technique: '' },
            { matra: 15, bol: 'Dhin', technique: '' },
            { matra: 16, bol: 'Ta',   technique: '' }
        ]
    ],
    tip: {
        title: 'Theka de Addha Taal',
        text: 'Addha es un taal de 16 beats muy popular en música folk, bhajan y thumri. A diferencia de Teental, su theka tiene un sabor más enérgico y se toca en cancione Semi - Classical. El Sam cae en M1 (Dha) y el Khali en M9 (Dha→sin resonancia). Practica las dos filas por separado antes de encadenarlas.',
        color: 'amber'
    }
};

// Made with Bob
