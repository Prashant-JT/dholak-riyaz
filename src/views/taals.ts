/**
 * TAAL VIEW
 * Generic view for any taal
 */

import { createElement, applyBolIndicators, bolsHaveIndicators, createBolIndicatorsLegend, chunkArray, VIBHAG_DIVIDERS } from '../core/utils.js';
import { TAALS } from '../data/taals/index.js';
import { t, getLang } from '../i18n/index.js';
import type { View, Taal, TaalVariation, Matra } from '../types.js';

export class TaalView implements View {
    private taalData: Taal;
    private taalId: string;
    
    constructor(taalId: string) {
        this.taalId = taalId;
        this.taalData = TAALS[taalId];
        
        if (!this.taalData) {
            throw new Error(`Taal not found: ${taalId}`);
        }
    }
    
    public render(): HTMLElement {
        const section = createElement('section', {
            id: this.taalId,
            className: 'view-section'
        });
        
        const header = createElement('div', { className: 'mb-8' });
        const isEn = getLang() === 'en';
        header.appendChild(createElement('h2', {
            className: 'section-title'
        }, `${this.taalData.name} (${t('taal.beatsUnit', this.taalData.beats)})`));
        header.appendChild(createElement('p', {
            className: 'section-subtitle'
        }, `${isEn ? (this.taalData.description_en ?? this.taalData.description) : this.taalData.description} - ${isEn ? (this.taalData.subtitle_en ?? this.taalData.subtitle) : this.taalData.subtitle}`));
        section.appendChild(header);
        
        // Tutorial link (if exists)
        if (this.taalData.tutorial) {
            section.appendChild(this.createTutorialLink());
        }
        
        // Main pattern
        section.appendChild(this.createTaalCard(t('taal.mainPattern'), this.taalData.rows, undefined, undefined));
        
        // Variations (if exist)
        if (this.taalData.variations && this.taalData.variations.length > 0) {
            const normal  = this.taalData.variations.filter(v => !v.special);
            const special = this.taalData.variations.filter(v => v.special);

            // Search bar (only when there are variations)
            const searchWrapper = createElement('div', { className: 'songs-search-wrapper mb-6' });
            const searchInput = createElement('input', {
                type: 'text',
                className: 'songs-search-input',
                placeholder: t('taal.searchPlaceholder')
            }) as HTMLInputElement;
            searchWrapper.appendChild(searchInput);
            section.appendChild(searchWrapper);

            // Empty state message
            const emptyMsg = createElement('p', {
                className: 'text-muted text-center py-6',
                style: { display: 'none' }
            }, t('taal.searchEmpty'));
            section.appendChild(emptyMsg);

            // Render variation cards and tag them with searchable text
            const variationCards: HTMLElement[] = [];

            normal.forEach(variation => {
                const vName = isEn ? (variation.name_en ?? variation.name) : variation.name;
                const vDesc = isEn ? (variation.description_en ?? variation.description) : variation.description;
                const card = this.createTaalCard(vName, variation.rows, vDesc, variation, isEn);
                card.dataset['search'] = this.buildSearchIndex(variation);
                section.appendChild(card);
                variationCards.push(card);
            });

            let specialDivider: HTMLElement | null = null;
            if (special.length > 0) {
                specialDivider = createElement('div', { className: 'filler-special-divider' });
                specialDivider.appendChild(createElement('span', { className: 'filler-special-label' }, t('taal.specialDivider')));
                section.appendChild(specialDivider);

                special.forEach(variation => {
                    const vName = isEn ? (variation.name_en ?? variation.name) : variation.name;
                    const vDesc = isEn ? (variation.description_en ?? variation.description) : variation.description;
                    const card = this.createTaalCard(vName, variation.rows, vDesc, variation, isEn);
                    card.dataset['search'] = this.buildSearchIndex(variation);
                    section.appendChild(card);
                    variationCards.push(card);
                });
            }

            // Filter logic
            searchInput.addEventListener('input', () => {
                const query = searchInput.value.trim().toLowerCase();
                let anyVisible = false;

                variationCards.forEach(card => {
                    const index = (card.dataset['search'] ?? '').toLowerCase();
                    const visible = query === '' || index.includes(query);
                    card.style.display = visible ? '' : 'none';
                    if (visible) anyVisible = true;
                });

                // Hide special divider if all special cards are hidden
                if (specialDivider) {
                    const anySpecialVisible = special.some((_, i) => {
                        const card = variationCards[normal.length + i];
                        return card && card.style.display !== 'none';
                    });
                    specialDivider.style.display = anySpecialVisible ? '' : 'none';
                }

                (emptyMsg as HTMLElement).style.display = anyVisible ? 'none' : '';
            });
        }
        
        section.appendChild(this.createTip());

        return section;
    }
    
    private createTutorialLink(): HTMLElement {
        const linkDiv = createElement('div', {
            className: 'resource-box resource-box--tutorials mb-6'
        });
        
        const headerDiv = createElement('div', { className: 'flex items-center gap-2 mb-3' });
        headerDiv.appendChild(createElement('span', { className: 'text-xl' }, '🎓'));
        headerDiv.appendChild(createElement('h4', {
            className: 'font-bold resource-box__title'
        }, t('taal.tutorialTitle')));
        linkDiv.appendChild(headerDiv);
        
        const tutorialCard = createElement('div', { className: 'tutorial-card' });
        const link = createElement('a', {
            href: this.taalData.tutorial!,
            target: '_blank',
            className: 'tutorial-link'
        });
        
        const contentDiv = createElement('div', { className: 'flex items-center gap-3' });
        contentDiv.appendChild(createElement('span', { className: 'text-lg flex-shrink-0' }, '📚'));
        contentDiv.appendChild(createElement('span', { className: 'font-medium flex-1' }, t('taal.tutorialLink')));
        contentDiv.appendChild(createElement('span', { className: 'resource-box__arrow flex-shrink-0' }, '↗'));
        
        link.appendChild(contentDiv);
        tutorialCard.appendChild(link);
        linkDiv.appendChild(tutorialCard);
        
        return linkDiv;
    }
    
    /**
     * Splits a row into vibhags (mobile only, < 768px).
     * Splits by matra number using VIBHAG_DIVIDERS, so it works whatever the
     * row layout is (a full cycle or half a cycle per row). Empty groups are
     * never produced. Taals without dividers fall back to groups of 4.
     */
    private getVibhagStructure(row: Matra[]): Matra[][] {
        if (window.innerWidth >= 768) return [row];

        const dividers = VIBHAG_DIVIDERS[this.taalData.beats];
        if (!dividers) return chunkArray(row, 4);

        const groups: Matra[][] = [];
        let current: Matra[] = [];
        row.forEach(matra => {
            current.push(matra);
            if (dividers.includes(matra.matra)) {
                groups.push(current);
                current = [];
            }
        });
        if (current.length > 0) groups.push(current);
        return groups;
    }
    
    private createTaalCard(title: string, rows: Matra[][], description?: string, variation?: TaalVariation, isEn = false): HTMLElement {
        const card = createElement('div', { className: 'card p-8 mb-6' });
        
        const titleEl = createElement('h3', {
            className: 'text-2xl font-bold mb-4'
        }, title);
        card.appendChild(titleEl);
        
        if (description) {
            card.appendChild(createElement('p', {
                className: 'text-slate-600 mb-4'
            }, description));
        }
        
        rows.forEach((row, index) => {
            // Split into vibhags for mobile
            const vibhags = this.getVibhagStructure(row);
            
            vibhags.forEach((vibhag, vibhagIndex) => {
                const rowDiv = createElement('div', {
                    className: `taal-row-separator ${(index > 0 || vibhagIndex > 0) ? 'mt-6' : ''} mobile-vibhag`
                });
                const grid = createElement('div', {
                    className: 'grid gap-4 pt-6',
                    style: { gridTemplateColumns: `repeat(${vibhag.length}, minmax(0, 1fr))` }
                });
                
                vibhag.forEach((matra) => {
                const cell = createElement('div', { className: 'bol-cell' });
                
                // Add orange dividers based on taal structure (only on desktop)
                const isMobile = window.innerWidth < 768;
                
                if (!isMobile) {
                    const b = this.taalData.beats;
                    if (VIBHAG_DIVIDERS[b]?.includes(matra.matra)) {
                        cell.style.borderRight = '4px solid var(--orange-500)';
                        cell.style.paddingRight = '0.5rem';
                    }
                }
                
                cell.appendChild(createElement('div', {
                    className: 'matra-number mono-font'
                }, `M${matra.matra}`));
                const bolTextEl = createElement('div', { className: 'bol-text' });
                applyBolIndicators(bolTextEl, matra.bol);
                cell.appendChild(bolTextEl);
                
                // Only show badge on the main pattern (variation === undefined)
                if (!variation && (matra.technique === 'Khali' || matra.technique === 'Taali')) {
                    cell.appendChild(createElement('span', {
                        className: 'technique-badge'
                    }, matra.technique));
                }
                
                    grid.appendChild(cell);
                });
                
                rowDiv.appendChild(grid);
                card.appendChild(rowDiv);
            });
        });
        
        // Add songs and tutorials stacked vertically
        const songsList = variation?.songs ?? (!variation ? this.taalData.songs : undefined);
        const hasSongs = songsList && songsList.length > 0;
        const hasTutorials = variation?.tutorials && variation.tutorials.length > 0;
        
        if (hasSongs || hasTutorials) {
            const resourcesContainer = createElement('div', {
                className: 'mt-6'
            });
            
            // Songs column
            if (hasSongs) {
                const songsDiv = createElement('div', {
                    className: 'resource-box resource-box--songs'
                });
                
                const headerDiv = createElement('div', { className: 'flex items-center gap-2 mb-3' });
                headerDiv.appendChild(createElement('span', { className: 'text-xl' }, '🎵'));
                headerDiv.appendChild(createElement('h5', {
                    className: 'font-bold resource-box__title'
                }, t('taal.songsTitle')));
                songsDiv.appendChild(headerDiv);
                
                const songsGrid = createElement('div', { className: 'grid gap-2' });
                
                songsList.forEach((song: any) => {
                    const songCard = createElement('div', { className: 'song-card' });
                    const link = createElement('a', {
                        href: song.url,
                        target: '_blank',
                        className: 'song-link'
                    });
                    const contentDiv = createElement('div', { className: 'flex items-center gap-3' });
                    contentDiv.appendChild(createElement('span', { className: 'text-lg flex-shrink-0' }, '▶️'));
                    contentDiv.appendChild(createElement('span', { className: 'font-medium flex-1' }, song.title));
                    contentDiv.appendChild(createElement('span', { className: 'resource-box__arrow flex-shrink-0' }, '↗'));
                    link.appendChild(contentDiv);
                    songCard.appendChild(link);
                    songsGrid.appendChild(songCard);
                });
                
                songsDiv.appendChild(songsGrid);
                resourcesContainer.appendChild(songsDiv);
            }
            
            // Tutorials section
            if (hasTutorials) {
                const tutorialsDiv = createElement('div', {
                    className: `resource-box resource-box--tutorials ${hasSongs ? 'mt-4' : ''}`
                });
                
                const headerDiv = createElement('div', { className: 'flex items-center gap-2 mb-3' });
                headerDiv.appendChild(createElement('span', { className: 'text-xl' }, '📚'));
                headerDiv.appendChild(createElement('h5', {
                    className: 'font-bold resource-box__title'
                }, t('taal.tutorialsTitle')));
                tutorialsDiv.appendChild(headerDiv);
                
                const tutorialsGrid = createElement('div', { className: 'grid gap-2' });
                
                variation?.tutorials?.forEach((url: string, idx: number) => {
                    const tutorialCard = createElement('div', { className: 'tutorial-card' });
                    const link = createElement('a', {
                        href: url,
                        target: '_blank',
                        className: 'tutorial-link'
                    });
                    const contentDiv = createElement('div', { className: 'flex items-center gap-3' });
                    contentDiv.appendChild(createElement('span', { className: 'text-lg flex-shrink-0' }, '🎓'));
                    contentDiv.appendChild(createElement('span', { className: 'font-medium flex-1' }, t('taal.tutorialN', idx + 1)));
                    contentDiv.appendChild(createElement('span', { className: 'resource-box__arrow flex-shrink-0' }, '↗'));
                    link.appendChild(contentDiv);
                    tutorialCard.appendChild(link);
                    tutorialsGrid.appendChild(tutorialCard);
                });
                
                tutorialsDiv.appendChild(tutorialsGrid);
                resourcesContainer.appendChild(tutorialsDiv);
            }
            
            card.appendChild(resourcesContainer);
        }
        
        // Add notes if present (use _en if available and EN is active)
        const notesToShow: string[] | undefined = variation
            ? (isEn ? (variation.notes_en ?? variation.notes) : variation.notes)
            : undefined;
        if (notesToShow && notesToShow.length > 0) {
            const notesDiv = createElement('div', { className: 'notes-box mt-4' });
            notesToShow.forEach((note: string) => {
                if (note.trim() === '') {
                    notesDiv.appendChild(createElement('br', {}));
                } else if (note.startsWith('http')) {
                    const link = createElement('a', {
                        href: note,
                        target: '_blank',
                        className: 'notes-box__link underline block mb-1'
                    }, note);
                    notesDiv.appendChild(link);
                } else {
                    notesDiv.appendChild(createElement('p', {
                        className: 'notes-box__text mb-1'
                    }, note));
                }
            });
            card.appendChild(notesDiv);
        }

        if (bolsHaveIndicators(rows)) {
            card.appendChild(createBolIndicatorsLegend());
        }
        
        return card;
    }
    
    /**
     * Builds a searchable text index for a variation:
     * includes name, song titles, and all bol texts.
     */
    private buildSearchIndex(variation: import('../types.js').TaalVariation): string {
        const parts: string[] = [variation.name];

        if (variation.description) parts.push(variation.description);

        if (variation.songs) {
            variation.songs.forEach(s => parts.push(s.title));
        }

        variation.rows.forEach(row => {
            row.forEach(matra => parts.push(matra.bol));
        });

        return parts.join(' ');
    }

    private createTip(): HTMLElement {
        const tip = this.taalData.tip;
        const isEn = getLang() === 'en';
        const tipDiv = createElement('div', {
            className: `info-box info-box--${tip.color} mt-6`
        });
        tipDiv.appendChild(createElement('h4', {
            className: 'info-box__title text-xl font-bold mb-2'
        }, isEn ? (tip.title_en ?? tip.title) : tip.title));
        tipDiv.appendChild(createElement('p', {
            className: 'info-box__text'
        }, isEn ? (tip.text_en ?? tip.text) : tip.text));
        
        return tipDiv;
    }
}
