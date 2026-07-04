/**
 * KAYDAS VIEW
 * Vista de kaydas — renderiza todos los kaydas del objeto KAYDAS
 */

import { createElement, applyBolIndicators, bolsHaveIndicators, createBolIndicatorsLegend } from '../core/utils.js';
import { KAYDAS } from '../data/kaydas.js';
import type { View, Kayda } from '../types.js';

export class KaydasView implements View {
    public render(): HTMLElement {
        const section = createElement('section', {
            id: 'kaydas',
            className: 'view-section'
        });
        
        const header = createElement('div', { className: 'mb-8' });
        header.appendChild(createElement('h2', {
            className: 'section-title'
        }, 'Kaydas'));
        header.appendChild(createElement('p', {
            className: 'section-subtitle'
        }, 'Composiciones avanzadas y variaciones temáticas'));
        section.appendChild(header);

        // Search bar
        const searchWrapper = createElement('div', { className: 'songs-search-wrapper mb-6' });
        const searchInput = createElement('input', {
            type: 'text',
            className: 'songs-search-input',
            placeholder: 'Buscar kayda, taal o bol...'
        }) as HTMLInputElement;
        searchWrapper.appendChild(searchInput);
        section.appendChild(searchWrapper);

        // Empty state
        const emptyMsg = createElement('p', {
            className: 'text-muted text-center py-6',
            style: { display: 'none' }
        }, 'No hay kaydas que coincidan con la búsqueda.');
        section.appendChild(emptyMsg);

        // Render kaydas and build search index
        const kaydaCards: { el: HTMLElement; index: string }[] = [];

        Object.values(KAYDAS).forEach(kayda => {
            const card = this.createKaydaCard(kayda);
            const bolTexts = kayda.rows.flatMap(r => r.matras.map(m => m.bol));
            const index = [kayda.name, kayda.taal, kayda.description, ...bolTexts].join(' ').toLowerCase();
            section.appendChild(card);
            kaydaCards.push({ el: card, index });
        });

        // Filter logic
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            let anyVisible = false;

            kaydaCards.forEach(({ el, index }) => {
                const visible = query === '' || index.includes(query);
                el.style.display = visible ? '' : 'none';
                if (visible) anyVisible = true;
            });

            (emptyMsg as HTMLElement).style.display = anyVisible ? 'none' : '';
        });

        // Teoría
        const theory = createElement('div', { 
            className: 'info-box info-box--indigo mt-6'
        });
        theory.appendChild(createElement('h4', { 
            className: 'info-box__title text-xl font-bold mb-2' 
        }, 'Teoría de Kaydas'));
        theory.appendChild(createElement('p', { 
            className: 'info-box__text mb-3' 
        }, 'Las Kaydas son composiciones fijas que sirven como base para improvisación (Palta). Este patrón fundamental de Teental (16 tiempos) es la piedra angular del repertorio de tabla y dholak.'));
        theory.appendChild(createElement('p', { 
            className: 'info-box__text' 
        }, 'Estructura: El ciclo se divide en dos mitades: Bhari (lleno, con bajo) y Khali (vacío, sin bajo). El Sam (M1) es el punto de resolución más importante del ciclo.'));
        section.appendChild(theory);

        return section;
    }

    /**
     * Divide un array en grupos de tamaño n
     */
    private chunkArray<T>(arr: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    }

    private createKaydaCard(kayda: Kayda): HTMLElement {
        const card = createElement('div', { className: 'card p-8 mb-6' });

        card.appendChild(createElement('h3', { 
            className: 'text-2xl font-semibold mb-2' 
        }, `${kayda.name} (${kayda.taal} - ${kayda.beats} Tiempos)`));

        card.appendChild(createElement('p', { 
            className: 'text-muted mb-4'
        }, kayda.description));

        // Tutorial link (si existe)
        if (kayda.tutorial) {
            const tutorialDiv = createElement('div', {
                className: 'resource-box resource-box--tutorials mb-6'
            });
            const headerDiv = createElement('div', { className: 'flex items-center gap-2 mb-3' });
            headerDiv.appendChild(createElement('span', { className: 'text-xl' }, '🎓'));
            headerDiv.appendChild(createElement('h5', {
                className: 'font-bold resource-box__title'
            }, 'Tutorial'));
            tutorialDiv.appendChild(headerDiv);

            const tutorialCard = createElement('div', { className: 'tutorial-card' });
            const link = createElement('a', {
                href: kayda.tutorial,
                target: '_blank',
                className: 'tutorial-link'
            });
            const contentDiv = createElement('div', { className: 'flex items-center gap-3' });
            contentDiv.appendChild(createElement('span', { className: 'text-lg flex-shrink-0' }, '📚'));
            contentDiv.appendChild(createElement('span', { className: 'font-medium flex-1' }, 'Ver tutorial completo'));
            contentDiv.appendChild(createElement('span', { className: 'resource-box__arrow flex-shrink-0' }, '↗'));
            link.appendChild(contentDiv);
            tutorialCard.appendChild(link);
            tutorialDiv.appendChild(tutorialCard);
            card.appendChild(tutorialDiv);
        }

        // Filas de matras — en móvil se dividen en grupos de 4
        kayda.rows.forEach((row, rowIndex) => {
            const isMobile = window.innerWidth < 768;
            const groups = isMobile
                ? this.chunkArray(row.matras, 4)
                : [row.matras];

            groups.forEach((group, groupIndex) => {
                const isFirst = rowIndex === 0 && groupIndex === 0;
                const rowDiv = createElement('div', {
                    className: `taal-row-separator ${!isFirst ? 'mt-6' : ''}`
                });

                // Label solo en el primer grupo de cada fila
                if (groupIndex === 0) {
                    rowDiv.appendChild(createElement('h4', {
                        className: 'text-lg font-semibold text-muted mt-4 mb-3'
                    }, row.label));
                }

                const grid = createElement('div', {
                    className: 'grid gap-4 pt-6',
                    style: { gridTemplateColumns: `repeat(${group.length}, minmax(0, 1fr))` }
                });

                group.forEach(matra => {
                    const cell = createElement('div', { className: 'bol-cell' });
                    cell.appendChild(createElement('div', {
                        className: 'matra-number mono-font'
                    }, `M${matra.matra}`));
                    const bolTextEl = createElement('div', { className: 'bol-text' });
                    applyBolIndicators(bolTextEl, matra.bol);
                    cell.appendChild(bolTextEl);

                    if (matra.technique === 'Khali' || matra.technique === 'Taali') {
                        cell.appendChild(createElement('span', {
                            className: 'technique-badge'
                        }, matra.technique));
                    }

                    // Divisores de vibhag (línea naranja) según beats del kayda
                    const isMobileKayda = window.innerWidth < 768;
                    if (!isMobileKayda) {
                        const VIBHAG_DIVIDERS: Record<number, number[]> = {
                            6:  [3],
                            7:  [3, 5],
                            8:  [4],
                            14: [3, 7, 10],
                            16: [4, 8, 12],
                        };
                        if (VIBHAG_DIVIDERS[kayda.beats]?.includes(matra.matra)) {
                            cell.style.borderRight = '4px solid var(--orange-500)';
                            cell.style.paddingRight = '0.5rem';
                        }
                    }

                    grid.appendChild(cell);
                });

                rowDiv.appendChild(grid);
                card.appendChild(rowDiv);
            });
        });

        if (bolsHaveIndicators(kayda.rows)) {
            card.appendChild(createBolIndicatorsLegend());
        }

        return card;
    }
}

// Made with Bob
