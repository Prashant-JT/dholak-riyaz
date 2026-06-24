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

        // Category title
        const title = createElement('h3', {
            className: 'text-2xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-orange-500'
        }, filler.category);
        section.appendChild(title);

        // Table with borders - mobile responsive
        const tableWrapper = createElement('div', {
            className: 'overflow-x-auto'
        });
        
        const table = createElement('table', {
            className: 'w-full border-collapse'
        });
        table.style.border = '2px solid #1e293b';
        table.style.minWidth = '100%';

        const tbody = createElement('tbody');

        filler.patterns.forEach(pattern => {
            const row = createElement('tr');
            row.style.borderBottom = '1px solid #cbd5e1';

            // Pattern name cell
            const nameCell = createElement('td', {
                className: 'p-4 text-lg font-medium text-slate-800'
            });
            nameCell.style.border = '1px solid #cbd5e1';
            nameCell.style.backgroundColor = '#ffffff';

            // Just set the text without any underline
            nameCell.textContent = pattern.name;

            row.appendChild(nameCell);

            // Link/Audio/Note cell
            const actionCell = createElement('td', {
                className: 'p-4 text-right'
            });
            actionCell.style.border = '1px solid #cbd5e1';
            actionCell.style.backgroundColor = '#ffffff';

            if (pattern.link) {
                const link = createElement('a', {
                    href: pattern.link,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    className: 'text-blue-600 hover:text-blue-800 underline'
                }, pattern.link);
                actionCell.appendChild(link);
            } else if (pattern.hasAudio) {
                const audioIcon = createElement('span', {
                    className: 'inline-flex items-center justify-center w-10 h-10 bg-slate-200 rounded-full text-2xl'
                });
                audioIcon.innerHTML = '🔊';
                actionCell.appendChild(audioIcon);
            } else if (pattern.note) {
                const note = createElement('span', {
                    className: 'text-slate-600 italic'
                }, pattern.note);
                actionCell.appendChild(note);
            }

            row.appendChild(actionCell);
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        section.appendChild(tableWrapper);

        return section;
    }
}

// Made with Bob
