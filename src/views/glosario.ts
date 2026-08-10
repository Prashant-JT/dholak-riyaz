/**
 * GLOSARIO VIEW
 * Bol glossary view
 */

import { createElement, createBolIndicatorsLegend, createSectionHeader } from '../core/utils.js';
import { BOLS_BY_CATEGORY } from '../data/bols.js';
import { t, getLang } from '../i18n/index.js';
import type { View, Bol } from '../types.js';

export class GlosarioView implements View {
    public render(): HTMLElement {
        const section = createElement('section', { 
            id: 'glosario', 
            className: 'view-section' 
        });
        
        section.appendChild(createSectionHeader(t('glosario.pageTitle'), t('glosario.pageSubtitle')));
        
        // Taal theory
        const theorySection = createElement('div', { className: 'card p-8 mb-8' });
        theorySection.appendChild(createElement('h3', {
            className: 'text-2xl font-bold mb-6'
        }, t('glosario.taalConcept')));
        
        // Visual concept diagram
        const diagram = this.createTaalDiagram();
        theorySection.appendChild(diagram);
        
        const conceptKeys = ['matra','vibhag','sam','khali','bhari','lay','bol','avartan'] as const;
        const concepts = conceptKeys.map(k => ({
            term: t(`glosario.concepts.${k}.term`),
            definition: t(`glosario.concepts.${k}.def`),
        }));
        
        concepts.forEach(concept => {
            const conceptDiv = createElement('div', { className: 'mb-4' });
            conceptDiv.appendChild(createElement('h4', {
                className: 'text-lg font-bold text-orange-500 mb-1'
            }, concept.term));
            conceptDiv.appendChild(createElement('p', {
                className: 'text-muted'
            }, concept.definition));
            theorySection.appendChild(conceptDiv);
        });
        
        section.appendChild(theorySection);
        
        // Bol glossary - three columns
        const bolsHeader = createElement('h3', {
            className: 'section-title'
        }, t('glosario.bolsTitle'));
        section.appendChild(bolsHeader);
        
        // Three-column container
        const columnsContainer = createElement('div', {
            className: 'grid grid-cols-1 md:grid-cols-3 gap-6'
        });
        
        const chattiColumn = this.createBolColumn(
            t('glosario.colChatti'), t('glosario.colChattiSub'),
            BOLS_BY_CATEGORY.chatti, 'glosario-col--orange'
        );
        columnsContainer.appendChild(chattiColumn);
        
        const bayanColumn = this.createBolColumn(
            t('glosario.colBayan'), t('glosario.colBayanSub'),
            BOLS_BY_CATEGORY.bayan, 'glosario-col--blue'
        );
        columnsContainer.appendChild(bayanColumn);
        
        const compuestosColumn = this.createBolColumn(
            t('glosario.colCompuestos'), t('glosario.colCompuestosSub'),
            BOLS_BY_CATEGORY.compuestos, 'glosario-col--purple'
        );
        columnsContainer.appendChild(compuestosColumn);
        
        section.appendChild(columnsContainer);

        section.appendChild(createBolIndicatorsLegend());

        return section;
    }
    
    private createTaalDiagram(): HTMLElement {
        const diagramContainer = createElement('div', {
            className: 'taal-diagram mb-8'
        });
        
        // TAAL (main node)
        const taalNode = createElement('div', {
            className: 'diagram-node diagram-node-main'
        }, 'TAAL');
        diagramContainer.appendChild(taalNode);
        
        // Main connector line
        const mainLine = createElement('div', { className: 'diagram-line-main' });
        diagramContainer.appendChild(mainLine);
        
        // Secondary nodes container
        const secondaryNodes = createElement('div', { className: 'diagram-secondary-row' });
        
        const nodes = [
            { label: t('glosario.diagramNodes.lay'),    desc: t('glosario.diagramNodes.layDesc') },
            { label: t('glosario.diagramNodes.matra'),  desc: t('glosario.diagramNodes.matraDesc') },
            { label: t('glosario.diagramNodes.vibhag'), desc: t('glosario.diagramNodes.vibhagDesc') },
            { label: t('glosario.diagramNodes.bol'),    desc: t('glosario.diagramNodes.bolDesc') },
        ];
        
        nodes.forEach(node => {
            const nodeContainer = createElement('div', { className: 'diagram-node-container' });
            
            const nodeEl = createElement('div', { className: 'diagram-node diagram-node-secondary' }, node.label);
            nodeContainer.appendChild(nodeEl);
            
            const desc = createElement('div', { className: 'diagram-node-desc' }, node.desc);
            nodeContainer.appendChild(desc);
            
            secondaryNodes.appendChild(nodeContainer);
        });
        
        diagramContainer.appendChild(secondaryNodes);
        
        // LAY subdivisions
        const laySubdivisions = createElement('div', { className: 'diagram-tertiary-row' });
        const layTypes = [
            t('glosario.diagramNodes.drut'),
            t('glosario.diagramNodes.madhya'),
            t('glosario.diagramNodes.vilambit'),
        ];
        
        layTypes.forEach(type => {
            const subNode = createElement('div', {
                className: 'diagram-node diagram-node-tertiary'
            }, type);
            laySubdivisions.appendChild(subNode);
        });
        
        diagramContainer.appendChild(laySubdivisions);
        
        return diagramContainer;
    }
    
    private createBolColumn(title: string, subtitle: string, bols: Bol[], colorClass: string): HTMLElement {
        const column = createElement('div', {
            className: `glosario-col ${colorClass}`
        });
        
        // Column header
        const header = createElement('div', { className: 'mb-6' });
        header.appendChild(createElement('h4', {
            className: 'text-2xl font-bold mb-1'
        }, title));
        header.appendChild(createElement('p', {
            className: 'text-sm text-muted italic'
        }, subtitle));
        column.appendChild(header);
        
        // Bols in this category
        bols.forEach((bol) => {
            const bolSection = createElement('div', {
                className: 'glosario-col__bol'
            });
            
            // Bol header: name + indicators
            const bolHeader = createElement('div', { className: 'glosario-col__bol-header' });
            bolHeader.appendChild(createElement('h5', {
                className: 'text-xl font-bold'
            }, bol.name));
            
            // Thapki / ghuisa indicators
            if (bol.thapki || bol.ghuisa) {
                const indicators = createElement('div', { className: 'bol-indicators' });
                if (bol.thapki) {
                    const dot = createElement('span', {
                        className: 'bol-indicator bol-indicator--thapki',
                        title: t('glosario.thapkiTitle')
                    }, '');
                    indicators.appendChild(dot);
                }
                if (bol.ghuisa) {
                    const dot = createElement('span', {
                        className: 'bol-indicator bol-indicator--ghuisa',
                        title: t('glosario.ghuisaTitle')
                    }, '');
                    indicators.appendChild(dot);
                }
                bolHeader.appendChild(indicators);
            }
            bolSection.appendChild(bolHeader);
            
            // Technique
            const isEn = getLang() === 'en';
            const tecnicaP = createElement('p', { className: 'text-muted mb-1 mt-2' });
            tecnicaP.innerHTML = `<strong>${t('glosario.technique')}</strong> ${isEn && bol.technique_en ? bol.technique_en : bol.technique}`;
            bolSection.appendChild(tecnicaP);
            
            // Description
            bolSection.appendChild(createElement('p', {
                className: 'text-muted'
            }, isEn && bol.description_en ? bol.description_en : bol.description));
            
            column.appendChild(bolSection);
        });
        
        return column;
    }
}

// Made with Bob
