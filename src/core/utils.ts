/**
 * UTILITY FUNCTIONS
 * Reusable helper functions
 */

import type { ElementAttributes } from '../types';

/**
 * Creates an HTML element with attributes and content
 * @param tag - HTML tag name
 * @param attributes - Element attributes
 * @param content - Element content
 * @returns Created HTML element
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
 * Creates the colour legend for bol indicators (thapki/ghuisa).
 * Can be inserted into any view that shows bol cells.
 */
export function createBolIndicatorsLegend(): HTMLElement {
    const legend = document.createElement('div');
    legend.className = 'bol-indicators-legend';

    const items = [
        {
            cls: 'bol-indicator--thapki',
            label: 'Thapki',
            desc: 'mirror stroke on the Dayan (treble)'
        },
        {
            cls: 'bol-indicator--ghuisa',
            label: 'Ghuisa',
            desc: 'slide on the Bayan (bass)'
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

const _bolIndicatorPattern = /\(thapki[^)]*\)|\(ghu?is[ao][^)]*\)/i;

/**
 * Returns true if the JSON text of the rows contains "(thapki)", "(ghisa)" or "(ghuisa)".
 * Works with any row structure (Taal rows or KaydaRow[]).
 */
export function bolsHaveIndicators(rows: unknown): boolean {
    return _bolIndicatorPattern.test(JSON.stringify(rows));
}

/**
 * Parses bol text looking for "(thapki)" and/or "(ghisa)"/"(ghuisa)".
 * Returns the clean name and appends colour indicator dots to the given container.
 *
 * Usage: instead of `createElement('div', {className:'bol-text'}, matra.bol)`,
 *        create an empty div and call `applyBolIndicators(div, matra.bol)`.
 */
export function applyBolIndicators(container: HTMLElement, bolText: string): void {
    const hasThapki = /\(thapki[^)]*\)/i.test(bolText);
    const hasGhisa  = /\(ghu?is[ao][^)]*\)/i.test(bolText);

    // Clean name: strip all parentheses containing thapki/ghisa/ghuisa
    const cleanName = bolText
        .replace(/\s*\(thapki[^)]*\)/gi, '')
        .replace(/\s*\(ghu?is[ao][^)]*\)/gi, '')
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
 * Vibhag dividers by beat count.
 * Values are the matra numbers after which an orange vertical
 * separator line appears (desktop only).
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
 * Splits an array into sub-arrays of size `size`.
 */
export function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

/**
 * Creates a standard section header with title and subtitle.
 */
export function createSectionHeader(title: string, subtitle: string): HTMLElement {
    const header = createElement('div', { className: 'mb-8' });
    header.appendChild(createElement('h2', { className: 'section-title' }, title));
    header.appendChild(createElement('p', { className: 'section-subtitle' }, subtitle));
    return header;
}

/**
 * Connects a search input to a list of filterable cards.
 * Each item has `el` (the DOM element) and `index` (searchable text in lowercase).
 * Shows `emptyMsg` when no item matches.
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
