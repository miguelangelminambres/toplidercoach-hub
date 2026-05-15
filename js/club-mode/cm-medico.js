// ============================================================
// CM-MEDICO.JS · Panel Médico Deportivo
// TopLiderCoach HUB · Club Mode · Fase 1.1 MVP
// ============================================================
// Despacho privado del médico. Solo visible para roles médicos.
// Prefijo: cmMed (todas las variables y funciones)
// ============================================================

// ========== ESTADO DEL MÓDULO ==========
var cmMedJugadorActual = null;
var cmMedLesionActual = null;
var cmMedTabActiva = 'antecedentes';
var cmMedOsiicsCatalog = [];
var cmMedBodyZones = [];
var cmMedCatalogosReady = false;

// ========== FILTROS ==========
var cmMedFiltroEquipo = 'all';
var cmMedFiltroEstado = 'all';
var cmMedJugadoresData = [];
var cmMedTemporadas = [];
var cmMedEquipos = [];


// ========== INICIALIZACIÓN ==========
async function cmMedInit(containerId) {
    var container = document.getElementById(containerId);
    if (!container) { console.error('cmMedInit: contenedor no encontrado:', containerId); return; }
    if (!cmMedCatalogosReady) { await cmMedCargarCatalogos(); }
    cmMedRenderPanel(container);
    await cmMedCargarJugadores();
}


async function cmMedCargarCatalogos() {
    try {
        var results = await Promise.all([
            supabaseClient.from('cm_med_osiics_codes').select('*').order('code'),
            supabaseClient.from('cm_med_body_zones').select('*').order('body_side, body_area, zone_name_es')
        ]);
        cmMedOsiicsCatalog = results[0].data || [];
        cmMedBodyZones = results[1].data || [];
        cmMedCatalogosReady = true;
    } catch (e) { console.error('Error cargando catalogos medicos:', e); }
}


// ========== RENDER PRINCIPAL ==========
function cmMedRenderPanel(container) {
    container.innerHTML =
    '<style>' +
        '.cmmed-panel{padding:20px;max-width:1200px;margin:0 auto}' +
        '.cmmed-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px}' +
        '.cmmed-header h2{margin:0;color:#e2e8f0;font-size:20px}' +
        '.cmmed-filtro-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}' +
        '.cmmed-filtro-bar label{color:#94a3b8;font-size:12px;font-weight:600}' +
        '.cmmed-filtro-bar select{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:6px;font-size:13px;font-family:inherit;cursor:pointer}' +
        '.cmmed-stats-bar{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}' +
        '.cmmed-stat{background:#1e293b;border-radius:10px;padding:14px 18px;flex:1;min-width:110px;text-align:center;border:2px solid #334155;cursor:pointer;transition:all .2s}' +
        '.cmmed-stat:hover{transform:translateY(-2px)}' +
        '.cmmed-stat.active-filter{border-color:#3b82f6;box-shadow:0 0 12px rgba(59,130,246,.3)}' +
        '.cmmed-stat .num{font-size:28px;font-weight:700}' +
        '.cmmed-stat .label{font-size:12px;color:#94a3b8;margin-top:2px}' +
        '.cmmed-stat.green .num{color:#22c55e}.cmmed-stat.amber .num{color:#f59e0b}.cmmed-stat.red .num{color:#ef4444}.cmmed-stat.total .num{color:#60a5fa}' +
        '.cmmed-player-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}' +
        '.cmmed-player-card{background:#1e293b;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;border:1px solid #334155;transition:all .2s}' +
        '.cmmed-player-card:hover{border-color:#3b82f6;transform:translateY(-1px)}' +
        '.cmmed-player-avatar{width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:#e2e8f0;background:#334155;overflow:hidden}' +
        '.cmmed-player-avatar img{width:100%;height:100%;object-fit:cover}' +
        '.cmmed-semaforo{width:12px;height:12px;border-radius:50%;flex-shrink:0}' +
        '.cmmed-semaforo.green{background:#22c55e;box-shadow:0 0 6px #22c55e55}' +
        '.cmmed-semaforo.amber{background:#f59e0b;box-shadow:0 0 6px #f59e0b55}' +
        '.cmmed-semaforo.red{background:#ef4444;box-shadow:0 0 6px #ef444455}' +
        '.cmmed-semaforo.unknown{background:#475569}' +
        '.cmmed-player-info{flex:1;min-width:0}' +
        '.cmmed-player-name{color:#e2e8f0;font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
        '.cmmed-player-meta{color:#94a3b8;font-size:11px;margin-top:1px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}' +
        '.cmmed-player-team-tag{background:#1e3a5f;color:#60a5fa;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:600;white-space:nowrap}' +
        '.cmmed-player-injury-tag{font-size:10px;color:#fbbf24;background:#422006;padding:1px 6px;border-radius:3px;white-space:nowrap}' +
        '.cmmed-player-dorsal{color:#64748b;font-size:13px;font-weight:600;min-width:24px;text-align:center}' +
        '.cmmed-ficha-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:9000;display:flex;justify-content:center;align-items:flex-start;padding:30px;overflow-y:auto}' +
        '.cmmed-ficha{background:#0f172a;border-radius:14px;width:100%;max-width:900px;max-height:90vh;overflow-y:auto;border:1px solid #334155}' +
        '.cmmed-ficha-header{display:flex;justify-content:space-between;align-items:center;padding:18px 24px;border-bottom:1px solid #1e293b;position:sticky;top:0;background:#0f172a;z-index:10;border-radius:14px 14px 0 0}' +
        '.cmmed-ficha-header h3{margin:0;color:#e2e8f0;font-size:18px;display:flex;align-items:center;gap:10px}' +
        '.cmmed-ficha-close{background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;padding:4px 8px}' +
        '.cmmed-ficha-close:hover{color:#ef4444}' +
        '.cmmed-tabs{display:flex;gap:0;border-bottom:1px solid #1e293b;padding:0 24px;background:#0f172a;position:sticky;top:60px;z-index:9}' +
        '.cmmed-tab{padding:10px 18px;color:#94a3b8;font-size:13px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;background:none;border-top:none;border-left:none;border-right:none}' +
        '.cmmed-tab:hover{color:#e2e8f0}.cmmed-tab.active{color:#3b82f6;border-bottom-color:#3b82f6}' +
        '.cmmed-tab-content{padding:20px 24px;display:none}.cmmed-tab-content.active{display:block}' +
        '.cmmed-form-group{margin-bottom:14px}' +
        '.cmmed-form-group label{display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;font-weight:600}' +
        '.cmmed-form-group input,.cmmed-form-group select,.cmmed-form-group textarea{width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;font-family:inherit;box-sizing:border-box}' +
        '.cmmed-form-group textarea{min-height:60px;resize:vertical}' +
        '.cmmed-form-group input:focus,.cmmed-form-group select:focus,.cmmed-form-group textarea:focus{border-color:#3b82f6;outline:none}' +
        '.cmmed-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
        '.cmmed-form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}' +
        '.cmmed-btn{padding:8px 18px;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .2s}' +
        '.cmmed-btn-primary{background:#3b82f6;color:#fff}.cmmed-btn-primary:hover{background:#2563eb}' +
        '.cmmed-btn-success{background:#059669;color:#fff}.cmmed-btn-success:hover{background:#047857}' +
        '.cmmed-btn-danger{background:#dc2626;color:#fff}.cmmed-btn-danger:hover{background:#b91c1c}' +
        '.cmmed-btn-secondary{background:#334155;color:#e2e8f0}.cmmed-btn-secondary:hover{background:#475569}' +
        '.cmmed-btn-sm{padding:5px 12px;font-size:12px}' +
        '.cmmed-injury-card{background:#1e293b;border-radius:8px;padding:14px;margin-bottom:10px;border-left:4px solid #475569;cursor:pointer;transition:all .2s}' +
        '.cmmed-injury-card:hover{border-left-color:#3b82f6}' +
        '.cmmed-injury-card.active-injury{border-left-color:#ef4444}' +
        '.cmmed-injury-card.recovering{border-left-color:#f59e0b}' +
        '.cmmed-injury-card.discharged{border-left-color:#22c55e;opacity:.7}' +
        '.cmmed-injury-title{color:#e2e8f0;font-weight:600;font-size:14px}' +
        '.cmmed-injury-meta{color:#94a3b8;font-size:12px;margin-top:4px}' +
        '.cmmed-injury-status{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}' +
        '.cmmed-injury-status.st-active{background:#450a0a;color:#fca5a5}' +
        '.cmmed-injury-status.st-recovering{background:#451a03;color:#fcd34d}' +
        '.cmmed-injury-status.st-rtp{background:#042f2e;color:#5eead4}' +
        '.cmmed-injury-status.st-discharged{background:#052e16;color:#86efac}' +
        '.cmmed-soap-card{background:#1e293b;border-radius:8px;padding:14px;margin-bottom:10px}' +
        '.cmmed-soap-date{color:#60a5fa;font-weight:600;font-size:13px;margin-bottom:8px}' +
        '.cmmed-soap-section{margin-bottom:6px}' +
        '.cmmed-soap-section strong{color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.5px}' +
        '.cmmed-soap-section p{color:#e2e8f0;font-size:13px;margin:2px 0 0 0}' +
        '.cmmed-consent-row{display:flex;justify-content:space-between;align-items:center;padding:14px;background:#1e293b;border-radius:8px;margin-bottom:8px}' +
        '.cmmed-consent-info{flex:1}.cmmed-consent-type{color:#e2e8f0;font-weight:600;font-size:14px}' +
        '.cmmed-consent-desc{color:#94a3b8;font-size:12px;margin-top:2px}' +
        '.cmmed-toggle{width:44px;height:24px;border-radius:12px;background:#475569;position:relative;cursor:pointer;transition:background .3s;flex-shrink:0;border:none}' +
        '.cmmed-toggle.on{background:#22c55e}' +
        '.cmmed-toggle::after{content:"";width:18px;height:18px;background:#fff;border-radius:50%;position:absolute;top:3px;left:3px;transition:transform .3s}' +
        '.cmmed-toggle.on::after{transform:translateX(20px)}' +
        '.cmmed-semaforo-selector{display:flex;gap:8px;margin:12px 0}' +
        '.cmmed-semaforo-btn{padding:8px 16px;border-radius:6px;border:2px solid transparent;cursor:pointer;font-size:13px;font-weight:600;transition:all .2s}' +
        '.cmmed-semaforo-btn.btn-green{background:#052e16;color:#22c55e;border-color:#166534}' +
        '.cmmed-semaforo-btn.btn-green.selected{background:#22c55e;color:#052e16}' +
        '.cmmed-semaforo-btn.btn-amber{background:#451a03;color:#f59e0b;border-color:#92400e}' +
        '.cmmed-semaforo-btn.btn-amber.selected{background:#f59e0b;color:#451a03}' +
        '.cmmed-semaforo-btn.btn-red{background:#450a0a;color:#ef4444;border-color:#991b1b}' +
        '.cmmed-semaforo-btn.btn-red.selected{background:#ef4444;color:#450a0a}' +
        '.cmmed-empty{text-align:center;padding:40px 20px;color:#64748b}' +
        '.cmmed-empty .icon{font-size:40px;margin-bottom:10px}.cmmed-empty p{font-size:14px}' +
        '.cmmed-filter-count{color:#64748b;font-size:12px;margin-bottom:10px}' +
        '@media(max-width:640px){.cmmed-form-row,.cmmed-form-row-3{grid-template-columns:1fr}.cmmed-player-grid{grid-template-columns:1fr}.cmmed-tabs{overflow-x:auto}.cmmed-ficha-overlay{padding:10px}.cmmed-stats-bar{gap:8px}.cmmed-stat{min-width:70px;padding:10px 8px}.cmmed-stat .num{font-size:22px}}' +
    '</style>' +
    '<div class="cmmed-panel">' +
        '<div class="cmmed-header">' +
            '<h2>Panel Medico</h2>' +
            '<div style="display:flex;gap:8px">' +
                '<button class="cmmed-btn cmmed-btn-primary cmmed-btn-sm" id="cmmed-btn-jugadores" onclick="cmMedVistaJugadores()" style="opacity:0.5">Jugadores</button>' +
                '<button class="cmmed-btn cmmed-btn-secondary cmmed-btn-sm" id="cmmed-btn-dashboard" onclick="cmMedVistaDashboard()">Dashboard</button>' +
            '</div>' +
            '<div class="cmmed-filtro-bar">' +
                '<label>Equipo:</label>' +
                '<select id="cmmed-filtro-equipo" onchange="cmMedFiltrarEquipo(this.value)"><option value="all">Todos los equipos</option></select>' +
            '</div>' +
        '</div>' +
        '<div class="cmmed-stats-bar" id="cmmed-stats-bar">' +
            '<div class="cmmed-stat total active-filter" onclick="cmMedFiltrarEstado(\'all\',this)"><div class="num" id="cmmed-stat-total">-</div><div class="label">Plantilla</div></div>' +
            '<div class="cmmed-stat green" onclick="cmMedFiltrarEstado(\'green\',this)"><div class="num" id="cmmed-stat-green">-</div><div class="label">Disponibles</div></div>' +
            '<div class="cmmed-stat amber" onclick="cmMedFiltrarEstado(\'amber\',this)"><div class="num" id="cmmed-stat-amber">-</div><div class="label">Precaucion</div></div>' +
            '<div class="cmmed-stat red" onclick="cmMedFiltrarEstado(\'red\',this)"><div class="num" id="cmmed-stat-red">-</div><div class="label">Lesionados</div></div>' +
        '</div>' +
        '<div class="cmmed-filter-count" id="cmmed-filter-count"></div>' +
        '<div id="cmmed-dashboard" style="display:none"></div>' +
        '<div class="cmmed-player-grid" id="cmmed-player-grid"><div class="cmmed-empty"><div class="icon">⏳</div><p>Cargando jugadores...</p></div></div>' +
    '</div>' +
    '<div class="cmmed-ficha-overlay" id="cmmed-ficha-overlay" style="display:none;" onclick="if(event.target===this)cmMedCerrarFicha()">' +
        '<div class="cmmed-ficha" id="cmmed-ficha"></div>' +
    '</div>';
}


// ========== CARGAR JUGADORES (TODOS LOS EQUIPOS) ==========
async function cmMedCargarJugadores() {
    var grid = document.getElementById('cmmed-player-grid');
    if (!grid) return;

    try {
        // 1. Cargar equipos del club
        var teamsRes = await supabaseClient.from('club_teams').select('id, name, category').eq('club_id', clubId).eq('active', true).order('category').order('name');
        cmMedEquipos = teamsRes.data || [];

        // 2. Cargar todas las temporadas activas
        var seasonsRes = await supabaseClient.from('seasons').select('id, name').eq('club_id', clubId).eq('is_active', true);
        cmMedTemporadas = seasonsRes.data || [];

        if (cmMedTemporadas.length === 0) {
            grid.innerHTML = '<div class="cmmed-empty"><div class="icon">👥</div><p>No hay temporadas activas en este club</p></div>';
            return;
        }

        // Poblar filtro de equipos (con club_teams, no seasons)
        var selectEquipo = document.getElementById('cmmed-filtro-equipo');
        if (selectEquipo) {
            var totalEquipos = cmMedEquipos.length;
            var optsHtml = '<option value="all">Todos los equipos (' + totalEquipos + ')</option>';
            cmMedEquipos.forEach(function(t) {
                var cat = t.category ? ' (' + t.category + ')' : '';
                optsHtml += '<option value="' + t.id + '">' + t.name + cat + '</option>';
            });
            optsHtml += '<option value="sin_equipo">Sin equipo asignado</option>';
            selectEquipo.innerHTML = optsHtml;
            if (cmMedFiltroEquipo !== 'all') selectEquipo.value = cmMedFiltroEquipo;
        }

        // 3. Cargar todos los jugadores con team_id
        var seasonIds = cmMedTemporadas.map(function(s) { return s.id; });
        var spRes = await supabaseClient.from('season_players').select('shirt_number, player_id, season_id, team_id, players(id, name, position, photo_url)').in('season_id', seasonIds).order('shirt_number');
        var spData = spRes.data || [];

        if (spData.length === 0) {
            grid.innerHTML = '<div class="cmmed-empty"><div class="icon">👥</div><p>No hay jugadores en las temporadas activas</p></div>';
            return;
        }

        // Mapa team_id -> nombre del equipo
        var teamNames = {};
        cmMedEquipos.forEach(function(t) { teamNames[t.id] = t.name; });

        // 4. Disponibilidad
        var availRes = await supabaseClient.from('club_player_availability').select('player_id, status').eq('club_id', clubId);
        var availMap = {};
        (availRes.data || []).forEach(function(a) { availMap[a.player_id] = a.status; });

        // 5. Lesiones activas
        var injRes = await supabaseClient.from('cm_med_injuries').select('player_id, body_zone, status, cm_med_body_zones(zone_name_es)').eq('club_id', clubId).in('status', ['active', 'recovering']).eq('archived', false);
        var injMap = {};
        (injRes.data || []).forEach(function(inj) {
            if (!injMap[inj.player_id]) injMap[inj.player_id] = [];
            injMap[inj.player_id].push(inj);
        });

        // 6. Construir array deduplicado
        var vistos = {};
        cmMedJugadoresData = [];

        spData.forEach(function(sp) {
            var p = sp.players;
            if (!p) return;

            if (vistos[p.id]) {
                var existing = cmMedJugadoresData.find(function(j) { return j.playerId === p.id; });
                if (existing && sp.team_id && existing.teamIds.indexOf(sp.team_id) === -1) {
                    existing.teamIds.push(sp.team_id);
                    existing.teamNames.push(teamNames[sp.team_id] || 'Sin equipo');
                }
                return;
            }
            vistos[p.id] = true;

            var injuries = injMap[p.id] || [];
            var tIds = sp.team_id ? [sp.team_id] : [];
            var tNames = sp.team_id ? [teamNames[sp.team_id] || 'Sin equipo'] : ['Sin equipo'];

            cmMedJugadoresData.push({
                playerId: p.id,
                name: p.name,
                position: p.position || '',
                photoUrl: p.photo_url || '',
                dorsal: sp.shirt_number || '',
                teamIds: tIds,
                teamNames: tNames,
                avail: availMap[p.id] || 'unknown',
                injuries: injuries,
                activeInjuryZone: injuries.length > 0 && injuries[0].cm_med_body_zones ? injuries[0].cm_med_body_zones.zone_name_es : null
            });
        });

        cmMedRenderJugadores();

    } catch (e) {
        console.error('cmMedCargarJugadores:', e);
        grid.innerHTML = '<div class="cmmed-empty"><div class="icon">⚠️</div><p>Error al cargar jugadores</p></div>';
    }
}

// ========== RENDERIZAR CON FILTROS ==========
function cmMedRenderJugadores() {
    var grid = document.getElementById('cmmed-player-grid');
    if (!grid) return;

    var filtrados = cmMedJugadoresData.filter(function(j) {
        if (cmMedFiltroEquipo === 'sin_equipo' && j.teamIds.length > 0) return false;
        if (cmMedFiltroEquipo !== 'all' && cmMedFiltroEquipo !== 'sin_equipo' && j.teamIds.indexOf(cmMedFiltroEquipo) === -1) return false;
        if (cmMedFiltroEstado !== 'all' && j.avail !== cmMedFiltroEstado) return false;
        return true;
    });

    // Stats (sobre filtro de equipo, no de estado)
    var datosEquipo = cmMedJugadoresData.filter(function(j) {
        if (cmMedFiltroEquipo === 'sin_equipo' && j.teamIds.length > 0) return false;
        if (cmMedFiltroEquipo !== 'all' && cmMedFiltroEquipo !== 'sin_equipo' && j.teamIds.indexOf(cmMedFiltroEquipo) === -1) return false;
        return true;
    });

    var stats = { total: datosEquipo.length, green: 0, amber: 0, red: 0 };
    datosEquipo.forEach(function(j) {
        if (j.avail === 'green') stats.green++;
        else if (j.avail === 'amber') stats.amber++;
        else if (j.avail === 'red') stats.red++;
    });

    document.getElementById('cmmed-stat-total').textContent = stats.total;
    document.getElementById('cmmed-stat-green').textContent = stats.green;
    document.getElementById('cmmed-stat-amber').textContent = stats.amber;
    document.getElementById('cmmed-stat-red').textContent = stats.red;

    // Texto filtro
    var countEl = document.getElementById('cmmed-filter-count');
    if (cmMedFiltroEstado !== 'all') {
        var labels = { green: 'disponibles', amber: 'en precaucion', red: 'lesionados', unknown: 'sin estado' };
        countEl.textContent = 'Mostrando ' + filtrados.length + ' jugadores ' + (labels[cmMedFiltroEstado] || '');
    } else { countEl.textContent = ''; }

    if (filtrados.length === 0) {
        grid.innerHTML = '<div class="cmmed-empty"><div class="icon">🔍</div><p>No hay jugadores con este filtro</p></div>';
        return;
    }

    var html = '';
    filtrados.forEach(function(j) {
        var avatarContent = '';
        if (j.photoUrl) {
            avatarContent = '<img src="' + j.photoUrl + '" alt="' + j.name + '">';
        } else {
            var parts = j.name.split(' ');
            var initials = parts[0] ? parts[0][0] : '';
            if (parts.length > 1) initials += parts[parts.length - 1][0];
            avatarContent = initials.toUpperCase();
        }

        var teamTag = j.teamNames.map(function(t) { return '<span class="cmmed-player-team-tag">' + t + '</span>'; }).join(' ');
        var injuryTag = j.activeInjuryZone ? '<span class="cmmed-player-injury-tag">' + j.activeInjuryZone + '</span>' : '';

        html += '<div class="cmmed-player-card" onclick="cmMedAbrirFicha(\'' + j.playerId + '\',\'' + j.name.replace(/'/g, "\\'") + '\',\'' + (j.photoUrl || '').replace(/'/g, "\\'") + '\')">' +
            '<div class="cmmed-player-dorsal">' + j.dorsal + '</div>' +
            '<div class="cmmed-player-avatar">' + avatarContent + '</div>' +
            '<div class="cmmed-semaforo ' + j.avail + '"></div>' +
            '<div class="cmmed-player-info">' +
                '<div class="cmmed-player-name">' + j.name + '</div>' +
                '<div class="cmmed-player-meta"><span>' + j.position + '</span>' + teamTag + injuryTag + '</div>' +
            '</div></div>';
    });
    grid.innerHTML = html;
}


// ========== FILTROS ==========
function cmMedFiltrarEquipo(seasonId) { cmMedFiltroEquipo = seasonId; cmMedRenderJugadores(); }

function cmMedFiltrarEstado(estado, btn) {
    cmMedFiltroEstado = estado;
    document.querySelectorAll('.cmmed-stat').forEach(function(s) { s.classList.remove('active-filter'); });
    if (btn) btn.classList.add('active-filter');
    cmMedRenderJugadores();
}


// ========== ABRIR FICHA MÉDICA ==========
async function cmMedAbrirFicha(playerId, playerName, photoUrl) {
    cmMedJugadorActual = playerId;
    cmMedTabActiva = 'antecedentes';
    cmMedLesionActual = null;

    var ficha = document.getElementById('cmmed-ficha');
    var overlay = document.getElementById('cmmed-ficha-overlay');

    var avatarHtml = '';
    if (photoUrl) { avatarHtml = '<div class="cmmed-player-avatar" style="width:36px;height:36px;"><img src="' + photoUrl + '"></div>'; }

    ficha.innerHTML =
        '<div class="cmmed-ficha-header"><h3>' + avatarHtml + playerName + '</h3><button class="cmmed-ficha-close" onclick="cmMedCerrarFicha()">✕</button></div>' +
        '<div class="cmmed-tabs">' +
            '<button class="cmmed-btn cmmed-btn-secondary cmmed-btn-sm" onclick="cmMedPDFHistorial(\'' + playerId + '\',\'' + playerName.replace(/'/g, "\\'") + '\')" style="margin-right:auto">PDF Historial</button>' +
            '<button class="cmmed-tab active" onclick="cmMedCambiarTab(\'antecedentes\',this)">Antecedentes</button>' +
            '<button class="cmmed-tab" onclick="cmMedCambiarTab(\'lesiones\',this)">Lesiones</button>' +
            '<button class="cmmed-tab" onclick="cmMedCambiarTab(\'sesiones\',this)">Sesiones</button>' +
            '<button class="cmmed-tab" onclick="cmMedCambiarTab(\'consentimientos\',this)">RGPD</button>' +
        '</div>' +
        '<div class="cmmed-tab-content active" id="cmmed-tab-antecedentes"><div class="cmmed-empty"><div class="icon">⏳</div><p>Cargando...</p></div></div>' +
        '<div class="cmmed-tab-content" id="cmmed-tab-lesiones"></div>' +
        '<div class="cmmed-tab-content" id="cmmed-tab-sesiones"></div>' +
        '<div class="cmmed-tab-content" id="cmmed-tab-consentimientos"></div>';

    overlay.style.display = 'flex';
    await cmMedCargarAntecedentes(playerId);
    cmMedRegistrarAudit('SELECT', 'cm_med_player_record', playerId, 'Abrio ficha medica');
}

function cmMedCerrarFicha() {
    document.getElementById('cmmed-ficha-overlay').style.display = 'none';
    cmMedJugadorActual = null;
    cmMedLesionActual = null;
    cmMedCargarJugadores();
}

function cmMedCambiarTab(tab, btn) {
    cmMedTabActiva = tab;
    document.querySelectorAll('.cmmed-tab').forEach(function(t) { t.classList.remove('active'); });
    btn.classList.add('active');
    document.querySelectorAll('.cmmed-tab-content').forEach(function(c) { c.classList.remove('active'); });
    document.getElementById('cmmed-tab-' + tab).classList.add('active');
    var pid = cmMedJugadorActual;
    if (tab === 'antecedentes') cmMedCargarAntecedentes(pid);
    if (tab === 'lesiones') cmMedCargarLesiones(pid);
    if (tab === 'sesiones') cmMedCargarListaSesiones(pid);
    if (tab === 'consentimientos') cmMedCargarConsentimientos(pid);
}


// ========== ANTECEDENTES ==========
async function cmMedCargarAntecedentes(playerId) {
    var container = document.getElementById('cmmed-tab-antecedentes');
    var res = await supabaseClient.from('cm_med_player_record').select('*').eq('club_id', clubId).eq('player_id', playerId).eq('archived', false).maybeSingle();
    var r = res.data || {};

    container.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h4 style="margin:0;color:#e2e8f0">Ficha Medica</h4><button class="cmmed-btn cmmed-btn-primary" onclick="cmMedGuardarAntecedentes()">Guardar</button></div>' +
        '<div class="cmmed-form-row"><div class="cmmed-form-group"><label>Grupo sanguineo</label><select id="cmmed-blood-type"><option value="">-- Seleccionar --</option>' +
        ['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(function(t) { return '<option value="'+t+'"'+(r.blood_type===t?' selected':'')+'>'+t+'</option>'; }).join('') +
        '</select></div><div class="cmmed-form-group"><label>Lateralidad</label><select id="cmmed-laterality"><option value="right"'+(r.laterality==='right'?' selected':'')+'>Diestro</option><option value="left"'+(r.laterality==='left'?' selected':'')+'>Zurdo</option><option value="ambidextrous"'+(r.laterality==='ambidextrous'?' selected':'')+'>Ambidiestro</option></select></div></div>' +
        '<div class="cmmed-form-row"><div class="cmmed-form-group"><label>Altura (cm)</label><input type="number" id="cmmed-height" value="'+(r.height_cm||'')+'" placeholder="175" step="0.1"></div><div class="cmmed-form-group"><label>Peso (kg)</label><input type="number" id="cmmed-weight" value="'+(r.weight_kg||'')+'" placeholder="72" step="0.1"></div></div>' +
        '<div class="cmmed-form-group"><label>Alergias</label><textarea id="cmmed-allergies" placeholder="Alergias conocidas...">'+(r.allergies||'')+'</textarea></div>' +
        '<div class="cmmed-form-group"><label>Enfermedades cronicas</label><textarea id="cmmed-chronic" placeholder="Asma, diabetes, etc...">'+(r.chronic_conditions||'')+'</textarea></div>' +
        '<div class="cmmed-form-group"><label>Medicacion habitual</label><textarea id="cmmed-medications" placeholder="Medicamentos que toma regularmente...">'+(r.medications||'')+'</textarea></div>' +
        '<div class="cmmed-form-group"><label>Cirugias previas</label><textarea id="cmmed-surgical" placeholder="Operaciones anteriores...">'+(r.surgical_history||'')+'</textarea></div>' +
        '<div class="cmmed-form-group"><label>Antecedentes familiares relevantes</label><textarea id="cmmed-family" placeholder="Cardiopatias, muerte subita, etc...">'+(r.family_history||'')+'</textarea></div>' +
        '<div class="cmmed-form-group"><label>Vacunaciones</label><textarea id="cmmed-vaccines" placeholder="Estado vacunal...">'+(r.vaccination_notes||'')+'</textarea></div>' +
        '<h4 style="color:#e2e8f0;margin-top:20px">Reconocimientos medicos</h4>' +
        '<div class="cmmed-form-row-3"><div class="cmmed-form-group"><label>Ultimo ECG</label><input type="date" id="cmmed-ecg" value="'+(r.last_ecg_date||'')+'"></div><div class="cmmed-form-group"><label>Ultima prueba esfuerzo</label><input type="date" id="cmmed-stress" value="'+(r.last_stress_test||'')+'"></div><div class="cmmed-form-group"><label>Ultimo analisis sangre</label><input type="date" id="cmmed-blood" value="'+(r.last_blood_test||'')+'"></div></div>' +
        '<div class="cmmed-form-group"><label>Vencimiento certificado medico anual</label><input type="date" id="cmmed-cert" value="'+(r.medical_certificate_expiry||'')+'"></div>' +
        '<div class="cmmed-form-group"><label>Notas generales</label><textarea id="cmmed-notes" placeholder="Observaciones del medico...">'+(r.notes||'')+'</textarea></div>';
}

async function cmMedGuardarAntecedentes() {
    var playerId = cmMedJugadorActual;
    if (!playerId) return;
    var record = {
        club_id: clubId, player_id: playerId,
        blood_type: document.getElementById('cmmed-blood-type').value || null,
        laterality: document.getElementById('cmmed-laterality').value,
        height_cm: parseFloat(document.getElementById('cmmed-height').value) || null,
        weight_kg: parseFloat(document.getElementById('cmmed-weight').value) || null,
        allergies: document.getElementById('cmmed-allergies').value.trim() || null,
        chronic_conditions: document.getElementById('cmmed-chronic').value.trim() || null,
        medications: document.getElementById('cmmed-medications').value.trim() || null,
        surgical_history: document.getElementById('cmmed-surgical').value.trim() || null,
        family_history: document.getElementById('cmmed-family').value.trim() || null,
        vaccination_notes: document.getElementById('cmmed-vaccines').value.trim() || null,
        last_ecg_date: document.getElementById('cmmed-ecg').value || null,
        last_stress_test: document.getElementById('cmmed-stress').value || null,
        last_blood_test: document.getElementById('cmmed-blood').value || null,
        medical_certificate_expiry: document.getElementById('cmmed-cert').value || null,
        notes: document.getElementById('cmmed-notes').value.trim() || null
    };
    var res = await supabaseClient.from('cm_med_player_record').upsert(record, { onConflict: 'club_id,player_id' });
    if (res.error) { showToast('Error al guardar: ' + res.error.message, 'error'); return; }
    showToast('Ficha medica guardada');
    cmMedRegistrarAudit('UPDATE', 'cm_med_player_record', playerId, 'Actualizo ficha medica');
}


// ========== LESIONES ==========
async function cmMedCargarLesiones(playerId) {
    var container = document.getElementById('cmmed-tab-lesiones');
    var availRes = await supabaseClient.from('club_player_availability').select('status, notes').eq('club_id', clubId).eq('player_id', playerId).maybeSingle();
    var currentStatus = availRes.data ? availRes.data.status : 'unknown';

    var injRes = await supabaseClient.from('cm_med_injuries').select('*, cm_med_osiics_codes(description_es), cm_med_body_zones(zone_name_es)').eq('club_id', clubId).eq('player_id', playerId).eq('archived', false).order('injury_date', { ascending: false });
    var injuries = injRes.data || [];

    var statusLabels = { active: 'Activa', recovering: 'En recuperacion', rtp: 'Return-to-Play', discharged: 'Alta medica' };
    var lesionesHtml = '';
    if (injuries.length === 0) {
        lesionesHtml = '<div class="cmmed-empty"><div class="icon">✅</div><p>Sin lesiones registradas</p></div>';
    } else {
        injuries.forEach(function(inj) {
            var fecha = new Date(inj.injury_date + 'T12:00:00').toLocaleDateString('es-ES');
            var cardClass = inj.status === 'active' ? 'active-injury' : inj.status === 'recovering' ? 'recovering' : inj.status === 'discharged' ? 'discharged' : '';
            lesionesHtml += '<div class="cmmed-injury-card ' + cardClass + '" onclick="cmMedVerLesion(\'' + inj.id + '\')"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div class="cmmed-injury-title">' + (inj.cm_med_body_zones ? inj.cm_med_body_zones.zone_name_es : 'Zona no especificada') + '</div><div class="cmmed-injury-meta">' + fecha + ' · ' + (inj.cm_med_osiics_codes ? inj.cm_med_osiics_codes.description_es : inj.description || 'Sin diagnostico') + (inj.mechanism ? ' · ' + cmMedMecanismoLabel(inj.mechanism) : '') + '</div></div><span class="cmmed-injury-status st-' + inj.status + '">' + (statusLabels[inj.status] || inj.status) + '</span></div>' + (inj.actual_days_lost ? '<div class="cmmed-injury-meta" style="margin-top:4px">Dias perdidos: ' + inj.actual_days_lost + '</div>' : '') + '</div>';
        });
    }

    container.innerHTML =
        '<div style="margin-bottom:20px;padding:14px;background:#1e293b;border-radius:10px"><label style="color:#94a3b8;font-size:12px;font-weight:600;display:block;margin-bottom:8px">Disponibilidad actual</label><div class="cmmed-semaforo-selector">' +
        '<button class="cmmed-semaforo-btn btn-green'+(currentStatus==='green'?' selected':'')+'" onclick="cmMedCambiarDisponibilidad(\''+playerId+'\',\'green\',this)">Disponible</button>' +
        '<button class="cmmed-semaforo-btn btn-amber'+(currentStatus==='amber'?' selected':'')+'" onclick="cmMedCambiarDisponibilidad(\''+playerId+'\',\'amber\',this)">Precaucion</button>' +
        '<button class="cmmed-semaforo-btn btn-red'+(currentStatus==='red'?' selected':'')+'" onclick="cmMedCambiarDisponibilidad(\''+playerId+'\',\'red\',this)">Lesionado</button>' +
        '</div></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h4 style="margin:0;color:#e2e8f0">Historial de lesiones</h4><button class="cmmed-btn cmmed-btn-danger cmmed-btn-sm" onclick="cmMedMostrarFormLesion()">+ Nueva lesion</button></div>' +
        '<div id="cmmed-form-lesion-container"></div><div id="cmmed-lesiones-lista">' + lesionesHtml + '</div>';
}

function cmMedMecanismoLabel(m) { var l = { contact: 'Contacto', non_contact: 'Sin contacto', overuse: 'Sobrecarga', illness: 'Enfermedad' }; return l[m] || m; }
// ========== BODY MAP INTERACTIVO ==========
var cmMedBodyChart = null;
var cmMedBodyChartView = 'FRONT';

function cmMedMapMuscleToZone(muscleId) {
    var id = muscleId.toLowerCase();
    var side = id.includes('left') ? 'l' : id.includes('right') ? 'r' : '';

    // Cabeza y cuello
    if (id.includes('head')) return 'front_head';
    if (id.includes('neck')) return id.includes('back') ? 'back_neck' : 'front_neck';
    if (id.includes('face')) return 'front_face';

    // Hombros
    if (id.includes('deltoid') || id.includes('shoulder')) {
        if (id.includes('back') || id.includes('rear') || id.includes('posterior'))
            return 'back_shoulder_' + (side || 'r');
        return 'front_shoulder_' + (side || 'r');
    }

    // Pecho
    if (id.includes('chest') || id.includes('pectoral') || id.includes('sternal'))
        return 'front_chest_' + (side || 'r');

    // Brazos
    if (id.includes('bicep')) return 'front_upper_arm_' + (side || 'r');
    if (id.includes('tricep')) return 'back_upper_arm_' + (side || 'r');
    if (id.includes('forearm')) return 'front_forearm_' + (side || 'r');
    if (id.includes('wrist') || id.includes('hand')) return 'front_wrist_hand_' + (side || 'r');
    if (id.includes('elbow')) return 'front_elbow_' + (side || 'r');

    // Abdomen
    if (id.includes('abs') || id.includes('abdominal') || id.includes('rectus'))
        return 'front_abdomen';
    if (id.includes('oblique')) return 'front_hip_groin_' + (side || 'r');

    // Cadera / ingle
    if (id.includes('hip') || id.includes('groin') || id.includes('flexor') || id.includes('adductor'))
        return 'front_hip_groin_' + (side || 'r');

    // Muslo
    if (id.includes('quadricep') || id.includes('quad') || id.includes('vastus') || id.includes('rectus-fem'))
        return 'front_thigh_' + (side || 'r');
    if (id.includes('hamstring') || id.includes('semitendinosus') || id.includes('semimembranosus'))
        return 'back_hamstring_' + (side || 'r');
    if (id.includes('abductor')) return 'front_thigh_' + (side || 'r');

    // Gluteo
    if (id.includes('gluteal') || id.includes('glute')) return 'back_glute_' + (side || 'r');

    // Rodilla
    if (id.includes('knee')) return 'front_knee_' + (side || 'r');

    // Pierna
    if (id.includes('calf') || id.includes('calves') || id.includes('gastrocnemius') || id.includes('soleus'))
        return 'back_calf_' + (side || 'r');
    if (id.includes('tibialis') || id.includes('shin')) return 'front_shin_' + (side || 'r');

    // Tobillo / pie
    if (id.includes('ankle') || id.includes('foot') || id.includes('feet') || id.includes('achilles'))
        return 'front_ankle_foot_' + (side || 'r');

    // Espalda
    if (id.includes('trapezius') || id.includes('trap')) return 'back_upper_back_' + (side || 'r');
    if (id.includes('upper-back') || id.includes('rhomboid') || id.includes('lats') || id.includes('lat'))
        return 'back_upper_back_' + (side || 'r');
    if (id.includes('lower-back') || id.includes('lumbar') || id.includes('erector'))
        return 'back_lower_back';
    if (id.includes('mid-back')) return 'back_mid_back';

    console.warn('Body map: zona no mapeada para:', muscleId);
    return null;
}
function cmMedInitBodyMap(containerId) {
    if (typeof BodyMuscles === 'undefined') {
        console.warn('body-muscles library not loaded');
        return;
    }
    var container = document.getElementById(containerId);
    if (!container || !BodyMuscles.BodyChart) return;

    if (cmMedBodyChart) { try { cmMedBodyChart.destroy(); } catch(e){} }

    cmMedBodyChart = new BodyMuscles.BodyChart(container, {
        view: BodyMuscles.ViewSide.FRONT,
        bodyState: {},
        onMuscleClick: function(muscleId, muscleName) {
            console.log('BODY MAP CLICK:', muscleId, muscleName);
            var zoneId = cmMedMapMuscleToZone(muscleId);
            if (zoneId) {
                var select = document.getElementById('cmmed-inj-zone');
                if (select) { select.value = zoneId; }
                var label = document.getElementById('cmmed-bodymap-selected');
                if (label) { label.textContent = muscleName + ' → ' + zoneId; }
                // Highlight the selected muscle
                var state = {};
                state[muscleId] = { intensity: 5, selected: true };
                cmMedBodyChart.update({ bodyState: state });
            }
        }
    });
}

function cmMedToggleBodyView() {
    if (!cmMedBodyChart) return;
    if (cmMedBodyChartView === 'FRONT') {
        cmMedBodyChartView = 'BACK';
        cmMedBodyChart.update({ view: BodyMuscles.ViewSide.BACK });
    } else {
        cmMedBodyChartView = 'FRONT';
        cmMedBodyChart.update({ view: BodyMuscles.ViewSide.FRONT });
    }
    var btn = document.getElementById('cmmed-bodymap-toggle');
    if (btn) { btn.textContent = cmMedBodyChartView === 'FRONT' ? 'Ver posterior' : 'Ver frontal'; }
}
function cmMedMostrarFormLesion() {
    var container = document.getElementById('cmmed-form-lesion-container');
    var osiicsOpts = cmMedOsiicsCatalog.map(function(o) { return '<option value="'+o.code+'">'+o.code+' - '+o.description_es+'</option>'; }).join('');
    var frontZ = cmMedBodyZones.filter(function(z){return z.body_side==='front';});
    var backZ = cmMedBodyZones.filter(function(z){return z.body_side==='back';});
    var zoneOpts = '<optgroup label="Frontal">'+frontZ.map(function(z){return '<option value="'+z.zone_id+'">'+z.zone_name_es+'</option>';}).join('')+'</optgroup><optgroup label="Posterior">'+backZ.map(function(z){return '<option value="'+z.zone_id+'">'+z.zone_name_es+'</option>';}).join('')+'</optgroup>';
    var hoy = new Date().toISOString().split('T')[0];

    container.innerHTML =
        '<div style="background:#0f172a;border:1px solid #3b82f6;border-radius:10px;padding:18px;margin-bottom:16px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h4 style="margin:0;color:#60a5fa;font-size:15px">Registrar nueva lesion</h4><button class="cmmed-btn cmmed-btn-secondary cmmed-btn-sm" onclick="document.getElementById(\'cmmed-form-lesion-container\').innerHTML=\'\'">Cancelar</button></div>' +
        '<div class="cmmed-form-row"><div class="cmmed-form-group"><label>Fecha de la lesion *</label><input type="date" id="cmmed-inj-date" value="'+hoy+'"></div><div class="cmmed-form-group"><label>Mecanismo</label><select id="cmmed-inj-mechanism"><option value="">-- Seleccionar --</option><option value="non_contact">Sin contacto</option><option value="contact">Contacto</option><option value="overuse">Sobrecarga / sobreuso</option><option value="illness">Enfermedad</option></select></div></div>' +
        '<div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:14px;margin-bottom:14px">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="color:#94a3b8;font-size:12px;font-weight:600">Selecciona la zona en el cuerpo</span><button type="button" class="cmmed-btn cmmed-btn-secondary cmmed-btn-sm" id="cmmed-bodymap-toggle" onclick="cmMedToggleBodyView()">Ver posterior</button></div>' +
            '<div id="cmmed-bodymap-container" style="max-width:280px;margin:0 auto"></div>' +
            '<div id="cmmed-bodymap-selected" style="text-align:center;color:#60a5fa;font-size:13px;margin-top:8px;min-height:20px"></div>' +
        '</div>' +
        '<div class="cmmed-form-row"><div class="cmmed-form-group"><label>Zona corporal *</label><select id="cmmed-inj-zone"><option value="">-- Seleccionar zona --</option>'+zoneOpts+'</select></div><div class="cmmed-form-group"><label>Codigo OSIICS</label><select id="cmmed-inj-osiics"><option value="">-- Seleccionar diagnostico --</option>'+osiicsOpts+'</select></div></div>' +
        '<div class="cmmed-form-row"><div class="cmmed-form-group"><label>Contexto</label><select id="cmmed-inj-context"><option value="">-- Seleccionar --</option><option value="match">Partido</option><option value="training">Entrenamiento</option><option value="other">Otro</option></select></div><div class="cmmed-form-group"><label>Severidad estimada</label><select id="cmmed-inj-severity"><option value="">-- Seleccionar --</option><option value="minimal">Minima (1-3 dias)</option><option value="mild">Leve (4-7 dias)</option><option value="moderate">Moderada (8-28 dias)</option><option value="severe">Severa (+28 dias)</option></select></div></div>' +
        '<div class="cmmed-form-group"><label>Dias estimados de baja</label><input type="number" id="cmmed-inj-days" placeholder="Ej: 14" min="1"></div>' +
        '<div class="cmmed-form-group"><label>Descripcion / observaciones</label><textarea id="cmmed-inj-desc" placeholder="Descripcion de la lesion, circunstancias..."></textarea></div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px"><button class="cmmed-btn cmmed-btn-primary" onclick="cmMedGuardarLesion()">Registrar lesion</button></div></div>';
        setTimeout(function() { cmMedInitBodyMap('cmmed-bodymap-container'); }, 100);

    }

async function cmMedGuardarLesion() {
    var playerId = cmMedJugadorActual;
    var fecha = document.getElementById('cmmed-inj-date').value;
    var zona = document.getElementById('cmmed-inj-zone').value;
    if (!fecha) { showToast('La fecha es obligatoria', 'error'); return; }
    if (!zona) { showToast('Selecciona una zona corporal', 'error'); return; }

    var lesion = { club_id: clubId, player_id: playerId, season_id: seasonId, injury_date: fecha, body_zone: zona,
        osiics_code: document.getElementById('cmmed-inj-osiics').value || null, mechanism: document.getElementById('cmmed-inj-mechanism').value || null,
        context: document.getElementById('cmmed-inj-context').value || null, severity: document.getElementById('cmmed-inj-severity').value || null,
        estimated_days: parseInt(document.getElementById('cmmed-inj-days').value) || null, description: document.getElementById('cmmed-inj-desc').value.trim() || null,
        status: 'active', registered_by: usuario ? usuario.id : null };

    var res = await supabaseClient.from('cm_med_injuries').insert(lesion).select().single();
    if (res.error) { showToast('Error al registrar: ' + res.error.message, 'error'); return; }
    showToast('Lesion registrada');
    var playerData = cmMedJugadoresData.find(function(j) { return j.playerId === playerId; });
    var pName = playerData ? playerData.name : 'Jugador';
    var zoneName = cmMedBodyZones.find(function(z) { return z.zone_id === zona; });
    cmMedNotificar('injury_new', 'Nueva lesion: ' + pName, (zoneName ? zoneName.zone_name_es : zona), pName, 'injury', res.data.id);
    cmMedRegistrarAudit('INSERT', 'cm_med_injuries', res.data.id, 'Registro nueva lesion: ' + zona);
    await cmMedCambiarDisponibilidad(playerId, 'red', null);
    await cmMedCargarLesiones(playerId);
}


// ========== DETALLE LESIÓN ==========
async function cmMedVerLesion(injuryId) {
    cmMedLesionActual = injuryId;
    var injRes = await supabaseClient.from('cm_med_injuries').select('*, cm_med_osiics_codes(description_es, code), cm_med_body_zones(zone_name_es)').eq('id', injuryId).single();
    var inj = injRes.data;
    if (!inj) return;

    var sesRes = await supabaseClient.from('cm_med_sessions').select('*').eq('injury_id', injuryId).eq('archived', false).order('session_date', { ascending: false });
    var sessions = sesRes.data || [];
    var fecha = new Date(inj.injury_date + 'T12:00:00').toLocaleDateString('es-ES');
    var statusLabels = { active: 'Activa', recovering: 'En recuperacion', rtp: 'Return-to-Play', discharged: 'Alta medica' };

    var sesHtml = '';
    if (sessions.length === 0) { sesHtml = '<p style="color:#64748b;font-size:13px;text-align:center;padding:20px">Sin sesiones de tratamiento</p>'; }
    else { sessions.forEach(function(s) {
        var sf = new Date(s.session_date + 'T12:00:00').toLocaleDateString('es-ES');
        sesHtml += '<div class="cmmed-soap-card"><div class="cmmed-soap-date">' + sf + ' · ' + (s.session_type==='treatment'?'Tratamiento':s.session_type==='evaluation'?'Evaluacion':s.session_type==='follow_up'?'Seguimiento':'Alta') + '</div>' +
            (s.subjective?'<div class="cmmed-soap-section"><strong>S - Subjetivo</strong><p>'+s.subjective+'</p></div>':'') +
            (s.objective?'<div class="cmmed-soap-section"><strong>O - Objetivo</strong><p>'+s.objective+'</p></div>':'') +
            (s.assessment?'<div class="cmmed-soap-section"><strong>A - Analisis</strong><p>'+s.assessment+'</p></div>':'') +
            (s.plan?'<div class="cmmed-soap-section"><strong>P - Plan</strong><p>'+s.plan+'</p></div>':'') + '</div>';
    }); }

    var container = document.getElementById('cmmed-tab-lesiones');
    container.innerHTML =
        '<div style="display:flex;justify-content:space-between;margin-bottom:14px">' +
            '<button class="cmmed-btn cmmed-btn-secondary cmmed-btn-sm" onclick="cmMedCargarLesiones(\'' + cmMedJugadorActual + '\')">← Volver a lesiones</button>' +
            '<button class="cmmed-btn cmmed-btn-secondary cmmed-btn-sm" onclick="cmMedPDFLesion(\'' + inj.id + '\')">PDF Informe lesion</button>' +
        '</div>' +
        '<div style="background:#1e293b;border-radius:10px;padding:18px;margin-bottom:16px">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px"><div><h4 style="margin:0;color:#e2e8f0">'+(inj.cm_med_body_zones?inj.cm_med_body_zones.zone_name_es:'Lesion')+'</h4><p style="color:#94a3b8;font-size:13px;margin:4px 0 0 0">'+fecha+' · '+(inj.cm_med_osiics_codes?inj.cm_med_osiics_codes.code+' - '+inj.cm_med_osiics_codes.description_es:'')+'</p></div><span class="cmmed-injury-status st-'+inj.status+'">'+statusLabels[inj.status]+'</span></div>' +
            (inj.description?'<p style="color:#cbd5e1;font-size:13px;margin-bottom:12px">'+inj.description+'</p>':'') +
            '<div style="display:flex;gap:12px;flex-wrap:wrap;font-size:13px;color:#94a3b8">'+(inj.mechanism?'<span>Mecanismo: <strong style="color:#e2e8f0">'+cmMedMecanismoLabel(inj.mechanism)+'</strong></span>':'')+(inj.context?'<span>Contexto: <strong style="color:#e2e8f0">'+(inj.context==='match'?'Partido':inj.context==='training'?'Entrenamiento':'Otro')+'</strong></span>':'')+(inj.severity?'<span>Severidad: <strong style="color:#e2e8f0">'+inj.severity+'</strong></span>':'')+(inj.estimated_days?'<span>Dias estimados: <strong style="color:#e2e8f0">'+inj.estimated_days+'</strong></span>':'')+'</div>' +
            '<div style="margin-top:14px;padding-top:14px;border-top:1px solid #334155"><label style="color:#94a3b8;font-size:12px;font-weight:600;display:block;margin-bottom:6px">Cambiar estado</label><div style="display:flex;gap:8px;flex-wrap:wrap">' +
                '<button class="cmmed-btn cmmed-btn-sm '+(inj.status==='active'?'cmmed-btn-danger':'cmmed-btn-secondary')+'" onclick="cmMedCambiarEstadoLesion(\''+inj.id+'\',\'active\')">Activa</button>' +
                '<button class="cmmed-btn cmmed-btn-sm '+(inj.status==='recovering'?'cmmed-btn-primary':'cmmed-btn-secondary')+'" onclick="cmMedCambiarEstadoLesion(\''+inj.id+'\',\'recovering\')">En recuperacion</button>' +
                '<button class="cmmed-btn cmmed-btn-sm '+(inj.status==='rtp'?'cmmed-btn-primary':'cmmed-btn-secondary')+'" onclick="cmMedCambiarEstadoLesion(\''+inj.id+'\',\'rtp\')">Return-to-Play</button>' +
                '<button class="cmmed-btn cmmed-btn-sm '+(inj.status==='discharged'?'cmmed-btn-success':'cmmed-btn-secondary')+'" onclick="cmMedDarAlta(\''+inj.id+'\')">Alta medica</button>' +
            '</div></div></div>' +
            '<div style="margin-bottom:16px" id="cmmed-rtp-container"></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h4 style="margin:0;color:#e2e8f0">Sesiones de tratamiento</h4><button class="cmmed-btn cmmed-btn-primary cmmed-btn-sm" onclick="cmMedMostrarFormSesion(\''+inj.id+'\')">+ Nueva sesion SOAP</button></div>' +
        '<div id="cmmed-form-sesion-container"></div>' + sesHtml +
        '<div style="margin-top:20px;padding-top:16px;border-top:1px solid #334155">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
                '<h4 style="margin:0;color:#e2e8f0">Cuestionario OSTRC <span style="font-size:11px;color:#94a3b8;font-weight:400">(severity score 0-100)</span></h4>' +
                '<button class="cmmed-btn cmmed-btn-primary cmmed-btn-sm" onclick="cmMedMostrarFormOSTRC(\'' + inj.id + '\')">+ Nueva evaluacion</button>' +
            '</div>' +
            '<div id="cmmed-ostrc-form-container"></div>' +
            '<div id="cmmed-ostrc-historial"></div>' +
        '</div>' +
        '<div style="margin-top:20px;padding-top:16px;border-top:1px solid #334155">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
                '<h4 style="margin:0;color:#e2e8f0">Archivos adjuntos</h4>' +
                '<label class="cmmed-btn cmmed-btn-secondary cmmed-btn-sm" style="cursor:pointer">' +
                    '<input type="file" id="cmmed-file-input" style="display:none" accept="image/*,.pdf,.doc,.docx" onchange="cmMedSubirArchivo(\'' + inj.id + '\')" multiple>' +
                    '+ Subir archivo' +
                '</label>' +
            '</div>' +
            '<div id="cmmed-adjuntos-lista"><div class="cmmed-empty" style="padding:20px"><p>Cargando adjuntos...</p></div></div>' +
        '</div>';

    cmMedCargarAdjuntos(inj.id);
    cmMedCargarOSTRC(inj.id);
    cmMedCargarRTP(inj.id);
}

async function cmMedCambiarEstadoLesion(injuryId, nuevoEstado) {
    var res = await supabaseClient.from('cm_med_injuries').update({ status: nuevoEstado }).eq('id', injuryId);
    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
    showToast('Estado actualizado');
    cmMedRegistrarAudit('UPDATE', 'cm_med_injuries', injuryId, 'Cambio estado a: ' + nuevoEstado);
    var semaforo = nuevoEstado === 'active' ? 'red' : nuevoEstado === 'discharged' ? 'green' : 'amber';
    await cmMedCambiarDisponibilidad(cmMedJugadorActual, semaforo, null);
    await cmMedVerLesion(injuryId);
}

async function cmMedDarAlta(injuryId) {
    var injRes = await supabaseClient.from('cm_med_injuries').select('injury_date').eq('id', injuryId).single();
    var hoy = new Date();
    var fechaLesion = new Date(injRes.data.injury_date + 'T12:00:00');
    var diasPerdidos = Math.round((hoy - fechaLesion) / 86400000);
    var res = await supabaseClient.from('cm_med_injuries').update({ status: 'discharged', discharge_date: hoy.toISOString().split('T')[0], actual_days_lost: diasPerdidos }).eq('id', injuryId);
    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
    showToast('Alta medica registrada · ' + diasPerdidos + ' dias perdidos');
    var playerData2 = cmMedJugadoresData.find(function(j) { return j.playerId === cmMedJugadorActual; });
    cmMedNotificar('discharge', 'Alta medica: ' + (playerData2 ? playerData2.name : 'Jugador'), diasPerdidos + ' dias de baja', playerData2 ? playerData2.name : '', 'injury', injuryId);
    cmMedRegistrarAudit('UPDATE', 'cm_med_injuries', injuryId, 'Alta medica. Dias perdidos: ' + diasPerdidos);

    var otrasRes = await supabaseClient.from('cm_med_injuries').select('id').eq('club_id', clubId).eq('player_id', cmMedJugadorActual).in('status', ['active', 'recovering', 'rtp']).neq('id', injuryId).eq('archived', false);
    var semaforo = (otrasRes.data && otrasRes.data.length > 0) ? 'amber' : 'green';
    await cmMedCambiarDisponibilidad(cmMedJugadorActual, semaforo, null);
    await cmMedVerLesion(injuryId);
}


// ========== SESIÓN SOAP ==========
function cmMedMostrarFormSesion(injuryId) {
    var container = document.getElementById('cmmed-form-sesion-container');
    var hoy = new Date().toISOString().split('T')[0];
    container.innerHTML =
        '<div style="background:#0f172a;border:1px solid #3b82f6;border-radius:10px;padding:18px;margin-bottom:16px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h4 style="margin:0;color:#60a5fa;font-size:15px">Nueva sesion de tratamiento</h4><button class="cmmed-btn cmmed-btn-secondary cmmed-btn-sm" onclick="document.getElementById(\'cmmed-form-sesion-container\').innerHTML=\'\'">Cancelar</button></div>' +
        '<div class="cmmed-form-row"><div class="cmmed-form-group"><label>Fecha</label><input type="date" id="cmmed-ses-date" value="'+hoy+'"></div><div class="cmmed-form-group"><label>Tipo</label><select id="cmmed-ses-type"><option value="treatment">Tratamiento</option><option value="evaluation">Evaluacion</option><option value="follow_up">Seguimiento</option></select></div></div>' +
        '<div class="cmmed-form-group"><label>S - Subjetivo (lo que dice el jugador)</label><textarea id="cmmed-ses-subj" placeholder="Dolor, sensaciones, como se siente..."></textarea></div>' +
        '<div class="cmmed-form-group"><label>O - Objetivo (lo que observa el medico)</label><textarea id="cmmed-ses-obj" placeholder="ROM, fuerza, edema, palpacion, tests..."></textarea></div>' +
        '<div class="cmmed-form-group"><label>A - Analisis (valoracion del medico)</label><textarea id="cmmed-ses-assess" placeholder="Diagnostico, evolucion..."></textarea></div>' +
        '<div class="cmmed-form-group"><label>P - Plan (plan de tratamiento)</label><textarea id="cmmed-ses-plan" placeholder="Que se va a hacer hasta la proxima sesion..."></textarea></div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px"><button class="cmmed-btn cmmed-btn-primary" onclick="cmMedGuardarSesion(\''+injuryId+'\')">Guardar sesion</button></div></div>';
}

async function cmMedGuardarSesion(injuryId) {
    var fecha = document.getElementById('cmmed-ses-date').value;
    if (!fecha) { showToast('La fecha es obligatoria', 'error'); return; }
    var sesion = { club_id: clubId, injury_id: injuryId, player_id: cmMedJugadorActual, session_date: fecha,
        session_type: document.getElementById('cmmed-ses-type').value,
        subjective: document.getElementById('cmmed-ses-subj').value.trim() || null, objective: document.getElementById('cmmed-ses-obj').value.trim() || null,
        assessment: document.getElementById('cmmed-ses-assess').value.trim() || null, plan: document.getElementById('cmmed-ses-plan').value.trim() || null,
        conducted_by: usuario ? usuario.id : null };
    var res = await supabaseClient.from('cm_med_sessions').insert(sesion).select().single();
    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
    showToast('Sesion guardada');
    cmMedRegistrarAudit('INSERT', 'cm_med_sessions', res.data.id, 'Nueva sesion SOAP');
    await cmMedVerLesion(injuryId);
}

async function cmMedCargarListaSesiones(playerId) {
    var container = document.getElementById('cmmed-tab-sesiones');
    var res = await supabaseClient.from('cm_med_sessions').select('*, cm_med_injuries(body_zone, cm_med_body_zones(zone_name_es))').eq('club_id', clubId).eq('player_id', playerId).eq('archived', false).order('session_date', { ascending: false }).limit(50);
    var sessions = res.data || [];
    if (sessions.length === 0) { container.innerHTML = '<div class="cmmed-empty"><div class="icon">📋</div><p>Sin sesiones de tratamiento registradas</p></div>'; return; }
    var html = '<h4 style="margin:0 0 14px;color:#e2e8f0">Todas las sesiones de tratamiento</h4>';
    sessions.forEach(function(s) {
        var sf = new Date(s.session_date + 'T12:00:00').toLocaleDateString('es-ES');
        var zona = s.cm_med_injuries && s.cm_med_injuries.cm_med_body_zones ? s.cm_med_injuries.cm_med_body_zones.zone_name_es : 'Lesion';
        var tipo = s.session_type==='treatment'?'Tratamiento':s.session_type==='evaluation'?'Evaluacion':s.session_type==='follow_up'?'Seguimiento':'Alta';
        html += '<div class="cmmed-soap-card"><div class="cmmed-soap-date">'+sf+' · '+tipo+' · '+zona+'</div>'+(s.subjective?'<div class="cmmed-soap-section"><strong>S</strong><p>'+s.subjective+'</p></div>':'')+(s.objective?'<div class="cmmed-soap-section"><strong>O</strong><p>'+s.objective+'</p></div>':'')+(s.assessment?'<div class="cmmed-soap-section"><strong>A</strong><p>'+s.assessment+'</p></div>':'')+(s.plan?'<div class="cmmed-soap-section"><strong>P</strong><p>'+s.plan+'</p></div>':'')+'</div>';
    });
    container.innerHTML = html;
}


// ========== CONSENTIMIENTOS ==========
async function cmMedCargarConsentimientos(playerId) {
    var container = document.getElementById('cmmed-tab-consentimientos');
    var tipos = [
        { type: 'medical_treatment', label: 'Tratamiento de datos medicos', desc: 'Permitir el registro y procesamiento de datos medicos del jugador.' },
        { type: 'share_with_coaching', label: 'Compartir con cuerpo tecnico', desc: 'Permitir que el cuerpo tecnico vea el semaforo y resumen de lesion, sin datos clinicos.' },
        { type: 'statistical_analysis', label: 'Analisis estadistico', desc: 'Permitir el uso anonimizado de datos medicos para estadisticas.' },
        { type: 'export_third_party', label: 'Exportacion a terceros', desc: 'Permitir la exportacion de datos medicos a otros sistemas (federacion, seguros, etc.).' }
    ];
    var res = await supabaseClient.from('cm_med_consents').select('*').eq('club_id', clubId).eq('player_id', playerId);
    var consentMap = {};
    (res.data || []).forEach(function(c) { consentMap[c.consent_type] = c; });

    var html = '<h4 style="margin:0 0 6px;color:#e2e8f0">Consentimientos RGPD</h4><p style="color:#94a3b8;font-size:12px;margin-bottom:16px">Cada tipo de procesamiento de datos requiere consentimiento independiente del jugador o su tutor legal.</p>';
    tipos.forEach(function(t) {
        var consent = consentMap[t.type];
        var isOn = consent && consent.granted && !consent.revoked_at;
        var grantedDate = consent && consent.granted_at ? new Date(consent.granted_at).toLocaleDateString('es-ES') : '';
        html += '<div class="cmmed-consent-row"><div class="cmmed-consent-info"><div class="cmmed-consent-type">'+t.label+'</div><div class="cmmed-consent-desc">'+t.desc+'</div>'+(grantedDate?'<div style="color:#64748b;font-size:11px;margin-top:4px">'+(isOn?'Concedido: '+grantedDate:'Revocado')+'</div>':'')+'</div><button class="cmmed-toggle '+(isOn?'on':'')+'" onclick="cmMedToggleConsentimiento(\''+playerId+'\',\''+t.type+'\','+(isOn?'true':'false')+',this)"></button></div>';
    });
    container.innerHTML = html;
}

async function cmMedToggleConsentimiento(playerId, tipo, estaActivo, btn) {
    var ahora = new Date().toISOString();
    if (estaActivo) {
        var res = await supabaseClient.from('cm_med_consents').update({ granted: false, revoked_at: ahora }).eq('club_id', clubId).eq('player_id', playerId).eq('consent_type', tipo);
        if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
        btn.classList.remove('on');
        showToast('Consentimiento revocado');
    } else {
        var res = await supabaseClient.from('cm_med_consents').upsert({ club_id: clubId, player_id: playerId, consent_type: tipo, granted: true, granted_at: ahora, revoked_at: null, consent_version: '1.0' }, { onConflict: 'club_id,player_id,consent_type' });
        if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
        btn.classList.add('on');
        showToast('Consentimiento concedido');
    }
    cmMedRegistrarAudit('UPDATE', 'cm_med_consents', playerId, (estaActivo ? 'Revoco' : 'Concedio') + ' consentimiento: ' + tipo);
}


// ========== SEMÁFORO ==========
async function cmMedCambiarDisponibilidad(playerId, status, btn) {
    var res = await supabaseClient.from('club_player_availability').upsert({
        club_id: clubId, player_id: playerId, status: status,
        set_by_wp_user_id: usuario ? usuario.id : null, updated_at: new Date().toISOString()
    }, { onConflict: 'club_id,player_id' });

    if (res.error) { console.error('Error disponibilidad:', res.error); showToast('Error: ' + res.error.message, 'error'); return; }
    if (btn) {
        btn.parentElement.querySelectorAll('.cmmed-semaforo-btn').forEach(function(b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
    }
    var jugador = cmMedJugadoresData.find(function(j) { return j.playerId === playerId; });
    if (jugador) jugador.avail = status;
    var playerDataN = cmMedJugadoresData.find(function(j) { return j.playerId === playerId; });
    var statusNames = { green: 'DISPONIBLE', amber: 'PRECAUCION', red: 'LESIONADO' };
    if (playerDataN) cmMedNotificar('availability', (playerDataN.name) + ': ' + (statusNames[status] || status), 'Disponibilidad actualizada por el equipo medico', playerDataN.name, 'availability', playerId);
    cmMedRegistrarAudit('UPDATE', 'club_player_availability', playerId, 'Disponibilidad: ' + status);
}


// ========== AUDIT ==========
async function cmMedRegistrarAudit(action, tableName, recordId, details) {
    try {
        await supabaseClient.from('cm_med_audit').insert({ club_id: clubId, wp_user_id: usuario ? usuario.id : 0,
            player_id: (tableName !== 'club_player_availability' && recordId) ? recordId : null,
            action: action, table_name: tableName, record_id: String(recordId || ''), details: details || null });
    } catch (e) { console.warn('Audit log error:', e); }
}// ========== GENERACION PDF ==========
async function cmMedPDFLesion(injuryId) {
    showToast('Generando PDF...');

    var injRes = await supabaseClient.from('cm_med_injuries')
        .select('*, cm_med_osiics_codes(code, description_es, body_region), cm_med_body_zones(zone_name_es)')
        .eq('id', injuryId).single();
    var inj = injRes.data;
    if (!inj) { showToast('Error: lesion no encontrada', 'error'); return; }

    // Datos del jugador
    var playerData = cmMedJugadoresData.find(function(j) { return j.playerId === inj.player_id; });
    var playerName = playerData ? playerData.name : 'Jugador';

    // Sesiones SOAP
    var sesRes = await supabaseClient.from('cm_med_sessions').select('*')
        .eq('injury_id', injuryId).eq('archived', false).order('session_date', { ascending: true });
    var sessions = sesRes.data || [];

    // OSTRC
    var ostrcRes = await supabaseClient.from('cm_med_ostrc').select('*')
        .eq('injury_id', injuryId).order('eval_date', { ascending: true });
    var ostrcs = ostrcRes.data || [];

    // Adjuntos
    var attRes = await supabaseClient.from('cm_med_attachments').select('*')
        .eq('injury_id', injuryId).eq('archived', false);
    var attachments = attRes.data || [];

    // Generar PDF
    var doc = new jspdf.jsPDF('p', 'mm', 'a4');
    var y = 20;
    var margen = 20;
    var ancho = 170;
    var statusLabels = { active: 'Activa', recovering: 'En recuperacion', rtp: 'Return-to-Play', discharged: 'Alta medica' };
    var mechLabels = { contact: 'Contacto', non_contact: 'Sin contacto', overuse: 'Sobrecarga', illness: 'Enfermedad' };

    function checkPage(needed) { if (y + needed > 275) { doc.addPage(); y = 20; } }
    function addTitle(text) { checkPage(12); doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.text(text, margen, y); y += 8; doc.setDrawColor(59, 130, 246); doc.line(margen, y, margen + ancho, y); y += 6; }
    function addLabel(label, value) { checkPage(8); doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(100); doc.text(label + ':', margen, y); doc.setFont(undefined, 'normal'); doc.setTextColor(40); doc.text(String(value || '-'), margen + 45, y); y += 6; }
    function addText(text, size) { checkPage(8); doc.setFontSize(size || 10); doc.setFont(undefined, 'normal'); doc.setTextColor(40); var lines = doc.splitTextToSize(String(text), ancho); doc.text(lines, margen, y); y += lines.length * 5; }

    // === HEADER ===
    doc.setFontSize(18); doc.setFont(undefined, 'bold'); doc.setTextColor(30);
    doc.text('INFORME MEDICO DE LESION', margen, y); y += 10;
    doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(120);
    doc.text('Documento confidencial - Datos medicos protegidos (RGPD Art. 9)', margen, y); y += 4;
    doc.text('Generado: ' + new Date().toLocaleDateString('es-ES') + ' ' + new Date().toLocaleTimeString('es-ES'), margen, y); y += 10;

    // === DATOS DEL JUGADOR ===
    addTitle('Datos del jugador');
    addLabel('Nombre', playerName);
    addLabel('Posicion', playerData ? playerData.position : '-');
    addLabel('Equipo', playerData && playerData.teamNames ? playerData.teamNames.join(', ') : 'Sin equipo');
    y += 4;

    // === DATOS DE LA LESION ===
    addTitle('Datos de la lesion');
    var fecha = inj.injury_date ? new Date(inj.injury_date + 'T12:00:00').toLocaleDateString('es-ES') : '-';
    addLabel('Fecha lesion', fecha);
    addLabel('Zona corporal', inj.cm_med_body_zones ? inj.cm_med_body_zones.zone_name_es : '-');
    addLabel('Diagnostico', inj.cm_med_osiics_codes ? inj.cm_med_osiics_codes.code + ' - ' + inj.cm_med_osiics_codes.description_es : '-');
    addLabel('Region', inj.cm_med_osiics_codes ? inj.cm_med_osiics_codes.body_region : '-');
    addLabel('Mecanismo', mechLabels[inj.mechanism] || '-');
    addLabel('Contexto', inj.context === 'match' ? 'Partido' : inj.context === 'training' ? 'Entrenamiento' : inj.context || '-');
    addLabel('Severidad', inj.severity || '-');
    addLabel('Dias estimados', inj.estimated_days || '-');
    addLabel('Estado actual', statusLabels[inj.status] || inj.status);
    if (inj.discharge_date) addLabel('Fecha alta', new Date(inj.discharge_date + 'T12:00:00').toLocaleDateString('es-ES'));
    if (inj.actual_days_lost) addLabel('Dias perdidos', inj.actual_days_lost);
    if (inj.is_recurrence) addLabel('Recurrencia', 'Si');
    if (inj.description) { y += 2; addLabel('Descripcion', ''); addText(inj.description); }
    y += 4;

    // === SESIONES SOAP ===
    if (sessions.length > 0) {
        addTitle('Sesiones de tratamiento (' + sessions.length + ')');
        var tipoLabels = { treatment: 'Tratamiento', evaluation: 'Evaluacion', follow_up: 'Seguimiento', discharge: 'Alta' };
        sessions.forEach(function(s, idx) {
            checkPage(30);
            var sf = new Date(s.session_date + 'T12:00:00').toLocaleDateString('es-ES');
            doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(59, 130, 246);
            doc.text('Sesion ' + (idx + 1) + ' - ' + sf + ' (' + (tipoLabels[s.session_type] || s.session_type) + ')', margen, y); y += 6;
            doc.setTextColor(40);
            if (s.subjective) { doc.setFont(undefined, 'bold'); doc.setFontSize(9); doc.text('S - Subjetivo:', margen, y); y += 4; doc.setFont(undefined, 'normal'); addText(s.subjective, 9); y += 2; }
            if (s.objective) { doc.setFont(undefined, 'bold'); doc.setFontSize(9); doc.text('O - Objetivo:', margen, y); y += 4; doc.setFont(undefined, 'normal'); addText(s.objective, 9); y += 2; }
            if (s.assessment) { doc.setFont(undefined, 'bold'); doc.setFontSize(9); doc.text('A - Analisis:', margen, y); y += 4; doc.setFont(undefined, 'normal'); addText(s.assessment, 9); y += 2; }
            if (s.plan) { doc.setFont(undefined, 'bold'); doc.setFontSize(9); doc.text('P - Plan:', margen, y); y += 4; doc.setFont(undefined, 'normal'); addText(s.plan, 9); y += 2; }
            y += 4;
        });
    }

    // === OSTRC ===
    if (ostrcs.length > 0) {
        addTitle('Evaluaciones OSTRC (' + ostrcs.length + ')');
        doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(100);
        doc.text('Fecha', margen, y); doc.text('Partic.', margen + 30, y); doc.text('Volumen', margen + 50, y); doc.text('Rendim.', margen + 70, y); doc.text('Dolor', margen + 90, y); doc.text('TOTAL', margen + 110, y);
        y += 5;
        doc.setDrawColor(200); doc.line(margen, y, margen + 130, y); y += 4;
        doc.setFont(undefined, 'normal'); doc.setTextColor(40);
        ostrcs.forEach(function(e) {
            checkPage(7);
            var ef = new Date(e.eval_date + 'T12:00:00').toLocaleDateString('es-ES');
            doc.text(ef, margen, y);
            doc.text(String(e.q1_participation), margen + 35, y);
            doc.text(String(e.q2_training), margen + 55, y);
            doc.text(String(e.q3_performance), margen + 75, y);
            doc.text(String(e.q4_pain), margen + 95, y);
            doc.setFont(undefined, 'bold'); doc.text(String(e.total_score), margen + 115, y); doc.setFont(undefined, 'normal');
            y += 6;
        });
        y += 4;
    }

    // === ADJUNTOS ===
    if (attachments.length > 0) {
        addTitle('Archivos adjuntos (' + attachments.length + ')');
        var catLabels = { mri: 'RMN', ultrasound: 'Ecografia', xray: 'Radiografia', report: 'Informe', photo: 'Foto', other: 'Otro' };
        attachments.forEach(function(a) {
            checkPage(7);
            var af = new Date(a.created_at).toLocaleDateString('es-ES');
            doc.setFontSize(9); doc.setTextColor(40);
            doc.text('- ' + a.file_name + ' (' + (catLabels[a.category] || 'Otro') + ', ' + af + ')', margen, y);
            y += 5;
        });
    }

    // === FOOTER ===
    var totalPages = doc.internal.getNumberOfPages();
    for (var p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8); doc.setTextColor(150);
        doc.text('TopLiderCoach - Panel Medico | Pagina ' + p + '/' + totalPages, margen, 290);
    }

    doc.save('Lesion_' + playerName.replace(/\s/g, '_') + '_' + (inj.injury_date || 'sin_fecha') + '.pdf');
    showToast('PDF generado');
    cmMedRegistrarAudit('EXPORT', 'cm_med_injuries', injuryId, 'Exporto PDF informe lesion');
}

async function cmMedPDFHistorial(playerId, playerName) {
    showToast('Generando historial PDF...');

    // Ficha medica
    var recRes = await supabaseClient.from('cm_med_player_record').select('*')
        .eq('club_id', clubId).eq('player_id', playerId).eq('archived', false).maybeSingle();
    var record = recRes.data || {};

    // Todas las lesiones
    var injRes = await supabaseClient.from('cm_med_injuries')
        .select('*, cm_med_osiics_codes(code, description_es), cm_med_body_zones(zone_name_es)')
        .eq('club_id', clubId).eq('player_id', playerId).eq('archived', false)
        .order('injury_date', { ascending: false });
    var injuries = injRes.data || [];

    var playerData = cmMedJugadoresData.find(function(j) { return j.playerId === playerId; });

    var doc = new jspdf.jsPDF('p', 'mm', 'a4');
    var y = 20;
    var margen = 20;
    var ancho = 170;

    function checkPage(needed) { if (y + needed > 275) { doc.addPage(); y = 20; } }
    function addTitle(text) { checkPage(12); doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.setTextColor(30); doc.text(text, margen, y); y += 8; doc.setDrawColor(59, 130, 246); doc.line(margen, y, margen + ancho, y); y += 6; }
    function addLabel(label, value) { checkPage(8); doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(100); doc.text(label + ':', margen, y); doc.setFont(undefined, 'normal'); doc.setTextColor(40); doc.text(String(value || '-'), margen + 50, y); y += 6; }

    // Header
    doc.setFontSize(18); doc.setFont(undefined, 'bold'); doc.setTextColor(30);
    doc.text('HISTORIAL MEDICO DEPORTIVO', margen, y); y += 10;
    doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(120);
    doc.text('Documento confidencial - Datos medicos protegidos (RGPD Art. 9)', margen, y); y += 4;
    doc.text('Generado: ' + new Date().toLocaleDateString('es-ES'), margen, y); y += 10;

    // Datos del jugador
    addTitle('Datos del jugador');
    addLabel('Nombre', playerName);
    addLabel('Posicion', playerData ? playerData.position : '-');
    addLabel('Equipo', playerData && playerData.teamNames ? playerData.teamNames.join(', ') : '-');
    addLabel('Grupo sanguineo', record.blood_type);
    addLabel('Lateralidad', record.laterality === 'right' ? 'Diestro' : record.laterality === 'left' ? 'Zurdo' : record.laterality === 'ambidextrous' ? 'Ambidiestro' : '-');
    addLabel('Altura / Peso', (record.height_cm ? record.height_cm + ' cm' : '-') + ' / ' + (record.weight_kg ? record.weight_kg + ' kg' : '-'));
    y += 4;

    // Antecedentes
    addTitle('Antecedentes medicos');
    addLabel('Alergias', record.allergies);
    addLabel('Enfermedades cronicas', record.chronic_conditions);
    addLabel('Medicacion habitual', record.medications);
    addLabel('Cirugias previas', record.surgical_history);
    addLabel('Antecedentes familiares', record.family_history);
    addLabel('Vacunaciones', record.vaccination_notes);
    y += 4;

    // Reconocimientos
    addTitle('Reconocimientos medicos');
    addLabel('Ultimo ECG', record.last_ecg_date ? new Date(record.last_ecg_date + 'T12:00:00').toLocaleDateString('es-ES') : '-');
    addLabel('Ultima prueba esfuerzo', record.last_stress_test ? new Date(record.last_stress_test + 'T12:00:00').toLocaleDateString('es-ES') : '-');
    addLabel('Ultimo analisis sangre', record.last_blood_test ? new Date(record.last_blood_test + 'T12:00:00').toLocaleDateString('es-ES') : '-');
    addLabel('Certificado medico', record.medical_certificate_expiry ? new Date(record.medical_certificate_expiry + 'T12:00:00').toLocaleDateString('es-ES') : '-');
    y += 4;

    // Resumen lesiones
    addTitle('Resumen de lesiones');
    var totalInj = injuries.length;
    var dischargedInj = injuries.filter(function(i) { return i.status === 'discharged'; });
    var totalDays = dischargedInj.reduce(function(s, i) { return s + (i.actual_days_lost || 0); }, 0);
    var avgDays = dischargedInj.length > 0 ? Math.round(totalDays / dischargedInj.length) : 0;
    var activeNow = injuries.filter(function(i) { return i.status === 'active' || i.status === 'recovering'; }).length;

    addLabel('Total lesiones', totalInj);
    addLabel('Lesiones activas', activeNow);
    addLabel('Total dias perdidos', totalDays);
    addLabel('Media dias por lesion', avgDays);
    y += 4;

    // Lista de lesiones
    if (injuries.length > 0) {
        addTitle('Historial de lesiones (' + injuries.length + ')');
        var statusLabels = { active: 'ACTIVA', recovering: 'EN RECUPERACION', rtp: 'RETURN-TO-PLAY', discharged: 'ALTA' };
        var mechLabels = { contact: 'Contacto', non_contact: 'Sin contacto', overuse: 'Sobrecarga', illness: 'Enfermedad' };

        injuries.forEach(function(inj, idx) {
            checkPage(25);
            var fecha = inj.injury_date ? new Date(inj.injury_date + 'T12:00:00').toLocaleDateString('es-ES') : '-';
            doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(30);
            doc.text((idx + 1) + '. ' + (inj.cm_med_body_zones ? inj.cm_med_body_zones.zone_name_es : 'Lesion') + ' - ' + fecha, margen, y); y += 5;
            doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(80);
            var details = [];
            if (inj.cm_med_osiics_codes) details.push(inj.cm_med_osiics_codes.code + ' - ' + inj.cm_med_osiics_codes.description_es);
            if (inj.mechanism) details.push('Mecanismo: ' + (mechLabels[inj.mechanism] || inj.mechanism));
            if (inj.severity) details.push('Severidad: ' + inj.severity);
            details.push('Estado: ' + (statusLabels[inj.status] || inj.status));
            if (inj.actual_days_lost) details.push('Dias perdidos: ' + inj.actual_days_lost);
            doc.text(details.join(' | '), margen + 4, y); y += 5;
            if (inj.description) { doc.setTextColor(100); doc.text(inj.description.substring(0, 120), margen + 4, y); y += 5; }
            y += 3;
        });
    }

    // Notas
    if (record.notes) {
        addTitle('Notas del medico');
        doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(40);
        var lines = doc.splitTextToSize(record.notes, ancho);
        checkPage(lines.length * 5);
        doc.text(lines, margen, y); y += lines.length * 5;
    }

    // Footer
    var totalPages = doc.internal.getNumberOfPages();
    for (var p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8); doc.setTextColor(150);
        doc.text('TopLiderCoach - Panel Medico | Pagina ' + p + '/' + totalPages, margen, 290);
    }

    doc.save('Historial_' + playerName.replace(/\s/g, '_') + '.pdf');
    showToast('Historial PDF generado');
    cmMedRegistrarAudit('EXPORT', 'cm_med_player_record', playerId, 'Exporto PDF historial medico');
}
// ========== PROTOCOLO RETURN-TO-PLAY (RTP) ==========
var CM_RTP_PHASES = [
    { phase: 1, name: 'Reposo', desc: 'Proteccion, control del dolor, tratamiento medico', color: '#ef4444', semaforo: 'red' },
    { phase: 2, name: 'Actividad ligera', desc: 'Caminar, bicicleta estatica, piscina. Sin impacto', color: '#f97316', semaforo: 'red' },
    { phase: 3, name: 'Ejercicio especifico', desc: 'Carrera, agilidad, balon individual. Sin contacto', color: '#f59e0b', semaforo: 'amber' },
    { phase: 4, name: 'Entrenamiento sin contacto', desc: 'Ejercicios tacticos, disparos, circuitos. Sin duelos', color: '#84cc16', semaforo: 'amber' },
    { phase: 5, name: 'Entrenamiento completo', desc: 'Entrenamiento con equipo, contacto, duelos, partidos de practica', color: '#22c55e', semaforo: 'amber' },
    { phase: 6, name: 'Vuelta a competicion', desc: 'Apto para partido oficial. Alta deportiva completa', color: '#3b82f6', semaforo: 'green' }
];

async function cmMedCargarRTP(injuryId) {
    var container = document.getElementById('cmmed-rtp-container');
    if (!container) return;

    var res = await supabaseClient.from('cm_med_rtp').select('*')
        .eq('injury_id', injuryId).order('phase', { ascending: true });
    var phases = res.data || [];

    // Determinar fase actual
    var currentPhase = 0;
    var phaseMap = {};
    phases.forEach(function(p) {
        phaseMap[p.phase] = p;
        if (!p.completed_at) currentPhase = Math.max(currentPhase, p.phase);
        else currentPhase = Math.max(currentPhase, p.phase);
    });
    // Si todas completadas, fase actual = ultima completada + 1 (o 6 si ya termino)
    var lastCompleted = 0;
    phases.forEach(function(p) { if (p.completed_at) lastCompleted = Math.max(lastCompleted, p.phase); });
    if (phases.length > 0 && phases.every(function(p) { return p.completed_at; })) {
        currentPhase = Math.min(lastCompleted + 1, 6);
    }
    if (phases.length === 0) currentPhase = 0;

    // Render
    var html =
        '<div style="background:#1e293b;border-radius:10px;padding:16px;border:1px solid #334155">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
                '<h4 style="margin:0;color:#e2e8f0;font-size:14px">Protocolo Return-to-Play</h4>' +
                '<span style="color:#94a3b8;font-size:12px">Fase ' + (currentPhase || '-') + ' de 6</span>' +
            '</div>';

    // Barra de progreso visual
    html += '<div style="display:flex;gap:4px;margin-bottom:16px">';
    CM_RTP_PHASES.forEach(function(rtp) {
        var phaseData = phaseMap[rtp.phase];
        var isCompleted = phaseData && phaseData.completed_at;
        var isCurrent = rtp.phase === currentPhase && !isCompleted;
        var isPending = !phaseData || (!isCompleted && !isCurrent);

        var bgColor = isCompleted ? rtp.color : isCurrent ? rtp.color : '#334155';
        var opacity = isCompleted ? '1' : isCurrent ? '0.7' : '0.3';
        var border = isCurrent ? '2px solid ' + rtp.color : '2px solid transparent';

        html += '<div style="flex:1;text-align:center;cursor:pointer" onclick="cmMedMostrarFaseRTP(' + rtp.phase + ',\'' + injuryId + '\')" title="' + rtp.name + '">' +
            '<div style="height:8px;border-radius:4px;background:' + bgColor + ';opacity:' + opacity + ';border:' + border + ';margin-bottom:4px"></div>' +
            '<div style="font-size:10px;color:' + (isCurrent ? rtp.color : '#64748b') + ';font-weight:' + (isCurrent ? '700' : '400') + '">' + rtp.phase + '</div>' +
        '</div>';
    });
    html += '</div>';

    // Detalle de fase actual
    if (currentPhase >= 1 && currentPhase <= 6) {
        var currentRTP = CM_RTP_PHASES[currentPhase - 1];
        var currentData = phaseMap[currentPhase];

        html += '<div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:12px;border-left:4px solid ' + currentRTP.color + '">' +
            '<div style="color:' + currentRTP.color + ';font-weight:700;font-size:14px;margin-bottom:4px">Fase ' + currentPhase + ': ' + currentRTP.name + '</div>' +
            '<div style="color:#94a3b8;font-size:12px;margin-bottom:8px">' + currentRTP.desc + '</div>';

        if (currentData) {
            var inicio = new Date(currentData.started_at + 'T12:00:00').toLocaleDateString('es-ES');
            html += '<div style="color:#64748b;font-size:11px">Iniciada: ' + inicio + '</div>';
            if (currentData.notes) html += '<div style="color:#94a3b8;font-size:12px;margin-top:4px">' + currentData.notes + '</div>';
        }

        html += '</div>';
    }

    // Botones de accion
    if (currentPhase === 0) {
        html += '<button class="cmmed-btn cmmed-btn-primary cmmed-btn-sm" onclick="cmMedIniciarRTP(\'' + injuryId + '\')">Iniciar protocolo RTP</button>';
    } else if (currentPhase <= 6) {
        html += '<div style="display:flex;gap:8px;flex-wrap:wrap">';
        if (currentPhase > 1) {
            html += '<button class="cmmed-btn cmmed-btn-danger cmmed-btn-sm" onclick="cmMedRetrocederRTP(\'' + injuryId + '\',' + currentPhase + ')">Retroceder fase</button>';
        }
        if (currentPhase <= 6) {
            var btnLabel = currentPhase === 6 ? 'Completar protocolo' : 'Avanzar a fase ' + (currentPhase + 1);
            html += '<button class="cmmed-btn cmmed-btn-success cmmed-btn-sm" onclick="cmMedAvanzarRTP(\'' + injuryId + '\',' + currentPhase + ')">' + btnLabel + '</button>';
        }
        html += '</div>';
    }

    // Historial de fases completadas
    var completadas = phases.filter(function(p) { return p.completed_at; });
    if (completadas.length > 0) {
        html += '<div style="margin-top:14px;padding-top:12px;border-top:1px solid #334155">' +
            '<div style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:8px">Historial de fases</div>';
        completadas.forEach(function(p) {
            var phaseInfo = CM_RTP_PHASES[p.phase - 1];
            var inicio = new Date(p.started_at + 'T12:00:00').toLocaleDateString('es-ES');
            var fin = new Date(p.completed_at + 'T12:00:00').toLocaleDateString('es-ES');
            var dias = Math.round((new Date(p.completed_at) - new Date(p.started_at)) / 86400000);
            html += '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px">' +
                '<div style="width:8px;height:8px;border-radius:50%;background:' + phaseInfo.color + ';flex-shrink:0"></div>' +
                '<span style="color:#e2e8f0;font-weight:500">Fase ' + p.phase + '</span>' +
                '<span style="color:#64748b">' + inicio + ' → ' + fin + ' (' + dias + 'd)</span>' +
                (p.notes ? '<span style="color:#94a3b8"> · ' + p.notes + '</span>' : '') +
            '</div>';
        });
        html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
}

async function cmMedIniciarRTP(injuryId) {
    var hoy = new Date().toISOString().split('T')[0];
    var res = await supabaseClient.from('cm_med_rtp').insert({
        club_id: clubId, injury_id: injuryId, player_id: cmMedJugadorActual,
        phase: 1, started_at: hoy, conducted_by: usuario ? usuario.id : null
    });
    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
    showToast('Protocolo RTP iniciado - Fase 1: Reposo');
    cmMedRegistrarAudit('INSERT', 'cm_med_rtp', injuryId, 'Inicio protocolo RTP');

    // Actualizar estado de lesion a recovering
    await supabaseClient.from('cm_med_injuries').update({ status: 'recovering' }).eq('id', injuryId);
    await cmMedCambiarDisponibilidad(cmMedJugadorActual, 'red', null);

    var playerData = cmMedJugadoresData.find(function(j) { return j.playerId === cmMedJugadorActual; });
    if (playerData) cmMedNotificar('availability', playerData.name + ': Inicio RTP Fase 1', 'Reposo - Protocolo Return-to-Play iniciado', playerData.name, 'injury', injuryId);

    cmMedCargarRTP(injuryId);
}

async function cmMedAvanzarRTP(injuryId, currentPhase) {
    var notas = prompt('Notas de la transicion (opcional):') || '';
    var hoy = new Date().toISOString().split('T')[0];

    // Completar fase actual
    await supabaseClient.from('cm_med_rtp')
        .update({ completed_at: hoy, notes: notas || null })
        .eq('injury_id', injuryId).eq('phase', currentPhase).is('completed_at', null);

    var nextPhase = currentPhase + 1;

    if (nextPhase <= 6) {
        // Crear siguiente fase
        await supabaseClient.from('cm_med_rtp').insert({
            club_id: clubId, injury_id: injuryId, player_id: cmMedJugadorActual,
            phase: nextPhase, started_at: hoy, conducted_by: usuario ? usuario.id : null
        });

        var phaseInfo = CM_RTP_PHASES[nextPhase - 1];
        showToast('Avanzado a Fase ' + nextPhase + ': ' + phaseInfo.name);

        // Actualizar semaforo segun fase
        await cmMedCambiarDisponibilidad(cmMedJugadorActual, phaseInfo.semaforo, null);

        // Actualizar estado lesion
        var injStatus = nextPhase >= 5 ? 'rtp' : 'recovering';
        await supabaseClient.from('cm_med_injuries').update({ status: injStatus }).eq('id', injuryId);

        // Notificar
        var playerData = cmMedJugadoresData.find(function(j) { return j.playerId === cmMedJugadorActual; });
        if (playerData) cmMedNotificar('availability', playerData.name + ': RTP Fase ' + nextPhase, phaseInfo.name + ' - ' + phaseInfo.desc, playerData.name, 'injury', injuryId);
    } else {
        // Protocolo completado = alta
        showToast('Protocolo RTP completado - Jugador disponible');
        await supabaseClient.from('cm_med_injuries').update({
            status: 'discharged',
            discharge_date: hoy,
            actual_days_lost: Math.round((new Date() - new Date(hoy)) / 86400000)
        }).eq('id', injuryId);
        await cmMedCambiarDisponibilidad(cmMedJugadorActual, 'green', null);

        var playerData = cmMedJugadoresData.find(function(j) { return j.playerId === cmMedJugadorActual; });
        if (playerData) cmMedNotificar('discharge', playerData.name + ': RTP Completado', 'Protocolo Return-to-Play finalizado. Jugador disponible para competicion.', playerData.name, 'injury', injuryId);
    }

    cmMedRegistrarAudit('UPDATE', 'cm_med_rtp', injuryId, 'RTP avanzado a fase ' + nextPhase);
    cmMedCargarRTP(injuryId);
}

async function cmMedRetrocederRTP(injuryId, currentPhase) {
    var motivo = prompt('Motivo del retroceso:');
    if (!motivo) { showToast('Debes indicar el motivo', 'error'); return; }

    var hoy = new Date().toISOString().split('T')[0];

    // Eliminar fase actual (no completada)
    await supabaseClient.from('cm_med_rtp')
        .delete().eq('injury_id', injuryId).eq('phase', currentPhase).is('completed_at', null);

    // Reabrir fase anterior
    var prevPhase = currentPhase - 1;
    await supabaseClient.from('cm_med_rtp')
        .update({ completed_at: null, notes: 'Retroceso: ' + motivo })
        .eq('injury_id', injuryId).eq('phase', prevPhase);

    var phaseInfo = CM_RTP_PHASES[prevPhase - 1];
    showToast('Retrocedido a Fase ' + prevPhase + ': ' + phaseInfo.name);
    await cmMedCambiarDisponibilidad(cmMedJugadorActual, phaseInfo.semaforo, null);

    var playerData = cmMedJugadoresData.find(function(j) { return j.playerId === cmMedJugadorActual; });
    if (playerData) cmMedNotificar('availability', playerData.name + ': Retroceso RTP a Fase ' + prevPhase, motivo, playerData.name, 'injury', injuryId);

    cmMedRegistrarAudit('UPDATE', 'cm_med_rtp', injuryId, 'RTP retrocedido a fase ' + prevPhase + ': ' + motivo);
    cmMedCargarRTP(injuryId);
}

function cmMedMostrarFaseRTP(phase, injuryId) {
    var phaseInfo = CM_RTP_PHASES[phase - 1];
    var criterios = '';
    if (phase === 1) criterios = 'Sin dolor en reposo, inflamacion controlada';
    if (phase === 2) criterios = 'Sin dolor al caminar, ROM funcional basico';
    if (phase === 3) criterios = 'Sin dolor en carrera recta, fuerza >70% lado sano';
    if (phase === 4) criterios = 'Sin dolor en cambios de direccion, fuerza >80%, test funcional OK';
    if (phase === 5) criterios = 'Entrenamiento completo sin molestias 3 sesiones consecutivas';
    if (phase === 6) criterios = 'Aprobacion medica final, test de rendimiento >90%, sin miedo/ansiedad';

    showToast('Fase ' + phase + ': ' + phaseInfo.name + ' | Criterios: ' + criterios);
}
 // ========== CUESTIONARIO OSTRC ==========
function cmMedMostrarFormOSTRC(injuryId) {
    var container = document.getElementById('cmmed-ostrc-form-container');
    var hoy = new Date().toISOString().split('T')[0];

    container.innerHTML =
        '<div style="background:#0f172a;border:1px solid #3b82f6;border-radius:10px;padding:18px;margin-bottom:14px">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h4 style="margin:0;color:#60a5fa;font-size:15px">Evaluacion OSTRC</h4><button class="cmmed-btn cmmed-btn-secondary cmmed-btn-sm" onclick="document.getElementById(\'cmmed-ostrc-form-container\').innerHTML=\'\'">Cancelar</button></div>' +
            '<div class="cmmed-form-group"><label>Fecha de evaluacion</label><input type="date" id="cmmed-ostrc-date" value="' + hoy + '"></div>' +

            '<div style="margin-bottom:16px"><p style="color:#e2e8f0;font-size:13px;font-weight:600;margin:0 0 8px">1. ¿Ha afectado la lesion a su participacion en entrenamientos/partidos?</p>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q1" value="0" checked style="margin-right:8px">Participacion completa sin problemas</label>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q1" value="8" style="margin-right:8px">Participacion completa pero con molestias</label>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q1" value="17" style="margin-right:8px">Participacion reducida</label>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q1" value="25" style="margin-right:8px">No puede participar</label>' +
            '</div>' +

            '<div style="margin-bottom:16px"><p style="color:#e2e8f0;font-size:13px;font-weight:600;margin:0 0 8px">2. ¿En que medida ha reducido su volumen de entrenamiento?</p>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q2" value="0" checked style="margin-right:8px">Sin reduccion</label>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q2" value="6" style="margin-right:8px">Reduccion menor</label>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q2" value="13" style="margin-right:8px">Reduccion moderada</label>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q2" value="19" style="margin-right:8px">Reduccion importante</label>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q2" value="25" style="margin-right:8px">No puede entrenar</label>' +
            '</div>' +

            '<div style="margin-bottom:16px"><p style="color:#e2e8f0;font-size:13px;font-weight:600;margin:0 0 8px">3. ¿En que medida ha afectado la lesion a su rendimiento?</p>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q3" value="0" checked style="margin-right:8px">Sin efecto</label>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q3" value="6" style="margin-right:8px">Efecto menor</label>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q3" value="13" style="margin-right:8px">Efecto moderado</label>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q3" value="19" style="margin-right:8px">Efecto importante</label>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q3" value="25" style="margin-right:8px">No puede competir</label>' +
            '</div>' +

            '<div style="margin-bottom:16px"><p style="color:#e2e8f0;font-size:13px;font-weight:600;margin:0 0 8px">4. ¿En que medida ha experimentado dolor?</p>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q4" value="0" checked style="margin-right:8px">Sin dolor</label>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q4" value="6" style="margin-right:8px">Dolor leve</label>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q4" value="13" style="margin-right:8px">Dolor moderado</label>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q4" value="19" style="margin-right:8px">Dolor intenso</label>' +
                '<label style="display:block;padding:6px 0;color:#cbd5e1;font-size:13px;cursor:pointer"><input type="radio" name="ostrc_q4" value="25" style="margin-right:8px">Dolor extremo</label>' +
            '</div>' +

            '<div class="cmmed-form-group"><label>Notas</label><textarea id="cmmed-ostrc-notes" placeholder="Observaciones adicionales..."></textarea></div>' +
            '<div style="display:flex;gap:10px;justify-content:flex-end"><button class="cmmed-btn cmmed-btn-primary" onclick="cmMedGuardarOSTRC(\'' + injuryId + '\')">Guardar evaluacion</button></div>' +
        '</div>';
}

async function cmMedGuardarOSTRC(injuryId) {
    var fecha = document.getElementById('cmmed-ostrc-date').value;
    if (!fecha) { showToast('La fecha es obligatoria', 'error'); return; }

    var q1 = parseInt(document.querySelector('input[name="ostrc_q1"]:checked').value);
    var q2 = parseInt(document.querySelector('input[name="ostrc_q2"]:checked').value);
    var q3 = parseInt(document.querySelector('input[name="ostrc_q3"]:checked').value);
    var q4 = parseInt(document.querySelector('input[name="ostrc_q4"]:checked').value);
    var total = q1 + q2 + q3 + q4;

    var res = await supabaseClient.from('cm_med_ostrc').insert({
        club_id: clubId,
        injury_id: injuryId,
        player_id: cmMedJugadorActual,
        eval_date: fecha,
        q1_participation: q1,
        q2_training: q2,
        q3_performance: q3,
        q4_pain: q4,
        total_score: total,
        notes: document.getElementById('cmmed-ostrc-notes').value.trim() || null,
        conducted_by: usuario ? usuario.id : null
    }).select().single();

    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }

    showToast('OSTRC guardado · Score: ' + total + '/100');
    cmMedRegistrarAudit('INSERT', 'cm_med_ostrc', res.data.id, 'OSTRC score: ' + total);
    document.getElementById('cmmed-ostrc-form-container').innerHTML = '';
    cmMedCargarOSTRC(injuryId);
}

async function cmMedCargarOSTRC(injuryId) {
    var container = document.getElementById('cmmed-ostrc-historial');
    if (!container) return;

    var res = await supabaseClient.from('cm_med_ostrc').select('*')
        .eq('injury_id', injuryId).order('eval_date', { ascending: true });
    var evals = res.data || [];

    if (evals.length === 0) {
        container.innerHTML = '<p style="color:#64748b;font-size:13px;text-align:center;padding:14px">Sin evaluaciones OSTRC</p>';
        return;
    }

    // Mini chart de evolucion
    var chartHtml = '';
    if (evals.length >= 2) {
        chartHtml = '<div style="background:#1e293b;border-radius:8px;padding:14px;margin-bottom:10px"><canvas id="cmmed-ostrc-chart" height="120"></canvas></div>';
    }

    // Lista de evaluaciones
    var listHtml = '';
    evals.slice().reverse().forEach(function(e) {
        var fecha = new Date(e.eval_date + 'T12:00:00').toLocaleDateString('es-ES');
        var scoreColor = e.total_score <= 25 ? '#22c55e' : e.total_score <= 50 ? '#f59e0b' : e.total_score <= 75 ? '#f97316' : '#ef4444';
        var barWidth = e.total_score;

        listHtml +=
            '<div style="display:flex;align-items:center;gap:12px;padding:10px;background:#1e293b;border-radius:8px;margin-bottom:6px">' +
                '<div style="min-width:70px;text-align:center"><div style="font-size:22px;font-weight:700;color:' + scoreColor + '">' + e.total_score + '</div><div style="font-size:10px;color:#94a3b8">/100</div></div>' +
                '<div style="flex:1">' +
                    '<div style="color:#e2e8f0;font-size:13px;margin-bottom:4px">' + fecha + '</div>' +
                    '<div style="background:#0f172a;border-radius:4px;height:8px;overflow:hidden"><div style="width:' + barWidth + '%;height:100%;background:' + scoreColor + ';border-radius:4px;transition:width .3s"></div></div>' +
                    '<div style="display:flex;gap:8px;margin-top:4px;font-size:11px;color:#94a3b8">' +
                        '<span>Particip: ' + e.q1_participation + '</span>' +
                        '<span>Volumen: ' + e.q2_training + '</span>' +
                        '<span>Rendim: ' + e.q3_performance + '</span>' +
                        '<span>Dolor: ' + e.q4_pain + '</span>' +
                    '</div>' +
                    (e.notes ? '<div style="color:#94a3b8;font-size:11px;margin-top:2px">' + e.notes + '</div>' : '') +
                '</div>' +
            '</div>';
    });

    container.innerHTML = chartHtml + listHtml;

    // Dibujar chart si hay 2+ evaluaciones
    if (evals.length >= 2) {
        setTimeout(function() {
            var canvas = document.getElementById('cmmed-ostrc-chart');
            if (!canvas) return;
            var labels = evals.map(function(e) {
                var d = new Date(e.eval_date + 'T12:00:00');
                return d.getDate() + '/' + (d.getMonth() + 1);
            });
            var scores = evals.map(function(e) { return e.total_score; });

            new Chart(canvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'OSTRC Score',
                        data: scores,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59,130,246,0.1)',
                        tension: 0.3,
                        fill: true,
                        pointRadius: 5,
                        pointBackgroundColor: scores.map(function(s) {
                            return s <= 25 ? '#22c55e' : s <= 50 ? '#f59e0b' : s <= 75 ? '#f97316' : '#ef4444';
                        })
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { min: 0, max: 100, ticks: { color: '#94a3b8', stepSize: 25 }, grid: { color: '#334155' } },
                        x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } }
                    }
                }
            });
        }, 100);
    }
}
// ========== ARCHIVOS ADJUNTOS ==========
async function cmMedCargarAdjuntos(injuryId) {
    var container = document.getElementById('cmmed-adjuntos-lista');
    if (!container) return;

    var res = await supabaseClient.from('cm_med_attachments')
        .select('*').eq('injury_id', injuryId).eq('archived', false).order('created_at', { ascending: false });
    var files = res.data || [];

    if (files.length === 0) {
        container.innerHTML = '<p style="color:#64748b;font-size:13px;text-align:center;padding:14px">Sin archivos adjuntos</p>';
        return;
    }

    var html = '';
    files.forEach(function(f) {
        var fecha = new Date(f.created_at).toLocaleDateString('es-ES');
        var size = f.file_size ? (f.file_size < 1024000 ? Math.round(f.file_size / 1024) + ' KB' : (f.file_size / 1048576).toFixed(1) + ' MB') : '';
        var icon = '📄';
        if (f.file_type && f.file_type.startsWith('image/')) icon = '🖼️';
        if (f.file_type && f.file_type.includes('pdf')) icon = '📕';
        var catLabels = { mri: 'RMN', ultrasound: 'Ecografia', xray: 'Radiografia', report: 'Informe', photo: 'Foto', other: 'Otro' };

        html +=
            '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:#1e293b;border-radius:8px;margin-bottom:6px">' +
                '<span style="font-size:22px">' + icon + '</span>' +
                '<div style="flex:1;min-width:0">' +
                    '<div style="color:#e2e8f0;font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + f.file_name + '</div>' +
                    '<div style="color:#94a3b8;font-size:11px">' + fecha + ' · ' + size + (f.category ? ' · ' + (catLabels[f.category] || f.category) : '') + '</div>' +
                    (f.description ? '<div style="color:#94a3b8;font-size:11px;margin-top:2px">' + f.description + '</div>' : '') +
                '</div>' +
                '<button class="cmmed-btn cmmed-btn-primary cmmed-btn-sm" onclick="cmMedDescargarArchivo(\'' + f.id + '\',\'' + f.storage_path.replace(/'/g, "\\'") + '\',\'' + f.file_name.replace(/'/g, "\\'") + '\')">Ver</button>' +
            '</div>';
    });

    container.innerHTML = html;
}

async function cmMedSubirArchivo(injuryId) {
    var input = document.getElementById('cmmed-file-input');
    if (!input || !input.files || input.files.length === 0) return;

    var playerId = cmMedJugadorActual;
    var totalFiles = input.files.length;
    var uploaded = 0;

    for (var i = 0; i < totalFiles; i++) {
        var file = input.files[i];
        if (file.size > 10485760) {
            showToast('Archivo demasiado grande (max 10MB): ' + file.name, 'error');
            continue;
        }

        // Ruta: club_id/player_id/injury_id/timestamp_filename
        var timestamp = Date.now();
        var safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        var path = clubId + '/' + playerId + '/' + injuryId + '/' + timestamp + '_' + safeName;

        // Subir a Supabase Storage
        var upRes = await supabaseClient.storage.from('medical-files').upload(path, file);
        if (upRes.error) {
            console.error('Error subiendo:', upRes.error);
            showToast('Error al subir ' + file.name + ': ' + upRes.error.message, 'error');
            continue;
        }

        // Registrar en la tabla
        var insRes = await supabaseClient.from('cm_med_attachments').insert({
            club_id: clubId,
            injury_id: injuryId,
            player_id: playerId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: path,
            category: cmMedDetectarCategoria(file.name, file.type),
            uploaded_by: usuario ? usuario.id : null
        });

        if (insRes.error) {
            console.error('Error registrando:', insRes.error);
        } else {
            uploaded++;
            cmMedRegistrarAudit('INSERT', 'cm_med_attachments', injuryId, 'Subio archivo: ' + file.name);
        }
    }

    input.value = '';
    if (uploaded > 0) {
        showToast(uploaded + ' archivo' + (uploaded > 1 ? 's subidos' : ' subido'));
        cmMedCargarAdjuntos(injuryId);
    }
}

async function cmMedDescargarArchivo(attachmentId, storagePath, fileName) {
    var res = await supabaseClient.storage.from('medical-files').createSignedUrl(storagePath, 3600);
    if (res.error || !res.data || !res.data.signedUrl) {
        showToast('Error al obtener el archivo', 'error');
        return;
    }
    window.open(res.data.signedUrl, '_blank');
    cmMedRegistrarAudit('SELECT', 'cm_med_attachments', attachmentId, 'Descargo archivo: ' + fileName);
}

function cmMedDetectarCategoria(name, type) {
    var n = name.toLowerCase();
    if (n.includes('rmn') || n.includes('mri') || n.includes('resonancia')) return 'mri';
    if (n.includes('eco') || n.includes('ultrasound')) return 'ultrasound';
    if (n.includes('rx') || n.includes('xray') || n.includes('radiografia')) return 'xray';
    if (n.includes('informe') || n.includes('report')) return 'report';
    if (type && type.startsWith('image/')) return 'photo';
    return 'other';
}
// ========== DASHBOARD MÉDICO ==========
function cmMedVistaJugadores() {
    document.getElementById('cmmed-player-grid').style.display = '';
    document.getElementById('cmmed-stats-bar').style.display = '';
    var fc = document.getElementById('cmmed-filter-count'); if(fc) fc.style.display = '';
    document.getElementById('cmmed-dashboard').style.display = 'none';
    document.getElementById('cmmed-btn-jugadores').style.opacity = '0.5';
    document.getElementById('cmmed-btn-dashboard').style.opacity = '1';
    document.getElementById('cmmed-btn-jugadores').className = 'cmmed-btn cmmed-btn-primary cmmed-btn-sm';
    document.getElementById('cmmed-btn-dashboard').className = 'cmmed-btn cmmed-btn-secondary cmmed-btn-sm';
}

async function cmMedVistaDashboard() {
    document.getElementById('cmmed-player-grid').style.display = 'none';
    document.getElementById('cmmed-stats-bar').style.display = 'none';
    var fc = document.getElementById('cmmed-filter-count'); if(fc) fc.style.display = 'none';
    document.getElementById('cmmed-dashboard').style.display = 'block';
    document.getElementById('cmmed-btn-dashboard').style.opacity = '0.5';
    document.getElementById('cmmed-btn-jugadores').style.opacity = '1';
    document.getElementById('cmmed-btn-dashboard').className = 'cmmed-btn cmmed-btn-primary cmmed-btn-sm';
    document.getElementById('cmmed-btn-jugadores').className = 'cmmed-btn cmmed-btn-secondary cmmed-btn-sm';
    await cmMedRenderDashboard();
}

async function cmMedRenderDashboard() {
    var container = document.getElementById('cmmed-dashboard');
    container.innerHTML = '<div class="cmmed-empty"><div class="icon">⏳</div><p>Calculando metricas...</p></div>';

    // Cargar TODAS las lesiones del club (no solo activas)
    var injRes = await supabaseClient.from('cm_med_injuries')
        .select('*, cm_med_osiics_codes(description_es, body_region), cm_med_body_zones(zone_name_es, body_area)')
        .eq('club_id', clubId).eq('archived', false).order('injury_date', { ascending: false });
    var injuries = injRes.data || [];

    // Cargar disponibilidad
    var availRes = await supabaseClient.from('club_player_availability').select('status').eq('club_id', clubId);
    var avails = availRes.data || [];

    // ===== KPIs =====
    var totalInjuries = injuries.length;
    var activeNow = injuries.filter(function(i) { return i.status === 'active' || i.status === 'recovering'; }).length;
    var discharged = injuries.filter(function(i) { return i.status === 'discharged'; });
    var totalDaysLost = discharged.reduce(function(sum, i) { return sum + (i.actual_days_lost || 0); }, 0);
    var avgDaysLost = discharged.length > 0 ? Math.round(totalDaysLost / discharged.length) : 0;
    var recurrences = injuries.filter(function(i) { return i.is_recurrence; }).length;
    var recurrenceRate = totalInjuries > 0 ? Math.round((recurrences / totalInjuries) * 100) : 0;
    var availGreen = avails.filter(function(a) { return a.status === 'green'; }).length;
    var availTotal = cmMedJugadoresData.length || avails.length || 1;
    var availPercent = Math.round((availGreen / availTotal) * 100);

    // ===== Datos para graficos =====
    // Lesiones por mes
    var byMonth = {};
    injuries.forEach(function(i) {
        var m = i.injury_date ? i.injury_date.substring(0, 7) : 'unknown';
        byMonth[m] = (byMonth[m] || 0) + 1;
    });
    var monthLabels = Object.keys(byMonth).sort();
    var monthData = monthLabels.map(function(m) { return byMonth[m]; });
    var monthLabelsFormatted = monthLabels.map(function(m) {
        var parts = m.split('-');
        var meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        return meses[parseInt(parts[1])-1] + ' ' + parts[0].substring(2);
    });

    // Zonas mas afectadas
    var byZone = {};
    injuries.forEach(function(i) {
        var z = i.cm_med_body_zones ? i.cm_med_body_zones.zone_name_es : 'No especificada';
        byZone[z] = (byZone[z] || 0) + 1;
    });
    var zonePairs = Object.entries(byZone).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 10);
    var zoneLabels = zonePairs.map(function(p) { return p[0]; });
    var zoneData = zonePairs.map(function(p) { return p[1]; });

    // Severidad
    var bySeverity = { minimal: 0, mild: 0, moderate: 0, severe: 0, unknown: 0 };
    injuries.forEach(function(i) { bySeverity[i.severity || 'unknown']++; });
    var sevLabels = ['Minima (1-3d)', 'Leve (4-7d)', 'Moderada (8-28d)', 'Severa (+28d)', 'Sin clasificar'];
    var sevData = [bySeverity.minimal, bySeverity.mild, bySeverity.moderate, bySeverity.severe, bySeverity.unknown];
    var sevColors = ['#22c55e', '#84cc16', '#f59e0b', '#ef4444', '#64748b'];

    // Mecanismo
    var byMechanism = { contact: 0, non_contact: 0, overuse: 0, illness: 0, unknown: 0 };
    injuries.forEach(function(i) { byMechanism[i.mechanism || 'unknown']++; });
    var mechLabels = ['Contacto', 'Sin contacto', 'Sobrecarga', 'Enfermedad', 'No especificado'];
    var mechData = [byMechanism.contact, byMechanism.non_contact, byMechanism.overuse, byMechanism.illness, byMechanism.unknown];
    var mechColors = ['#ef4444', '#3b82f6', '#f59e0b', '#a855f7', '#64748b'];

    // ===== RENDER =====
    container.innerHTML =
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:20px">' +
            '<div style="background:#1e293b;border-radius:10px;padding:14px;text-align:center;border:1px solid #334155"><div style="font-size:28px;font-weight:700;color:#60a5fa">' + totalInjuries + '</div><div style="font-size:11px;color:#94a3b8;margin-top:2px">Total lesiones</div></div>' +
            '<div style="background:#1e293b;border-radius:10px;padding:14px;text-align:center;border:1px solid #334155"><div style="font-size:28px;font-weight:700;color:#ef4444">' + activeNow + '</div><div style="font-size:11px;color:#94a3b8;margin-top:2px">Activas ahora</div></div>' +
            '<div style="background:#1e293b;border-radius:10px;padding:14px;text-align:center;border:1px solid #334155"><div style="font-size:28px;font-weight:700;color:#f59e0b">' + avgDaysLost + '</div><div style="font-size:11px;color:#94a3b8;margin-top:2px">Media dias baja</div></div>' +
            '<div style="background:#1e293b;border-radius:10px;padding:14px;text-align:center;border:1px solid #334155"><div style="font-size:28px;font-weight:700;color:#a855f7">' + totalDaysLost + '</div><div style="font-size:11px;color:#94a3b8;margin-top:2px">Total dias perdidos</div></div>' +
            '<div style="background:#1e293b;border-radius:10px;padding:14px;text-align:center;border:1px solid #334155"><div style="font-size:28px;font-weight:700;color:#f97316">' + recurrenceRate + '%</div><div style="font-size:11px;color:#94a3b8;margin-top:2px">Tasa recurrencia</div></div>' +
            '<div style="background:#1e293b;border-radius:10px;padding:14px;text-align:center;border:1px solid #334155"><div style="font-size:28px;font-weight:700;color:#22c55e">' + availPercent + '%</div><div style="font-size:11px;color:#94a3b8;margin-top:2px">Disponibilidad</div></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">' +
            '<div style="background:#1e293b;border-radius:10px;padding:16px;border:1px solid #334155"><h4 style="margin:0 0 12px;color:#e2e8f0;font-size:14px">Lesiones por mes</h4><canvas id="cmmed-chart-monthly"></canvas></div>' +
            '<div style="background:#1e293b;border-radius:10px;padding:16px;border:1px solid #334155"><h4 style="margin:0 0 12px;color:#e2e8f0;font-size:14px">Zonas mas afectadas</h4><canvas id="cmmed-chart-zones"></canvas></div>' +
            '<div style="background:#1e293b;border-radius:10px;padding:16px;border:1px solid #334155"><h4 style="margin:0 0 12px;color:#e2e8f0;font-size:14px">Severidad</h4><canvas id="cmmed-chart-severity"></canvas></div>' +
            '<div style="background:#1e293b;border-radius:10px;padding:16px;border:1px solid #334155"><h4 style="margin:0 0 12px;color:#e2e8f0;font-size:14px">Mecanismo de lesion</h4><canvas id="cmmed-chart-mechanism"></canvas></div>' +
        '</div>';

    // ===== DIBUJAR CHARTS =====
    setTimeout(function() {
        // Lesiones por mes (line)
        new Chart(document.getElementById('cmmed-chart-monthly'), {
            type: 'line',
            data: { labels: monthLabelsFormatted, datasets: [{ label: 'Lesiones', data: monthData, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', tension: 0.3, fill: true, pointRadius: 4, pointBackgroundColor: '#3b82f6' }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: '#1e293b' } }, y: { beginAtZero: true, ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: '#334155' } } } }
        });

        // Zonas (horizontal bar)
        new Chart(document.getElementById('cmmed-chart-zones'), {
            type: 'bar',
            data: { labels: zoneLabels, datasets: [{ data: zoneData, backgroundColor: '#3b82f6', borderRadius: 4 }] },
            options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: '#334155' } }, y: { ticks: { color: '#e2e8f0', font: { size: 11 } }, grid: { display: false } } } }
        });

        // Severidad (doughnut)
        new Chart(document.getElementById('cmmed-chart-severity'), {
            type: 'doughnut',
            data: { labels: sevLabels, datasets: [{ data: sevData, backgroundColor: sevColors, borderWidth: 0 }] },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 } } } }
        });

        // Mecanismo (doughnut)
        new Chart(document.getElementById('cmmed-chart-mechanism'), {
            type: 'doughnut',
            data: { labels: mechLabels, datasets: [{ data: mechData, backgroundColor: mechColors, borderWidth: 0 }] },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 } } } }
        });
    }, 100);
}
// ========== NOTIFICACIONES INTERNAS ==========
async function cmMedNotificar(type, title, message, playerName, relatedType, relatedId) {
    console.log('NOTIFICAR:', type, title);
    try {
        var res = await supabaseClient.from('cm_notifications').insert({
            club_id: clubId,
            type: type,
            title: title,
            message: message || null,
            icon: type === 'injury_new' ? 'injury' : type === 'discharge' ? 'check' : type === 'availability' ? 'semaphore' : 'bell',
            player_name: playerName || null,
            related_type: relatedType || null,
            related_id: relatedId || null,
            target_permission: 'entrenamientos',
            created_by: usuario ? usuario.id : null
        });
        console.log('NOTIF RESULTADO:', res.error ? res.error.message : 'OK');
    } catch (e) { console.error('Error creando notificacion:', e); }
}
// ========== AUTO-MONTAJE ==========
(function cmMedAutoMontar() {
    var intentos = 0;
    var intervalo = setInterval(function() {
        intentos++;
        if (intentos > 20) { clearInterval(intervalo); return; }
        if (typeof cmState === 'undefined' || !cmState.activo) return;
        if (!cmPuedeVer('modulo_medico')) { clearInterval(intervalo); return; }
        clearInterval(intervalo);

        if (document.getElementById('cm-tab-medico')) return;
        var mainTabs = document.querySelector('.main-tabs');
        if (!mainTabs) return;

        var tab = document.createElement('button');
        tab.className = 'main-tab';
        tab.id = 'cm-tab-medico';
        tab.setAttribute('onclick', "cambiarModulo('medico', this)");
        tab.innerHTML = '<span class="tab-icon">🏥</span><span>Medico</span>';
        mainTabs.appendChild(tab);

        if (!document.getElementById('modulo-medico')) {
            var vista = document.createElement('div');
            vista.className = 'vista-modulo';
            vista.id = 'modulo-medico';
            var ultModulo = document.querySelector('.vista-modulo:last-of-type');
            if (ultModulo && ultModulo.parentElement) { ultModulo.parentElement.insertBefore(vista, ultModulo.nextSibling); }
            else { document.body.appendChild(vista); }
        }

        if (typeof registrarModulo === 'function') { registrarModulo('medico', function() { cmMedInit('modulo-medico'); }); }

        var pd = document.getElementById('cm-pantalla-desarrollo');
        if (pd) { pd.style.display = 'none'; var mt = document.querySelector('.main-tabs'); if (mt) mt.style.display = ''; document.querySelectorAll('.vista-modulo').forEach(function(v) { v.style.display = ''; }); }

        var tv = Array.from(document.querySelectorAll('.main-tab')).filter(function(t) { return t.style.display !== 'none'; });
        if (tv.length === 1 && tv[0].id === 'cm-tab-medico') { cambiarModulo('medico', tab); }

        console.log('[Panel Medico] Auto-montado y registrado');
    }, 500);
})();
