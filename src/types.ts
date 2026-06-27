/**
 * TYPE DEFINITIONS
 * Definiciones de tipos globales para la aplicación
 */

// ============================================================================
// BOLS TYPES
// ============================================================================

export interface Bol {
    name: string;
    technique: string;
    description: string;
    badge: string;
    thapki?: boolean;   // El bol admite variación con thapki
    ghuisa?: boolean;   // El bol admite variación con ghuisa (deslizamiento)
}

// ============================================================================
// TAALS TYPES
// ============================================================================

export interface Matra {
    matra: number;
    bol: string;
    technique: string;
}

export interface TaalTip {
    title: string;
    text: string;
    color: 'emerald' | 'purple' | 'amber' | 'blue' | 'indigo';
}

export interface Song {
    title: string;
    url: string;
}

export interface TaalVariation {
    name: string;
    rows: Matra[][];
    description?: string;
    songs?: Song[];
    tutorials?: string[];
    notes?: string[];
    special?: boolean;  // Variación pedagógica/especial, se muestra al final con divisor
}

export interface TaalTheory {
    title: string;
    concepts: {
        term: string;
        definition: string;
    }[];
}

export interface TaalMetronomeConfig {
    compas: string;
    relation: string;
    suggestedBPM: number;
}

export interface Taal {
    name: string;
    beats: number;
    description: string;
    subtitle: string;
    rows: Matra[][];
    tip: TaalTip;
    variations?: TaalVariation[];
    theory?: TaalTheory;
    metronomeConfig?: TaalMetronomeConfig;
    tutorial?: string;
    songs?: Song[];
    notes?: string[];
}

export interface TaalsData {
    [key: string]: Taal;
}

// ============================================================================
// KAYDAS TYPES
// ============================================================================

export interface KaydaRow {
    label: string;
    matras: Matra[];
}

export interface Kayda {
    name: string;
    taal: string;
    beats: number;
    description: string;
    rows: KaydaRow[];
    tutorial?: string;
}

export interface KaydasData {
    [key: string]: Kayda;
}

// ============================================================================
// LEHRAS TYPES
// ============================================================================

export interface Lehra {
    label: string;
    url: string;
}
// ============================================================================
// FILLERS TYPES
// ============================================================================

export interface FillerPattern {
    name: string;
    link?: string | null;
    hasAudio?: boolean;
    note?: string;
    special?: boolean;  // Patrón destacado, se muestra al final separado con divisor
}

export interface Filler {
    category: string;
    patterns: FillerPattern[];
}


// ============================================================================
// CONFIG TYPES
// ============================================================================

export interface MetronomeConfig {
    MIN_BPM: number;
    MAX_BPM: number;
    DEFAULT_BPM: number;
    SCHEDULE_AHEAD_TIME: number;
    LOOKAHEAD: number;
    CLICK_FREQUENCY: number;
    CLICK_DURATION: number;
    CLICK_VOLUME: number;
}

export interface ViewsConfig {
    DASHBOARD: string;
    GLOSARIO: string;
    KEHERWA: string;
    DADRA: string;
    RUPAK: string;
    DEEPCHANDI: string;
    KAYDAS: string;
    SONGS: string;
    RIYAZ: string;
    STATS: string;
}

export interface NavigationItem {
    id: string;
    label: string;
    separator?: boolean; // Línea divisoria DESPUÉS de este item
    disabled?: boolean;  // Item visible pero no navegable (ej: "Próximamente")
}

export interface AppConfig {
    METRONOME: MetronomeConfig;
    VIEWS: ViewsConfig;
    NAVIGATION: NavigationItem[];
}

// ============================================================================
// VIEW TYPES
// ============================================================================

export interface View {
    render(): HTMLElement;
}

// ============================================================================
// NAVIGATION EVENT TYPES
// ============================================================================

export interface NavigateEventDetail {
    viewId: string;
}

// ============================================================================
// ELEMENT ATTRIBUTES TYPES
// ============================================================================

export interface ElementAttributes {
    className?: string;
    id?: string;
    dataset?: Record<string, string>;
    style?: Partial<CSSStyleDeclaration>;
    [key: string]: any;
}

// ============================================================================
// RIYAZ SESSION TYPES
// ============================================================================

export interface SessionBlock {
    id: string;                     // identificador único local (crypto.randomUUID)
    type: 'warmup' | 'practice';

    // Warm Up
    lehraLabel?: string;
    lehraUrl?: string;
    kaydaId?: string;
    kaydaName?: string;

    // Practice
    taalId?: string;
    taalName?: string;
    variationName?: string;         // 'Patrón Principal' o nombre de variación
    supportType?: 'metronome' | 'song' | 'lehra';
    supportRef?: string;            // título de canción o label de lehra
    supportUrl?: string;            // URL YouTube
    bpmStart?: number;
    bpmEnd?: number;                // BPM al finalizar el bloque (puede cambiar)
    bpmRampStep?: number;           // subida automática de BPM por ciclo (0 = desactivado)
    bpmRampEvery?: number;          // subir bpmRampStep cada N ciclos
    bpmRampMax?: number;            // BPM máximo al que detenerse la rampa

    // Timer
    timerMode: 'free' | 'fixed';
    timerMinutes?: number;          // solo si timerMode === 'fixed'

    // Resultado (se rellena al completar el bloque durante la ejecución)
    durationSecs?: number;
    completedAt?: number;           // timestamp Date.now()
    cyclesCompleted?: number;       // solo si supportType === 'metronome'
}

export interface SessionState {
    startedAt: number;              // timestamp Date.now()
    blocks: SessionBlock[];
    currentBlockIndex: number;
    notes: string;
}

// Made with Bob
