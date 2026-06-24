/**
 * VIEW MANAGER
 * Gestiona el renderizado de vistas
 */

import { CONFIG } from '../core/config.js';
import { DashboardView } from '../views/dashboard.js';
import { GlosarioView } from '../views/glosario.js';
import { TaalView } from '../views/taals.js';
import { KaydasView } from '../views/kaydas.js';
import { FillersView } from '../views/fillers.js';
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
        this.views.set(CONFIG.VIEWS.DASHBOARD, new DashboardView());
        this.views.set(CONFIG.VIEWS.GLOSARIO, new GlosarioView());
        this.views.set(CONFIG.VIEWS.KEHERWA, new TaalView('keherwa'));
        this.views.set(CONFIG.VIEWS.DADRA, new TaalView('dadra'));
        this.views.set(CONFIG.VIEWS.RUPAK, new TaalView('rupak'));
        this.views.set(CONFIG.VIEWS.DEEPCHANDI, new TaalView('deepchandi'));
        this.views.set(CONFIG.VIEWS.KAYDAS, new KaydasView());
        this.views.set('fillers', new FillersView());
    }
    
    /**
     * Muestra una vista específica
     * @param viewId - ID de la vista
     */
    public showView(viewId: string): void {
        console.log('🎯 ViewManager.showView called with:', viewId);
        const view = this.views.get(viewId);
        
        if (view) {
            console.log('✅ View found:', viewId);
            this.contentElement.innerHTML = '';
            console.log('✅ Content cleared');
            try {
                console.log('🔄 Rendering view...');
                const rendered = view.render();
                console.log('✅ View rendered:', rendered);
                this.contentElement.appendChild(rendered);
                console.log('✅ View appended to DOM');
            } catch (error) {
                console.error('❌ Error al renderizar vista:', error);
            }
        } else {
            console.error('❌ Vista no encontrada:', viewId);
            console.log('Available views:', Array.from(this.views.keys()));
        }
    }
}

// Made with Bob
