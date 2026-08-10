/**
 * SPANISH STRINGS
 * Fuente de verdad — todos los strings de UI en español.
 * Al añadir texto nuevo a la app, añadir aquí primero y luego en en.ts.
 */

export const es = {

    // ── Navegación / secciones generales ──────────────────────────────────────
    nav: {
        soon: 'Pronto',
    },

    // ── Metrónomo (dashboard) ─────────────────────────────────────────────────
    metronome: {
        pageTitle:    'Riyaz',
        pageSubtitle: 'Metrónomo y Herramientas de Práctica',
        cardTitle:    'Metrónomo',
        bpmLabel:     'BPM',
        cyclesLabel:  'Ciclos:',
        start:        'Iniciar',
        stop:         'Detener',
        reset:        'Reset',
        tempoLabel:   'Tempo (BPM)',
        beatsLabel:   'Beats por Compás',
        presets: {
            slow:   'Lento',
            medium: 'Medio',
            fast:   'Rápido',
            drut:   'Drut',
        },
        beatsOptions: {
            b4:  '4 Beats - Bhajan',
            b6:  '6 Beats - Dadra',
            b7:  '7 Beats - Rupak',
            b8:  '8 Beats - Keherwa',
            b10: '10 Beats - Jhaptal',
            b12: '12 Beats - Ektal',
            b14: '14 Beats - Deepchandi',
            b16: '16 Beats - Teental',
        },
        lehrasTitle:  'Lehras',
        lehrasSelect: 'Selecciona un Loop:',
    },

    // ── Teoría / Glosario ─────────────────────────────────────────────────────
    glosario: {
        pageTitle:    'Teoría',
        pageSubtitle: 'Conceptos fundamentales y glosario de Bols del Dholak',
        taalConcept:  'El concepto de Taal (El Ciclo)',
        concepts: {
            matra:   { term: 'Matra',          def: 'Los tiempos o pulsos (como el 1, 2, 3, 4).' },
            vibhag:  { term: 'Vibhag',         def: 'Cómo se dividen esos tiempos (por ejemplo, el ritmo de 8 tiempos se divide en 4+4).' },
            sam:     { term: 'Sam (सम)',        def: 'El tiempo número 1, el más importante, donde todo empieza y termina. Marcado en ROJO en el metrónomo.' },
            khali:   { term: 'Khali (खाली)',   def: 'Tiempo "vacío" o débil, contrapunto del Sam. Marca la segunda mitad del ciclo.' },
            bhari:   { term: 'Bhari (भरी)',    def: 'Tiempo "lleno" o fuerte. Incluye el Sam y otros tiempos acentuados.' },
            lay:     { term: 'Lay',            def: 'Ritmo o movimiento uniforme. La velocidad del tempo.' },
            bol:     { term: 'Bol',            def: 'Lo que se toca sobre el tabla, el pakhawaj o dholak. Las sílabas rítmicas.' },
            avartan: { term: 'Avartan (आवर्तन)', def: 'Un ciclo completo del Taal. El contador de ciclos muestra cuántos Avartans has completado.' },
        },
        bolsTitle:     'Glosario de Bols',
        colChatti:     'Chatti (Dayan)',
        colChattiSub:  'Parche Agudo',
        colBayan:      'Bayan',
        colBayanSub:   'Parche Grave',
        colCompuestos: 'Compuestos',
        colCompuestosSub: 'Dha & Dhi',
        technique:        'Técnica:',
        thapkiTitle:      'Admite variación con Thapki',
        ghuisaTitle:      'Admite variación con Ghuisa',
        diagramNodes: {
            lay:    'LAY',    layDesc:    'Ritmo o movimiento uniforme',
            matra:  'MATRA',  matraDesc:  'Para medir el tiempo',
            vibhag: 'VIBHAG', vibhagDesc: 'Cada taal se divide, a lo cual se le llama vibhag (secciones)',
            bol:    'BOL',    bolDesc:    'Lo que se toca sobre el tabla, el pakhawaj o dholak',
            drut:   'DRUT\n(FAST)',
            madhya: 'MADHYA\n(MEDIUM)',
            vilambit: 'VILAMBIT\n(SLOW)',
        },
    },

    // ── Canciones ─────────────────────────────────────────────────────────────
    songs: {
        pageTitle:    'Canciones',
        pageSubtitle: 'Colección de canciones para practicar. Haz clic en ▶ YouTube para abrir el video.',
        searchPlaceholder: 'Buscar canción...',
        filterAll:    'Todos',
        counter:      (n: number) => `${n} canciones`,
        counterFiltered: (v: number, t: number) => `${v} de ${t} canciones`,
        empty:        'No se encontraron canciones.',
        ytButton:     '▶ YouTube',
    },

    // ── Kaydas ────────────────────────────────────────────────────────────────
    kaydas: {
        pageTitle:    'Kaydas',
        pageSubtitle: 'Composiciones avanzadas y variaciones temáticas',
        searchPlaceholder: 'Buscar kayda, taal o bol...',
        counter:      (n: number) => `${n} kaydas`,
        counterFiltered: (v: number, t: number) => `${v} de ${t} resultados`,
        empty:        'No hay kaydas que coincidan con la búsqueda.',
        tutorialLabel: 'Tutorial',
        tutorialLink:  'Ver tutorial completo',
        beatsUnit:    (n: number) => `${n} Tiempos`,
        theoryTitle:  'Teoría de Kaydas',
        theoryBody:   'Las Kaydas son composiciones fijas que sirven como base para improvisación (Palta). Este patrón fundamental de Teental (16 tiempos) es la piedra angular del repertorio de tabla y dholak.',
        theoryStruct: 'Estructura: El ciclo se divide en dos mitades: Bhari (lleno, con bajo) y Khali (vacío, sin bajo). El Sam (M1) es el punto de resolución más importante del ciclo.',
    },

    // ── Fillers / Pickups ─────────────────────────────────────────────────────
    fillers: {
        pageTitle:    'Pickups / Fillers / Cuts',
        pageSubtitle: 'Patrones rítmicos de relleno y transición',
        searchPlaceholder: 'Buscar patrón o categoría...',
        counter:      (n: number) => `${n} patrones`,
        counterFiltered: (v: number, t: number) => `${v} de ${t} patrones`,
        empty:        'No hay patrones que coincidan con la búsqueda.',
        tutorialBtn:  '▶ Tutorial',
    },

    // ── Sesión Riyaz — Step 1 ─────────────────────────────────────────────────
    step1: {
        pageTitle:      'Nueva Sesión de Riyaz',
        pageSubtitle:   'Configura tu sesión añadiendo bloques de práctica',
        startBtn:       (n: number) => `▶ Comenzar sesión · ${n} bloque${n !== 1 ? 's' : ''}`,
        startBtnEmpty:  'Añade al menos un bloque para empezar',
        templates:      'Plantillas',
        templatesEmpty: 'Sin plantillas. Configura bloques, genera un link y guárdalo aquí.',
        templateLoad:   'Cargar',
        templateSave:   '💾 Guardar',
        templateDelete: '✕',
        templateNamePlaceholder: 'Nombre para guardar sesión actual…',
        shareTitle:     'Generar link para compartir',
        shareNameLabel: 'Nombre de la sesión:',
        shareNamePlaceholder: 'Ej: Foco Keherwa',
        shareGenBtn:    '📤 Generar y copiar link',
        shareCopied:    '✓ Link copiado',
        shareReceived:  'Sesión recibida',
        shareLoadBtn:   '▶ Cargar y practicar',
        shareSaveBtn:   '💾 Guardar plantilla',
        shareSaved:     '✓ Guardada',
        shareDiscard:   'Descartar',
        shareSavePlaceholder: 'Nombre para guardar como plantilla…',
        warmUpLabel:    'Warm Up',
        warmUpLehra:    'Lehra',
        warmUpKayda:    'Kayda',
        warmUpAddBtn:   '+ Añadir Warm Up',
        pickupLabel:    'Pickup / Filler',
        pickupCat:      'Taal / Categoría',
        pickupPattern:  'Patrón',
        pickupEmpty:    'Sin pickups para esta categoría',
        pickupAddBtn:   '+ Añadir Pickup',
        practiceLabel:  'Bloque de práctica',
        blockBadgeWarmUp: 'Warm Up',
        blockBadgePickup: 'Pickup',
        blockRemove:    'Quitar',
        blockMoveUp:    'Mover arriba',
        blockMoveDown:  'Mover abajo',
        blockMetronome: (bpm: number) => `Metrónomo · ${bpm} BPM`,
        blockFreeTimer: 'Tiempo libre',
        blockPatternMain: 'Patrón Principal',
    },

    // ── Sesión Riyaz — Step 2 ─────────────────────────────────────────────────
    step2: {
        freeTimer:         'Cronómetro libre',
        taalLabel:         'Taal',
        cyclesLabel:       'Ciclos:',
        playBtn:           '▶ Play',
        stopBtn:           '⏹ Stop',
        editBtn:           '✏️ Editar bloque',
        editClose:         '✕ Cerrar',
        nextBtn:           'Siguiente bloque →',
        finishBtn:         '✓ Finalizar sesión',
        blockDone:         'Bloque completado',
        sessionDone:       '¡Sesión completada!',
        supportMetronome:  'Metrónomo de apoyo',
        supportHide:       'Ocultar metrónomo',
    },

    // ── Sesión Riyaz — Step 3 ─────────────────────────────────────────────────
    step3: {
        pageTitle:      'Sesión completada',
        totalTime:      (t: string) => `Tiempo total: ${t}`,
        blocksTitle:    'Bloques practicados',
        warmUp:         'Warm Up',
        pickup:         'Pickup',
        notesTitle:     'Notas de la sesión',
        notesPlaceholder: '¿Qué ha ido bien? ¿Qué mejorar?\nEscribe aquí tus observaciones...',
        jointSession:   'Sesión conjunta',
        taalBreakdown:  'Tiempo por taal',
        saveBtn:        '💾 Guardar sesión',
        discardBtn:     'Descartar sesión',
        discardConfirm: '¿Seguro que quieres descartar esta sesión? No se guardará nada.',
        discardYes:     'Sí, descartar',
        discardNo:      'Cancelar',
        savedMsg:       '✓ <strong>Sesión guardada.</strong> Redirigiendo...',
        discardedMsg:   '✕ <strong>Sesión descartada.</strong> Redirigiendo...',
        saveModalTitle: '💾 Guardar sesión',
        saveModalJoint: 'Sesión conjunta — se guardará para Prashant y Meera',
        saveModalUser:  'Usuario',
        saveModalPass:  'Contraseña',
        saveModalPassPlaceholder: '••••••••',
        saveModalWrongPass: 'Contraseña incorrecta',
        saveModalSaving: 'Guardando...',
        saveModalBtn:   'Guardar',
        saveModalError: 'Error al guardar. Revisa tu conexión e inténtalo de nuevo.',
    },

    // ── Sesión interrumpida / recovery ────────────────────────────────────────
    recovery: {
        doneTitle:    'Sesión lista para guardar',
        doneBlocks:   (n: number, t: string) => `${n} bloque${n !== 1 ? 's' : ''} completados · ${t}`,
        interTitle:   'Sesión interrumpida',
        interMeta:    (done: number, total: number, idx: number, t: string) =>
            `${done} de ${total} bloques completados · Bloque ${idx} en curso · ${t}`,
        continueBtn:  '▶ Continuar sesión',
        finishBtn:    '💾 Finalizar y guardar sesión',
        finishEarly:  (n: number) => `💾 Guardar lo que hay (${n} bloque${n !== 1 ? 's' : ''})`,
        discardBtn:   'Descartar y empezar de nuevo',
        discardConfirm: '¿Seguro? Se perderá la sesión interrumpida.',
        discardYes:   'Sí, descartar',
        discardNo:    'Cancelar',
        badgePending: '🥁 Sesión pendiente de guardar',
        badgeInProgress: '🥁 Sesión en curso',
        timeAgoLessThan1: 'hace menos de 1 min',
        timeAgo1:     'hace 1 min',
        timeAgoN:     (n: number) => `hace ${n} min`,
    },

};

export type Strings = typeof es;

// Made with Bob
