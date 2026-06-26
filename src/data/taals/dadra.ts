/**
 * DADRA TAAL
 * 6 beats — estructura 3+3
 * Actualiza este archivo con nuevas variaciones de Dadra
 */

import type { Taal } from '../../types';

export const dadra: Taal = {
    name: 'Dadra Taal',
    beats: 6,
    description: 'Estilo Balanceo',
    subtitle: 'Métrica ligera y fluida (3+3 beats)',
    rows: [
        [
            { matra: 1, bol: 'Dha', technique: 'Taali' },
            { matra: 2, bol: 'Dhi', technique: '' },
            { matra: 3, bol: 'Na', technique: '' },
            { matra: 4, bol: 'Dha', technique: 'Khali' },
            { matra: 5, bol: 'Tin', technique: '' },
            { matra: 6, bol: 'Na', technique: '' }
        ]
    ],
    tutorial: 'https://youtu.be/GEhUA857iW0',
    variations: [
        {
            name: 'Dadra variación 1',
            rows: [
                [
                    { matra: 1, bol: 'Dha', technique: 'Bhari' },
                    { matra: 2, bol: 'DhiDhi', technique: '' },
                    { matra: 3, bol: 'NaNa', technique: '' },
                    { matra: 4, bol: 'Dha', technique: 'Khali' },
                    { matra: 5, bol: 'Tin', technique: '' },
                    { matra: 6, bol: 'NaNa', technique: '' }
                ]
            ],
            description: '3 beats + 3 beats',
            songs: [
                { title: 'Ye Daulat Bhi Lelo Ye Shohrat Bhi Lelo', url: 'https://www.youtube.com/watch?v=L7jFS5jYAjI' }
            ]
        },
        {
            name: 'Dadra variación 2',
            rows: [
                [
                    { matra: 1, bol: 'Dha', technique: 'Bhari' },
                    { matra: 2, bol: 'Dha', technique: '' },
                    { matra: 3, bol: 'Tin', technique: '' },
                    { matra: 4, bol: 'Na', technique: 'Khali' },
                    { matra: 5, bol: 'Dha', technique: '' },
                    { matra: 6, bol: 'Dhi', technique: '' }
                ]
            ],
            description: '3 beats + 3 beats',
            songs: [
                { title: 'Lab Par Aaye', url: 'https://www.youtube.com/watch?v=7kR6tqaq_zY' }
            ]
        },
        {
            name: 'Dadra variación principal',
            rows: [
                [
                    { matra: 1, bol: 'Dhi', technique: 'Bhari' },
                    { matra: 2, bol: 'Dhi', technique: '' },
                    { matra: 3, bol: 'Na', technique: '' },
                    { matra: 4, bol: 'Ghe', technique: 'Khali' },
                    { matra: 5, bol: 'Dhi', technique: '' },
                    { matra: 6, bol: 'Na', technique: '' }
                ]
            ],
            description: '3 beats + 3 beats',
            songs: [
                { title: 'Dagabaaz Re', url: 'https://www.youtube.com/watch?v=0KozfDYK1EU' }
            ],
            notes: [
                'Bhajan Sambhariyaan Sada Dil Me Tokhe',
                'https://youtu.be/72-POeN9XwQ'
            ]
        },
        {
            name: 'Dadra Western variación',
            rows: [
                [
                    { matra: 1, bol: 'DhaTi', technique: 'Bhari' },
                    { matra: 2, bol: 'DhaTi', technique: '' },
                    { matra: 3, bol: 'DhaTi', technique: '' },
                    { matra: 4, bol: 'Dha', technique: 'Khali' },
                    { matra: 5, bol: 'NaNa', technique: '' },
                    { matra: 6, bol: 'Na', technique: '' }
                ]
            ],
            description: '3 beats + 3 beats',
            songs: [
                { title: 'Itni shakti hai dai / Aisi kirpa guru', url: 'https://youtu.be/m1Ft4JdqrBE?si=jazhC1TLeakR8xim' }
            ]
        },
        {
            name: 'Dadra variación mediano/rápido 1',
            rows: [
                [
                    { matra: 1, bol: 'Dha', technique: 'Bhari' },
                    { matra: 2, bol: 'Dha', technique: '' },
                    { matra: 3, bol: 'Tin', technique: '' },
                    { matra: 4, bol: 'Na', technique: 'Khali' },
                    { matra: 5, bol: 'Dha', technique: '' },
                    { matra: 6, bol: 'Dhi', technique: '' }
                ]
            ],
            description: '3 beats + 3 beats',
            songs: [
                { title: 'Thumaka Chalata Ramachandra', url: 'https://www.youtube.com/watch?v=lGaQSumuSpA' },
                { title: 'Ye Daulat Bhi Lelo Ye Shohrat Bhi Lelo', url: 'https://www.youtube.com/watch?v=L7iFS5iYAiI' },
                { title: 'Lab Par Aaye', url: 'https://www.youtube.com/watch?v=7kR6tqag_zY' }
            ]
        },
        {
            name: 'Dadra variación (famous theka)',
            rows: [
                [
                    { matra: 1, bol: 'Dhi (ghisa)', technique: 'Bhari' },
                    { matra: 2, bol: 'Dhi', technique: '' },
                    { matra: 3, bol: 'Na', technique: '' },
                    { matra: 4, bol: 'Ti', technique: 'Khali' },
                    { matra: 5, bol: 'Dhi', technique: '' },
                    { matra: 6, bol: 'Na', technique: '' }
                ]
            ],
            description: '3 beats + 3 beats',
            songs: [
                { title: 'Aaye Ho Meri Zindagi Mein', url: 'https://www.youtube.com/watch?v=ixCnsZswdpU' }
            ],
            tutorials: [
                'https://www.youtube.com/watch?v=zkRwdMDUgs8'
            ],
        },
        {
            name: 'Dandiya',
            rows: [
                [
                    { matra: 1, bol: 'Dhin', technique: 'Bhari' },
                    { matra: 2, bol: 'Na', technique: '' },
                    { matra: 3, bol: 'DhiNa', technique: '' },
                    { matra: 4, bol: 'TeTe', technique: 'Khali' },
                    { matra: 5, bol: 'Na', technique: '' },
                    { matra: 6, bol: 'DhiNa', technique: '' }
                ]
            ],
            description: '3 beats + 3 beats',
            songs: [
                { title: 'Hey Naam Re Sabse Bada Tera Naam (después del min 0:50)', url: 'https://www.youtube.com/watch?v=UaFTHjUnOao' }
            ],
            notes: [
                '¿Qué es una Tihai?',
                'Es un recurso rítmico que consiste en repetir una frase exacta tres veces (x3) con el objetivo de romper la inercia del ritmo y "aterrizar" con máxima precisión y energía justo en el Sam (Tiempo 1) del siguiente ciclo.',
                '',
                'Inicio (6 tiempos): Patrón completo Dhin Na DhiNa | TeTe Na DhiNa',
                'La Frase (3 tiempos): Dhi Dhi Na (x3)',
                'La Resolución (6 tiempos): Patrón completo Dhi Dhi Na | Ge Dhi Na'
            ]
        },
        {
            name: 'Tirekite Take',
            special: true,
            rows: [
                [
                    { matra: 1, bol: 'Ti', technique: '' },
                    { matra: 2, bol: 'Re', technique: '' },
                    { matra: 3, bol: 'Ki', technique: '' },
                    { matra: 4, bol: 'Te', technique: '' },
                    { matra: 5, bol: 'Ta', technique: '' },
                    { matra: 6, bol: 'Ke', technique: '' }
                ]
            ],
            description: 'Frase rítmica para velocidad',
            notes: [
                '¿Qué es el Tirekite (तिरेकिट)?',
                'Es la frase rítmica (bol) más importante para desarrollar velocidad y ornamentación.',
                'Se compone de 4 sílabas de ejecución ultra rápida que combinan ambas manos de forma intercalada:',
                '',
                '- Ti - Re: Dedos de la mano izquierda (agudo) en el centro.',
                '- Ki: Golpe sordo de la mano derecha (grave).',
                '- Te: Cierre en el centro del agudo.',
                '',
                '¿Por qué es tan importante en el aprendizaje?',
                '• Desarrolla la independencia de dedos: Te obliga a separar el movimiento del dedo índice del bloque que forman el dedo medio y anular. Es el ejercicio definitivo para desbloquear la agilidad.',
                '• Es la base de los "Fillers" (Mukhdas): Los fillers son los pequeños cortes o redobles que usas para rellenar los huecos musicales. El 90% de los fillers avanzados en la música india utilizan el Tirekite como motor de velocidad.',
                '• Conexión Musical (Pickups): Sirve como puente dinámico. Te permite avisar al oyente (y a los cantantes) de que la canción va a cambiar de sección, por ejemplo, al pasar de una estrofa suave a un estribillo con mucha energía (Dandiya style).'
            ]
        },
        {
            name: 'Take Tirekite',
            special: true,
            rows: [
                [
                    { matra: 1, bol: 'Ta', technique: '' },
                    { matra: 2, bol: 'Ke', technique: '' },
                    { matra: 3, bol: 'Ti', technique: '' },
                    { matra: 4, bol: 'Re', technique: '' },
                    { matra: 5, bol: 'Ki', technique: '' },
                    { matra: 6, bol: 'Te', technique: '' }
                ]
            ],
            description: 'Variación invertida',
        },
        {
            name: 'Dadra taal variación 3',
            rows: [
                [
                    { matra: 1, bol: 'Ghe', technique: 'Bhari' },
                    { matra: 2, bol: 'Na', technique: '' },
                    { matra: 3, bol: 'Na', technique: '' },
                    { matra: 4, bol: 'Ke', technique: 'Khali' },
                    { matra: 5, bol: 'Na', technique: '' },
                    { matra: 6, bol: 'Na', technique: '' }
                ]
            ],
            description: '3 beats + 3 beats',
            songs: [
                { title: 'Aaj Humare Dil mein', url: 'https://youtu.be/ABqsJBSBNBw?si=rwJaRwI78MFxwoT6' }
            ],
            notes: [
                'HAY UNA VARIACIÓN PARA UNA PARTE DE ESTA CANCIÓN',
                '',
                'Dha Ghe Ta Tin',
                'Pick up: NA NA TE TE',
                '        NA NA TE TE'
            ]
        },
        {
            name: 'Dadra taal variación thapki',
            rows: [
                [
                    { matra: 1, bol: 'Dha', technique: 'Bhari' },
                    { matra: 2, bol: 'Ti (thapki)', technique: '' },
                    { matra: 3, bol: 'Te', technique: '' },
                    { matra: 4, bol: 'Na', technique: 'Khali' },
                    { matra: 5, bol: 'Dhit (thapki)', technique: '' },
                    { matra: 6, bol: 'Te', technique: '' }
                ]
            ],
            description: '3 beats + 3 beats',
            tutorials: [
                'https://www.youtube.com/watch?v=XORXG9TaCtg',
            ],
        },
        {
            name: 'Dadra taal thapki pattern',
            rows: [
                [
                    { matra: 1, bol: 'Dhit (thapki) (ghisa)', technique: 'Bhari' },
                    { matra: 2, bol: 'Dha', technique: '' },
                    { matra: 3, bol: 'Ta', technique: '' },
                    { matra: 4, bol: 'Tit (thapki)', technique: 'Khali' },
                    { matra: 5, bol: 'Dha (ghisa)', technique: '' },
                    { matra: 6, bol: 'Ta', technique: '' }
                ]
            ],
            description: '3 beats + 3 beats',
            tutorials: [
                'https://www.youtube.com/shorts/iMXwZyeRrxQ'
            ],
        },
        {
            name: 'Dadra taal ulti thapki pattern',
            rows: [
                [
                    { matra: 1, bol: 'Dha (ghisa)', technique: 'Bhari' },
                    { matra: 2, bol: 'Tit (thapki)', technique: '' },
                    { matra: 3, bol: 'Ta', technique: '' },
                    { matra: 4, bol: 'Ta', technique: 'Khali' },
                    { matra: 5, bol: 'Dhit (thapki) (ghisa)', technique: '' },
                    { matra: 6, bol: 'Ta', technique: '' }
                ]
            ],
            description: '3 beats + 3 beats (variación)',
            tutorials: [
                'https://www.youtube.com/shorts/vNBI3bv9m20'
            ],
        }
    ],
    tip: {
        title: 'Contexto Musical',
        text: 'Dadra es característico de Thumri y música semi-clásica. Su estructura de 6 tiempos crea un balanceo natural perfecto para acompañar melodías expresivas y ornamentadas. Configura el metrónomo en 3/4 o en un ciclo de 6 pulsos, donde cada "clic" representa 1 Matra. Velocidad sugerida: Empieza a 60 BPM (un golpe por segundo) para asegurar la limpieza de los bols.',
        color: 'purple'
    }
};

// Made with Bob
