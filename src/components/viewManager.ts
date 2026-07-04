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
        this.views.set(CONFIG.VIEWS.RIYAZ,  new SessionWizardView());
        this.views.set(CONFIG.VIEWS.STATS,  new StatsView());
        this.views.set(CONFIG.VIEWS.DASHBOARD, new DashboardView());
        this.views.set(CONFIG.VIEWS.GLOSARIO, new GlosarioView());
        this.views.set(CONFIG.VIEWS.KEHERWA, new TaalView('keherwa'));
        this.views.set(CONFIG.VIEWS.DADRA, new TaalView('dadra'));
        this.views.set(CONFIG.VIEWS.RUPAK, new TaalView('rupak'));
        this.views.set(CONFIG.VIEWS.DEEPCHANDI, new TaalView('deepchandi'));
        this.views.set(CONFIG.VIEWS.ADDHA, new TaalView('addha'));
        this.views.set(CONFIG.VIEWS.KAYDAS, new KaydasView());
        this.views.set(CONFIG.VIEWS.SONGS, new SongsView());
        this.views.set('fillers', new FillersView());
    }
    
    /**
     * Muestra una vista específica
     * @param viewId - ID de la vista
     */
    public showView(viewId: string): void {
        const view = this.views.get(viewId);
        if (view) {
            this.contentElement.innerHTML = '';
            try {
                this.contentElement.appendChild(view.render());
            } catch (error) {
                console.error('Error rendering view:', error);
            }
        }
    }
}

// Made with Bob
