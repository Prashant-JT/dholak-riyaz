/**
 * NAVIGATION CONTROLLER
 * Gestiona la navegación entre vistas
 */

import { CONFIG } from '../core/config.js';
import { createElement } from '../core/utils.js';
import type { NavigateEventDetail } from '../types.js';

export class NavigationController {
    private menuElement: HTMLElement;
    private currentView: string;
    
    constructor(menuId: string, contentId: string) {
        const menu = document.getElementById(menuId);
        const content = document.getElementById(contentId);
        
        if (!menu || !content) {
            throw new Error('Navigation elements not found');
        }
        
        this.menuElement = menu;
        this.currentView = CONFIG.VIEWS.DASHBOARD;
    }
    
    /**
     * Renderiza el menú de navegación
     */
    public render(): void {
        CONFIG.NAVIGATION.forEach(item => {
            if (item.disabled) {
                // Disabled item — visible with badge, not navigable
                const wrapper = createElement('div', {
                    className: 'nav-item-disabled w-full px-4 py-3 rounded-lg mb-2 flex items-center justify-between'
                });
                wrapper.appendChild(createElement('span', {}, item.label));
                wrapper.appendChild(createElement('span', { className: 'nav-badge-soon' }, 'Pronto'));
                this.menuElement.appendChild(wrapper);
            } else {
                const button = createElement('button', {
                    className: `nav-item w-full text-left px-4 py-3 rounded-lg mb-2 transition-all ${
                        item.id === this.currentView
                            ? 'active'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }`,
                    dataset: { view: item.id }
                }, item.label);

                button.addEventListener('click', () => this.navigateTo(item.id));
                this.menuElement.appendChild(button);
            }

            // Divider after the item if marked
            if (item.separator) {
                const divider = createElement('div', { className: 'nav-divider' });
                this.menuElement.appendChild(divider);
            }
        });
    }
    
    /**
     * Navega a una vista específica
     * @param viewId - ID de la vista
     */
    public navigateTo(viewId: string): void {
        this.currentView = viewId;
        this.updateActiveState();
        
        // Disparar evento personalizado para que ViewManager lo maneje
        const event = new CustomEvent<NavigateEventDetail>('navigate', { 
            detail: { viewId } 
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Actualiza el estado activo de los botones de navegación
     */
    private updateActiveState(): void {
        const navItems = this.menuElement.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const element = item as HTMLElement;
            const isActive = element.dataset.view === this.currentView;
            
            if (isActive) {
                element.className = 'nav-item w-full text-left px-4 py-3 rounded-lg mb-2 transition-all active';
            } else {
                element.className = 'nav-item w-full text-left px-4 py-3 rounded-lg mb-2 transition-all text-slate-300 hover:text-white hover:bg-slate-700';
            }
        });
    }
}

// Made with Bob
