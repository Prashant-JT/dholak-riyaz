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
    description_en: 'Swaying style',
    subtitle: 'Métrica ligera y fluida (3+3 beats)',
    subtitle_en: 'Light and fluid metre (3+3 beats)',
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
            name: 'Dadra variación 1 (DhiDhi NaNa)',
            name_en: 'Dadra variation 1 (DhiDhi NaNa)',
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
            name: 'Dadra variación 2 (Dha Tin Na)',
            name_en: 'Dadra variation 2 (Dha Tin Na)',
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
        },
        {
            name: 'Dadra variación principal',
            name_en: 'Dadra main variation',
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
            name_en: 'Dadra Western variation',
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
            name: 'Dadra variación mediano/rápido (Dha Tin Na)',
            name_en: 'Dadra medium/fast variation (Dha Tin Na)',
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
            ]
        },
        {
            name: 'Dadra variación (famous theka)',
            name_en: 'Dadra variation (famous theka)',
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
            ],
            notes_en: [
                'What is a Tihai?',
                'It is a rhythmic device consisting of repeating an exact phrase exactly three times (x3) with the aim of breaking the rhythmic inertia and "landing" with maximum precision and energy right on the Sam (Beat 1) of the next cycle.',
                '',
                'Opening (6 beats): Full pattern Dhin Na DhiNa | TeTe Na DhiNa',
                'The Phrase (3 beats): Dhi Dhi Na (x3)',
                'The Resolution (6 beats): Full pattern Dhi Dhi Na | Ge Dhi Na'
            ]
        },
        {
            name: 'Tirekite Take',
            name_en: 'Tirekite Take',
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
            description_en: 'Rhythmic phrase for speed',
            tutorials: ['https://www.youtube.com/watch?v=z1ilRtaKuVU&t=88s'],
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
            ],
            notes_en: [
                'What is Tirekite (तिरेकिट)?',
                'It is the most important rhythmic phrase (bol) for developing speed and ornamentation.',
                'It consists of 4 ultra-fast syllables combining both hands in an alternating pattern:',
                '',
                '- Ti - Re: Fingers of the left hand (treble) in the centre.',
                '- Ki: Muffled stroke of the right hand (bass).',
                '- Te: Closure in the centre of the treble.',
                '',
                'Why is it so important in learning?',
                '• Develops finger independence: Forces you to separate the movement of the index finger from the block formed by the middle and ring fingers. It is the definitive exercise to unlock agility.',
                '• It is the basis of "Fillers" (Mukhdas): Fillers are the small cuts or rolls used to fill musical gaps. 90% of advanced fillers in Indian music use Tirekite as their speed engine.',
                '• Musical connection (Pickups): Acts as a dynamic bridge. Allows you to signal to the listener (and singers) that the song is about to change section — for example, transitioning from a gentle verse to a high-energy chorus (Dandiya style).'
            ]
        },
        {
            name: 'Take Tirekite',
            name_en: 'Take Tirekite',
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
            description_en: 'Inverted variation',
        },
        {
            name: 'Dadra variación 3 (Ghe Na Na)',
            name_en: 'Dadra variation 3 (Ghe Na Na)',
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
                { title: 'Aaj Humare Dil Mein', url: 'https://youtu.be/ABqsJBSBNBw?si=rwJaRwI78MFxwoT6' }
            ],
            notes: [
                'Hay una variación para una parte de la canción',
                '',
                'Dha Ghe Ta Tin',
                'Pickup: Na Na Te Te (x2)'
            ],
            notes_en: [
                'There is a variation for part of the song',
                '',
                'Dha Ghe Ta Tin',
                'Pickup: Na Na Te Te (x2)'
            ]
        },
        {
            name: 'Dadra variación Thapki 1',
            name_en: 'Dadra Thapki variation 1',
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
            name: 'Dadra variación Thapki 2',
            name_en: 'Dadra Thapki variation 2',
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
            name: 'Dadra variación Ulti Thapki',
            name_en: 'Dadra Ulti Thapki variation',
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
            description_en: '3 beats + 3 beats (variation)',
            tutorials: [
                'https://www.youtube.com/shorts/vNBI3bv9m20'
            ],
        },
        {
            name: 'Dadra variación 4 (Dha Tin Tin)',
            name_en: 'Dadra variation 4 (Dha Tin Tin)',
            rows: [
                [
                    { matra: 1, bol: 'Dha', technique: 'Bhari' },
                    { matra: 2, bol: 'Tin', technique: '' },
                    { matra: 3, bol: 'Tin', technique: '' },
                    { matra: 4, bol: 'Ta',  technique: 'Khali' },
                    { matra: 5, bol: 'Dhin', technique: '' },
                    { matra: 6, bol: 'Dhin', technique: '' }
                ]
            ],
            description: '3 beats + 3 beats',
            songs: [
                { title: 'Abhi Na Jao Chhod Kar', url: 'https://www.youtube.com/watch?v=qRWozIldyDM' }
            ]
        }
    ],
    tip: {
        title: 'Contexto Musical',
        text: 'Dadra es característico de Thumri y música semi-clásica. Su estructura de 6 tiempos crea un balanceo natural perfecto para acompañar melodías expresivas y ornamentadas. Configura el metrónomo en 3/4 o en un ciclo de 6 pulsos, donde cada "clic" representa 1 Matra. Velocidad sugerida: Empieza a 60 BPM (un golpe por segundo) para asegurar la limpieza de los bols.',
        color: 'purple',
        title_en: 'Musical Context',
        text_en: 'Dadra is characteristic of Thumri and semi-classical music. Its 6-beat structure creates a natural swaying motion perfect for accompanying expressive, ornamental melodies. Set the metronome to 3/4 or a 6-pulse cycle, where each click represents 1 Matra. Suggested tempo: Start at 60 BPM (one beat per second) to ensure clean bols.',
    }
};

// Made with Bob
