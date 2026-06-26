/**
 * TAAL VIEW
 * Vista genérica para mostrar taals
 */

import { createElement, applyBolIndicators, bolsHaveIndicators, createBolIndicatorsLegend } from '../core/utils.js';
import { TAALS } from '../data/taals/index.js';
import type { View, Taal } from '../types.js';

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
        header.appendChild(createElement('h2', {
            className: 'section-title'
        }, `${this.taalData.name} (${this.taalData.beats} Tiempos)`));
        header.appendChild(createElement('p', {
            className: 'section-subtitle'
        }, `${this.taalData.description} - ${this.taalData.subtitle}`));
        section.appendChild(header);
        
        // Tutorial link (if exists)
        if (this.taalData.tutorial) {
            section.appendChild(this.createTutorialLink());
        }
        
        // Main pattern
        section.appendChild(this.createTaalCard('Patrón Principal', this.taalData.rows, undefined, undefined));
        
        // Variations (if exist)
        if (this.taalData.variations && this.taalData.variations.length > 0) {
            const normal  = this.taalData.variations.filter(v => !v.special);
            const special = this.taalData.variations.filter(v => v.special);

            // Search bar (only when there are variations)
            const searchWrapper = createElement('div', { className: 'songs-search-wrapper mb-6' });
            const searchInput = createElement('input', {
                type: 'text',
                className: 'songs-search-input',
                placeholder: 'Buscar variación, canción o bol...'
            }) as HTMLInputElement;
            searchWrapper.appendChild(searchInput);
            section.appendChild(searchWrapper);

            // Empty state message
            const emptyMsg = createElement('p', {
                className: 'text-muted text-center py-6',
                style: { display: 'none' }
            }, 'No hay variaciones que coincidan con la búsqueda.');
            section.appendChild(emptyMsg);

            // Render variation cards and tag them with searchable text
            const variationCards: HTMLElement[] = [];

            normal.forEach(variation => {
                const card = this.createTaalCard(variation.name, variation.rows, variation.description, variation);
                card.dataset['search'] = this.buildSearchIndex(variation);
                section.appendChild(card);
                variationCards.push(card);
            });

            let specialDivider: HTMLElement | null = null;
            if (special.length > 0) {
                specialDivider = createElement('div', { className: 'filler-special-divider' });
                specialDivider.appendChild(createElement('span', { className: 'filler-special-label' }, '✦ Tirekite'));
                section.appendChild(specialDivider);

                special.forEach(variation => {
                    const card = this.createTaalCard(variation.name, variation.rows, variation.description, variation);
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
        }, 'Tutorial'));
        linkDiv.appendChild(headerDiv);
        
        const tutorialCard = createElement('div', { className: 'tutorial-card' });
        const link = createElement('a', {
            href: this.taalData.tutorial!,
            target: '_blank',
            className: 'tutorial-link'
        });
        
        const contentDiv = createElement('div', { className: 'flex items-center gap-3' });
        contentDiv.appendChild(createElement('span', { className: 'text-lg flex-shrink-0' }, '📚'));
        contentDiv.appendChild(createElement('span', { className: 'font-medium flex-1' }, 'Ver tutorial completo'));
        contentDiv.appendChild(createElement('span', { className: 'resource-box__arrow flex-shrink-0' }, '↗'));
        
        link.appendChild(contentDiv);
        tutorialCard.appendChild(link);
        linkDiv.appendChild(tutorialCard);
        
        return linkDiv;
    }
    
    /**
     * Divide los matras en vibhags según la estructura del taal
     * Solo en móvil (< 768px)
     */
    private getVibhagStructure(row: any[]): any[][] {
        const isMobile = window.innerWidth < 768;
        
        // Si no es móvil, devolver la fila completa
        if (!isMobile) {
            return [row];
        }
        
        // Dividir según el número de beats del taal
        const beats = this.taalData.beats;
        
        switch (beats) {
            case 6: // Dadra: 3+3
                return [
                    row.slice(0, 3),
                    row.slice(3, 6)
                ];
            case 7: // Rupak: 3+2+2
                return [
                    row.slice(0, 3),
                    row.slice(3, 5),
                    row.slice(5, 7)
                ];
            case 8: // Keherwa: 4+4
                return [
                    row.slice(0, 4),
                    row.slice(4, 8)
                ];
            case 14: // Deepchandi: 3+4+3+4
                return [
                    row.slice(0, 3),
                    row.slice(3, 7),
                    row.slice(7, 10),
                    row.slice(10, 14)
                ];
            case 16: // Teental: 4+4+4+4
                return [
                    row.slice(0, 4),
                    row.slice(4, 8),
                    row.slice(8, 12),
                    row.slice(12, 16)
                ];
            default:
                // Para otros taals, dividir en grupos de 4
                const vibhags: any[][] = [];
                for (let i = 0; i < row.length; i += 4) {
                    vibhags.push(row.slice(i, i + 4));
                }
                return vibhags;
        }
    }
    
    private createTaalCard(title: string, rows: any[][], description?: string, variation?: any): HTMLElement {
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
            // Dividir en vibhags para móvil
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
                    // Dadra (6 beats: 3+3)
                    if (this.taalData.beats === 6 && matra.matra === 3) {
                        cell.style.borderRight = '4px solid #f97316';
                        cell.style.paddingRight = '0.5rem';
                    }
                    
                    // Rupak (7 beats: 3+2+2)
                    if (this.taalData.beats === 7 && (matra.matra === 3 || matra.matra === 5)) {
                        cell.style.borderRight = '4px solid #f97316';
                        cell.style.paddingRight = '0.5rem';
                    }
                    
                    // Keherwa (8 beats: 4+4)
                    if (this.taalData.beats === 8 && matra.matra === 4) {
                        cell.style.borderRight = '4px solid #f97316';
                        cell.style.paddingRight = '0.5rem';
                    }
                    
                    // Deepchandi (14 beats: 3+4+3+4)
                    if (this.taalData.beats === 14 && (matra.matra === 3 || matra.matra === 7 || matra.matra === 10)) {
                        cell.style.borderRight = '4px solid #f97316';
                        cell.style.paddingRight = '0.5rem';
                    }
                }
                
                cell.appendChild(createElement('div', {
                    className: 'matra-number mono-font'
                }, `M${matra.matra}`));
                const bolTextEl = createElement('div', { className: 'bol-text' });
                applyBolIndicators(bolTextEl, matra.bol);
                cell.appendChild(bolTextEl);
                
                // Solo mostrar badge en el patrón principal (variation === undefined)
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
        const hasSongs = variation?.songs && variation.songs.length > 0;
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
                }, 'Canciones'));
                songsDiv.appendChild(headerDiv);
                
                const songsGrid = createElement('div', { className: 'grid gap-2' });
                
                variation.songs.forEach((song: any) => {
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
                }, 'Tutoriales'));
                tutorialsDiv.appendChild(headerDiv);
                
                const tutorialsGrid = createElement('div', { className: 'grid gap-2' });
                
                variation.tutorials.forEach((url: string, idx: number) => {
                    const tutorialCard = createElement('div', { className: 'tutorial-card' });
                    const link = createElement('a', {
                        href: url,
                        target: '_blank',
                        className: 'tutorial-link'
                    });
                    const contentDiv = createElement('div', { className: 'flex items-center gap-3' });
                    contentDiv.appendChild(createElement('span', { className: 'text-lg flex-shrink-0' }, '🎓'));
                    contentDiv.appendChild(createElement('span', { className: 'font-medium flex-1' }, `Tutorial ${idx + 1}`));
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
        
        // Add notes if present
        if (variation?.notes && variation.notes.length > 0) {
            const notesDiv = createElement('div', { className: 'notes-box mt-4' });
            variation.notes.forEach((note: string) => {
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
        const tipDiv = createElement('div', {
            className: `info-box info-box--${tip.color} mt-6`
        });
        tipDiv.appendChild(createElement('h4', {
            className: 'info-box__title text-xl font-bold mb-2'
        }, tip.title));
        tipDiv.appendChild(createElement('p', {
            className: 'info-box__text'
        }, tip.text));
        
        return tipDiv;
    }
}

// Made with Bob
