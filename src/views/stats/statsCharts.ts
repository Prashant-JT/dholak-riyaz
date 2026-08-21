/**
 * STATS — Charts
 * Chart.js colour palette and all chart mounting functions.
 * Depends on Chart.js loaded globally from CDN.
 */

import { t, tArray } from '../../i18n/index.js';
import type { UserStats } from './statsTypes.js';

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

    const donutColors = [C.orange, C.blue, C.purple, C.teal, C.amber, '#ec4899'];
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
                datasets: [{ data: entries.length > 0 ? entries.map(([, v]) => v) : [100], backgroundColor: entries.length > 0 ? donutColors : ['#e2e8f0'], borderWidth: 3, borderColor: cardCol, hoverOffset: 8 }],
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

// Made with Bob
