/**
 * APPLICATION CONFIGURATION
 * Configuración global de la aplicación
 */

import type { AppConfig } from '../types';

export const CONFIG: AppConfig = {
    METRONOME: {
        MIN_BPM: 60,
        MAX_BPM: 400,
        DEFAULT_BPM: 120,
        SCHEDULE_AHEAD_TIME: 0.1,
        LOOKAHEAD: 25.0,
        CLICK_FREQUENCY: 1000,
        CLICK_DURATION: 0.03,
        CLICK_VOLUME: 0.3
    },
    
    VIEWS: {
        DASHBOARD: 'dashboard',
        GLOSARIO: 'glosario',
        KEHERWA: 'keherwa',
        DADRA: 'dadra',
        RUPAK: 'rupak',
        DEEPCHANDI: 'deepchandi',
        ADDHA: 'addha',
        TEENTAL: 'teental',
        EKTAL: 'ektal',
        KAYDAS: 'kaydas',
        SONGS: 'songs',
        RIYAZ: 'riyaz',
        STATS: 'stats'
    },
    
    NAVIGATION: [
        { id: 'riyaz', label: 'Sesión Riyaz' },
        { id: 'stats', label: 'Estadísticas', separator: true },
        { id: 'dashboard', label: 'Metrónomo' },
        { id: 'glosario', label: 'Teoría', separator: true },
        { id: 'dadra', label: 'Dadra (6B)' },
        { id: 'rupak', label: 'Rupak (7B)' },
        { id: 'keherwa', label: 'Keherwa (8B)' },
        { id: 'ektal', label: 'Ektal (12B)' },
        { id: 'deepchandi', label: 'Deepchandi (14B)' },
        { id: 'addha', label: 'Addha (16B)' },
        { id: 'teental', label: 'Teental (16B)' },
        { id: 'fillers', label: 'Pickups/Fillers', separator: true },
        { id: 'kaydas', label: 'Kaydas' },
        { id: 'songs', label: 'Canciones' }
    ]
};

// Made with Bob
