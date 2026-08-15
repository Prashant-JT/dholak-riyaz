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
    description_en: 'Asymmetric metre',
    subtitle: 'Estructura 3+2+2',
    subtitle_en: '3+2+2 structure',
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
        title_en: 'Technical Challenge',
        text: 'Rupak es uno de los taals más desafiantes debido a su estructura asimétrica 3+2+2. La división irregular requiere un fuerte sentido interno del pulso. Comienza muy lento (60 BPM) y enfócate en sentir los tres grupos distintos antes de aumentar la velocidad.',
        text_en: 'Rupak is one of the most challenging taals due to its asymmetric 3+2+2 structure. The irregular division requires a strong internal sense of pulse. Start very slow (60 BPM) and focus on feeling the three distinct groups before increasing tempo.',
        color: 'amber'
    },
    variations: [
        {
            name: 'Rupak variación 1 (TiNa TeTe)',
            name_en: 'Rupak variation 1 (TiNa TeTe)',
            rows: [
                [
                    { matra: 1, bol: 'Ti', technique: 'Khali' },
                    { matra: 2, bol: 'TiNa', technique: '' },
                    { matra: 3, bol: 'TeTe', technique: '' },
                    { matra: 4, bol: 'DhiDhi', technique: 'Taali' },
                    { matra: 5, bol: 'NaNa', technique: '' },
                    { matra: 6, bol: 'DhiDhi', technique: 'Taali' },
                    { matra: 7, bol: 'NaNa', technique: '' }
                ]
            ],
            description: '3 beats + 2 beats + 2 beats',
            songs: [
                { title: 'Shri Ramchandra Kripalu Bhajamana', url: 'https://www.youtube.com/watch?v=FqmMkDdpLdo' },
                { title: 'Sharanagatam / Kisi rah par kisi mor par', url: 'https://youtu.be/i88txA3Qpc8?si=kTHNn1ErPuyIHeEs' }

            ]
        }, 
        {
            name: 'Rupak variación 2 (famous with Deepchandi)',
            name_en: 'Rupak variation 2 (famous with Deepchandi)',
            rows: [
                [
                    { matra: 1, bol: 'Dha', technique: 'Khali' },
                    { matra: 2, bol: 'Dhin', technique: '' },
                    { matra: 3, bol: 'N', technique: '' },
                    { matra: 4, bol: 'Na', technique: 'Taali' },
                    { matra: 5, bol: 'Ti', technique: '' },
                    { matra: 6, bol: 'Dhin', technique: 'Taali' },
                    { matra: 7, bol: 'N', technique: '' }
                ]
            ],
            description: '3 beats + 2 beats + 2 beats',
            songs: [
                { title: 'Tu Hai Toh', url: 'https://www.youtube.com/watch?v=TVbI55pDdaI' }

            ]
        }
    ]
};

// Made with Bob
