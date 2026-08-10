import { createElement, createSectionHeader } from '../core/utils.js';
import { t, getLang } from '../i18n/index.js';
import type { View } from '../types.js';
import { FILLERS } from '../data/fillers.js';

export class FillersView implements View {
    public render(): HTMLElement {
        const container = createElement('div', {
            id: 'fillers',
            className: 'view-container'
        });

        // Header
        container.appendChild(createSectionHeader(t('fillers.pageTitle'), t('fillers.pageSubtitle')));

        // Search bar
        const searchWrapper = createElement('div', { className: 'songs-search-wrapper mb-6' });
        const searchInput = createElement('input', {
            type: 'text',
            className: 'songs-search-input',
            placeholder: t('fillers.searchPlaceholder')
        }) as HTMLInputElement;
        searchWrapper.appendChild(searchInput);
        container.appendChild(searchWrapper);

        // Results counter
        const totalPatterns = FILLERS.reduce((sum, f) => sum + f.patterns.length, 0);
        const fillersCounter = createElement('p', {
            className: 'text-muted text-sm mb-4'
        }, t('fillers.counter', totalPatterns));
        container.appendChild(fillersCounter);

        // Empty state
        const emptyMsg = createElement('p', {
            className: 'text-muted text-center py-6',
            style: { display: 'none' }
        }, t('fillers.empty'));
        container.appendChild(emptyMsg);

        // Render each category and track sections + cards
        const categorySections: { section: HTMLElement; cards: { el: HTMLElement; index: string }[] }[] = [];

        FILLERS.forEach(filler => {
            const { section, cards } = this.createCategorySection(filler);
            container.appendChild(section);
            categorySections.push({ section, cards });
        });

        // Filter logic: hide cards + hide empty category sections
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            let anyVisible = false;
            let visibleCount = 0;

            categorySections.forEach(({ section, cards }) => {
                let categoryHasVisible = false;
                cards.forEach(({ el, index }) => {
                    const visible = query === '' || index.includes(query);
                    el.style.display = visible ? '' : 'none';
                    if (visible) { categoryHasVisible = true; visibleCount++; }
                });
                section.style.display = categoryHasVisible ? '' : 'none';
                if (categoryHasVisible) anyVisible = true;
            });

            (emptyMsg as HTMLElement).style.display = anyVisible ? 'none' : '';
            fillersCounter.textContent = query
                ? t('fillers.counterFiltered', visibleCount, totalPatterns)
                : t('fillers.counter', totalPatterns);
        });

        return container;
    }

    private createCategorySection(filler: { category: string; patterns: any[] }): { section: HTMLElement; cards: { el: HTMLElement; index: string }[] } {
        const section = createElement('div', { className: 'mb-8' });

        // Category title with consistent styling
        const title = createElement('h3', {
            className: 'section-title'
        }, filler.category);
        section.appendChild(title);

        // Grid layout for cards
        const grid = createElement('div', { className: 'grid grid-cols-1 gap-4' });
        const cards: { el: HTMLElement; index: string }[] = [];

        filler.patterns.forEach(pattern => {
            const card = this.createPatternCard(pattern);
            const index = [filler.category, pattern.name, pattern.note ?? ''].join(' ').toLowerCase();
            grid.appendChild(card);
            cards.push({ el: card, index });
        });

        section.appendChild(grid);
        return { section, cards };
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
                className: 'songs-yt-btn'
            });
            linkBtn.innerHTML = t('fillers.tutorialBtn');
            nameDiv.appendChild(linkBtn);
        }

        card.appendChild(nameDiv);

        // Note (if exists)
        const noteText = getLang() === 'en' && pattern.note_en ? pattern.note_en : pattern.note;
        if (noteText) {
            const note = createElement('p', {
                className: 'text-muted italic text-sm mt-2'
            }, noteText);
            card.appendChild(note);
        }

        return card;
    }
}

// Made with Bob
