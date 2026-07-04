/**
 * TAALS INDEX
 * Combina todos los taals en un único objeto TaalsData.
 *
 * Para añadir un nuevo taal al menú:
 *   1. Importarlo aquí y añadirlo al objeto TAALS
 *   2. Añadir { id: '<id>', label: '<Nombre> (XB)' } en src/core/config.ts > NAVIGATION
 */

import type { TaalsData } from '../../types';

// ── Taals activos (visibles en navegación) ───────────────────────────────────
import { keherwa }    from './keherwa.js';
import { dadra }      from './dadra.js';
import { rupak }      from './rupak.js';
import { deepchandi } from './deepchandi.js';
import { addha }      from './addha.js';

// ── Taals preparados (datos listos, pendientes de añadir a la navegación) ────
import { teental }    from './teental.js';
import { ektal }      from './ektal.js';
import { jhaptal }    from './jhaptal.js';

export const TAALS: TaalsData = {
    // Activos
    keherwa,
    dadra,
    rupak,
    deepchandi,
    addha,
    // Preparados — descomentar entrada en config.ts > NAVIGATION para activar
    teental,
    ektal,
    jhaptal,
};

// Made with Bob
