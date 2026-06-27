/**
 * STATS VIEW
 * Vista de estadísticas de práctica con gráficas Chart.js.
 *
 * Estado: MOCK DATA — Supabase pendiente de conectar.
 *
 * Para activar Supabase cuando esté listo:
 *   1. npm install @supabase/supabase-js
 *   2. Crear src/core/supabase.ts con createClient (ver comentario abajo)
 *   3. Cambiar SUPABASE_ENABLED = true
 *   4. Implementar fetchUserStats() con las queries reales
 */

import { createElement } from '../core/utils.js';
import type { View } from '../types.js';

// ── Supabase feature flag ────────────────────────────────────────────────────
// Cambiar a true cuando Supabase esté configurado
const SUPABASE_ENABLED = false;

// ── Tipos de datos ───────────────────────────────────────────────────────────

/**
 * Sesión guardada — espejo exacto de la tabla `sessions` en Supabase.
 *
 * Tabla Supabase sugerida:
 * CREATE TABLE sessions (
 *   id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id     text NOT NULL,            -- 'prashant' | 'meera'
 *   saved_at    timestamptz NOT NULL,
 *   total_secs  integer NOT NULL,
 *   notes       text,
 *   blocks      jsonb NOT NULL            -- SessionBlock[] serializado
 * );
 */
export interface SupabaseSession {
    id: string;
    user_id: string;
    saved_at: string;        // ISO 8601
    total_secs: number;
    notes: string | null;
    blocks: SupabaseBlock[];
}

/** Bloque individual dentro de una sesión guardada */
export interface SupabaseBlock {
    type: 'warmup' | 'practice';
    taal_name?: string;
    variation_name?: string;
    kayda_name?: string;
    support_type?: string;
    support_ref?: string;
    bpm_start?: number;
    bpm_end?: number;
    duration_secs?: number;
    cycles_completed?: number;
}

// ── Capa de datos Supabase (stub — implementar cuando esté listo) ─────────────

/**
 * Obtiene las estadísticas procesadas de un usuario desde Supabase.
 *
 * IMPLEMENTAR:
 *   import { supabase } from '../core/supabase.js';
 *
 *   const { data, error } = await supabase
 *       .from('sessions')
 *       .select('*')
 *       .eq('user_id', userId)
 *       .order('saved_at', { ascending: true });
 *
 *   if (error) throw error;
 *   return transformSessionsToStats(data);
 *
 * src/core/supabase.ts sugerido:
 *   import { createClient } from '@supabase/supabase-js';
 *   export const supabase = createClient(
 *       import.meta.env.VITE_SUPABASE_URL,
 *       import.meta.env.VITE_SUPABASE_ANON_KEY
 *   );
 */
export async function fetchUserStats(_userId: string): Promise<UserStats> {
    if (!SUPABASE_ENABLED) {
        throw new Error('Supabase no configurado — usando mock data');
    }

    // TODO: implementar con Supabase real
    // const { data } = await supabase.from('sessions').select('*').eq('user_id', _userId);
    // return transformSessionsToStats(data);
    throw new Error('fetchUserStats: implementación pendiente');
}

/**
 * Transforma un array de SupabaseSession en UserStats para las gráficas.
 * Esta función ya está preparada — solo necesita los datos reales de Supabase.
 */
export function transformSessionsToStats(_sessions: SupabaseSession[]): UserStats {
    // TODO: procesar sessions reales:
    // - weekly:  agrupar duraciones por semana (últimas 16)
    // - bpm:     BPM máx. por taal por semana
    // - donut:   sumar segundos por taal_name
    // - cycles:  cycles_completed de las últimas 20 sesiones con metrónomo
    // - history: últimas 8 sesiones formateadas
    // - kpi:     totales calculados
    // - insight: generado a partir de los datos (o fijo por ahora)
    throw new Error('transformSessionsToStats: implementación pendiente');
}

// ── Etiquetas de semanas ──────────────────────────────────────────────────────

const WEEK_LABELS = [
    'S1 Mar','S2 Mar','S3 Mar','S4 Mar',
    'S1 Abr','S2 Abr','S3 Abr','S4 Abr',
    'S1 May','S2 May','S3 May','S4 May',
    'S1 Jun','S2 Jun','S3 Jun','S4 Jun',
];

// ── Tipo interno de stats ─────────────────────────────────────────────────────

interface UserStats {
    kpi: { sessions: number; time: string; bpm: number; streak: number };
    insight: string;
    weekly: number[];
    bpm: Record<string, number[]>;
    donut: Record<string, number>;
    cycles: number[];
    history: { date: string; dur: string; blocks: string[]; bpm: string; notes: boolean }[];
}

const MOCK_USERS: Record<string, UserStats> = {
    prashant: {
        kpi: { sessions: 68, time: '52h', bpm: 145, streak: 9 },
        insight: '<strong>Punto fuerte:</strong> Tu BPM en Keherwa ha subido 65 puntos en 4 meses — la constancia está funcionando. <strong>A mejorar:</strong> Deepchandi y Rupak representan solo el 18% del tiempo, prueba a equilibrar el repertorio.',
        weekly: [42,65,80,55,90,75,110,95,85,120,100,130,85,110,125,115],
        bpm: {
            Keherwa:    [80,85,90,95,100,105,110,112,115,120,125,130,135,138,140,145],
            Dadra:      [70,72,75,80,82,85,88,90,92,95,98,100,102,105,108,110],
            Rupak:      [60,62,65,68,70,72,75,75,78,80,82,85,85,88,90,92],
            Deepchandi: [50,52,55,55,58,60,62,65,65,68,70,70,72,75,75,78],
        },
        donut: { Keherwa: 40, Dadra: 28, 'Warm Up': 14, Rupak: 11, Deepchandi: 7 },
        cycles: [18,22,25,20,30,28,35,32,40,38,42,45,40,50,48,52,55,50,58,60],
        history: [
            { date:'23 Jun 2025', dur:'48 min', blocks:['Warm Up','Keherwa','Keherwa'],          bpm:'145', notes:true  },
            { date:'22 Jun 2025', dur:'35 min', blocks:['Keherwa','Dadra'],                      bpm:'138', notes:false },
            { date:'21 Jun 2025', dur:'55 min', blocks:['Warm Up','Rupak','Keherwa'],            bpm:'140', notes:true  },
            { date:'19 Jun 2025', dur:'40 min', blocks:['Dadra','Dadra'],                        bpm:'108', notes:false },
            { date:'18 Jun 2025', dur:'50 min', blocks:['Warm Up','Keherwa','Deepchandi'],       bpm:'130', notes:true  },
            { date:'17 Jun 2025', dur:'30 min', blocks:['Keherwa'],                              bpm:'125', notes:false },
            { date:'15 Jun 2025', dur:'60 min', blocks:['Warm Up','Rupak','Dadra','Keherwa'],    bpm:'138', notes:true  },
            { date:'14 Jun 2025', dur:'25 min', blocks:['Dadra'],                                bpm:'102', notes:false },
        ],
    },
    meera: {
        kpi: { sessions: 44, time: '31h', bpm: 118, streak: 3 },
        insight: '<strong>Punto fuerte:</strong> Dadra es tu taal más sólido — muy buen control rítmico. <strong>A mejorar:</strong> La racha de práctica es irregular, hay semanas con solo 1-2 sesiones. Intenta hacer sesiones más cortas pero más frecuentes.',
        weekly: [20,30,0,45,60,25,40,55,30,70,45,60,50,80,65,75],
        bpm: {
            Keherwa:    [65,68,70,72,72,75,78,80,82,82,85,88,90,92,95,100],
            Dadra:      [75,78,80,82,85,88,88,90,92,95,95,98,100,102,105,110],
            Rupak:      [55,55,58,60,62,62,65,65,68,68,70,72,72,75,75,78],
            Deepchandi: [45,48,48,50,52,52,55,55,58,58,60,60,62,62,65,65],
        },
        donut: { Keherwa: 30, Dadra: 38, 'Warm Up': 16, Rupak: 10, Deepchandi: 6 },
        cycles: [12,15,14,18,20,16,22,25,20,28,26,30,28,32,35,30,38,36,40,42],
        history: [
            { date:'22 Jun 2025', dur:'40 min', blocks:['Warm Up','Dadra','Dadra'],    bpm:'110', notes:true  },
            { date:'20 Jun 2025', dur:'28 min', blocks:['Keherwa'],                    bpm:'95',  notes:false },
            { date:'18 Jun 2025', dur:'45 min', blocks:['Dadra','Rupak'],              bpm:'105', notes:true  },
            { date:'15 Jun 2025', dur:'35 min', blocks:['Warm Up','Keherwa'],          bpm:'92',  notes:false },
            { date:'12 Jun 2025', dur:'50 min', blocks:['Dadra','Dadra','Keherwa'],    bpm:'108', notes:true  },
            { date:'10 Jun 2025', dur:'20 min', blocks:['Keherwa'],                    bpm:'88',  notes:false },
            { date:'8 Jun 2025',  dur:'55 min', blocks:['Warm Up','Dadra','Rupak'],    bpm:'102', notes:true  },
            { date:'5 Jun 2025',  dur:'30 min', blocks:['Dadra'],                      bpm:'100', notes:false },
        ],
    },
};

// ── Chart.js (cargado globalmente desde index.html) ───────────────────────────
declare const Chart: any;

// ── Paleta de colores ─────────────────────────────────────────────────────────
const C = {
    orange:  '#f97316',
    orangeA: 'rgba(249,115,22,0.15)',
    blue:    '#3b82f6',
    blueA:   'rgba(59,130,246,0.15)',
    purple:  '#8b5cf6',
    purpleA: 'rgba(139,92,246,0.15)',
    teal:    '#14b8a6',
    tealA:   'rgba(20,184,166,0.15)',
    amber:   '#f59e0b',
    grid:    () => getComputedStyle(document.documentElement).getPropertyValue('--border-primary').trim() || '#e2e8f0',
    text:    () => getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim()    || '#64748b',
    card:    () => getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim()       || '#ffffff',
};

const BPM_PALETTE = [
    { line: C.orange, bg: C.orangeA },
    { line: C.blue,   bg: C.blueA   },
    { line: C.purple, bg: C.purpleA },
    { line: C.teal,   bg: C.tealA   },
];

// ── Clase principal ───────────────────────────────────────────────────────────

export class StatsView implements View {
    private activeUser: string = 'prashant';
    private charts: any[] = [];

    public render(): HTMLElement {
        const section = createElement('section', { id: 'stats', className: 'view-section' });

        // ── Cabecera ──────────────────────────────────────────────────────────
        const header = createElement('div', { className: 'mb-6' });
        header.appendChild(createElement('h2', { className: 'section-title' }, 'Estadísticas'));
        header.appendChild(createElement('p', { className: 'section-subtitle' },
            'Progresión y análisis de práctica'));
        section.appendChild(header);

        // ── Selector de usuario ───────────────────────────────────────────────
        const tabsWrap = createElement('div', { className: 'stats-user-tabs' });

        const btnPrashant = createElement('button', {
            className: 'stats-user-tab active',
            dataset: { user: 'prashant' },
        }, 'Prashant');
        const btnMeera = createElement('button', {
            className: 'stats-user-tab',
            dataset: { user: 'meera' },
        }, 'Meera');

        [btnPrashant, btnMeera].forEach(btn => {
            btn.addEventListener('click', () => {
                tabsWrap.querySelectorAll('.stats-user-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeUser = (btn as HTMLElement).dataset['user'] ?? 'prashant';
                this.refresh(section);
            });
        });

        tabsWrap.appendChild(btnPrashant);
        tabsWrap.appendChild(btnMeera);
        section.appendChild(tabsWrap);

        // ── KPIs ──────────────────────────────────────────────────────────────
        section.appendChild(this.buildKPIs());

        // ── Insight ───────────────────────────────────────────────────────────
        section.appendChild(this.buildInsight());

        // ── Gráfica: minutos/semana ───────────────────────────────────────────
        section.appendChild(this.buildChartCard(
            'Minutos practicados por semana',
            'Constancia de práctica — 4 meses',
            'stats-chart-weekly', 230, 'stats-canvas-tall',
        ));

        // ── Gráficas: BPM + Donut ─────────────────────────────────────────────
        const row2 = createElement('div', { className: 'stats-chart-row' });
        row2.appendChild(this.buildChartCard(
            'Evolución de BPM por taal',
            'Progresión técnica real',
            'stats-chart-bpm', 260, 'stats-canvas-medium',
        ));
        row2.appendChild(this.buildChartCard(
            'Distribución de práctica',
            'Tiempo por taal / tipo',
            'stats-chart-donut', 260, 'stats-canvas-medium',
        ));
        section.appendChild(row2);

        // ── Gráfica: ciclos ───────────────────────────────────────────────────
        section.appendChild(this.buildChartCard(
            'Ciclos completados por sesión',
            'Resistencia y concentración — últimas 20 sesiones con metrónomo',
            'stats-chart-cycles', 190, 'stats-canvas-short',
        ));

        // ── Heatmap ───────────────────────────────────────────────────────────
        const heatCard = this.card();
        heatCard.appendChild(this.cardTitle('Mapa de actividad'));
        heatCard.appendChild(this.cardSub('Intensidad de práctica por día (minutos)'));
        heatCard.appendChild(createElement('div', { id: 'stats-heatmap' }));
        heatCard.appendChild(this.buildHeatmapLegend());
        section.appendChild(heatCard);

        // ── Historial ─────────────────────────────────────────────────────────
        const histCard = this.card();
        histCard.appendChild(this.cardTitle('Historial de sesiones recientes'));
        const tableWrap = createElement('div', { style: { overflowX: 'auto' } });
        tableWrap.innerHTML = this.buildHistoryHTML();
        histCard.appendChild(tableWrap);
        section.appendChild(histCard);

        // Montar gráficas después de insertar en DOM
        requestAnimationFrame(() => {
            this.destroyCharts();
            this.mountCharts();
            this.buildHeatmap();
        });

        return section;
    }

    // ── Helpers de UI ─────────────────────────────────────────────────────────

    private card(): HTMLElement {
        const c = createElement('div', { className: 'card' });
        c.style.padding      = '24px';
        c.style.marginBottom = '16px';
        return c;
    }

    private cardTitle(text: string): HTMLElement {
        const h = createElement('h4', { className: 'font-bold' }, text);
        h.style.fontSize    = '1rem';
        h.style.marginBottom = '4px';
        return h;
    }

    private cardSub(text: string): HTMLElement {
        const p = createElement('p', { className: 'text-muted' });
        p.style.fontSize    = '0.8rem';
        p.style.marginBottom = '16px';
        p.textContent = text;
        return p;
    }

    // ── KPIs ──────────────────────────────────────────────────────────────────

    private buildKPIs(): HTMLElement {
        const d = MOCK_USERS[this.activeUser];
        const grid = createElement('div', { className: 'stats-kpi-grid' });

        const kpis: { label: string; value: string; sub: string; badge: string; badgeCls: string }[] = [
            { label: 'Sesiones totales',    value: String(d.kpi.sessions), sub: 'en 4 meses',    badge: '↑ +12 vs mes ant.', badgeCls: 'stats-badge--up'     },
            { label: 'Tiempo total',        value: d.kpi.time,             sub: 'acumulado',      badge: '↑ 14h este mes',    badgeCls: 'stats-badge--up'     },
            { label: 'BPM máx. alcanzado',  value: String(d.kpi.bpm),     sub: 'Keherwa · hoy', badge: '↑ desde 80 BPM',    badgeCls: 'stats-badge--up'     },
            { label: 'Racha actual',        value: String(d.kpi.streak),   sub: 'días seguidos',  badge: '🔥 racha activa',   badgeCls: 'stats-badge--streak' },
        ];

        kpis.forEach(k => {
            const card = createElement('div', { className: 'card stats-kpi-card' });
            card.appendChild(createElement('div', { className: 'stats-kpi-label' }, k.label));
            card.appendChild(createElement('div', { className: 'stats-kpi-value' }, k.value));
            card.appendChild(createElement('div', { className: 'stats-kpi-sub'   }, k.sub));
            card.appendChild(createElement('span', { className: `stats-badge ${k.badgeCls}` }, k.badge));
            grid.appendChild(card);
        });

        return grid;
    }

    // ── Insight ───────────────────────────────────────────────────────────────

    private buildInsight(): HTMLElement {
        const d = MOCK_USERS[this.activeUser];
        const box = createElement('div', { className: 'stats-insight-box' });
        box.innerHTML = `💡 ${d.insight}`;
        return box;
    }

    // ── Chart cards ───────────────────────────────────────────────────────────

    private buildChartCard(title: string, sub: string, canvasId: string, height: number, canvasCls = ''): HTMLElement {
        const card = this.card();
        card.appendChild(this.cardTitle(title));
        card.appendChild(this.cardSub(sub));
        const wrap = createElement('div', { className: canvasCls });
        wrap.style.position = 'relative';
        wrap.style.height   = `${height}px`;
        wrap.appendChild(createElement('canvas', { id: canvasId }));
        card.appendChild(wrap);
        return card;
    }

    // ── Heatmap ───────────────────────────────────────────────────────────────

    private buildHeatmapLegend(): HTMLElement {
        const leg = createElement('div', { className: 'stats-hm-legend' });
        leg.appendChild(createElement('span', {}, 'Menos'));
        const cells = createElement('div', { className: 'stats-hm-legend-cells' });
        [0,1,2,3,4].forEach(i => cells.appendChild(createElement('div', { className: `stats-hm-cell stats-hm-${i}` })));
        leg.appendChild(cells);
        leg.appendChild(createElement('span', {}, 'Más'));
        return leg;
    }

    private buildHeatmap(): void {
        const container = document.getElementById('stats-heatmap');
        if (!container) return;
        container.innerHTML = '';

        const seed = this.activeUser === 'prashant' ? 7 : 13;
        const daysInMonth = [31, 30, 31, 30];
        const monthNames  = ['Marzo', 'Abril', 'Mayo', 'Junio'];

        const dayData: number[] = Array.from({ length: 120 }, (_, i) => {
            const r = Math.sin(i * seed + seed) * 0.5 + 0.5;
            const threshold = this.activeUser === 'prashant' ? 0.28 : 0.38;
            return r > threshold ? Math.min(4, Math.floor(r * 5)) : 0;
        });

        let dayIdx = 0;
        monthNames.forEach((month, mi) => {
            const wrap = createElement('div', { style: { marginBottom: '14px' } });

            const label = createElement('div', { className: 'text-muted' });
            label.style.fontSize      = '0.7rem';
            label.style.fontWeight    = '700';
            label.style.marginBottom  = '6px';
            label.style.textTransform = 'uppercase';
            label.style.letterSpacing = '0.05em';
            label.textContent = month;
            wrap.appendChild(label);

            const row = createElement('div', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap' } });
            for (let d = 0; d < daysInMonth[mi]; d++) {
                const val  = dayData[dayIdx++] ?? 0;
                const cell = createElement('div', { className: `stats-hm-cell stats-hm-${val}` });
                const tooltips = ['Sin práctica', '~15 min', '~30 min', '~45 min', '~60+ min'];
                cell.title = tooltips[val] ?? '';
                row.appendChild(cell);
            }
            wrap.appendChild(row);
            container.appendChild(wrap);
        });
    }

    // ── Historial ─────────────────────────────────────────────────────────────

    private buildHistoryHTML(): string {
        const d = MOCK_USERS[this.activeUser];

        const tagCls = (b: string) =>
            b === 'Warm Up'    ? 'stats-tag--slate'  :
            b === 'Dadra'      ? 'stats-tag--blue'   :
            b === 'Rupak'      ? 'stats-tag--purple' :
            b === 'Deepchandi' ? 'stats-tag--teal'   :
            'stats-tag--orange';

        const rows = d.history.map(r => {
            const tags = r.blocks.map(b => `<span class="stats-tag ${tagCls(b)}">${b}</span>`).join('');
            const note = r.notes
                ? '<span title="Tiene notas" style="font-size:1rem">📝</span>'
                : '<span style="color:var(--text-light)">—</span>';
            return `<tr>
                <td style="white-space:nowrap;font-weight:600">${r.date}</td>
                <td style="white-space:nowrap;color:var(--text-muted)">${r.dur}</td>
                <td>${tags}</td>
                <td class="stats-col-bpm" style="font-weight:700;color:var(--orange-500)">${r.bpm}</td>
                <td>${note}</td>
            </tr>`;
        }).join('');

        return `<table class="stats-history-table">
            <thead><tr>
                <th>Fecha</th>
                <th>Duración</th>
                <th>Bloques</th>
                <th class="stats-col-bpm">BPM final</th>
                <th>Notas</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
    }

    // ── Chart.js ──────────────────────────────────────────────────────────────

    private destroyCharts(): void {
        this.charts.forEach(c => { try { c.destroy(); } catch { /* noop */ } });
        this.charts = [];
    }

    private mountCharts(): void {
        const d       = MOCK_USERS[this.activeUser];
        const gridCol = C.grid();
        const textCol = C.text();
        const cardCol = C.card();

        Chart.defaults.font.family = 'inherit';
        Chart.defaults.font.size   = 12;
        Chart.defaults.color       = textCol;

        // ── 1. Minutos por semana ─────────────────────────────────────────────
        const weeklyCanvas = document.getElementById('stats-chart-weekly') as HTMLCanvasElement | null;
        if (weeklyCanvas) {
            const trend = d.weekly.map((_, i, arr) => {
                const slice = arr.slice(Math.max(0, i - 2), i + 1);
                return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
            });
            this.charts.push(new Chart(weeklyCanvas, {
                type: 'bar',
                data: {
                    labels: WEEK_LABELS,
                    datasets: [
                        {
                            label: 'Minutos',
                            data: d.weekly,
                            backgroundColor: d.weekly.map((_, i) => i >= 12 ? C.orange : C.orangeA),
                            borderColor: C.orange,
                            borderWidth: 1.5,
                            borderRadius: 6,
                            borderSkipped: false,
                        },
                        {
                            label: 'Tendencia',
                            data: trend,
                            type: 'line',
                            borderColor: C.blue,
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            pointRadius: 0,
                            tension: 0.4,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top' as const,
                            align: 'end' as const,
                            labels: { boxWidth: 12, padding: 16, usePointStyle: true },
                        },
                    },
                    scales: {
                        x: { grid: { color: gridCol }, ticks: { maxRotation: 45 } },
                        y: { grid: { color: gridCol }, beginAtZero: true,
                             title: { display: true, text: 'min', color: textCol } },
                    },
                },
            }));
        }

        // ── 2. BPM por taal ───────────────────────────────────────────────────
        const bpmCanvas = document.getElementById('stats-chart-bpm') as HTMLCanvasElement | null;
        if (bpmCanvas) {
            this.charts.push(new Chart(bpmCanvas, {
                type: 'line',
                data: {
                    labels: WEEK_LABELS,
                    datasets: Object.entries(d.bpm).map(([name, vals], i) => ({
                        label: name,
                        data: vals,
                        borderColor: BPM_PALETTE[i].line,
                        backgroundColor: BPM_PALETTE[i].bg,
                        borderWidth: 2.5,
                        pointRadius: 3,
                        pointHoverRadius: 7,
                        tension: 0.4,
                        fill: false,
                    })),
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom' as const,
                            labels: { boxWidth: 12, padding: 14, usePointStyle: true },
                        },
                    },
                    scales: {
                        x: { grid: { color: gridCol }, ticks: { maxRotation: 45, font: { size: 10 } } },
                        y: { grid: { color: gridCol },
                             title: { display: true, text: 'BPM', color: textCol } },
                    },
                },
            }));
        }

        // ── 3. Donut ──────────────────────────────────────────────────────────
        const donutCanvas = document.getElementById('stats-chart-donut') as HTMLCanvasElement | null;
        if (donutCanvas) {
            const donutColors = [C.orange, C.blue, C.purple, C.teal, C.amber];
            const entries = Object.entries(d.donut);
            this.charts.push(new Chart(donutCanvas, {
                type: 'doughnut',
                data: {
                    labels: entries.map(([k]) => k),
                    datasets: [{
                        data: entries.map(([, v]) => v),
                        backgroundColor: donutColors,
                        borderWidth: 3,
                        borderColor: cardCol,
                        hoverOffset: 8,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                        legend: {
                            position: 'bottom' as const,
                            labels: { boxWidth: 12, padding: 12, usePointStyle: true, font: { size: 11 } },
                        },
                        tooltip: {
                            callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}%` },
                        },
                    },
                },
            }));
        }

        // ── 4. Ciclos ─────────────────────────────────────────────────────────
        const cyclesCanvas = document.getElementById('stats-chart-cycles') as HTMLCanvasElement | null;
        if (cyclesCanvas) {
            const maxCycles = Math.max(...d.cycles);
            this.charts.push(new Chart(cyclesCanvas, {
                type: 'bar',
                data: {
                    labels: d.cycles.map((_, i) => `S${i + 1}`),
                    datasets: [{
                        label: 'Ciclos',
                        data: d.cycles,
                        backgroundColor: d.cycles.map((v, i) =>
                            i === d.cycles.length - 1   ? C.orange
                            : v >= maxCycles * 0.85     ? 'rgba(249,115,22,0.55)'
                            : C.orangeA,
                        ),
                        borderColor: C.orange,
                        borderWidth: 1.5,
                        borderRadius: 5,
                        borderSkipped: false,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: gridCol }, beginAtZero: true,
                             title: { display: true, text: 'ciclos', color: textCol } },
                    },
                },
            }));
        }
    }

    // ── Refresco al cambiar usuario ───────────────────────────────────────────

    private refresh(section: HTMLElement): void {
        const kpiGrid = section.querySelector('.stats-kpi-grid');
        if (kpiGrid) kpiGrid.replaceWith(this.buildKPIs());

        const insight = section.querySelector('.stats-insight-box');
        if (insight) insight.replaceWith(this.buildInsight());

        const tableWrap = section.querySelector('.stats-history-table')?.parentElement;
        if (tableWrap) tableWrap.innerHTML = this.buildHistoryHTML();

        requestAnimationFrame(() => {
            this.destroyCharts();
            this.mountCharts();
            this.buildHeatmap();
        });
    }
}

// Made with Bob
