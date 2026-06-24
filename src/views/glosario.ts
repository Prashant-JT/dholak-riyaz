/**
 * GLOSARIO VIEW
 * Vista del glosario de bols
 */

import { createElement } from '../core/utils.js';
import { BOLS_BY_CATEGORY } from '../data/bols.js';
import type { View, Bol } from '../types.js';

export class GlosarioView implements View {
    public render(): HTMLElement {
        const section = createElement('section', { 
            id: 'glosario', 
            className: 'view-section' 
        });
        
        const header = createElement('div', { className: 'mb-8' });
        header.appendChild(createElement('h2', {
            className: 'section-title'
        }, 'Teoría'));
        header.appendChild(createElement('p', {
            className: 'section-subtitle'
        }, 'Conceptos fundamentales y glosario de Bols del Dholak'));
        section.appendChild(header);
        
        // Teoría de Taal
        const theorySection = createElement('div', { className: 'card p-8 mb-8' });
        theorySection.appendChild(createElement('h3', {
            className: 'text-2xl font-bold text-slate-900 mb-6'
        }, 'El concepto de Taal (El Ciclo)'));
        
        // Diagrama visual de conceptos
        const diagram = this.createTaalDiagram();
        theorySection.appendChild(diagram);
        
        const concepts = [
            {
                term: 'Matra',
                definition: 'Los tiempos o pulsos (como el 1, 2, 3, 4).'
            },
            {
                term: 'Vibhag',
                definition: 'Cómo se dividen esos tiempos (por ejemplo, el ritmo de 8 tiempos se divide en 4+4).'
            },
            {
                term: 'Sam (सम)',
                definition: 'El tiempo número 1, el más importante, donde todo empieza y termina. Marcado en ROJO en el metrónomo.'
            },
            {
                term: 'Khali (खाली)',
                definition: 'Tiempo "vacío" o débil, contrapunto del Sam. Marca la segunda mitad del ciclo.'
            },
            {
                term: 'Bhari (भरी)',
                definition: 'Tiempo "lleno" o fuerte. Incluye el Sam y otros tiempos acentuados.'
            },
            {
                term: 'Lay',
                definition: 'Ritmo o movimiento uniforme. La velocidad del tempo.'
            },
            {
                term: 'Bol',
                definition: 'Lo que se toca sobre el tabla, el pakhawaj o dholak. Las sílabas rítmicas.'
            },
            {
                term: 'Avartan (आवर्तन)',
                definition: 'Un ciclo completo del Taal. El contador de ciclos muestra cuántos Avartans has completado.'
            }
        ];
        
        concepts.forEach(concept => {
            const conceptDiv = createElement('div', { className: 'mb-4' });
            conceptDiv.appendChild(createElement('h4', {
                className: 'text-lg font-bold text-orange-600 mb-1'
            }, concept.term));
            conceptDiv.appendChild(createElement('p', {
                className: 'text-slate-700'
            }, concept.definition));
            theorySection.appendChild(conceptDiv);
        });
        
        section.appendChild(theorySection);
        
        // Glosario de Bols - Tres columnas
        const bolsHeader = createElement('h3', {
            className: 'text-2xl font-bold text-slate-900 mb-6'
        }, 'Glosario de Bols');
        section.appendChild(bolsHeader);
        
        // Contenedor de tres columnas
        const columnsContainer = createElement('div', {
            className: 'grid grid-cols-1 md:grid-cols-3 gap-6'
        });
        
        // Columna 1: Chatti (Dayan - Agudo)
        const chattiColumn = this.createBolColumn(
            'Chatti (Dayan)',
            'Parche Agudo',
            BOLS_BY_CATEGORY.chatti,
            'bg-orange-50 border-orange-200'
        );
        columnsContainer.appendChild(chattiColumn);
        
        // Columna 2: Bayan (Grave)
        const bayanColumn = this.createBolColumn(
            'Bayan',
            'Parche Grave',
            BOLS_BY_CATEGORY.bayan,
            'bg-blue-50 border-blue-200'
        );
        columnsContainer.appendChild(bayanColumn);
        
        // Columna 3: Compuestos
        const compuestosColumn = this.createBolColumn(
            'Compuestos',
            'Dha & Dhi',
            BOLS_BY_CATEGORY.compuestos,
            'bg-purple-50 border-purple-200'
        );
        columnsContainer.appendChild(compuestosColumn);
        
        section.appendChild(columnsContainer);
        
        
        return section;
    }
    
    private createTaalDiagram(): HTMLElement {
        const diagramContainer = createElement('div', {
            className: 'taal-diagram mb-8'
        });
        
        // TAAL (nodo principal)
        const taalNode = createElement('div', {
            className: 'diagram-node diagram-node-main'
        }, 'TAAL');
        diagramContainer.appendChild(taalNode);
        
        // Línea conectora principal
        const mainLine = createElement('div', { className: 'diagram-line-main' });
        diagramContainer.appendChild(mainLine);
        
        // Contenedor de nodos secundarios
        const secondaryNodes = createElement('div', { className: 'diagram-secondary-row' });
        
        const nodes = [
            { label: 'LAY', desc: 'Ritmo o movimiento uniforme' },
            { label: 'MATRA', desc: 'Para medir el tiempo' },
            { label: 'VIBHAG', desc: 'Cada taal se divide, a lo cual se le llama vibhag (secciones)' },
            { label: 'BOL', desc: 'Lo que se toca sobre el tabla, el pakhawaj o dholak' }
        ];
        
        nodes.forEach(node => {
            const nodeContainer = createElement('div', { className: 'diagram-node-container' });
            
            const nodeEl = createElement('div', { className: 'diagram-node diagram-node-secondary' }, node.label);
            nodeContainer.appendChild(nodeEl);
            
            const desc = createElement('div', { className: 'diagram-node-desc' }, node.desc);
            nodeContainer.appendChild(desc);
            
            secondaryNodes.appendChild(nodeContainer);
        });
        
        diagramContainer.appendChild(secondaryNodes);
        
        // LAY subdivisions
        const laySubdivisions = createElement('div', { className: 'diagram-tertiary-row' });
        const layTypes = ['DRUT\n(FAST)', 'MADHYA\n(MEDIUM)', 'VILAMBIT\n(SLOW)'];
        
        layTypes.forEach(type => {
            const subNode = createElement('div', {
                className: 'diagram-node diagram-node-tertiary'
            }, type);
            laySubdivisions.appendChild(subNode);
        });
        
        diagramContainer.appendChild(laySubdivisions);
        
        return diagramContainer;
    }
    
    private createBolColumn(title: string, subtitle: string, bols: Bol[], bgClass: string): HTMLElement {
        const column = createElement('div', {
            className: `rounded-lg p-6 border-2 border-slate-300 ${bgClass}`
        });
        
        // Header de la columna
        const header = createElement('div', { className: 'mb-6' });
        header.appendChild(createElement('h4', {
            className: 'text-2xl font-bold text-slate-900 mb-1'
        }, title));
        header.appendChild(createElement('p', {
            className: 'text-sm text-slate-600 italic'
        }, subtitle));
        column.appendChild(header);
        
        // Bols de esta categoría
        bols.forEach((bol) => {
            const bolSection = createElement('div', {
                className: 'mb-6 pb-6 border-b border-slate-300 last:border-b-0 last:mb-0 last:pb-0'
            });
            
            // Nombre del bol
            bolSection.appendChild(createElement('h5', {
                className: 'text-xl font-bold text-slate-900 mb-2'
            }, bol.name));
            
            // Técnica
            const tecnicaP = createElement('p', {
                className: 'text-slate-700 mb-1'
            });
            tecnicaP.innerHTML = `<strong>Técnica:</strong> ${bol.technique}`;
            bolSection.appendChild(tecnicaP);
            
            // Descripción
            bolSection.appendChild(createElement('p', {
                className: 'text-slate-600'
            }, bol.description));
            
            column.appendChild(bolSection);
        });
        
        return column;
    }
}

// Made with Bob
