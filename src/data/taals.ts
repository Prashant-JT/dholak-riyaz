/**
 * TAALS DATA
 * Actualiza este archivo semanalmente con nuevos taals y variaciones
 */

import type { TaalsData } from '../types';

export const TAALS: TaalsData = {
    keherwa: {
        name: 'Keherwa Taal',
        beats: 8,
        description: 'Métrica base sincopada',
        subtitle: 'Estructura 4+4 beats',
        rows: [
            [
                { matra: 1, bol: 'Dha', technique: 'Taali' },
                { matra: 2, bol: 'Ghe', technique: '' },
                { matra: 3, bol: 'Na', technique: '' },
                { matra: 4, bol: 'Ti', technique: '' },
                { matra: 5, bol: 'Na', technique: 'Khali' },
                { matra: 6, bol: 'Ke', technique: '' },
                { matra: 7, bol: 'Dhi', technique: '' },
                { matra: 8, bol: 'Na', technique: '' }
            ]
        ],
        tutorial: 'https://youtu.be/ENtGVW31Jbo',
        tip: {
            title: 'Tip Técnico de Ejecución',
            text: 'Ghe: Tocar utilizando dedo índice. Dha: Tocar utilizando dedo medio para alternar correctamente.',
            color: 'emerald'
        },
        variations: [
            {
                name: 'Keherwa variación 1',
                rows: [
                    [
                        { matra: 1, bol: 'Dha', technique: '' },
                        { matra: 2, bol: 'Ghe', technique: '' },
                        { matra: 3, bol: 'Na', technique: '' },
                        { matra: 4, bol: 'Ti', technique: '' },
                        { matra: 5, bol: 'Na', technique: '' },
                        { matra: 6, bol: 'Ghe', technique: '' },
                        { matra: 7, bol: 'Dhi', technique: '' },
                        { matra: 8, bol: 'Na', technique: '' }
                    ]
                ],
                description: '4 beats + 4 beats',
                songs: [
                    { title: 'Kuch Toh Log Kahenge', url: 'https://www.youtube.com/watch?v=56I2rxRPRLY' },
                    { title: 'Naa Kajre Ki Dhar', url: 'https://www.youtube.com/watch?v=v1rRI4GYTdY' }
                ]
            },
            {
                name: 'Keherwa variación 2 (Punjabi Dhol)',
                rows: [
                    [
                        { matra: 1, bol: 'Dha', technique: '' },
                        { matra: 2, bol: 'Ti', technique: '' },
                        { matra: 3, bol: 'Na', technique: '' },
                        { matra: 4, bol: 'Ti', technique: '' },
                        { matra: 5, bol: 'Na', technique: '' },
                        { matra: 6, bol: 'Ti', technique: '' },
                        { matra: 7, bol: 'Dha', technique: '' },
                        { matra: 8, bol: 'Ti', technique: '' }
                    ]
                ],
                songs: [
                    { title: 'Preety Woman', url: 'https://youtu.be/Gcne5Wt-Qfo?si=NheIC1xErAd-wnRA' },
                    { title: 'Patola - Guru Randhawa', url: 'https://youtu.be/z-ZEHL4DF-A?si=tDsXGu62ZWS-WxPz' }
                ]
            },
            {
                name: 'Keherwa variación 3 (Bhajan Theka, Classical)',
                rows: [
                    [
                        { matra: 1, bol: 'Dhin', technique: '' },
                        { matra: 2, bol: 'NaDhi', technique: '' },
                        { matra: 3, bol: 'Dhi', technique: '' },
                        { matra: 4, bol: 'NaNa', technique: '' },
                        { matra: 5, bol: 'Tin', technique: '' },
                        { matra: 6, bol: 'NaDhi', technique: '' },
                        { matra: 7, bol: 'Dhi', technique: '' },
                        { matra: 8, bol: 'NaNa', technique: '' }
                    ]
                ],
                songs: [
                    { title: 'Payoji Maine Ram Ratan Dhan Payo', url: 'https://www.youtube.com/watch?v=eVzyOEhTBy8' },
                    { title: 'Baale re muraliya baaje', url: 'https://youtu.be/GP6dt_qW5gE?si=Cw1h8xQsU5RyVD1S' }
                ]
            },
            {
                name: 'Keherwa Western variación',
                rows: [
                    [
                        { matra: 1, bol: 'Dha', technique: '' },
                        { matra: 2, bol: 'Ge', technique: 'Gap' },
                        { matra: 3, bol: 'Na', technique: '' },
                        { matra: 4, bol: 'Tin', technique: '' },
                        { matra: 5, bol: 'Na', technique: '' },
                        { matra: 6, bol: 'Tin', technique: '' },
                        { matra: 7, bol: 'NaNa', technique: '' },
                        { matra: 8, bol: 'TeTe', technique: '' }
                    ]
                ],
                songs: [
                    { title: 'Tum Mile Dil Kile', url: 'https://www.youtube.com/watch?v=nqTS7ngviwQ' },
                    { title: 'Kehna Hi Kya', url: 'https://www.youtube.com/watch?v=_YB1taxJPgk' }
                ]
            },
            {
                name: 'Keherwa variación Ghoomar (Rajasthani)',
                rows: [
                    [
                        { matra: 1, bol: 'Dha', technique: '' },
                        { matra: 2, bol: 'Dhin', technique: '' },
                        { matra: 3, bol: 'Dhi', technique: '' },
                        { matra: 4, bol: 'NaTi', technique: '' },
                        { matra: 5, bol: 'Dhin', technique: '' },
                        { matra: 6, bol: 'DhaDhin', technique: '' },
                        { matra: 7, bol: 'TeTa', technique: '' },
                        { matra: 8, bol: 'TaTi', technique: '' }
                    ]
                ],
                tutorials: ['https://www.youtube.com/watch?v=WG_RByBmRcE'],
                songs: [
                    { title: 'Ghoomar (Original song)', url: 'https://www.youtube.com/watch?v=nHhRWgkkpMk' }
                ]
            },
            {
                name: 'Keherwa variación Ghoomar (más simple)',
                rows: [
                    [
                        { matra: 1, bol: 'Dha', technique: '' },
                        { matra: 2, bol: 'Dhin', technique: '' },
                        { matra: 3, bol: 'Dhi', technique: '' },
                        { matra: 4, bol: 'NaTi', technique: '' },
                        { matra: 5, bol: 'Ta', technique: '' },
                        { matra: 6, bol: 'DhinDhin', technique: '' },
                        { matra: 7, bol: 'NaTi', technique: '' },
                        { matra: 8, bol: 'Dhin', technique: '' }
                    ]
                ],
                description: '4 beats + 4 beats',
                songs: [
                    { title: 'Ghoomar (Original song)', url: 'https://www.youtube.com/watch?v=nHhRWgkkpMk' }
                ]
            },
            {
                name: 'Keherwa variación Thapki',
                rows: [
                    [
                        { matra: 1, bol: 'Ghe (ghisa)', technique: '' },
                        { matra: 2, bol: '—', technique: '' },
                        { matra: 3, bol: 'Tit (thapki)', technique: '' },
                        { matra: 4, bol: 'Ta', technique: '' },
                        { matra: 5, bol: '—', technique: '' },
                        { matra: 6, bol: 'Ghe', technique: '' },
                        { matra: 7, bol: 'Dhit (thapki)', technique: '' },
                        { matra: 8, bol: 'Ta', technique: '' }
                    ]
                ],
                tutorials: ['https://www.youtube.com/watch?v=GzTTmt70X0o'],
                description: '4 beats + 4 beats',
            },
            {
                name: 'Keherwa variación 4 (80s songs)',
                rows: [
                    [
                        { matra: 1, bol: 'Dhin', technique: '' },
                        { matra: 2, bol: 'Na', technique: '' },
                        { matra: 3, bol: 'Tin', technique: '' },
                        { matra: 4, bol: 'Na', technique: '' },
                        { matra: 5, bol: 'Tin', technique: '' },
                        { matra: 6, bol: 'Na', technique: '' },
                        { matra: 7, bol: 'Dhin', technique: '' },
                        { matra: 8, bol: 'Na', technique: '' }
                    ]
                ],
                songs: [
                    { title: 'Aye mere Humsafar', url: 'https://youtu.be/sWqiZpBtcxc?si=7FYBvybDY_l9WQFk' }
                ]
            },
            {
                name: 'Keherwa variación 5 (Horse Beat)',
                rows: [
                    [
                        { matra: 1, bol: 'Dhin', technique: '' },
                        { matra: 2, bol: 'Na', technique: '' },
                        { matra: 3, bol: 'Tin', technique: '' },
                        { matra: 4, bol: 'Na', technique: '' },
                        { matra: 5, bol: 'Dhin', technique: '' },
                        { matra: 6, bol: 'Na', technique: '' },
                        { matra: 7, bol: 'Tin', technique: '' },
                        { matra: 8, bol: 'Na', technique: '' }
                    ]
                ],
                songs: [
                    { title: 'Lakdi ki kaathi', url: 'https://youtu.be/wSs2n5abdmg?si=taWsXUFXUfT1nH9M' }
                ]
            },
            {
                name: 'Keherwa variación 6 (Fast)',
                rows: [
                    [
                        { matra: 1, bol: 'Dha', technique: '' },
                        { matra: 2, bol: '—', technique: '' },
                        { matra: 3, bol: '—', technique: '' },
                        { matra: 4, bol: 'Ti', technique: '' },
                        { matra: 5, bol: 'Na', technique: '' },
                        { matra: 6, bol: 'Gha', technique: '' },
                        { matra: 7, bol: 'Ghe', technique: '' },
                        { matra: 8, bol: 'N (three finger touch)', technique: 'Se puede sustituir por Na' }
                    ]
                ],
                songs: [
                    { title: 'Chappa Chappa - Chappa Chappa', url: 'https://www.youtube.com/watch?v=HVa0owi2ZP4' }
                ]
            },
            {
                name: 'Keherwa variación 7 (Dafli)',
                rows: [
                    [
                        { matra: 1, bol: 'Dhin', technique: '' },
                        { matra: 2, bol: 'Ta', technique: '' },
                        { matra: 3, bol: 'Ti', technique: '' },
                        { matra: 4, bol: 'Ta', technique: '' },
                        { matra: 5, bol: 'Dhi', technique: '' },
                        { matra: 6, bol: 'Dhi', technique: '' },
                        { matra: 7, bol: 'Ta', technique: '' },
                        { matra: 8, bol: 'TiTa', technique: '' }
                    ]
                ],
                songs: [
                    { title: 'Dafali Wale Dafali Baja', url: 'https://www.youtube.com/watch?v=2s9lq9rLwp8' }
                ]
            },
            {
                name: 'Keherwa variación 8',
                rows: [
                    [
                        { matra: 1, bol: 'Dha', technique: '' },
                        { matra: 2, bol: 'Ghe', technique: '' },
                        { matra: 3, bol: 'NaTiNa', technique: '' },
                        { matra: 4, bol: 'TeTe', technique: '' },
                        { matra: 5, bol: 'TiNa', technique: '' },
                        { matra: 6, bol: 'TeTe', technique: '' },
                        { matra: 7, bol: 'TiNaTi', technique: '' },
                        { matra: 8, bol: 'DhiNa', technique: '' }
                    ]
                ],
                songs: [
                    { title: 'Kaun Disa Mein Leke Chala Re Batohiya', url: 'https://www.youtube.com/watch?v=D61BvxAOxm0' }
                ],
                description: '4 beats + 4 beats'
            },
            {
                name: 'Keherwa variación 9',
                rows: [
                    [
                        { matra: 1, bol: 'Dhi', technique: '' },
                        { matra: 2, bol: 'Dhi', technique: '' },
                        { matra: 3, bol: 'Na', technique: '' },
                        { matra: 4, bol: 'TiNa', technique: '' },
                        { matra: 5, bol: 'Ti', technique: '' },
                        { matra: 6, bol: 'Na', technique: '' },
                        { matra: 7, bol: 'Dhin', technique: '' },
                        { matra: 8, bol: 'Na', technique: '' }
                    ]
                ],
                songs: [
                    { title: 'Bahut Pyar Karte hai', url: 'https://youtu.be/rqEjOLu105I?si=DcFYTxAymhlHp2Ot' }
                ],
                description: '4 beats + 4 beats'
            }
        ]
    },
    
    dadra: {
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
                    {
                        title: 'Dagabaaz Re',
                        url: 'https://www.youtube.com/watch?v=0KozfDYK1EU'
                    }
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
                    {
                        title: 'Itni shakti hai dai / Aisi kirpa guru',
                        url: 'https://youtu.be/m1Ft4JdqrBE?si=jazhC1TLeakR8xim'
                    }
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
                    {
                        title: 'Thumaka Chalata Ramachandra',
                        url: 'https://www.youtube.com/watch?v=lGaQSumuSpA'
                    },
                    {
                        title: 'Ye Daulat Bhi Lelo Ye Shohrat Bhi Lelo',
                        url: 'https://www.youtube.com/watch?v=L7iFS5iYAiI'
                    },
                    {
                        title: 'Lab Par Aaye',
                        url: 'https://www.youtube.com/watch?v=7kR6tqag_zY'
                    }
                ]
            },
            {
                name: 'Dadra variación (famous theka)',
                rows: [
                    [
                        { matra: 1, bol: 'Dhi', technique: 'Bhari' },
                        { matra: 2, bol: 'Dhi', technique: '' },
                        { matra: 3, bol: 'Na', technique: '' },
                        { matra: 4, bol: 'Ti', technique: 'Khali' },
                        { matra: 5, bol: 'Dhi', technique: '' },
                        { matra: 6, bol: 'Na', technique: '' }
                    ]
                ],
                description: '3 beats + 3 beats',
                songs: [
                    {
                        title: 'Aaye Ho Meri Zindagi Mein',
                        url: 'https://www.youtube.com/watch?v=ixCnsZswdpU'
                    }
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
                    {
                        title: 'Hey Naam Re Sabse Bada Tera Naam (después del min 0:50)',
                        url: 'https://www.youtube.com/watch?v=UaFTHjUnOao'
                    }
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
                songs: [
                    { title: 'Baaje Re Muraliya Baaje', url: 'https://youtu.be/GP6dt_qW5qE?si=Cw1h8xQsU5RyVD1S' }
                ]
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
                    {
                        title: 'Aaj Humare Dil mein',
                        url: 'https://youtu.be/ABqsJBSBNBw?si=rwJaRwI78MFxwoT6'
                    }
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
                    'https://www.youtube.com/shorts/iMXwZyeRrx'
                ],
            },
            {
                name: 'Dadra taal ulti thapki',
                rows: [
                    [
                        { matra: 1, bol: 'Dha (ghisa)', technique: 'Bhari' },
                        { matra: 2, bol: 'Tit (thapki)', technique: '' },
                        { matra: 3, bol: 'Ta', technique: '' },
                        { matra: 4, bol: 'Ta', technique: 'Khali' },
                        { matra: 5, bol: 'Dhit (thapki + ghisa)', technique: '' },
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
    },
    
    rupak: {
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
    },
    
    deepchandi: {
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
                { matra: 7, bol: '—', technique: '' },
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
            { title: 'Aaj Jaane Ki Zid Na Karo', url: 'https://www.youtube.com/watch?v=CfUDuYAasiE' }
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
        }
    }
};

// Made with Bob
