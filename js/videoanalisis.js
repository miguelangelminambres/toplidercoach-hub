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
  { id: "arrow", label: "Flecha", icon: "➡️" },
  { id: "circle", label: "Círculo", icon: "⭕" },
  { id: "rect", label: "Rect", icon: "⬜" },
  { id: "freehand", label: "Libre", icon: "〰️" },
  { id: "text", label: "Texto", icon: "🔤" },
];

const VA_COLORS = ["#ef4444","#22c55e","#3b82f6","#eab308","#ffffff","#f97316"];
const DRAW_DISPLAY_SECONDS = 5;

// ─── 2. STATE ────────────────────────────────────────────────

const va = {
  videoName: "", isPlaying: false, currentTime: 0, duration: 0, playbackRate: 1,
  events: [], selectedCategory: null, selectedZone: null,
  filterPeriod: "all", filterRange: null,
  drawMode: null, drawColor: "#ef4444", drawings: [], showDrawings: true,
  isDrawing: false, drawStart: null, currentPath: [], textPos: null,
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
  vaRenderTable(); vaRenderClips(); vaRenderTimelineMarkers();
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
  document.getElementById("va-draw-tools").innerHTML = VA_DRAW_TOOLS.map(t =>
    '<button class="va-draw-tool" data-tool="' + t.id + '" onclick="vaSetDrawMode(\'' + t.id + '\')">' +
    t.icon + ' ' + t.label + '</button>'
  ).join("");
}

function vaBuildColorPicker() {
  document.getElementById("va-color-picker").innerHTML = VA_COLORS.map((c,i) =>
    '<div class="va-color' + (i===0?' active':'') + '" style="background:' + c +
    '" data-color="' + c + '" onclick="vaSelectDrawColor(\'' + c + '\')"></div>'
  ).join("");
}

function vaSetDrawMode(mode) {
  if (va.drawMode === mode) mode = null;
  va.drawMode = mode;
  vaCanvas.classList.toggle("active", !!mode);
  document.getElementById("va-draw-badge").classList.toggle("active", !!mode);
  document.getElementById("va-draw-mode-label").textContent = mode || "-";
  document.querySelectorAll(".va-draw-tool").forEach(el => el.classList.toggle("active", el.dataset.tool === mode));
  if (!mode) vaCancelText();
}

function vaSelectDrawColor(c) {
  va.drawColor = c;
  document.querySelectorAll(".va-color").forEach(el => el.classList.toggle("active", el.dataset.color === c));
}

function vaSetupCanvasEvents() {
  vaCanvas.addEventListener("mousedown", (e) => {
    if (!va.drawMode) return; e.preventDefault();
    if (va.drawMode === "text") {
      va.textPos = vaGetCanvasPos(e);
      document.getElementById("va-text-overlay").classList.add("active");
      document.getElementById("va-text-input").focus();
      return;
    }
    va.isDrawing = true; va.drawStart = vaGetCanvasPos(e);
    if (va.drawMode === "freehand") va.currentPath = [va.drawStart];
  });
  vaCanvas.addEventListener("mousemove", (e) => {
    if (!va.isDrawing || !va.drawMode) return;
    const pos = vaGetCanvasPos(e);
    if (va.drawMode === "freehand") va.currentPath.push(pos);
    vaRenderCanvas(pos);
  });
  vaCanvas.addEventListener("mouseup", (e) => {
    if (!va.isDrawing || !va.drawMode) return;
    va.drawings.push({
      id: Date.now(), type: va.drawMode, color: va.drawColor, time: va.currentTime,
      start: va.drawStart, end: vaGetCanvasPos(e),
      path: va.drawMode === "freehand" ? [...va.currentPath, vaGetCanvasPos(e)] : null,
    });
    va.isDrawing = false; va.drawStart = null; va.currentPath = [];
    vaRenderCanvas();
  });
}

function vaGetCanvasPos(e) {
  const r = vaCanvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * vaCanvas.width, y: ((e.clientY - r.top) / r.height) * vaCanvas.height };
}

function vaAddTextDrawing() {
  const input = document.getElementById("va-text-input");
  const text = input.value.trim(); if (!text || !va.textPos) return;
  va.drawings.push({ id: Date.now(), type: "text", color: va.drawColor, time: va.currentTime, start: va.textPos, text });
  input.value = ""; vaCancelText(); vaRenderCanvas();
}

function vaCancelText() { va.textPos = null; document.getElementById("va-text-overlay").classList.remove("active"); }
function vaUndoDrawing() { va.drawings.pop(); vaRenderCanvas(); }
function vaClearDrawings() { va.drawings = []; vaRenderCanvas(); }
function vaToggleDrawVisibility() {
  va.showDrawings = !va.showDrawings;
  document.getElementById("va-toggle-draw").textContent = va.showDrawings ? "👁️ Ocultar dibujos" : "🙈 Mostrar dibujos";
  vaRenderCanvas();
}

function vaRenderCanvas(pos) {
  if (!vaVideo.videoWidth) return;
  vaCanvas.width = vaVideo.videoWidth; vaCanvas.height = vaVideo.videoHeight;
  vaCtx.clearRect(0, 0, vaCanvas.width, vaCanvas.height);
  if (!va.showDrawings) return;
  va.drawings.forEach(d => { if (Math.abs(d.time - va.currentTime) < DRAW_DISPLAY_SECONDS) vaDrawShape(d); });
  if (va.isDrawing && va.drawStart && pos) {
    vaDrawShape({ type: va.drawMode, color: va.drawColor, start: va.drawStart, end: pos,
      path: va.drawMode === "freehand" ? va.currentPath : null });
  }
}

function vaDrawShape(d) {
  vaCtx.strokeStyle = d.color; vaCtx.fillStyle = d.color;
  vaCtx.lineWidth = 3; vaCtx.lineCap = "round"; vaCtx.lineJoin = "round";
  switch (d.type) {
    case "arrow": {
      const a = Math.atan2(d.end.y-d.start.y, d.end.x-d.start.x);
      vaCtx.beginPath(); vaCtx.moveTo(d.start.x, d.start.y); vaCtx.lineTo(d.end.x, d.end.y); vaCtx.stroke();
      vaCtx.beginPath(); vaCtx.moveTo(d.end.x, d.end.y);
      vaCtx.lineTo(d.end.x-18*Math.cos(a-Math.PI/6), d.end.y-18*Math.sin(a-Math.PI/6));
      vaCtx.lineTo(d.end.x-18*Math.cos(a+Math.PI/6), d.end.y-18*Math.sin(a+Math.PI/6));
      vaCtx.closePath(); vaCtx.fill(); break;
    }
    case "circle": {
      const rx=Math.abs(d.end.x-d.start.x)/2, ry=Math.abs(d.end.y-d.start.y)/2;
      vaCtx.beginPath(); vaCtx.ellipse((d.start.x+d.end.x)/2,(d.start.y+d.end.y)/2,rx||1,ry||1,0,0,Math.PI*2); vaCtx.stroke(); break;
    }
    case "rect": { vaCtx.strokeRect(d.start.x,d.start.y,d.end.x-d.start.x,d.end.y-d.start.y); break; }
    case "freehand": {
      if (d.path && d.path.length > 1) { vaCtx.beginPath(); vaCtx.moveTo(d.path[0].x,d.path[0].y);
      for (let i=1;i<d.path.length;i++) vaCtx.lineTo(d.path[i].x,d.path[i].y); vaCtx.stroke(); } break;
    }
    case "text": {
      vaCtx.font="bold 28px sans-serif"; vaCtx.strokeStyle="#000"; vaCtx.lineWidth=4;
      vaCtx.strokeText(d.text,d.start.x,d.start.y); vaCtx.fillStyle=d.color;
      vaCtx.fillText(d.text,d.start.x,d.start.y); break;
    }
  }
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
  const tmp = document.createElement("canvas");
  tmp.width = vaVideo.videoWidth; tmp.height = vaVideo.videoHeight;
  const c = tmp.getContext("2d"); c.drawImage(vaVideo, 0, 0); c.drawImage(vaCanvas, 0, 0);
  const link = document.createElement("a");
  link.download = "captura-" + vaFormatTime(va.currentTime).replace(":","-") + ".png";
  link.href = tmp.toDataURL("image/png"); link.click();
}

// ─── 14. KEYBOARD ────────────────────────────────────────────

function vaSetupKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
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
