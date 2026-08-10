/**
 * BOLS DATA
 * Actualiza este archivo cuando aprendas nuevos bols
 */

import type { Bol } from '../types';

export const BOLS_BY_CATEGORY = {
    chatti: [
        {
            name: 'Na / Ta',
            technique: 'Dedo índice en el kinar (borde agudo)',
            technique_en: 'Index finger on the kinar (sharp rim)',
            description: 'Sonido seco y brillante, alta definición. Golpe principal del parche agudo.',
            description_en: 'Dry, bright sound with high definition. Main stroke on the treble head.',
            badge: 'Kinar - Agudo',
            badge_en: 'Kinar - Treble'
        },
        {
            name: 'Tin',
            technique: 'Tres dedos en el centro del parche agudo',
            technique_en: 'Three fingers on the centre of the treble head',
            description: 'Sonido resonante y abierto, tono medio-alto con sustain.',
            description_en: 'Resonant, open sound with medium-high pitch and sustain.',
            badge: 'Centro - Agudo',
            badge_en: 'Centre - Treble'
        },
        {
            name: 'Ti / Te',
            technique: 'Golpe cerrado en el centro del parche agudo',
            technique_en: 'Closed stroke on the centre of the treble head',
            description: 'Sonido mudo/apagado sin vibración. Se usa para crear contraste rítmico.',
            description_en: 'Muted/damped sound with no vibration. Used to create rhythmic contrast.',
            badge: 'Mudo - Agudo',
            badge_en: 'Muted - Treble',
            thapki: true
        }
    ],
    bayan: [
        {
            name: 'Gha / Ghe',
            technique: 'Golpe abierto en el parche grave (Bayan)',
            technique_en: 'Open stroke on the bass head (Bayan)',
            description: 'Bajo profundo y resonante, fundamental para la base rítmica.',
            description_en: 'Deep, resonant bass sound — fundamental for the rhythmic foundation.',
            badge: 'Abierto - Grave',
            badge_en: 'Open - Bass',
            ghuisa: true
        },
        {
            name: 'Ke / Ka',
            technique: 'Palma plana pegada al parche grave',
            technique_en: 'Flat palm pressed on the bass head',
            description: 'Bajo mudo, corta el sonido inmediatamente. Efecto percusivo seco.',
            description_en: 'Muted bass — cuts the sound immediately. Dry percussive effect.',
            badge: 'Mudo - Grave',
            badge_en: 'Muted - Bass'
        }
    ],
    compuestos: [
        {
            name: 'Dha',
            technique: 'Na + Ghe (simultáneo)',
            technique_en: 'Na + Ghe (simultaneous)',
            description: 'Bol compuesto fundamental. Combina agudo brillante con bajo resonante.',
            description_en: 'Fundamental compound bol. Combines bright treble with resonant bass.',
            badge: 'Compuesto - Bhari',
            badge_en: 'Compound - Bhari',
            thapki: true,
            ghuisa: true
        },
        {
            name: 'Dhi',
            technique: 'Tin + Ghe (simultáneo)',
            technique_en: 'Tin + Ghe (simultaneous)',
            description: 'Bol compuesto con mayor resonancia. Tono completo y rico.',
            description_en: 'Compound bol with greater resonance. Full, rich tone.',
            badge: 'Compuesto - Resonante',
            badge_en: 'Compound - Resonant',
            thapki: true,
            ghuisa: true
        }
    ]
};

// Keep backwards compatibility with existing code
export const BOLS: Bol[] = [
    ...BOLS_BY_CATEGORY.chatti,
    ...BOLS_BY_CATEGORY.bayan,
    ...BOLS_BY_CATEGORY.compuestos
];

// Made with Bob
