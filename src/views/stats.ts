/**
 * STATS VIEW — Orchestrator
 * Thin shell: imports all logic from sub-modules, handles UI state and rendering.
 * Data → stats/statsData.ts | Charts → stats/statsCharts.ts
 * Medals → stats/medals.ts  | Types  → stats/statsTypes.ts
 */

import { createElement } from '../core/utils.js';
import { TAALS } from '../data/taals/index.js';
import { t, tArray } from '../i18n/index.js';
import type { View } from '../types.js';

// Re-export types consumed by other modules (wizardStep3, etc.)
export type { SupabaseSession, SupabaseBlock } from './stats/statsTypes.js';

import type { UserStats, SupabaseSession, SupabaseBlock } from './stats/statsTypes.js';
import { fetchUserStats, emptyStats, gcDateStr, gcTodayStr, ACTIVE_TAAL_IDS } from './stats/statsData.js';
import { computeMedals, TAAL_META, DEFAULT_TAAL_META } from './stats/medals.js';
import { C, mountCharts, mountCompareCharts } from './stats/statsCharts.js';

// ── Timezone constant (needed for local date formatting in the view) ───────────
import { CONFIG } from '../core/config.js';
const GC_TZ = CONFIG.TIMEZONE;

// ── View ──────────────────────────────────────────────────────────────────────

export class StatsView implements View {
    private activeUser: string = 'prashant';
    private charts: any[] = [];
    private userData: Record<string, UserStats> = {};
    private dataLoaded: boolean = false;
    private section!: HTMLElement;
    private weeklyMode: 'weeks' | 'days' = 'weeks';
    private weeklySelectedIdx: number = 15;
    private weeklyChart: any = null;

    public render(): HTMLElement {
        this.section = createElement('section', { id: 'stats', className: 'view-section' });

        const header = createElement('div', { className: 'mb-6' });
        header.appendChild(createElement('h2', { className: 'section-title' }, t('stats.pageTitle')));
        header.appendChild(createElement('p', { className: 'section-subtitle' }, t('stats.pageSubtitle')));
        this.section.appendChild(header);

        const tabsWrap = createElement('div', { className: 'stats-user-tabs' });
        [
            { id: 'prashant', label: t('stats.tabPrashant') },
            { id: 'meera',    label: t('stats.tabMeera')    },
            { id: 'compare',  label: t('stats.tabCompare')  },
        ].forEach(({ id, label }, idx) => {
            const btn = createElement('button', {
                className: `stats-user-tab${idx === 0 ? ' active' : ''}${id === 'compare' ? ' stats-user-tab--compare' : ''}`,
                dataset: { user: id },
            }, label);
            btn.addEventListener('click', () => {
                if (!this.dataLoaded) return;
                tabsWrap.querySelectorAll('.stats-user-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeUser = id;
                this.renderContent();
            });
            tabsWrap.appendChild(btn);
        });
        this.section.appendChild(tabsWrap);

        const content = createElement('div', { id: 'stats-content' });
        this.section.appendChild(content);

        this.showLoading(content);
        this.loadAndRender(content);

        return this.section;
    }

    // ── Data loading ──────────────────────────────────────────────────────────

    private showLoading(container: HTMLElement): void {
        container.innerHTML = '';
        const wrap = createElement('div', { className: 'stats-loading' });

        const msg = createElement('p', { className: 'stats-loading__msg' }, t('stats.loading'));
        const barOuter = createElement('div', { className: 'stats-loading__bar-outer' });
        const barInner = createElement('div', { className: 'stats-loading__bar-inner', id: 'stats-progress-bar' });
        barOuter.appendChild(barInner);
        const hint = createElement('p', { className: 'stats-loading__hint' }, t('stats.loadingHint'));

        wrap.appendChild(msg);
        wrap.appendChild(barOuter);
        wrap.appendChild(hint);
        container.appendChild(wrap);

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
            const [p, m] = await Promise.all([
                fetchUserStats('prashant').catch((err: unknown) => { console.warn('Stats prashant:', err); return emptyStats(); }),
                fetchUserStats('meera').catch((err: unknown)    => { console.warn('Stats meera:',    err); return emptyStats(); }),
            ]);

            const loadingWrap = content.querySelector('.stats-loading') as any;
            if (loadingWrap?._stopProgress) loadingWrap._stopProgress();

            await new Promise(r => setTimeout(r, 250));

            this.userData = { prashant: p, meera: m };
            this.dataLoaded = true;
            this.renderContent();
        } catch (err: unknown) {
            console.error('Error loading stats:', err);
            content.innerHTML = '';
            const errWrap = createElement('div', { className: 'stats-loading' });
            errWrap.innerHTML = `<p class="stats-loading__msg">${t('stats.errorMsg')}</p>
                <p class="stats-loading__hint">${t('stats.errorHint')}</p>`;
            const backBtn = createElement('button', { className: 'btn btn-primary' }, t('stats.backBtn'));
            backBtn.style.marginTop = '16px';
            backBtn.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('navigate', { detail: { viewId: 'riyaz' } }));
            });
            errWrap.appendChild(backBtn);
            content.appendChild(errWrap);
        }
    }

    private renderContent(): void {
        const content = document.getElementById('stats-content');
        if (!content) return;
        content.innerHTML = '';
        this.destroyCharts();

        if (this.activeUser === 'compare') {
            this.buildCompareView(content);
            return;
        }

        const d = this.userData[this.activeUser] ?? emptyStats();

        content.appendChild(this.buildKPIs(d));
        content.appendChild(this.buildInsight(d));
        content.appendChild(this.buildWeekCompare(d));
        content.appendChild(this.buildWeeklyCard(d));

        const heatCard = this.card();
        heatCard.appendChild(this.cardTitle(t('stats.heatmapTitle')));
        heatCard.appendChild(this.cardSub(t('stats.heatmapSub')));
        heatCard.appendChild(createElement('div', { id: 'stats-heatmap' }));
        heatCard.appendChild(this.buildHeatmapLegend());
        content.appendChild(heatCard);

        content.appendChild(this.buildHistoryCard(d));

        const row2 = createElement('div', { className: 'stats-chart-row' });
        row2.appendChild(this.buildChartCard(t('stats.chartBpmTitle'), t('stats.chartBpmSub'), 'stats-chart-bpm', 260, 'stats-canvas-medium'));
        row2.appendChild(this.buildChartCard(t('stats.chartDonutTitle'), t('stats.chartDonutSub'), 'stats-chart-donut', 260, 'stats-canvas-medium'));
        content.appendChild(row2);

        if (d.cycles.length > 0) {
            content.appendChild(this.buildChartCard(t('stats.chartCyclesTitle'), t('stats.chartCyclesSub'), 'stats-chart-cycles', 190, 'stats-canvas-short'));
        }

        content.appendChild(this.buildNextMedalCard(d));
        content.appendChild(this.buildMedalsCard(d));

        requestAnimationFrame(() => {
            this.mountAllCharts(d);
            this.buildHeatmap(d);
        });
    }

    // ── UI helpers ────────────────────────────────────────────────────────────

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

    // ── Weekly chart card with Weeks/Days toggle ──────────────────────────────

    private buildWeeklyCard(d: UserStats): HTMLElement {
        const card = this.card();

        const headerRow = createElement('div', { className: 'stats-weekly-header' });
        const titleWrap = createElement('div');
        titleWrap.appendChild(this.cardTitle(t('stats.weeklyTitle')));
        const subEl = createElement('p', { className: 'text-muted', id: 'stats-weekly-sub' });
        subEl.style.fontSize     = '0.8rem';
        subEl.style.marginBottom = '0';
        subEl.textContent = t('stats.weeklySub16');
        titleWrap.appendChild(subEl);
        headerRow.appendChild(titleWrap);

        const toggle = createElement('div', { className: 'stats-weekly-toggle' });
        const btnWeeks = createElement('button', { className: 'stats-weekly-btn active', id: 'stats-toggle-weeks' }, t('stats.weeklyBtnWeeks'));
        const btnDays  = createElement('button', { className: 'stats-weekly-btn',        id: 'stats-toggle-days'  }, t('stats.weeklyBtnDays'));
        toggle.appendChild(btnWeeks);
        toggle.appendChild(btnDays);
        headerRow.appendChild(toggle);
        card.appendChild(headerRow);

        const weekSel = createElement('div', { className: 'stats-week-selector', id: 'stats-week-selector' });
        weekSel.style.display = 'none';
        const selLabel = createElement('span', { className: 'text-muted' });
        selLabel.style.fontSize = '0.82rem';
        selLabel.textContent = t('stats.weeklySelLabel');
        const selPrev = createElement('button', { className: 'stats-week-nav', id: 'stats-week-prev' }, '‹');
        const selNext = createElement('button', { className: 'stats-week-nav', id: 'stats-week-next' }, '›');
        const selCurrent = createElement('span', { className: 'stats-week-label', id: 'stats-week-label' });
        weekSel.appendChild(selLabel);
        weekSel.appendChild(selPrev);
        weekSel.appendChild(selCurrent);
        weekSel.appendChild(selNext);
        card.appendChild(weekSel);

        const wrap = createElement('div', { className: 'stats-canvas-tall' });
        wrap.style.position = 'relative';
        wrap.style.height   = '230px';
        wrap.appendChild(createElement('canvas', { id: 'stats-chart-weekly' }));
        card.appendChild(wrap);

        const DAY_LABELS = tArray('stats.dayLabels');

        const updateSub = () => {
            const subNode = document.getElementById('stats-weekly-sub');
            if (!subNode) return;
            subNode.textContent = this.weeklyMode === 'weeks'
                ? t('stats.weeklySub16')
                : t('stats.weeklySubDay', d.weekLabels[this.weeklySelectedIdx]);
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
                chart.data.datasets[0].backgroundColor = C.orangeA;
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

    // ── Compare view ─────────────────────────────────────────────────────────

    private buildCompareView(content: HTMLElement): void {
        const p = this.userData['prashant'] ?? emptyStats();
        const m = this.userData['meera']    ?? emptyStats();

        const kpiSection = this.card();
        kpiSection.appendChild(this.cardTitle(t('stats.compareTitleKpi')));
        kpiSection.appendChild(this.cardSub(t('stats.compareSubKpi')));

        const kpiDefs = [
            { label: t('stats.compareKpiSessions'),    p: String(p.kpi.sessions), m: String(m.kpi.sessions) },
            { label: t('stats.compareKpiTime'),        p: p.kpi.time,             m: m.kpi.time             },
            { label: t('stats.compareKpiBpm'),         p: p.kpi.bpm > 0 ? String(p.kpi.bpm) : '—', m: m.kpi.bpm > 0 ? String(m.kpi.bpm) : '—' },
            { label: t('stats.compareKpiStreak'),      p: `${p.kpi.streak}d`,        m: `${m.kpi.streak}d`        },
            { label: t('stats.compareKpiWeekStreak'),  p: `${p.kpi.weekStreak}sem`,  m: `${m.kpi.weekStreak}sem`  },
        ];

        const kpiGrid = createElement('div', { className: 'stats-compare-grid' });
        kpiGrid.appendChild(createElement('div', { className: 'stats-compare-cell stats-compare-header' }));
        ['Prashant', 'Meera'].forEach((name, i) => {
            kpiGrid.appendChild(createElement('div', {
                className: `stats-compare-cell stats-compare-name stats-compare-name--${i === 0 ? 'p' : 'm'}`,
            }, name));
        });
        kpiDefs.forEach(k => {
            kpiGrid.appendChild(createElement('div', { className: 'stats-compare-cell stats-compare-label' }, k.label));
            kpiGrid.appendChild(createElement('div', { className: 'stats-compare-cell stats-compare-val stats-compare-val--p' }, k.p));
            kpiGrid.appendChild(createElement('div', { className: 'stats-compare-cell stats-compare-val stats-compare-val--m' }, k.m));
        });
        kpiSection.appendChild(kpiGrid);
        content.appendChild(kpiSection);

        const chartCard = this.card();
        chartCard.appendChild(this.cardTitle(t('stats.compareWeeklyTitle')));
        chartCard.appendChild(this.cardSub(t('stats.compareWeeklySub')));
        const wrap = createElement('div', { className: 'stats-canvas-tall' });
        wrap.style.position = 'relative';
        wrap.style.height   = '250px';
        wrap.appendChild(createElement('canvas', { id: 'stats-chart-compare' }));
        chartCard.appendChild(wrap);
        content.appendChild(chartCard);

        const distRow = createElement('div', { className: 'stats-chart-row' });
        [
            { title: t('stats.compareDonutP'), id: 'stats-chart-compare-donut-p' },
            { title: t('stats.compareDonutM'), id: 'stats-chart-compare-donut-m' },
        ].forEach(({ title, id }) => {
            const c = this.card();
            c.appendChild(this.cardTitle(title));
            const w = createElement('div', { className: 'stats-canvas-medium' });
            w.style.position = 'relative';
            w.style.height   = '220px';
            w.appendChild(createElement('canvas', { id }));
            c.appendChild(w);
            distRow.appendChild(c);
        });
        content.appendChild(distRow);

        const pm = computeMedals(p.rawSessions, m.rawSessions);
        const mm = computeMedals(m.rawSessions, p.rawSessions);
        const pmById = Object.fromEntries(pm.map(x => [x.id, x]));
        const mmById = Object.fromEntries(mm.map(x => [x.id, x]));

        const COMPARE_GROUPS = [
            { label: t('stats.compareGroupConsistency'), ids: ['first','s10','s50','streak7','streak30','streak60','streak100','streak365','week4'] },
            { label: t('stats.compareGroupVolume'),      ids: ['h1','h10','h50','h100','long','marathon'] },
            { label: t('stats.compareGroupVariety'),     ids: ['explorer', ...ACTIVE_TAAL_IDS, 'allActive','songs5','slow','bpm120','bpm180'] },
            { label: t('stats.compareGroupJoint'),       ids: ['jugalbandi','duo5','superjugal'] },
        ];

        const pEarned = pm.filter(medal => medal.earned).length;
        const mEarned = mm.filter(medal => medal.earned).length;
        const total   = pm.length;

        const legendCard = this.card();
        legendCard.style.paddingBottom = '12px';
        legendCard.style.marginBottom  = '8px';
        const legendTitle = createElement('div', { className: 'medals-compare-legend' });
        legendTitle.appendChild(this.cardTitle(t('stats.compareMedalsTitle')));
        const dots = createElement('div', { className: 'medals-compare-legend-dots' });
        ([['p', 'Prashant', pEarned], ['m', 'Meera', mEarned]] as [string, string, number][]).forEach(([k, name, earned]) => {
            const item = createElement('span', { className: 'medals-compare-legend-item' });
            item.appendChild(createElement('span', { className: `medals-compare-dot medals-compare-dot--${k}` }));
            item.appendChild(document.createTextNode(`${name} `));
            item.appendChild(createElement('span', { className: `medals-compare-count medals-compare-count--${k}` }, `${earned}/${total}`));
            dots.appendChild(item);
        });
        legendTitle.appendChild(dots);
        legendCard.appendChild(legendTitle);
        content.appendChild(legendCard);

        const medalGrid = createElement('div', { className: 'medals-compare-grid' });
        COMPARE_GROUPS.forEach(group => {
            const card = this.card();
            card.style.marginBottom = '0';
            card.appendChild(createElement('p', { className: 'medals-group-label' }, group.label));
            const cellGrid = createElement('div', { className: 'medals-cmp-cell-grid' });
            group.ids.forEach(id => {
                const pm_ = pmById[id];
                const mm_ = mmById[id];
                if (!pm_ || !mm_) return;
                const cell = createElement('div', { className: 'medals-cmp-cell' });
                cell.title = pm_.desc;
                const emojiEl = createElement('span', {
                    className: `medals-cmp-emoji${(!pm_.earned && !mm_.earned) ? ' medals-cmp-emoji--locked' : ''}`,
                }, pm_.emoji);
                cell.appendChild(emojiEl);
                cell.appendChild(createElement('span', { className: 'medals-cmp-name' }, pm_.name));
                const dotsEl = createElement('div', { className: 'medals-cmp-dots' });
                [pm_, mm_].forEach((medal, ui) => {
                    const dot = createElement('span', {
                        className: `medals-cmp-dot medals-cmp-dot--${ui === 0 ? 'p' : 'm'}${medal.earned ? ' medals-cmp-dot--on' : ''}`,
                    });
                    if (medal.earned && medal.earnedAt) dot.title = medal.earnedAt;
                    dotsEl.appendChild(dot);
                });
                cell.appendChild(dotsEl);
                cellGrid.appendChild(cell);
            });
            card.appendChild(cellGrid);
            medalGrid.appendChild(card);
        });
        content.appendChild(medalGrid);

        requestAnimationFrame(() => { mountCompareCharts(p, m, this.charts); });
    }

    // ── KPIs ──────────────────────────────────────────────────────────────────

    private buildKPIs(d: UserStats): HTMLElement {
        const grid = createElement('div', { className: 'stats-kpi-grid' });

        const avgMins = d.kpi.sessions > 0
            ? Math.round(d.rawSessions.reduce((s, x) => s + this.effectiveSecs(x), 0) / 60 / d.kpi.sessions)
            : 0;
        const avgStr = avgMins >= 60
            ? `${Math.floor(avgMins / 60)}h ${avgMins % 60 > 0 ? (avgMins % 60) + 'm' : ''}`.trim()
            : `${avgMins}m`;

        const DAY_NAMES_FULL = tArray('stats.dayNames');
        const sessionsByDay = new Array(7).fill(0);
        d.rawSessions.forEach(s => {
            const dow = new Date(gcDateStr(s.saved_at) + 'T12:00:00Z').getUTCDay();
            const idx = dow === 0 ? 6 : dow - 1;
            sessionsByDay[idx]++;
        });
        const bestDayIdx   = sessionsByDay.indexOf(Math.max(...sessionsByDay));
        const bestDayValue = d.kpi.sessions > 0 ? DAY_NAMES_FULL[bestDayIdx] : '—';
        const bestDaySub   = d.kpi.sessions > 0 ? t('stats.kpiBestDaySub', sessionsByDay[bestDayIdx]) : t('stats.kpiNoData');

        const maxSessionMins = d.kpi.sessions > 0
            ? Math.max(...d.rawSessions.map(s => Math.round(this.effectiveSecs(s) / 60)))
            : 0;
        const maxSessionStr = maxSessionMins >= 60
            ? `${Math.floor(maxSessionMins / 60)}h ${maxSessionMins % 60 > 0 ? (maxSessionMins % 60) + 'm' : ''}`.trim()
            : `${maxSessionMins}m`;

        const nowGC = new Date(gcTodayStr() + 'T12:00:00Z');
        const thisMonth = nowGC.getUTCMonth();
        const thisYear  = nowGC.getUTCFullYear();
        const daysInMonth = new Date(Date.UTC(thisYear, thisMonth + 1, 0)).getUTCDate();
        const daysThisMonth = new Set(
            d.rawSessions
                .map(s => gcDateStr(s.saved_at))
                .filter(dateStr => {
                    const d2 = new Date(dateStr + 'T12:00:00Z');
                    return d2.getUTCMonth() === thisMonth && d2.getUTCFullYear() === thisYear;
                })
        ).size;

        const kpis = [
            { label: t('stats.kpiSessions'),       value: String(d.kpi.sessions),                       sub: t('stats.kpiSessionsSub'),   badge: t('stats.kpiSessionsBadge'),   badgeCls: 'stats-badge--up' },
            { label: t('stats.kpiTime'),            value: d.kpi.time,                                   sub: t('stats.kpiTimeSub'),        badge: t('stats.kpiTimeBadge'),        badgeCls: 'stats-badge--up' },
            { label: t('stats.kpiAvg'),             value: d.kpi.sessions > 0 ? avgStr : '—',            sub: t('stats.kpiAvgSub'),         badge: t('stats.kpiAvgBadge'),         badgeCls: 'stats-badge--up' },
            { label: t('stats.kpiLongest'),         value: d.kpi.sessions > 0 ? maxSessionStr : '—',     sub: t('stats.kpiLongestSub'),     badge: t('stats.kpiLongestBadge'),     badgeCls: 'stats-badge--up' },
            { label: t('stats.kpiBpm'),             value: d.kpi.bpm > 0 ? String(d.kpi.bpm) : '—',     sub: t('stats.kpiBpmSub'),         badge: t('stats.kpiBpmBadge'),         badgeCls: 'stats-badge--up' },
            { label: t('stats.kpiBestDay'),         value: bestDayValue,                                  sub: bestDaySub,                   badge: t('stats.kpiBestDayBadge'),     badgeCls: 'stats-badge--up' },
            { label: t('stats.kpiDaysPracticed'),   value: d.kpi.sessions > 0 ? String(daysThisMonth) : '—', sub: t('stats.kpiDaysPracticedSub', daysInMonth), badge: t('stats.kpiDaysPracticedBadge'), badgeCls: 'stats-badge--up' },
        ];

        kpis.forEach(k => {
            const card = createElement('div', { className: 'card stats-kpi-card' });
            card.appendChild(createElement('div', { className: 'stats-kpi-label' }, k.label));
            card.appendChild(createElement('div', { className: 'stats-kpi-value' }, k.value));
            card.appendChild(createElement('div', { className: 'stats-kpi-sub'   }, k.sub));
            card.appendChild(createElement('span', { className: `stats-badge ${k.badgeCls}` }, k.badge));
            grid.appendChild(card);
        });

        const streakCard = createElement('div', { className: 'card stats-kpi-card stats-streak-card' });
        streakCard.appendChild(createElement('div', { className: 'stats-kpi-label' }, t('stats.streakLabel')));
        const streakRow = createElement('div', { className: 'stats-streak-row' });

        const dayBlock = createElement('div', { className: 'stats-streak-block' });
        dayBlock.appendChild(createElement('div', { className: 'stats-kpi-value' }, String(d.kpi.streak)));
        dayBlock.appendChild(createElement('div', { className: 'stats-kpi-sub' }, t('stats.streakDays')));
        streakRow.appendChild(dayBlock);
        streakRow.appendChild(createElement('div', { className: 'stats-streak-divider' }));

        const weekBlock = createElement('div', { className: 'stats-streak-block' });
        weekBlock.appendChild(createElement('div', { className: 'stats-kpi-value' }, String(d.kpi.weekStreak)));
        weekBlock.appendChild(createElement('div', { className: 'stats-kpi-sub' }, t('stats.streakWeeks')));
        streakRow.appendChild(weekBlock);
        streakRow.appendChild(createElement('div', { className: 'stats-streak-divider' }));

        const maxStreakBlock = createElement('div', { className: 'stats-streak-block stats-streak-block--record' });
        maxStreakBlock.appendChild(createElement('div', { className: 'stats-kpi-value stats-streak-record-value' }, String(d.kpi.maxStreak)));
        maxStreakBlock.appendChild(createElement('div', { className: 'stats-kpi-sub' }, t('stats.streakRecord')));
        streakRow.appendChild(maxStreakBlock);

        streakCard.appendChild(streakRow);
        const streakBadge = d.kpi.weekStreak > 0
            ? t('stats.streakBadge', d.kpi.weekStreak)
            : t('stats.streakNone');
        streakCard.appendChild(createElement('span', { className: 'stats-badge stats-badge--streak' }, streakBadge));
        grid.appendChild(streakCard);

        return grid;
    }

    // ── Insight ───────────────────────────────────────────────────────────────

    private buildInsight(d: UserStats): HTMLElement {
        const box = createElement('div', { className: 'stats-insight-box' });
        box.innerHTML = `💡 ${d.insight}`;
        return box;
    }

    // ── This week vs last week ────────────────────────────────────────────────

    private buildWeekCompare(d: UserStats): HTMLElement {
        const minsThis = d.weekly[15] ?? 0;
        const minsPrev = d.weekly[14] ?? 0;

        const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
        const now = new Date();
        const getMonday = (ref: Date): Date => {
            const day = ref.getDay();
            const result = new Date(ref);
            result.setDate(ref.getDate() - (day === 0 ? 6 : day - 1));
            result.setHours(0, 0, 0, 0);
            return result;
        };
        const thisMonday = getMonday(now);
        const prevMonday = new Date(thisMonday.getTime() - MS_WEEK);

        const sessionsThis = d.rawSessions.filter(s => {
            const tv = new Date(s.saved_at).getTime();
            return tv >= thisMonday.getTime() && tv < thisMonday.getTime() + MS_WEEK;
        });
        const sessionsPrev = d.rawSessions.filter(s => {
            const tv = new Date(s.saved_at).getTime();
            return tv >= prevMonday.getTime() && tv < thisMonday.getTime();
        });

        const maxBpmOf = (ss: SupabaseSession[]) =>
            ss.flatMap(s => s.blocks.map(b => b.bpm_end ?? 0)).reduce((mv, v) => Math.max(mv, v), 0);
        const bpmThis = maxBpmOf(sessionsThis);
        const bpmPrev = maxBpmOf(sessionsPrev);

        const delta = (curr: number, prev: number, unit: string): { text: string; cls: string } => {
            if (prev === 0 && curr === 0) return { text: '—', cls: 'week-cmp-delta--neutral' };
            if (prev === 0) return { text: `+${curr} ${unit}`, cls: 'week-cmp-delta--up' };
            const diff = curr - prev;
            if (diff > 0) return { text: `+${diff} ${unit}`, cls: 'week-cmp-delta--up' };
            if (diff < 0) return { text: `${diff} ${unit}`, cls: 'week-cmp-delta--down' };
            return { text: t('stats.weekCmpEqual'), cls: 'week-cmp-delta--neutral' };
        };

        const minsDelta = delta(minsThis,            minsPrev,            'min');
        const sessDelta = delta(sessionsThis.length, sessionsPrev.length, 'ses.');
        const bpmDelta  = delta(bpmThis,             bpmPrev,             'BPM');

        const fmtMins = (mn: number) => mn >= 60 ? `${Math.floor(mn/60)}h ${mn%60 > 0 ? mn%60+'m' : ''}`.trim() : `${mn}m`;

        const metrics = [
            { label: t('stats.weekCmpMinutes'),  thisVal: fmtMins(minsThis),          prevVal: fmtMins(minsPrev),          delta: minsDelta },
            { label: t('stats.weekCmpSessions'), thisVal: String(sessionsThis.length), prevVal: String(sessionsPrev.length), delta: sessDelta },
            { label: t('stats.weekCmpBpm'),      thisVal: bpmThis > 0 ? String(bpmThis) : '—', prevVal: bpmPrev > 0 ? String(bpmPrev) : '—', delta: bpmDelta },
        ];

        const card = this.card();
        const headerRow = createElement('div', { className: 'week-cmp-header' });
        const titleWrap = createElement('div');
        titleWrap.appendChild(this.cardTitle(t('stats.weekCmpTitle')));
        titleWrap.appendChild(this.cardSub(t('stats.weekCmpSub')));
        headerRow.appendChild(titleWrap);
        const colLabels = createElement('div', { className: 'week-cmp-col-labels' });
        colLabels.appendChild(createElement('span', { className: 'week-cmp-col-label week-cmp-col-label--this' }, t('stats.weekCmpThis')));
        colLabels.appendChild(createElement('span', { className: 'week-cmp-col-label week-cmp-col-label--prev' }, t('stats.weekCmpPrev')));
        headerRow.appendChild(colLabels);
        card.appendChild(headerRow);

        const gridEl = createElement('div', { className: 'week-cmp-grid' });
        metrics.forEach(metric => {
            const row = createElement('div', { className: 'week-cmp-row' });
            row.appendChild(createElement('span', { className: 'week-cmp-metric-label' }, metric.label));
            const thisCell = createElement('div', { className: 'week-cmp-cell week-cmp-cell--this' });
            thisCell.appendChild(createElement('span', { className: 'week-cmp-value' }, metric.thisVal));
            thisCell.appendChild(createElement('span', { className: `week-cmp-delta ${metric.delta.cls}` }, metric.delta.text));
            row.appendChild(thisCell);
            row.appendChild(createElement('div', { className: 'week-cmp-cell week-cmp-cell--prev' }));
            const prevCell = row.lastElementChild as HTMLElement;
            prevCell.appendChild(createElement('span', { className: 'week-cmp-value week-cmp-value--muted' }, metric.prevVal));
            gridEl.appendChild(row);
        });
        card.appendChild(gridEl);
        return card;
    }

    // ── Heatmap ───────────────────────────────────────────────────────────────

    private buildHeatmapLegend(): HTMLElement {
        const leg = createElement('div', { className: 'stats-hm-legend' });
        leg.appendChild(createElement('span', {}, t('stats.heatmapLess')));
        const cells = createElement('div', { className: 'stats-hm-legend-cells' });
        [0,1,2,3,4].forEach(i => cells.appendChild(createElement('div', { className: `stats-hm-cell stats-hm-${i}` })));
        leg.appendChild(cells);
        leg.appendChild(createElement('span', {}, t('stats.heatmapMore')));
        return leg;
    }

    private buildHeatmap(d: UserStats): void {
        const container = document.getElementById('stats-heatmap');
        if (!container) return;
        container.innerHTML = '';

        if (d.heatmap.length === 0) {
            container.textContent = t('stats.heatmapNoData');
            return;
        }

        const tooltips = tArray('stats.heatmapTooltips');
        d.heatmap.forEach(({ label, days }) => {
            const wrap = createElement('div', { style: { marginBottom: '14px' } });
            const lbl = createElement('div', { className: 'text-muted' });
            Object.assign(lbl.style, { fontSize: '0.7rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' });
            lbl.textContent = label;
            wrap.appendChild(lbl);
            const row = createElement('div', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap' } });
            days.forEach(val => {
                const cell = createElement('div', { className: `stats-hm-cell stats-hm-${val}` });
                cell.title = tooltips[val] ?? '';
                row.appendChild(cell);
            });
            wrap.appendChild(row);
            container.appendChild(wrap);
        });
    }

    // ── History with filters ──────────────────────────────────────────────────

    private buildHistoryCard(d: UserStats): HTMLElement {
        const PAGE_SIZE = 5;
        const card = this.card();
        card.appendChild(this.cardTitle(t('stats.historyTitle')));

        const filterRow = createElement('div', { className: 'stats-hist-filters' });

        const taalSel = createElement('select', { className: 'stats-hist-filter-sel' }) as HTMLSelectElement;
        const taalNames = [t('stats.historyTaalAll'), ...Array.from(
            new Set(d.rawSessions.flatMap(s => s.blocks.map(b => b.taal_name).filter(Boolean)))
        ).sort()];
        taalNames.forEach((name, i) => {
            taalSel.appendChild(createElement('option', { value: i === 0 ? '' : name! }, name!) as HTMLOptionElement);
        });
        filterRow.appendChild(taalSel);

        const MONTH_FULL = tArray('stats.monthsFull');
        const monthSel = createElement('select', { className: 'stats-hist-filter-sel' }) as HTMLSelectElement;
        monthSel.appendChild(createElement('option', { value: '' }, t('stats.historyMonthAll')) as HTMLOptionElement);
        const monthsSeen = new Set<string>();
        d.rawSessions.forEach(s => {
            const gc = gcDateStr(s.saved_at);
            monthsSeen.add(`${gc.slice(0,4)}-${String(parseInt(gc.slice(5,7)) - 1).padStart(2,'0')}`);
        });
        [...monthsSeen].sort().reverse().forEach(key => {
            const [yr, mo] = key.split('-');
            monthSel.appendChild(createElement('option', { value: key },
                `${MONTH_FULL[parseInt(mo)]} ${yr}`) as HTMLOptionElement);
        });
        filterRow.appendChild(monthSel);

        const resultCount = createElement('span', { className: 'stats-hist-count text-muted' });
        filterRow.appendChild(resultCount);
        card.appendChild(filterRow);

        const tableWrap = createElement('div', { style: { overflowX: 'auto' } });
        card.appendChild(tableWrap);

        const pagination = createElement('div', { className: 'stats-hist-pagination' });
        card.appendChild(pagination);

        const MONTH_SHORT = tArray('stats.monthsShort');
        let currentPage = 0;

        const renderPage = (filtered: SupabaseSession[]) => {
            const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
            if (currentPage >= totalPages) currentPage = totalPages - 1;
            const shown = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

            const start = filtered.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;
            const end   = Math.min((currentPage + 1) * PAGE_SIZE, filtered.length);
            resultCount.textContent = filtered.length === 0
                ? t('stats.historyCountZero')
                : t('stats.historyCount', start, end, filtered.length);

            tableWrap.innerHTML = this.buildHistoryHTML(shown, MONTH_SHORT);
            this.bindHistoryNotes(tableWrap);

            pagination.innerHTML = '';
            if (totalPages <= 1) return;

            const prevBtn = createElement('button', { className: `stats-page-btn${currentPage === 0 ? ' stats-page-btn--disabled' : ''}` }, '‹');
            if (currentPage > 0) {
                prevBtn.addEventListener('click', () => { currentPage--; renderPage(filtered); });
            }
            pagination.appendChild(prevBtn);

            const range = 2;
            const from  = Math.max(0, currentPage - range);
            const to    = Math.min(totalPages - 1, currentPage + range);
            if (from > 0) pagination.appendChild(createElement('span', { className: 'stats-page-ellipsis' }, '…'));
            for (let pg = from; pg <= to; pg++) {
                const btn = createElement('button', {
                    className: `stats-page-btn${pg === currentPage ? ' stats-page-btn--active' : ''}`
                }, String(pg + 1));
                const page = pg;
                btn.addEventListener('click', () => { currentPage = page; renderPage(filtered); });
                pagination.appendChild(btn);
            }
            if (to < totalPages - 1) pagination.appendChild(createElement('span', { className: 'stats-page-ellipsis' }, '…'));

            const nextBtn = createElement('button', { className: `stats-page-btn${currentPage === totalPages - 1 ? ' stats-page-btn--disabled' : ''}` }, '›');
            if (currentPage < totalPages - 1) {
                nextBtn.addEventListener('click', () => { currentPage++; renderPage(filtered); });
            }
            pagination.appendChild(nextBtn);
        };

        const applyFilters = () => {
            const taalFilter  = taalSel.value;
            const monthFilter = monthSel.value;
            let filtered = [...d.rawSessions].reverse();
            if (taalFilter) {
                filtered = filtered.filter(s => s.blocks.some(b => b.taal_name === taalFilter));
            }
            if (monthFilter) {
                const [yr, mo] = monthFilter.split('-').map(Number);
                filtered = filtered.filter(s => {
                    const gc = gcDateStr(s.saved_at);
                    return parseInt(gc.slice(0,4)) === yr && parseInt(gc.slice(5,7)) - 1 === mo;
                });
            }
            currentPage = 0;
            renderPage(filtered);
        };

        taalSel.addEventListener('change', applyFilters);
        monthSel.addEventListener('change', applyFilters);
        applyFilters();

        return card;
    }

    private buildHistoryHTML(sessions: SupabaseSession[], monthNames: string[]): string {
        if (sessions.length === 0) {
            return `<p class="text-muted text-sm" style="padding:12px 0">${t('stats.historyNoData')}</p>`;
        }

        const tagCls = (name: string) => {
            if (name === 'Warm Up' || name === 'Pickup') return 'stats-tag--slate';
            const match = ACTIVE_TAAL_IDS.find(id => TAALS[id].name.startsWith(name));
            return (match ? TAAL_META[match] : undefined)?.tagCls ?? DEFAULT_TAAL_META.tagCls;
        };

        const supportLabel = (b: SupabaseBlock): string => {
            if (!b.support_type) return '';
            if (b.support_type === 'metronome') return t('stats.historySupMetronome');
            if (b.support_type === 'song')      return t('stats.historySupSong',  b.support_ref ?? t('stats.historyPractice'));
            if (b.support_type === 'lehra')     return t('stats.historySupLehra', b.support_ref ?? 'Lehra');
            return b.support_type;
        };

        const rows = sessions.map((s, i) => {
            const gcStr = gcDateStr(s.saved_at);
            const date2 = new Date(gcStr + 'T12:00:00Z');
            const date  = `${date2.getUTCDate()} ${monthNames[date2.getUTCMonth()]} ${date2.getUTCFullYear()}`;
            const timeStr = new Intl.DateTimeFormat('en-GB', {
                timeZone: GC_TZ, hour: '2-digit', minute: '2-digit', hour12: false
            }).format(new Date(s.saved_at));
            const dur  = `${Math.round(this.effectiveSecs(s) / 60)} min`;
            const blockNames = s.blocks.map(b =>
                b.type === 'warmup'  ? t('stats.historyWarmUp')
                : b.type === 'pickup' ? t('stats.historyPickup')
                : (b.taal_name ?? t('stats.historyPractice'))
            );
            const tags = blockNames.map(b => `<span class="stats-tag ${tagCls(b)}">${b}</span>`).join('');

            const noteText = s.notes
                ? s.notes.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                : '';
            const noteHtml = s.notes ? `<div class="stats-block-note">💬 ${noteText}</div>` : '';

            const detailId = `stats-detail-row-${i}`;
            const blockDetailRows = s.blocks.map((b, bi) => {
                const blockLabel = b.type === 'warmup' ? t('stats.historyWarmUp')
                    : b.type === 'pickup' ? `${t('stats.historyPickup')}: ${b.pickup_name ?? ''}`
                    : `${b.taal_name ?? t('stats.historyPractice')}${b.variation_name ? ` · ${b.variation_name}` : ''}`;
                const kayda   = b.kayda_name ? `<span class="stats-block-meta-item">📋 ${b.kayda_name}</span>` : '';
                const bpmStr2 = (b.bpm_start || b.bpm_end)
                    ? `<span class="stats-block-meta-item">🎯 ${b.bpm_start ?? '?'} → ${b.bpm_end ?? '?'} BPM</span>` : '';
                const durStr  = b.duration_secs
                    ? `<span class="stats-block-meta-item">⏱ ${Math.round(b.duration_secs / 60)} min</span>` : '';
                const cycStr  = b.cycles_completed
                    ? `<span class="stats-block-meta-item">${t('stats.historyCycles', b.cycles_completed)}</span>` : '';
                const supStr  = b.support_type
                    ? `<span class="stats-block-meta-item">${supportLabel(b)}</span>` : '';
                return `<div class="stats-block-detail-row">
                    <span class="stats-block-detail-num">${bi + 1}</span>
                    <div class="stats-block-detail-body">
                        <span class="stats-block-detail-label">${blockLabel}</span>
                        <div class="stats-block-meta">${bpmStr2}${durStr}${cycStr}${kayda}${supStr}</div>
                    </div>
                </div>`;
            }).join('');

            const detailRow = `<tr id="${detailId}" class="stats-detail-row" style="display:none">
                <td colspan="5" class="stats-detail-cell">
                    <div class="stats-detail-inner">${blockDetailRows}${noteHtml}</div>
                </td>
            </tr>`;

            return `<tr class="stats-history-row stats-history-row--expandable" data-detail="${detailId}">
                <td style="white-space:nowrap;font-weight:600">${date}<br><span style="font-weight:400;font-size:0.75rem;color:var(--text-muted)">${t('stats.historyTimeAt')} ${timeStr}</span></td>
                <td style="white-space:nowrap;color:var(--text-muted)">${dur}</td>
                <td>${tags}</td>
                <td><span class="stats-expand-btn" title="${t('stats.expandBlocks')}">▶</span></td>
            </tr>${detailRow}`;
        }).join('');

        return `<table class="stats-history-table">
            <thead><tr>
                <th>${t('stats.historyColDate')}</th><th>${t('stats.historyColDur')}</th><th>${t('stats.historyColBlocks')}</th><th></th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
    }

    private bindHistoryNotes(container: HTMLElement): void {
        container.querySelectorAll<HTMLTableRowElement>('.stats-history-row--expandable').forEach(row => {
            row.addEventListener('click', () => {
                const targetId = row.dataset.detail ?? '';
                const detail = document.getElementById(targetId);
                if (!detail) return;
                const isOpen = detail.style.display !== 'none';
                detail.style.display = isOpen ? 'none' : 'table-row';
                const btn = row.querySelector<HTMLElement>('.stats-expand-btn');
                if (btn) btn.classList.toggle('stats-expand-btn--open', !isOpen);
            });
        });
    }

    // ── Next medal card ───────────────────────────────────────────────────────

    private buildNextMedalCard(d: UserStats): HTMLElement {
        const otherUser = this.activeUser === 'prashant' ? 'meera' : 'prashant';
        const otherSessions = this.userData[otherUser]?.rawSessions ?? [];
        const medals = computeMedals(d.rawSessions, otherSessions);

        const candidates = medals.filter(m => !m.earned && m.progressPct !== undefined && m.progressPct > 0);
        if (candidates.length === 0) return createElement('div');

        const next = candidates.reduce((best, m) => (m.progressPct! > best.progressPct! ? m : best), candidates[0]);

        const card = this.card();
        card.style.background = 'linear-gradient(135deg, var(--card-bg) 0%, color-mix(in srgb, var(--card-bg) 85%, #f97316 15%) 100%)';
        card.style.borderColor = '#f97316';

        const headerRow = createElement('div', { className: 'medals-header' });
        const titleWrap = createElement('div');
        titleWrap.appendChild(this.cardTitle(t('stats.nextMedalTitle')));
        titleWrap.appendChild(this.cardSub(t('stats.nextMedalSub')));
        headerRow.appendChild(titleWrap);
        card.appendChild(headerRow);

        const body      = createElement('div', { className: 'stats-next-medal' });
        const emojiEl   = createElement('div', { className: 'stats-next-medal__emoji' }, next.emoji);
        const info      = createElement('div', { className: 'stats-next-medal__info' });
        const nameEl    = createElement('div', { className: 'stats-next-medal__name' }, next.name);
        const descEl    = createElement('div', { className: 'stats-next-medal__desc' }, next.desc);
        const pWrap     = createElement('div', { className: 'stats-next-medal__progress-wrap' });
        const pBar      = createElement('div', { className: 'stats-next-medal__progress-bar' });
        const pFill     = createElement('div', { className: 'stats-next-medal__progress-fill' });
        pFill.style.width = `${next.progressPct}%`;
        pBar.appendChild(pFill);
        const pText = createElement('span', { className: 'stats-next-medal__progress-text' }, `${next.progress} — ${next.progressPct}%`);
        pWrap.appendChild(pBar);
        pWrap.appendChild(pText);
        info.appendChild(nameEl);
        info.appendChild(descEl);
        info.appendChild(pWrap);
        body.appendChild(emojiEl);
        body.appendChild(info);
        card.appendChild(body);

        return card;
    }

    // ── Medals grid ───────────────────────────────────────────────────────────

    private buildMedalsCard(d: UserStats): HTMLElement {
        const otherUser = this.activeUser === 'prashant' ? 'meera' : 'prashant';
        const otherSessions = this.userData[otherUser]?.rawSessions ?? [];
        const medals = computeMedals(d.rawSessions, otherSessions);
        const earned = medals.filter(m => m.earned).length;

        const card = this.card();
        const headerRow = createElement('div', { className: 'medals-header' });
        const titleWrap = createElement('div');
        titleWrap.appendChild(this.cardTitle(t('stats.medalsTitle')));
        titleWrap.appendChild(this.cardSub(t('stats.medalsSub', earned, medals.length)));
        headerRow.appendChild(titleWrap);

        const progressWrap = createElement('div', { className: 'medals-progress-wrap' });
        const progressBar  = createElement('div', { className: 'medals-progress-bar' });
        const pct = medals.length > 0 ? Math.round((earned / medals.length) * 100) : 0;
        progressBar.style.width = `${pct}%`;
        progressWrap.appendChild(progressBar);
        headerRow.appendChild(progressWrap);
        card.appendChild(headerRow);

        const GROUPS = [
            { label: t('stats.medalsGroupConsistency'), ids: ['first','s5','s10','s15','s25','s50','s100','streak7','streak14','streak30','streak60','streak100','streak365','week4','week8','week12'] },
            { label: t('stats.medalsGroupVolume'),      ids: ['h1','h3','h5','h10','h25','h50','h100','long','marathon'] },
            { label: t('stats.medalsGroupVariety'),     ids: ['explorer', ...ACTIVE_TAAL_IDS, 'allActive','songs5'] },
            { label: t('stats.medalsGroupSpeed'),       ids: ['slow','bpm120','bpm180'] },
            { label: t('stats.medalsGroupJoint'),       ids: ['jugalbandi','duo5','superjugal','maestro','duolegend','duo10h'] },
        ];
        const byId = Object.fromEntries(medals.map(m => [m.id, m]));

        GROUPS.forEach(group => {
            const groupEl = createElement('div', { className: 'medals-group' });
            groupEl.appendChild(createElement('p', { className: 'medals-group-label' }, group.label));
            const grid = createElement('div', { className: 'medals-grid' });

            group.ids.forEach(id => {
                const m = byId[id];
                if (!m) return;
                const cell = createElement('div', { className: `medals-cell${m.earned ? ' medals-cell--earned' : ''}` });

                const emojiEl = createElement('span', { className: 'medals-emoji' }, m.emoji);
                const nameEl  = createElement('span', { className: 'medals-name' }, m.name);
                const descEl  = createElement('span', { className: 'medals-desc' }, m.desc);
                cell.appendChild(emojiEl);
                cell.appendChild(nameEl);
                cell.appendChild(descEl);
                if (m.earned && m.earnedAt) {
                    cell.appendChild(createElement('span', { className: 'medals-date' }, m.earnedAt));
                }

                if (!m.earned && m.progress !== undefined) {
                    const pWrap = createElement('div', { className: 'medals-cell-progress' });
                    pWrap.appendChild(createElement('span', { className: 'medals-cell-progress__text' }, m.progress));
                    if (m.progressPct !== undefined && m.progressPct > 0) {
                        const bar  = createElement('div', { className: 'medals-cell-progress__bar' });
                        const fill = createElement('div', { className: 'medals-cell-progress__fill' });
                        fill.style.width = `${m.progressPct}%`;
                        bar.appendChild(fill);
                        pWrap.appendChild(bar);
                    }
                    cell.appendChild(pWrap);
                }

                cell.title = m.earned ? `${m.name} · ${m.earnedAt ?? ''}` : (m.progress ? `${m.desc} · ${m.progress}` : m.desc);
                grid.appendChild(cell);
            });
            groupEl.appendChild(grid);
            card.appendChild(groupEl);
        });

        return card;
    }

    // ── Chart lifecycle ───────────────────────────────────────────────────────

    private destroyCharts(): void {
        this.charts.forEach(c => { try { c.destroy(); } catch { /* noop */ } });
        this.charts = [];
        this.weeklyChart = null;
    }

    private mountAllCharts(d: UserStats): void {
        const { weeklyChart } = mountCharts(d, this.charts, this.weeklyMode, this.weeklySelectedIdx);
        this.weeklyChart = weeklyChart;
    }

    /** Inline helper — mirrors effectiveSecs from statsData to avoid a cross-import just for the view. */
    private effectiveSecs(s: SupabaseSession): number {
        const fromBlocks = s.blocks.reduce((sum, b) => sum + (b.duration_secs ?? 0), 0);
        return fromBlocks > 0 ? fromBlocks : s.total_secs;
    }
}

// Made with Bob
