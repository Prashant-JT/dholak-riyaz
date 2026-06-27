/**
 * STATS VIEW
 * Vista de estadísticas de práctica con gráficas Chart.js.
 * Conectado a Supabase — datos reales de sesiones guardadas.
 */

import { db } from '../core/supabase.js';
import { createElement } from '../core/utils.js';
import type { View } from '../types.js';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface SupabaseSession {
    id: string;
    user_id: string;
    saved_at: string;       // ISO 8601
    total_secs: number;
    notes: string | null;
    blocks: SupabaseBlock[];
}

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

interface UserStats {
    kpi: { sessions: number; time: string; bpm: number; streak: number };
    insight: string;
    weekLabels: string[];
    weekly: number[];
    weekDays: number[][];   // 16 semanas × 7 días (Lun-Dom), minutos por día
    bpm: Record<string, number[]>;
    donut: Record<string, number>;
    cycles: number[];
    history: { date: string; dur: string; blocks: string[]; bpm: string; notes: boolean }[];
    heatmap: { label: string; days: number[] }[];
}

// ── Fetch desde Supabase ──────────────────────────────────────────────────────

async function fetchUserStats(userId: string): Promise<UserStats> {
    // Supabase v2: el QueryBuilder es un PromiseLike — await directo es correcto
    const { data, error } = await db
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('saved_at', { ascending: true });

    if (error) throw error;
    return transformSessionsToStats((data as SupabaseSession[]) ?? []);
}

// ── Transformación de datos ───────────────────────────────────────────────────

/**
 * Calcula los segundos reales de una sesión.
 * Usa la suma de blocks[].duration_secs como fuente de verdad
 * (así las ediciones manuales en el JSON de Supabase se reflejan),
 * y cae a total_secs solo si los bloques no tienen duración registrada.
 */
function effectiveSecs(s: SupabaseSession): number {
    const fromBlocks = s.blocks.reduce((sum, b) => sum + (b.duration_secs ?? 0), 0);
    return fromBlocks > 0 ? fromBlocks : s.total_secs;
}

function transformSessionsToStats(sessions: SupabaseSession[]): UserStats {
    const now   = new Date();
    const MS_WEEK = 7 * 24 * 60 * 60 * 1000;

    // ── Últimas 16 semanas desde hoy ─────────────────────────────────────────
    const weekStarts: Date[] = [];
    for (let i = 15; i >= 0; i--) {
        const d = new Date(now.getTime() - i * MS_WEEK);
        // Lunes de esa semana
        const day = d.getDay();
        const diff = (day === 0 ? -6 : 1 - day);
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        weekStarts.push(d);
    }

    const MONTH_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const weekLabels = weekStarts.map(d => `${d.getDate()} ${MONTH_ES[d.getMonth()]}`);

    // ── Índice de sesión → semana ─────────────────────────────────────────────
    const getWeekIdx = (isoDate: string): number => {
        const d = new Date(isoDate);
        for (let i = weekStarts.length - 1; i >= 0; i--) {
            const end = new Date(weekStarts[i].getTime() + MS_WEEK);
            if (d >= weekStarts[i] && d < end) return i;
        }
        return -1;
    };

    // ── Weekly minutos + desglose diario (Lun=0 … Dom=6) ─────────────────────
    const weekly  = new Array(16).fill(0);
    const weekDays: number[][] = Array.from({ length: 16 }, () => new Array(7).fill(0));
    sessions.forEach(s => {
        const idx = getWeekIdx(s.saved_at);
        if (idx < 0) return;
        const mins = Math.round(effectiveSecs(s) / 60);
        weekly[idx] += mins;
        // Día de la semana normalizado a Lun=0 … Dom=6
        const dow = new Date(s.saved_at).getDay();
        const dayIdx = dow === 0 ? 6 : dow - 1;
        weekDays[idx][dayIdx] += mins;
    });

    // ── BPM máx. por taal por semana ──────────────────────────────────────────
    const bpmMap: Record<string, number[]> = {};
    sessions.forEach(s => {
        const idx = getWeekIdx(s.saved_at);
        if (idx < 0) return;
        s.blocks.forEach(b => {
            if (b.type === 'practice' && b.taal_name && b.bpm_end) {
                if (!bpmMap[b.taal_name]) bpmMap[b.taal_name] = new Array(16).fill(null);
                const cur = bpmMap[b.taal_name][idx];
                if (cur === null || b.bpm_end > cur) bpmMap[b.taal_name][idx] = b.bpm_end;
            }
        });
    });
    // Rellenar nulls con el último valor conocido (carry-forward)
    Object.values(bpmMap).forEach(arr => {
        let last: number | null = null;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] !== null) { last = arr[i]; }
            else if (last !== null) { arr[i] = last; }
        }
        // Quitar nulls iniciales con el primer valor encontrado (carry-back)
        let first: number | null = null;
        for (let i = 0; i < arr.length; i++) { if (arr[i] !== null) { first = arr[i]; break; } }
        for (let i = 0; i < arr.length; i++) { if (arr[i] === null) arr[i] = first ?? 0; }
    });

    // ── Donut: segundos por taal ──────────────────────────────────────────────
    const donutSecs: Record<string, number> = {};
    sessions.forEach(s => {
        s.blocks.forEach(b => {
            const key = b.type === 'warmup' ? 'Warm Up' : (b.taal_name ?? 'Otro');
            donutSecs[key] = (donutSecs[key] ?? 0) + (b.duration_secs ?? 0);
        });
    });
    const totalDonutSecs = Object.values(donutSecs).reduce((a, b) => a + b, 0);
    const donut: Record<string, number> = {};
    Object.entries(donutSecs).forEach(([k, v]) => {
        donut[k] = totalDonutSecs > 0 ? Math.round((v / totalDonutSecs) * 100) : 0;
    });

    // ── Ciclos: últimas 20 sesiones con metrónomo ─────────────────────────────
    const metroSessions = [...sessions]
        .reverse()
        .filter(s => s.blocks.some(b => b.support_type === 'metronome' && b.cycles_completed))
        .slice(0, 20)
        .reverse();
    const cycles = metroSessions.map(s =>
        s.blocks.filter(b => b.support_type === 'metronome')
                .reduce((sum, b) => sum + (b.cycles_completed ?? 0), 0)
    );

    // ── Historial: últimas 10 sesiones ────────────────────────────────────────
    const recentSessions = [...sessions].reverse().slice(0, 10);
    const history = recentSessions.map(s => {
        const d = new Date(s.saved_at);
        const date = `${d.getDate()} ${MONTH_ES[d.getMonth()]} ${d.getFullYear()}`;
        const dur  = `${Math.round(effectiveSecs(s) / 60)} min`;
        const blocks = s.blocks.map(b =>
            b.type === 'warmup' ? 'Warm Up' : (b.taal_name ?? 'Práctica')
        );
        const maxBpm = s.blocks
            .filter(b => b.bpm_end)
            .reduce((max, b) => Math.max(max, b.bpm_end ?? 0), 0);
        return {
            date,
            dur,
            blocks,
            bpm: maxBpm > 0 ? String(maxBpm) : '—',
            notes: !!s.notes,
        };
    });

    // ── Heatmap: últimos 4 meses ──────────────────────────────────────────────
    const heatmap: { label: string; days: number[] }[] = [];
    for (let m = 3; m >= 0; m--) {
        const ref = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
        const days = new Array(daysInMonth).fill(0);

        sessions.forEach(s => {
            const sd = new Date(s.saved_at);
            if (sd.getFullYear() === ref.getFullYear() && sd.getMonth() === ref.getMonth()) {
                const dayIdx = sd.getDate() - 1;
                const mins = Math.round(effectiveSecs(s) / 60);
                // Nivel 1 mínimo para cualquier sesión registrada (aunque sea de prueba/corta)
                const level = mins >= 60 ? 4 : mins >= 30 ? 3 : mins >= 15 ? 2 : mins >= 1 ? 1 : effectiveSecs(s) > 0 ? 1 : 0;
                days[dayIdx] = Math.min(4, days[dayIdx] + level);
            }
        });

        heatmap.push({ label: ref.toLocaleDateString('es-ES', { month: 'long' }), days });
    }

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const totalSecs = sessions.reduce((sum, s) => sum + effectiveSecs(s), 0);
    const totalMins = Math.round(totalSecs / 60);
    const timeStr = totalMins >= 60
        ? `${Math.floor(totalMins / 60)}h ${totalMins % 60 > 0 ? (totalMins % 60) + 'm' : ''}`.trim()
        : `${totalMins}m`;

    const allBpms = sessions.flatMap(s => s.blocks.map(b => b.bpm_end ?? 0));
    const maxBpm = allBpms.length > 0 ? Math.max(...allBpms) : 0;

    // Racha: días consecutivos hasta hoy con al menos una sesión
    const sessionDays = new Set(sessions.map(s => new Date(s.saved_at).toDateString()));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (sessionDays.has(d.toDateString())) streak++;
        else if (i > 0) break;
    }

    // ── Insight automático ────────────────────────────────────────────────────
    const topTaal = Object.entries(donutSecs).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    const leastTaal = Object.entries(donutSecs)
        .filter(([k]) => k !== 'Warm Up')
        .sort((a, b) => a[1] - b[1])[0]?.[0] ?? '—';
    const insight = sessions.length === 0
        ? 'Aún no hay sesiones guardadas. ¡Completa tu primera práctica y guárdala!'
        : `<strong>Taal más practicado:</strong> ${topTaal}. <strong>A equilibrar:</strong> ${leastTaal} tiene el menor tiempo registrado — prueba a incluirlo más en tus sesiones.`;

    return {
        kpi: { sessions: sessions.length, time: timeStr, bpm: maxBpm, streak },
        insight,
        weekLabels,
        weekly,
        weekDays,
        bpm: bpmMap,
        donut,
        cycles,
        history,
        heatmap,
    };
}

// ── Estado vacío para cuando no hay datos ─────────────────────────────────────

function emptyStats(): UserStats {
    const now = new Date();
    const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
    const MONTH_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const weekLabels: string[] = [];
    for (let i = 15; i >= 0; i--) {
        const d = new Date(now.getTime() - i * MS_WEEK);
        weekLabels.push(`${d.getDate()} ${MONTH_ES[d.getMonth()]}`);
    }
    return {
        kpi: { sessions: 0, time: '0m', bpm: 0, streak: 0 },
        insight: 'Aún no hay sesiones guardadas. ¡Completa tu primera práctica y guárdala!',
        weekLabels,
        weekly:   new Array(16).fill(0),
        weekDays: Array.from({ length: 16 }, () => new Array(7).fill(0)),
        bpm: {},
        donut: {},
        cycles: [],
        history: [],
        heatmap: [],
    };
}

// ── Chart.js ──────────────────────────────────────────────────────────────────
declare const Chart: any;

// ── Colores ───────────────────────────────────────────────────────────────────
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

// ── Vista ─────────────────────────────────────────────────────────────────────

export class StatsView implements View {
    private activeUser: string = 'prashant';
    private charts: any[] = [];
    private userData: Record<string, UserStats> = {};
    private section!: HTMLElement;
    private weeklyMode: 'weeks' | 'days' = 'weeks';
    private weeklySelectedIdx: number = 15;   // índice de la semana activa en modo días
    private weeklyChart: any = null;

    public render(): HTMLElement {
        this.section = createElement('section', { id: 'stats', className: 'view-section' });

        // Cabecera
        const header = createElement('div', { className: 'mb-6' });
        header.appendChild(createElement('h2', { className: 'section-title' }, 'Estadísticas'));
        header.appendChild(createElement('p', { className: 'section-subtitle' },
            'Progresión y análisis de práctica · datos reales'));
        this.section.appendChild(header);

        // Selector de usuario
        const tabsWrap = createElement('div', { className: 'stats-user-tabs' });
        ['prashant', 'meera'].forEach((u, idx) => {
            const btn = createElement('button', {
                className: `stats-user-tab${idx === 0 ? ' active' : ''}`,
                dataset: { user: u },
            }, u.charAt(0).toUpperCase() + u.slice(1));
            btn.addEventListener('click', () => {
                tabsWrap.querySelectorAll('.stats-user-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeUser = u;
                this.renderContent();
            });
            tabsWrap.appendChild(btn);
        });
        this.section.appendChild(tabsWrap);

        // Contenedor dinámico
        const content = createElement('div', { id: 'stats-content' });
        this.section.appendChild(content);

        // Mostrar loading y cargar datos — pasamos la referencia directa
        // para no depender de document.getElementById (que falla antes del mount)
        this.showLoading(content);
        this.loadAndRender(content);

        return this.section;
    }

    // ── Carga de datos ────────────────────────────────────────────────────────

    private showLoading(container: HTMLElement): void {
        container.innerHTML = '';
        const wrap = createElement('div', { className: 'stats-loading' });

        const msg = createElement('p', { className: 'stats-loading__msg' }, 'Conectando con Supabase…');
        const barOuter = createElement('div', { className: 'stats-loading__bar-outer' });
        const barInner = createElement('div', { className: 'stats-loading__bar-inner', id: 'stats-progress-bar' });
        barOuter.appendChild(barInner);
        const hint = createElement('p', { className: 'stats-loading__hint' }, 'Esto puede tardar unos segundos la primera vez.');

        wrap.appendChild(msg);
        wrap.appendChild(barOuter);
        wrap.appendChild(hint);
        container.appendChild(wrap);

        // Animación de progreso indeterminada: avanza hasta ~90% mientras carga
        let pct = 0;
        const tick = setInterval(() => {
            pct = pct < 70 ? pct + 8 : pct < 88 ? pct + 1 : pct;
            barInner.style.width = `${pct}%`;
        }, 300);
        (wrap as any)._stopProgress = () => {
            clearInterval(tick);
            barInner.style.width = '100%';
            barInner.style.transition = 'width 0.3s ease';
        };
    }

    private async loadAndRender(content: HTMLElement): Promise<void> {
        try {
            // Cargar ambos usuarios en paralelo
            const [p, m] = await Promise.all([
                fetchUserStats('prashant').catch((err: unknown) => { console.warn('Stats prashant:', err); return emptyStats(); }),
                fetchUserStats('meera').catch((err: unknown)    => { console.warn('Stats meera:',    err); return emptyStats(); }),
            ]);

            // Completar barra antes de renderizar
            const loadingWrap = content.querySelector('.stats-loading') as any;
            if (loadingWrap?._stopProgress) loadingWrap._stopProgress();

            // Pausa breve para que el usuario vea el 100%
            await new Promise(r => setTimeout(r, 250));

            this.userData = { prashant: p, meera: m };
            this.renderContent();
        } catch (err: unknown) {
            console.error('Error cargando estadísticas:', err);
            content.innerHTML = '';
            const errWrap = createElement('div', { className: 'stats-loading' });
            errWrap.innerHTML = `<p class="stats-loading__msg">Error al conectar con Supabase.</p>
                <p class="stats-loading__hint">Revisa la consola del navegador (F12) para más detalles.</p>`;
            content.appendChild(errWrap);
        }
    }

    private renderContent(): void {
        const content = document.getElementById('stats-content');
        if (!content) return;
        content.innerHTML = '';
        this.destroyCharts();

        const d = this.userData[this.activeUser] ?? emptyStats();

        content.appendChild(this.buildKPIs(d));
        content.appendChild(this.buildInsight(d));
        content.appendChild(this.buildWeeklyCard(d));

        const row2 = createElement('div', { className: 'stats-chart-row' });
        row2.appendChild(this.buildChartCard('Evolución de BPM por taal', 'Progresión técnica real', 'stats-chart-bpm', 260, 'stats-canvas-medium'));
        row2.appendChild(this.buildChartCard('Distribución de práctica', 'Tiempo por taal / tipo', 'stats-chart-donut', 260, 'stats-canvas-medium'));
        content.appendChild(row2);

        if (d.cycles.length > 0) {
            content.appendChild(this.buildChartCard('Ciclos completados por sesión', 'Resistencia — últimas sesiones con metrónomo', 'stats-chart-cycles', 190, 'stats-canvas-short'));
        }

        const heatCard = this.card();
        heatCard.appendChild(this.cardTitle('Mapa de actividad'));
        heatCard.appendChild(this.cardSub('Intensidad de práctica por día (minutos)'));
        heatCard.appendChild(createElement('div', { id: 'stats-heatmap' }));
        heatCard.appendChild(this.buildHeatmapLegend());
        content.appendChild(heatCard);

        const histCard = this.card();
        histCard.appendChild(this.cardTitle('Historial de sesiones recientes'));
        const tableWrap = createElement('div', { style: { overflowX: 'auto' } });
        tableWrap.innerHTML = this.buildHistoryHTML(d);
        histCard.appendChild(tableWrap);
        content.appendChild(histCard);

        requestAnimationFrame(() => {
            this.mountCharts(d);
            this.buildHeatmap(d);
        });
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
        h.style.fontSize     = '1rem';
        h.style.marginBottom = '4px';
        return h;
    }

    private cardSub(text: string): HTMLElement {
        const p = createElement('p', { className: 'text-muted' });
        p.style.fontSize     = '0.8rem';
        p.style.marginBottom = '16px';
        p.textContent = text;
        return p;
    }

    // ── Gráfica semanal con toggle Semanas / Días ─────────────────────────────

    private buildWeeklyCard(d: UserStats): HTMLElement {
        const card = this.card();

        // Cabecera: título + toggle
        const headerRow = createElement('div', { className: 'stats-weekly-header' });
        const titleWrap = createElement('div');
        titleWrap.appendChild(this.cardTitle('Minutos practicados'));
        const subEl = createElement('p', { className: 'text-muted', id: 'stats-weekly-sub' });
        subEl.style.fontSize     = '0.8rem';
        subEl.style.marginBottom = '0';
        subEl.textContent = 'Últimas 16 semanas';
        titleWrap.appendChild(subEl);
        headerRow.appendChild(titleWrap);

        // Toggle Semanas / Días
        const toggle = createElement('div', { className: 'stats-weekly-toggle' });
        const btnWeeks = createElement('button', { className: 'stats-weekly-btn active', id: 'stats-toggle-weeks' }, 'Semanas');
        const btnDays  = createElement('button', { className: 'stats-weekly-btn',        id: 'stats-toggle-days'  }, 'Días');
        toggle.appendChild(btnWeeks);
        toggle.appendChild(btnDays);
        headerRow.appendChild(toggle);
        card.appendChild(headerRow);

        // Selector de semana (oculto en modo "Semanas")
        const weekSel = createElement('div', { className: 'stats-week-selector', id: 'stats-week-selector' });
        weekSel.style.display = 'none';
        const selLabel = createElement('span', { className: 'text-muted' });
        selLabel.style.fontSize = '0.82rem';
        selLabel.textContent = 'Semana:';
        const selPrev = createElement('button', { className: 'stats-week-nav', id: 'stats-week-prev' }, '‹');
        const selNext = createElement('button', { className: 'stats-week-nav', id: 'stats-week-next' }, '›');
        const selCurrent = createElement('span', { className: 'stats-week-label', id: 'stats-week-label' });
        weekSel.appendChild(selLabel);
        weekSel.appendChild(selPrev);
        weekSel.appendChild(selCurrent);
        weekSel.appendChild(selNext);
        card.appendChild(weekSel);

        // Canvas
        const wrap = createElement('div', { className: 'stats-canvas-tall' });
        wrap.style.position = 'relative';
        wrap.style.height   = '230px';
        wrap.appendChild(createElement('canvas', { id: 'stats-chart-weekly' }));
        card.appendChild(wrap);

        // Lógica toggle
        const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        const updateSub = () => {
            const subNode = document.getElementById('stats-weekly-sub');
            if (!subNode) return;
            if (this.weeklyMode === 'weeks') {
                subNode.textContent = 'Últimas 16 semanas';
            } else {
                subNode.textContent = `Semana del ${d.weekLabels[this.weeklySelectedIdx]}`;
            }
        };

        const updateWeekLabel = () => {
            const lbl = document.getElementById('stats-week-label');
            if (lbl) lbl.textContent = d.weekLabels[this.weeklySelectedIdx] ?? '';
        };

        const switchChart = () => {
            if (!this.weeklyChart) return;
            const chart = this.weeklyChart;
            if (this.weeklyMode === 'weeks') {
                const trend = d.weekly.map((_, i, arr) => {
                    const slice = arr.slice(Math.max(0, i - 2), i + 1);
                    return Math.round(slice.reduce((a: number, b: number) => a + b, 0) / slice.length);
                });
                chart.data.labels = d.weekLabels;
                chart.data.datasets[0].data = d.weekly;
                chart.data.datasets[0].backgroundColor = d.weekly.map((_: number, i: number) => i >= 12 ? C.orange : C.orangeA);
                chart.data.datasets[1].data = trend;
                chart.data.datasets[1].hidden = false;
            } else {
                const days = d.weekDays[this.weeklySelectedIdx] ?? new Array(7).fill(0);
                chart.data.labels = DAY_LABELS;
                chart.data.datasets[0].data = days;
                chart.data.datasets[0].backgroundColor = days.map((v: number) => v > 0 ? C.orange : C.orangeA);
                chart.data.datasets[1].data = new Array(7).fill(null);
                chart.data.datasets[1].hidden = true;
            }
            chart.update();
            updateSub();
        };

        btnWeeks.addEventListener('click', () => {
            this.weeklyMode = 'weeks';
            btnWeeks.classList.add('active');
            btnDays.classList.remove('active');
            weekSel.style.display = 'none';
            switchChart();
        });

        btnDays.addEventListener('click', () => {
            this.weeklyMode = 'days';
            btnDays.classList.add('active');
            btnWeeks.classList.remove('active');
            weekSel.style.display = 'flex';
            updateWeekLabel();
            switchChart();
        });

        selPrev.addEventListener('click', () => {
            if (this.weeklySelectedIdx > 0) {
                this.weeklySelectedIdx--;
                updateWeekLabel();
                switchChart();
            }
        });

        selNext.addEventListener('click', () => {
            if (this.weeklySelectedIdx < 15) {
                this.weeklySelectedIdx++;
                updateWeekLabel();
                switchChart();
            }
        });

        return card;
    }

    private mountWeeklyChart(d: UserStats): void {
        const canvas = document.getElementById('stats-chart-weekly') as HTMLCanvasElement | null;
        if (!canvas) return;

        const gridCol = C.grid();
        const textCol = C.text();

        const trend = d.weekly.map((_, i, arr) => {
            const slice = arr.slice(Math.max(0, i - 2), i + 1);
            return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
        });

        this.weeklyChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: d.weekLabels,
                datasets: [
                    {
                        label: 'Minutos',
                        data: d.weekly,
                        backgroundColor: d.weekly.map((_, i) => i >= 12 ? C.orange : C.orangeA),
                        borderColor: C.orange, borderWidth: 1.5, borderRadius: 6, borderSkipped: false,
                    },
                    {
                        label: 'Tendencia',
                        data: trend,
                        type: 'line',
                        borderColor: C.blue, backgroundColor: 'transparent',
                        borderWidth: 2, pointRadius: 0, tension: 0.4,
                    },
                ],
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'top' as const, align: 'end' as const, labels: { boxWidth: 12, padding: 16, usePointStyle: true } } },
                scales: {
                    x: { grid: { color: gridCol }, ticks: { maxRotation: 45 } },
                    y: { grid: { color: gridCol }, beginAtZero: true, title: { display: true, text: 'min', color: textCol } },
                },
            },
        });
        this.charts.push(this.weeklyChart);

        // Restaurar estado del toggle si venía en modo días
        if (this.weeklyMode === 'days') {
            const btnDays  = document.getElementById('stats-toggle-days');
            const btnWeeks = document.getElementById('stats-toggle-weeks');
            const weekSel  = document.getElementById('stats-week-selector');
            btnDays?.classList.add('active');
            btnWeeks?.classList.remove('active');
            if (weekSel) weekSel.style.display = 'flex';
            const days = d.weekDays[this.weeklySelectedIdx] ?? new Array(7).fill(0);
            this.weeklyChart.data.labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            this.weeklyChart.data.datasets[0].data = days;
            this.weeklyChart.data.datasets[0].backgroundColor = days.map((v: number) => v > 0 ? C.orange : C.orangeA);
            this.weeklyChart.data.datasets[1].hidden = true;
            this.weeklyChart.update();
        }
    }

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

    // ── KPIs ──────────────────────────────────────────────────────────────────

    private buildKPIs(d: UserStats): HTMLElement {
        const grid = createElement('div', { className: 'stats-kpi-grid' });

        const kpis = [
            { label: 'Sesiones totales',    value: String(d.kpi.sessions), sub: 'registradas',      badge: '📊 histórico',        badgeCls: 'stats-badge--up'     },
            { label: 'Tiempo total',        value: d.kpi.time,             sub: 'acumulado',         badge: '⏱ en práctica',       badgeCls: 'stats-badge--up'     },
            { label: 'BPM máx. alcanzado',  value: d.kpi.bpm > 0 ? String(d.kpi.bpm) : '—', sub: 'mejor marca',  badge: '🎯 récord',           badgeCls: 'stats-badge--up'     },
            { label: 'Racha actual',        value: String(d.kpi.streak),   sub: 'días seguidos',     badge: d.kpi.streak > 0 ? '🔥 activa' : '— sin racha', badgeCls: 'stats-badge--streak' },
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

    private buildInsight(d: UserStats): HTMLElement {
        const box = createElement('div', { className: 'stats-insight-box' });
        box.innerHTML = `💡 ${d.insight}`;
        return box;
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

    private buildHeatmap(d: UserStats): void {
        const container = document.getElementById('stats-heatmap');
        if (!container) return;
        container.innerHTML = '';

        if (d.heatmap.length === 0) {
            container.textContent = 'Sin datos aún.';
            return;
        }

        d.heatmap.forEach(({ label, days }) => {
            const wrap = createElement('div', { style: { marginBottom: '14px' } });
            const lbl = createElement('div', { className: 'text-muted' });
            Object.assign(lbl.style, { fontSize: '0.7rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' });
            lbl.textContent = label;
            wrap.appendChild(lbl);

            const row = createElement('div', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap' } });
            const tooltips = ['Sin práctica', '~15 min', '~30 min', '~45 min', '~60+ min'];
            days.forEach(val => {
                const cell = createElement('div', { className: `stats-hm-cell stats-hm-${val}` });
                cell.title = tooltips[val] ?? '';
                row.appendChild(cell);
            });
            wrap.appendChild(row);
            container.appendChild(wrap);
        });
    }

    // ── Historial ─────────────────────────────────────────────────────────────

    private buildHistoryHTML(d: UserStats): string {
        if (d.history.length === 0) {
            return '<p class="text-muted text-sm" style="padding:12px 0">Sin sesiones registradas todavía.</p>';
        }

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
                <th>Fecha</th><th>Duración</th><th>Bloques</th>
                <th class="stats-col-bpm">BPM final</th><th>Notas</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
    }

    // ── Chart.js ──────────────────────────────────────────────────────────────

    private destroyCharts(): void {
        this.charts.forEach(c => { try { c.destroy(); } catch { /* noop */ } });
        this.charts = [];
        this.weeklyChart = null;
    }

    private mountCharts(d: UserStats): void {
        const gridCol = C.grid();
        const textCol = C.text();
        const cardCol = C.card();

        Chart.defaults.font.family = 'inherit';
        Chart.defaults.font.size   = 12;
        Chart.defaults.color       = textCol;

        // 1. Minutos por semana — delegado a mountWeeklyChart
        this.mountWeeklyChart(d);

        // 2. BPM por taal
        const bpmCanvas = document.getElementById('stats-chart-bpm') as HTMLCanvasElement | null;
        if (bpmCanvas) {
            const bpmEntries = Object.entries(d.bpm);
            this.charts.push(new Chart(bpmCanvas, {
                type: 'line',
                data: {
                    labels: d.weekLabels,
                    datasets: bpmEntries.length > 0
                        ? bpmEntries.map(([name, vals], i) => ({
                            label: name, data: vals,
                            borderColor: BPM_PALETTE[i % BPM_PALETTE.length].line,
                            backgroundColor: BPM_PALETTE[i % BPM_PALETTE.length].bg,
                            borderWidth: 2.5, pointRadius: 3, pointHoverRadius: 7, tension: 0.4, fill: false,
                        }))
                        : [{ label: 'Sin datos', data: new Array(16).fill(null), borderColor: C.orange, borderWidth: 1.5 }],
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 14, usePointStyle: true } } },
                    scales: {
                        x: { grid: { color: gridCol }, ticks: { maxRotation: 45, font: { size: 10 } } },
                        y: { grid: { color: gridCol }, title: { display: true, text: 'BPM', color: textCol } },
                    },
                },
            }));
        }

        // 3. Donut
        const donutCanvas = document.getElementById('stats-chart-donut') as HTMLCanvasElement | null;
        if (donutCanvas) {
            const entries = Object.entries(d.donut);
            const donutColors = [C.orange, C.blue, C.purple, C.teal, C.amber, '#ec4899'];
            this.charts.push(new Chart(donutCanvas, {
                type: 'doughnut',
                data: {
                    labels: entries.length > 0 ? entries.map(([k]) => k) : ['Sin datos'],
                    datasets: [{ data: entries.length > 0 ? entries.map(([,v]) => v) : [100], backgroundColor: entries.length > 0 ? donutColors : ['#e2e8f0'], borderWidth: 3, borderColor: cardCol, hoverOffset: 8 }],
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '65%',
                    plugins: {
                        legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 12, usePointStyle: true, font: { size: 11 } } },
                        tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}%` } },
                    },
                },
            }));
        }

        // 4. Ciclos
        const cyclesCanvas = document.getElementById('stats-chart-cycles') as HTMLCanvasElement | null;
        if (cyclesCanvas && d.cycles.length > 0) {
            const maxCycles = Math.max(...d.cycles);
            this.charts.push(new Chart(cyclesCanvas, {
                type: 'bar',
                data: {
                    labels: d.cycles.map((_, i) => `S${i + 1}`),
                    datasets: [{ label: 'Ciclos', data: d.cycles, backgroundColor: d.cycles.map((v, i) => i === d.cycles.length - 1 ? C.orange : v >= maxCycles * 0.85 ? 'rgba(249,115,22,0.55)' : C.orangeA), borderColor: C.orange, borderWidth: 1.5, borderRadius: 5, borderSkipped: false }],
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { x: { grid: { display: false } }, y: { grid: { color: gridCol }, beginAtZero: true, title: { display: true, text: 'ciclos', color: textCol } } },
                },
            }));
        }
    }
}

// Made with Bob
