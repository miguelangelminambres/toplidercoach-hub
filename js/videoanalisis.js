/* ═══════════════════════════════════════════════════════════
   VideoAnálisis - TopLiderCoach
   Lógica del módulo de análisis de vídeo
   
   Estructura:
   1. CONFIG - Categorías de eventos y herramientas de dibujo
   2. STATE - Estado global de la aplicación
   3. INIT - Inicialización
   4. UPLOAD - Carga de vídeo
   5. VIDEO - Reproductor (play, pause, seek, speed, volume)
   6. TIMELINE - Línea de tiempo con marcadores
   7. EVENTS - Etiquetado de eventos
   8. DRAWING - Dibujo sobre el vídeo
   9. CLIPS - Marcado de clips
   10. PANELS - Navegación de paneles
   11. EXPORT - Exportar JSON y capturas
   12. KEYBOARD - Atajos de teclado
   ═══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────
// 1. CONFIG
// ─────────────────────────────────────────────────────────────

const VA_CATEGORIES = [
  { id: "gol",           label: "Gol",              color: "#22c55e", icon: "⚽" },
  { id: "ocasion",       label: "Ocasión",          color: "#eab308", icon: "🎯" },
  { id: "corner",        label: "Córner",           color: "#3b82f6", icon: "🚩" },
  { id: "falta",         label: "Falta",            color: "#ef4444", icon: "🟥" },
  { id: "tarjeta",       label: "Tarjeta",          color: "#f97316", icon: "🟨" },
  { id: "cambio",        label: "Cambio",           color: "#8b5cf6", icon: "🔄" },
  { id: "fuera-juego",   label: "Fuera de juego",   color: "#06b6d4", icon: "🏴" },
  { id: "saque",         label: "Saque",            color: "#64748b", icon: "👟" },
  { id: "recuperacion",  label: "Recuperación",     color: "#10b981", icon: "💪" },
  { id: "perdida",       label: "Pérdida",          color: "#dc2626", icon: "❌" },
  { id: "pase-clave",    label: "Pase clave",       color: "#a855f7", icon: "🎯" },
  { id: "otro",          label: "Otro",             color: "#94a3b8", icon: "📌" },
];

const VA_DRAW_TOOLS = [
  { id: "arrow",    label: "Flecha",     icon: "➡️" },
  { id: "circle",   label: "Círculo",    icon: "⭕" },
  { id: "rect",     label: "Rectángulo", icon: "⬜" },
  { id: "freehand", label: "Libre",      icon: "〰️" },
  { id: "text",     label: "Texto",      icon: "🔤" },
];

const VA_COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#eab308", "#ffffff", "#f97316"];

const DRAW_DISPLAY_SECONDS = 5;

// ─────────────────────────────────────────────────────────────
// 2. STATE
// ─────────────────────────────────────────────────────────────

const va = {
  // Video
  videoName: "",
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1,

  // Events
  events: [],
  selectedCategory: null,
  filterCategory: "all",

  // Drawing
  drawMode: null,
  drawColor: "#ef4444",
  drawings: [],
  showDrawings: true,
  isDrawing: false,
  drawStart: null,
  currentPath: [],
  textPos: null,

  // Clips
  clipIn: null,
  clipOut: null,
  clips: [],

  // UI
  activePanel: "events",
};

// DOM refs (se asignan en init)
let vaVideo, vaCanvas, vaCtx;

// ─────────────────────────────────────────────────────────────
// 3. INIT
// ─────────────────────────────────────────────────────────────

function vaInit() {
  vaVideo = document.getElementById("va-video");
  vaCanvas = document.getElementById("va-canvas");
  vaCtx = vaCanvas.getContext("2d");

  vaBuildEventTags();
  vaBuildColorPicker();
  vaBuildDrawTools();
  vaSetupUpload();
  vaSetupVideoEvents();
  vaSetupCanvasEvents();
  vaSetupKeyboard();
}

// Ejecutar cuando cargue la página
document.addEventListener("DOMContentLoaded", vaInit);

// ─────────────────────────────────────────────────────────────
// 4. UPLOAD
// ─────────────────────────────────────────────────────────────

function vaSetupUpload() {
  const box = document.getElementById("va-upload-box");
  const input = document.getElementById("va-file-input");

  box.addEventListener("click", () => input.click());
  input.addEventListener("change", (e) => vaLoadFile(e.target.files[0]));

  box.addEventListener("dragover", (e) => {
    e.preventDefault();
    box.classList.add("dragover");
  });
  box.addEventListener("dragleave", () => box.classList.remove("dragover"));
  box.addEventListener("drop", (e) => {
    e.preventDefault();
    box.classList.remove("dragover");
    if (e.dataTransfer.files[0]) vaLoadFile(e.dataTransfer.files[0]);
  });
}

function vaLoadFile(file) {
  if (!file || !file.type.startsWith("video/")) return;

  // Liberar URL anterior si existe
  if (vaVideo.src && vaVideo.src.startsWith("blob:")) {
    URL.revokeObjectURL(vaVideo.src);
  }

  const url = URL.createObjectURL(file);
  vaVideo.src = url;
  vaVideo.load(); // Forzar carga
  va.videoName = file.name;
  document.getElementById("va-video-name").textContent = file.name;

  // Mostrar app, ocultar upload
  document.getElementById("va-upload-screen").style.display = "none";
  document.getElementById("va-main").classList.add("active");

  // Reset estado
  va.events = [];
  va.drawings = [];
  va.clips = [];
  va.clipIn = null;
  va.clipOut = null;
  va.selectedCategory = null;
  vaRenderEvents();
  vaRenderClips();
  vaRenderTimelineMarkers();
}

function vaNewVideo() {
  document.getElementById("va-main").classList.remove("active");
  document.getElementById("va-upload-screen").style.display = "flex";
  vaVideo.src = "";
  va.videoName = "";
}

// ─────────────────────────────────────────────────────────────
// 5. VIDEO
// ─────────────────────────────────────────────────────────────

function vaSetupVideoEvents() {
  vaVideo.addEventListener("loadedmetadata", () => {
    va.duration = vaVideo.duration;
    document.getElementById("va-total-time").textContent = vaFormatTime(va.duration);
    vaVideo.volume = 0.7;
    console.log("✅ Vídeo cargado:", va.videoName, "Duración:", vaFormatTime(va.duration));
  });

  vaVideo.addEventListener("timeupdate", () => {
    va.currentTime = vaVideo.currentTime;
    vaUpdateTimeDisplay();
    vaUpdateTimeline();
    vaRenderCanvas();
  });

  vaVideo.addEventListener("ended", () => {
    va.isPlaying = false;
    document.getElementById("va-play-btn").textContent = "▶";
  });

  vaVideo.addEventListener("click", () => {
    if (!va.drawMode) vaTogglePlay();
  });

  // Error handling - si el vídeo no se puede cargar
  vaVideo.addEventListener("error", (e) => {
    console.error("❌ Error al cargar el vídeo:", vaVideo.error);
    alert("No se puede reproducir este vídeo.\n\nPrueba a convertirlo a MP4 (H.264) con una herramienta como HandBrake o CloudConvert.");
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
    }).catch(err => {
      console.error("❌ No se puede reproducir:", err.message);
    });
  }
}

function vaSeekTo(time) {
  const clamped = Math.max(0, Math.min(time, va.duration || 0));
  vaVideo.currentTime = clamped;
  va.currentTime = clamped;
  vaUpdateTimeDisplay();
  vaUpdateTimeline();
}

function vaStepFrame(dir) {
  vaVideo.pause();
  va.isPlaying = false;
  document.getElementById("va-play-btn").textContent = "▶";
  vaSeekTo(va.currentTime + dir * (1 / 25));
}

function vaChangeSpeed() {
  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
  const idx = speeds.indexOf(va.playbackRate);
  va.playbackRate = speeds[(idx + 1) % speeds.length];
  vaVideo.playbackRate = va.playbackRate;
  document.getElementById("va-speed-btn").textContent = va.playbackRate + "x";
}

function vaChangeVolume(val) {
  vaVideo.volume = parseFloat(val);
}

function vaFormatTime(s) {
  if (!s || isNaN(s)) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}

function vaUpdateTimeDisplay() {
  document.getElementById("va-current-time").textContent = vaFormatTime(va.currentTime);
  document.getElementById("va-tag-time").textContent = vaFormatTime(va.currentTime);
}

// ─────────────────────────────────────────────────────────────
// 6. TIMELINE
// ─────────────────────────────────────────────────────────────

function vaUpdateTimeline() {
  if (!va.duration) return;
  const pct = (va.currentTime / va.duration) * 100;
  document.getElementById("va-tl-progress").style.width = pct + "%";
  document.getElementById("va-tl-playhead").style.left = pct + "%";
}

function vaTimelineClick(e) {
  const bar = document.getElementById("va-timeline");
  const rect = bar.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  vaSeekTo(ratio * va.duration);
}

function vaRenderTimelineMarkers() {
  const container = document.getElementById("va-tl-markers");
  if (!va.duration) { container.innerHTML = ""; return; }

  container.innerHTML = va.events.map(ev =>
    '<div class="va-timeline-marker" style="left:' + ((ev.time / va.duration) * 100) + '%" ' +
    'onclick="event.stopPropagation();vaSeekTo(' + ev.time + ')" ' +
    'title="' + vaFormatTime(ev.time) + ' - ' + ev.label + (ev.note ? ': ' + ev.note : '') + '">' +
    ev.icon + '</div>'
  ).join("");
}

function vaRenderTimelineClips() {
  const container = document.getElementById("va-tl-clips");
  if (!va.duration) { container.innerHTML = ""; return; }

  let html = "";
  if (va.clipIn !== null) {
    html += '<div class="va-timeline-clip-mark" style="left:' +
      ((va.clipIn / va.duration) * 100) + '%;background:#22c55e"></div>';
  }
  if (va.clipOut !== null) {
    html += '<div class="va-timeline-clip-mark" style="left:' +
      ((va.clipOut / va.duration) * 100) + '%;background:#ef4444"></div>';
  }
  if (va.clipIn !== null && va.clipOut !== null) {
    const left = (Math.min(va.clipIn, va.clipOut) / va.duration) * 100;
    const width = (Math.abs(va.clipOut - va.clipIn) / va.duration) * 100;
    html += '<div class="va-timeline-clip-range" style="left:' + left + '%;width:' + width + '%"></div>';
  }
  container.innerHTML = html;
}

// ─────────────────────────────────────────────────────────────
// 7. EVENTS
// ─────────────────────────────────────────────────────────────

function vaBuildEventTags() {
  const container = document.getElementById("va-event-tags");
  container.innerHTML = VA_CATEGORIES.map(cat =>
    '<button class="va-tag" data-cat="' + cat.id + '" onclick="vaSelectCategory(\'' + cat.id + '\')">' +
    '<span class="icon">' + cat.icon + '</span>' + cat.label + '</button>'
  ).join("");
}

function vaSelectCategory(catId) {
  // Toggle
  va.selectedCategory = (va.selectedCategory === catId) ? null : catId;

  // Actualizar UI de tags
  document.querySelectorAll("#va-event-tags .va-tag").forEach(el => {
    const id = el.dataset.cat;
    const cat = VA_CATEGORIES.find(c => c.id === id);
    if (id === va.selectedCategory) {
      el.classList.add("active");
      el.style.background = cat.color;
      el.style.borderColor = cat.color;
    } else {
      el.classList.remove("active");
      el.style.background = "";
      el.style.borderColor = "transparent";
    }
  });

  // Mostrar/ocultar fila de añadir
  document.getElementById("va-add-row").classList.toggle("active", !!va.selectedCategory);
}

function vaAddEvent() {
  if (!va.selectedCategory) return;
  const cat = VA_CATEGORIES.find(c => c.id === va.selectedCategory);
  const noteInput = document.getElementById("va-event-note");
  const note = noteInput.value.trim();

  va.events.push({
    id: Date.now(),
    time: va.currentTime,
    category: va.selectedCategory,
    label: cat.label,
    color: cat.color,
    icon: cat.icon,
    note: note,
  });

  va.events.sort((a, b) => a.time - b.time);
  noteInput.value = "";
  vaRenderEvents();
  vaRenderTimelineMarkers();
}

function vaDeleteEvent(id) {
  va.events = va.events.filter(e => e.id !== id);
  vaRenderEvents();
  vaRenderTimelineMarkers();
}

function vaRenderEvents() {
  const filter = va.filterCategory;
  const filtered = (filter === "all") ? va.events : va.events.filter(e => e.category === filter);

  // Badge contador
  const badge = document.getElementById("va-event-count");
  if (va.events.length > 0) {
    badge.style.display = "inline";
    badge.textContent = va.events.length;
  } else {
    badge.style.display = "none";
  }

  // Opciones del filtro
  const filterEl = document.getElementById("va-event-filter");
  let opts = '<option value="all">Todos (' + va.events.length + ')</option>';
  VA_CATEGORIES.forEach(cat => {
    const count = va.events.filter(e => e.category === cat.id).length;
    if (count > 0) {
      opts += '<option value="' + cat.id + '">' + cat.icon + ' ' + cat.label + ' (' + count + ')</option>';
    }
  });
  filterEl.innerHTML = opts;
  filterEl.value = filter;

  // Lista
  const list = document.getElementById("va-event-list");
  if (filtered.length === 0) {
    list.innerHTML = '<div class="va-empty">Sin eventos todavía. Selecciona una categoría y pulsa + para etiquetar.</div>';
    return;
  }

  list.innerHTML = filtered.map(ev =>
    '<div class="va-event-item" onclick="vaSeekTo(' + ev.time + ')" style="border-left:3px solid ' + ev.color + '">' +
    '<span class="icon">' + ev.icon + '</span>' +
    '<div class="info">' +
    '<div class="name">' + ev.label + '</div>' +
    (ev.note ? '<div class="note">' + ev.note + '</div>' : '') +
    '</div>' +
    '<span class="time">' + vaFormatTime(ev.time) + '</span>' +
    '<button class="va-btn-icon" onclick="event.stopPropagation();vaDeleteEvent(' + ev.id + ')">🗑️</button>' +
    '</div>'
  ).join("");
}

function vaSetEventFilter(value) {
  va.filterCategory = value;
  vaRenderEvents();
}

// ─────────────────────────────────────────────────────────────
// 8. DRAWING
// ─────────────────────────────────────────────────────────────

function vaBuildDrawTools() {
  const container = document.getElementById("va-draw-tools");
  container.innerHTML = VA_DRAW_TOOLS.map(tool =>
    '<button class="va-draw-tool" data-tool="' + tool.id + '" ' +
    'onclick="vaSetDrawMode(\'' + tool.id + '\')">' +
    tool.icon + ' ' + tool.label + '</button>'
  ).join("");
}

function vaBuildColorPicker() {
  const container = document.getElementById("va-color-picker");
  container.innerHTML = VA_COLORS.map((color, i) =>
    '<div class="va-color' + (i === 0 ? ' active' : '') + '" ' +
    'style="background:' + color + '" data-color="' + color + '" ' +
    'onclick="vaSelectDrawColor(\'' + color + '\')"></div>'
  ).join("");
}

function vaSetDrawMode(mode) {
  // Toggle: si clicas el mismo, desactiva
  if (va.drawMode === mode) mode = null;
  va.drawMode = mode;

  vaCanvas.classList.toggle("active", !!mode);
  document.getElementById("va-draw-badge").classList.toggle("active", !!mode);
  document.getElementById("va-draw-mode-label").textContent = mode || "-";

  document.querySelectorAll(".va-draw-tool").forEach(el => {
    el.classList.toggle("active", el.dataset.tool === mode);
  });

  if (!mode) vaCancelText();
}

function vaSelectDrawColor(color) {
  va.drawColor = color;
  document.querySelectorAll(".va-color").forEach(el => {
    el.classList.toggle("active", el.dataset.color === color);
  });
}

function vaSetupCanvasEvents() {
  vaCanvas.addEventListener("mousedown", (e) => {
    if (!va.drawMode) return;
    e.preventDefault();

    if (va.drawMode === "text") {
      va.textPos = vaGetCanvasPos(e);
      document.getElementById("va-text-overlay").classList.add("active");
      document.getElementById("va-text-input").focus();
      return;
    }

    va.isDrawing = true;
    va.drawStart = vaGetCanvasPos(e);
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
    const pos = vaGetCanvasPos(e);

    va.drawings.push({
      id: Date.now(),
      type: va.drawMode,
      color: va.drawColor,
      time: va.currentTime,
      start: va.drawStart,
      end: pos,
      path: va.drawMode === "freehand" ? [...va.currentPath, pos] : null,
    });

    va.isDrawing = false;
    va.drawStart = null;
    va.currentPath = [];
    vaRenderCanvas();
  });
}

function vaGetCanvasPos(e) {
  const rect = vaCanvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * vaCanvas.width,
    y: ((e.clientY - rect.top) / rect.height) * vaCanvas.height,
  };
}

function vaAddTextDrawing() {
  const input = document.getElementById("va-text-input");
  const text = input.value.trim();
  if (!text || !va.textPos) return;

  va.drawings.push({
    id: Date.now(),
    type: "text",
    color: va.drawColor,
    time: va.currentTime,
    start: va.textPos,
    text: text,
  });

  input.value = "";
  vaCancelText();
  vaRenderCanvas();
}

function vaCancelText() {
  va.textPos = null;
  document.getElementById("va-text-overlay").classList.remove("active");
}

function vaUndoDrawing() {
  va.drawings.pop();
  vaRenderCanvas();
}

function vaClearDrawings() {
  va.drawings = [];
  vaRenderCanvas();
}

function vaToggleDrawVisibility() {
  va.showDrawings = !va.showDrawings;
  document.getElementById("va-toggle-draw").textContent =
    va.showDrawings ? "👁️ Ocultar dibujos" : "🙈 Mostrar dibujos";
  vaRenderCanvas();
}

// ─── Canvas rendering ────────────────────────────────────────

function vaRenderCanvas(currentPos) {
  if (!vaVideo.videoWidth) return;
  vaCanvas.width = vaVideo.videoWidth;
  vaCanvas.height = vaVideo.videoHeight;
  vaCtx.clearRect(0, 0, vaCanvas.width, vaCanvas.height);
  if (!va.showDrawings) return;

  // Dibujos guardados (dentro de ventana de tiempo)
  va.drawings.forEach(d => {
    if (Math.abs(d.time - va.currentTime) < DRAW_DISPLAY_SECONDS) {
      vaDrawShape(d);
    }
  });

  // Dibujo en curso
  if (va.isDrawing && va.drawStart && currentPos) {
    vaDrawShape({
      type: va.drawMode,
      color: va.drawColor,
      start: va.drawStart,
      end: currentPos,
      path: va.drawMode === "freehand" ? va.currentPath : null,
    });
  }
}

function vaDrawShape(d) {
  vaCtx.strokeStyle = d.color;
  vaCtx.fillStyle = d.color;
  vaCtx.lineWidth = 3;
  vaCtx.lineCap = "round";
  vaCtx.lineJoin = "round";

  switch (d.type) {
    case "arrow": {
      const angle = Math.atan2(d.end.y - d.start.y, d.end.x - d.start.x);
      vaCtx.beginPath();
      vaCtx.moveTo(d.start.x, d.start.y);
      vaCtx.lineTo(d.end.x, d.end.y);
      vaCtx.stroke();
      const h = 18;
      vaCtx.beginPath();
      vaCtx.moveTo(d.end.x, d.end.y);
      vaCtx.lineTo(d.end.x - h * Math.cos(angle - Math.PI / 6), d.end.y - h * Math.sin(angle - Math.PI / 6));
      vaCtx.lineTo(d.end.x - h * Math.cos(angle + Math.PI / 6), d.end.y - h * Math.sin(angle + Math.PI / 6));
      vaCtx.closePath();
      vaCtx.fill();
      break;
    }
    case "circle": {
      const rx = Math.abs(d.end.x - d.start.x) / 2;
      const ry = Math.abs(d.end.y - d.start.y) / 2;
      const cx = (d.start.x + d.end.x) / 2;
      const cy = (d.start.y + d.end.y) / 2;
      vaCtx.beginPath();
      vaCtx.ellipse(cx, cy, rx || 1, ry || 1, 0, 0, Math.PI * 2);
      vaCtx.stroke();
      break;
    }
    case "rect": {
      vaCtx.strokeRect(d.start.x, d.start.y, d.end.x - d.start.x, d.end.y - d.start.y);
      break;
    }
    case "freehand": {
      if (d.path && d.path.length > 1) {
        vaCtx.beginPath();
        vaCtx.moveTo(d.path[0].x, d.path[0].y);
        for (let i = 1; i < d.path.length; i++) vaCtx.lineTo(d.path[i].x, d.path[i].y);
        vaCtx.stroke();
      }
      break;
    }
    case "text": {
      vaCtx.font = "bold 28px sans-serif";
      vaCtx.strokeStyle = "#000";
      vaCtx.lineWidth = 4;
      vaCtx.strokeText(d.text, d.start.x, d.start.y);
      vaCtx.fillStyle = d.color;
      vaCtx.fillText(d.text, d.start.x, d.start.y);
      break;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 9. CLIPS
// ─────────────────────────────────────────────────────────────

function vaSetClipPoint(type) {
  if (type === "in") {
    va.clipIn = va.currentTime;
    const btn = document.getElementById("va-clip-in");
    btn.textContent = "🟢 IN " + vaFormatTime(va.clipIn);
    btn.style.background = "rgba(34,197,94,0.2)";
    btn.style.borderColor = "rgba(34,197,94,0.5)";
    btn.style.color = "#4ade80";
  } else {
    va.clipOut = va.currentTime;
    const btn = document.getElementById("va-clip-out");
    btn.textContent = "🔴 OUT " + vaFormatTime(va.clipOut);
    btn.style.background = "rgba(239,68,68,0.2)";
    btn.style.borderColor = "rgba(239,68,68,0.5)";
    btn.style.color = "#f87171";
  }

  // Mostrar/ocultar botón guardar
  const saveBtn = document.getElementById("va-save-clip");
  if (va.clipIn !== null && va.clipOut !== null) {
    const dur = Math.abs(va.clipOut - va.clipIn);
    saveBtn.textContent = "✂️ Guardar clip (" + vaFormatTime(dur) + ")";
    saveBtn.style.display = "flex";
  } else {
    saveBtn.style.display = "none";
  }

  vaRenderTimelineClips();
}

function vaSaveClip() {
  if (va.clipIn === null || va.clipOut === null) return;

  const inT = Math.min(va.clipIn, va.clipOut);
  const outT = Math.max(va.clipIn, va.clipOut);

  va.clips.push({
    id: Date.now(),
    inTime: inT,
    outTime: outT,
    label: "Clip " + (va.clips.length + 1),
    events: va.events.filter(e => e.time >= inT && e.time <= outT),
  });

  // Reset marcadores
  va.clipIn = null;
  va.clipOut = null;
  const inBtn = document.getElementById("va-clip-in");
  inBtn.textContent = "🟢 IN";
  inBtn.style.background = "";
  inBtn.style.borderColor = "";
  inBtn.style.color = "";
  const outBtn = document.getElementById("va-clip-out");
  outBtn.textContent = "🔴 OUT";
  outBtn.style.background = "";
  outBtn.style.borderColor = "";
  outBtn.style.color = "";
  document.getElementById("va-save-clip").style.display = "none";

  vaRenderClips();
  vaRenderTimelineClips();
}

function vaPlayClip(inTime) {
  vaSeekTo(inTime);
  vaVideo.play();
  va.isPlaying = true;
  document.getElementById("va-play-btn").textContent = "⏸";
}

function vaDeleteClip(id) {
  va.clips = va.clips.filter(c => c.id !== id);
  vaRenderClips();
}

function vaRenderClips() {
  document.getElementById("va-clip-count").textContent = va.clips.length;
  const list = document.getElementById("va-clip-list");

  if (va.clips.length === 0) {
    list.innerHTML = '<div class="va-empty">Marca un punto IN y OUT en la línea de tiempo para crear clips.</div>';
    return;
  }

  list.innerHTML = va.clips.map(clip =>
    '<div class="va-clip-item">' +
    '<div class="va-clip-header">' +
    '<span class="va-clip-name">' + clip.label + '</span>' +
    '<div style="display:flex;gap:4px">' +
    '<button class="va-btn-icon" onclick="vaPlayClip(' + clip.inTime + ')" title="Reproducir">▶</button>' +
    '<button class="va-btn-icon" onclick="vaDeleteClip(' + clip.id + ')" title="Eliminar">🗑️</button>' +
    '</div></div>' +
    '<div class="va-clip-time">' + vaFormatTime(clip.inTime) + ' → ' + vaFormatTime(clip.outTime) +
    ' (' + vaFormatTime(clip.outTime - clip.inTime) + ')</div>' +
    (clip.events.length > 0
      ? '<div class="va-clip-events">' + clip.events.map(e => e.icon).join(" ") + '</div>'
      : '') +
    '</div>'
  ).join("");
}

// ─────────────────────────────────────────────────────────────
// 10. PANELS
// ─────────────────────────────────────────────────────────────

function vaSwitchPanel(panel) {
  va.activePanel = panel;
  document.querySelectorAll(".va-tab").forEach(el =>
    el.classList.toggle("active", el.dataset.panel === panel)
  );
  document.querySelectorAll(".va-section").forEach(el =>
    el.classList.toggle("active", el.id === "va-sec-" + panel)
  );
}

// ─────────────────────────────────────────────────────────────
// 11. EXPORT
// ─────────────────────────────────────────────────────────────

function vaExportAnalysis() {
  const data = {
    video: va.videoName,
    exportDate: new Date().toISOString(),
    events: va.events.map(e => ({
      time: vaFormatTime(e.time),
      timeSeconds: Math.round(e.time * 100) / 100,
      category: e.label,
      note: e.note,
    })),
    clips: va.clips.map(c => ({
      label: c.label,
      inTime: vaFormatTime(c.inTime),
      outTime: vaFormatTime(c.outTime),
      duration: vaFormatTime(c.outTime - c.inTime),
      events: c.events.map(e => ({
        time: vaFormatTime(e.time),
        category: e.label,
        note: e.note,
      })),
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "analisis-" + (va.videoName || "video") + ".json";
  a.click();
  URL.revokeObjectURL(url);
}

function vaSnapshot() {
  if (!vaVideo.videoWidth) return;

  const tmp = document.createElement("canvas");
  tmp.width = vaVideo.videoWidth;
  tmp.height = vaVideo.videoHeight;
  const c = tmp.getContext("2d");
  c.drawImage(vaVideo, 0, 0);
  c.drawImage(vaCanvas, 0, 0);

  const link = document.createElement("a");
  link.download = "captura-" + vaFormatTime(va.currentTime).replace(":", "-") + ".png";
  link.href = tmp.toDataURL("image/png");
  link.click();
}

// ─────────────────────────────────────────────────────────────
// 12. KEYBOARD
// ─────────────────────────────────────────────────────────────

function vaSetupKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    switch (e.key) {
      case " ":
        e.preventDefault();
        vaTogglePlay();
        break;
      case "ArrowLeft":
        e.preventDefault();
        vaSeekTo(va.currentTime - 5);
        break;
      case "ArrowRight":
        e.preventDefault();
        vaSeekTo(va.currentTime + 5);
        break;
      case ",":
        vaStepFrame(-1);
        break;
      case ".":
        vaStepFrame(1);
        break;
      case "Escape":
        vaSetDrawMode(null);
        break;
    }
  });
}
