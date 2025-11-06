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
  const elNewType = document.getElementById("newType");
  const elRemove = document.getElementById("removeSel");

  const elTotalR = document.getElementById("totalR");
  const elTotalI = document.getElementById("totalI");
  const elTotalP = document.getElementById("totalP");
  const elR1VI = document.getElementById("r1VI");
  const elR1P = document.getElementById("r1P");
  const elR2VI = document.getElementById("r2VI");
  const elR2P = document.getElementById("r2P");

  // Geometry
  const W = 900, H = 460;
  const margin = 110; // more white space around the circuit
  const leftX = margin, rightX = W - margin;
  const topY = margin, bottomY = H - margin;
  const centerX = (leftX + rightX) / 2;
  const centerY = (topY + bottomY) / 2;

  // Selection state (multi-select)
  const selectedIds = new Set(); // values: 'r1', 'r2'

  // Dynamic resistor list
  const resistors = [];
  let nextId = 1;
  // Simple HTML context menu overlay
  let ctxMenu = null;
  function ensureContextMenu() {
    if (ctxMenu) return ctxMenu;
    ctxMenu = document.createElement("div");
    ctxMenu.id = "ctxMenu";
    Object.assign(ctxMenu.style, {
      position: "absolute",
      display: "none",
      background: "#fff",
      border: "1px solid #c9d2e3",
      borderRadius: "8px",
      boxShadow: "0 6px 18px rgba(16,24,40,0.18)",
      padding: "6px",
      zIndex: "9999",
      fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      fontSize: "14px",
      color: "#111",
      minWidth: "160px"
    });
    const btn = (text) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = text;
      Object.assign(b.style, {
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "0",
        padding: "8px 10px",
        cursor: "pointer",
        borderRadius: "6px"
      });
      b.onmouseenter = () => b.style.background = "#f2f4f7";
      b.onmouseleave = () => b.style.background = "transparent";
      return b;
    };
    const bAdjust = btn("Adjust ohmage");
    const bRemove = btn("Remove");
    ctxMenu.appendChild(bAdjust);
    ctxMenu.appendChild(bRemove);
    document.body.appendChild(ctxMenu);
    // handlers set at show-time
    return ctxMenu;
  }
  function showContextMenu(clientX, clientY, resistorId) {
    const m = ensureContextMenu();
    m.dataset.resistorId = resistorId;
    m.style.left = `${clientX + window.scrollX + 6}px`;
    m.style.top = `${clientY + window.scrollY + 6}px`;
    m.style.display = "block";
    // wire buttons
    const [bAdjust, bRemove] = m.querySelectorAll("button");
    bAdjust.onclick = (e) => {
      e.stopPropagation();
      const comp = resistors.find(r => r.id === resistorId);
      if (!comp) { hideContextMenu(); return; }
      const val = prompt("Set resistance (ohms):", String(comp.R));
      if (val != null) {
        const R = Math.max(0.01, parseFloat(val));
        if (isFinite(R)) {
          comp.R = R;
          if (resistors[0]?.id === comp.id) elR1.value = String(R);
          if (resistors[1]?.id === comp.id) elR2.value = String(R);
          update();
        }
      }
      hideContextMenu();
    };
    bRemove.onclick = (e) => {
      e.stopPropagation();
      removeById(resistorId);
      hideContextMenu();
      update();
    };
  }
  function hideContextMenu() {
    if (ctxMenu) ctxMenu.style.display = "none";
  }
  document.addEventListener("click", () => hideContextMenu());
  window.addEventListener("resize", () => hideContextMenu());

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
    if (list.length === 0) {
      return { Rtot: Infinity, Itot: 0, Ptot: 0, per: {} };
    }
    const Rtot = list.reduce((s, r) => s + r.R, 0);
    const Itot = Rtot > 0 ? V / Rtot : 0;
    const per = {};
    for (const r of list) {
      const Vr = Itot * r.R;
      const Pr = Vr * Itot;
      per[r.id] = { V: Vr, I: Itot, P: Pr };
    }
    return { Rtot, Itot, Ptot: V * Itot, per };
  }

  function computeParallelN(V, list) {
    if (list.length === 0) {
      return { Rtot: Infinity, Itot: 0, Ptot: 0, per: {} };
    }
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
    // Dots disabled for cleaner appearance
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    return g;
  }
  const RES_BODY = 60; // constant symbol length for zig-zag body
  const RES_AMP = 8;
  const RES_SEGS = 6;
  const BULB_D = 24;
  const RES_LEAD = 12; // desired minimum lead length on each side
  const RES_RENDER_LEN = RES_BODY + 2 * RES_LEAD; // standard total symbol span

  function drawZigZagHorizontal(cx, cy, length, selected = false) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const left = cx - length / 2, right = cx + length / 2;
    const bodyLen = Math.min(RES_BODY, Math.max(16, length - 16));
    const lead = (length - bodyLen) / 2;
    const x1 = left + lead, x2 = right - lead;

    const lead1 = line(left, cy, x1, cy);
    const lead2 = line(x2, cy, right, cy);
    // leads keep default style; only body highlights
    g.appendChild(lead1); g.appendChild(lead2);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    const step = bodyLen / RES_SEGS;
    const points = [];
    for (let i = 0; i <= RES_SEGS; i++) {
      const x = x1 + i * step;
      const y = cy + (i % 2 === 0 ? -RES_AMP : RES_AMP);
      points.push(`${x},${y}`);
    }
    path.setAttribute("points", points.join(" "));
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", selected ? "#0d6efd" : "#111");
    path.setAttribute("stroke-width", selected ? "3.5" : "2.5");
    g.appendChild(path);
    // Larger, invisible hit area for easy selection
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    hit.setAttribute("x", left - 6);
    hit.setAttribute("y", cy - 18);
    hit.setAttribute("width", length + 12);
    hit.setAttribute("height", 36);
    hit.setAttribute("fill", "#000");
    hit.setAttribute("opacity", "0");
    hit.setAttribute("pointer-events", "all");
    g.appendChild(hit);
    g.style.cursor = "pointer";
    // Attach dataset for hit forwarding convenience (optional)
    g.dataset.hit = "1";
    return g;
  }

  function drawZigZagVertical(cx, cy, length, selected = false) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const top = cy - length / 2, bottom = cy + length / 2;
    const bodyLen = Math.min(RES_BODY, Math.max(16, length - 16));
    const lead = (length - bodyLen) / 2;
    const y1 = top + lead, y2 = bottom - lead;

    const lead1 = line(cx, top, cx, y1);
    const lead2 = line(cx, y2, cx, bottom);
    // leads keep default style; only body highlights
    g.appendChild(lead1); g.appendChild(lead2);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    const step = bodyLen / RES_SEGS;
    const points = [];
    for (let i = 0; i <= RES_SEGS; i++) {
      const y = y1 + i * step;
      const x = cx + (i % 2 === 0 ? -RES_AMP : RES_AMP);
      points.push(`${x},${y}`);
    }
    path.setAttribute("points", points.join(" "));
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", selected ? "#0d6efd" : "#111");
    path.setAttribute("stroke-width", selected ? "3.5" : "2.5");
    g.appendChild(path);
    // Larger, invisible hit area for easy selection
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    hit.setAttribute("x", cx - 18);
    hit.setAttribute("y", top - 6);
    hit.setAttribute("width", 36);
    hit.setAttribute("height", length + 12);
    hit.setAttribute("fill", "#000");
    hit.setAttribute("opacity", "0");
    hit.setAttribute("pointer-events", "all");
    g.appendChild(hit);
    g.style.cursor = "pointer";
    g.dataset.hit = "1";
    return g;
  }

  function drawBulbHorizontal(cx, cy, length, powerFrac, selected = false) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const left = cx - length / 2, right = cx + length / 2;
    const lead = Math.max(8, (length - BULB_D) / 2);
    const x1 = left + lead, x2 = right - lead;
    const lead1 = line(left, cy, x1, cy);
    const lead2 = line(x2, cy, right, cy);
    // leads keep default style; only body highlights
    g.appendChild(lead1); g.appendChild(lead2);
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", BULB_D / 2);
    const intensity = clampPos(Math.pow(powerFrac, 0.5), 0, 1);
    c.setAttribute("fill", `rgba(255, 200, 0, ${0.2 + 0.6 * intensity})`);
    c.setAttribute("stroke", selected ? "#0d6efd" : "#111");
    c.setAttribute("stroke-width", selected ? "3" : "2");
    g.appendChild(c);
    // Larger, invisible hit area for easy selection
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    hit.setAttribute("x", left - 6);
    hit.setAttribute("y", cy - (BULB_D / 2) - 12);
    hit.setAttribute("width", length + 12);
    hit.setAttribute("height", BULB_D + 24);
    hit.setAttribute("fill", "#000");
    hit.setAttribute("opacity", "0");
    hit.setAttribute("pointer-events", "all");
    g.appendChild(hit);
    g.style.cursor = "pointer";
    g.dataset.hit = "1";
    return g;
  }

  function drawBulbVertical(cx, cy, length, powerFrac, selected = false) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const top = cy - length / 2, bottom = cy + length / 2;
    const lead = Math.max(8, (length - BULB_D) / 2);
    const y1 = top + lead, y2 = bottom - lead;
    const lead1 = line(cx, top, cx, y1);
    const lead2 = line(cx, y2, cx, bottom);
    g.appendChild(lead1); g.appendChild(lead2);
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", BULB_D / 2);
    const intensity = clampPos(Math.pow(powerFrac, 0.5), 0, 1);
    c.setAttribute("fill", `rgba(255, 200, 0, ${0.2 + 0.6 * intensity})`);
    c.setAttribute("stroke", selected ? "#0d6efd" : "#111");
    c.setAttribute("stroke-width", selected ? "3" : "2");
    g.appendChild(c);
    // Larger, invisible hit area for easy selection
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    hit.setAttribute("x", cx - (BULB_D / 2) - 12);
    hit.setAttribute("y", top - 6);
    hit.setAttribute("width", BULB_D + 24);
    hit.setAttribute("height", length + 12);
    hit.setAttribute("fill", "#000");
    hit.setAttribute("opacity", "0");
    hit.setAttribute("pointer-events", "all");
    g.appendChild(hit);
    g.style.cursor = "pointer";
    g.dataset.hit = "1";
    return g;
  }

  function componentHorizontal(kind, cx, cy, length, powerFrac, selected) {
    if (kind === "bulb") return drawBulbHorizontal(cx, cy, length, powerFrac, selected);
    return drawZigZagHorizontal(cx, cy, length, selected);
  }
  function componentVertical(kind, cx, cy, length, powerFrac, selected) {
    if (kind === "bulb") return drawBulbVertical(cx, cy, length, powerFrac, selected);
    return drawZigZagVertical(cx, cy, length, selected);
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
  function popupBox(x, y, lines, position = "above", onToggle = null) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    // Allow clicks on popup to toggle selection off
    g.style.cursor = onToggle ? "pointer" : "default";
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
    if (onToggle) {
      g.addEventListener("click", (e) => {
        e.stopPropagation();
        onToggle();
      });
    }
    return g;
  }

  function drawRectangleLoop(opts = {}) {
    const topGap = opts.topGap || null; // [x1, x2] to skip drawing top segment
    // Top
    if (topGap && Array.isArray(topGap) && topGap.length === 2) {
      const [gx1, gx2] = topGap;
      if (gx1 > leftX) svg.appendChild(line(leftX, topY, gx1, topY));
      if (gx2 < rightX) svg.appendChild(line(gx2, topY, rightX, topY));
    } else {
      svg.appendChild(line(leftX, topY, rightX, topY)); // full top
    }
    // Right, Bottom
    svg.appendChild(line(rightX, topY, rightX, bottomY));
    svg.appendChild(line(rightX, bottomY, leftX, bottomY));
    // Battery symbol centered on left wire: two perpendicular lines centered on the rail,
    // and the left rail has a small gap between the two terminals.
    const plateLong = 46;
    const plateShort = 26;
    const plateGap = 26; // vertical distance between plates
    const yPlus = centerY - plateGap / 2;
    const yMinus = centerY + plateGap / 2;
    // Left rail segments with gap between terminals
    svg.appendChild(line(leftX, topY, leftX, yPlus));
    svg.appendChild(line(leftX, yMinus, leftX, bottomY));
    // Plates (centered on the wire)
    const plateP = line(leftX - plateLong / 2, yPlus, leftX + plateLong / 2, yPlus);
    const plateN = line(leftX - plateShort / 2, yMinus, leftX + plateShort / 2, yMinus);
    svg.appendChild(plateP);
    svg.appendChild(plateN);
    // Labels near the right ends of plates
    const tPlus = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tPlus.setAttribute("x", leftX + plateLong / 2 + 8); tPlus.setAttribute("y", yPlus + 5);
    tPlus.setAttribute("text-anchor", "start");
    tPlus.setAttribute("font-size", "18");
    tPlus.setAttribute("font-family", "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif");
    tPlus.setAttribute("fill", "#d00");
    tPlus.textContent = "+";
    svg.appendChild(tPlus);
    const tMinus = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tMinus.setAttribute("x", leftX + plateShort / 2 + 8); tMinus.setAttribute("y", yMinus + 5);
    tMinus.setAttribute("text-anchor", "start");
    tMinus.setAttribute("font-size", "18");
    tMinus.setAttribute("font-family", "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif");
    tMinus.setAttribute("fill", "#111");
    tMinus.textContent = "-";
    svg.appendChild(tMinus);
  }

  function render(mode, V, list, res) {
    clear(svg);

    // Normalize power for brightness
    let pMax = 1e-9;
    for (const r of list) pMax = Math.max(pMax, Math.max(0, res.per[r.id].P));

    if (mode === "series") {
      drawRectangleLoop();
      // Series: distribute evenly around all four edges, colinear with the local edge
      const n = list.length;
      const width = rightX - leftX;
      const height = bottomY - topY;
      const perimeter = 2 * (width + height);
      const arcGap = perimeter / (n + 1);
      const cornerPad = 18; // keep clear of corners so wires stay visually connected

      function positionAlongPerimeter(s) {
        // s: distance from left-top corner along top→right→bottom→left
        let d = s % perimeter;
        if (d < width) {
          // top edge (left→right)
          return { x: leftX + d, y: topY, edge: "top" };
        }
        d -= width;
        if (d < height) {
          // right edge (top→bottom)
          return { x: rightX, y: topY + d, edge: "right" };
        }
        d -= height;
        if (d < width) {
          // bottom edge (right→left)
          return { x: rightX - d, y: bottomY, edge: "bottom" };
        }
        d -= width;
        // left edge (bottom→top)
        return { x: leftX, y: bottomY - d, edge: "left" };
      }

      list.forEach((r, i) => {
        const s = arcGap * (i + 1);
        const pos = positionAlongPerimeter(s);
        // Nudge away from corners to avoid too-short bodies
        let px = pos.x, py = pos.y;
        const guard = 28;
        if (pos.edge === "top" || pos.edge === "bottom") {
          if (px - leftX < guard) px = leftX + guard;
          else if (rightX - px < guard) px = rightX - guard;
        } else {
          if (py - topY < guard) py = topY + guard;
          else if (bottomY - py < guard) py = bottomY - guard;
        }

        // Use a standard symbol span everywhere
        const rLen = RES_RENDER_LEN;
        const sel = selectedIds.has(r.id);
        const f = Math.max(0, res.per[r.id].P) / pMax;

        if (pos.edge === "top" || pos.edge === "bottom") {
          const y = py;
          // Keep away from corners: clamp center so the full symbol fits with margin
          const half = rLen / 2;
          px = clampPos(px, leftX + cornerPad + half, rightX - cornerPad - half);
          const x1 = px - half;
          const x2 = px + half;
          svg.appendChild(dot(x1, y));
          svg.appendChild(dot(x2, y));
          const g = componentHorizontal(r.type || "resistor", px, y, rLen, f, sel);
          g.dataset.resistorId = r.id;
          g.addEventListener("click", (e) => {
            e.stopPropagation();
            if (selectedIds.has(r.id)) selectedIds.delete(r.id); else selectedIds.add(r.id);
            update();
          });
        g.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          showContextMenu(e.clientX, e.clientY, r.id);
        });
          svg.appendChild(g);
          if (sel) {
            const popupPos = pos.edge === "top" ? "below" : "above";
            svg.appendChild(popupBox(px, y, [
              `V = ${fmtV(res.per[r.id].V)}`,
              `I = ${fmtI(res.per[r.id].I)}`
            ], popupPos, () => { selectedIds.delete(r.id); update(); }));
          }
        } else {
          const x = px;
          // Keep away from corners: clamp center so the full symbol fits with margin
          let half = rLen / 2;
          py = clampPos(py, topY + cornerPad + half, bottomY - cornerPad - half);
          // Avoid overlapping the left-rail battery: reserve a vertical band
          const plateGap = 26;
          const reserveMargin = 18;
          const clearTop = centerY - plateGap / 2 - reserveMargin;
          const clearBottom = centerY + plateGap / 2 + reserveMargin;
          if (x === leftX) {
            let y1 = py - half;
            let y2 = py + half;
            if (!(y2 < clearTop || y1 > clearBottom)) {
            // Nudge above or below the reserved band
              if (py <= centerY) py = clearTop - half - 2;
              else py = clearBottom + half + 2;
              // Clamp within bounds after nudge
              py = clampPos(py, topY + cornerPad + half, bottomY - cornerPad - half);
            }
          }
          const y1 = py - half;
          const y2 = py + half;
          svg.appendChild(dot(x, y1));
          svg.appendChild(dot(x, y2));
          const g = componentVertical(r.type || "resistor", x, py, rLen, f, sel);
          g.dataset.resistorId = r.id;
          g.addEventListener("click", (e) => {
            e.stopPropagation();
            if (selectedIds.has(r.id)) selectedIds.delete(r.id); else selectedIds.add(r.id);
            update();
          });
          g.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY, r.id);
          });
          g.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY, r.id);
          });
          svg.appendChild(g);
          if (sel) {
            const popupPos = pos.edge === "right" ? "right" : "left";
            svg.appendChild(popupBox(x, py, [
              `V = ${fmtV(res.per[r.id].V)}`,
              `I = ${fmtI(res.per[r.id].I)}`
            ], popupPos, () => { selectedIds.delete(r.id); update(); }));
          }
        }
      });
    } else {
      // Parallel on top rail with symmetric split: half above, half below, even shorter wires
      const n = list.length;
      if (n === 0) {
        // With no branches, render intact rectangle (no fork gap)
        drawRectangleLoop();
        return;
      }
      const busInset = Math.min(320, (rightX - leftX) * 0.42); // bring buses further inward to shorten branches
      const xL = leftX + busInset;
      const xR = rightX - busInset;
      const yMain = topY;
      // Break the top wire between fork and rejoin to avoid bypass
      drawRectangleLoop({ topGap: [xL, xR] });

      // Fork/rejoin markers on the main wire
      svg.appendChild(dot(xL, yMain));
      svg.appendChild(dot(xR, yMain));

      // Determine lanes above and below
      const nAbove = Math.floor(n / 2);
      const nBelow = n - nAbove;
      const laneGap = 24; // even shorter vertical runs
      const aboveYs = Array.from({ length: nAbove }, (_, i) => yMain - laneGap * (i + 1));
      const belowYs = Array.from({ length: nBelow }, (_, i) => yMain + laneGap * (i + 1));

      const yTopMost = aboveYs.length ? aboveYs[aboveYs.length - 1] : yMain;
      const yBottomMost = belowYs.length ? belowYs[belowYs.length - 1] : yMain;

      // Draw compact bus bars up and down from the main wire to the extreme lanes
      if (yTopMost !== yMain) {
        svg.appendChild(line(xL, yMain, xL, yTopMost));
        svg.appendChild(line(xR, yMain, xR, yTopMost));
      }
      if (yBottomMost !== yMain) {
        svg.appendChild(line(xL, yMain, xL, yBottomMost));
        svg.appendChild(line(xR, yMain, xR, yBottomMost));
      }

      // Assign resistors to lanes: fill above first, then below
      let idx = 0;
      const lanes = [];
      for (let i = 0; i < nAbove && idx < n; i++, idx++) lanes.push({ id: list[idx].id, y: aboveYs[i], pos: "above" });
      for (let i = 0; i < nBelow && idx < n; i++, idx++) lanes.push({ id: list[idx].id, y: belowYs[i], pos: "below" });

      // Render each branch as a horizontal resistor between bus bars
      const length = xR - xL;
      lanes.forEach(l => {
        const rId = l.id;
        const comp = list.find(x => x.id === rId);
        const sel = selectedIds.has(rId);
        const f = Math.max(0, res.per[rId].P) / pMax;
        const g = componentHorizontal(comp?.type || "resistor", (xL + xR) / 2, l.y, length, f, sel);
        g.dataset.resistorId = rId;
        g.addEventListener("click", (e) => {
          e.stopPropagation();
          if (selectedIds.has(rId)) selectedIds.delete(rId); else selectedIds.add(rId);
          update();
        });
        g.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          showContextMenu(e.clientX, e.clientY, rId);
        });
        svg.appendChild(g);

        if (sel) {
          svg.appendChild(popupBox((xL + xR) / 2, l.y, [
            `V = ${fmtV(res.per[rId].V)}`,
            `I = ${fmtI(res.per[rId].I)}`
          ], l.pos === "above" ? "above" : "below", () => { selectedIds.delete(rId); update(); }));
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
    // Toggle remove button availability
    if (elRemove) {
      elRemove.disabled = selectedIds.size === 0;
    }
  }

  [elV, elR1, elR2, ...elMode].forEach(input => {
    input.addEventListener("input", update);
    input.addEventListener("change", update);
  });

  if (elAdd) {
    elAdd.addEventListener("click", () => {
      const R = Math.max(0.01, parseFloat(elNewR.value || "0"));
      const type = (elNewType?.value === "bulb") ? "bulb" : "resistor";
      const id = `r${nextId++}`;
      resistors.push({ id, R, type });
      update();
    });
  }
  if (elRemove) {
    elRemove.addEventListener("click", () => {
      if (selectedIds.size === 0) return;
      const ids = Array.from(selectedIds);
      ids.forEach(removeById);
      selectedIds.clear();
      update();
    });
  }

  function removeById(id) {
    const idx = resistors.findIndex(r => r.id === id);
    if (idx >= 0) {
      resistors.splice(idx, 1);
      selectedIds.delete(id);
    }
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

