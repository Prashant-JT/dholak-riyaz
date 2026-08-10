/**
 * TEENTAL TAAL
 * 16 beats — estructura 4+4+4+4
 * El taal más importante de la música clásica del norte de India (Hindustani)
 *
 * ESTADO: activo en navegación (src/core/config.ts > NAVIGATION)
 */

import type { Taal } from '../../types';

export const teental: Taal = {
    name: 'Teental',
    beats: 16,
    description: 'El taal más popular del Hindustani clásico',
    description_en: 'The most popular taal of classical Hindustani music',
    subtitle: 'Estructura 4+4+4+4 beats',
    subtitle_en: '4+4+4+4 beat structure',
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
    songs: [
        { title: 'Madhuban Mein Radhika Nache Re', url: 'https://www.youtube.com/watch?v=FtObMbpIJLQ' }
    ],
    tip: {
        title: 'El Taal Rey',
        title_en: 'The King Taal',
        text: 'Teental (también llamado Trital) es el ciclo de 16 tiempos más usado en la música clásica Hindustani. Su estructura simétrica 4+4+4+4 lo hace accesible como punto de entrada al aprendizaje clásico. El Sam (M1) y el Khali (M9) son los dos puntos de referencia fundamentales. Las kaydas del proyecto están en Teental.',
        text_en: 'Teental (also called Trital) is the most widely used 16-beat cycle in Hindustani classical music. Its symmetric 4+4+4+4 structure makes it accessible as an entry point to classical learning. The Sam (M1) and Khali (M9) are the two fundamental reference points. The kaydas in this project are in Teental.',
        color: 'blue'
    }
};

// Made with Bob
