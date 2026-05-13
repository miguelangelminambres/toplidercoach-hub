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
        '<div class="cmmed-form-row"><div class="cmmed-form-group"><label>Zona corporal *</label><select id="cmmed-inj-zone"><option value="">-- Seleccionar zona --</option>'+zoneOpts+'</select></div><div class="cmmed-form-group"><label>Codigo OSIICS</label><select id="cmmed-inj-osiics"><option value="">-- Seleccionar diagnostico --</option>'+osiicsOpts+'</select></div></div>' +
        '<div class="cmmed-form-row"><div class="cmmed-form-group"><label>Contexto</label><select id="cmmed-inj-context"><option value="">-- Seleccionar --</option><option value="match">Partido</option><option value="training">Entrenamiento</option><option value="other">Otro</option></select></div><div class="cmmed-form-group"><label>Severidad estimada</label><select id="cmmed-inj-severity"><option value="">-- Seleccionar --</option><option value="minimal">Minima (1-3 dias)</option><option value="mild">Leve (4-7 dias)</option><option value="moderate">Moderada (8-28 dias)</option><option value="severe">Severa (+28 dias)</option></select></div></div>' +
        '<div class="cmmed-form-group"><label>Dias estimados de baja</label><input type="number" id="cmmed-inj-days" placeholder="Ej: 14" min="1"></div>' +
        '<div class="cmmed-form-group"><label>Descripcion / observaciones</label><textarea id="cmmed-inj-desc" placeholder="Descripcion de la lesion, circunstancias..."></textarea></div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px"><button class="cmmed-btn cmmed-btn-primary" onclick="cmMedGuardarLesion()">Registrar lesion</button></div></div>';
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
        '<button class="cmmed-btn cmmed-btn-secondary cmmed-btn-sm" onclick="cmMedCargarLesiones(\''+cmMedJugadorActual+'\')" style="margin-bottom:14px">← Volver a lesiones</button>' +
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
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h4 style="margin:0;color:#e2e8f0">Sesiones de tratamiento</h4><button class="cmmed-btn cmmed-btn-primary cmmed-btn-sm" onclick="cmMedMostrarFormSesion(\''+inj.id+'\')">+ Nueva sesion SOAP</button></div>' +
        '<div id="cmmed-form-sesion-container"></div>' + sesHtml;
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
    cmMedRegistrarAudit('UPDATE', 'club_player_availability', playerId, 'Disponibilidad: ' + status);
}


// ========== AUDIT ==========
async function cmMedRegistrarAudit(action, tableName, recordId, details) {
    try {
        await supabaseClient.from('cm_med_audit').insert({ club_id: clubId, wp_user_id: usuario ? usuario.id : 0,
            player_id: (tableName !== 'club_player_availability' && recordId) ? recordId : null,
            action: action, table_name: tableName, record_id: String(recordId || ''), details: details || null });
    } catch (e) { console.warn('Audit log error:', e); }
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
