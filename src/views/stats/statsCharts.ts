/**
 * STATS — Charts
 * Chart.js colour palette and all chart mounting functions.
 * Depends on Chart.js loaded globally from CDN.
 */

import { t, tArray } from '../../i18n/index.js';
import type { UserStats, SupabaseSession } from './statsTypes.js';
import { gcDateStr, effectiveSecs } from './statsData.js';

// ── Chart.js global declaration ───────────────────────────────────────────────

declare const Chart: any;

// ── Colour palette ────────────────────────────────────────────────────────────

export const C = {
    orange:  '#f97316',
    orangeA: 'rgba(249,115,22,0.55)',
    blue:    '#3b82f6',
    blueA:   'rgba(59,130,246,0.55)',
    purple:  '#8b5cf6',
    purpleA: 'rgba(139,92,246,0.7)',
    teal:    '#14b8a6',
    tealA:   'rgba(20,184,166,0.7)',
    amber:   '#f59e0b',
    grid:    () => getComputedStyle(document.documentElement).getPropertyValue('--border-primary').trim() || '#e2e8f0',
    text:    () => getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim()    || '#64748b',
    card:    () => getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim()       || '#ffffff',
};

export const BPM_PALETTE = [
    { line: C.orange, bg: C.orangeA },
    { line: C.blue,   bg: C.blueA   },
    { line: C.purple, bg: C.purpleA },
    { line: C.teal,   bg: C.tealA   },
];

// ── Weekly chart ──────────────────────────────────────────────────────────────

export function mountWeeklyChart(
    d: UserStats,
    weeklyMode: 'weeks' | 'days' | 'months',
    weeklySelectedIdx: number,
    chartRegistry: any[]
): any {
    const canvas = document.getElementById('stats-chart-weekly') as HTMLCanvasElement | null;
    if (!canvas) return null;

    const gridCol = C.grid();
    const textCol = C.text();

    const trend = d.weekly.map((_, i, arr) => {
        const slice = arr.slice(Math.max(0, i - 2), i + 1);
        return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
    });

    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: d.weekLabels,
            datasets: [
                {
                    label: t('stats.weeklyDataLabel'),
                    data: d.weekly,
                    backgroundColor: C.orangeA,
                    borderColor: C.orange, borderWidth: 2.5, borderRadius: 6, borderSkipped: false,
                },
                {
                    label: t('stats.weeklyTrend'),
                    data: trend,
                    type: 'line',
                    borderColor: C.blue, backgroundColor: 'transparent',
                    borderWidth: 3, pointRadius: 0, tension: 0.4,
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
    chartRegistry.push(chart);

    if (weeklyMode === 'days') {
        const btnDays  = document.getElementById('stats-toggle-days');
        const btnWeeks = document.getElementById('stats-toggle-weeks');
        const weekSel  = document.getElementById('stats-week-selector');
        btnDays?.classList.add('active');
        btnWeeks?.classList.remove('active');
        if (weekSel) weekSel.style.display = 'flex';
        const days = d.weekDays[weeklySelectedIdx] ?? new Array(7).fill(0);
        const DAY_LABELS = tArray('stats.dayLabels');
        chart.data.labels = DAY_LABELS;
        chart.data.datasets[0].label = t('stats.weeklyDataLabel');
        chart.data.datasets[0].data = days;
        chart.data.datasets[0].backgroundColor = days.map((v: number) => v > 0 ? C.orange : C.orangeA);
        chart.data.datasets[1].hidden = true;
        chart.update();
    } else if (weeklyMode === 'months') {
        const btnMonths = document.getElementById('stats-toggle-months');
        const btnWeeks  = document.getElementById('stats-toggle-weeks');
        btnMonths?.classList.add('active');
        btnWeeks?.classList.remove('active');
        const trend = d.monthly.map((_, i, arr) => {
            const slice = arr.slice(Math.max(0, i - 2), i + 1);
            return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
        });
        chart.data.labels = d.monthLabels;
        chart.data.datasets[0].label = t('stats.weeklyDataLabelMonths');
        chart.data.datasets[0].data = d.monthly;
        chart.data.datasets[0].backgroundColor = C.orangeA;
        chart.data.datasets[1].data = trend;
        chart.data.datasets[1].hidden = false;
        chart.update();
    }

    return chart;
}

// ── Individual user charts (BPM, donut, cycles) ───────────────────────────────

export function mountCharts(d: UserStats, chartRegistry: any[], weeklyMode: 'weeks' | 'days' | 'months', weeklySelectedIdx: number): { weeklyChart: any } {
    const gridCol = C.grid();
    const textCol = C.text();
    const cardCol = C.card();

    Chart.defaults.font.family = 'inherit';
    Chart.defaults.font.size   = 12;
    Chart.defaults.color       = textCol;

    const weeklyChart = mountWeeklyChart(d, weeklyMode, weeklySelectedIdx, chartRegistry);

    const bpmCanvas = document.getElementById('stats-chart-bpm') as HTMLCanvasElement | null;
    if (bpmCanvas) {
        const bpmEntries = Object.entries(d.bpm);
        chartRegistry.push(new Chart(bpmCanvas, {
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
                    : [{ label: t('stats.chartNoData'), data: new Array(16).fill(null), borderColor: C.orange, borderWidth: 1.5 }],
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

    const donutCanvas = document.getElementById('stats-chart-donut') as HTMLCanvasElement | null;
    if (donutCanvas) {
        const entries = Object.entries(d.donut);
        const donutColors = [C.orange, C.blue, C.purple, C.teal, C.amber, '#ec4899'];
        chartRegistry.push(new Chart(donutCanvas, {
            type: 'doughnut',
            data: {
                labels: entries.length > 0 ? entries.map(([k]) => k) : [t('stats.donutNoData')],
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

    const cyclesCanvas = document.getElementById('stats-chart-cycles') as HTMLCanvasElement | null;
    if (cyclesCanvas && d.cycles.length > 0) {
        const maxCycles = Math.max(...d.cycles);
        chartRegistry.push(new Chart(cyclesCanvas, {
            type: 'bar',
            data: {
                labels: d.cycles.map((_, i) => `S${i + 1}`),
                datasets: [{
                    label: t('stats.chartCyclesTitle'),
                    data: d.cycles,
                    backgroundColor: d.cycles.map(v => v >= maxCycles * 0.8 ? C.orange : C.orangeA),
                    borderColor: C.orange, borderWidth: 2.5, borderRadius: 4, borderSkipped: false,
                }],
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: gridCol } },
                    y: { grid: { color: gridCol }, beginAtZero: true, title: { display: true, text: t('stats.chartCyclesYAxis'), color: textCol } },
                },
            },
        }));
    }

    return { weeklyChart };
}

// ── Compare view charts ───────────────────────────────────────────────────────

export function mountCompareCharts(p: UserStats, m: UserStats, chartRegistry: any[]): any {
    const gridCol = C.grid();
    const textCol = C.text();
    const cardCol = C.card();

    Chart.defaults.font.family = 'inherit';
    Chart.defaults.font.size   = 12;
    Chart.defaults.color       = textCol;

    const compareCanvas = document.getElementById('stats-chart-compare') as HTMLCanvasElement | null;
    if (compareCanvas) {
        const trendP = p.weekly.map((_, i, arr) => {
            const slice = arr.slice(Math.max(0, i - 2), i + 1);
            return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
        });
        const trendM = m.weekly.map((_, i, arr) => {
            const slice = arr.slice(Math.max(0, i - 2), i + 1);
            return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
        });

        chartRegistry.push(new Chart(compareCanvas, {
            type: 'bar',
            data: {
                labels: p.weekLabels,
                datasets: [
                    { label: 'Prashant',                   data: p.weekly, backgroundColor: C.orangeA, borderColor: C.orange, borderWidth: 2.5, borderRadius: 4, borderSkipped: false },
                    { label: 'Meera',                      data: m.weekly, backgroundColor: C.blueA,   borderColor: C.blue,   borderWidth: 2.5, borderRadius: 4, borderSkipped: false },
                    { label: t('stats.chartTrendP'), data: trendP,  type: 'line' as const, borderColor: C.orange, backgroundColor: 'transparent', borderWidth: 3, borderDash: [4, 3], pointRadius: 0, tension: 0.4 },
                    { label: t('stats.chartTrendM'), data: trendM,  type: 'line' as const, borderColor: C.blue,   backgroundColor: 'transparent', borderWidth: 3, borderDash: [4, 3], pointRadius: 0, tension: 0.4 },
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
        }));
    }

    const compareChart = chartRegistry[chartRegistry.length - 1] ?? null;

    // Build a shared colour map so the same taal/category always gets the same
    // colour in both donuts, regardless of each user's ordering.
    const DONUT_PALETTE = [C.orange, C.blue, C.purple, C.teal, C.amber, '#ec4899', '#10b981', '#f43f5e'];
    const allDonutKeys = Array.from(new Set([
        ...Object.keys(p.donut),
        ...Object.keys(m.donut),
    ])).sort();                               // deterministic alphabetical order
    const donutColorMap = new Map<string, string>();
    allDonutKeys.forEach((key, i) => donutColorMap.set(key, DONUT_PALETTE[i % DONUT_PALETTE.length]));

    [
        { canvasId: 'stats-chart-compare-donut-p', donut: p.donut },
        { canvasId: 'stats-chart-compare-donut-m', donut: m.donut },
    ].forEach(({ canvasId, donut }) => {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
        if (!canvas) return;
        const entries = Object.entries(donut);
        chartRegistry.push(new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: entries.length > 0 ? entries.map(([k]) => k) : [t('stats.donutNoData')],
                datasets: [{
                    data: entries.length > 0 ? entries.map(([, v]) => v) : [100],
                    backgroundColor: entries.length > 0
                        ? entries.map(([k]) => donutColorMap.get(k) ?? DONUT_PALETTE[0])
                        : ['#e2e8f0'],
                    borderWidth: 3, borderColor: cardCol, hoverOffset: 8,
                }],
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '60%',
                plugins: {
                    legend: { position: 'bottom' as const, labels: { boxWidth: 10, padding: 10, usePointStyle: true, font: { size: 10 } } },
                    tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}%` } },
                },
            },
        }));
    });

    return compareChart;
}

// ── Cumulative minutes chart ──────────────────────────────────────────────────

/**
 * Builds two arrays of cumulative minutes (one per user) aligned to a shared
 * timeline of months (oldest → newest). The timeline is derived from the union
 * of both users' sessions, covering the full historical range.
 */
function buildCumulativeData(
    pSessions: SupabaseSession[],
    mSessions: SupabaseSession[]
): { labels: string[]; cumP: number[]; cumM: number[] } {
    const MONTH_SHORT = tArray('stats.monthsShort');

    /** Returns 'YYYY-MM' for a session's date in Canary Island time. */
    const monthKey = (s: SupabaseSession): string => gcDateStr(s.saved_at).slice(0, 7);

    // Accumulate minutes per month for each user
    const minutesPerMonth = (sessions: SupabaseSession[]): Map<string, number> => {
        const map = new Map<string, number>();
        sessions.forEach(s => {
            const k = monthKey(s);
            map.set(k, (map.get(k) ?? 0) + Math.round(effectiveSecs(s) / 60));
        });
        return map;
    };

    const pMap = minutesPerMonth(pSessions);
    const mMap = minutesPerMonth(mSessions);

    // Build sorted union of all months from first session to today
    const allMonths = new Set([...pMap.keys(), ...mMap.keys()]);
    if (allMonths.size === 0) return { labels: [], cumP: [], cumM: [] };

    const sorted = Array.from(allMonths).sort();
    const first  = sorted[0];
    const nowKey = gcDateStr(new Date().toISOString()).slice(0, 7);

    // Fill every month between first and now (no gaps)
    const timeline: string[] = [];
    let cur = first;
    while (cur <= nowKey) {
        timeline.push(cur);
        const [y, mo] = cur.split('-').map(Number);
        const next = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`;
        cur = next;
    }

    // Compute running totals
    let cumP = 0;
    let cumM = 0;
    const outP: number[] = [];
    const outM: number[] = [];
    const labels: string[] = [];

    timeline.forEach(k => {
        cumP += pMap.get(k) ?? 0;
        cumM += mMap.get(k) ?? 0;
        outP.push(cumP);
        outM.push(cumM);
        const [, mo] = k.split('-').map(Number);
        const yearSuffix = k.slice(2, 4); // e.g. '24'
        labels.push(`${MONTH_SHORT[mo - 1]} '${yearSuffix}`);
    });

    return { labels, cumP: outP, cumM: outM };
}

export function mountCumulativeChart(p: UserStats, m: UserStats, chartRegistry: any[]): void {
    const canvas = document.getElementById('stats-chart-cumulative') as HTMLCanvasElement | null;
    if (!canvas) return;

    const gridCol = C.grid();
    const textCol = C.text();

    const { labels, cumP, cumM } = buildCumulativeData(p.rawSessions, m.rawSessions);

    if (labels.length === 0) return;

    // Gap dataset: positive = Prashant leads, negative = Meera leads
    const gap = cumP.map((v, i) => v - cumM[i]);

    chartRegistry.push(new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Prashant',
                    data: cumP,
                    borderColor: C.orange,
                    backgroundColor: 'rgba(249,115,22,0.12)',
                    borderWidth: 2.5,
                    pointRadius: 2,
                    pointHoverRadius: 6,
                    tension: 0.35,
                    fill: false,
                    yAxisID: 'y',
                },
                {
                    label: 'Meera',
                    data: cumM,
                    borderColor: C.blue,
                    backgroundColor: 'rgba(59,130,246,0.12)',
                    borderWidth: 2.5,
                    pointRadius: 2,
                    pointHoverRadius: 6,
                    tension: 0.35,
                    fill: false,
                    yAxisID: 'y',
                },
                {
                    label: t('stats.cumulativeGapLabel'),
                    data: gap,
                    borderColor: 'transparent',
                    backgroundColor: gap.map(v =>
                        v > 0 ? 'rgba(249,115,22,0.20)' : 'rgba(59,130,246,0.20)'
                    ),
                    borderWidth: 0,
                    pointRadius: 0,
                    tension: 0.35,
                    fill: 'origin',
                    yAxisID: 'yGap',
                    type: 'line' as const,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index' as const, intersect: false },
            plugins: {
                legend: {
                    display: true,
                    position: 'top' as const,
                    align: 'end' as const,
                    labels: { boxWidth: 12, padding: 16, usePointStyle: true,
                        filter: (item: any) => item.datasetIndex < 2 },
                },
                tooltip: {
                    callbacks: {
                        label: (ctx: any) => {
                            if (ctx.datasetIndex === 2) {
                                const v: number = ctx.parsed.y;
                                if (v === 0) return ` ${t('stats.cumulativeTied')}`;
                                const who = v > 0 ? 'Prashant' : 'Meera';
                                const abs  = Math.abs(v);
                                const fmt  = abs >= 60
                                    ? `${Math.floor(abs / 60)}h ${abs % 60 > 0 ? abs % 60 + 'm' : ''}`.trim()
                                    : `${abs}m`;
                                return ` ${t('stats.cumulativeLeads', who, fmt)}`;
                            }
                            const v: number = ctx.parsed.y;
                            const fmt = v >= 60
                                ? `${Math.floor(v / 60)}h ${v % 60 > 0 ? v % 60 + 'm' : ''}`.trim()
                                : `${v}m`;
                            return ` ${ctx.dataset.label}: ${fmt}`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    grid: { color: gridCol },
                    ticks: { maxRotation: 45, maxTicksLimit: 14, font: { size: 10 } },
                },
                y: {
                    position: 'left' as const,
                    grid: { color: gridCol },
                    beginAtZero: true,
                    title: { display: true, text: t('stats.cumulativeYAxis'), color: textCol },
                    ticks: {
                        callback: (v: number) => v >= 60
                            ? `${Math.floor(v / 60)}h`
                            : `${v}m`,
                    },
                },
                yGap: {
                    position: 'right' as const,
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: t('stats.cumulativeGapAxis'), color: textCol },
                    ticks: {
                        callback: (v: number) => {
                            const abs = Math.abs(v);
                            return abs >= 60 ? `${Math.floor(abs / 60)}h` : `${v}m`;
                        },
                    },
                },
            },
        },
    }));
}

// Made with Bob
