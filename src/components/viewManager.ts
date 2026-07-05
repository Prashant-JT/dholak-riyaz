/**
 * VIEW MANAGER
 * Manages view rendering
 */

import { CONFIG } from '../core/config.js';
import { DashboardView } from '../views/dashboard.js';
import { GlosarioView } from '../views/glosario.js';
import { TaalView } from '../views/taals.js';
import { KaydasView } from '../views/kaydas.js';
import { SongsView } from '../views/songs.js';
import { FillersView } from '../views/fillers.js';
import { SessionWizardView } from '../views/riyaz/sessionWizard.js';
import { StatsView } from '../views/stats.js';
import { TAALS } from '../data/taals/index.js';
import type { View } from '../types.js';

export class ViewManager {
    private contentElement: HTMLElement;
    private views: Map<string, View>;
    
    constructor(contentId: string) {
        const content = document.getElementById(contentId);
        
        if (!content) {
            throw new Error('Content element not found');
        }
        
        this.contentElement = content;
        this.views = new Map();
        this.initializeViews();
    }
    
    /**
     * Initialise all views
     */
    private initializeViews(): void {
        // Fixed views
        this.views.set(CONFIG.VIEWS.RIYAZ,     new SessionWizardView());
        this.views.set(CONFIG.VIEWS.STATS,      new StatsView());
        this.views.set(CONFIG.VIEWS.DASHBOARD,  new DashboardView());
        this.views.set(CONFIG.VIEWS.GLOSARIO,   new GlosarioView());
        this.views.set(CONFIG.VIEWS.KAYDAS,     new KaydasView());
        this.views.set(CONFIG.VIEWS.SONGS,      new SongsView());
        this.views.set('fillers',               new FillersView());

        // Taal views — generated automatically from NAVIGATION
        CONFIG.NAVIGATION
            .filter(item => item.id in TAALS)
            .forEach(item => this.views.set(item.id, new TaalView(item.id)));
    }
    
    /**
     * Show a specific view
     * @param viewId - View ID
     */
    public showView(viewId: string): void {
        const view = this.views.get(viewId);
        if (!view) {
            console.warn(`[ViewManager] View not found: "${viewId}"`);
            this.contentElement.innerHTML = '';
            this.contentElement.appendChild(
                Object.assign(document.createElement('p'), {
                    className: 'text-muted text-center py-12',
                    textContent: `View "${viewId}" not found.`
                })
            );
            return;
        }
        this.contentElement.innerHTML = '';
        try {
            this.contentElement.appendChild(view.render());
        } catch (error) {
            console.error(`[ViewManager] Error rendering "${viewId}":`, error);
            // Show a visible error instead of a blank screen so the user is not stuck
            const msg = document.createElement('div');
            msg.style.cssText = 'padding:2rem;text-align:center;color:var(--text-muted)';
            msg.innerHTML = '<p style="font-size:1.1rem;margin-bottom:0.5rem">⚠️ Algo ha fallado al cargar esta vista.</p><p style="font-size:0.9rem">Recarga la página para continuar. Tu sesión está guardada.</p>';
            this.contentElement.appendChild(msg);
        }
    }
}

// Made with Bob
