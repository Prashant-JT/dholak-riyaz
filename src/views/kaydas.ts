/**
 * KAYDAS VIEW
 * Vista de kaydas
 */

import { createElement } from '../core/utils.js';
import { KAYDAS } from '../data/kaydas.js';
import type { View } from '../types.js';

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
        
        const card = createElement('div', { className: 'card p-8' });
        const kayda = KAYDAS.fundamental;
        
        card.appendChild(createElement('h3', { 
            className: 'text-2xl font-semibold text-slate-800 mb-6' 
        }, `${kayda.name} (Base ${kayda.taal} - ${kayda.beats} Tiempos)`));
        card.appendChild(createElement('p', { 
            className: 'text-slate-600 mb-6' 
        }, 'Estructura clásica dividida en Bhari (lleno) y Khali (vacío)'));
        
        kayda.rows.forEach((row, index) => {
            const rowDiv = createElement('div', { 
                className: `taal-row-separator ${index > 0 ? 'mt-6' : ''}` 
            });
            rowDiv.appendChild(createElement('h4', { 
                className: 'text-lg font-semibold text-slate-700 mt-4 mb-3' 
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
                
                // Solo mostrar badge si la técnica es "Khali" o "Taali"
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
        
        section.appendChild(card);
        
        // Teoría
        const theory = createElement('div', { 
            className: 'info-box mt-6 bg-indigo-50 border-indigo-500' 
        });
        theory.appendChild(createElement('h4', { 
            className: 'text-xl font-bold text-indigo-900 mb-2' 
        }, 'Teoría de Kaydas'));
        theory.appendChild(createElement('p', { 
            className: 'text-indigo-800 mb-3' 
        }, 'Las Kaydas son composiciones fijas que sirven como base para improvisación (Palta). Este patrón fundamental de Teental (16 tiempos) es la piedra angular del repertorio de tabla y dholak.'));
        theory.appendChild(createElement('p', { 
            className: 'text-indigo-800' 
        }, '<strong>Estructura:</strong> El ciclo se divide en dos mitades: Bhari (lleno, con bajo) y Khali (vacío, sin bajo). El Sam (M1) es el punto de resolución más importante del ciclo.'));
        section.appendChild(theory);
        
        return section;
    }
}

// Made with Bob
