/* ═══════════════════════════════════════════════════════════
   VideoAnálisis v2 - TopLiderCoach
   Inspirado en Nacsport - Funcionalidades profesionales
   ═══════════════════════════════════════════════════════════ */

// ─── 1. CONFIG ───────────────────────────────────────────────

const VA_CATEGORIES = [
  { id: "gol",          label: "Gol",            color: "#16a34a", icon: "⚽", key: "1" },
  { id: "ocasion",      label: "Ocasión",        color: "#ca8a04", icon: "🎯", key: "2" },
  { id: "corner",       label: "Córner",         color: "#2563eb", icon: "🚩", key: "3" },
  { id: "falta",        label: "Falta",          color: "#dc2626", icon: "🟥", key: "4" },
  { id: "tarjeta",      label: "Tarjeta",        color: "#ea580c", icon: "🟨", key: "5" },
  { id: "cambio",       label: "Cambio",         color: "#7c3aed", icon: "🔄", key: "6" },
  { id: "fuera-juego",  label: "Fuera juego",    color: "#0891b2", icon: "🏴", key: "7" },
  { id: "saque",        label: "Saque",          color: "#475569", icon: "👟", key: "8" },
  { id: "recuperacion", label: "Recuperación",   color: "#059669", icon: "💪", key: "9" },
  { id: "perdida",      label: "Pérdida",        color: "#b91c1c", icon: "❌", key: "0" },
  { id: "pase-clave",   label: "Pase clave",     color: "#9333ea", icon: "🎯", key: "Q" },
  { id: "otro",         label: "Otro",           color: "#64748b", icon: "📌", key: "W" },
];

const VA_FIELD_ZONES = [
  { id: "off-izq",  label: "Ofens. Izq" },
  { id: "off-cen",  label: "Ofens. Centro" },
  { id: "off-der",  label: "Ofens. Der" },
  { id: "med-izq",  label: "Medio Izq" },
  { id: "med-cen",  label: "Medio Centro" },
  { id: "med-der",  label: "Medio Der" },
  { id: "def-izq",  label: "Defens. Izq" },
  { id: "def-cen",  label: "Defens. Centro" },
  { id: "def-der",  label: "Defens. Der" },
];

const VA_DRAW_TOOLS = [
  { id: "arrow",       label: "Flecha",        icon: "→",  group: "lines" },
  { id: "curvedArrow", label: "Flecha curva",   icon: "↪",  group: "lines" },
  { id: "line",        label: "Línea",          icon: "╱",  group: "lines" },
  { id: "dashedLine",  label: "Línea disc.",    icon: "┄",  group: "lines" },
  { id: "dashedArrow", label: "Flecha disc.",   icon: "⇢",  group: "lines" },
  { id: "freehand",    label: "Libre",          icon: "〰", group: "lines" },
  { id: "connection",  label: "Conexión",       icon: "⌁",  group: "links" },
  { id: "circle",      label: "Círculo",        icon: "○",  group: "shapes" },
  { id: "rect",        label: "Rectángulo",     icon: "□",  group: "shapes" },
  { id: "area",        label: "Área",           icon: "⬠",  group: "shapes" },
  { id: "spotlight",   label: "Foco",           icon: "△",  group: "marks" },
  { id: "playerCircle",label: "Jugador ○",      icon: "◯",  group: "marks" },
  { id: "playerMark",  label: "Jugador ▽",      icon: "▽",  group: "marks" },
  { id: "cross",       label: "Cruz",           icon: "✕",  group: "marks" },
  { id: "angle",       label: "Ángulo",         icon: "∠",  group: "marks" },
  { id: "text",        label: "Texto",          icon: "T",  group: "text" },
];

const VA_COLORS = ["#ef4444","#22c55e","#3b82f6","#eab308","#ffffff","#f97316","#a855f7","#06b6d4"];
const VA_LINE_WIDTHS = [2, 3, 5, 8];
const DRAW_DISPLAY_SECONDS = 5;

// ─── 2. STATE ────────────────────────────────────────────────

const va = {
  videoName: "", isPlaying: false, currentTime: 0, duration: 0, playbackRate: 1,
  events: [], selectedCategory: null, selectedZone: null,
  filterPeriod: "all", filterRange: null,
  drawMode: null, drawColor: "#ef4444", drawLineWidth: 3, drawings: [], undoStack: [], showDrawings: true,
  isDrawing: false, drawStart: null, currentPath: [], textPos: null, areaPoints: null, anglePoints: null,
  clipIn: null, clipOut: null, clips: [],
  activePanel: "events",
};

let vaVideo, vaCanvas, vaCtx;

// ─── 3. INIT ─────────────────────────────────────────────────

function vaInit() {
  vaVideo = document.getElementById("va-video");
  vaCanvas = document.getElementById("va-canvas");
  vaCtx = vaCanvas.getContext("2d");
  vaBuildActionGrid();
  vaBuildFieldZones();
  vaBuildDrawTools();
  vaBuildColorPicker();
  vaBuildLineWidths();
  vaSetupUpload();
  vaSetupVideoEvents();
  vaSetupCanvasEvents();
  vaSetupKeyboard();
}
document.addEventListener("DOMContentLoaded", vaInit);

// ─── 4. UPLOAD ───────────────────────────────────────────────

function vaSetupUpload() {
  const box = document.getElementById("va-upload-box");
  const input = document.getElementById("va-file-input");
  box.addEventListener("click", () => input.click());
  input.addEventListener("change", (e) => vaLoadFile(e.target.files[0]));
  box.addEventListener("dragover", (e) => { e.preventDefault(); box.classList.add("dragover"); });
  box.addEventListener("dragleave", () => box.classList.remove("dragover"));
  box.addEventListener("drop", (e) => {
    e.preventDefault(); box.classList.remove("dragover");
    if (e.dataTransfer.files[0]) vaLoadFile(e.dataTransfer.files[0]);
  });
}

function vaLoadFile(file) {
  if (!file || !file.type.startsWith("video/")) return;
  if (vaVideo.src && vaVideo.src.startsWith("blob:")) URL.revokeObjectURL(vaVideo.src);
  vaVideo.src = URL.createObjectURL(file);
  vaVideo.load();
  va.videoName = file.name;
  document.getElementById("va-video-name").textContent = file.name;
  document.getElementById("va-upload-screen").style.display = "none";
  document.getElementById("va-main").classList.add("active");
  va.events = []; va.drawings = []; va.clips = [];
  va.clipIn = null; va.clipOut = null; va.selectedCategory = null; va.selectedZone = null;
  va.undoStack = []; va.areaPoints = null; va.anglePoints = null;
  vaRenderTable(); vaRenderClips(); vaRenderTimelineMarkers();
  // Sync canvas position after layout settles
  requestAnimationFrame(() => vaSyncCanvasPosition());
}

function vaNewVideo() {
  document.getElementById("va-main").classList.remove("active");
  document.getElementById("va-upload-screen").style.display = "flex";
  vaVideo.src = "";
}

// ─── 5. VIDEO ────────────────────────────────────────────────

function vaSetupVideoEvents() {
  vaVideo.addEventListener("loadedmetadata", () => {
    va.duration = vaVideo.duration;
    document.getElementById("va-total-time").textContent = vaFormatTime(va.duration);
    vaVideo.volume = 0.7;
    vaSyncCanvasPosition();
    console.log("✅ Vídeo cargado:", va.videoName, vaFormatTime(va.duration));
  });
  vaVideo.addEventListener("timeupdate", () => {
    va.currentTime = vaVideo.currentTime;
    vaUpdateTimeDisplay(); vaUpdateTimeline(); vaRenderCanvas();
  });
  vaVideo.addEventListener("ended", () => {
    va.isPlaying = false;
    document.getElementById("va-play-btn").textContent = "▶";
  });
  vaVideo.addEventListener("click", () => { if (!va.drawMode) vaTogglePlay(); });
  vaVideo.addEventListener("error", () => {
    console.error("❌ Error al cargar el vídeo:", vaVideo.error);
    alert("No se puede reproducir este vídeo.\nPrueba a convertirlo a MP4 (H.264).");
  });

  // Sync canvas on resize
  window.addEventListener("resize", () => vaSyncCanvasPosition());
}

// Keep canvas aligned with the actual video rendering area (accounting for object-fit:contain)
function vaSyncCanvasPosition() {
  const videoW = vaVideo.videoWidth;
  const videoH = vaVideo.videoHeight;
  if (!videoW || !videoH) return;

  const container = vaVideo.parentElement.getBoundingClientRect();
  const containerRatio = container.width / container.height;
  const videoRatio = videoW / videoH;

  let renderW, renderH, offsetX, offsetY;
  if (videoRatio > containerRatio) {
    renderW = container.width;
    renderH = container.width / videoRatio;
    offsetX = 0;
    offsetY = (container.height - renderH) / 2;
  } else {
    renderH = container.height;
    renderW = container.height * videoRatio;
    offsetX = (container.width - renderW) / 2;
    offsetY = 0;
  }

  vaCanvas.style.left = offsetX + "px";
  vaCanvas.style.top = offsetY + "px";
  vaCanvas.style.width = renderW + "px";
  vaCanvas.style.height = renderH + "px";
}

function vaTogglePlay() {
  if (va.isPlaying) {
    vaVideo.pause();
    document.getElementById("va-play-btn").textContent = "▶";
    va.isPlaying = false;
  } else {
    vaVideo.play().then(() => {
      document.getElementById("va-play-btn").textContent = "⏸";
      va.isPlaying = true;
    }).catch(err => console.error("❌ No se puede reproducir:", err.message));
  }
}

function vaSeekTo(t) {
  const c = Math.max(0, Math.min(t, va.duration || 0));
  vaVideo.currentTime = c; va.currentTime = c;
  vaUpdateTimeDisplay(); vaUpdateTimeline();
}

function vaStepFrame(d) {
  vaVideo.pause(); va.isPlaying = false;
  document.getElementById("va-play-btn").textContent = "▶";
  vaSeekTo(va.currentTime + d * (1/25));
}

function vaChangeSpeed() {
  const s = [0.25,0.5,0.75,1,1.25,1.5,2];
  va.playbackRate = s[(s.indexOf(va.playbackRate)+1)%s.length];
  vaVideo.playbackRate = va.playbackRate;
  document.getElementById("va-speed-btn").textContent = va.playbackRate + "x";
}

function vaChangeVolume(v) { vaVideo.volume = parseFloat(v); }

function vaFormatTime(s) {
  if (!s || isNaN(s)) return "00:00";
  return String(Math.floor(s/60)).padStart(2,"0") + ":" + String(Math.floor(s%60)).padStart(2,"0");
}

function vaUpdateTimeDisplay() {
  document.getElementById("va-current-time").textContent = vaFormatTime(va.currentTime);
}

// ─── 6. PERIODS ──────────────────────────────────────────────

function vaSetPeriod(period) {
  va.filterPeriod = period;
  va.filterRange = null;
  document.querySelectorAll(".va-period-btn").forEach(el => el.classList.toggle("active", el.dataset.period === period));
  document.querySelectorAll(".va-period-range").forEach(el => el.classList.remove("active"));
  vaRenderTable();
}

function vaSetRange(range) {
  if (va.filterRange === range) { va.filterRange = null; } else { va.filterRange = range; }
  document.querySelectorAll(".va-period-range").forEach(el => el.classList.toggle("active", el.dataset.range === va.filterRange));
  vaRenderTable();
}

function vaGetMinuteFromTime(t) { return Math.floor(t / 60); }

function vaFilteredEvents() {
  let list = va.events;
  // Period filter
  if (va.filterPeriod !== "all") {
    const half = va.duration / 2;
    if (va.filterPeriod === "1") list = list.filter(e => e.time < half);
    else if (va.filterPeriod === "2") list = list.filter(e => e.time >= half);
  }
  // Range filter (minutes)
  if (va.filterRange) {
    const [a, b] = va.filterRange.split("-").map(Number);
    list = list.filter(e => {
      const m = vaGetMinuteFromTime(e.time);
      return m >= a && m < b;
    });
  }
  return list;
}

// ─── 7. TIMELINE ─────────────────────────────────────────────

function vaUpdateTimeline() {
  if (!va.duration) return;
  const p = (va.currentTime / va.duration) * 100;
  document.getElementById("va-tl-progress").style.width = p + "%";
  document.getElementById("va-tl-playhead").style.left = p + "%";
}

function vaTimelineClick(e) {
  const bar = document.getElementById("va-timeline");
  const r = bar.getBoundingClientRect();
  vaSeekTo(((e.clientX - r.left) / r.width) * va.duration);
}

function vaRenderTimelineMarkers() {
  const c = document.getElementById("va-tl-markers");
  if (!va.duration) { c.innerHTML = ""; return; }
  c.innerHTML = va.events.map(ev =>
    '<div class="va-timeline-marker" style="left:' + ((ev.time/va.duration)*100) +
    '%" onclick="event.stopPropagation();vaSeekTo(' + ev.time + ')" title="' +
    vaFormatTime(ev.time) + ' - ' + ev.label + '">' + ev.icon + '</div>'
  ).join("");
}

function vaRenderTimelineClips() {
  const c = document.getElementById("va-tl-clips"); if (!va.duration) { c.innerHTML=""; return; }
  let h = "";
  if (va.clipIn !== null) h += '<div class="va-timeline-clip-mark" style="left:'+((va.clipIn/va.duration)*100)+'%;background:#22c55e"></div>';
  if (va.clipOut !== null) h += '<div class="va-timeline-clip-mark" style="left:'+((va.clipOut/va.duration)*100)+'%;background:#ef4444"></div>';
  if (va.clipIn !== null && va.clipOut !== null) {
    const l = (Math.min(va.clipIn,va.clipOut)/va.duration)*100;
    const w = (Math.abs(va.clipOut-va.clipIn)/va.duration)*100;
    h += '<div class="va-timeline-clip-range" style="left:'+l+'%;width:'+w+'%"></div>';
  }
  c.innerHTML = h;
}

// ─── 8. EVENTS ───────────────────────────────────────────────

function vaBuildActionGrid() {
  document.getElementById("va-action-grid").innerHTML = VA_CATEGORIES.map(cat =>
    '<button class="va-action-btn" data-cat="' + cat.id + '" style="background:' + cat.color +
    '" onclick="vaSelectCategory(\'' + cat.id + '\')">' +
    '<span class="icon">' + cat.icon + '</span>' + cat.label +
    '<span class="key">' + cat.key + '</span></button>'
  ).join("");
}

function vaBuildFieldZones() {
  document.getElementById("va-field-grid").innerHTML = VA_FIELD_ZONES.map(z =>
    '<button class="va-field-zone" data-zone="' + z.id + '" onclick="vaSelectZone(\'' + z.id + '\')">' +
    z.label + '</button>'
  ).join("");
}

function vaSelectCategory(catId) {
  va.selectedCategory = (va.selectedCategory === catId) ? null : catId;
  document.querySelectorAll(".va-action-btn").forEach(el =>
    el.classList.toggle("active", el.dataset.cat === va.selectedCategory)
  );
}

function vaSelectZone(zoneId) {
  va.selectedZone = (va.selectedZone === zoneId) ? null : zoneId;
  document.querySelectorAll(".va-field-zone").forEach(el =>
    el.classList.toggle("active", el.dataset.zone === va.selectedZone)
  );
}

function vaAddEvent() {
  if (!va.selectedCategory) return;
  const cat = VA_CATEGORIES.find(c => c.id === va.selectedCategory);
  const note = document.getElementById("va-event-note").value.trim();
  const zone = va.selectedZone ? VA_FIELD_ZONES.find(z => z.id === va.selectedZone) : null;

  const half = va.duration ? (va.currentTime < va.duration / 2 ? "1" : "2") : "1";

  va.events.push({
    id: Date.now(), time: va.currentTime, category: va.selectedCategory,
    label: cat.label, color: cat.color, icon: cat.icon,
    note: note, zone: zone ? zone.label : "", zoneId: va.selectedZone || "",
    period: half,
  });

  va.events.sort((a, b) => a.time - b.time);
  document.getElementById("va-event-note").value = "";
  vaRenderTable(); vaRenderTimelineMarkers();
  // Badge
  const badge = document.getElementById("va-event-count");
  badge.style.display = "inline"; badge.textContent = va.events.length;
}

function vaDeleteEvent(id) {
  va.events = va.events.filter(e => e.id !== id);
  vaRenderTable(); vaRenderTimelineMarkers();
  const badge = document.getElementById("va-event-count");
  if (va.events.length > 0) { badge.textContent = va.events.length; } else { badge.style.display = "none"; }
}

// ─── 9. PLAY-BY-PLAY TABLE ──────────────────────────────────

function vaRenderTable() {
  const list = vaFilteredEvents();
  const tbody = document.getElementById("va-table-body");

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="va-table-empty">Etiqueta acciones usando los botones del panel derecho →</td></tr>';
    return;
  }

  tbody.innerHTML = list.map((ev, i) =>
    '<tr onclick="vaSeekTo(' + ev.time + ')">' +
    '<td style="color:var(--va-dim);text-align:center">' + (i + 1) + '</td>' +
    '<td><span class="cat-badge" style="background:' + ev.color + '">' + ev.icon + ' ' + ev.label + '</span></td>' +
    '<td class="time-cell">' + vaFormatTime(ev.time) + '</td>' +
    '<td style="text-align:center">' + ev.period + 'T</td>' +
    '<td>' + (ev.zone ? '<span class="zone-badge">' + ev.zone + '</span>' : '-') + '</td>' +
    '<td>' + (ev.note ? '<span class="note-text" title="' + ev.note + '">' + ev.note + '</span>' : '') +
    '<button class="va-btn-icon" onclick="event.stopPropagation();vaDeleteEvent(' + ev.id + ')" style="float:right">🗑️</button></td>' +
    '</tr>'
  ).join("");
}

// ─── 10. DRAWING ─────────────────────────────────────────────

function vaBuildDrawTools() {
  const groups = { lines: "Líneas", links: "Conexiones", shapes: "Formas", marks: "Marcas", text: "Texto" };
  let html = "";
  let currentGroup = "";
  VA_DRAW_TOOLS.forEach(t => {
    if (t.group !== currentGroup) {
      currentGroup = t.group;
      html += '<div class="va-draw-group-label">' + groups[t.group] + '</div>';
    }
    html += '<button class="va-draw-tool" data-tool="' + t.id + '" onclick="vaSetDrawMode(\'' + t.id +
      '\')" title="' + t.label + '"><span class="dt-icon">' + t.icon + '</span>' + t.label + '</button>';
  });
  document.getElementById("va-draw-tools").innerHTML = html;
}

function vaBuildColorPicker() {
  document.getElementById("va-color-picker").innerHTML = VA_COLORS.map((c,i) =>
    '<div class="va-color' + (i===0?' active':'') + '" style="background:' + c +
    '" data-color="' + c + '" onclick="vaSelectDrawColor(\'' + c + '\')"></div>'
  ).join("");
}

function vaBuildLineWidths() {
  document.getElementById("va-line-widths").innerHTML = VA_LINE_WIDTHS.map(w =>
    '<button class="va-lw-btn' + (w === 3 ? ' active' : '') + '" data-width="' + w +
    '" onclick="vaSetLineWidth(' + w + ')" title="' + w + 'px">' +
    '<span style="display:block;width:' + (w * 3 + 6) + 'px;height:' + w +
    'px;background:currentColor;border-radius:' + w + 'px"></span></button>'
  ).join("");
}

function vaSetDrawMode(mode) {
  if (va.drawMode === mode) mode = null;
  va.drawMode = mode;
  va.areaPoints = null; // reset area polygon
  va.anglePoints = null;
  vaCanvas.classList.toggle("active", !!mode);
  document.getElementById("va-draw-badge").classList.toggle("active", !!mode);
  document.getElementById("va-draw-mode-label").textContent =
    mode ? VA_DRAW_TOOLS.find(t => t.id === mode).label : "-";
  document.querySelectorAll(".va-draw-tool").forEach(el => el.classList.toggle("active", el.dataset.tool === mode));
  if (!mode) vaCancelText();
  vaRenderCanvas();
}

function vaSelectDrawColor(c) {
  va.drawColor = c;
  document.querySelectorAll(".va-color").forEach(el => el.classList.toggle("active", el.dataset.color === c));
}

function vaSetLineWidth(w) {
  va.drawLineWidth = w;
  document.querySelectorAll(".va-lw-btn").forEach(el => el.classList.toggle("active", parseInt(el.dataset.width) === w));
}

function vaSetupCanvasEvents() {
  vaCanvas.addEventListener("mousedown", (e) => {
    if (!va.drawMode) return; e.preventDefault();
    const pos = vaGetCanvasPos(e);

    // TEXT: single click placement
    if (va.drawMode === "text") {
      va.textPos = pos;
      document.getElementById("va-text-overlay").classList.add("active");
      document.getElementById("va-text-input").focus();
      return;
    }

    // AREA (polygon): multi-click. Double-click to close.
    if (va.drawMode === "area") {
      if (!va.areaPoints) va.areaPoints = [];
      va.areaPoints.push(pos);
      vaRenderCanvas(pos);
      return;
    }

    // ANGLE: needs 3 points (2 clicks)
    if (va.drawMode === "angle" && va.anglePoints && va.anglePoints.length === 1) {
      // Second click - treat as second segment start already set
    }

    va.isDrawing = true; va.drawStart = pos;
    if (va.drawMode === "freehand") va.currentPath = [pos];
    if (va.drawMode === "angle") va.anglePoints = [pos];
  });

  vaCanvas.addEventListener("mousemove", (e) => {
    if (!va.drawMode) return;
    const pos = vaGetCanvasPos(e);

    // Area preview with hover
    if (va.drawMode === "area" && va.areaPoints && va.areaPoints.length > 0) {
      vaRenderCanvas(pos);
      return;
    }

    if (!va.isDrawing) return;
    if (va.drawMode === "freehand") va.currentPath.push(pos);
    vaRenderCanvas(pos);
  });

  vaCanvas.addEventListener("mouseup", (e) => {
    if (va.drawMode === "area") return; // area uses clicks, not drag
    if (!va.isDrawing || !va.drawMode) return;
    const pos = vaGetCanvasPos(e);

    // Angle needs 2 clicks (3 points)
    if (va.drawMode === "angle" && va.anglePoints && va.anglePoints.length === 1) {
      va.anglePoints.push(pos);
      va.drawStart = pos;
      vaRenderCanvas(pos);
      return;
    }

    // SINGLE-CLICK tools (playerCircle, playerMark, cross, spotlight): use end position
    const drawing = {
      id: Date.now(), type: va.drawMode, color: va.drawColor,
      lineWidth: va.drawLineWidth, time: va.currentTime,
      start: va.drawStart, end: pos,
      path: va.drawMode === "freehand" ? [...va.currentPath, pos] : null,
    };

    if (va.drawMode === "angle" && va.anglePoints) {
      drawing.points = [...va.anglePoints, pos];
    }
    if (va.drawMode === "curvedArrow") {
      const mx = (va.drawStart.x + pos.x) / 2, my = (va.drawStart.y + pos.y) / 2;
      const dx = pos.x - va.drawStart.x, dy = pos.y - va.drawStart.y;
      drawing.cp = { x: mx - dy * 0.3, y: my + dx * 0.3 };
    }

    va.undoStack = [];
    va.drawings.push(drawing);
    va.isDrawing = false; va.drawStart = null; va.currentPath = []; va.anglePoints = null;
    vaRenderCanvas();
    vaUpdateUndoButtons();
  });

  // AREA: double-click to close polygon
  vaCanvas.addEventListener("dblclick", (e) => {
    if (va.drawMode === "area" && va.areaPoints && va.areaPoints.length >= 3) {
      va.drawings.push({
        id: Date.now(), type: "area", color: va.drawColor,
        lineWidth: va.drawLineWidth, time: va.currentTime,
        areaPoints: [...va.areaPoints],
        start: va.areaPoints[0], end: va.areaPoints[va.areaPoints.length - 1],
      });
      va.areaPoints = null;
      va.undoStack = [];
      vaRenderCanvas();
      vaUpdateUndoButtons();
    }
  });
}

function vaGetCanvasPos(e) {
  const r = vaCanvas.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * vaCanvas.width;
  const y = ((e.clientY - r.top) / r.height) * vaCanvas.height;
  return { x, y };
}

function vaAddTextDrawing() {
  const input = document.getElementById("va-text-input");
  const text = input.value.trim(); if (!text || !va.textPos) return;
  va.drawings.push({ id: Date.now(), type: "text", color: va.drawColor, lineWidth: va.drawLineWidth,
    time: va.currentTime, start: va.textPos, text });
  va.undoStack = [];
  input.value = ""; vaCancelText(); vaRenderCanvas(); vaUpdateUndoButtons();
}

function vaCancelText() { va.textPos = null; document.getElementById("va-text-overlay").classList.remove("active"); }

function vaUndo() {
  if (!va.drawings.length) return;
  va.undoStack.push(va.drawings.pop());
  vaRenderCanvas(); vaUpdateUndoButtons();
}

function vaRedo() {
  if (!va.undoStack.length) return;
  va.drawings.push(va.undoStack.pop());
  vaRenderCanvas(); vaUpdateUndoButtons();
}

function vaClearDrawings() {
  if (!va.drawings.length) return;
  va.undoStack = [...va.drawings.reverse()]; // push all to undo
  va.drawings = [];
  vaRenderCanvas(); vaUpdateUndoButtons();
}

function vaUpdateUndoButtons() {
  const undo = document.getElementById("va-undo-btn");
  const redo = document.getElementById("va-redo-btn");
  if (undo) { undo.disabled = !va.drawings.length; undo.style.opacity = va.drawings.length ? "1" : "0.4"; }
  if (redo) { redo.disabled = !va.undoStack.length; redo.style.opacity = va.undoStack.length ? "1" : "0.4"; }
}

function vaToggleDrawVisibility() {
  va.showDrawings = !va.showDrawings;
  document.getElementById("va-toggle-draw").textContent = va.showDrawings ? "👁️ Ocultar" : "🙈 Mostrar";
  vaRenderCanvas();
}

// ─── Canvas rendering ────────────────────────────────────────

function vaRenderCanvas(pos) {
  if (!vaVideo.videoWidth) return;
  vaCanvas.width = vaVideo.videoWidth; vaCanvas.height = vaVideo.videoHeight;
  vaCtx.clearRect(0, 0, vaCanvas.width, vaCanvas.height);
  if (!va.showDrawings) return;

  // Saved drawings
  va.drawings.forEach(d => { if (Math.abs(d.time - va.currentTime) < DRAW_DISPLAY_SECONDS) vaDrawShape(d); });

  // Preview: dragging
  if (va.isDrawing && va.drawStart && pos) {
    const preview = { type: va.drawMode, color: va.drawColor, lineWidth: va.drawLineWidth,
      start: va.drawStart, end: pos, path: va.drawMode === "freehand" ? va.currentPath : null };
    if (va.drawMode === "curvedArrow") {
      const mx = (va.drawStart.x+pos.x)/2, my = (va.drawStart.y+pos.y)/2;
      const dx = pos.x-va.drawStart.x, dy = pos.y-va.drawStart.y;
      preview.cp = { x: mx - dy*0.3, y: my + dx*0.3 };
    }
    if (va.drawMode === "angle" && va.anglePoints) {
      preview.points = [...va.anglePoints, pos];
    }
    vaDrawShape(preview);
  }

  // Preview: area polygon in progress
  if (va.drawMode === "area" && va.areaPoints && va.areaPoints.length > 0 && pos) {
    vaDrawAreaPreview(va.areaPoints, pos, va.drawColor, va.drawLineWidth);
  }
}

function vaDrawShape(d) {
  const lw = d.lineWidth || 3;
  vaCtx.strokeStyle = d.color; vaCtx.fillStyle = d.color;
  vaCtx.lineWidth = lw; vaCtx.lineCap = "round"; vaCtx.lineJoin = "round";
  vaCtx.setLineDash([]);

  switch (d.type) {

    case "line": {
      vaCtx.beginPath(); vaCtx.moveTo(d.start.x, d.start.y);
      vaCtx.lineTo(d.end.x, d.end.y); vaCtx.stroke(); break;
    }

    case "dashedLine": {
      vaCtx.setLineDash([12, 6]);
      vaCtx.beginPath(); vaCtx.moveTo(d.start.x, d.start.y);
      vaCtx.lineTo(d.end.x, d.end.y); vaCtx.stroke();
      vaCtx.setLineDash([]); break;
    }

    case "arrow": {
      vaCtx.beginPath(); vaCtx.moveTo(d.start.x, d.start.y);
      vaCtx.lineTo(d.end.x, d.end.y); vaCtx.stroke();
      vaDrawArrowHead(d.start, d.end, lw); break;
    }

    case "dashedArrow": {
      vaCtx.setLineDash([12, 6]);
      vaCtx.beginPath(); vaCtx.moveTo(d.start.x, d.start.y);
      vaCtx.lineTo(d.end.x, d.end.y); vaCtx.stroke();
      vaCtx.setLineDash([]);
      vaDrawArrowHead(d.start, d.end, lw); break;
    }

    case "curvedArrow": {
      const cp = d.cp || { x: (d.start.x+d.end.x)/2, y: (d.start.y+d.end.y)/2 - 50 };
      vaCtx.beginPath(); vaCtx.moveTo(d.start.x, d.start.y);
      vaCtx.quadraticCurveTo(cp.x, cp.y, d.end.x, d.end.y); vaCtx.stroke();
      // Arrow head tangent at end
      const t = 0.95;
      const tx = 2*(1-t)*(cp.x-d.start.x) + 2*t*(d.end.x-cp.x);
      const ty = 2*(1-t)*(cp.y-d.start.y) + 2*t*(d.end.y-cp.y);
      const fromPt = { x: d.end.x - tx*0.1, y: d.end.y - ty*0.1 };
      vaDrawArrowHead(fromPt, d.end, lw); break;
    }

    case "circle": {
      const rx = Math.abs(d.end.x-d.start.x)/2, ry = Math.abs(d.end.y-d.start.y)/2;
      vaCtx.beginPath();
      vaCtx.ellipse((d.start.x+d.end.x)/2, (d.start.y+d.end.y)/2, rx||1, ry||1, 0, 0, Math.PI*2);
      vaCtx.stroke(); break;
    }

    case "rect": {
      vaCtx.strokeRect(d.start.x, d.start.y, d.end.x-d.start.x, d.end.y-d.start.y); break;
    }

    case "spotlight": {
      // Cone/triangle spotlight pointing down to a player
      const dx = d.end.x - d.start.x, dy = d.end.y - d.start.y;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      const spread = dist * 0.35;

      vaCtx.save();
      // Perpendicular direction
      const px = -dy / dist, py = dx / dist;

      vaCtx.beginPath();
      vaCtx.moveTo(d.start.x, d.start.y);
      vaCtx.lineTo(d.end.x + px * spread, d.end.y + py * spread);
      vaCtx.lineTo(d.end.x - px * spread, d.end.y - py * spread);
      vaCtx.closePath();

      // Gradient fill
      const grad = vaCtx.createLinearGradient(d.start.x, d.start.y, d.end.x, d.end.y);
      const rgb = vaHexToRgb(d.color);
      grad.addColorStop(0, "rgba(" + rgb + ",0.5)");
      grad.addColorStop(1, "rgba(" + rgb + ",0.08)");
      vaCtx.fillStyle = grad;
      vaCtx.fill();

      vaCtx.strokeStyle = d.color;
      vaCtx.lineWidth = 1.5;
      vaCtx.setLineDash([6, 4]);
      vaCtx.stroke();
      vaCtx.setLineDash([]);

      // Circle at target
      vaCtx.beginPath();
      vaCtx.arc(d.end.x, d.end.y, 20, 0, Math.PI * 2);
      vaCtx.strokeStyle = d.color; vaCtx.lineWidth = 2;
      vaCtx.stroke();
      vaCtx.restore(); break;
    }

    case "playerCircle": {
      // Circle around a player (like Veo style)
      const radius = Math.sqrt(Math.pow(d.end.x-d.start.x,2) + Math.pow(d.end.y-d.start.y,2)) || 25;
      vaCtx.save();
      // Outer glow
      vaCtx.beginPath();
      vaCtx.arc(d.start.x, d.start.y, radius + 3, 0, Math.PI * 2);
      const rgb2 = vaHexToRgb(d.color);
      vaCtx.strokeStyle = "rgba(" + rgb2 + ",0.3)";
      vaCtx.lineWidth = lw + 4;
      vaCtx.stroke();
      // Main circle
      vaCtx.beginPath();
      vaCtx.arc(d.start.x, d.start.y, radius, 0, Math.PI * 2);
      vaCtx.strokeStyle = d.color;
      vaCtx.lineWidth = lw;
      vaCtx.stroke();
      vaCtx.restore(); break;
    }

    case "connection": {
      // Two circles connected by a line (player-to-player connection)
      const connR = 20;
      // Line
      vaCtx.beginPath(); vaCtx.moveTo(d.start.x, d.start.y); vaCtx.lineTo(d.end.x, d.end.y);
      vaCtx.strokeStyle = d.color; vaCtx.lineWidth = lw;
      vaCtx.setLineDash([8, 5]); vaCtx.stroke(); vaCtx.setLineDash([]);
      // Circle at start
      vaCtx.beginPath(); vaCtx.arc(d.start.x, d.start.y, connR, 0, Math.PI * 2);
      vaCtx.strokeStyle = d.color; vaCtx.lineWidth = lw; vaCtx.stroke();
      // Circle at end
      vaCtx.beginPath(); vaCtx.arc(d.end.x, d.end.y, connR, 0, Math.PI * 2);
      vaCtx.stroke(); break;
    }

    case "area": {
      const pts = d.areaPoints;
      if (!pts || pts.length < 3) break;
      vaCtx.save();
      vaCtx.beginPath(); vaCtx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) vaCtx.lineTo(pts[i].x, pts[i].y);
      vaCtx.closePath();
      const rgbA = vaHexToRgb(d.color);
      vaCtx.fillStyle = "rgba(" + rgbA + ",0.15)";
      vaCtx.fill();
      vaCtx.strokeStyle = d.color; vaCtx.lineWidth = lw;
      vaCtx.setLineDash([10, 5]); vaCtx.stroke(); vaCtx.setLineDash([]);
      vaCtx.restore(); break;
    }

    case "playerMark": {
      const size = 18 + lw * 2;
      // Triangle pointing down (like a player marker)
      vaCtx.beginPath();
      vaCtx.moveTo(d.end.x, d.end.y + size * 0.6);
      vaCtx.lineTo(d.end.x - size * 0.5, d.end.y - size * 0.4);
      vaCtx.lineTo(d.end.x + size * 0.5, d.end.y - size * 0.4);
      vaCtx.closePath();
      vaCtx.fillStyle = d.color; vaCtx.fill();
      vaCtx.strokeStyle = "#fff"; vaCtx.lineWidth = 1.5; vaCtx.stroke();
      break;
    }

    case "cross": {
      const cs = 14 + lw * 2;
      vaCtx.lineWidth = lw + 1;
      vaCtx.beginPath();
      vaCtx.moveTo(d.end.x - cs, d.end.y - cs); vaCtx.lineTo(d.end.x + cs, d.end.y + cs);
      vaCtx.moveTo(d.end.x + cs, d.end.y - cs); vaCtx.lineTo(d.end.x - cs, d.end.y + cs);
      vaCtx.stroke(); break;
    }

    case "angle": {
      const pts = d.points;
      if (!pts || pts.length < 2) break;
      vaCtx.beginPath(); vaCtx.moveTo(pts[0].x, pts[0].y);
      vaCtx.lineTo(pts[1].x, pts[1].y);
      if (pts.length >= 3) {
        vaCtx.lineTo(pts[2].x, pts[2].y);
        // Draw arc
        const a1 = Math.atan2(pts[0].y-pts[1].y, pts[0].x-pts[1].x);
        const a2 = Math.atan2(pts[2].y-pts[1].y, pts[2].x-pts[1].x);
        vaCtx.stroke();
        vaCtx.beginPath();
        vaCtx.arc(pts[1].x, pts[1].y, 30, a1, a2, a1 > a2);
        vaCtx.stroke();
        // Label angle
        const angle = Math.abs(a2 - a1) * 180 / Math.PI;
        const displayAngle = angle > 180 ? 360 - angle : angle;
        vaCtx.font = "bold 16px sans-serif";
        vaCtx.fillStyle = d.color;
        vaCtx.fillText(Math.round(displayAngle) + "°", pts[1].x + 35, pts[1].y - 5);
      } else {
        vaCtx.stroke();
      }
      break;
    }

    case "freehand": {
      if (d.path && d.path.length > 1) {
        vaCtx.beginPath(); vaCtx.moveTo(d.path[0].x, d.path[0].y);
        for (let i = 1; i < d.path.length; i++) vaCtx.lineTo(d.path[i].x, d.path[i].y);
        vaCtx.stroke();
      } break;
    }

    case "text": {
      const fontSize = 20 + lw * 4;
      vaCtx.font = "bold " + fontSize + "px sans-serif";
      vaCtx.strokeStyle = "#000"; vaCtx.lineWidth = lw + 1;
      vaCtx.strokeText(d.text, d.start.x, d.start.y);
      vaCtx.fillStyle = d.color;
      vaCtx.fillText(d.text, d.start.x, d.start.y); break;
    }
  }
}

function vaDrawArrowHead(from, to, lw) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const headLen = 14 + lw * 2;
  vaCtx.beginPath();
  vaCtx.moveTo(to.x, to.y);
  vaCtx.lineTo(to.x - headLen * Math.cos(angle - Math.PI/6), to.y - headLen * Math.sin(angle - Math.PI/6));
  vaCtx.lineTo(to.x - headLen * Math.cos(angle + Math.PI/6), to.y - headLen * Math.sin(angle + Math.PI/6));
  vaCtx.closePath(); vaCtx.fill();
}

function vaDrawAreaPreview(points, hover, color, lw) {
  vaCtx.save();
  vaCtx.beginPath(); vaCtx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) vaCtx.lineTo(points[i].x, points[i].y);
  vaCtx.lineTo(hover.x, hover.y);
  vaCtx.closePath();
  const rgb = vaHexToRgb(color);
  vaCtx.fillStyle = "rgba(" + rgb + ",0.12)";
  vaCtx.fill();
  vaCtx.strokeStyle = color; vaCtx.lineWidth = lw;
  vaCtx.setLineDash([8, 5]); vaCtx.stroke(); vaCtx.setLineDash([]);
  // Draw vertices
  points.forEach(p => {
    vaCtx.beginPath(); vaCtx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    vaCtx.fillStyle = color; vaCtx.fill();
  });
  vaCtx.restore();
}

function vaHexToRgb(hex) {
  if (!hex || !hex.startsWith("#")) return "255,255,255";
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return r + "," + g + "," + b;
}

// ─── 11. CLIPS ───────────────────────────────────────────────

function vaSetClipPoint(type) {
  if (type === "in") {
    va.clipIn = va.currentTime;
    const b = document.getElementById("va-clip-in");
    b.textContent = "🟢 IN " + vaFormatTime(va.clipIn);
    b.style.background = "rgba(34,197,94,0.15)"; b.style.borderColor = "rgba(34,197,94,0.4)"; b.style.color = "#4ade80";
  } else {
    va.clipOut = va.currentTime;
    const b = document.getElementById("va-clip-out");
    b.textContent = "🔴 OUT " + vaFormatTime(va.clipOut);
    b.style.background = "rgba(239,68,68,0.15)"; b.style.borderColor = "rgba(239,68,68,0.4)"; b.style.color = "#f87171";
  }
  const s = document.getElementById("va-save-clip");
  if (va.clipIn !== null && va.clipOut !== null) {
    s.textContent = "✂️ Guardar clip (" + vaFormatTime(Math.abs(va.clipOut-va.clipIn)) + ")";
    s.style.display = "flex";
  } else { s.style.display = "none"; }
  vaRenderTimelineClips();
}

function vaSaveClip() {
  if (va.clipIn === null || va.clipOut === null) return;
  const inT=Math.min(va.clipIn,va.clipOut), outT=Math.max(va.clipIn,va.clipOut);
  va.clips.push({ id: Date.now(), inTime: inT, outTime: outT, label: "Clip " + (va.clips.length+1),
    events: va.events.filter(e => e.time >= inT && e.time <= outT) });
  va.clipIn = null; va.clipOut = null;
  ["va-clip-in","va-clip-out"].forEach(id => {
    const b = document.getElementById(id);
    b.textContent = id.includes("in") ? "🟢 IN" : "🔴 OUT";
    b.style.background = ""; b.style.borderColor = ""; b.style.color = "";
  });
  document.getElementById("va-save-clip").style.display = "none";
  vaRenderClips(); vaRenderTimelineClips();
}

function vaPlayClip(t) { vaSeekTo(t); vaVideo.play(); va.isPlaying=true; document.getElementById("va-play-btn").textContent="⏸"; }
function vaDeleteClip(id) { va.clips=va.clips.filter(c=>c.id!==id); vaRenderClips(); }

function vaRenderClips() {
  document.getElementById("va-clip-count").textContent = va.clips.length;
  const l = document.getElementById("va-clip-list");
  if (!va.clips.length) { l.innerHTML='<div class="va-empty">Marca IN y OUT para crear clips.</div>'; return; }
  l.innerHTML = va.clips.map(c =>
    '<div class="va-clip-item"><div class="va-clip-header"><span class="va-clip-name">'+c.label+'</span>' +
    '<div style="display:flex;gap:3px"><button class="va-btn-icon" onclick="vaPlayClip('+c.inTime+')">▶</button>' +
    '<button class="va-btn-icon" onclick="vaDeleteClip('+c.id+')">🗑️</button></div></div>' +
    '<div class="va-clip-time">'+vaFormatTime(c.inTime)+' → '+vaFormatTime(c.outTime)+' ('+vaFormatTime(c.outTime-c.inTime)+')</div>' +
    (c.events.length ? '<div class="va-clip-events">'+c.events.map(e=>e.icon).join(" ")+'</div>' : '') +
    '</div>'
  ).join("");
}

// ─── 12. PANELS ──────────────────────────────────────────────

function vaSwitchPanel(p) {
  va.activePanel = p;
  document.querySelectorAll(".va-tab").forEach(el => el.classList.toggle("active", el.dataset.panel === p));
  document.querySelectorAll(".va-section").forEach(el => el.classList.toggle("active", el.id === "va-sec-" + p));
}

// ─── 13. EXPORT ──────────────────────────────────────────────

function vaExportAnalysis() {
  const data = { video: va.videoName, exportDate: new Date().toISOString(),
    events: va.events.map(e => ({ time: vaFormatTime(e.time), seconds: Math.round(e.time*100)/100,
      category: e.label, period: e.period + "T", zone: e.zone, note: e.note })),
    clips: va.clips.map(c => ({ label: c.label, in: vaFormatTime(c.inTime), out: vaFormatTime(c.outTime),
      duration: vaFormatTime(c.outTime-c.inTime),
      events: c.events.map(e => ({ time: vaFormatTime(e.time), category: e.label })) })) };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "analisis-" + (va.videoName || "video") + ".json"; a.click();
}

function vaSnapshot() {
  if (!vaVideo.videoWidth) return;

  const w = vaVideo.videoWidth;
  const h = vaVideo.videoHeight;

  const tmp = document.createElement("canvas");
  tmp.width = w; tmp.height = h;
  const c = tmp.getContext("2d");

  // 1. Draw video frame
  c.drawImage(vaVideo, 0, 0, w, h);

  // 2. Draw all visible drawings directly on this canvas
  if (va.showDrawings) {
    const saveCtx = vaCtx;
    vaCtx = c;
    va.drawings.forEach(d => {
      if (Math.abs(d.time - va.currentTime) < DRAW_DISPLAY_SECONDS) {
        vaDrawShape(d);
      }
    });
    vaCtx = saveCtx;
  }

  const link = document.createElement("a");
  link.download = "captura-" + vaFormatTime(va.currentTime).replace(":","-") + ".png";
  link.href = tmp.toDataURL("image/png"); link.click();
}

// ─── 14. KEYBOARD ────────────────────────────────────────────

function vaSetupKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    // Ctrl shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "z") { e.preventDefault(); vaUndo(); return; }
      if (e.key === "y") { e.preventDefault(); vaRedo(); return; }
    }

    switch (e.key) {
      case " ": e.preventDefault(); vaTogglePlay(); break;
      case "ArrowLeft": e.preventDefault(); vaSeekTo(va.currentTime - 5); break;
      case "ArrowRight": e.preventDefault(); vaSeekTo(va.currentTime + 5); break;
      case ",": vaStepFrame(-1); break;
      case ".": vaStepFrame(1); break;
      case "Escape": vaSetDrawMode(null); break;
      case "Enter": if (va.selectedCategory) { e.preventDefault(); vaAddEvent(); } break;
      default: {
        // Keyboard shortcuts for categories
        const cat = VA_CATEGORIES.find(c => c.key.toLowerCase() === e.key.toLowerCase());
        if (cat) { vaSelectCategory(cat.id); }
      }
    }
  });
}
