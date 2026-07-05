/**
 * APPLICATION CONTROLLER
 * Main application entry point
 */

import { NavigationController } from './components/navigation.js';
import { ViewManager } from './components/viewManager.js';
import { MetronomeEngine } from './components/metronome.js';
import { DarkModeToggle } from './components/darkModeToggle.js';
import { CONFIG } from './core/config.js';
import { updateSessionBadge } from './views/riyaz/sessionWizard.js';
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
     * Initialise the application
     */
    public init(): void {
        // Initialise navigation
        this.navigationController = new NavigationController('navigationMenu', 'mainContent');
        this.navigationController.render();
        
        // Initialise view manager
        // If there is a shared link (#share=...) always redirect to Riyaz
        this.viewManager = new ViewManager('mainContent');
        const hasShareHash = window.location.hash.startsWith('#share=');
        const lastView = hasShareHash
            ? CONFIG.VIEWS.RIYAZ
            : (localStorage.getItem('lastView') ?? CONFIG.VIEWS.DASHBOARD);
        this.viewManager.showView(lastView);
        this.navigationController.navigateTo(lastView);
        
        // Add dark mode toggle to body
        document.body.appendChild(this.darkModeToggle.render());
        
        // Listen for navigation events
        window.addEventListener('navigate', (e: Event) => {
            const customEvent = e as CustomEvent<NavigateEventDetail>;
            const viewId = customEvent.detail.viewId;
            if (this.viewManager) {
                this.viewManager.showView(viewId);
                localStorage.setItem('lastView', viewId);
            }
            // Re-initialise controls after switching view
            setTimeout(() => this.initializeControls(), 100);
        });
        
        // Initialise active session badge (persists across navigation)
        updateSessionBadge();

        // Initialise controls for the initial view
        setTimeout(() => this.initializeControls(), 100);

        // Home link — navigate to dashboard when clicking the title
        const homeLink = document.getElementById('homeLink');
        if (homeLink) {
            homeLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigationController?.navigateTo(CONFIG.VIEWS.DASHBOARD);
                this.closeSidebar();
            });
        }

        // Hamburger menu (mobile)
        this.initHamburger();

        // Scroll to top button
        this.initScrollToTop();
    }

    /**
     * Collapsible sidebar on mobile
     */
    private initHamburger(): void {
        const btn = document.getElementById('hamburgerBtn');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (!btn || !sidebar || !overlay) return;

        btn.addEventListener('click', () => {
            const isOpen = sidebar.classList.contains('open');
            if (isOpen) {
                this.closeSidebar();
            } else {
                sidebar.classList.add('open');
                btn.classList.add('open');
                overlay.classList.add('visible');
                document.body.classList.add('sidebar-open');
            }
        });

        overlay.addEventListener('click', () => this.closeSidebar());

        // Close sidebar when navigating on mobile
        window.addEventListener('navigate', () => {
            if (window.innerWidth < CONFIG.MOBILE_BREAKPOINT) this.closeSidebar();
        });
    }

    private closeSidebar(): void {
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('hamburgerBtn')?.classList.remove('open');
        document.getElementById('sidebarOverlay')?.classList.remove('visible');
        document.body.classList.remove('sidebar-open');
    }

    /**
     * Botón de scroll to top
     */
    private initScrollToTop(): void {
        const btn = document.getElementById('scrollTopBtn');
        const main = document.getElementById('mainContent');
        if (!btn || !main) return;

        main.addEventListener('scroll', () => {
            btn.classList.toggle('visible', main.scrollTop > CONFIG.SCROLL_TOP_THRESHOLD);
        });

        btn.addEventListener('click', () => {
            main.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    /**
     * Initialise interactive controls
     */
    private initializeControls(): void {
        this.initMetronomeControls();
        this.initBpmAdjButtons();
        this.initBpmPresets();
        this.initLehrasControls();
    }

    /**
     * BPM +/- adjustment buttons
     */
    private initBpmAdjButtons(): void {
        const minus = document.getElementById('bpmMinus') as HTMLButtonElement | null;
        const plus  = document.getElementById('bpmPlus')  as HTMLButtonElement | null;
        if (!minus || !plus) return;

        // Clone to avoid duplicate listeners on re-initialisations
        const newMinus = minus.cloneNode(true) as HTMLButtonElement;
        const newPlus  = plus.cloneNode(true)  as HTMLButtonElement;
        minus.parentNode?.replaceChild(newMinus, minus);
        plus.parentNode?.replaceChild(newPlus,   plus);

        const adjust = (delta: number) => {
            const slider  = document.getElementById('bpmSlider')  as HTMLInputElement | null;
            const display = document.getElementById('bpmDisplay');
            if (!slider || !display) return;

            const current = parseInt(slider.value);
            const next = Math.min(CONFIG.METRONOME.MAX_BPM,
                         Math.max(CONFIG.METRONOME.MIN_BPM, current + delta));
            slider.value = next.toString();
            display.textContent = next.toString();
            this.metronome.setBPM(next);
        };

        newMinus.addEventListener('click', () => adjust(-1));
        newPlus.addEventListener('click',  () => adjust(+1));
    }

    /**
     * BPM preset buttons
     */
    private initBpmPresets(): void {
        const presets = CONFIG.BPM_PRESETS;
        presets.forEach(bpm => {
            const btn = document.getElementById(`preset-${bpm}`) as HTMLButtonElement | null;
            if (!btn) return;
            btn.addEventListener('click', () => {
                const slider = document.getElementById('bpmSlider') as HTMLInputElement | null;
                const display = document.getElementById('bpmDisplay');
                if (slider) slider.value = bpm.toString();
                if (display) display.textContent = bpm.toString();
                this.metronome.setBPM(bpm);
                // Highlight active preset
                presets.forEach(b => {
                    document.getElementById(`preset-${b}`)?.classList.remove('active');
                });
                btn.classList.add('active');
            });
        });
    }
    
    /**
     * Initialise metronome controls
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
            // Remove previous listeners
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
            // Remove previous listeners
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
            // Remove previous listeners
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
                // If playing, stop it first
                if (this.metronome.getPlayingState()) {
                    this.metronome.stop();
                    
                    // Get the updated play/stop button from the DOM
                    const currentPlayButton = document.getElementById('playStopBtn') as HTMLButtonElement | null;
                    if (currentPlayButton) {
                        currentPlayButton.textContent = 'Iniciar';
                        currentPlayButton.classList.remove('btn-danger');
                        currentPlayButton.classList.add('btn-primary');
                    }
                }
                
                // Reset cycles
                this.metronome.resetCycles();
                if (cycleDisplay) {
                    cycleDisplay.textContent = '0';
                }
                
                // Reset visual indicators to initial state
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
     * Initialise lehra controls
     */
    private initLehrasControls(): void {
        const select = document.getElementById('lehraSelect') as HTMLSelectElement | null;
        const container = document.getElementById('lehraContainer');
        const iframe = document.getElementById('lehraIframe') as HTMLIFrameElement | null;
        
        if (select && container && iframe) {
            // Remove previous listeners
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

// Initialise application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new Application();
    app.init();
});

// Made with Bob
