# Drag-and-Drop Repositioning Feature

## Overview

You can now **drag components to reposition them** in the circuit! This allows for intuitive circuit reconfiguration with automatic recalculation of all electrical properties.

## How to Use

### Dragging a Component

1. **Click and hold** on any resistor or lightbulb
2. **Drag** it up or down along the circuit
3. **Blue circles** appear showing valid drop zones
4. **Release** at a drop zone to place the component there
5. Circuit **automatically recalculates** V, I, P, and R values

### Visual Feedback

**While Dragging:**
- ✅ **Ghost preview** - Semi-transparent copy follows your cursor
- ✅ **Drop zone indicators** - Blue circles show where you can drop
- ✅ **Snap to position** - Component aligns to the nearest series position

**After Dropping:**
- ✅ Circuit re-renders with component in new position
- ✅ All electrical values recalculate instantly
- ✅ Wiring automatically adjusts
- ✅ Stats popup updates if component was selected

## Drop Zones

Drop zones appear as **blue circles** along the vertical wire:

```
        ⚪ (Drop Zone 0 - Before all components)
        
       10Ω
        
        ⚪ (Drop Zone 1 - After 10Ω)
        
       15Ω
        
        ⚪ (Drop Zone 2 - After 15Ω)
        
       20Ω
        
        ⚪ (Drop Zone 3 - After 20Ω)
```

### Drop Zone Behavior:

- **Hover effect** - Circles grow larger when mouse is near
- **Smart positioning** - Component snaps to nearest drop zone
- **Series preservation** - Components stay in series (can't drag into parallel)
- **Order management** - Dropping changes the series order

## Examples

### Example 1: Reordering Series Components

**Start:**
```
Battery → 10Ω → 15Ω → 20Ω → Battery
```

**Action:** Drag 20Ω to the first position

**Result:**
```
Battery → 20Ω → 10Ω → 15Ω → Battery
```

**Effect:** Voltage drops and power dissipation recalculate for each component

### Example 2: Moving Component to Middle

**Start:**
```
Battery → 10Ω → 20Ω → Battery
```

**Action:** Add 15Ω in series, then drag 20Ω between 10Ω and 15Ω

**Result:**
```
Battery → 10Ω → 20Ω → 15Ω → Battery
```

### Example 3: Reordering After Adding

**Start:**
```
Battery → R1 → (R2 || R3) → Battery
```

**Action:** Drag R1 to after the parallel group

**Result:**
```
Battery → (R2 || R3) → R1 → Battery
```

**Effect:** Current distribution and voltage drops completely recalculate

## Technical Details

### How It Works:

1. **Drag Detection**
   - Mousedown on component starts drag
   - Component ID and position stored
   
2. **Ghost Element**
   - Clone of component created
   - 50% opacity, blue drop shadow
   - Follows cursor during drag
   
3. **Drop Zone Calculation**
   - Zones placed between each series position
   - Based on vertical Y coordinates
   - Height adjusted for parallel groups
   
4. **Position Determination**
   - Drop Y coordinate compared to zone positions
   - Finds closest/nearest series index
   - Prevents dropping in same position
   
5. **Topology Update**
   - Component removed from old position
   - Re-inserted at new series index
   - All positions updated
   - Circuit recalculates
   
6. **Re-render**
   - Circuit drawn with new layout
   - Stats updated
   - Event listeners re-attached

### Conflict Resolution:

**Drag vs. Selection:**
- Drag takes priority when clicking a component
- Box selection only works on background
- Component stays selectable (click without drag)

**Drag vs. Double-Click:**
- Quick click → Selection
- Click + hold + move → Drag
- Double-click → Details panel

## Benefits

### For Students:
- ✅ **Experiment easily** - Try different orders without deleting/re-adding
- ✅ **See cause-effect** - Watch values change as you reorder
- ✅ **Visual learning** - Physical manipulation aids understanding
- ✅ **Quick iteration** - Test multiple configurations rapidly

### For Teachers:
- ✅ **Interactive demos** - Drag components during presentations
- ✅ **What-if scenarios** - "What happens if we move this resistor here?"
- ✅ **Engagement** - Students actively manipulate the circuit
- ✅ **Troubleshooting** - Quickly test different arrangements

## Keyboard/Mouse Reference

| Action | Result |
|--------|--------|
| **Click component** | Select (show stats popup) |
| **Click + drag component** | Reposition in circuit |
| **Click + drag background** | Box select multiple |
| **Drag to blue circle** | Drop at that position |
| **Release during drag** | Place component |
| **Drag outside + release** | Cancel (component stays) |

## Educational Use Cases

### Use Case 1: Order Dependence in Series
**Question:** "Does order matter in a series circuit?"

1. Build circuit: 10Ω → 15Ω → 20Ω
2. Note total current (same everywhere)
3. Drag 20Ω to first position
4. **Observe:** Total current unchanged!
5. **Conclusion:** Order doesn't affect series calculations

### Use Case 2: Position and Voltage Drop
**Question:** "How does position affect voltage drop?"

1. Build: R1(10Ω) → R2(20Ω) → R3(10Ω)
2. Note: R2 has largest voltage drop
3. Drag R2 to middle
4. **Observe:** Voltage drop pattern changes
5. **Teach:** V = IR, position affects available voltage

### Use Case 3: Mixed Circuit Reordering
**Question:** "What happens if we reorder around parallel?"

1. Build: R1 → (R2 || R3) → R4
2. Note current splits at parallel
3. Drag R1 after parallel
4. **Observe:** Now (R2 || R3) → R1 → R4
5. **Teach:** Series-parallel combination behavior

## Tips

1. **Start with simple circuits** - Practice dragging with 2-3 components
2. **Watch the stats** - Keep popup open to see values change
3. **Use drop zone hover** - Circles grow to show where you'll drop
4. **Experiment freely** - Drag anywhere, circuit always recalculates correctly
5. **Compare before/after** - Note values, drag, compare new values

## Troubleshooting

**Q: Component isn't dragging**
- Make sure you click directly on the component (not wires)
- Hold mouse button down while moving
- Ghost element should appear

**Q: Drop zones not showing**
- They only appear during active drag
- Make sure you're dragging (not just clicking)

**Q: Component jumped to wrong position**
- It snaps to nearest drop zone
- Use Y coordinate to determine which zone
- Try dragging closer to desired zone

**Q: Can I drag into parallel?**
- Not with basic drag (only series reordering)
- Use "Add in Parallel" mode for parallel placement
- Drag only changes series order

**Q: Values didn't recalculate**
- They should automatically
- Check if component actually moved
- Try refreshing if stuck

---

**Interactive circuit building!** Now you can physically rearrange components just like in a real breadboard. 🔌✨


