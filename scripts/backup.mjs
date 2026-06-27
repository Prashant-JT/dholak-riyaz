/**
 * BACKUP SCRIPT
 * Descarga todas las sesiones de Supabase y las guarda en backups/YYYY-MM-DD.json
 * Usa fetch directo (REST API de Supabase) — sin dependencia de Realtime/WebSocket.
 *
 * Uso local:
 *   SUPABASE_URL=https://... SUPABASE_ANON_KEY=eyJ... node scripts/backup.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.error('❌  Faltan variables de entorno SUPABASE_URL y/o SUPABASE_ANON_KEY');
    process.exit(1);
}

// Usa la REST API directamente — sin WebSocket ni Realtime
const url = `${SUPABASE_URL}/rest/v1/sessions?select=*&order=saved_at.asc`;
console.log('🔌  Conectando a Supabase...');

const res = await fetch(url, {
    headers: {
        'apikey':        SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Accept':        'application/json',
    },
});

if (!res.ok) {
    console.error(`❌  Error HTTP ${res.status}:`, await res.text());
    process.exit(1);
}

const sessions = await res.json();
console.log(`✅  ${sessions.length} sesión(es) descargadas`);

// Guardar en backups/YYYY-MM-DD.json
const today = new Date().toISOString().slice(0, 10);
const backupsDir = join(__dirname, '..', 'backups');
mkdirSync(backupsDir, { recursive: true });

const outPath = join(backupsDir, `${today}.json`);
const payload = {
    exported_at: new Date().toISOString(),
    total:       sessions.length,
    sessions,
};
writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
console.log(`💾  Guardado en backups/${today}.json`);
