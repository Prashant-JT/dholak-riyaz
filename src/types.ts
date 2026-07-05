/**
 * TYPE DEFINITIONS
 * Global type definitions for the application
 */

// ============================================================================
// BOLS TYPES
// ============================================================================

export interface Bol {
    name: string;
    technique: string;
    description: string;
    badge: string;
    thapki?: boolean;   // The bol supports a thapki variation
    ghuisa?: boolean;   // The bol supports a ghuisa (slide) variation
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
    special?: boolean;  // Pedagogical/special variation, shown at the end with a divider
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
    special?: boolean;  // Featured pattern, shown at the end separated by a divider
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
    ADDHA: string;
    TEENTAL: string;
    EKTAL: string;
    KAYDAS: string;
    SONGS: string;
    RIYAZ: string;
    STATS: string;
}

export interface NavigationItem {
    id: string;
    label: string;
    separator?: boolean; // Divider line AFTER this item
    disabled?: boolean;  // Item visible but not navigable (e.g. "Coming soon")
}

export interface AppConfig {
    METRONOME: MetronomeConfig;
    VIEWS: ViewsConfig;
    NAVIGATION: NavigationItem[];
    MOBILE_BREAKPOINT: number;
    SCROLL_TOP_THRESHOLD: number;
    TIMEZONE: string;
    BPM_MARKS: number[];
    BPM_PRESETS: number[];
    LS_SEEDED_KEY: string;
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
    id: string;                     // unique local identifier (crypto.randomUUID)
    type: 'warmup' | 'practice' | 'pickup';

    // Warm Up
    lehraLabel?: string;
    lehraUrl?: string;
    kaydaId?: string;
    kaydaName?: string;

    // Practice
    taalId?: string;
    taalName?: string;
    variationName?: string;         // 'Patrón Principal' or variation name
    supportType?: 'metronome' | 'song' | 'lehra';
    supportRef?: string;            // song title or lehra label
    supportUrl?: string;            // URL YouTube
    bpmStart?: number;
    bpmEnd?: number;                // BPM al finalizar el bloque (puede cambiar)

    // Pickup
    pickupName?: string;            // pattern name (e.g. 'Na Na Ti (x2) Na')
    pickupTaalCategory?: string;    // filler category (e.g. 'Keherwa')
    pickupVideoUrl?: string;        // URL del tutorial YouTube (opcional)

    // Timer
    timerMode: 'free' | 'fixed';
    timerMinutes?: number;          // solo si timerMode === 'fixed'

    // Result (filled in when the block is completed during execution)
    durationSecs?: number;
    completedAt?: number;           // timestamp Date.now()
    cyclesCompleted?: number;       // only if supportType === 'metronome'
}

export interface SessionState {
    startedAt: number;              // timestamp Date.now()
    blocks: SessionBlock[];
    currentBlockIndex: number;
    notes: string;
}

// Made with Bob
