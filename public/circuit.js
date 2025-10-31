/**
 * Circuit Simulator - Core Logic and Physics Calculations
 * Handles circuit model, component management, and electrical calculations
 */

class Component {
    constructor(id, type, resistance, position = null) {
        this.id = id;
        this.type = type; // 'resistor', 'bulb-10', 'bulb-15', 'bulb-20'
        this.resistance = resistance; // in Ohms
        this.current = 0; // in Amperes
        this.voltage = 0; // in Volts
        this.power = 0; // in Watts
        this.position = position; // {seriesIndex, parallelIndex}
    }

    isBulb() {
        return this.type.startsWith('bulb');
    }

    getDisplayName() {
        if (this.type === 'resistor') {
            return `Resistor (${this.resistance}Ω)`;
        } else if (this.type.startsWith('bulb')) {
            return `Light Bulb (${this.resistance}Ω)`;
        }
        return 'Component';
    }
}

class CircuitSimulator {
    constructor() {
        this.voltage = 12; // Default 12V
        this.components = [];
        this.nextId = 1;
        
        // Circuit topology: array of series positions, each can have parallel components
        // Structure: [ [comp1], [comp2, comp3], [comp4] ]
        // Represents: comp1 --- (comp2 || comp3) --- comp4
        this.topology = [];
        
        // Overall circuit values
        this.totalResistance = 0;
        this.totalCurrent = 0;
        this.totalPower = 0;
        
        // Initialize with default circuit (12V, 10Ω resistor)
        this.initializeDefaultCircuit();
    }

    initializeDefaultCircuit() {
        const defaultResistor = new Component(
            this.nextId++,
            'resistor',
            10,
            { seriesIndex: 0, parallelIndex: 0 }
        );
        this.components.push(defaultResistor);
        this.topology = [[defaultResistor]];
        this.calculateCircuit();
    }

    setVoltage(voltage) {
        this.voltage = parseFloat(voltage);
        this.calculateCircuit();
    }

    addComponent(type, resistance, placementMode = 'series', targetPosition = null) {
        const component = new Component(this.nextId++, type, resistance);
        this.components.push(component);

        if (placementMode === 'series') {
            // Insert as a new series position after target (if provided), else at end
            let insertIndex = this.topology.length;
            if (targetPosition && typeof targetPosition.seriesIndex === 'number') {
                insertIndex = Math.min(targetPosition.seriesIndex + 1, this.topology.length);
            }
            this.topology.splice(insertIndex, 0, [component]);
            component.position = { seriesIndex: insertIndex, parallelIndex: 0 };
            // Reindex positions after insertion
            this.updatePositions();
        } else {
            // Add in parallel to a target series position if provided, else to the last
            if (this.topology.length === 0) {
                // No components yet, add as first series position
                component.position = { seriesIndex: 0, parallelIndex: 0 };
                this.topology.push([component]);
            } else {
                const seriesIndex = (targetPosition && typeof targetPosition.seriesIndex === 'number')
                    ? Math.max(0, Math.min(targetPosition.seriesIndex, this.topology.length - 1))
                    : this.topology.length - 1;
                // Insert after the target parallelIndex if provided, else at end
                const afterIndex = (targetPosition && typeof targetPosition.parallelIndex === 'number')
                    ? Math.max(0, Math.min(targetPosition.parallelIndex + 1, this.topology[seriesIndex].length))
                    : this.topology[seriesIndex].length;
                this.topology[seriesIndex].splice(afterIndex, 0, component);
                component.position = { seriesIndex, parallelIndex: afterIndex };
                // Reindex positions after insertion
                this.updatePositions();
            }
        }

        this.calculateCircuit();
        return component;
    }
    
    addComponentToSelected(type, resistance, placementMode, selectedComponentIds) {
        if (selectedComponentIds.length === 0) {
            // Fallback to old behavior
            return this.addComponent(type, resistance, placementMode);
        }
        
        const newComponent = new Component(this.nextId++, type, resistance);
        this.components.push(newComponent);
        
        // Get the first selected component to determine position
        const selectedComponent = this.getComponentById(selectedComponentIds[0]);
        if (!selectedComponent) {
            // Fallback
            this.topology.push([newComponent]);
            newComponent.position = { seriesIndex: this.topology.length - 1, parallelIndex: 0 };
            this.calculateCircuit();
            return newComponent;
        }
        
        const { seriesIndex, parallelIndex } = selectedComponent.position;
        
        if (placementMode === 'series') {
            // Insert new series position after the selected component
            const newSeriesIndex = seriesIndex + 1;
            this.topology.splice(newSeriesIndex, 0, [newComponent]);
            newComponent.position = { seriesIndex: newSeriesIndex, parallelIndex: 0 };
            
            // Update positions of all components after the insertion
            this.updatePositions();
        } else {
            // Add in parallel to the selected component(s) directly adjacent to selection
            // Insert right after the selected component within the same series position
            const insertIndex = parallelIndex + 1;
            this.topology[seriesIndex].splice(insertIndex, 0, newComponent);
            newComponent.position = { seriesIndex, parallelIndex: insertIndex };
            // Update positions for all components in that series group
            this.updatePositions();
        }
        
        this.calculateCircuit();
        return newComponent;
    }

    removeComponent(componentId) {
        const component = this.components.find(c => c.id === componentId);
        if (!component) return false;

        const { seriesIndex, parallelIndex } = component.position;
        
        // Remove from topology
        this.topology[seriesIndex].splice(parallelIndex, 1);
        
        // If series position is now empty, remove it
        if (this.topology[seriesIndex].length === 0) {
            this.topology.splice(seriesIndex, 1);
        }
        
        // Remove from components array
        const index = this.components.findIndex(c => c.id === componentId);
        this.components.splice(index, 1);
        
        // Update positions for all remaining components
        this.updatePositions();
        
        // Recalculate if there are still components
        if (this.components.length > 0) {
            this.calculateCircuit();
        } else {
            this.resetCircuitValues();
        }
        
        return true;
    }

    moveComponent(componentId, newSeriesIndex, newParallelIndex) {
        const component = this.components.find(c => c.id === componentId);
        if (!component) return false;

        const { seriesIndex, parallelIndex } = component.position;
        
        // Remove from old position
        this.topology[seriesIndex].splice(parallelIndex, 1);
        if (this.topology[seriesIndex].length === 0) {
            this.topology.splice(seriesIndex, 1);
        }
        
        // Adjust indices if necessary
        if (newSeriesIndex > seriesIndex) {
            newSeriesIndex--;
        }
        
        // Ensure series position exists
        while (this.topology.length <= newSeriesIndex) {
            this.topology.push([]);
        }
        
        // Add to new position
        if (newParallelIndex >= this.topology[newSeriesIndex].length) {
            this.topology[newSeriesIndex].push(component);
        } else {
            this.topology[newSeriesIndex].splice(newParallelIndex, 0, component);
        }
        
        // Update all positions
        this.updatePositions();
        this.calculateCircuit();
        
        return true;
    }

    updatePositions() {
        this.topology.forEach((seriesGroup, seriesIndex) => {
            seriesGroup.forEach((component, parallelIndex) => {
                component.position = { seriesIndex, parallelIndex };
            });
        });
    }

    calculateCircuit() {
        if (this.components.length === 0) {
            this.resetCircuitValues();
            return;
        }

        // Step 1: Calculate equivalent resistance for each series position
        const seriesResistances = [];
        this.topology.forEach(parallelGroup => {
            if (parallelGroup.length === 1) {
                // Single component, use its resistance
                seriesResistances.push(parallelGroup[0].resistance);
            } else {
                // Multiple components in parallel: 1/R_eq = 1/R1 + 1/R2 + ...
                const reciprocalSum = parallelGroup.reduce(
                    (sum, comp) => sum + (1 / comp.resistance),
                    0
                );
                seriesResistances.push(1 / reciprocalSum);
            }
        });

        // Step 2: Calculate total resistance (sum of series resistances)
        this.totalResistance = seriesResistances.reduce((sum, r) => sum + r, 0);

        // Step 3: Calculate total current using Ohm's Law: I = V / R
        this.totalCurrent = this.voltage / this.totalResistance;

        // Step 4: Calculate total power: P = V * I
        this.totalPower = this.voltage * this.totalCurrent;

        // Step 5: Calculate voltage and current for each component
        this.topology.forEach((parallelGroup, seriesIndex) => {
            // Voltage drop across this series position
            const seriesVoltage = this.totalCurrent * seriesResistances[seriesIndex];
            
            parallelGroup.forEach(component => {
                // In parallel, voltage is the same across all components
                component.voltage = seriesVoltage;
                
                // Current through each component: I = V / R
                component.current = component.voltage / component.resistance;
                
                // Power dissipated: P = I^2 * R (or V * I)
                component.power = component.current * component.current * component.resistance;
            });
        });
    }

    resetCircuitValues() {
        this.totalResistance = 0;
        this.totalCurrent = 0;
        this.totalPower = 0;
        this.components.forEach(comp => {
            comp.current = 0;
            comp.voltage = 0;
            comp.power = 0;
        });
    }

    reset() {
        this.components = [];
        this.topology = [];
        this.nextId = 1;
        this.voltage = 12;
        this.initializeDefaultCircuit();
    }

    getComponentById(id) {
        return this.components.find(c => c.id === id);
    }

    getAllComponents() {
        return this.components;
    }

    getTopology() {
        return this.topology;
    }

    getStats() {
        return {
            voltage: this.voltage,
            totalCurrent: this.totalCurrent,
            totalResistance: this.totalResistance,
            totalPower: this.totalPower
        };
    }

    getComponentStats(componentId) {
        const component = this.getComponentById(componentId);
        if (!component) return null;

        return {
            id: component.id,
            name: component.getDisplayName(),
            type: component.type,
            resistance: component.resistance,
            voltage: component.voltage,
            current: component.current,
            power: component.power,
            position: component.position
        };
    }

    // Helper method to get maximum power among all bulbs (for brightness normalization)
    getMaxBulbPower() {
        const bulbs = this.components.filter(c => c.isBulb());
        if (bulbs.length === 0) return 0;
        return Math.max(...bulbs.map(b => b.power));
    }
}

// Global circuit instance
let circuit = new CircuitSimulator();

