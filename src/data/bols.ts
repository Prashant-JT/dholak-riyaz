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
            description: 'Sonido seco y brillante, alta definición. Golpe principal del parche agudo.',
            badge: 'Kinar - Agudo'
        },
        {
            name: 'Tin',
            technique: 'Tres dedos en el centro del parche agudo',
            description: 'Sonido resonante y abierto, tono medio-alto con sustain.',
            badge: 'Centro - Agudo'
        },
        {
            name: 'Ti / Te',
            technique: 'Golpe cerrado en el centro del parche agudo',
            description: 'Sonido mudo/apagado sin vibración. Se usa para crear contraste rítmico.',
            badge: 'Mudo - Agudo',
            thapki: true
        }
    ],
    bayan: [
        {
            name: 'Gha / Ghe',
            technique: 'Golpe abierto en el parche grave (Bayan)',
            description: 'Bajo profundo y resonante, fundamental para la base rítmica.',
            badge: 'Abierto - Grave',
            ghuisa: true
        },
        {
            name: 'Ke / Ka',
            technique: 'Palma plana pegada al parche grave',
            description: 'Bajo mudo, corta el sonido inmediatamente. Efecto percusivo seco.',
            badge: 'Mudo - Grave'
        }
    ],
    compuestos: [
        {
            name: 'Dha',
            technique: 'Na + Ghe (simultáneo)',
            description: 'Bol compuesto fundamental. Combina agudo brillante con bajo resonante.',
            badge: 'Compuesto - Bhari',
            thapki: true,
            ghuisa: true
        },
        {
            name: 'Dhi',
            technique: 'Tin + Ghe (simultáneo)',
            description: 'Bol compuesto con mayor resonancia. Tono completo y rico.',
            badge: 'Compuesto - Resonante',
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
