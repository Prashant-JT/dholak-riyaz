// ============================================
// VIEW: Songs with Taal identification
// ============================================

import { createElement } from '../core/utils.js';
import { SONGS } from '../data/songs.js';
import type { View } from '../types.js';

// Extraer taals únicos preservando orden de aparición
const TAAL_OPTIONS = ['Todos', ...Array.from(new Set(SONGS.map(s => s.taal)))];

export class SongsView implements View {
    public render(): HTMLElement {
        const container = createElement('div', { className: 'view-container' });

        container.appendChild(createElement('h1', { className: 'section-title' }, 'Canciones'));
        container.appendChild(createElement('p', { className: 'section-subtitle mb-6' },
            'Colección de canciones para practicar. Haz clic en ▶ YouTube para abrir el video.'));

        // Search input
        const searchWrapper = createElement('div', { className: 'songs-search-wrapper' });
        const searchInput = createElement('input', {
            type: 'text',
            id: 'songsSearch',
            placeholder: 'Buscar canción...',
            className: 'songs-search-input'
        }) as HTMLInputElement;
        searchWrapper.appendChild(searchInput);

        // Selector de taal
        const taalSelect = createElement('select', {
            id: 'songsTaalFilter',
            className: 'songs-taal-select'
        }) as HTMLSelectElement;
        TAAL_OPTIONS.forEach(t => {
            taalSelect.appendChild(createElement('option', { value: t }, t) as HTMLOptionElement);
        });
        searchWrapper.appendChild(taalSelect);

        container.appendChild(searchWrapper);

        // Contador
        const counter = createElement('p', {
            id: 'songsCounter',
            className: 'text-muted text-sm mb-4'
        }, `${SONGS.length} canciones`);
        container.appendChild(counter);

        // Lista de canciones
        const list = createElement('div', { id: 'songsList' });
        SONGS.forEach(song => list.appendChild(this.createSongCard(song)));
        container.appendChild(list);

        // Estado vacío
        const emptyState = createElement('p', {
            id: 'songsEmpty',
            className: 'text-muted text-center py-12 hidden'
        }, 'No se encontraron canciones.');
        container.appendChild(emptyState);

        requestAnimationFrame(() => this.initFilters());

        return container;
    }

    private initFilters(): void {
        const searchInput = document.getElementById('songsSearch') as HTMLInputElement | null;
        const taalSelect  = document.getElementById('songsTaalFilter') as HTMLSelectElement | null;
        const list        = document.getElementById('songsList');
        const counter     = document.getElementById('songsCounter');
        const emptyState  = document.getElementById('songsEmpty');
        if (!searchInput || !taalSelect || !list || !counter || !emptyState) return;

        const applyFilters = () => {
            const query    = searchInput.value.toLowerCase().trim();
            const taalVal  = taalSelect.value;
            const cards    = list.querySelectorAll<HTMLElement>('[data-song-title]');
            let visible    = 0;

            cards.forEach(card => {
                const title = card.dataset.songTitle ?? '';
                const taal  = card.dataset.songTaal  ?? '';
                const matchText = !query || title.includes(query);
                const matchTaal = taalVal === 'Todos' || taal === taalVal;
                const show = matchText && matchTaal;
                card.style.display = show ? '' : 'none';
                if (show) visible++;
            });

            const total = SONGS.length;
            counter.textContent = (query || taalVal !== 'Todos')
                ? `${visible} de ${total} canciones`
                : `${total} canciones`;

            emptyState.classList.toggle('hidden', visible > 0);
        };

        searchInput.addEventListener('input', applyFilters);
        taalSelect.addEventListener('change', applyFilters);
    }

    private createSongCard(song: typeof SONGS[0]): HTMLElement {
        const card = createElement('div', {
            className: 'card p-6 mb-4',
            'data-song-title': song.title.toLowerCase(),
            'data-song-taal':  song.taal,
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
