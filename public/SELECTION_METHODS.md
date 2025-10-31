# Component Selection Methods

The circuit simulator now supports multiple ways to select components for precise circuit building.

## Selection Methods

### 1. Click-and-Drag Box Selection (NEW!)

**How to use:**
- Click on the **background** (gray area around the circuit)
- Hold and drag to create a selection box
- All components within the box will be selected when you release

**Visual feedback:**
- A blue dashed rectangle appears as you drag
- Components that will be selected are highlighted

**Multi-select:**
- Hold **Ctrl** (Windows/Linux) or **Cmd** (Mac) while dragging to add to existing selection
- Otherwise, previous selection is cleared

**Perfect for:**
- Selecting multiple components at once
- Selecting an entire parallel group
- Quick selection of nearby components

### 2. Click Individual Components

**How to use:**
- Click directly on any resistor or lightbulb
- The component becomes selected

**Multi-select:**
- Hold **Ctrl/Cmd** while clicking to select multiple components
- Hold **Shift** while clicking for multi-select
- Click a selected component again to deselect it

**Perfect for:**
- Selecting a single specific component
- Building up a custom selection

### 3. Visual Selection Indicators

**Selected components are shown with:**
- ✅ **Bold outline** - Thicker, darker borders (stroke-width: 5)
- ✅ **Bold text** - All labels appear in bold font
- ✅ **Blue tint** - Slight blue background fill
- ✅ **Blue glow** - Drop shadow effect around component

**Unselected components:**
- Normal outline (stroke-width: 2)
- Regular font weight
- No background tint
- No glow effect

## Deselecting Components

### Clear All Selection
- Click on the **background** (gray circuit area)
- Click the **"Clear Selection"** button in the selection panel
- Press **Escape** key (if implemented)

### Deselect Single Component
- **Ctrl/Cmd + Click** on a selected component to toggle it off

## Selection Info Panel

When components are selected, a panel appears showing:
```
📌 Selected: 2 components [Clear Selection]
```

This panel:
- Shows the count of selected components
- Provides a quick "Clear Selection" button
- Only appears when at least one component is selected

## Adding Components to Selection

### Series Addition
1. **Select** the component(s) you want to add after
2. Choose **"Series (in line)"** mode
3. Click an "Add Component" button
4. New component appears **after** the first selected component

### Parallel Addition
1. **Select** the component(s) you want to parallel with
2. Choose **"Parallel (branched)"** mode
3. Click an "Add Component" button
4. New component appears **in parallel** with the first selected component

## Tips and Best Practices

### For Students
1. **Start Simple:** Try clicking individual components first
2. **Use Box Selection:** For selecting groups of parallel resistors
3. **Watch the Bold:** Selected components are clearly bold
4. **Experiment:** Selection is non-destructive - select and deselect freely

### For Teachers
1. **Demonstrate Both Methods:** Show click vs. drag selection
2. **Highlight Visual Cues:** Point out the bold styling
3. **Practice Exercises:** 
   - "Select all parallel resistors using box selection"
   - "Select every other resistor using click selection"
   - "Build a circuit by selecting specific components"

## Keyboard and Mouse Combinations

| Action | Method |
|--------|--------|
| **Select single** | Click component |
| **Box select** | Click-drag on background |
| **Multi-select** | Ctrl/Cmd + Click |
| **Add to selection** | Ctrl/Cmd + Click-drag |
| **Deselect all** | Click background |
| **Toggle selection** | Ctrl/Cmd + Click selected component |

## Common Workflows

### Workflow 1: Build Parallel Group
```
1. Add first resistor (R1)
2. Click R1 to select it
3. Choose "Parallel" mode
4. Add R2 → appears parallel to R1
5. Box-select R1 and R2
6. Add R3 → appears parallel to both
```

### Workflow 2: Build Series Chain
```
1. Add first resistor (R1)
2. Click R1 to select it
3. Choose "Series" mode
4. Add R2 → appears after R1
5. Click R2 (now selected)
6. Add R3 → appears after R2
```

### Workflow 3: Complex Circuit
```
1. Click-drag to select multiple components
2. Choose series/parallel mode
3. Add new component to the group
4. Click background to deselect
5. Repeat for next section
```

## Troubleshooting

**Q: Box selection isn't working**
- Make sure you're clicking on the **background**, not on a component
- Try clicking in the gray area of the SVG canvas
- Don't start the drag on a component

**Q: Components aren't appearing bold**
- Check that the component is actually selected (should have blue glow too)
- Refresh the page if styling isn't updating
- Make sure circuit.css is loaded properly

**Q: How do I select components that are overlapping?**
- Use Ctrl/Cmd + Click to add them one at a time
- Or use a large box selection that encompasses both
- Zoom in if components are too close

**Q: Selection box is too sensitive**
- Box selection only triggers when clicking the background
- If it's triggering accidentally, make sure you're clicking components directly
- Small drags (< 5px) might be ignored as clicks

---

**Updated Selection System** - Now with bold styling and box selection for intuitive component management!


