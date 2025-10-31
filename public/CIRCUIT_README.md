# Interactive Circuit Simulator

An educational tool for high school physics students to learn about circuits, resistors, Ohm's Law, and electrical power.

## Features

✅ **Adjustable Power Supply** - Control voltage from 0-24V  
✅ **Multiple Component Types** - Basic resistors and three lightbulb options (10Ω, 15Ω, 20Ω)  
✅ **Series & Parallel Configurations** - Build complex circuits with both topologies  
✅ **Real-time Calculations** - See voltage, current, and power instantly  
✅ **Visual Brightness** - Lightbulbs glow proportionally to their actual power consumption  
✅ **Rectangular Circuit Layout** - Clear, standard circuit diagram presentation  
✅ **Interactive Components** - Click to view detailed stats, delete unwanted components  

## How to Use

### Opening the Simulator

1. Simply open `circuit.html` in any modern web browser (Chrome, Firefox, Safari, Edge)
2. No installation or server required - it runs entirely in your browser!

### Basic Controls

**Voltage Control**
- Use the slider to adjust the power supply voltage (0-24V)
- Circuit calculations update in real-time

**Adding Components**
- Click "Basic Resistor" to add a custom resistor (you'll be prompted for the resistance value)
- Click any of the "💡 Bulb" buttons to add a lightbulb with preset resistance
- Choose "Series" or "Parallel" placement mode before adding

**Interacting with Components**
- Click any component to view detailed statistics
- Click "Delete Component" button to remove the selected component
- Use "Reset Circuit" to start fresh with the default 12V, 10Ω circuit

### Understanding the Display

**Overall Circuit Statistics** (bottom panel)
- **Total Voltage** - Power supply voltage
- **Total Current** - Current flowing through the circuit (Amperes)
- **Total Resistance** - Equivalent resistance of the entire circuit (Ohms)
- **Total Power** - Total power consumed by all components (Watts)

**Component Information** (shown on each component)
- **Resistance** - Component's resistance in Ohms
- **Current (I)** - Current flowing through this component
- **Voltage (V)** - Voltage drop across this component
- **Power (P)** - Power dissipated by this component

**Lightbulb Brightness**
- Brightness is proportional to actual power consumption
- Brighter glow = more power dissipated
- Compare multiple bulbs to see power differences visually

## Physics Concepts Demonstrated

### Ohm's Law
```
V = I × R
```
Voltage equals current times resistance

### Power Calculations
```
P = I² × R
P = V × I
```
Power can be calculated using current and resistance, or voltage and current

### Series Circuits
- Components share the same current
- Voltage divides across components
- Total resistance = R₁ + R₂ + R₃ + ...

### Parallel Circuits
- Components share the same voltage
- Current divides among branches
- Total resistance = 1 / (1/R₁ + 1/R₂ + 1/R₃ + ...)

## Example Experiments

### Experiment 1: Series Resistors
1. Start with the default circuit (12V, 10Ω resistor)
2. Select "Series" mode
3. Add another 10Ω resistor
4. Observe: Total resistance doubles, current halves, voltage splits equally

### Experiment 2: Parallel Resistors
1. Reset the circuit
2. Select "Parallel" mode
3. Add another 10Ω resistor
4. Observe: Total resistance halves, total current doubles, voltage stays the same across both

### Experiment 3: Lightbulb Brightness
1. Reset the circuit
2. Add three 10Ω bulbs in parallel
3. Observe: All bulbs have equal brightness (same voltage and resistance)
4. Now add a 10Ω bulb in series
5. Observe: The series bulb is brighter than the parallel bulbs (more current flows through it)

### Experiment 4: Mixed Configuration
1. Add a 15Ω bulb in series
2. Then add two 20Ω bulbs in parallel
3. Compare the brightness differences
4. Click each component to see why some are brighter than others

## Tips for Teachers

- Start with simple series circuits to teach voltage division
- Use parallel circuits to demonstrate current division
- Compare lightbulb brightness to make power consumption tangible
- Have students predict brightness before building, then verify
- Use the component details panel to show exact calculations
- Adjust voltage to show how it affects all circuit parameters

## Browser Compatibility

Works in all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

**Circuit looks empty**
- Make sure you've added components using the "Add Component" buttons
- Try clicking "Reset Circuit" to restore the default configuration

**Lightbulbs not glowing**
- Check that the voltage is above 0V
- Verify the circuit is complete (components are connected)
- Some bulbs may be very dim if they're receiving little power

**Stats not updating**
- Refresh the page
- Make sure JavaScript is enabled in your browser

## Educational Standards Alignment

This simulator helps teach concepts from:
- Electric circuits and current flow
- Ohm's Law and electrical resistance
- Series and parallel circuit configurations
- Electrical power and energy
- Circuit analysis and problem-solving

Perfect for physics curricula at the high school level (typically grades 9-12).

---

Created for physics education - making electricity visible and interactive!


