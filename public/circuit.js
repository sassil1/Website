(function () {
  "use strict";

  // DOM
  const elV = document.getElementById("voltage");
  const elVVal = document.getElementById("voltageVal");
  const elR1 = document.getElementById("r1");
  const elR2 = document.getElementById("r2");
  const elMode = Array.from(document.querySelectorAll('input[name="mode"]'));
  const svg = document.getElementById("circuit");
  const elNewR = document.getElementById("newR");
  const elAdd = document.getElementById("addRes");

  const elTotalR = document.getElementById("totalR");
  const elTotalI = document.getElementById("totalI");
  const elTotalP = document.getElementById("totalP");
  const elR1VI = document.getElementById("r1VI");
  const elR1P = document.getElementById("r1P");
  const elR2VI = document.getElementById("r2VI");
  const elR2P = document.getElementById("r2P");

  // Geometry
  const W = 900, H = 460;
  const margin = 60;
  const leftX = margin, rightX = W - margin;
  const topY = margin, bottomY = H - margin;
  const centerX = (leftX + rightX) / 2;
  const centerY = (topY + bottomY) / 2;

  // Selection state (multi-select)
  const selectedIds = new Set(); // values: 'r1', 'r2'

  // Dynamic resistor list
  const resistors = [
    { id: "r1", R: 10 },
    { id: "r2", R: 20 },
  ];
  let nextId = 3;

  // Helpers
  function clampPos(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function fmt(n, digits = 3) {
    if (!isFinite(n)) return "—";
    const v = Math.abs(n) < 1e-6 ? 0 : n;
    return Number(v.toFixed(digits)).toString();
  }
  function fmtR(r) { return `${fmt(r, 3)} Ω`; }
  function fmtI(i) { return `${fmt(i, 3)} A`; }
  function fmtV(v) { return `${fmt(v, 3)} V`; }
  function fmtP(p) { return `${fmt(p, 3)} W`; }

  // Physics for N resistors
  function computeSeriesN(V, list) {
    const Rtot = list.reduce((s, r) => s + r.R, 0);
    const Itot = Rtot > 0 ? V / Rtot : Infinity;
    const per = {};
    for (const r of list) {
      const Vr = Itot * r.R;
      const Pr = Vr * Itot;
      per[r.id] = { V: Vr, I: Itot, P: Pr };
    }
    return { Rtot, Itot, Ptot: V * Itot, per };
  }

  function computeParallelN(V, list) {
    const G = list.reduce((s, r) => s + 1 / r.R, 0);
    const Rtot = 1 / G;
    const per = {};
    let Itot = 0;
    for (const r of list) {
      const Ir = V / r.R;
      const Pr = V * Ir;
      per[r.id] = { V, I: Ir, P: Pr };
      Itot += Ir;
    }
    return { Rtot, Itot, Ptot: V * Itot, per };
  }

  // SVG helpers
  function clear(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }
  function line(x1, y1, x2, y2, cls = "wire") {
    const e = document.createElementNS("http://www.w3.org/2000/svg", "line");
    e.setAttribute("x1", x1); e.setAttribute("y1", y1);
    e.setAttribute("x2", x2); e.setAttribute("y2", y2);
    e.setAttribute("stroke", "#333"); e.setAttribute("stroke-width", "4");
    e.setAttribute("stroke-linecap", "round");
    if (cls) e.setAttribute("class", cls);
    return e;
  }
  function dot(x, y) {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", x); c.setAttribute("cy", y);
    c.setAttribute("r", "5"); c.setAttribute("fill", "#333");
    return c;
  }
  function resistorHorizontal(cx, cy, length, powerFrac, selected = false) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const lead = Math.max(16, (length - 60) / 2);
    const left = cx - length / 2, right = cx + length / 2;

    const lead1 = line(left, cy, left + lead, cy);
    const lead2 = line(right - lead, cy, right, cy);
    if (selected) {
      lead1.setAttribute("stroke-width", "6");
      lead2.setAttribute("stroke-width", "6");
      lead1.setAttribute("stroke", "#0d6efd");
      lead2.setAttribute("stroke", "#0d6efd");
    }
    group.appendChild(lead1);
    group.appendChild(lead2);

    const body = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const bodyX = left + lead, bodyY = cy - 12, bodyW = length - 2 * lead, bodyH = 24;
    body.setAttribute("x", bodyX); body.setAttribute("y", bodyY);
    body.setAttribute("width", bodyW); body.setAttribute("height", bodyH);
    body.setAttribute("rx", "4"); body.setAttribute("ry", "4");
    const intensity = clampPos(Math.pow(powerFrac, 0.5), 0, 1);
    body.setAttribute("fill", `rgba(255, 200, 0, ${0.15 + 0.55 * intensity})`);
    body.setAttribute("stroke", selected ? "#0d6efd" : "#111");
    body.setAttribute("stroke-width", selected ? "3.5" : "2.5");
    group.appendChild(body);
    group.style.cursor = "pointer";
    return group;
  }
  function resistorVertical(cx, cy, length, powerFrac, selected = false) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const lead = Math.max(16, (length - 60) / 2);
    const top = cy - length / 2, bottom = cy + length / 2;

    const lead1 = line(cx, top, cx, top + lead);
    const lead2 = line(cx, bottom - lead, cx, bottom);
    if (selected) {
      lead1.setAttribute("stroke-width", "6");
      lead2.setAttribute("stroke-width", "6");
      lead1.setAttribute("stroke", "#0d6efd");
      lead2.setAttribute("stroke", "#0d6efd");
    }
    group.appendChild(lead1);
    group.appendChild(lead2);

    const body = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const bodyX = cx - 12, bodyY = top + lead, bodyW = 24, bodyH = length - 2 * lead;
    body.setAttribute("x", bodyX); body.setAttribute("y", bodyY);
    body.setAttribute("width", bodyW); body.setAttribute("height", bodyH);
    body.setAttribute("rx", "4"); body.setAttribute("ry", "4");
    const intensity = clampPos(Math.pow(powerFrac, 0.5), 0, 1);
    body.setAttribute("fill", `rgba(255, 200, 0, ${0.15 + 0.55 * intensity})`);
    body.setAttribute("stroke", selected ? "#0d6efd" : "#111");
    body.setAttribute("stroke-width", selected ? "3.5" : "2.5");
    group.appendChild(body);
    group.style.cursor = "pointer";
    return group;
  }
  function label(text, x, y, anchor = "middle") {
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", x); t.setAttribute("y", y);
    t.setAttribute("text-anchor", anchor);
    t.setAttribute("font-size", "14");
    t.setAttribute("font-family", "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif");
    t.setAttribute("fill", "#222");
    t.textContent = text;
    return t;
  }

  // Small SVG popup showing lines of text near a resistor
  function popupBox(x, y, lines, position = "above") {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("pointer-events", "none");
    const maxChars = Math.max(0, ...lines.map(s => s.length));
    const width = Math.max(100, Math.min(220, maxChars * 7 + 16));
    const height = lines.length * 16 + 12;
    let px = x, py = y;
    if (position === "above") { px = x - width / 2; py = y - height - 8; }
    else if (position === "below") { px = x - width / 2; py = y + 8; }
    else if (position === "left") { px = x - width - 8; py = y - height / 2; }
    else if (position === "right") { px = x + 8; py = y - height / 2; }

    // Clamp within SVG viewport
    px = Math.max(8, Math.min(px, W - width - 8));
    py = Math.max(8, Math.min(py, H - height - 8));

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", px); rect.setAttribute("y", py);
    rect.setAttribute("width", width); rect.setAttribute("height", height);
    rect.setAttribute("rx", "6"); rect.setAttribute("ry", "6");
    rect.setAttribute("fill", "#ffffff");
    rect.setAttribute("stroke", "#0d6efd");
    rect.setAttribute("stroke-width", "1.5");
    g.appendChild(rect);

    lines.forEach((text, i) => {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", px + 8); t.setAttribute("y", py + 18 + i * 16);
      t.setAttribute("text-anchor", "start");
      t.setAttribute("font-size", "14");
      t.setAttribute("font-family", "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif");
      t.setAttribute("fill", "#111");
      t.textContent = text;
      g.appendChild(t);
    });
    return g;
  }

  function drawRectangleLoop() {
    // Outer rectangle wires
    svg.appendChild(line(leftX, topY, rightX, topY));     // top
    svg.appendChild(line(rightX, topY, rightX, bottomY)); // right
    svg.appendChild(line(rightX, bottomY, leftX, bottomY)); // bottom
    svg.appendChild(line(leftX, bottomY, leftX, topY));   // left

    // Battery marker on left side (simple + / -)
    svg.appendChild(label("+", leftX - 20, topY + 10, "end"));
    svg.appendChild(label("-", leftX - 20, bottomY - 6, "end"));
  }

  function render(mode, V, list, res) {
    clear(svg);
    drawRectangleLoop();

    // Normalize power for brightness
    let pMax = 1e-9;
    for (const r of list) pMax = Math.max(pMax, Math.max(0, res.per[r.id].P));

    if (mode === "series") {
      // Series: N resistors inline on the top edge
      const y = topY;
      const n = list.length;
      const gap = (rightX - leftX) / (n + 1);
      list.forEach((r, i) => {
        const cx = leftX + gap * (i + 1);
        const rLen = Math.max(90, Math.min(220, gap * 0.7));
        svg.appendChild(dot(cx - rLen / 2, y));
        svg.appendChild(dot(cx + rLen / 2, y));
        const f = Math.max(0, res.per[r.id].P) / pMax;
        const sel = selectedIds.has(r.id);
        const g = resistorHorizontal(cx, y, rLen, f, sel);
        g.dataset.resistorId = r.id;
        g.addEventListener("click", (e) => {
          e.stopPropagation();
          if (selectedIds.has(r.id)) selectedIds.delete(r.id); else selectedIds.add(r.id);
          update();
        });
        svg.appendChild(g);
        if (sel) {
          svg.appendChild(popupBox(cx, y, [
            `V = ${fmtV(res.per[r.id].V)}`,
            `I = ${fmtI(res.per[r.id].I)}`
          ], "below"));
        }
      });
    } else {
      // Parallel: N vertical branches between top and bottom rails
      const n = list.length;
      const gap = (rightX - leftX) / (n + 1);
      const branchLen = (bottomY - topY) - 24;
      list.forEach((r, i) => {
        const x = leftX + gap * (i + 1);
        svg.appendChild(dot(x, topY));
        svg.appendChild(dot(x, bottomY));
        const f = Math.max(0, res.per[r.id].P) / pMax;
        const sel = selectedIds.has(r.id);
        const g = resistorVertical(x, centerY, branchLen, f, sel);
        g.dataset.resistorId = r.id;
        g.addEventListener("click", (e) => {
          e.stopPropagation();
          if (selectedIds.has(r.id)) selectedIds.delete(r.id); else selectedIds.add(r.id);
          update();
        });
        svg.appendChild(g);
        if (sel) {
          const pos = x < centerX ? "left" : "right";
          svg.appendChild(popupBox(x, centerY, [
            `V = ${fmtV(res.per[r.id].V)}`,
            `I = ${fmtI(res.per[r.id].I)}`
          ], pos));
        }
      });
    }
  }

  function update() {
    const V = parseFloat(elV.value);
    // keep first two bound to inputs
    if (resistors.length >= 1) resistors[0].R = Math.max(0.01, parseFloat(elR1.value || "0"));
    if (resistors.length >= 2) resistors[1].R = Math.max(0.01, parseFloat(elR2.value || "0"));
    const mode = elMode.find(r => r.checked)?.value || "series";

    elVVal.textContent = fmt(V, 1);

    let res;
    if (mode === "series") res = computeSeriesN(V, resistors);
    else res = computeParallelN(V, resistors);

    elTotalR.textContent = fmtR(res.Rtot);
    elTotalI.textContent = fmtI(res.Itot);
    elTotalP.textContent = fmtP(res.Ptot);

    // Omit V/I in side cards; show only in popups
    elR1VI.textContent = "";
    elR2VI.textContent = "";
    // show P for first two if present
    const first = resistors[0];
    const second = resistors[1];
    elR1P.textContent = first ? `P=${fmtP(res.per[first.id].P)}` : "";
    elR2P.textContent = second ? `P=${fmtP(res.per[second.id].P)}` : "";

    render(mode, V, resistors, res);
  }

  [elV, elR1, elR2, ...elMode].forEach(input => {
    input.addEventListener("input", update);
    input.addEventListener("change", update);
  });

  if (elAdd) {
    elAdd.addEventListener("click", () => {
      const R = Math.max(0.01, parseFloat(elNewR.value || "0"));
      const id = `r${nextId++}`;
      resistors.push({ id, R });
      update();
    });
  }

  update();
})();

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

