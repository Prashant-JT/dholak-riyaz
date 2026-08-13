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
    description_en: 'Syncopated base metre',
    subtitle: 'Estructura 4+4 beats',
    subtitle_en: '4+4 beat structure',
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
        color: 'emerald',
        title_en: 'Technical Execution Tip',
        text_en: 'Ghe: Play using the index finger. Dha: Play using the middle finger to alternate correctly.',
    },
    variations: [
        {
            name: 'Keherwa variación 1 (Base Bollywood)',
            name_en: 'Keherwa variation 1 (Base Bollywood)',
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
            name_en: 'Keherwa variation 2 (Punjabi Dhol)',
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
            name_en: 'Keherwa variation 3 (Bhajan Theka, Classical)',
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
            name_en: 'Keherwa Western variation',
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
            name: 'Keherwa variación (Ghoomar Theka, Rajasthani Style)',
            name_en: 'Keherwa variation (Ghoomar Theka, Rajasthani Style)',
            rows: [
                [
                    { matra: 1, bol: 'DhaDhin', technique: '' },
                    { matra: 2, bol: 'DhiNaTi', technique: '' },
                    { matra: 3, bol: 'Dhin (ghisa)', technique: '' },
                    { matra: 4, bol: '—',       technique: '' },
                    { matra: 5, bol: 'DhaDhin', technique: '' },
                    { matra: 6, bol: 'TiNaTi',  technique: '' },
                    { matra: 7, bol: 'Tin',     technique: '' },
                    { matra: 8, bol: '—',       technique: '' }
                ]
            ],
            tutorials: [
                'https://www.youtube.com/watch?v=1t-yeoM9p7A',
                'https://www.youtube.com/watch?v=rwinuVIri5k'
            ],
            notes: [
                'El segundo tutorial (Ghoomar Theka Lessons with Variations) explica también otras variaciones de Ghoomar y el theka con más detalle + pickups.'
            ],
            notes_en: [
                'The second tutorial (Ghoomar Theka Lessons with Variations) also explains other Ghoomar variations and the theka in more detail + pickups.'
            ],
            songs: [
                { title: 'Ghoomar (Original song)', url: 'https://www.youtube.com/watch?v=nHhRWgkkpMk' }
            ]
        },
        {
            name: 'Keherwa variación Thapki',
            name_en: 'Keherwa Thapki variation',
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
            name_en: 'Keherwa variation 4 (80s songs)',
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
            name_en: 'Keherwa variation 5 (Horse Beat)',
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
            name_en: 'Keherwa variation 6 (Fast)',
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
            name_en: 'Keherwa variation 7 (Dafli)',
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
            name_en: 'Keherwa variation 8 (Fast with TeTe)',
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
            ],
            notes_en: [
                'Note: TeTe — 3 fingers first'
            ]
        },
        {
            name: 'Keherwa variación 9 (Dhi Dhi Na)',
            name_en: 'Keherwa variation 9 (Dhi Dhi Na)',
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
            name_en: 'Keherwa variation 10 (Kite Ta Ti)',
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
            name_en: 'Keherwa variation 11 (Dha Dhin Tin Na)',
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
            name: 'Keherwa variación Thapki 1 (Dha Ghe)',
            name_en: 'Keherwa Thapki variation 1 (Dha Ghe)',
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
            description: '4 beats + 4 beats — thapki en Sam y en Khali',
            description_en: '4 beats + 4 beats — thapki on Sam and Khali'
        },
        {
            name: 'Keherwa variación 13 (Dhin _ Na Dhi)',
            name_en: 'Keherwa variation 13 (Dhin _ Na Dhi)',
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
            name_en: 'Keherwa Thapki variation 2 (Dhit Tata)',
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
            description: '4 beats + 4 beats — variación thapki con Dhit y Dhige',
            description_en: '4 beats + 4 beats — thapki variation with Dhit and Dhige'
        },
        {
            name: 'Keherwa variación 14 (L P Theka)',
            name_en: 'Keherwa variación 14 (L P Theka)',
            rows: [
                [
                    { matra: 1, bol: 'Dhi', technique: '' },
                    { matra: 2, bol: 'Ge',  technique: '' },
                    { matra: 3, bol: 'Dhit', technique: '' },
                    { matra: 4, bol: 'Ta',  technique: '' },
                    { matra: 5, bol: 'Ti',  technique: '' },
                    { matra: 6, bol: 'Ge',  technique: '' },
                    { matra: 7, bol: 'Dhit', technique: '' },
                    { matra: 8, bol: 'Ta',  technique: '' }
                ]
            ],
            tutorials: ['https://www.youtube.com/watch?v=9NEvR1j-eBs', 'https://www.youtube.com/watch?v=Kg7lSj8xiNk&t=293s'],
            songs: [
                { title: 'Billo Rani', url: 'https://www.youtube.com/watch?v=T15qhmhqraE' }
            ]
        },
        {
            name: 'Keherwa variación 15 (D C Theka)',
            name_en: 'Keherwa variation 15 (D C Theka)',
            rows: [
                [
                    { matra: 1, bol: 'Dhi', technique: '' },
                    { matra: 2, bol: 'Ga',  technique: '' },
                    { matra: 3, bol: 'Dha', technique: '' },
                    { matra: 4, bol: 'Na',  technique: '' },
                    { matra: 5, bol: 'Ti',  technique: '' },
                    { matra: 6, bol: 'Ga',  technique: '' },
                    { matra: 7, bol: 'Dha', technique: '' },
                    { matra: 8, bol: 'Na',  technique: '' }
                ]
            ],
            tutorials: ['https://www.youtube.com/watch?v=Kg7lSj8xiNk&t=293s'],
        },
        {
            name: 'Keherwa variación Thapki (Qawwali style)',
            name_en: 'Keherwa Thapki variation (Qawwali style)',
            rows: [
                [
                    { matra: 1, bol: 'Dhi (thapki)',  technique: '' },
                    { matra: 2, bol: 'Ge (ghisa)',    technique: '' },
                    { matra: 3, bol: 'Na',            technique: '' },
                    { matra: 4, bol: 'Na',            technique: '' },
                    { matra: 5, bol: 'Ti (thapki)',   technique: '' },
                    { matra: 6, bol: 'Ge',            technique: '' },
                    { matra: 7, bol: 'Dha',           technique: '' },
                    { matra: 8, bol: 'Na',            technique: '' }
                ]
            ],
            tutorials: ['https://www.youtube.com/watch?v=9NEvR1j-eBs'],
            description: '4 beats + 4 beats — thapki en M1 y M5, ghisa en M2',
            description_en: '4 beats + 4 beats — thapki on M1 and M5, ghisa on M2',
            songs: [
                { title: 'Billo Rani', url: 'https://www.youtube.com/watch?v=T15qhmhqraE' }
            ]
        },
        {
            name: 'Keherwa variación Garba (Rajasthani)',
            name_en: 'Keherwa Garba variation (Rajasthani)',
            rows: [
                [
                    { matra: 1, bol: 'Dhit',             technique: '' },
                    { matra: 2, bol: 'Dha',              technique: '' },
                    { matra: 3, bol: 'Ti',               technique: '' },
                    { matra: 4, bol: 'Ta',               technique: '' },
                    { matra: 5, bol: 'TiKiTe (thapki)',  technique: '' },
                    { matra: 6, bol: 'Dha',              technique: '' },
                    { matra: 7, bol: 'Ti',               technique: '' },
                    { matra: 8, bol: 'Dha',              technique: '' }
                ]
            ],
            tutorials: ['https://www.youtube.com/shorts/SOtFKpS9A0I'],
            description: '4 beats + 4 beats — thapki en M5',
            description_en: '4 beats + 4 beats — thapki on M5'
        },
        {
            name: 'Keherwa Duff Pattern',
            rows: [
                [
                    { matra: 1, bol: 'Dhi', technique: '' },
                    { matra: 2, bol: 'T',  technique: '' },
                    { matra: 3, bol: 'Ta',  technique: '' },
                    { matra: 4, bol: 'Ka',  technique: '' },
                    { matra: 5, bol: 'Ta',  technique: '' },
                    { matra: 6, bol: 'Ga',  technique: '' },
                    { matra: 7, bol: 'Dhi', technique: '' },
                    { matra: 8, bol: 'T',  technique: '' }
                ]
            ],
            tutorials: ['https://www.youtube.com/watch?v=Km1LRzVN7FA'],
            description: '4 beats + 4 beats — Duff style',
            description_en: '4 beats + 4 beats — Duff style'
        }
    ]
};

// Made with Bob
