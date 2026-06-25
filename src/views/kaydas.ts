/**
 * KAYDAS VIEW
 * Vista de kaydas — renderiza todos los kaydas del objeto KAYDAS
 */

import { createElement } from '../core/utils.js';
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
        
        // Iterar sobre todos los kaydas
        Object.values(KAYDAS).forEach(kayda => {
            section.appendChild(this.createKaydaCard(kayda));
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

        // Filas de matras
        kayda.rows.forEach((row, index) => {
            const rowDiv = createElement('div', { 
                className: `taal-row-separator ${index > 0 ? 'mt-6' : ''}` 
            });
            rowDiv.appendChild(createElement('h4', { 
                className: 'text-lg font-semibold text-muted mt-4 mb-3' 
            }, row.label));
            
            const grid = createElement('div', { 
                className: 'grid gap-4 pt-6',
                style: { gridTemplateColumns: `repeat(${row.matras.length}, minmax(0, 1fr))` }
            });
            
            row.matras.forEach(matra => {
                const cell = createElement('div', { className: 'bol-cell' });
                cell.appendChild(createElement('div', {
                    className: 'matra-number mono-font'
                }, `M${matra.matra}`));
                cell.appendChild(createElement('div', {
                    className: 'bol-text'
                }, matra.bol));
                
                if (matra.technique === 'Khali' || matra.technique === 'Taali') {
                    cell.appendChild(createElement('span', {
                        className: 'technique-badge'
                    }, matra.technique));
                }
                
                grid.appendChild(cell);
            });
            
            rowDiv.appendChild(grid);
            card.appendChild(rowDiv);
        });

        return card;
    }
}

// Made with Bob
