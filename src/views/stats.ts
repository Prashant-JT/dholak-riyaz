/**
 * STATS VIEW — Orchestrator
 * Thin shell: imports all logic from sub-modules, handles UI state and rendering.
 * Data       → stats/statsData.ts
 * Charts     → stats/statsCharts.ts
 * Medals     → stats/medals.ts
 * Types      → stats/statsTypes.ts
 * KPIs       → stats/statsKPIs.ts
 * Heatmap    → stats/statsHeatmap.ts
 * History    → stats/statsHistory.ts
 * MedalsUI   → stats/statsMedalsUI.ts
 * CompareUI  → stats/statsCompareUI.ts
 * Reviews    → stats/statsReviews*.ts (reactions/comments on recordings)
 * Storage    → stats/statsStorage*.ts (Supabase space used)
 */

import { createElement } from '../core/utils.js';
import { t, tArray } from '../i18n/index.js';
import type { View } from '../types.js';

// Re-export types consumed by other modules (wizardStep3, etc.)
export type { SupabaseSession, SupabaseBlock } from './stats/statsTypes.js';

import type { UserStats, ReviewStore, StorageUsage } from './stats/statsTypes.js';
import { fetchStorageUsage } from './stats/statsStorageData.js';
import { buildStorageWarning, buildStorageCard } from './stats/statsStorageUI.js';
import { fetchReviews } from './stats/statsReviewsData.js';
import { fetchUserStats, emptyStats, ACTIVE_TAAL_IDS } from './stats/statsData.js';
import { computeMedals } from './stats/medals.js';
import { C, mountCharts, mountCompareCharts, mountCumulativeChart } from './stats/statsCharts.js';
import { buildKPIs, buildInsight, buildWeekCompare, cardEl, cardTitle, cardSub } from './stats/statsKPIs.js';
import { buildHeatmap, buildHeatmapLegend } from './stats/statsHeatmap.js';
import { buildHistoryCard } from './stats/statsHistory.js';
import { buildNextMedalCard, buildMedalsCard } from './stats/statsMedalsUI.js';
import { buildHeadToHead, buildCompareMedals } from './stats/statsCompareUI.js';

// ── Medal groups — single source of truth used by both individual and compare views ──
function getMedalGroups(): { label: string; ids: string[] }[] {
    return [
        { label: t('stats.medalsGroupConsistency'), ids: ['first','s5','s10','s15','s25','s50','s100','streak7','streak14','streak30','streak60','streak100','streak365','week4','week8','week12'] },
        { label: t('stats.medalsGroupVolume'),      ids: ['h1','h3','h5','h10','h25','h50','h100','long','marathon'] },
        { label: t('stats.medalsGroupVariety'),     ids: ['explorer', ...ACTIVE_TAAL_IDS, 'allActive','songs5'] },
        { label: t('stats.medalsGroupSpeed'),       ids: ['slow','bpm120','bpm180'] },
        { label: t('stats.medalsGroupJoint'),       ids: ['jugalbandi','duo5','superjugal','maestro','duo20','duolegend','duo5h','duo50','duo10h','duo100','duo25h','duo50h'] },
    ];
}

// ── View ──────────────────────────────────────────────────────────────────────

export class StatsView implements View {
    private activeUser: string = 'prashant';
    private charts: any[] = [];
    private userData: Record<string, UserStats> = {};
    private dataLoaded: boolean = false;
    private stopProgress: (() => void) | null = null;   // loading bar interval of the current render
    private section!: HTMLElement;
    private weeklyMode: 'weeks' | 'days' | 'months' = 'weeks';
    private weeklySelectedIdx: number = 15;
    private weeklyChart: any = null;
    private compareMode: 'weeks' | 'months' = 'weeks';
    private compareChart: any = null;
    private reviews: ReviewStore = { enabled: false, items: [] };
    private storage: StorageUsage | null = null;

    public render(): HTMLElement {
        // Each visit refetches: tabs stay locked until this render's data arrives
        this.dataLoaded = false;
        this.stopProgress?.();
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
        ].forEach(({ id, label }) => {
            const btn = createElement('button', {
                className: `stats-user-tab${id === this.activeUser ? ' active' : ''}`,
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

        const msg      = createElement('p', { className: 'stats-loading__msg' }, t('stats.loading'));
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
        // Held on the view (not the DOM node) so it is cleared even if the node is gone
        this.stopProgress = () => {
            clearInterval(tick);
            barInner.style.width     = '100%';
            barInner.style.transition = 'width 0.3s ease';
            this.stopProgress = null;
        };
    }

    public onLeave(): void {
        this.destroyCharts();
        this.stopProgress?.();
    }

    private async loadAndRender(content: HTMLElement): Promise<void> {
        try {
            // One user failing to load shows "no sessions" for that user only; if
            // both fail (offline / Supabase down) it is an error, not empty data
            let failures = 0;
            const load = (user: string) => fetchUserStats(user).catch((err: unknown) => {
                console.warn(`Stats ${user}:`, err);
                failures++;
                return emptyStats();
            });
            // Reviews are optional: a missing table just hides the feature
            const loadReviews = fetchReviews().catch((err: unknown) => {
                console.warn('Recording reviews unavailable:', err);
                return null;
            });
            const [p, m, reviewItems, storage] = await Promise.all([
                load('prashant'), load('meera'), loadReviews, fetchStorageUsage(),
            ]);
            this.storage = storage;
            this.stopProgress?.();
            if (failures === 2) throw new Error('Could not load stats for any user');

            this.reviews = { enabled: reviewItems !== null, items: reviewItems ?? [] };

            await new Promise(r => setTimeout(r, 250));

            this.userData   = { prashant: p, meera: m };
            this.dataLoaded = true;
            // The user may have left Stats while the fetch was in flight
            if (!content.isConnected) return;
            this.renderContent();
        } catch (err: unknown) {
            console.error('Error loading stats:', err);
            this.stopProgress?.();
            if (!content.isConnected) return;
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

        // Shared space: the warning shows on every tab, the detail card at the bottom
        const warn = buildStorageWarning(this.storage);
        if (warn) content.appendChild(warn);

        if (this.activeUser === 'compare') {
            this.buildCompareView(content);
            const card = buildStorageCard(this.storage);
            if (card) content.appendChild(card);
            return;
        }

        const d           = this.userData[this.activeUser] ?? emptyStats();
        const otherUser   = this.activeUser === 'prashant' ? 'meera' : 'prashant';
        const otherSessions = this.userData[otherUser]?.rawSessions ?? [];

        content.appendChild(buildKPIs(d));
        content.appendChild(buildHistoryCard(d, this.reviews, () => this.renderContent()));
        content.appendChild(buildInsight(d));
        content.appendChild(buildWeekCompare(d));
        content.appendChild(this.buildWeeklyCard(d));

        const heatCard = cardEl();
        heatCard.appendChild(cardTitle(t('stats.heatmapTitle')));
        heatCard.appendChild(cardSub(t('stats.heatmapSub')));
        heatCard.appendChild(createElement('div', { id: 'stats-heatmap' }));
        heatCard.appendChild(buildHeatmapLegend());
        content.appendChild(heatCard);

        const row2 = createElement('div', { className: 'stats-chart-row' });
        row2.appendChild(this.buildChartCard(t('stats.chartBpmTitle'), t('stats.chartBpmSub'), 'stats-chart-bpm', 260, 'stats-canvas-medium'));
        row2.appendChild(this.buildChartCard(t('stats.chartDonutTitle'), t('stats.chartDonutSub'), 'stats-chart-donut', 260, 'stats-canvas-medium'));
        content.appendChild(row2);

        if (d.cycles.length > 0) {
            content.appendChild(this.buildChartCard(t('stats.chartCyclesTitle'), t('stats.chartCyclesSub'), 'stats-chart-cycles', 190, 'stats-canvas-short'));
        }

        content.appendChild(buildNextMedalCard(d, otherSessions));
        content.appendChild(buildMedalsCard(d, otherSessions, getMedalGroups()));
        const storageCard = buildStorageCard(this.storage);
        if (storageCard) content.appendChild(storageCard);

        requestAnimationFrame(() => {
            this.mountAllCharts(d);
            buildHeatmap(d);
        });
    }

    // ── Weekly chart card with Weeks/Days toggle ──────────────────────────────

    private buildWeeklyCard(d: UserStats): HTMLElement {
        const card = cardEl();

        const headerRow = createElement('div', { className: 'stats-weekly-header' });
        const titleWrap = createElement('div');
        titleWrap.appendChild(cardTitle(t('stats.weeklyTitle')));
        const subEl = createElement('p', { className: 'text-muted', id: 'stats-weekly-sub' });
        subEl.style.fontSize     = '0.8rem';
        subEl.style.marginBottom = '0';
        subEl.textContent = t('stats.weeklySub16');
        titleWrap.appendChild(subEl);
        headerRow.appendChild(titleWrap);

        const toggle = createElement('div', { className: 'stats-weekly-toggle' });
        const btnWeeks  = createElement('button', { className: 'stats-weekly-btn active', id: 'stats-toggle-weeks'  }, t('stats.weeklyBtnWeeks'));
        const btnDays   = createElement('button', { className: 'stats-weekly-btn',        id: 'stats-toggle-days'   }, t('stats.weeklyBtnDays'));
        const btnMonths = createElement('button', { className: 'stats-weekly-btn',        id: 'stats-toggle-months' }, t('stats.weeklyBtnMonths'));
        toggle.appendChild(btnWeeks);
        toggle.appendChild(btnDays);
        toggle.appendChild(btnMonths);
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
            if (this.weeklyMode === 'weeks')       subNode.textContent = t('stats.weeklySub16');
            else if (this.weeklyMode === 'months') subNode.textContent = t('stats.weeklySubMonths');
            else                                   subNode.textContent = t('stats.weeklySubDay', d.weekLabels[this.weeklySelectedIdx]);
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
                chart.data.datasets[0].label = t('stats.weeklyDataLabel');
                chart.data.datasets[0].data = d.weekly;
                chart.data.datasets[0].backgroundColor = C.orangeA;
                chart.data.datasets[1].data = trend;
                chart.data.datasets[1].hidden = false;
            } else if (this.weeklyMode === 'months') {
                const trend = d.monthly.map((_, i, arr) => {
                    const slice = arr.slice(Math.max(0, i - 2), i + 1);
                    return Math.round(slice.reduce((a: number, b: number) => a + b, 0) / slice.length);
                });
                chart.data.labels = d.monthLabels;
                chart.data.datasets[0].label = t('stats.weeklyDataLabelMonths');
                chart.data.datasets[0].data = d.monthly;
                chart.data.datasets[0].backgroundColor = C.orangeA;
                chart.data.datasets[1].data = trend;
                chart.data.datasets[1].hidden = false;
            } else {
                const days = d.weekDays[this.weeklySelectedIdx] ?? new Array(7).fill(0);
                chart.data.labels = DAY_LABELS;
                chart.data.datasets[0].label = t('stats.weeklyDataLabel');
                chart.data.datasets[0].data = days;
                chart.data.datasets[0].backgroundColor = days.map((v: number) => v > 0 ? C.orange : C.orangeA);
                chart.data.datasets[1].data = new Array(7).fill(null);
                chart.data.datasets[1].hidden = true;
            }
            chart.update();
            updateSub();
        };

        const setActiveBtn = (active: HTMLElement) => {
            [btnWeeks, btnDays, btnMonths].forEach(b => b.classList.remove('active'));
            active.classList.add('active');
        };

        btnWeeks.addEventListener('click', () => {
            this.weeklyMode = 'weeks';
            setActiveBtn(btnWeeks);
            weekSel.style.display = 'none';
            switchChart();
        });

        btnDays.addEventListener('click', () => {
            this.weeklyMode = 'days';
            setActiveBtn(btnDays);
            weekSel.style.display = 'flex';
            updateWeekLabel();
            switchChart();
        });

        btnMonths.addEventListener('click', () => {
            this.weeklyMode = 'months';
            setActiveBtn(btnMonths);
            weekSel.style.display = 'none';
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

        // The mode survives a re-render (user tab switch): show the matching header
        // straight away — the card is detached here, so set the nodes directly
        subEl.textContent = this.weeklyMode === 'weeks' ? t('stats.weeklySub16')
            : this.weeklyMode === 'months' ? t('stats.weeklySubMonths')
            : t('stats.weeklySubDay', d.weekLabels[this.weeklySelectedIdx]);
        selCurrent.textContent = d.weekLabels[this.weeklySelectedIdx] ?? '';
        setActiveBtn(this.weeklyMode === 'weeks' ? btnWeeks : this.weeklyMode === 'months' ? btnMonths : btnDays);
        weekSel.style.display = this.weeklyMode === 'days' ? 'flex' : 'none';

        return card;
    }

    // ── Chart card helper ─────────────────────────────────────────────────────

    private buildChartCard(title: string, sub: string, canvasId: string, height: number, canvasCls = ''): HTMLElement {
        const card = cardEl();
        card.appendChild(cardTitle(title));
        card.appendChild(cardSub(sub));
        const wrap = createElement('div', { className: canvasCls });
        wrap.style.position = 'relative';
        wrap.style.height   = `${height}px`;
        wrap.appendChild(createElement('canvas', { id: canvasId }));
        card.appendChild(wrap);
        return card;
    }

    // ── Compare view ──────────────────────────────────────────────────────────

    private buildCompareView(content: HTMLElement): void {
        const p = this.userData['prashant'] ?? emptyStats();
        const m = this.userData['meera']    ?? emptyStats();

        content.appendChild(buildHeadToHead(p, m));

        const chartCard    = cardEl();
        const cmpHeader    = createElement('div', { className: 'stats-weekly-header' });
        const cmpTitleWrap = createElement('div');
        cmpTitleWrap.appendChild(cardTitle(t('stats.compareWeeklyTitle')));
        const cmpSubEl = createElement('p', { className: 'text-muted', id: 'stats-compare-sub' });
        cmpSubEl.style.fontSize     = '0.8rem';
        cmpSubEl.style.marginBottom = '0';
        cmpSubEl.textContent = t('stats.compareWeeklySub');
        cmpTitleWrap.appendChild(cmpSubEl);
        cmpHeader.appendChild(cmpTitleWrap);

        const cmpToggle    = createElement('div', { className: 'stats-weekly-toggle' });
        const cmpBtnWeeks  = createElement('button', { className: 'stats-weekly-btn active', id: 'stats-cmp-toggle-weeks'  }, t('stats.compareBtnWeeks'));
        const cmpBtnMonths = createElement('button', { className: 'stats-weekly-btn',        id: 'stats-cmp-toggle-months' }, t('stats.compareBtnMonths'));
        cmpToggle.appendChild(cmpBtnWeeks);
        cmpToggle.appendChild(cmpBtnMonths);
        cmpHeader.appendChild(cmpToggle);
        chartCard.appendChild(cmpHeader);

        const wrap = createElement('div', { className: 'stats-canvas-tall' });
        wrap.style.position = 'relative';
        wrap.style.height   = '250px';
        wrap.appendChild(createElement('canvas', { id: 'stats-chart-compare' }));
        chartCard.appendChild(wrap);
        content.appendChild(chartCard);

        const updateCompareSub = () => {
            const el = document.getElementById('stats-compare-sub');
            if (el) el.textContent = this.compareMode === 'weeks' ? t('stats.compareWeeklySub') : t('stats.compareMonthlySub');
        };

        const switchCompareChart = () => {
            if (!this.compareChart) return;
            const chart = this.compareChart;
            if (this.compareMode === 'weeks') {
                const trendP = p.weekly.map((_, i, arr) => { const s = arr.slice(Math.max(0, i - 2), i + 1); return Math.round(s.reduce((a: number, b: number) => a + b, 0) / s.length); });
                const trendM = m.weekly.map((_, i, arr) => { const s = arr.slice(Math.max(0, i - 2), i + 1); return Math.round(s.reduce((a: number, b: number) => a + b, 0) / s.length); });
                chart.data.labels = p.weekLabels;
                chart.data.datasets[0].data = p.weekly;
                chart.data.datasets[1].data = m.weekly;
                chart.data.datasets[2].data = trendP;
                chart.data.datasets[3].data = trendM;
            } else {
                const trendP = p.monthly.map((_, i, arr) => { const s = arr.slice(Math.max(0, i - 2), i + 1); return Math.round(s.reduce((a: number, b: number) => a + b, 0) / s.length); });
                const trendM = m.monthly.map((_, i, arr) => { const s = arr.slice(Math.max(0, i - 2), i + 1); return Math.round(s.reduce((a: number, b: number) => a + b, 0) / s.length); });
                chart.data.labels = p.monthLabels;
                chart.data.datasets[0].data = p.monthly;
                chart.data.datasets[1].data = m.monthly;
                chart.data.datasets[2].data = trendP;
                chart.data.datasets[3].data = trendM;
            }
            chart.update();
            updateCompareSub();
        };

        cmpBtnWeeks.addEventListener('click', () => {
            this.compareMode = 'weeks';
            cmpBtnWeeks.classList.add('active');
            cmpBtnMonths.classList.remove('active');
            switchCompareChart();
        });
        cmpBtnMonths.addEventListener('click', () => {
            this.compareMode = 'months';
            cmpBtnMonths.classList.add('active');
            cmpBtnWeeks.classList.remove('active');
            switchCompareChart();
        });

        const cumCard = cardEl();
        cumCard.appendChild(cardTitle(t('stats.cumulativeTitle')));
        cumCard.appendChild(cardSub(t('stats.cumulativeSub')));
        const cumWrap = createElement('div');
        cumWrap.style.position = 'relative';
        cumWrap.style.height   = '280px';
        cumWrap.appendChild(createElement('canvas', { id: 'stats-chart-cumulative' }));
        cumCard.appendChild(cumWrap);
        content.appendChild(cumCard);

        const distRow = createElement('div', { className: 'stats-chart-row' });
        [
            { title: t('stats.compareDonutP'), id: 'stats-chart-compare-donut-p' },
            { title: t('stats.compareDonutM'), id: 'stats-chart-compare-donut-m' },
        ].forEach(({ title, id }) => {
            const c = cardEl();
            c.appendChild(cardTitle(title));
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
        content.appendChild(buildCompareMedals(pm, mm, getMedalGroups().flatMap(g => g.ids)));

        requestAnimationFrame(() => {
            mountCumulativeChart(p, m, this.charts);
            this.compareChart = mountCompareCharts(p, m, this.charts);
            if (this.compareMode === 'months') {
                document.getElementById('stats-cmp-toggle-weeks')?.classList.remove('active');
                document.getElementById('stats-cmp-toggle-months')?.classList.add('active');
                const chart = this.compareChart;
                if (chart) {
                    const trendP = p.monthly.map((_, i, arr) => { const s = arr.slice(Math.max(0, i - 2), i + 1); return Math.round(s.reduce((a: number, b: number) => a + b, 0) / s.length); });
                    const trendM = m.monthly.map((_, i, arr) => { const s = arr.slice(Math.max(0, i - 2), i + 1); return Math.round(s.reduce((a: number, b: number) => a + b, 0) / s.length); });
                    chart.data.labels = p.monthLabels;
                    chart.data.datasets[0].data = p.monthly;
                    chart.data.datasets[1].data = m.monthly;
                    chart.data.datasets[2].data = trendP;
                    chart.data.datasets[3].data = trendM;
                    chart.update();
                }
            }
        });
    }

    // ── Chart lifecycle ───────────────────────────────────────────────────────

    private destroyCharts(): void {
        this.charts.forEach(c => { try { c.destroy(); } catch { /* noop */ } });
        this.charts     = [];
        this.weeklyChart = null;
    }

    private mountAllCharts(d: UserStats): void {
        const { weeklyChart } = mountCharts(d, this.charts, this.weeklyMode, this.weeklySelectedIdx);
        this.weeklyChart = weeklyChart;
    }
}

