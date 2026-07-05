/**
 * VIEW MANAGER
 * Gestiona el renderizado de vistas
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
     * Inicializa todas las vistas
     */
    private initializeViews(): void {
        // Vistas fijas
        this.views.set(CONFIG.VIEWS.RIYAZ,     new SessionWizardView());
        this.views.set(CONFIG.VIEWS.STATS,      new StatsView());
        this.views.set(CONFIG.VIEWS.DASHBOARD,  new DashboardView());
        this.views.set(CONFIG.VIEWS.GLOSARIO,   new GlosarioView());
        this.views.set(CONFIG.VIEWS.KAYDAS,     new KaydasView());
        this.views.set(CONFIG.VIEWS.SONGS,      new SongsView());
        this.views.set('fillers',               new FillersView());

        // Vistas de taals — generadas automáticamente desde NAVIGATION
        CONFIG.NAVIGATION
            .filter(item => item.id in TAALS)
            .forEach(item => this.views.set(item.id, new TaalView(item.id)));
    }
    
    /**
     * Muestra una vista específica
     * @param viewId - ID de la vista
     */
    public showView(viewId: string): void {
        const view = this.views.get(viewId);
        if (!view) {
            console.warn(`[ViewManager] Vista no encontrada: "${viewId}"`);
            this.contentElement.innerHTML = '';
            this.contentElement.appendChild(
                Object.assign(document.createElement('p'), {
                    className: 'text-muted text-center py-12',
                    textContent: `Vista "${viewId}" no encontrada.`
                })
            );
            return;
        }
        this.contentElement.innerHTML = '';
        try {
            this.contentElement.appendChild(view.render());
        } catch (error) {
            console.error(`[ViewManager] Error al renderizar "${viewId}":`, error);
        }
    }
}

// Made with Bob
