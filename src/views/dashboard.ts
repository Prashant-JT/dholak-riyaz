/**
 * DASHBOARD VIEW
 * Vista principal con metrónomo y lehras
 */

import { createElement } from '../core/utils.js';
import { CONFIG } from '../core/config.js';
import { LEHRAS } from '../data/lehras.js';
import type { View } from '../types.js';

export class DashboardView implements View {
    public render(): HTMLElement {
        const section = createElement('section', { 
            id: 'dashboard', 
            className: 'view-section active' 
        });
        
        const header = createElement('div', { className: 'mb-8' });
        header.appendChild(createElement('h2', {
            className: 'section-title'
        }, 'Riyaz'));
        header.appendChild(createElement('p', {
            className: 'section-subtitle'
        }, 'Metrónomo y Herramientas de Práctica'));
        section.appendChild(header);
        
        section.appendChild(this.createRiyazFormCard());
        section.appendChild(this.createMetronomeCard());
        section.appendChild(this.createLehrasCard());
        
        return section;
    }
    
    private createRiyazFormCard(): HTMLElement {
        const card = createElement('div', {
            className: 'card p-6 mb-6'
        });
        
        // Compact layout with flex
        const content = createElement('div', { className: 'flex items-center justify-between gap-4' });
        
        // Left side: Icon + Text
        const leftSide = createElement('div', { className: 'flex items-center gap-4' });
        leftSide.appendChild(createElement('span', {
            className: 'text-6xl'
        }, '📝'));
        
        const textContainer = createElement('div');
        textContainer.appendChild(createElement('h3', {
            className: 'text-xl font-bold'
        }, 'Registro de Práctica'));
        textContainer.appendChild(createElement('p', {
            className: 'text-base text-slate-500'
        }, 'Registra tu Riyaz de hoy'));
        
        leftSide.appendChild(textContainer);
        content.appendChild(leftSide);
        
        // Right side: Button
        const button = createElement('a', {
            href: 'https://forms.gle/a7hrsQS8nR6CGLdZ8',
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-bold text-lg whitespace-nowrap shadow-md hover:shadow-lg'
        });
        button.innerHTML = '📋 Registrar';
        content.appendChild(button);
        
        card.appendChild(content);
        return card;
    }
    
    private createMetronomeCard(): HTMLElement {
        const card = createElement('div', { className: 'card p-6 mb-6' });
        
        card.appendChild(createElement('h3', {
            className: 'text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4'
        }, 'Metrónomo'));
        
        const displayContainer = createElement('div', {
            className: 'flex flex-col items-center mb-6'
        });
        
        // Beat indicators (6 balls for Dadra)
        const beatIndicators = createElement('div', {
            id: 'beatIndicators',
            className: 'flex flex-wrap justify-center gap-2 mb-4'
        });
        
        for (let i = 0; i < 6; i++) {
            const ball = createElement('div', {
                className: 'beat-indicator',
                'data-beat': i.toString()
            });
            beatIndicators.appendChild(ball);
        }
        displayContainer.appendChild(beatIndicators);
        
        displayContainer.appendChild(createElement('div', {
            id: 'bpmDisplay',
            className: 'text-5xl font-bold text-slate-800 dark:text-slate-100 mono-font mb-1'
        }, CONFIG.METRONOME.DEFAULT_BPM.toString()));
        
        displayContainer.appendChild(createElement('p', {
            className: 'text-slate-500 dark:text-slate-400 text-sm mb-4'
        }, 'BPM'));
        
        // Cycle counter
        const cycleContainer = createElement('div', {
            className: 'flex items-center gap-3 mb-4'
        });
        
        cycleContainer.appendChild(createElement('span', {
            className: 'text-slate-600 dark:text-slate-300 font-medium'
        }, 'Ciclos:'));
        
        cycleContainer.appendChild(createElement('div', {
            id: 'cycleDisplay',
            className: 'text-3xl font-bold text-orange-600 mono-font'
        }, '0'));
        
        displayContainer.appendChild(cycleContainer);
        
        // BPM Slider with marks
        const bpmSliderContainer = createElement('div', {
            className: 'w-full max-w-md mb-4'
        });
        bpmSliderContainer.appendChild(createElement('label', {
            className: 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'
        }, 'Tempo (BPM)'));
        
        const sliderWrapper = createElement('div', { className: 'relative' });
        
        const bpmSlider = createElement('input', {
            type: 'range',
            id: 'bpmSlider',
            min: CONFIG.METRONOME.MIN_BPM.toString(),
            max: CONFIG.METRONOME.MAX_BPM.toString(),
            value: CONFIG.METRONOME.DEFAULT_BPM.toString(),
            className: 'w-full'
        });
        sliderWrapper.appendChild(bpmSlider);
        
        // Marcas para BPMs comunes de riyaz
        const marks = createElement('div', { className: 'bpm-marks' });
        const commonBPMs = [60, 80, 105, 120, 180, 200, 240, 300];
        commonBPMs.forEach(bpm => {
            const position = ((bpm - 60) / (300 - 60)) * 100;
            const mark = createElement('div', {
                className: 'bpm-mark',
                style: { left: `${position}%` }
            });
            mark.appendChild(createElement('div', { className: 'bpm-mark-line' }));
            mark.appendChild(createElement('div', { className: 'bpm-mark-label' }, bpm.toString()));
            marks.appendChild(mark);
        });
        sliderWrapper.appendChild(marks);
        
        bpmSliderContainer.appendChild(sliderWrapper);
        displayContainer.appendChild(bpmSliderContainer);
        
        // Beats per measure dropdown
        const beatsSelectContainer = createElement('div', {
            className: 'w-full max-w-md mb-4'
        });
        beatsSelectContainer.appendChild(createElement('label', {
            for: 'beatsSelect',
            className: 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'
        }, 'Beats por Compás'));
        
        const beatsSelect = createElement('select', {
            id: 'beatsSelect',
            className: 'w-full'
        });
        
        const beatsOptions = [
            { value: '4', label: '4 Beats - Bhajan' },
            { value: '5', label: '5 Beats - Jhaptal' },
            { value: '6', label: '6 Beats - Dadra' },
            { value: '7', label: '7 Beats - Rupak' },
            { value: '8', label: '8 Beats - Keherwa' },
            { value: '10', label: '10 Beats - Jhaptal' },
            { value: '12', label: '12 Beats - Ektal' },
            { value: '14', label: '14 Beats - Deepchandi' },
            { value: '16', label: '16 Beats - Teental' }
        ];
        
        beatsOptions.forEach(opt => {
            const option = createElement('option', {
                value: opt.value
            }, opt.label);
            if (opt.value === '6') {
                option.setAttribute('selected', 'true');
            }
            beatsSelect.appendChild(option);
        });
        
        beatsSelectContainer.appendChild(beatsSelect);
        displayContainer.appendChild(beatsSelectContainer);
        
        // Botones de control
        const buttonContainer = createElement('div', {
            className: 'flex gap-4 items-center justify-center mt-6'
        });
        
        // Botón Play/Stop
        const playButton = createElement('button', {
            id: 'playStopBtn',
            className: 'btn-primary text-white font-semibold py-4 px-12 rounded-full text-lg min-w-[140px]'
        }, 'Iniciar');
        buttonContainer.appendChild(playButton);
        
        // Botón Reset Ciclos
        const resetButton = createElement('button', {
            id: 'resetCyclesBtn',
            className: 'btn-secondary py-4 px-8 text-lg'
        }, 'Reset');
        buttonContainer.appendChild(resetButton);
        
        displayContainer.appendChild(buttonContainer);
        
        card.appendChild(displayContainer);
        
        return card;
    }
    
    private createLehrasCard(): HTMLElement {
        const card = createElement('div', { className: 'card p-6' });
        
        card.appendChild(createElement('h3', {
            className: 'text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4'
        }, 'Lehras'));
        
        const selectContainer = createElement('div', { className: 'mb-4' });
        selectContainer.appendChild(createElement('label', {
            for: 'lehraSelect',
            className: 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'
        }, 'Selecciona un Loop:'));
        
        const select = createElement('select', {
            id: 'lehraSelect',
            className: 'w-full max-w-2xl'
        });
        
        LEHRAS.forEach(lehra => {
            const option = createElement('option', { 
                value: lehra.url 
            }, lehra.label);
            select.appendChild(option);
        });
        
        selectContainer.appendChild(select);
        card.appendChild(selectContainer);
        
        const iframeContainer = createElement('div', { 
            id: 'lehraContainer', 
            className: 'hidden' 
        }, [
            createElement('div', { className: 'iframe-container' }, [
                createElement('iframe', {
                    id: 'lehraIframe',
                    frameborder: '0',
                    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                    allowfullscreen: 'true'
                })
            ])
        ]);
        
        card.appendChild(iframeContainer);
        
        return card;
    }
}

// Made with Bob
