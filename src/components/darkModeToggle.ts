/**
 * Dark Mode Toggle Component
 * Manages theme switching between light and dark modes
 */

import { createElement } from '../core/utils.js';

export class DarkModeToggle {
    private button: HTMLButtonElement;
    private isDark: boolean;

    constructor() {
        this.isDark = this.loadThemePreference();
        this.button = this.createToggleButton();
        this.applyTheme(this.isDark);
    }

    /**
     * Load theme preference from localStorage
     */
    private loadThemePreference(): boolean {
        const saved = localStorage.getItem('darkMode');
        return saved === 'true';
    }

    /**
     * Save theme preference to localStorage
     */
    private saveThemePreference(isDark: boolean): void {
        localStorage.setItem('darkMode', isDark.toString());
    }

    /**
     * Apply theme to document
     */
    private applyTheme(isDark: boolean): void {
        if (isDark) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
        this.updateButtonIcon();
    }

    /**
     * Update button icon based on current theme
     */
    private updateButtonIcon(): void {
        this.button.textContent = this.isDark ? '☀️' : '🌙';
        this.button.setAttribute('aria-label', 
            this.isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
        );
    }

    /**
     * Toggle theme
     */
    private toggleTheme(): void {
        this.isDark = !this.isDark;
        this.applyTheme(this.isDark);
        this.saveThemePreference(this.isDark);
    }

    /**
     * Create toggle button element
     */
    private createToggleButton(): HTMLButtonElement {
        const button = createElement('button', {
            className: 'dark-mode-toggle',
            'aria-label': 'Cambiar tema',
            title: 'Cambiar entre modo claro y oscuro'
        }) as HTMLButtonElement;

        button.addEventListener('click', () => this.toggleTheme());

        return button;
    }

    /**
     * Render the toggle button to the page
     */
    public render(): HTMLButtonElement {
        return this.button;
    }
}

// Made with Bob
