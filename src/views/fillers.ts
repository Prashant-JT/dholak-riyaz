import { createElement } from '../core/utils.js';
import type { View } from '../types.js';
import { FILLERS } from '../data/fillers.js';

export class FillersView implements View {
    public render(): HTMLElement {
        const container = createElement('div', { 
            id: 'fillers',
            className: 'view-container'
        });

        // Header
        const header = createElement('div', { className: 'mb-8' });
        header.appendChild(createElement('h2', {
            className: 'section-title'
        }, 'Pickups / Fillers / Cuts'));
        header.appendChild(createElement('p', {
            className: 'section-subtitle'
        }, 'Patrones rítmicos de relleno y transición'));
        container.appendChild(header);

        // Render each category
        FILLERS.forEach(filler => {
            const categorySection = this.createCategorySection(filler);
            container.appendChild(categorySection);
        });

        return container;
    }

    private createCategorySection(filler: { category: string; patterns: any[] }): HTMLElement {
        const section = createElement('div', { className: 'mb-8' });

        // Category title with consistent styling
        const title = createElement('h3', {
            className: 'section-title'
        }, filler.category);
        section.appendChild(title);

        // Grid layout for cards (like other views)
        const grid = createElement('div', {
            className: 'grid grid-cols-1 gap-4'
        });

        filler.patterns.forEach(pattern => {
            const card = this.createPatternCard(pattern);
            grid.appendChild(card);
        });

        section.appendChild(grid);
        return section;
    }

    private createPatternCard(pattern: any): HTMLElement {
        // Card container — usa clase 'card' para respetar variables CSS de tema
        const card = createElement('div', {
            className: 'card p-6 mb-4'
        });

        // Pattern name
        const nameDiv = createElement('div', {
            className: 'flex items-center justify-between mb-3'
        });

        const name = createElement('h4', {
            className: 'text-xl font-bold'
        }, pattern.name);
        nameDiv.appendChild(name);

        // Action button/icon
        if (pattern.link) {
            const linkBtn = createElement('a', {
                href: pattern.link,
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-slate-900 dark:text-white rounded-lg hover:bg-blue-600 transition-colors text-base font-semibold shadow-sm'
            });
            linkBtn.innerHTML = '🎥 Ver Tutorial';
            nameDiv.appendChild(linkBtn);
        }

        card.appendChild(nameDiv);

        // Note (if exists)
        if (pattern.note) {
            const note = createElement('p', {
                className: 'text-muted italic text-sm mt-2'
            }, pattern.note);
            card.appendChild(note);
        }

        return card;
    }
}

// Made with Bob
