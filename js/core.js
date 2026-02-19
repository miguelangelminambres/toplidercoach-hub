// ========== CORE.JS - TopLiderCoach HUB ==========
// Configuración, estado global, autenticación y navegación

// ========== CONFIGURACIÓN ==========
const API_BASE = 'https://toplidercoach.com/wp-json/toplider/v1';
const SUPABASE_URL = 'https://cqteodxyvavyroxeshoz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdGVvZHh5dmF2eXJveGVzaG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNzc2OTksImV4cCI6MjA4MDg1MzY5OX0.8sJC6twae2pnrf8NDVlOV2KnSOhBC1RrqWC0IiuE614';

let supabaseClient = null;
try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase configurado');
} catch (e) {
    console.error('Error Supabase:', e);
}

// ========== ESTADO GLOBAL ==========
let usuario = null;
let token = null;
let clubId = null;
let seasonId = null;
let clubData = null;

// Planificador
let ejercicioSeleccionado = null;
let paginaEjercicios = 1;
let sesion = { nombre: '', fecha: '', calentamiento: [], principal: [], enfriamiento: [] };
let calendarioMesSesiones = new Date().getMonth();
let calendarioAnioSesiones = new Date().getFullYear();
let calendarioMesPartidos = new Date().getMonth();
let calendarioAnioPartidos = new Date().getFullYear();
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// MatchStats
let filtroPartidos = 'todos';
let convocadosPartido = [];
let titularesPartido = [];
let plantillaPartido = [];

// Config
let jugadorEditando = null;

// Asistencia
let sesionAsistenciaActual = null;
let asistenciaMesActual = new Date().toISOString().slice(0, 7);

// Dashboard
let chartResultados = null;
let chartGoles = null;

// ========== SISTEMA DE MÓDULOS ==========
// Los módulos se registran aquí para desacoplar la navegación
const _moduleHandlers = {
    onModuleChange: {},
    onSubTabChange: {},
    onAppInit: []
};

function registrarModulo(modulo, callback) {
    _moduleHandlers.onModuleChange[modulo] = callback;
}

function registrarSubTab(modulo, subtab, callback) {
    _moduleHandlers.onSubTabChange[modulo + '-' + subtab] = callback;
}

function registrarInit(callback) {
    _moduleHandlers.onAppInit.push(callback);
}

// ========== AUTENTICACIÓN ==========
async function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    if (!username || !password) {
        errorDiv.textContent = 'Por favor, introduce usuario y contrasena';
        errorDiv.style.display = 'block';
        return;
    }

    // Validar longitud para prevenir abusos
    if (username.length > 100 || password.length > 200) {
        errorDiv.textContent = 'Datos de entrada demasiado largos';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        const response = await fetch(API_BASE + '/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            usuario = data.user;
            token = data.token;
            localStorage.setItem('hub_user', JSON.stringify(usuario));
            localStorage.setItem('hub_token', token);
            mostrarApp();
        } else {
            errorDiv.textContent = data.message || 'Error de autenticacion';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Error de conexion';
        errorDiv.style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('hub_user');
    localStorage.removeItem('hub_token');
    location.reload();
}

async function mostrarApp() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    document.getElementById('user-name').textContent = usuario.name;
    
    await inicializarClub();
    
    // Inicializar fecha de sesion
    const fechaInput = document.getElementById('sesion-fecha');
    if (fechaInput) fechaInput.value = new Date().toISOString().split('T')[0];
    
    // Ejecutar todas las funciones init registradas por los módulos
    for (let i = 0; i < _moduleHandlers.onAppInit.length; i++) {
        try {
            _moduleHandlers.onAppInit[i]();
        } catch(e) {
            console.error('Error en init de módulo:', e);
        }
    }
}

// ========== CLUB & TEMPORADA ==========
async function inicializarClub() {
    try {
        let { data: club, error } = await supabaseClient
            .from('clubs')
            .select('*')
            .eq('wp_user_id', usuario.id)
            .single();
        
        if (error && error.code === 'PGRST116') {
            const { data: nuevoClub } = await supabaseClient
                .from('clubs')
                .insert({
                    wp_user_id: usuario.id,
                    name: usuario.name || 'Mi Club',
                    team_format: '11',
                    max_players: 30
                })
                .select()
                .single();
            club = nuevoClub;
        }
        
        clubId = club.id;
        clubData = club;
        
        // Actualizar header
        document.getElementById('club-nombre-header').textContent = club.name;
        const inicial = club.name ? club.name.charAt(0).toUpperCase() : '?';
        document.getElementById('club-initial').textContent = inicial;
        
        if (club.logo_url) {
            document.getElementById('club-badge').innerHTML =
                '<img src="' + sanitizeURL(club.logo_url) + '" alt="">' +
                '<span>' + escapeHTML(club.name) + '</span>';
        }
        
        await cargarTemporadaActiva();
        
    } catch (error) {
        console.error('Error inicializando club:', error);
    }
}

async function cargarTemporadaActiva() {
    try {
        const { data: temporada, error } = await supabaseClient
            .from('seasons')
            .select('*')
            .eq('club_id', clubId)
            .eq('is_active', true)
            .single();
        
        if (error && error.code === 'PGRST116') {
            await crearTemporadaPorDefecto();
        } else if (!error) {
            seasonId = temporada.id;
        }
    } catch (error) {
        console.error('Error cargando temporada:', error);
    }
}

async function crearTemporadaPorDefecto() {
    const hoy = new Date();
    const mes = hoy.getMonth();
    const anio = hoy.getFullYear();
    
    let nombreTemp = mes >= 7 ? anio + '/' + (anio + 1) : (anio - 1) + '/' + anio;
    let inicioTemp = mes >= 7 ? anio + '-08-01' : (anio - 1) + '-08-01';
    let finTemp = mes >= 7 ? (anio + 1) + '-06-30' : anio + '-06-30';
    
    const { data: nuevaTemp } = await supabaseClient
        .from('seasons')
        .insert({
            club_id: clubId,
            name: nombreTemp,
            start_date: inicioTemp,
            end_date: finTemp,
            is_active: true
        })
        .select()
        .single();
    
    seasonId = nuevaTemp.id;
}

// ========== NAVEGACIÓN ==========
function cambiarModulo(modulo, tab) {
    document.querySelectorAll('.main-tab').forEach(function(t) { t.classList.remove('active'); });
    tab.classList.add('active');
    
    document.querySelectorAll('.vista-modulo').forEach(function(v) { v.classList.remove('active'); });
    document.getElementById('modulo-' + modulo).classList.add('active');
    
    // Ejecutar handler registrado por el módulo
    if (_moduleHandlers.onModuleChange[modulo]) {
        try {
            _moduleHandlers.onModuleChange[modulo]();
        } catch(e) {
            console.error('Error al cambiar a módulo ' + modulo + ':', e);
        }
    }
}

function cambiarSubTab(modulo, subtab, btn) {
    var container = document.getElementById('modulo-' + modulo);
    container.querySelectorAll('.sub-tab').forEach(function(t) { t.classList.remove('active'); });
    btn.classList.add('active');
    
    container.querySelectorAll('.vista-contenido').forEach(function(v) { v.classList.remove('active'); });
    document.getElementById(modulo + '-' + subtab).classList.add('active');
    
    // Ejecutar handler registrado por el módulo
    var key = modulo + '-' + subtab;
    if (_moduleHandlers.onSubTabChange[key]) {
        try {
            _moduleHandlers.onSubTabChange[key]();
        } catch(e) {
            console.error('Error al cambiar a subtab ' + key + ':', e);
        }
    }
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function() {
    // Restaurar sesión de forma segura (valida expiración del token)
    var restored = secureSessionRestore();

    if (restored) {
        usuario = restored.user;
        token = restored.token;
        mostrarApp();
    }

    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
});
