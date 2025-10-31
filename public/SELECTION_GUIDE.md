# Circuit Simulator - Selection-Based Component Addition

## How It Works Now

The circuit simulator now uses a **selection-based system** for adding components. This gives you precise control over where new components are placed in the circuit.

## Usage Guide

### 1. Selecting Components

**Single Selection:**
- Click any component (resistor or lightbulb) to select it
- The component will be highlighted with a blue glow
- A selection panel appears showing how many components are selected

**Multi-Selection:**
- Hold **Ctrl** (Windows/Linux) or **Cmd** (Mac) while clicking to select multiple components
- Or hold **Shift** while clicking
- All selected components will glow blue

**Deselecting:**
- Click on the background (gray area) to clear all selections
- Or click the "Clear Selection" button in the selection panel
- Or click a selected component again to deselect just that one

### 2. Adding Components in Series

1. **Select** the component you want to add after
2. Choose **"Series (in line)"** placement mode
3. Click any "Add Component" button
4. The new component will be inserted **immediately after** the selected component

**Example:**
```
Before: Battery → R1 → back to battery
Select: R1
Add in Series: R2
After: Battery → R1 → R2 → back to battery
```

### 3. Adding Components in Parallel

1. **Select** the component you want to add parallel to
2. Choose **"Parallel (branched)"** placement mode
3. Click any "Add Component" button
4. The new component will be added **in parallel** with the selected component

**Example:**
```
Before: Battery → R1 → back to battery
Select: R1
Add in Parallel: R2
After: Battery → [R1 and R2 in parallel] → back to battery
```

### 4. Default Behavior (No Selection)

If you don't select anything:
- New components are added to the **original resistor** (the default 10Ω resistor from startup)
- Series: Adds after the original resistor
- Parallel: Adds in parallel with the original resistor

This ensures you can always add components even if you forget to select!

## Visual Feedback

### Selection Indicators

1. **Blue Glow**: Selected components have a bright blue glow effect
2. **Blue Border**: Component outlines turn blue when selected
3. **Selection Panel**: Shows "📌 Selected: X components" when components are selected
4. **Instructions Update**: The tip text changes to guide you based on your selection

### Component Details

- **Single Click**: Select/deselect component
- **Double Click**: Show detailed component information panel
- **Ctrl/Cmd + Click**: Add to selection (multi-select)

## Advanced Examples

### Building Complex Circuits

**Example 1: Series Chain**
```
1. Start with default: Battery → R1
2. Select R1, add R2 in series → Battery → R1 → R2
3. Select R2, add R3 in series → Battery → R1 → R2 → R3
```

**Example 2: Parallel Groups**
```
1. Start with default: Battery → R1
2. Select R1, add R2 in parallel → Battery → [R1 || R2]
3. Keep R1 selected, add R3 in parallel → Battery → [R1 || R2 || R3]
```

**Example 3: Mixed Configuration**
```
1. Start: Battery → R1
2. Select R1, add R2 in series → Battery → R1 → R2
3. Select R2, add R3 in parallel → Battery → R1 → [R2 || R3]
4. Select R1, add R4 in parallel → Battery → [R1 || R4] → [R2 || R3]
```

## Tips for Teachers

1. **Start Simple**: Have students practice with single selections first
2. **Visual Learning**: The blue glow makes it clear which component will be affected
3. **Experiment**: Students can try different configurations without breaking anything
4. **Compare**: Select different components and compare their electrical properties

## Troubleshooting

**Q: I clicked a component but it's not selecting**
- Make sure you're clicking directly on the component (resistor box or lightbulb circle)
- Try clicking the center of the component

**Q: My new component went to the wrong place**
- Check which component is selected (blue glow)
- Verify you have the correct placement mode (Series vs Parallel)
- If unsure, click background to deselect, then try again

**Q: How do I add a third parallel resistor?**
- Select any one of the existing parallel resistors
- Choose "Parallel" mode
- Add your new component - it will join the parallel group

**Q: Can I select components from different parts of the circuit?**
- Yes! You can multi-select components anywhere in the circuit
- However, new components are added based on the *first* selected component's position

## Keyboard Shortcuts

- **Ctrl/Cmd + Click**: Multi-select components
- **Shift + Click**: Multi-select components
- **Click Background**: Deselect all
- **Double Click Component**: Show details panel

---

This selection system gives you full control over your circuit topology while keeping the interface intuitive and visual!


