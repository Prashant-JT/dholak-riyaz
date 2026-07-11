/**
 * KEHERWA TAAL
 * 8 beats — estructura 4+4
 * Actualiza este archivo con nuevas variaciones de Keherwa
 */

import type { Taal } from '../../types';

export const keherwa: Taal = {
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
            name: 'Keherwa variación 1 (Base Bollywood)',
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
                    { matra: 3, bol: 'Ti (thapki)', technique: '' },
                    { matra: 4, bol: 'Ta', technique: '' },
                    { matra: 5, bol: '—', technique: '' },
                    { matra: 6, bol: 'Ghe', technique: '' },
                    { matra: 7, bol: 'Dhi (thapki)', technique: '' },
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
            name: 'Keherwa variación 8 (Rápida con TeTe)',
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
            description: '4 beats + 4 beats',
            notes: [
                'Nota: TeTe - 3 dedos primero'
            ]
        },
        {
            name: 'Keherwa variación 9 (Dhi Dhi Na)',
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
        },
        {
            name: 'Keherwa variación 10 (Kite Ta Ti)',
            rows: [
                [
                    { matra: 1, bol: 'Dha', technique: '' },
                    { matra: 2, bol: 'Kite', technique: '' },
                    { matra: 3, bol: 'Ta', technique: '' },
                    { matra: 4, bol: 'Ti', technique: '' },
                    { matra: 5, bol: 'Na', technique: '' },
                    { matra: 6, bol: 'Ke', technique: '' },
                    { matra: 7, bol: 'Dhi', technique: '' },
                    { matra: 8, bol: 'Na', technique: '' }
                ]
            ],
            songs: [
                { title: 'Roop Suhana Lagta Hai', url: 'https://www.youtube.com/watch?v=DdO7VPfbgSg' }
            ],
            description: '4 beats + 4 beats'
        },
        {
            name: 'Keherwa variación 11 (Dha Dhin Tin Na)',
            rows: [
                [
                    { matra: 1, bol: 'Dha', technique: '' },
                    { matra: 2, bol: 'Dhin', technique: '' },
                    { matra: 3, bol: 'Tin', technique: '' },
                    { matra: 4, bol: 'Na', technique: '' },
                    { matra: 5, bol: 'Ke', technique: '' },
                    { matra: 6, bol: 'Dhin', technique: '' },
                    { matra: 7, bol: '—', technique: '' },
                    { matra: 8, bol: '—', technique: '' }
                ]
            ],
            songs: [
                { title: 'Sathiya Bin Tere Dil Mane Na', url: 'https://youtu.be/oD0Dtk3YfZ8?si=IzPtmEsfY4e_Ihbj' }
            ]
        },
        {
            name: 'Keherwa variación 12 (Thapki Dha Ghe)',
            rows: [
                [
                    { matra: 1, bol: 'Dha (thapki)', technique: 'Taali' },
                    { matra: 2, bol: 'Ghe',          technique: '' },
                    { matra: 3, bol: 'Na',            technique: '' },
                    { matra: 4, bol: 'Ti',            technique: '' },
                    { matra: 5, bol: 'Ta (thapki)',   technique: 'Khali' },
                    { matra: 6, bol: 'Ghe',           technique: '' },
                    { matra: 7, bol: 'Na',            technique: '' },
                    { matra: 8, bol: 'Ti',            technique: '' }
                ]
            ],
            description: '4 beats + 4 beats — thapki en Sam y en Khali'
        },
        {
            name: 'Keherwa variación 13 (Dhin _ Na Dhi)',
            rows: [
                [
                    { matra: 1, bol: 'Dhin',  technique: '' },
                    { matra: 2, bol: '—',     technique: '' },
                    { matra: 3, bol: 'Na',    technique: '' },
                    { matra: 4, bol: 'Dhi',   technique: '' },
                    { matra: 5, bol: '—',     technique: '' },
                    { matra: 6, bol: 'Dhin',  technique: '' },
                    { matra: 7, bol: 'NaNa',  technique: '' },
                    { matra: 8, bol: 'TeTe',  technique: '' }
                ]
            ],
            songs: [
                { title: 'In Ankhon Ki Masti', url: 'https://www.youtube.com/watch?v=pwsjRraWgdA' }
            ]
        },
        {
            name: 'Keherwa variación Thapki 2 (Dhit Tata)',
            rows: [
                [
                    { matra: 1, bol: 'Dhit (thapki)', technique: '' },
                    { matra: 2, bol: 'TaTa',           technique: '' },
                    { matra: 3, bol: 'Tit (thapki)',   technique: '' },
                    { matra: 4, bol: 'Dha',   technique: '' },
                    { matra: 5, bol: 'Ta',    technique: '' },
                    { matra: 6, bol: 'DhiGe', technique: '' },
                    { matra: 7, bol: 'Ta',  technique: '' },
                    { matra: 8, bol: 'Ta',     technique: '' }
                ]
            ],
            description: '4 beats + 4 beats — variación thapki con Dhit y Dhige'
        }
    ]
};

// Made with Bob
