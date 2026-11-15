/**
 * BACKUP SCRIPT
 * Downloads every Supabase session into backups/YYYY-MM-DD.json.
 * Uses the REST API directly — no Realtime/WebSocket dependency.
 *
 * Local usage:
 *   SUPABASE_URL=https://... SUPABASE_ANON_KEY=eyJ... node scripts/backup.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.error('Missing environment variables SUPABASE_URL and/or SUPABASE_ANON_KEY');
    process.exit(1);
}

// Use the REST API directly — no WebSocket or Realtime
const url = `${SUPABASE_URL}/rest/v1/sessions?select=*&order=saved_at.asc`;
console.log('Connecting to Supabase...');

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
console.log(`${sessions.length} session(s) downloaded`);

// Write to backups/YYYY-MM-DD.json
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
console.log(`Saved to backups/${today}.json`);
