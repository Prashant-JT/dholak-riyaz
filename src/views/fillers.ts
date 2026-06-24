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
            className: 'text-slate-600 text-lg'
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
            className: 'text-2xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-orange-500'
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
        // Card container with consistent styling
        const card = createElement('div', {
            className: 'bg-white rounded-xl p-6 shadow-sm border-2 border-slate-200 hover:border-orange-300 hover:shadow-md transition-all duration-200'
        });

        // Pattern name
        const nameDiv = createElement('div', {
            className: 'flex items-center justify-between mb-3'
        });

        const name = createElement('h4', {
            className: 'text-xl font-bold text-slate-800'
        }, pattern.name);
        nameDiv.appendChild(name);

        // Action button/icon
        if (pattern.link) {
            const linkBtn = createElement('a', {
                href: pattern.link,
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium'
            });
            linkBtn.innerHTML = '🎥 Ver';
            nameDiv.appendChild(linkBtn);
        } else if (pattern.hasAudio) {
            const audioBtn = createElement('button', {
                className: 'inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition-colors text-2xl'
            });
            audioBtn.innerHTML = '🔊';
            nameDiv.appendChild(audioBtn);
        }

        card.appendChild(nameDiv);

        // Note (if exists)
        if (pattern.note) {
            const note = createElement('p', {
                className: 'text-slate-600 italic text-sm mt-2'
            }, pattern.note);
            card.appendChild(note);
        }

        return card;
    }
}

// Made with Bob
