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

// Made with Bob
