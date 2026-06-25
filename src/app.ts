/**
 * APPLICATION CONTROLLER
 * Punto de entrada principal de la aplicación
 */

import { NavigationController } from './components/navigation.js';
import { ViewManager } from './components/viewManager.js';
import { MetronomeEngine } from './components/metronome.js';
import { DarkModeToggle } from './components/darkModeToggle.js';
import { CONFIG } from './core/config.js';
import type { NavigateEventDetail } from './types.js';

class Application {
    private navigationController: NavigationController | null = null;
    private viewManager: ViewManager | null = null;
    private metronome: MetronomeEngine;
    private darkModeToggle: DarkModeToggle;
    
    constructor() {
        this.metronome = new MetronomeEngine();
        this.darkModeToggle = new DarkModeToggle();
    }
    
    /**
     * Inicializa la aplicación
     */
    public init(): void {
        // Inicializar navegación
        this.navigationController = new NavigationController('navigationMenu', 'mainContent');
        this.navigationController.render();
        
        // Inicializar gestor de vistas
        this.viewManager = new ViewManager('mainContent');
        this.viewManager.showView(CONFIG.VIEWS.DASHBOARD);
        
        // Añadir toggle de modo oscuro al body
        document.body.appendChild(this.darkModeToggle.render());
        
        // Escuchar eventos de navegación
        window.addEventListener('navigate', (e: Event) => {
            const customEvent = e as CustomEvent<NavigateEventDetail>;
            if (this.viewManager) {
                this.viewManager.showView(customEvent.detail.viewId);
            }
            // Reinicializar controles después de cambiar de vista
            setTimeout(() => this.initializeControls(), 100);
        });
        
        // Inicializar controles de la vista inicial
        setTimeout(() => this.initializeControls(), 100);

        // Home link — navega al dashboard al hacer clic en el título
        const homeLink = document.getElementById('homeLink');
        if (homeLink) {
            homeLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigationController?.navigateTo(CONFIG.VIEWS.DASHBOARD);
            });
        }
    }
    
    /**
     * Inicializa los controles interactivos
     */
    private initializeControls(): void {
        this.initMetronomeControls();
        this.initLehrasControls();
    }
    
    /**
     * Inicializa los controles del metrónomo
     */
    private initMetronomeControls(): void {
        const bpmSlider = document.getElementById('bpmSlider') as HTMLInputElement | null;
        const bpmDisplay = document.getElementById('bpmDisplay');
        const beatsSelect = document.getElementById('beatsSelect') as HTMLSelectElement | null;
        const cycleDisplay = document.getElementById('cycleDisplay');
        const playButton = document.getElementById('playStopBtn') as HTMLButtonElement | null;
        
        // Setup beat indicators callback
        const initialBeats = beatsSelect ? parseInt(beatsSelect.value) : 6;
        this.metronome.setBeatsPerMeasure(initialBeats);
        this.metronome.onBeat((beat: number) => {
            this.updateBeatIndicators(beat);
        });
        
        // Setup cycle counter callback
        this.metronome.onCycle((cycle: number) => {
            if (cycleDisplay) {
                cycleDisplay.textContent = cycle.toString();
            }
        });
        
        // BPM Slider
        if (bpmSlider && bpmDisplay) {
            // Remover listeners anteriores
            const newSlider = bpmSlider.cloneNode(true) as HTMLInputElement;
            bpmSlider.parentNode?.replaceChild(newSlider, bpmSlider);
            
            newSlider.addEventListener('input', () => {
                const bpm = parseInt(newSlider.value);
                this.metronome.setBPM(bpm);
                bpmDisplay.textContent = bpm.toString();
            });
        }
        
        // Beats per measure select
        if (beatsSelect) {
            // Remover listeners anteriores
            const newBeatsSelect = beatsSelect.cloneNode(true) as HTMLSelectElement;
            beatsSelect.parentNode?.replaceChild(newBeatsSelect, beatsSelect);
            
            // Set initial beat indicators
            this.updateBeatIndicatorsCount(initialBeats);
            
            newBeatsSelect.addEventListener('change', () => {
                const beats = parseInt(newBeatsSelect.value);
                this.metronome.setBeatsPerMeasure(beats);
                this.updateBeatIndicatorsCount(beats);
            });
        }
        
        if (playButton) {
            // Remover listeners anteriores
            const newButton = playButton.cloneNode(true) as HTMLButtonElement;
            playButton.parentNode?.replaceChild(newButton, playButton);
            
            newButton.addEventListener('click', () => {
                if (!this.metronome.getPlayingState()) {
                    this.metronome.start();
                    newButton.textContent = 'Detener';
                    newButton.classList.remove('btn-primary');
                    newButton.classList.add('btn-danger');
                    // Reset cycle counter display
                    if (cycleDisplay) {
                        cycleDisplay.textContent = '0';
                    }
                } else {
                    this.metronome.stop();
                    newButton.textContent = 'Iniciar';
                    newButton.classList.remove('btn-danger');
                    newButton.classList.add('btn-primary');
                    // Reset all indicators
                    this.updateBeatIndicators(-1);
                }
            });
        }
        
        // Reset Cycles Button
        const resetButton = document.getElementById('resetCyclesBtn') as HTMLButtonElement | null;
        if (resetButton) {
            // Remover listeners anteriores
            const newResetButton = resetButton.cloneNode(true) as HTMLButtonElement;
            resetButton.parentNode?.replaceChild(newResetButton, resetButton);
            
            newResetButton.addEventListener('click', () => {
                // Si está tocando, detenerlo primero
                if (this.metronome.getPlayingState()) {
                    this.metronome.stop();
                    
                    // Obtener el botón de play/stop actualizado del DOM
                    const currentPlayButton = document.getElementById('playStopBtn') as HTMLButtonElement | null;
                    if (currentPlayButton) {
                        currentPlayButton.textContent = 'Iniciar';
                        currentPlayButton.classList.remove('btn-danger');
                        currentPlayButton.classList.add('btn-primary');
                    }
                }
                
                // Resetear ciclos
                this.metronome.resetCycles();
                if (cycleDisplay) {
                    cycleDisplay.textContent = '0';
                }
                
                // Resetear indicadores visuales al estado inicial
                this.updateBeatIndicators(-1);
            });
        }
    }
    
    /**
     * Update beat indicators visual state
     */
    private updateBeatIndicators(activeBeat: number): void {
        const indicators = document.querySelectorAll('.beat-indicator');
        indicators.forEach((indicator, index) => {
            if (index === activeBeat) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }
    
    /**
     * Update beat indicators count based on beats per measure
     */
    private updateBeatIndicatorsCount(beats: number): void {
        const container = document.getElementById('beatIndicators');
        if (!container) return;
        
        // Clear existing indicators
        container.innerHTML = '';
        
        // Create new indicators
        for (let i = 0; i < beats; i++) {
            const ball = document.createElement('div');
            ball.className = 'beat-indicator';
            ball.setAttribute('data-beat', i.toString());
            container.appendChild(ball);
        }
    }
    
    /**
     * Inicializa los controles de lehras
     */
    private initLehrasControls(): void {
        const select = document.getElementById('lehraSelect') as HTMLSelectElement | null;
        const container = document.getElementById('lehraContainer');
        const iframe = document.getElementById('lehraIframe') as HTMLIFrameElement | null;
        
        if (select && container && iframe) {
            // Remover listeners anteriores
            const newSelect = select.cloneNode(true) as HTMLSelectElement;
            select.parentNode?.replaceChild(newSelect, select);
            
            newSelect.addEventListener('change', () => {
                const selectedURL = newSelect.value;
                
                if (selectedURL) {
                    iframe.src = selectedURL;
                    container.classList.remove('hidden');
                } else {
                    iframe.src = '';
                    container.classList.add('hidden');
                }
            });
        }
    }
}

// Inicializar aplicación cuando el DOM esté listo
console.log('🚀 App script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM Content Loaded');
    const app = new Application();
    console.log('✅ Application instance created');
    app.init();
    console.log('✅ Application initialized');
    
    // Exponer app globalmente para debugging (opcional)
    (window as any).app = app;
});

console.log('📝 Event listener registered');

// Made with Bob
