/**
 * METRONOME ENGINE
 * Motor de metrónomo de alta precisión usando Web Audio API
 */

import { CONFIG } from '../core/config.js';

export class MetronomeEngine {
    private audioContext: AudioContext | null = null;
    private isPlaying: boolean = false;
    private currentBPM: number = CONFIG.METRONOME.DEFAULT_BPM;
    private nextNoteTime: number = 0.0;
    private timerID: number | null = null;
    private currentBeat: number = 0;
    private beatsPerMeasure: number = 6;
    private cycleCount: number = 0;
    private onBeatCallback: ((beat: number) => void) | null = null;
    private onCycleCallback: ((cycle: number) => void) | null = null;
    
    /**
     * Inicializa el contexto de audio
     */
    private initAudioContext(): void {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }
    
    /**
     * Genera un click de metrónomo usando oscilador
     * @param time - Tiempo exacto de reproducción
     * @param isSam - Si es el primer beat (Sam)
     */
    private playClick(time: number, isSam: boolean = false): void {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Sam sounds higher (1200 Hz) and louder
        // Normal beats sound at 800 Hz
        oscillator.frequency.value = isSam ? 1200 : CONFIG.METRONOME.CLICK_FREQUENCY;
        oscillator.type = 'sine';
        
        const volume = isSam ? CONFIG.METRONOME.CLICK_VOLUME * 1.3 : CONFIG.METRONOME.CLICK_VOLUME;
        gainNode.gain.setValueAtTime(volume, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + CONFIG.METRONOME.CLICK_DURATION);
        
        oscillator.start(time);
        oscillator.stop(time + CONFIG.METRONOME.CLICK_DURATION);
    }
    
    /**
     * Calcula el tiempo del siguiente beat
     */
    private nextNote(): void {
        const secondsPerBeat = 60.0 / this.currentBPM;
        this.nextNoteTime += secondsPerBeat;
        
        // Increment beat counter
        this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
        
        // Check if we completed a cycle
        if (this.currentBeat === 0) {
            this.cycleCount++;
            if (this.onCycleCallback) {
                this.onCycleCallback(this.cycleCount);
            }
        }
    }
    
    /**
     * Scheduler de alta precisión
     */
    private scheduler(): void {
        if (!this.audioContext) return;
        
        while (this.nextNoteTime < this.audioContext.currentTime + CONFIG.METRONOME.SCHEDULE_AHEAD_TIME) {
            // Notify callback BEFORE playing click
            if (this.onBeatCallback) {
                this.onBeatCallback(this.currentBeat);
            }
            
            // Check if current beat is Sam (beat 0)
            const isSam = this.currentBeat === 0;
            this.playClick(this.nextNoteTime, isSam);
            this.nextNote();
        }
    }
    
    /**
     * Set callback for beat notifications
     * @param callback - Function to call on each beat
     */
    public onBeat(callback: (beat: number) => void): void {
        this.onBeatCallback = callback;
    }
    
    /**
     * Set callback for cycle completion notifications
     * @param callback - Function to call on each cycle completion
     */
    public onCycle(callback: (cycle: number) => void): void {
        this.onCycleCallback = callback;
    }
    
    /**
     * Set beats per measure
     * @param beats - Number of beats per measure
     */
    public setBeatsPerMeasure(beats: number): void {
        this.beatsPerMeasure = beats;
        this.currentBeat = 0;
    }
    
    /**
     * Get current beats per measure
     * @returns Current beats per measure
     */
    public getBeatsPerMeasure(): number {
        return this.beatsPerMeasure;
    }
    
    /**
     * Reset cycle counter
     */
    public resetCycles(): void {
        this.cycleCount = 0;
    }
    
    /**
     * Get current cycle count
     * @returns Current cycle count
     */
    public getCycleCount(): number {
        return this.cycleCount;
    }
    
    /**
     * Inicia el metrónomo
     */
    public start(): void {
        this.initAudioContext();
        this.isPlaying = true;
        this.currentBeat = 0;
        this.cycleCount = 0;
        
        if (this.audioContext) {
            this.nextNoteTime = this.audioContext.currentTime;
            
            // Reproducir el primer click inmediatamente
            if (this.onBeatCallback) {
                this.onBeatCallback(this.currentBeat);
            }
            this.playClick(this.nextNoteTime, true); // Primer beat es siempre Sam
            this.nextNote();
        }
        
        this.timerID = window.setInterval(() => this.scheduler(), CONFIG.METRONOME.LOOKAHEAD);
    }
    
    /**
     * Detiene el metrónomo
     */
    public stop(): void {
        this.isPlaying = false;
        if (this.timerID !== null) {
            clearInterval(this.timerID);
            this.timerID = null;
        }
        this.currentBeat = 0;
    }
    
    /**
     * Actualiza el BPM
     * @param bpm - Nuevo valor de BPM
     */
    public setBPM(bpm: number): void {
        this.currentBPM = bpm;
    }
    
    /**
     * Obtiene el estado actual
     * @returns Estado de reproducción
     */
    public getPlayingState(): boolean {
        return this.isPlaying;
    }
}

// Made with Bob
