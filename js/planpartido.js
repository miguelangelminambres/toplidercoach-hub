// ========== PLANPARTIDO.JS - TopLiderCoach HUB ==========
// Plan de partido — Preparacion semanal pre-partido
// Archivo independiente — no modifica ningun otro modulo

// =============================================
// ESTADO
// =============================================
var pp = {
    planActual: null,
    partidoActual: null,
    rivalActual: null,
    jugadorEditIdx: -1,
    semana: { dias: [], sesiones: [], microciclo: null },
    objEditIdx: -1
};

var PP_POSICIONES = ['Portero','Lateral Dcho.','Lateral Izdo.','Central','Central Dcho.','Central Izdo.','LT Dcho.','LT Izdo.','Mediocentro','MCD','MCO','Mediapunta','Interior','Ext Dcho.','Ext Izdo.','Delantero','2º Punta'];
var PP_LINEAS = {
    porteros: { label: 'Porteros', color: '#22c55e', posiciones: ['Portero'] },
    defensas: { label: 'Linea defensiva', color: '#3b82f6', posiciones: ['Lateral Dcho.','Lateral Izdo.','Central','Central Dcho.','Central Izdo.','LT Dcho.','LT Izdo.'] },
    medios: { label: 'Linea medio campo', color: '#f59e0b', posiciones: ['Mediocentro','MCD','MCO','Mediapunta','Interior'] },
    delanteros: { label: 'Linea delanteros', color: '#ef4444', posiciones: ['Ext Dcho.','Ext Izdo.','Delantero','2º Punta'] }
};

var PP_FASES_DEFAULT = [
    { id: 'fo_saque', title: 'Fase ofensiva: saque portero', notes: '', media: [] },
    { id: 'fo_posicional', title: 'Fase ofensiva: ataque posicional', notes: '', media: [] },
    { id: 'tad', title: 'Transicion ataque - defensa', notes: '', media: [] },
    { id: 'fd_saque', title: 'Fase defensiva: saque portero rival', notes: '', media: [] },
    { id: 'fd_posicional', title: 'Fase defensiva: defensa posicional', notes: '', media: [] },
    { id: 'tda', title: 'Transicion defensa - ataque', notes: '', media: [] }
];

var PP_ORIENTACIONES = ['Descanso','Introduccion Aerobica','Fuerza','Resistencia','Velocidad','Activacion','Tactica','Recuperacion'];
var PP_TIPOS_OBJ = [
    { id: 'ofensivo', label: 'Ofensivo', color: '#22c55e' },
    { id: 'defensivo', label: 'Defensivo', color: '#3b82f6' },
    { id: 'transiciones', label: 'Transiciones', color: '#f59e0b' },
    { id: 'abp', label: 'ABP', color: '#a855f7' },
    { id: 'fisico', label: 'Fisico', color: '#ef4444' },
    { id: 'otro', label: 'Otro', color: '#64748b' }
];
var PP_MAX_MEDIA_POR_FASE = 8;

// =============================================
// INIT
// =============================================
function initPlanPartido() {
    var root = document.getElementById('planpartido-root');
    if (!root) return;
    ppRenderMain();
    ppCargarPartidosPendientes();
}

// =============================================
// RENDER PRINCIPAL
// =============================================
function ppRenderMain() {
    var root = document.getElementById('planpartido-root');
    if (!root) return;

    root.innerHTML = '' +
    '<div style="max-width:1200px;margin:0 auto;padding:10px 0">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">' +
            '<h2 style="margin:0;font-size:20px;color:#e2e8f0">📋 Plan de Partido</h2>' +
            '<div id="pp-status-badge"></div>' +
        '</div>' +
        '<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:16px;margin-bottom:16px">' +
            '<label style="font-size:13px;color:#9ca3af;display:block;margin-bottom:6px">Selecciona el proximo partido:</label>' +
            '<select id="pp-partido-select" onchange="ppSeleccionarPartido()" style="width:100%;padding:10px 14px;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:14px">' +
                '<option value="">-- Elige un partido pendiente --</option>' +
            '</select>' +
        '</div>' +
        '<div id="pp-contenido" style="display:none"></div>' +
    '</div>';
}

// =============================================
// CARGAR PARTIDOS PENDIENTES
// =============================================
async function ppCargarPartidosPendientes() {
    if (!clubId || !seasonId) return;
    var select = document.getElementById('pp-partido-select');
    if (!select) return;
    try {
        var { data: partidos, error } = await supabaseClient
            .from('matches').select('*').eq('club_id', clubId).eq('season_id', seasonId)
            .is('result', null).order('match_date', { ascending: true });
        if (error) throw error;
        if (!partidos || partidos.length === 0) { select.innerHTML = '<option value="">-- No hay partidos pendientes --</option>'; return; }
        var html = '<option value="">-- Elige un partido pendiente --</option>';
        partidos.forEach(function(p) {
            var fecha = new Date(p.match_date + 'T12:00:00');
            var diaSem = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'][fecha.getDay()];
            var fechaStr = diaSem + ' ' + fecha.getDate() + '/' + (fecha.getMonth()+1);
            var esLocal = p.home_away === 'home';
            var hora = p.kick_off_time ? ' ' + p.kick_off_time.slice(0,5) : '';
            var comp = p.competition ? ' · ' + p.competition : '';
            html += '<option value="' + p.id + '">' + fechaStr + hora + ' — ' + (esLocal ? 'vs ' : '@ ') + p.opponent + comp + '</option>';
        });
        select.innerHTML = html;
    } catch(err) { showToast('Error cargando partidos: ' + err.message); }
}

// =============================================
// SELECCIONAR PARTIDO
// =============================================
async function ppSeleccionarPartido() {
    var select = document.getElementById('pp-partido-select');
    var matchId = select.value;
    var contenido = document.getElementById('pp-contenido');
    if (!matchId) { contenido.style.display = 'none'; pp.planActual = null; pp.partidoActual = null; ppRenderStatusBadge(); return; }
    contenido.style.display = 'block';
    contenido.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b">Cargando plan de partido...</div>';
    try {
        var { data: partido, error: errP } = await supabaseClient.from('matches').select('*').eq('id', matchId).single();
        if (errP) throw errP;
        pp.partidoActual = partido;
        var { data: rival } = await supabaseClient.from('opponents').select('*').eq('club_id', clubId).eq('name', partido.opponent).single();
        pp.rivalActual = rival || null;
        var { data: plan, error: errPlan } = await supabaseClient.from('match_plans').select('*').eq('match_id', matchId).single();
        if (errPlan && errPlan.code === 'PGRST116') {
            var { data: nuevoPlan, error: errNew } = await supabaseClient.from('match_plans')
                .insert({ club_id: clubId, season_id: seasonId, match_id: matchId, status: 'draft' }).select().single();
            if (errNew) throw errNew;
            plan = nuevoPlan;
            showToast('Plan de partido creado');
        } else if (errPlan) { throw errPlan; }
        pp.planActual = plan;
        ppRenderContenido();
    } catch(err) { contenido.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444">Error: ' + err.message + '</div>'; }
}

// =============================================
// RENDER CABECERA
// =============================================
function ppRenderCabecera() {
    var p = pp.partidoActual;
    if (!p) return '';
    var fecha = new Date(p.match_date + 'T12:00:00');
    var fechaLarga = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var esLocal = p.home_away === 'home';
    var hora = p.kick_off_time ? p.kick_off_time.slice(0,5) : '';
    var comp = p.competition || '';
    var estadio = p.stadium || '';
    var escudoRival = (pp.rivalActual && pp.rivalActual.logo_url) ? '<img src="' + pp.rivalActual.logo_url + '" style="width:48px;height:48px;object-fit:contain;border-radius:8px">' : '<div style="width:48px;height:48px;background:#1e293b;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px">🛡️</div>';
    var escudoPropio = (clubData && clubData.logo_url) ? '<img src="' + clubData.logo_url + '" style="width:48px;height:48px;object-fit:contain;border-radius:8px">' : '<div style="width:48px;height:48px;background:#1e293b;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px">🏠</div>';
    var equipoLocal = esLocal ? ((clubData && clubData.name) || 'Mi Equipo') : p.opponent;
    var equipoVisitante = esLocal ? p.opponent : ((clubData && clubData.name) || 'Mi Equipo');
    var escudoIzq = esLocal ? escudoPropio : escudoRival;
    var escudoDir = esLocal ? escudoRival : escudoPropio;
    return '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e3a5f;border-radius:12px;padding:20px;margin-bottom:16px"><div style="display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap"><div style="text-align:center">' + escudoIzq + '<div style="font-size:14px;font-weight:700;color:#e2e8f0;margin-top:6px">' + equipoLocal + '</div></div><div style="text-align:center;padding:0 10px"><div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px">' + comp + '</div><div style="font-size:24px;font-weight:700;color:#f59e0b;margin:4px 0">VS</div><div style="font-size:13px;color:#94a3b8">' + fechaLarga + '</div>' + (hora ? '<div style="font-size:13px;color:#94a3b8">' + hora + 'h' + (estadio ? ' · ' + estadio : '') + '</div>' : '') + '</div><div style="text-align:center">' + escudoDir + '<div style="font-size:14px;font-weight:700;color:#e2e8f0;margin-top:6px">' + equipoVisitante + '</div></div></div></div>';
}

// =============================================
// STATUS BADGE
// =============================================
function ppRenderStatusBadge() {
    var badge = document.getElementById('pp-status-badge');
    if (!badge) return;
    if (!pp.planActual) { badge.innerHTML = ''; return; }
    var s = pp.planActual.status;
    var colores = { draft: { bg:'#1e293b', border:'#475569', text:'#94a3b8', label:'📝 Borrador' }, ready: { bg:'#052e16', border:'#15803d', text:'#4ade80', label:'✅ Listo' }, presented: { bg:'#172554', border:'#1d4ed8', text:'#60a5fa', label:'📊 Presentado' } };
    var c = colores[s] || colores.draft;
    badge.innerHTML = '<div style="display:flex;align-items:center;gap:8px"><span style="padding:5px 14px;background:' + c.bg + ';border:1px solid ' + c.border + ';color:' + c.text + ';border-radius:20px;font-size:12px;font-weight:600">' + c.label + '</span><select onchange="ppCambiarEstado(this.value)" style="padding:5px 8px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#94a3b8;font-size:11px"><option value="draft"' + (s === 'draft' ? ' selected' : '') + '>Borrador</option><option value="ready"' + (s === 'ready' ? ' selected' : '') + '>Listo</option><option value="presented"' + (s === 'presented' ? ' selected' : '') + '>Presentado</option></select></div>';
}

async function ppCambiarEstado(nuevoEstado) {
    if (!pp.planActual) return;
    try {
        var { error } = await supabaseClient.from('match_plans').update({ status: nuevoEstado, updated_at: new Date().toISOString() }).eq('id', pp.planActual.id);
        if (error) throw error;
        pp.planActual.status = nuevoEstado;
        ppRenderStatusBadge();
        showToast('Estado actualizado: ' + nuevoEstado);
    } catch(err) { showToast('Error: ' + err.message); }
}

// =============================================
// RENDER CONTENIDO PRINCIPAL + TABS
// =============================================
function ppRenderContenido() {
    var contenido = document.getElementById('pp-contenido');
    if (!contenido) return;
    ppRenderStatusBadge();
    var html = ppRenderCabecera();
    html += '<div id="pp-tabs" style="display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap">';
    html += ppTabBtn('scouting', '🔍 Scouting', true);
    html += ppTabBtn('jugadores', '👤 Jugadores rival', false);
    html += ppTabBtn('fases', '⚽ Momentos juego', false);
    html += ppTabBtn('tactica', '⚔️ Plan tactico', false);
    html += ppTabBtn('semana', '📅 Semana', false);
    html += ppTabBtn('contenido', '🎯 Contenido', false);
    html += '</div><div id="pp-tab-content"></div>';
    contenido.innerHTML = html;
    ppMostrarTab('scouting');
}

function ppTabBtn(id, label, activo) {
    return '<button onclick="ppMostrarTab(\'' + id + '\')" id="pp-tab-' + id + '" style="padding:8px 16px;border-radius:8px;border:1px solid ' + (activo ? '#3b82f6' : '#334155') + ';background:' + (activo ? '#1e3a5f' : '#0f172a') + ';color:' + (activo ? '#93c5fd' : '#9ca3af') + ';font-size:13px;font-weight:600;cursor:pointer">' + label + '</button>';
}

function ppMostrarTab(tabId) {
    var tabs = ['scouting','jugadores','fases','tactica','semana','contenido'];
    tabs.forEach(function(t) {
        var btn = document.getElementById('pp-tab-' + t);
        if (btn) { var a = t === tabId; btn.style.borderColor = a ? '#3b82f6' : '#334155'; btn.style.background = a ? '#1e3a5f' : '#0f172a'; btn.style.color = a ? '#93c5fd' : '#9ca3af'; }
    });
    var area = document.getElementById('pp-tab-content');
    if (!area) return;
    switch(tabId) {
        case 'scouting': area.innerHTML = ppRenderScouting(); break;
        case 'jugadores': area.innerHTML = ppRenderJugadores(); break;
        case 'fases': area.innerHTML = ppRenderFases(); break;
        case 'tactica': area.innerHTML = ppRenderTactica(); break;
        case 'semana': area.innerHTML = '<div style="text-align:center;padding:30px;color:#64748b">Cargando semana...</div>'; ppCargarSemana(); break;
        case 'contenido': area.innerHTML = ppRenderContenidos(); break;
    }
}

// =============================================
// TAB: SCOUTING
// =============================================
function ppRenderScouting() {
    var plan = pp.planActual;
    return '<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:20px"><h3 style="margin:0 0 16px;color:#e2e8f0;font-size:16px">🔍 Scouting del rival</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px"><div><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">Formacion esperada</label>' + ppSelectFormacion('pp-rival-formation', plan.rival_formation, "ppGuardarCampo('rival_formation', this.value)") + '</div><div><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">Estilo de juego</label><input type="text" id="pp-rival-style" value="' + ppEsc(plan.rival_style) + '" onchange="ppGuardarCampo(\'rival_style\', this.value)" placeholder="Ej: Juego directo, repliegue bajo..." style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:14px"></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">💪 Puntos fuertes del rival</label><textarea id="pp-rival-strengths" onchange="ppGuardarCampo(\'rival_strengths\', this.value)" rows="4" placeholder="¿Que hacen bien?" style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;resize:vertical">' + ppEsc(plan.rival_strengths) + '</textarea></div><div><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">📉 Puntos debiles del rival</label><textarea id="pp-rival-weaknesses" onchange="ppGuardarCampo(\'rival_weaknesses\', this.value)" rows="4" placeholder="¿Donde podemos hacerles dano?" style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;resize:vertical">' + ppEsc(plan.rival_weaknesses) + '</textarea></div></div></div>';
}

// =============================================
// TAB: JUGADORES RIVAL (FASE 2)
// =============================================
function ppRenderJugadores() {
    var plan = pp.planActual;
    var jugadores = plan.rival_players || [];
    var html = '<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:20px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px"><h3 style="margin:0;color:#e2e8f0;font-size:16px">👤 Jugadores del rival <span style="font-size:13px;color:#64748b;font-weight:400">(' + jugadores.length + ')</span></h3><button onclick="ppAbrirFormJugador(-1)" style="padding:8px 16px;background:#3b82f6;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">+ Añadir jugador</button></div><div id="pp-jugador-form-area" style="display:none;margin-bottom:16px"></div>';
    var lineas = ['porteros','defensas','medios','delanteros'];
    lineas.forEach(function(lineaKey) {
        var linea = PP_LINEAS[lineaKey]; var jugLinea = [];
        jugadores.forEach(function(j, idx) { if (linea.posiciones.indexOf(j.position) >= 0) jugLinea.push({ jugador: j, idx: idx }); });
        html += '<div style="margin-bottom:16px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="width:4px;height:18px;background:' + linea.color + ';border-radius:2px"></div><span style="font-size:13px;font-weight:600;color:' + linea.color + ';text-transform:uppercase;letter-spacing:0.5px">' + linea.label + '</span><span style="font-size:11px;color:#64748b">(' + jugLinea.length + ')</span></div>';
        if (jugLinea.length === 0) { html += '<div style="padding:12px;background:#1e293b;border-radius:8px;color:#475569;font-size:12px;text-align:center">Sin jugadores en esta linea</div>'; }
        else { html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px">'; jugLinea.forEach(function(item) { html += ppRenderJugadorCard(item.jugador, item.idx); }); html += '</div>'; }
        html += '</div>';
    });
    var sinPos = []; jugadores.forEach(function(j, idx) { var en = false; Object.keys(PP_LINEAS).forEach(function(k) { if (PP_LINEAS[k].posiciones.indexOf(j.position) >= 0) en = true; }); if (!en) sinPos.push({ jugador: j, idx: idx }); });
    if (sinPos.length > 0) { html += '<div style="margin-bottom:16px"><div style="font-size:13px;font-weight:600;color:#9ca3af;margin-bottom:8px">Sin posicion asignada</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px">'; sinPos.forEach(function(item) { html += ppRenderJugadorCard(item.jugador, item.idx); }); html += '</div></div>'; }
    html += '</div>'; return html;
}

function ppRenderJugadorCard(j, idx) {
    var statsText = '';
    if (j.games || j.minutes || j.goals) { var p = []; if (j.games) p.push('PJ:'+j.games); if (j.minutes) p.push(j.minutes+"'"); if (j.goals) p.push(j.goals+' gol'+(j.goals>1?'es':'')); statsText = p.join(' · '); }
    return '<div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:12px;cursor:pointer;transition:border-color 0.2s" onclick="ppAbrirFormJugador(' + idx + ')" onmouseenter="this.style.borderColor=\'#3b82f6\'" onmouseleave="this.style.borderColor=\'#334155\'"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><div style="width:32px;height:32px;background:#0f172a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#f59e0b;flex-shrink:0">' + (j.number || '?') + '</div><div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + ppEsc(j.name || 'Sin nombre') + (j.year ? ' <span style="color:#64748b;font-weight:400;font-size:11px">(' + j.year + ')</span>' : '') + '</div><div style="font-size:11px;color:#94a3b8">' + ppEsc(j.position || '') + (j.foot ? ' · ' + j.foot : '') + '</div></div></div>' + (statsText ? '<div style="font-size:11px;color:#64748b;margin-bottom:4px">' + statsText + '</div>' : '') + (j.club_from ? '<div style="font-size:10px;color:#475569;margin-bottom:4px">Procede: ' + ppEsc(j.club_from) + '</div>' : '') + (j.analysis ? '<div style="font-size:11px;color:#94a3b8;line-height:1.4;max-height:44px;overflow:hidden">' + ppEsc(j.analysis) + '</div>' : '<div style="font-size:11px;color:#475569;font-style:italic">Sin analisis</div>') + '</div>';
}

function ppAbrirFormJugador(idx) {
    pp.jugadorEditIdx = idx; var area = document.getElementById('pp-jugador-form-area'); if (!area) return;
    var jugadores = pp.planActual.rival_players || [];
    var j = idx >= 0 ? jugadores[idx] : { name:'', number:'', position:'', foot:'Diestro', year:'', club_from:'', games:'', minutes:'', goals:'', analysis:'' };
    var esEditar = idx >= 0;
    var posOpts = '<option value="">Seleccionar...</option>'; PP_POSICIONES.forEach(function(p) { posOpts += '<option value="' + p + '"' + (j.position === p ? ' selected' : '') + '>' + p + '</option>'; });
    area.style.display = 'block';
    area.innerHTML = '<div style="background:#0f2744;border:1px solid #1e3a5f;border-radius:10px;padding:16px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h4 style="margin:0;color:#e2e8f0;font-size:14px">' + (esEditar ? 'Editar jugador' : 'Nuevo jugador rival') + '</h4><button onclick="ppCerrarFormJugador()" style="background:none;border:none;color:#9ca3af;font-size:18px;cursor:pointer">✕</button></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:12px"><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Nombre *</label><input type="text" id="ppj-name" value="' + ppEsc(j.name) + '" placeholder="Nombre" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Dorsal</label><input type="number" id="ppj-number" value="' + (j.number || '') + '" placeholder="#" min="1" max="99" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Posicion</label><select id="ppj-position" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px">' + posOpts + '</select></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Pie</label><select id="ppj-foot" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"><option value="Diestro"' + (j.foot === 'Diestro' ? ' selected' : '') + '>Diestro</option><option value="Zurdo"' + (j.foot === 'Zurdo' ? ' selected' : '') + '>Zurdo</option><option value="Ambidiestro"' + (j.foot === 'Ambidiestro' ? ' selected' : '') + '>Ambidiestro</option></select></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Año nac.</label><input type="number" id="ppj-year" value="' + (j.year || '') + '" placeholder="1998" min="1970" max="2010" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Procede de</label><input type="text" id="ppj-club" value="' + ppEsc(j.club_from) + '" placeholder="Club anterior" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px"><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Partidos</label><input type="number" id="ppj-games" value="' + (j.games || '') + '" placeholder="PJ" min="0" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Minutos</label><input type="number" id="ppj-minutes" value="' + (j.minutes || '') + '" placeholder="Min" min="0" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Goles</label><input type="number" id="ppj-goals" value="' + (j.goals || '') + '" placeholder="Goles" min="0" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div></div><div style="margin-bottom:12px"><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Analisis del jugador</label><textarea id="ppj-analysis" rows="3" placeholder="Fortalezas, debilidades, como juega..." style="width:100%;padding:8px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;resize:vertical">' + ppEsc(j.analysis) + '</textarea></div><div style="display:flex;gap:8px;justify-content:flex-end">' + (esEditar ? '<button onclick="ppEliminarJugador(' + idx + ')" style="padding:7px 14px;background:#7f1d1d;border:1px solid #dc2626;color:#fca5a5;border-radius:6px;cursor:pointer;font-size:12px;margin-right:auto">Eliminar</button>' : '') + '<button onclick="ppCerrarFormJugador()" style="padding:7px 16px;background:#1e293b;border:1px solid #475569;color:#9ca3af;border-radius:6px;cursor:pointer;font-size:12px">Cancelar</button><button onclick="ppGuardarJugador()" style="padding:7px 16px;background:#3b82f6;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">' + (esEditar ? 'Guardar cambios' : 'Añadir jugador') + '</button></div></div>';
    area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function ppCerrarFormJugador() { var area = document.getElementById('pp-jugador-form-area'); if (area) area.style.display = 'none'; pp.jugadorEditIdx = -1; }

async function ppGuardarJugador() {
    var name = document.getElementById('ppj-name').value.trim(); if (!name) { showToast('El nombre es obligatorio'); return; }
    var jugador = { name: name, number: document.getElementById('ppj-number').value ? parseInt(document.getElementById('ppj-number').value) : null, position: document.getElementById('ppj-position').value || '', foot: document.getElementById('ppj-foot').value || 'Diestro', year: document.getElementById('ppj-year').value ? parseInt(document.getElementById('ppj-year').value) : null, club_from: document.getElementById('ppj-club').value.trim() || '', games: document.getElementById('ppj-games').value ? parseInt(document.getElementById('ppj-games').value) : null, minutes: document.getElementById('ppj-minutes').value ? parseInt(document.getElementById('ppj-minutes').value) : null, goals: document.getElementById('ppj-goals').value ? parseInt(document.getElementById('ppj-goals').value) : null, analysis: document.getElementById('ppj-analysis').value.trim() || '' };
    var jugadores = pp.planActual.rival_players || [];
    if (pp.jugadorEditIdx >= 0) { jugadores[pp.jugadorEditIdx] = jugador; } else { jugadores.push(jugador); }
    try {
        var { error } = await supabaseClient.from('match_plans').update({ rival_players: jugadores, updated_at: new Date().toISOString() }).eq('id', pp.planActual.id);
        if (error) throw error; pp.planActual.rival_players = jugadores;
        showToast(pp.jugadorEditIdx >= 0 ? 'Jugador actualizado' : 'Jugador añadido'); ppCerrarFormJugador(); ppMostrarTab('jugadores');
    } catch(err) { showToast('Error: ' + err.message); }
}

async function ppEliminarJugador(idx) {
    if (!confirm('¿Eliminar este jugador?')) return;
    var jugadores = pp.planActual.rival_players || []; jugadores.splice(idx, 1);
    try {
        var { error } = await supabaseClient.from('match_plans').update({ rival_players: jugadores, updated_at: new Date().toISOString() }).eq('id', pp.planActual.id);
        if (error) throw error; pp.planActual.rival_players = jugadores;
        showToast('Jugador eliminado'); ppCerrarFormJugador(); ppMostrarTab('jugadores');
    } catch(err) { showToast('Error: ' + err.message); }
}

// =============================================
// TAB: FASES TACTICAS / MOMENTOS DEL JUEGO (FASE 2)
// =============================================
function ppGetFases() {
    var fases = pp.planActual.tactical_phases;
    if (!fases || !Array.isArray(fases) || fases.length === 0) return PP_FASES_DEFAULT.map(function(f) { return { id: f.id, title: f.title, notes: '', media: [] }; });
    return fases;
}

function ppRenderFases() {
    var fases = ppGetFases();
    var colores = ['#0f6e56','#085041','#993c1d','#0c447c','#3c3489','#712b13'];
    var html = '<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:20px"><h3 style="margin:0 0 6px;color:#e2e8f0;font-size:16px">⚽ Momentos del juego del rival</h3><p style="margin:0 0 16px;font-size:12px;color:#64748b">Analiza como juega el rival en cada fase. Puedes añadir enlaces a videos.</p>';
    fases.forEach(function(fase, idx) {
        var mediaHtml = '';
        if (fase.media && fase.media.length > 0) {
            mediaHtml = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">';
            fase.media.forEach(function(m, mIdx) {
                var iconoTipo = m.type === 'video' ? '🎬' : (m.type === 'image' ? '🖼️' : '🔗');
                mediaHtml += '<div style="display:flex;align-items:center;gap:6px;background:#0f172a;border:1px solid #334155;border-radius:6px;padding:5px 10px;font-size:11px"><span style="font-size:14px">' + iconoTipo + '</span><a href="' + ppEsc(m.url) + '" target="_blank" style="color:#60a5fa;text-decoration:none;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + ppEsc(m.title || m.url) + '</a><button onclick="ppEliminarMediaFase(' + idx + ',' + mIdx + ')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px;padding:0 2px">✕</button></div>';
            });
            mediaHtml += '</div>';
        }
        html += '<div style="background:#1e293b;border-left:4px solid ' + colores[idx % colores.length] + ';border-radius:0 8px 8px 0;padding:14px;margin-bottom:10px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="font-size:13px;font-weight:600;color:#e2e8f0">' + ppEsc(fase.title) + '</div><button onclick="ppAgregarMediaFase(' + idx + ')" style="padding:4px 10px;background:#0f172a;border:1px solid #334155;color:#94a3b8;border-radius:6px;cursor:pointer;font-size:11px">+ Video</button></div><textarea id="pp-fase-' + idx + '" onchange="ppGuardarFase(' + idx + ', this.value)" rows="3" placeholder="Notas sobre esta fase del rival..." style="width:100%;padding:8px 10px;background:#0f172a;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;resize:vertical">' + ppEsc(fase.notes) + '</textarea>' + mediaHtml + '</div>';
    });
    html += '</div>'; return html;
}

async function ppGuardarFase(idx, valor) {
    var fases = ppGetFases(); fases[idx].notes = valor || '';
    try { var { error } = await supabaseClient.from('match_plans').update({ tactical_phases: fases, updated_at: new Date().toISOString() }).eq('id', pp.planActual.id); if (error) throw error; pp.planActual.tactical_phases = fases; } catch(err) { showToast('Error guardando fase: ' + err.message); }
}

function ppAgregarMediaFase(idx) {
    var prev = document.getElementById('pp-media-overlay'); if (prev) prev.remove();
    var overlay = document.createElement('div'); overlay.id = 'pp-media-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = '<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;max-width:480px;width:100%;padding:24px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 style="margin:0;color:#e2e8f0;font-size:16px">Añadir video o imagen</h3><button onclick="document.getElementById(\'pp-media-overlay\').remove()" style="background:none;border:none;color:#9ca3af;font-size:20px;cursor:pointer">✕</button></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px"><button onclick="ppMediaModo(\'url\',' + idx + ')" id="pp-media-btn-url" style="padding:16px;background:#1e3a5f;border:2px solid #3b82f6;color:#93c5fd;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600">🔗 Pegar URL<br><span style="font-size:11px;font-weight:400;color:#64748b">YouTube, Veo, TactiClip...</span></button><button onclick="ppMediaModo(\'file\',' + idx + ')" id="pp-media-btn-file" style="padding:16px;background:#1e293b;border:2px solid #334155;color:#9ca3af;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600">📁 Subir archivo<br><span style="font-size:11px;font-weight:400;color:#64748b">MP4, MOV, JPG, PNG...</span></button></div><div id="pp-media-url-area"><div style="margin-bottom:10px"><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">URL del video o imagen</label><input type="text" id="pp-media-url" placeholder="https://..." style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div style="margin-bottom:12px"><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">Titulo (opcional)</label><input type="text" id="pp-media-title" placeholder="Ej: Presion alta min 23" style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><button onclick="ppGuardarMediaUrl(' + idx + ')" style="width:100%;padding:10px;background:#3b82f6;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">Añadir</button></div><div id="pp-media-file-area" style="display:none"><div style="margin-bottom:10px"><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">Titulo (opcional)</label><input type="text" id="pp-media-file-title" placeholder="Ej: Salida balon rival" style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div style="margin-bottom:12px"><input type="file" id="pp-media-file-input" accept="video/*,image/*" style="width:100%;padding:8px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div id="pp-media-upload-progress" style="display:none;margin-bottom:12px"><div style="background:#1e293b;border-radius:4px;overflow:hidden;height:6px"><div id="pp-media-progress-bar" style="height:100%;background:#3b82f6;width:0%;transition:width 0.3s"></div></div><div id="pp-media-progress-text" style="font-size:11px;color:#64748b;margin-top:4px;text-align:center">Subiendo...</div></div><button onclick="ppSubirArchivoFase(' + idx + ')" id="pp-media-upload-btn" style="width:100%;padding:10px;background:#f97316;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">Subir archivo</button></div></div>';
    document.body.appendChild(overlay);
}

function ppMediaModo(modo) {
    var urlArea = document.getElementById('pp-media-url-area'); var fileArea = document.getElementById('pp-media-file-area');
    var btnUrl = document.getElementById('pp-media-btn-url'); var btnFile = document.getElementById('pp-media-btn-file');
    if (modo === 'url') { urlArea.style.display='block'; fileArea.style.display='none'; btnUrl.style.background='#1e3a5f'; btnUrl.style.borderColor='#3b82f6'; btnUrl.style.color='#93c5fd'; btnFile.style.background='#1e293b'; btnFile.style.borderColor='#334155'; btnFile.style.color='#9ca3af'; }
    else { urlArea.style.display='none'; fileArea.style.display='block'; btnFile.style.background='#1e3a5f'; btnFile.style.borderColor='#f97316'; btnFile.style.color='#fdba74'; btnUrl.style.background='#1e293b'; btnUrl.style.borderColor='#334155'; btnUrl.style.color='#9ca3af'; }
}

async function ppGuardarMediaUrl(idx) {
    var faseActual = ppGetFases()[idx];
    if (faseActual.media && faseActual.media.length >= PP_MAX_MEDIA_POR_FASE) { showToast('Maximo ' + PP_MAX_MEDIA_POR_FASE + ' archivos por fase'); return; }
    var url = document.getElementById('pp-media-url').value.trim(); if (!url) { showToast('La URL es obligatoria'); return; }
    var title = document.getElementById('pp-media-title').value.trim() || '';
    var tipo = 'link'; if (url.match(/\.(mp4|mov|webm)$/i) || url.indexOf('youtube') >= 0 || url.indexOf('youtu.be') >= 0 || url.indexOf('veo.co') >= 0) tipo = 'video'; else if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) tipo = 'image';
    var fases = ppGetFases(); if (!fases[idx].media) fases[idx].media = []; fases[idx].media.push({ url: url, title: title, type: tipo });
    try { var { error } = await supabaseClient.from('match_plans').update({ tactical_phases: fases, updated_at: new Date().toISOString() }).eq('id', pp.planActual.id); if (error) throw error; pp.planActual.tactical_phases = fases; showToast('Enlace añadido'); document.getElementById('pp-media-overlay').remove(); ppMostrarTab('fases'); } catch(err) { showToast('Error: ' + err.message); }
}

async function ppSubirArchivoFase(idx) {
    var fileInput = document.getElementById('pp-media-file-input'); var file = fileInput.files[0]; if (!file) { showToast('Selecciona un archivo'); return; }
    var title = document.getElementById('pp-media-file-title').value.trim() || file.name;
    var btn = document.getElementById('pp-media-upload-btn'); var progressArea = document.getElementById('pp-media-upload-progress'); var progressBar = document.getElementById('pp-media-progress-bar'); var progressText = document.getElementById('pp-media-progress-text');
    btn.disabled = true; btn.textContent = 'Convirtiendo...'; progressArea.style.display = 'block'; progressBar.style.width = '30%'; progressText.textContent = 'Preparando archivo...';
    try {
        var maxMB = 50; if (file.size > maxMB * 1024 * 1024) { showToast('El archivo supera ' + maxMB + 'MB. Usa un clip mas corto.'); btn.disabled = false; btn.textContent = 'Subir archivo'; progressArea.style.display = 'none'; return; }
        var faseCheck = ppGetFases()[idx]; if (faseCheck.media && faseCheck.media.length >= PP_MAX_MEDIA_POR_FASE) { showToast('Maximo ' + PP_MAX_MEDIA_POR_FASE + ' archivos por fase'); btn.disabled = false; btn.textContent = 'Subir archivo'; progressArea.style.display = 'none'; return; }
        var base64 = await new Promise(function(resolve, reject) { var rd = new FileReader(); rd.onload = function() { resolve(rd.result.split(',')[1]); }; rd.onerror = function() { reject(new Error('Error leyendo archivo')); }; rd.readAsDataURL(file); });
        progressBar.style.width = '50%'; progressText.textContent = 'Subiendo al servidor...'; btn.textContent = 'Subiendo...';
        var fileId = 'plan_' + Date.now();
        var res = await fetch('https://toplidercoach.com/wp-content/uploads/ejercicios/upload-video.php', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer toplider_thumb_2026' }, body: JSON.stringify({ video: base64, id: fileId }) });
        progressBar.style.width = '90%'; progressText.textContent = 'Procesando...';
        var data = await res.json();
        if (data.ok && data.url) {
            var esVideo = file.type.startsWith('video/'); var fases = ppGetFases(); if (!fases[idx].media) fases[idx].media = []; fases[idx].media.push({ url: data.url, title: title, type: esVideo ? 'video' : 'image' });
            var { error } = await supabaseClient.from('match_plans').update({ tactical_phases: fases, updated_at: new Date().toISOString() }).eq('id', pp.planActual.id);
            if (error) throw error; pp.planActual.tactical_phases = fases; progressBar.style.width = '100%'; progressText.textContent = 'Completado'; showToast('Archivo subido correctamente'); document.getElementById('pp-media-overlay').remove(); ppMostrarTab('fases');
        } else { throw new Error(data.error || 'Error en la subida'); }
    } catch(err) { showToast('Error: ' + err.message); btn.disabled = false; btn.textContent = 'Subir archivo'; progressText.textContent = 'Error: ' + err.message; }
}

async function ppEliminarMediaFase(faseIdx, mediaIdx) {
    var fases = ppGetFases(); fases[faseIdx].media.splice(mediaIdx, 1);
    try { var { error } = await supabaseClient.from('match_plans').update({ tactical_phases: fases, updated_at: new Date().toISOString() }).eq('id', pp.planActual.id); if (error) throw error; pp.planActual.tactical_phases = fases; ppMostrarTab('fases'); } catch(err) { showToast('Error: ' + err.message); }
}

// =============================================
// TAB: PLAN TÁCTICO
// =============================================
function ppRenderTactica() {
    var plan = pp.planActual;
    return '<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:20px"><h3 style="margin:0 0 16px;color:#e2e8f0;font-size:16px">⚔️ Plan tactico</h3><div style="margin-bottom:16px"><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">Nuestra formacion</label>' + ppSelectFormacion('pp-our-formation', plan.our_formation, "ppGuardarCampo('our_formation', this.value)") + '</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px"><div><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">⚡ Plan ofensivo</label><textarea id="pp-offensive" onchange="ppGuardarCampo(\'offensive_plan\', this.value)" rows="4" placeholder="Como atacamos..." style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;resize:vertical">' + ppEsc(plan.offensive_plan) + '</textarea></div><div><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">🛡️ Plan defensivo</label><textarea id="pp-defensive" onchange="ppGuardarCampo(\'defensive_plan\', this.value)" rows="4" placeholder="Como defendemos..." style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;resize:vertical">' + ppEsc(plan.defensive_plan) + '</textarea></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px"><div><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">🔄 Transiciones</label><textarea id="pp-transitions" onchange="ppGuardarCampo(\'transitions_plan\', this.value)" rows="3" placeholder="Transiciones ataque-defensa y defensa-ataque..." style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;resize:vertical">' + ppEsc(plan.transitions_plan) + '</textarea></div><div><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">🎯 Balon parado</label><textarea id="pp-setpieces" onchange="ppGuardarCampo(\'set_pieces_plan\', this.value)" rows="3" placeholder="ABPs ofensivas y defensivas para este partido..." style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;resize:vertical">' + ppEsc(plan.set_pieces_plan) + '</textarea></div></div><div><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">📋 Consignas para el equipo</label><textarea id="pp-instructions" onchange="ppGuardarCampo(\'team_instructions\', this.value)" rows="3" placeholder="Instrucciones generales para los jugadores..." style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;resize:vertical">' + ppEsc(plan.team_instructions) + '</textarea></div></div>';
}

// =============================================
// TAB: SEMANA (FASE 3)
// =============================================
function ppCalcularSemana() {
    var matchDate = new Date(pp.partidoActual.match_date + 'T12:00:00');
    var dias = [];
    for (var i = 6; i >= 0; i--) {
        var d = new Date(matchDate);
        d.setDate(d.getDate() - i);
        var diaSem = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'][d.getDay()];
        var md = i === 0 ? 'MD' : 'MD-' + i;
        var fechaStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        dias.push({ date: fechaStr, dayName: diaSem, md: md, dayNum: d.getDate(), month: d.getMonth()+1 });
    }
    return dias;
}

async function ppCargarSemana() {
    var dias = ppCalcularSemana();
    pp.semana.dias = dias;

    var fechaInicio = dias[0].date;
    var fechaFin = dias[dias.length - 1].date;

    try {
        var { data: sesiones } = await supabaseClient
            .from('training_sessions')
            .select('id, name, session_date, session_time, warm_up, main_part, cool_down, rpe, match_day')
            .eq('club_id', clubId)
            .gte('session_date', fechaInicio)
            .lte('session_date', fechaFin)
            .order('session_date');

        pp.semana.sesiones = sesiones || [];

        var { data: micros } = await supabaseClient
            .from('training_periods')
            .select('*')
            .eq('club_id', clubId)
            .eq('type', 'micro')
            .lte('date_start', fechaFin)
            .gte('date_end', fechaInicio)
            .limit(1);

        pp.semana.microciclo = (micros && micros.length > 0) ? micros[0] : null;

    } catch(err) { console.warn('Error cargando semana:', err); }

    var area = document.getElementById('pp-tab-content');
    if (area) area.innerHTML = ppRenderSemana();
}

function ppRenderSemana() {
    var dias = pp.semana.dias;
    var sesiones = pp.semana.sesiones;
    var micro = pp.semana.microciclo;
    var plan = pp.planActual;
    var weeklyMap = plan.weekly_map || {};
    var objectives = plan.weekly_objectives || [];

    var html = '<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:20px">';

    // Microciclo info
    if (micro) {
        html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:10px 14px;background:#1e293b;border-radius:8px;border-left:4px solid ' + (micro.color || '#22c55e') + '"><div style="font-size:13px;color:#e2e8f0"><span style="font-weight:600">' + ppEsc(micro.name) + '</span> <span style="color:#64748b;font-size:11px">· Microciclo</span></div>' + (micro.objective ? '<div style="font-size:11px;color:#94a3b8;margin-left:auto">' + ppEsc(micro.objective) + '</div>' : '') + '</div>';
    }

    // Mapa semanal visual
    html += '<h3 style="margin:0 0 12px;color:#e2e8f0;font-size:16px">📅 Mapa semanal</h3>';
    html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:20px">';

    dias.forEach(function(dia) {
        var esMD = dia.md === 'MD';
        var sesionesDia = sesiones.filter(function(s) { return s.session_date === dia.date; });
        var orientacion = weeklyMap[dia.md] || '';
        var bgColor = esMD ? '#7f1d1d' : '#1e293b';
        var borderColor = esMD ? '#ef4444' : '#334155';

        html += '<div style="background:' + bgColor + ';border:1px solid ' + borderColor + ';border-radius:8px;padding:8px;min-height:100px">';
        html += '<div style="text-align:center;margin-bottom:6px">';
        html += '<div style="font-size:10px;color:#64748b;text-transform:uppercase">' + dia.dayName + '</div>';
        html += '<div style="font-size:16px;font-weight:700;color:' + (esMD ? '#fca5a5' : '#e2e8f0') + '">' + dia.dayNum + '/' + dia.month + '</div>';
        html += '<div style="font-size:11px;font-weight:600;color:' + (esMD ? '#ef4444' : '#f59e0b') + '">' + dia.md + '</div>';
        html += '</div>';

        // Selector orientación (no para MD)
        if (!esMD) {
            html += '<select onchange="ppGuardarOrientacion(\'' + dia.md + '\', this.value)" style="width:100%;padding:3px 4px;background:#0f172a;border:1px solid #334155;border-radius:4px;color:#94a3b8;font-size:10px;margin-bottom:4px">';
            html += '<option value="">Orientacion...</option>';
            PP_ORIENTACIONES.forEach(function(o) {
                html += '<option value="' + o + '"' + (orientacion === o ? ' selected' : '') + '>' + o + '</option>';
            });
            html += '</select>';
        } else {
            html += '<div style="text-align:center;font-size:11px;font-weight:600;color:#ef4444;margin-bottom:4px">⚽ PARTIDO</div>';
        }

        // Sesiones del día
        if (sesionesDia.length > 0) {
            sesionesDia.forEach(function(s) {
                var numEj = ((s.warm_up||[]).length) + ((s.main_part||[]).length) + ((s.cool_down||[]).length);
                html += '<div onclick="cambiarModulo(\'planificador\', document.querySelector(\'.main-tab.planificador\')); setTimeout(function(){ cargarSesionEnEditor(\'' + s.id + '\'); }, 300);" style="background:#0f172a;border:1px solid #334155;border-radius:4px;padding:4px 6px;margin-top:3px;cursor:pointer;font-size:10px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="' + ppEsc(s.name) + '">';
                html += '📋 ' + ppEsc(s.name.substring(0, 15));
                if (s.rpe) html += ' <span style="color:#f59e0b">RPE:' + s.rpe + '</span>';
                html += '</div>';
            });
        } else if (!esMD) {
            html += '<div style="font-size:10px;color:#475569;text-align:center;margin-top:6px">Sin sesion</div>';
        }

        html += '</div>';
    });

    html += '</div>';

    // Objetivos de trabajo
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">';
    html += '<h3 style="margin:0;color:#e2e8f0;font-size:16px">🎯 Objetivos de trabajo <span style="font-size:13px;color:#64748b;font-weight:400">(' + objectives.length + ')</span></h3>';
    html += '<button onclick="ppAbrirFormObjetivo(-1)" style="padding:6px 14px;background:#3b82f6;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">+ Añadir objetivo</button>';
    html += '</div>';

    html += '<div id="pp-obj-form-area" style="display:none;margin-bottom:12px"></div>';

    if (objectives.length === 0) {
        html += '<div style="padding:20px;background:#1e293b;border-radius:8px;text-align:center;color:#475569;font-size:13px">Sin objetivos de trabajo. Añade los aspectos tacticos a entrenar durante la semana.</div>';
    } else {
        html += '<div style="display:flex;flex-direction:column;gap:6px">';
        objectives.forEach(function(obj, idx) {
            var tipoInfo = PP_TIPOS_OBJ.find(function(t) { return t.id === obj.type; }) || PP_TIPOS_OBJ[5];
            html += '<div style="display:flex;align-items:center;gap:10px;background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 14px;cursor:pointer" onclick="ppAbrirFormObjetivo(' + idx + ')" onmouseenter="this.style.borderColor=\'#3b82f6\'" onmouseleave="this.style.borderColor=\'#334155\'">';
            html += '<div style="width:8px;height:8px;border-radius:50%;background:' + tipoInfo.color + ';flex-shrink:0"></div>';
            html += '<div style="flex:1;min-width:0"><div style="font-size:13px;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + ppEsc(obj.text) + '</div>';
            if (obj.activities) html += '<div style="font-size:11px;color:#64748b;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + ppEsc(obj.activities) + '</div>';
            html += '</div>';
            html += '<span style="padding:2px 8px;background:#0f172a;border:1px solid #334155;border-radius:4px;font-size:10px;color:' + tipoInfo.color + ';font-weight:600;white-space:nowrap">' + tipoInfo.label + '</span>';
            if (obj.session_day) html += '<span style="padding:2px 8px;background:#0f172a;border:1px solid #334155;border-radius:4px;font-size:10px;color:#f59e0b;font-weight:600;white-space:nowrap">' + obj.session_day + '</span>';
            html += '</div>';
        });
        html += '</div>';
    }

    html += '</div>';
    return html;
}

async function ppGuardarOrientacion(md, valor) {
    var weeklyMap = pp.planActual.weekly_map || {};
    weeklyMap[md] = valor || '';
    try {
        var { error } = await supabaseClient.from('match_plans').update({ weekly_map: weeklyMap, updated_at: new Date().toISOString() }).eq('id', pp.planActual.id);
        if (error) throw error;
        pp.planActual.weekly_map = weeklyMap;
    } catch(err) { showToast('Error: ' + err.message); }
}

// =============================================
// OBJETIVOS DE TRABAJO (CRUD)
// =============================================
function ppAbrirFormObjetivo(idx) {
    pp.objEditIdx = idx;
    var area = document.getElementById('pp-obj-form-area');
    if (!area) return;

    var objectives = pp.planActual.weekly_objectives || [];
    var obj = idx >= 0 ? objectives[idx] : { text: '', type: 'ofensivo', session_day: '', activities: '' };
    var esEditar = idx >= 0;

    var tipoOpts = ''; PP_TIPOS_OBJ.forEach(function(t) { tipoOpts += '<option value="' + t.id + '"' + (obj.type === t.id ? ' selected' : '') + '>' + t.label + '</option>'; });
    var diaOpts = '<option value="">Sin asignar</option>';
    pp.semana.dias.forEach(function(d) { if (d.md !== 'MD') diaOpts += '<option value="' + d.md + '"' + (obj.session_day === d.md ? ' selected' : '') + '>' + d.md + ' (' + d.dayName + ' ' + d.dayNum + '/' + d.month + ')</option>'; });

    area.style.display = 'block';
    area.innerHTML = '<div style="background:#0f2744;border:1px solid #1e3a5f;border-radius:10px;padding:14px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h4 style="margin:0;color:#e2e8f0;font-size:14px">' + (esEditar ? 'Editar objetivo' : 'Nuevo objetivo de trabajo') + '</h4><button onclick="ppCerrarFormObjetivo()" style="background:none;border:none;color:#9ca3af;font-size:18px;cursor:pointer">✕</button></div>' +
        '<div style="margin-bottom:10px"><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Objetivo *</label><input type="text" id="ppo-text" value="' + ppEsc(obj.text) + '" placeholder="Ej: Presion alta y vuelta a repliegue intermedio" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px"><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Tipo</label><select id="ppo-type" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px">' + tipoOpts + '</select></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Sesion asignada</label><select id="ppo-day" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px">' + diaOpts + '</select></div></div>' +
        '<div style="margin-bottom:10px"><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Actividades propuestas (opcional)</label><input type="text" id="ppo-activities" value="' + ppEsc(obj.activities) + '" placeholder="Ej: Rondo 4v2, SSG presion alta..." style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end">' + (esEditar ? '<button onclick="ppEliminarObjetivo(' + idx + ')" style="padding:7px 14px;background:#7f1d1d;border:1px solid #dc2626;color:#fca5a5;border-radius:6px;cursor:pointer;font-size:12px;margin-right:auto">Eliminar</button>' : '') + '<button onclick="ppCerrarFormObjetivo()" style="padding:7px 16px;background:#1e293b;border:1px solid #475569;color:#9ca3af;border-radius:6px;cursor:pointer;font-size:12px">Cancelar</button><button onclick="ppGuardarObjetivo()" style="padding:7px 16px;background:#3b82f6;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">' + (esEditar ? 'Guardar' : 'Añadir') + '</button></div></div>';
    area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function ppCerrarFormObjetivo() { var area = document.getElementById('pp-obj-form-area'); if (area) area.style.display = 'none'; pp.objEditIdx = -1; }

async function ppGuardarObjetivo() {
    var text = document.getElementById('ppo-text').value.trim(); if (!text) { showToast('El objetivo es obligatorio'); return; }
    var obj = { text: text, type: document.getElementById('ppo-type').value, session_day: document.getElementById('ppo-day').value || '', activities: document.getElementById('ppo-activities').value.trim() || '' };
    var objectives = pp.planActual.weekly_objectives || [];
    if (pp.objEditIdx >= 0) { objectives[pp.objEditIdx] = obj; } else { objectives.push(obj); }
    try {
        var { error } = await supabaseClient.from('match_plans').update({ weekly_objectives: objectives, updated_at: new Date().toISOString() }).eq('id', pp.planActual.id);
        if (error) throw error; pp.planActual.weekly_objectives = objectives;
        showToast(pp.objEditIdx >= 0 ? 'Objetivo actualizado' : 'Objetivo añadido');
        ppCerrarFormObjetivo(); ppCargarSemana();
    } catch(err) { showToast('Error: ' + err.message); }
}

async function ppEliminarObjetivo(idx) {
    if (!confirm('¿Eliminar este objetivo?')) return;
    var objectives = pp.planActual.weekly_objectives || []; objectives.splice(idx, 1);
    try {
        var { error } = await supabaseClient.from('match_plans').update({ weekly_objectives: objectives, updated_at: new Date().toISOString() }).eq('id', pp.planActual.id);
        if (error) throw error; pp.planActual.weekly_objectives = objectives;
        showToast('Objetivo eliminado'); ppCerrarFormObjetivo(); ppCargarSemana();
    } catch(err) { showToast('Error: ' + err.message); }
}

// =============================================
// TAB: CONTENIDO (placeholder Fase 4)
// =============================================
function ppRenderContenidos() {
    return '<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:20px"><h3 style="margin:0 0 16px;color:#e2e8f0;font-size:16px">🎯 Contenido vinculado</h3><div style="padding:30px;text-align:center;color:#64748b;font-size:13px">📌 Ejercicios de pizarra, ABPs seleccionadas y videos TactiClip — disponible en Fase 4</div></div>';
}

// =============================================
// GUARDAR CAMPO INDIVIDUAL (autosave)
// =============================================
async function ppGuardarCampo(campo, valor) {
    if (!pp.planActual) return;
    try { var update = { updated_at: new Date().toISOString() }; update[campo] = valor || null; var { error } = await supabaseClient.from('match_plans').update(update).eq('id', pp.planActual.id); if (error) throw error; pp.planActual[campo] = valor || null; } catch(err) { showToast('Error guardando: ' + err.message); }
}

// =============================================
// UTILIDADES
// =============================================
function ppEsc(str) { if (!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function ppSelectFormacion(id, valor, onchangeStr) {
    var formaciones = ['1-4-3-3','1-4-4-2','1-4-2-3-1','1-4-1-4-1','1-3-5-2','1-3-4-3','1-5-3-2','1-5-4-1','1-4-5-1','1-4-4-1-1'];
    var html = '<select id="' + id + '" onchange="' + onchangeStr + '" style="width:100%;max-width:300px;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:14px"><option value="">Seleccionar...</option>';
    formaciones.forEach(function(f) { html += '<option value="' + f + '"' + (valor === f ? ' selected' : '') + '>' + f + '</option>'; });
    return html + '</select>';
}

// =============================================
// REGISTRO DEL MÓDULO
// =============================================
registrarSubTab('matchstats', 'planpartido', initPlanPartido);