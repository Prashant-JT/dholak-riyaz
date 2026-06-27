/**
 * DEEPCHANDI TAAL
 * 14 beats — estructura 3+4+3+4
 * Actualiza este archivo con nuevas variaciones de Deepchandi
 */

import type { Taal } from '../../types';

export const deepchandi: Taal = {
    name: 'Deepchandi Taal',
    beats: 14,
    description: 'Métrica compleja',
    subtitle: 'Estructura 3+4+3+4 beats',
    rows: [
        [
            { matra: 1, bol: 'Dha', technique: 'Taali' },
            { matra: 2, bol: 'Dhin', technique: '' },
            { matra: 3, bol: '—', technique: '' },
            { matra: 4, bol: 'Dha', technique: 'Taali' },
            { matra: 5, bol: 'Dha', technique: '' },
            { matra: 6, bol: 'Tin', technique: '' },
            { matra: 7, bol: '—', technique: '' }
        ],
        [
            { matra: 8, bol: 'Ta', technique: 'Khali' },
            { matra: 9, bol: 'Tin', technique: '' },
            { matra: 10, bol: '—', technique: '' },
            { matra: 11, bol: 'Dha', technique: 'Taali' },
            { matra: 12, bol: 'Dha', technique: '' },
            { matra: 13, bol: 'Dhin', technique: '' },
            { matra: 14, bol: '—', technique: '' }
        ]
    ],
    songs: [
        { title: 'Phero Na Nazar Se Najariya', url: 'https://www.youtube.com/watch?v=1_WaSnOnu1Q' },
        { title: 'Aaj Jaane Ki Zid Na Karo', url: 'https://www.youtube.com/watch?v=CfUDuYAasjE' },
        { title: 'Pakhiyun Akhero Chadiyo', url: 'https://www.youtube.com/watch?v=UoWMQimowm8' },
        { title: 'Aji Rooth Kar Ab Kahan Jaiyega', url: 'https://www.youtube.com/watch?v=tbVKu36_4ZU' }
    ],
    notes: [
        'El significado de _',
        '',
        'Concepto: En la notación musical de los Taals, el guion bajo representa una Matra vacía, un silencio.',
        '¿Qué significa al tocar?: Significa que durante ese tiempo exacto del metrónomo no se ejecuta ningún golpe físico nuevo en el dholak.'
    ],
    tip: {
        title: 'Estructura Compleja',
        text: 'Deepchandi es un taal de 14 beats con estructura asimétrica 3+4+3+4. Los silencios (—) son parte integral del ritmo y deben sentirse internamente. Practica primero cada sección por separado antes de unirlas.',
        color: 'indigo'
    },
    variations: [
        {
            name: 'Deepchandi variación 1 (Ta Tin Ta Tin)',
            rows: [
                [
                    { matra: 1, bol: 'Dha', technique: 'Taali' },
                    { matra: 2, bol: 'Dhin', technique: '' },
                    { matra: 3, bol: '—', technique: '' },
                    { matra: 4, bol: 'Dha', technique: 'Taali' },
                    { matra: 5, bol: 'Dha', technique: '' },
                    { matra: 6, bol: 'Tin', technique: '' },
                    { matra: 7, bol: '—', technique: '' }
                ],
                [
                    { matra: 8, bol: 'Ta', technique: 'Khali' },
                    { matra: 9, bol: '—', technique: '' },
                    { matra: 10, bol: '—', technique: '' },
                    { matra: 11, bol: 'Ta', technique: 'Taali' },
                    { matra: 12, bol: 'Tin', technique: '' },
                    { matra: 13, bol: 'Ta', technique: '' },
                    { matra: 14, bol: 'Tin', technique: '' }
                ]
            ],
            description: '3+4+3+4 — variación con Ta Tin Ta Tin al cierre',
            songs: [
                { title: 'Tera Chehra Jab Nazar Aaye', url: 'https://youtu.be/zNUs54J3mKo?si=gJeNGyxSXGYt_ymX' }
            ]
        },
        {
            name: 'Deepchandi variación 2 (Na Na Te Te)',
            rows: [
                [
                    { matra: 1, bol: 'Dha', technique: 'Taali' },
                    { matra: 2, bol: 'Dhin', technique: '' },
                    { matra: 3, bol: '—', technique: '' },
                    { matra: 4, bol: 'Dha', technique: 'Taali' },
                    { matra: 5, bol: 'Dha', technique: '' },
                    { matra: 6, bol: 'Tin', technique: '' },
                    { matra: 7, bol: '—', technique: '' }
                ],
                [
                    { matra: 8, bol: 'Ta', technique: 'Khali' },
                    { matra: 9, bol: '—', technique: '' },
                    { matra: 10, bol: '—', technique: '' },
                    { matra: 11, bol: 'Na', technique: 'Taali' },
                    { matra: 12, bol: 'Na', technique: '' },
                    { matra: 13, bol: 'Te', technique: '' },
                    { matra: 14, bol: 'Te', technique: '' }
                ]
            ],
            description: '3+4+3+4 — variación con Na Na Te Te al cierre'
        },
        {
            name: 'Deepchandi variación 3 (simple)',
            rows: [
                [
                    { matra: 1,  bol: 'Dha', technique: 'Taali' },
                    { matra: 2,  bol: 'Dhin', technique: '' },
                    { matra: 3,  bol: '—',   technique: '' },
                    { matra: 4,  bol: 'Dha', technique: 'Taali' },
                    { matra: 5,  bol: 'Dha', technique: '' },
                    { matra: 6,  bol: 'Ti',  technique: '' },
                    { matra: 7,  bol: '—',   technique: '' }
                ],
                [
                    { matra: 8,  bol: 'Ta',  technique: 'Khali' },
                    { matra: 9,  bol: 'Tin', technique: '' },
                    { matra: 10, bol: '—',   technique: '' },
                    { matra: 11, bol: 'Dha', technique: 'Taali' },
                    { matra: 12, bol: 'Dha', technique: '' },
                    { matra: 13, bol: '—',   technique: '' },
                    { matra: 14, bol: '—',   technique: '' }
                ]
            ],
            description: '3+4+3+4 — Dha Dhin — Dha Dha Ti — / Ta Tin — Dha Dha — —'
        }
    ]
};

// Made with Bob
