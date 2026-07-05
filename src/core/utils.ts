/**
 * UTILITY FUNCTIONS
 * Funciones auxiliares reutilizables
 */

import type { ElementAttributes } from '../types';

/**
 * Crea un elemento HTML con atributos y contenido
 * @param tag - Nombre de la etiqueta HTML
 * @param attributes - Atributos del elemento
 * @param content - Contenido del elemento
 * @returns Elemento HTML creado
 */
export function createElement(
    tag: string,
    attributes: ElementAttributes = {},
    content: string | HTMLElement | HTMLElement[] | null = null
): HTMLElement {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value as string;
        } else if (key === 'dataset' && typeof value === 'object') {
            Object.entries(value as Record<string, string>).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else {
            element.setAttribute(key, String(value));
        }
    });
    
    if (content !== null) {
        if (Array.isArray(content)) {
            content.forEach(child => {
                if (child instanceof HTMLElement) {
                    element.appendChild(child);
                }
            });
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        } else {
            element.innerHTML = content;
        }
    }
    
    return element;
}

/**
 * Crea la leyenda de colores de indicadores (thapki/ghuisa).
 * Se puede insertar en cualquier vista que muestre celdas de bols.
 */
export function createBolIndicatorsLegend(): HTMLElement {
    const legend = document.createElement('div');
    legend.className = 'bol-indicators-legend';

    const items = [
        {
            cls: 'bol-indicator--thapki',
            label: 'Thapki',
            desc: 'golpe de espejo en el Dayan (agudo)'
        },
        {
            cls: 'bol-indicator--ghuisa',
            label: 'Ghuisa',
            desc: 'deslizamiento en el Bayan (grave)'
        }
    ];

    items.forEach(({ cls, label, desc }) => {
        const item = document.createElement('span');
        item.className = 'bol-indicators-legend__item';

        const dot = document.createElement('span');
        dot.className = `bol-indicator ${cls}`;

        const text = document.createElement('span');
        text.className = 'bol-indicators-legend__label';
        text.innerHTML = `<strong>${label}</strong><span class="text-muted"> — ${desc}</span>`;

        item.appendChild(dot);
        item.appendChild(text);
        legend.appendChild(item);
    });

    return legend;
}

const _bolIndicatorPattern = /\(thapki[^)]*\)|\(g[uh]is[ao][^)]*\)/i;

/**
 * Devuelve true si el texto JSON de las filas contiene "(thapki)" o "(ghisa)".
 * Funciona con cualquier estructura de filas (Taal rows o KaydaRow[]).
 */
export function bolsHaveIndicators(rows: unknown): boolean {
    return _bolIndicatorPattern.test(JSON.stringify(rows));
}

/**
 * Parsea el texto de un bol buscando "(thapki)" y/o "(ghisa)"/"(ghuisa)".
 * Devuelve el nombre limpio y añade puntos de color indicadores al contenedor dado.
 *
 * Uso: en lugar de `createElement('div', {className:'bol-text'}, matra.bol)`,
 *      crear el div vacío y llamar `applyBolIndicators(div, matra.bol)`.
 */
export function applyBolIndicators(container: HTMLElement, bolText: string): void {
    const hasThapki = /\(thapki[^)]*\)/i.test(bolText);
    const hasGhisa  = /\(g[uh]is[ao][^)]*\)/i.test(bolText);

    // Nombre limpio: quitar todos los paréntesis con thapki/ghisa/ghuisa
    const cleanName = bolText
        .replace(/\s*\(thapki[^)]*\)/gi, '')
        .replace(/\s*\(g[uh]is[ao][^)]*\)/gi, '')
        .trim();

    container.textContent = cleanName;

    if (hasThapki || hasGhisa) {
        const indicators = document.createElement('span');
        indicators.className = 'bol-indicators bol-indicators--inline';

        if (hasThapki) {
            const dot = document.createElement('span');
            dot.className = 'bol-indicator bol-indicator--thapki';
            dot.title = 'Thapki';
            indicators.appendChild(dot);
        }
        if (hasGhisa) {
            const dot = document.createElement('span');
            dot.className = 'bol-indicator bol-indicator--ghuisa';
            dot.title = 'Ghuisa';
            indicators.appendChild(dot);
        }
        container.appendChild(indicators);
    }
}

/**
 * Divisores de vibhag por número de beats.
 * Los valores son los números de matra después de los cuales
 * aparece una línea separadora naranja vertical (desktop).
 */
export const VIBHAG_DIVIDERS: Record<number, number[]> = {
    6:  [3],              // Dadra:      3+3
    7:  [3, 5],           // Rupak:      3+2+2
    8:  [4],              // Keherwa:    4+4
    10: [2, 5, 7],        // Jhaptal:    2+3+2+3
    12: [2, 4, 6, 8, 10], // Ektal:      2+2+2+2+2+2
    14: [3, 7, 10],       // Deepchandi: 3+4+3+4
    16: [4, 8, 12],       // Addha/Teental: 4+4+4+4
};

/**
 * Divide un array en sub-arrays de tamaño `size`.
 */
export function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

/**
 * Crea un header de sección estándar con título y subtítulo.
 */
export function createSectionHeader(title: string, subtitle: string): HTMLElement {
    const header = createElement('div', { className: 'mb-8' });
    header.appendChild(createElement('h2', { className: 'section-title' }, title));
    header.appendChild(createElement('p', { className: 'section-subtitle' }, subtitle));
    return header;
}

/**
 * Conecta un input de búsqueda con una lista de cards filtrables.
 * Cada item tiene `el` (el elemento DOM) e `index` (texto buscable en minúsculas).
 * Muestra `emptyMsg` cuando ningún item coincide.
 */
export function setupSearchFilter(
    searchInput: HTMLInputElement,
    items: Array<{ el: HTMLElement; index: string }>,
    emptyMsg: HTMLElement
): void {
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        let anyVisible = false;
        items.forEach(({ el, index }) => {
            const visible = query === '' || index.includes(query);
            el.style.display = visible ? '' : 'none';
            if (visible) anyVisible = true;
        });
        emptyMsg.style.display = anyVisible ? 'none' : '';
    });
}

// Made with Bob
