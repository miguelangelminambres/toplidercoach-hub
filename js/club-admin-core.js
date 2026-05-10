// ========== CLUB-ADMIN-CORE.JS ==========
// Conexión, estado global, navegación, utilidades compartidas

// ===== SUPABASE =====
var SB = window.supabase.createClient(
    'https://cqteodxyvavyroxeshoz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdGVvZHh5dmF2eXJveGVzaG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNzc2OTksImV4cCI6MjA4MDg1MzY5OX0.8sJC6twae2pnrf8NDVlOV2KnSOhBC1RrqWC0IiuE614'
);
var SB_URL = 'https://cqteodxyvavyroxeshoz.supabase.co';

// ===== ESTADO GLOBAL =====
var CI = null;          // club_id
var CD = null;          // club data
var U = null;           // usuario
var equipos = [];
var cargos = [];
var miembros = [];
var jugadoresClub = [];
var plantilla = [];
var equipoActual = null;
var jugadorActual = null;
var vistaAnterior = 'equipos';

// ===== CONSTANTES =====
var MODULOS = [
    {key:'dashboard',label:'Dashboard'},{key:'planificador',label:'Planificador'},
    {key:'pizarra',label:'Pizarra'},{key:'matchstats',label:'MatchStats'},
    {key:'asistencia',label:'Asistencia'},{key:'periodizacion',label:'Periodizacion'},
    {key:'plan_partido',label:'Plan Partido'},{key:'mi_club',label:'Mi Club'},
    {key:'staff_ia',label:'IA'},{key:'direccion_deportiva',label:'Dir. Deportiva'},
    {key:'scouting',label:'Scouting'},{key:'economia',label:'Economia'},
    {key:'personal',label:'Personal'}
];

var PC = {portero:'#f59e0b',defensa:'#3b82f6',centrocampista:'#06d6a0',delantero:'#ef4444'};

var SL = {activo:'Activo',lesionado:'Lesionado',baja:'Baja',prueba:'En prueba',cedido:'Cedido',retirado:'Retirado'};

var SB2 = {activo:'badge-green',lesionado:'badge-amber',baja:'badge-red',prueba:'badge-purple',cedido:'badge-gray',retirado:'badge-gray'};

var POSICIONES = [
    'Portero','Lateral Derecho','Lateral Izquierdo','Central',
    'Medio Centro','Interior Derecho','Interior Izquierdo',
    'Extremo Derecho','Extremo Izquierdo','Mediapunta','Punta'
];

// ===== UTILIDADES =====
function gv(id) {
    var e = document.getElementById(id);
    return e ? (e.value.trim() || null) : null;
}

function sv(id, v) {
    var e = document.getElementById(id);
    if (e) e.value = v || '';
}

function ini(n) {
    if (!n) return '?';
    var p = n.trim().split(/\s+/);
    return p.length > 1 ? (p[0][0] + p[p.length-1][0]).toUpperCase() : n.substring(0,2).toUpperCase();
}

function avt(url, name, cls) {
    cls = cls || 'avatar';
    return url
        ? '<img src="' + url + '" class="' + cls + '" alt="" loading="lazy">'
        : '<div class="' + cls + ' avatar-placeholder">' + ini(name) + '</div>';
}

function edad(b) {
    if (!b) return '';
    var h = new Date(), d = new Date(b + 'T12:00:00');
    var a = h.getFullYear() - d.getFullYear();
    if (h.getMonth() < d.getMonth() || (h.getMonth() === d.getMonth() && h.getDate() < d.getDate())) a--;
    return a;
}

function tempActual() {
    var h = new Date(), m = h.getMonth(), a = h.getFullYear();
    return m >= 6 ? a + '-' + (a+1).toString().slice(2) : (a-1) + '-' + a.toString().slice(2);
}

function cm(id) {
    document.getElementById(id).classList.remove('open');
}

function toast(msg) {
    var t = document.getElementById('toast-el');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 3000);
}

// ===== SUBIDA DE FOTOS =====
async function subirFoto(file, folder) {
    if (!file) return null;
    var ext = file.name.split('.').pop().toLowerCase();
    if (!['jpg','jpeg','png','webp'].includes(ext)) { toast('Formato no permitido'); return null; }
    if (file.size > 5*1024*1024) { toast('Max 5MB'); return null; }
    var fn = folder + '/' + Date.now() + '_' + Math.random().toString(36).substr(2,6) + '.' + ext;
    var r = await SB.storage.from('club-photos').upload(fn, file, {cacheControl:'3600', upsert:false});
    if (r.error) { toast('Error: ' + r.error.message); return null; }
    return SB_URL + '/storage/v1/object/public/club-photos/' + fn;
}

// ===== MODAL HELPER =====
// Inserta un modal en el DOM (si no existe ya)
function insertarModal(id, html) {
    var existing = document.getElementById(id);
    if (existing) existing.remove();
    document.getElementById('modals-container').insertAdjacentHTML('beforeend', html);
}

// ===== CHECKBOXES HELPER =====
// Genera checkboxes para posiciones
function posCheckboxes(prefix, selected) {
    selected = selected || [];
    return '<div class="chk-grid">' + POSICIONES.map(function(p) {
        var val = p.toLowerCase().replace(/ /g, '_');
        var checked = selected.includes(val) ? ' checked' : '';
        return '<label><input type="checkbox" class="' + prefix + '-chk" value="' + val + '"' + checked + '>' + p + '</label>';
    }).join('') + '</div>';
}

// Lee checkboxes marcados
function leerCheckboxes(className) {
    return Array.from(document.querySelectorAll('.' + className + ':checked')).map(function(c) { return c.value; });
}

// ===== NAVEGACIÓN =====
function nav(n, b) {
    document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    document.getElementById('sec-' + n).classList.add('active');
    if (b) b.classList.add('active');
    document.getElementById('main-tabs').style.display = 'flex';
}

function mostrarSeccion(id) {
    document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById(id).classList.add('active');
    document.getElementById('main-tabs').style.display = 'none';
}

// ===== STATS =====
function stats() {
    document.getElementById('s-eq').textContent = equipos.length;
    document.getElementById('s-jg').textContent = jugadoresClub.length;
    document.getElementById('s-mb').textContent = miembros.length;
    document.getElementById('tc-eq').textContent = equipos.length;
    document.getElementById('tc-jg').textContent = jugadoresClub.length;
    document.getElementById('tc-cg').textContent = cargos.length;
    document.getElementById('tc-mb').textContent = miembros.length;
}

// ===== INICIALIZACIÓN =====
async function init() {
    var r = localStorage.getItem('hub_user');
    if (!r) { document.getElementById('no-login').style.display = 'block'; return; }
    U = JSON.parse(r);
    document.getElementById('h-user').textContent = U.display_name || U.user_login || '?';

    var res = await SB.from('clubs').select('*').eq('wp_user_id', U.id).single();
    if (!res.data) { document.getElementById('no-login').style.display = 'block'; return; }

    CI = res.data.id;
    CD = res.data;
    document.getElementById('h-club').textContent = res.data.name || 'Mi Club';
    document.getElementById('main-content').style.display = 'block';

    // Cargar datos (cada módulo expone su función de carga)
    await cargarEquipos();
    await cargarCargos();
    await cargarMiembros();
    await cargarJugadoresClub();
    stats();

    // Inicializar secciones HTML (cada módulo genera su contenido)
    if (typeof initSecEquipos === 'function') initSecEquipos();
    if (typeof initSecJugadores === 'function') initSecJugadores();
    if (typeof initSecCargos === 'function') initSecCargos();
    if (typeof initSecMiembros === 'function') initSecMiembros();
    if (typeof initSecMedico === 'function') initSecMedico();
    if (typeof initSecSubgrupos === 'function') initSecSubgrupos();
}

init();
console.log('Club Admin Core cargado');
