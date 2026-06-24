// ============================================
// VIEW: Songs with Taal identification
// ============================================

import { createElement } from '../core/utils.js';
import { SONGS } from '../data/songs.js';
import type { View } from '../types.js';

export class SongsView implements View {
    public render(): HTMLElement {
        const container = createElement('div', { className: 'view-container' });

        // Header
        const header = createElement('h1', {
            className: 'text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6'
        }, '🎵 Canciones');

        const description = createElement('p', {
            className: 'text-slate-600 dark:text-slate-400 mb-8'
        }, 'Colección de canciones con el Taal identificado. Haz clic en el botón para ver el video en YouTube.');

        container.appendChild(header);
        container.appendChild(description);

        // Songs list
        SONGS.forEach(song => {
            const card = this.createSongCard(song);
            container.appendChild(card);
        });

        return container;
    }

    /**
     * Create a song card - Title with YouTube button
     */
    private createSongCard(song: typeof SONGS[0]): HTMLElement {
        const card = createElement('div', {
            className: 'card p-8 mb-6'
        });

        // Container for title and button (flex layout)
        const container = createElement('div', {
            className: 'flex items-center justify-between gap-4'
        });

        // Song title (normal text, not a link)
        const title = createElement('h3', {
            className: 'text-xl font-bold text-slate-800 dark:text-slate-100 flex-1'
        }, song.title);

        // YouTube button - Orange background with dark text in light mode, white text in dark mode
        const button = createElement('a', {
            href: song.youtubeUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-900 dark:text-white rounded-lg font-semibold transition-colors duration-200 whitespace-nowrap shadow-md hover:shadow-lg border-2 border-orange-600'
        }, '▶ YouTube');

        container.appendChild(title);
        container.appendChild(button);
        card.appendChild(container);

        return card;
    }
}

// Made with ❤️ by Bob

// Made with Bob
