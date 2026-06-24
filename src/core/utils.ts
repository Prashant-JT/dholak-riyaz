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

// Made with Bob
