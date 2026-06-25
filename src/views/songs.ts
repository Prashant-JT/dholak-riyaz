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
            className: 'section-title'
        }, 'Canciones');

        const description = createElement('p', {
            className: 'section-subtitle mb-6'
        }, 'Colección de canciones para practicar. Haz clic en ▶ YouTube para abrir el video.');

        container.appendChild(header);
        container.appendChild(description);

        // Search input
        const searchWrapper = createElement('div', { className: 'songs-search-wrapper' });
        const searchInput = createElement('input', {
            type: 'text',
            id: 'songsSearch',
            placeholder: 'Buscar canción...',
            className: 'songs-search-input'
        }) as HTMLInputElement;
        searchWrapper.appendChild(searchInput);
        container.appendChild(searchWrapper);

        // Counter
        const counter = createElement('p', {
            id: 'songsCounter',
            className: 'text-muted text-sm mb-4'
        }, `${SONGS.length} canciones`);
        container.appendChild(counter);

        // Songs list
        const list = createElement('div', { id: 'songsList' });
        SONGS.forEach(song => {
            list.appendChild(this.createSongCard(song));
        });
        container.appendChild(list);

        // Empty state (hidden by default)
        const emptyState = createElement('p', {
            id: 'songsEmpty',
            className: 'text-muted text-center py-12 hidden'
        }, 'No se encontraron canciones.');
        container.appendChild(emptyState);

        // Wire up search after render
        requestAnimationFrame(() => this.initSearch());

        return container;
    }

    /**
     * Filtra las canciones en tiempo real según el input de búsqueda
     */
    private initSearch(): void {
        const input = document.getElementById('songsSearch') as HTMLInputElement | null;
        const list = document.getElementById('songsList');
        const counter = document.getElementById('songsCounter');
        const emptyState = document.getElementById('songsEmpty');
        if (!input || !list || !counter || !emptyState) return;

        input.addEventListener('input', () => {
            const query = input.value.toLowerCase().trim();
            const cards = list.querySelectorAll<HTMLElement>('[data-song-title]');
            let visible = 0;

            cards.forEach(card => {
                const title = card.dataset.songTitle ?? '';
                const match = title.includes(query);
                card.style.display = match ? '' : 'none';
                if (match) visible++;
            });

            counter.textContent = query
                ? `${visible} de ${SONGS.length} canciones`
                : `${SONGS.length} canciones`;

            emptyState.classList.toggle('hidden', visible > 0);
        });
    }

    /**
     * Card de canción — título + botón YouTube
     */
    private createSongCard(song: typeof SONGS[0]): HTMLElement {
        const card = createElement('div', {
            className: 'card p-6 mb-4',
            'data-song-title': song.title.toLowerCase()
        });

        const row = createElement('div', {
            className: 'flex items-center justify-between gap-4'
        });

        const title = createElement('h3', {
            className: 'text-lg font-semibold flex-1'
        }, song.title);

        const button = createElement('a', {
            href: song.youtubeUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'songs-yt-btn'
        }, '▶ YouTube');

        row.appendChild(title);
        row.appendChild(button);
        card.appendChild(row);

        return card;
    }
}

// Made with Bob
