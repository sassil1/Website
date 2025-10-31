/**
 * Circuit Interactions - User Interface and Event Handlers
 * Handles all user interactions, drag-and-drop, and UI updates
 */

class CircuitInteractions {
    constructor(circuit, renderer) {
        this.circuit = circuit;
        this.renderer = renderer;
        this.draggedComponent = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.selectedComponents = new Set(); // Track selected component IDs
        
        // Selection box for drag-to-select
        this.isBoxSelecting = false;
        this.selectionBox = null;
        this.selectionStartX = 0;
        this.selectionStartY = 0;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Voltage slider
        const voltageSlider = document.getElementById('voltage-slider');
        const voltageDisplay = document.getElementById('voltage-display');
        
        voltageSlider.addEventListener('input', (e) => {
            const voltage = parseFloat(e.target.value);
            voltageDisplay.textContent = voltage.toFixed(1);
            this.circuit.setVoltage(voltage);
            this.renderer.render();
            this.renderer.updateStats();
            this.setupComponentListeners();
            this.updateStatsPopups(); // Update popup with new values
        });

        // Add component buttons
        document.getElementById('add-resistor-btn').addEventListener('click', () => {
            this.showResistorModal();
        });

        document.getElementById('add-bulb-10-btn').addEventListener('click', () => {
            this.addComponent('bulb-10', 10);
        });

        document.getElementById('add-bulb-15-btn').addEventListener('click', () => {
            this.addComponent('bulb-15', 15);
        });

        document.getElementById('add-bulb-20-btn').addEventListener('click', () => {
            this.addComponent('bulb-20', 20);
        });

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the circuit?')) {
                this.circuit.reset();
                this.clearSelection();
                this.renderer.render();
                this.renderer.updateStats();
                this.setupComponentListeners();
                this.hideComponentDetails();
            }
        });
        
        // Clear selection button
        document.getElementById('clear-selection-btn').addEventListener('click', () => {
            this.clearSelection();
        });

        // Close component details
        document.getElementById('close-details-btn').addEventListener('click', () => {
            this.hideComponentDetails();
        });

        // Resistor modal
        document.getElementById('confirm-resistor-btn').addEventListener('click', () => {
            const value = parseFloat(document.getElementById('resistor-value').value);
            if (value > 0 && value <= 1000) {
                this.addComponent('resistor', value);
                this.hideResistorModal();
            } else {
                alert('Please enter a resistance value between 1 and 1000 Ohms');
            }
        });

        document.getElementById('cancel-resistor-btn').addEventListener('click', () => {
            this.hideResistorModal();
        });

        // Click outside modal to close
        document.getElementById('resistor-modal').addEventListener('click', (e) => {
            if (e.target.id === 'resistor-modal') {
                this.hideResistorModal();
            }
        });

        // Click on SVG background to deselect
        document.getElementById('circuit-svg').addEventListener('click', (e) => {
            if (e.target.id === 'circuit-svg' || e.target.id === 'circuit-group') {
                this.clearSelection();
                this.hideComponentDetails();
            }
        });

        // Enable drag-to-reposition
        this.setupDragToReposition();
        
        // Enable box selection
        this.setupBoxSelection();
    }
    
    setupComponentListeners() {
        // This should be called after each render to attach event listeners to components
        document.querySelectorAll('.component').forEach(componentEl => {
            const componentId = parseInt(componentEl.getAttribute('data-component-id'));
            
            componentEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
                this.selectComponent(componentId, isMultiSelect);
            });
            
            // Double-click to show details
            componentEl.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                this.renderer.showComponentDetails(componentId);
            });
        });
    }

    addComponent(type, resistance) {
        const placementMode = document.querySelector('input[name="placement"]:checked').value;
        
        // If no components are selected, default to the first component (original resistor)
        let targetComponents = Array.from(this.selectedComponents);
        if (targetComponents.length === 0) {
            // Default to the first component
            const firstComponent = this.circuit.getAllComponents()[0];
            if (firstComponent) {
                targetComponents = [firstComponent.id];
            }
        }
        
        this.circuit.addComponentToSelected(type, resistance, placementMode, targetComponents);
        this.clearSelection();
        this.renderer.render();
        this.renderer.updateStats();
        this.setupComponentListeners();
    }
    
    selectComponent(componentId, isMultiSelect = false) {
        if (!isMultiSelect) {
            this.clearSelection();
        }
        
        if (this.selectedComponents.has(componentId)) {
            this.selectedComponents.delete(componentId);
        } else {
            this.selectedComponents.add(componentId);
        }
        
        this.updateSelectionVisuals();
        this.updateStatsPopups();
    }
    
    clearSelection() {
        this.selectedComponents.clear();
        this.updateSelectionVisuals();
        this.renderer.hideStatsPopup();
    }
    
    updateSelectionVisuals() {
        // Remove all selection highlights
        document.querySelectorAll('.component.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Add selection highlights to selected components
        this.selectedComponents.forEach(id => {
            const componentEl = document.querySelector(`[data-component-id="${id}"]`);
            if (componentEl) {
                componentEl.classList.add('selected');
            }
        });
        
        // Update selection info panel
        const selectionInfo = document.getElementById('selection-info');
        const selectionCount = document.getElementById('selection-count');
        
        if (this.selectedComponents.size === 0) {
            selectionInfo.style.display = 'none';
        } else {
            selectionInfo.style.display = 'block';
            selectionCount.textContent = `${this.selectedComponents.size} component${this.selectedComponents.size > 1 ? 's' : ''}`;
        }
        
        // Update instruction text
        const instructionEl = document.querySelector('.instructions p');
        if (instructionEl) {
            if (this.selectedComponents.size === 0) {
                instructionEl.innerHTML = '💡 <strong>Tip:</strong> <strong>Click-and-drag</strong> to select multiple components, or click individual components. Ctrl/Cmd+Click for multi-select. Selected components show stats in a <strong>popup</strong>. New components are added to selected ones.';
            } else {
                instructionEl.innerHTML = `✅ <strong>${this.selectedComponents.size} component(s) selected</strong> (shown in <strong>bold</strong> with stats popup). New components will be added in series/parallel to the selected component(s).`;
            }
        }
    }
    
    updateStatsPopups() {
        // Show popup for the first selected component only (to avoid clutter)
        if (this.selectedComponents.size === 1) {
            const componentId = Array.from(this.selectedComponents)[0];
            this.renderer.showStatsPopup(componentId);
        } else if (this.selectedComponents.size > 1) {
            // For multiple selections, show popup for the first one
            const componentId = Array.from(this.selectedComponents)[0];
            this.renderer.showStatsPopup(componentId);
        } else {
            this.renderer.hideStatsPopup();
        }
    }

    showResistorModal() {
        document.getElementById('resistor-modal').style.display = 'flex';
        document.getElementById('resistor-value').focus();
    }

    hideResistorModal() {
        document.getElementById('resistor-modal').style.display = 'none';
    }

    hideComponentDetails() {
        document.getElementById('component-details').style.display = 'none';
        this.renderer.selectedComponent = null;
    }

    setupDragToReposition() {
        const svg = document.getElementById('circuit-svg');
        let draggedComponent = null;
        let draggedComponentId = null;
        let ghostElement = null;
        let startX = 0;
        let startY = 0;
        let isDragging = false;
        let hasMoved = false;
        const DRAG_THRESHOLD = 5; // pixels movement to start drag
        
        svg.addEventListener('mousedown', (e) => {
            const componentEl = e.target.closest('.component');
            if (!componentEl) return;
            
            // Don't interfere with box selection
            if (e.target.id === 'circuit-svg' || e.target.id === 'circuit-group') return;
            
            draggedComponentId = parseInt(componentEl.getAttribute('data-component-id'));
            draggedComponent = componentEl;
            
            const svgRect = svg.getBoundingClientRect();
            startX = e.clientX - svgRect.left;
            startY = e.clientY - svgRect.top;
            
            isDragging = false;
            hasMoved = false;
            
            // Don't prevent default yet - allow click events to work
        });
        
        svg.addEventListener('mousemove', (e) => {
            if (!draggedComponent || !draggedComponentId) return;
            
            const svgRect = svg.getBoundingClientRect();
            const currentX = e.clientX - svgRect.left;
            const currentY = e.clientY - svgRect.top;
            
            const dx = currentX - startX;
            const dy = currentY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only start dragging if moved beyond threshold
            if (!isDragging && distance > DRAG_THRESHOLD) {
                isDragging = true;
                hasMoved = true;
                
                // Create ghost element only when actually dragging
                ghostElement = draggedComponent.cloneNode(true);
                ghostElement.setAttribute('class', 'component component-dragging-ghost');
                ghostElement.style.opacity = '0.5';
                ghostElement.style.pointerEvents = 'none';
                document.getElementById('circuit-group').appendChild(ghostElement);
            }
            
            if (isDragging && ghostElement) {
                ghostElement.setAttribute('transform', `translate(${dx}, ${dy})`);
                // Highlight valid drop zones
                this.highlightDropZones(currentY);
            }
        });
        
        svg.addEventListener('mouseup', (e) => {
            if (!draggedComponent || !draggedComponentId) return;
            
            // If we actually dragged (not just clicked), reposition
            if (isDragging && hasMoved) {
                const svgRect = svg.getBoundingClientRect();
                const dropY = e.clientY - svgRect.top;
                
                // Remove ghost element
                if (ghostElement) {
                    ghostElement.remove();
                    ghostElement = null;
                }
                
                // Determine new position and reposition component
                this.repositionComponent(draggedComponentId, dropY);
                
                // Clear drop zone highlights
                this.clearDropZoneHighlights();
            }
            // If not dragged, this was a click - let the click handler deal with it
            
            draggedComponent = null;
            draggedComponentId = null;
            isDragging = false;
            hasMoved = false;
        });
        
        svg.addEventListener('mouseleave', (e) => {
            if (ghostElement) {
                ghostElement.remove();
                ghostElement = null;
            }
            this.clearDropZoneHighlights();
            draggedComponent = null;
            draggedComponentId = null;
            isDragging = false;
            hasMoved = false;
        });
    }
    
    highlightDropZones(mouseY) {
        // Remove existing highlights
        this.clearDropZoneHighlights();
        
        const topology = this.circuit.getTopology();
        const rightSideX = 700;
        
        // Create drop zone indicators between each series position
        const dropZones = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        dropZones.setAttribute('id', 'drop-zones');
        
        // Add drop zone at the top
        this.createDropZoneIndicator(dropZones, rightSideX, 150, 0);
        
        // Add drop zones between and after components
        let currentY = 150;
        topology.forEach((group, index) => {
            const groupHeight = group.length > 1 ? group.length * 60 : 70;
            currentY += groupHeight;
            this.createDropZoneIndicator(dropZones, rightSideX, currentY, index + 1);
        });
        
        document.getElementById('circuit-group').appendChild(dropZones);
    }
    
    createDropZoneIndicator(parent, x, y, position) {
        const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        indicator.setAttribute('cx', x);
        indicator.setAttribute('cy', y);
        indicator.setAttribute('r', 8);
        indicator.setAttribute('fill', '#3498db');
        indicator.setAttribute('opacity', '0.6');
        indicator.setAttribute('class', 'drop-zone-indicator');
        indicator.setAttribute('data-position', position);
        parent.appendChild(indicator);
    }
    
    clearDropZoneHighlights() {
        const dropZones = document.getElementById('drop-zones');
        if (dropZones) {
            dropZones.remove();
        }
    }
    
    repositionComponent(componentId, dropY) {
        const component = this.circuit.getComponentById(componentId);
        if (!component) return;
        
        const topology = this.circuit.getTopology();
        const oldPosition = component.position;
        
        // Determine new series position based on dropY
        let newSeriesIndex = 0;
        let cumulativeY = 150; // Starting Y position
        
        for (let i = 0; i < topology.length; i++) {
            const groupHeight = topology[i].length > 1 ? topology[i].length * 60 : 70;
            if (dropY < cumulativeY + groupHeight / 2) {
                newSeriesIndex = i;
                break;
            }
            cumulativeY += groupHeight;
            newSeriesIndex = i + 1;
        }
        
        // Don't do anything if dropping in the same position
        if (newSeriesIndex === oldPosition.seriesIndex) {
            return;
        }
        
        // Remove component from old position
        this.circuit.removeComponent(componentId);
        
        // Re-add component at new position
        const newComponent = this.circuit.addComponent(
            component.type,
            component.resistance,
            'series'
        );
        
        // Move it to the correct position in topology
        this.circuit.topology.pop(); // Remove from end
        
        if (newSeriesIndex >= this.circuit.topology.length) {
            this.circuit.topology.push([newComponent]);
        } else {
            this.circuit.topology.splice(newSeriesIndex, 0, [newComponent]);
        }
        
        // Update all positions
        this.circuit.updatePositions();
        this.circuit.calculateCircuit();
        
        // Re-render
        this.renderer.render();
        this.renderer.updateStats();
        this.setupComponentListeners();
    }
    
    setupBoxSelection() {
        const svg = document.getElementById('circuit-svg');
        
        svg.addEventListener('mousedown', (e) => {
            // Don't start box selection if clicking on a component
            if (e.target.closest('.component')) return;
            
            // Only start box selection on background
            if (e.target.id !== 'circuit-svg' && e.target.id !== 'circuit-group') return;
            
            this.isBoxSelecting = true;
            const svgRect = svg.getBoundingClientRect();
            this.selectionStartX = e.clientX - svgRect.left;
            this.selectionStartY = e.clientY - svgRect.top;
            
            // Clear selection if not holding Ctrl/Cmd
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                this.clearSelection();
            }
            
            // Create selection box element
            this.selectionBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            this.selectionBox.setAttribute('class', 'selection-box');
            this.selectionBox.setAttribute('fill', 'rgba(52, 152, 219, 0.2)');
            this.selectionBox.setAttribute('stroke', '#3498db');
            this.selectionBox.setAttribute('stroke-width', '2');
            this.selectionBox.setAttribute('stroke-dasharray', '5,5');
            document.getElementById('circuit-group').appendChild(this.selectionBox);
            
            e.preventDefault();
        });
        
        svg.addEventListener('mousemove', (e) => {
            if (!this.isBoxSelecting || !this.selectionBox) return;
            
            const svgRect = svg.getBoundingClientRect();
            const currentX = e.clientX - svgRect.left;
            const currentY = e.clientY - svgRect.top;
            
            const x = Math.min(this.selectionStartX, currentX);
            const y = Math.min(this.selectionStartY, currentY);
            const width = Math.abs(currentX - this.selectionStartX);
            const height = Math.abs(currentY - this.selectionStartY);
            
            this.selectionBox.setAttribute('x', x);
            this.selectionBox.setAttribute('y', y);
            this.selectionBox.setAttribute('width', width);
            this.selectionBox.setAttribute('height', height);
            
            // Highlight components within the box
            this.highlightComponentsInBox(x, y, width, height);
        });
        
        svg.addEventListener('mouseup', (e) => {
            if (!this.isBoxSelecting) return;
            
            if (this.selectionBox) {
                const x = parseFloat(this.selectionBox.getAttribute('x'));
                const y = parseFloat(this.selectionBox.getAttribute('y'));
                const width = parseFloat(this.selectionBox.getAttribute('width'));
                const height = parseFloat(this.selectionBox.getAttribute('height'));
                
                // Select all components within the box
                this.selectComponentsInBox(x, y, width, height);
                
                // Remove selection box
                this.selectionBox.remove();
                this.selectionBox = null;
            }
            
            this.isBoxSelecting = false;
        });
        
        svg.addEventListener('mouseleave', (e) => {
            if (this.isBoxSelecting && this.selectionBox) {
                this.selectionBox.remove();
                this.selectionBox = null;
                this.isBoxSelecting = false;
            }
        });
    }
    
    highlightComponentsInBox(boxX, boxY, boxWidth, boxHeight) {
        // Visual preview of which components will be selected (optional enhancement)
        // For now, we'll just do the selection on mouseup
    }
    
    selectComponentsInBox(boxX, boxY, boxWidth, boxHeight) {
        const boxRight = boxX + boxWidth;
        const boxBottom = boxY + boxHeight;
        
        document.querySelectorAll('.component').forEach(componentEl => {
            const bbox = componentEl.getBBox();
            const transform = componentEl.getCTM();
            
            // Get component's bounding box in SVG coordinates
            const compX = transform.e;
            const compY = transform.f;
            const compWidth = bbox.width;
            const compHeight = bbox.height;
            const compRight = compX + compWidth;
            const compBottom = compY + compHeight;
            
            // Check if component intersects with selection box
            const intersects = !(compRight < boxX || compX > boxRight || 
                               compBottom < boxY || compY > boxBottom);
            
            if (intersects) {
                const componentId = parseInt(componentEl.getAttribute('data-component-id'));
                this.selectedComponents.add(componentId);
            }
        });
        
        this.updateSelectionVisuals();
        this.updateStatsPopups();
    }
}

// Global interactions instance
let interactions = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const svgElement = document.getElementById('circuit-svg');
    
    // Initialize renderer
    renderer = new CircuitRenderer(svgElement, circuit);
    
    // Initialize interactions
    interactions = new CircuitInteractions(circuit, renderer);
    
    // Initial render
    renderer.render();
    renderer.updateStats();
    interactions.setupComponentListeners();
    
    console.log('Circuit Simulator initialized successfully!');
});

