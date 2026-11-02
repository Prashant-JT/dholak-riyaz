/**
 * TAALS INDEX
 * Combines every taal into a single TaalsData object.
 *
 * To add a taal, follow the 7-step checklist in AGENTS.md.
 */

import type { TaalsData } from '../../types';

// ── Active taals (visible in navigation) ─────────────────────────────────────
import { keherwa }    from './keherwa.js';
import { dadra }      from './dadra.js';
import { rupak }      from './rupak.js';
import { deepchandi } from './deepchandi.js';
import { addha }      from './addha.js';

// ── Ready taals (data complete, pending addition to navigation) ───────────────
import { teental }    from './teental.js';
import { ektal }      from './ektal.js';
import { jhaptal }    from './jhaptal.js';

export const TAALS: TaalsData = {
    // Active
    keherwa,
    dadra,
    rupak,
    deepchandi,
    addha,
    // Ready — uncomment entry in config.ts > NAVIGATION to activate
    teental,
    ektal,
    jhaptal,
};
