// ========== MATCHSTATS.JS - TopLiderCoach HUB ==========
// Partidos, convocatorias, alineaciones, resultados, estadísticas, ficha jugador

// Variables del módulo
let fichaJugadorActual = null;
let escudoRivalUrl = null;

// Registro en navegación
registrarModulo('matchstats', cargarPartidos);
registrarSubTab('matchstats', 'estadisticas', function() {
    cargarSelectorTemporadasStats();
    cargarEstadisticas();
});
// Calendario unificado movido a planificador.js
registrarSubTab('matchstats', 'partidos', cargarPartidos);

async function cargarCalendarioPartidos() {
    const mesActualEl = document.getElementById('mes-actual-partidos');
    const grid = document.getElementById('calendario-partidos');
    const resumenEl = document.getElementById('calendario-resumen-partidos');
    
    if (!mesActualEl || !grid) return;
    
    mesActualEl.textContent = MESES[calendarioMesPartidos] + ' ' + calendarioAnioPartidos;
    
    const ultimoDia = new Date(calendarioAnioPartidos, calendarioMesPartidos + 1, 0);
    const inicioMes = calendarioAnioPartidos + '-' + String(calendarioMesPartidos + 1).padStart(2, '0') + '-01';
    const finMes = calendarioAnioPartidos + '-' + String(calendarioMesPartidos + 1).padStart(2, '0') + '-' + ultimoDia.getDate();
    
    const { data: partidos } = await supabaseClient
        .from('matches')
        .select('*')
        .eq('club_id', clubId)
        .eq('season_id', seasonId)
        .gte('match_date', inicioMes)
        .lte('match_date', finMes)
        .order('match_date');
    
    const partidosPorDia = {};
    (partidos || []).forEach(function(p) {
        const dia = new Date(p.match_date).getDate();
        if (!partidosPorDia[dia]) partidosPorDia[dia] = [];
        partidosPorDia[dia].push(p);
    });
    
    const victorias = partidos ? partidos.filter(function(p) { return p.result === 'win'; }).length : 0;
    const empates = partidos ? partidos.filter(function(p) { return p.result === 'draw'; }).length : 0;
    const derrotas = partidos ? partidos.filter(function(p) { return p.result === 'loss'; }).length : 0;
    const pendientes = partidos ? partidos.filter(function(p) { return !p.result; }).length : 0;
    const golesFavor = partidos ? partidos.reduce(function(sum, p) { return sum + (p.team_goals || 0); }, 0) : 0;
    const golesContra = partidos ? partidos.reduce(function(sum, p) { return sum + (p.opponent_goals || 0); }, 0) : 0;
    
    var html = '';
    var diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    for (var i = 0; i < diasSemana.length; i++) {
        html += '<div class="calendario-dia-header">' + diasSemana[i] + '</div>';
    }
    
    var primerDia = new Date(calendarioAnioPartidos, calendarioMesPartidos, 1);
    var diaInicio = primerDia.getDay();
    diaInicio = diaInicio === 0 ? 7 : diaInicio;
    
    for (var i = 1; i < diaInicio; i++) {
        html += '<div class="calendario-dia otro-mes"></div>';
    }
    
    var hoy = new Date();
    for (var dia = 1; dia <= ultimoDia.getDate(); dia++) {
        var esHoy = dia === hoy.getDate() && calendarioMesPartidos === hoy.getMonth() && calendarioAnioPartidos === hoy.getFullYear();
        var tienePartido = partidosPorDia[dia] && partidosPorDia[dia].length > 0;
        
        var eventosHTML = '';
        if (tienePartido) {
            for (var j = 0; j < partidosPorDia[dia].length; j++) {
                var p = partidosPorDia[dia][j];
                var resultClass = p.result ? (p.result === 'win' ? 'victoria' : (p.result === 'draw' ? 'empate' : 'derrota')) : 'pendiente';
                var esLocal = p.home_away === 'home';
                var resultadoTexto = '';
                if (p.result) {
                    var gF = p.team_goals || 0;
                    var gC = p.opponent_goals || 0;
                    resultadoTexto = esLocal ? (gF + '-' + gC) : (gC + '-' + gF);
                } else {
                    resultadoTexto = p.kick_off_time ? p.kick_off_time.slice(0, 5) : 'Por jugar';
                }
                eventosHTML += '<div class="calendario-evento partido ' + resultClass + '" onclick="verPartido(\'' + p.id + '\')" title="' + p.opponent + '">' +
                    '<span class="rival">' + (esLocal ? 'vs' : '@') + ' ' + p.opponent + '</span>' +
                    '<span class="resultado">' + resultadoTexto + '</span>' +
                '</div>';
            }
        }
        
        html += '<div class="calendario-dia ' + (esHoy ? 'hoy' : '') + ' ' + (tienePartido ? 'tiene-partido' : '') + '">' +
            '<div class="numero">' + dia + '</div>' +
            eventosHTML +
        '</div>';
    }
    
    grid.innerHTML = html;
    
    if (resumenEl) {
        resumenEl.innerHTML = 
            '<div class="resumen-stat victorias"><div class="numero">' + victorias + '</div><div class="label">Victorias</div></div>' +
            '<div class="resumen-stat empates"><div class="numero">' + empates + '</div><div class="label">Empates</div></div>' +
            '<div class="resumen-stat derrotas"><div class="numero">' + derrotas + '</div><div class="label">Derrotas</div></div>' +
            '<div class="resumen-stat pendientes"><div class="numero">' + pendientes + '</div><div class="label">Pendientes</div></div>' +
            '<div class="resumen-stat goles-favor"><div class="numero">' + golesFavor + '</div><div class="label">GF</div></div>' +
            '<div class="resumen-stat goles-contra"><div class="numero">' + golesContra + '</div><div class="label">GC</div></div>';
    }
}

function mesAnteriorPartidos() {
    calendarioMesPartidos--;
    if (calendarioMesPartidos < 0) {
        calendarioMesPartidos = 11;
        calendarioAnioPartidos--;
    }
    cargarCalendarioPartidos();
}

function mesSiguientePartidos() {
    calendarioMesPartidos++;
    if (calendarioMesPartidos > 11) {
        calendarioMesPartidos = 0;
        calendarioAnioPartidos++;
    }
    cargarCalendarioPartidos();
}

function limpiarFiltroPartidos() {
    document.getElementById('filtro-partido-desde').value = '';
    document.getElementById('filtro-partido-hasta').value = '';
    cargarPartidos();
}

        function filtrarPartidos(filtro, btn) {
            document.querySelectorAll('.filtros-bar .filtro-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroPartidos = filtro;
            cargarPartidos();
        }
        
        async function cargarPartidos() {
            const lista = document.getElementById('lista-partidos');
            lista.innerHTML = '<div class="loading">Cargando partidos...</div>';
            
            try {
                let query = supabaseClient
                    .from('matches')
                    .select('*')
                    .eq('club_id', clubId)
                    .eq('season_id', seasonId)
                    .order('match_date', { ascending: false });
                
                const hoy = new Date().toISOString().split('T')[0];
                // Filtros de fecha del calendario
const desde = document.getElementById('filtro-partido-desde')?.value;
const hasta = document.getElementById('filtro-partido-hasta')?.value;

if (desde) {
    query = query.gte('match_date', desde);
}
if (hasta) {
    query = query.lte('match_date', hasta);
}
                if (filtroPartidos === 'proximos') {
                    query = query.gte('match_date', hoy).is('result', null);
                } else if (filtroPartidos === 'jugados') {
                    query = query.not('result', 'is', null);
                }
                
                const { data, error } = await query;
                
                if (error) throw error;
                
                if (!data || data.length === 0) {
                    lista.innerHTML = '<div class="empty-state"><h3>No hay partidos</h3><p>Crea tu primer partido</p></div>';
                    return;
                }
                
                lista.innerHTML = data.map(p => {
                    const fecha = new Date(p.match_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
                    const hora = p.kick_off_time ? p.kick_off_time.slice(0, 5) : '';
                    const esLocal = p.home_away === 'home';
                    
                    let resultadoHTML = '';
                    let badgeHTML = '';
                    
                    if (p.result) {
                        const gF = p.team_goals || 0;
                        const gC = p.opponent_goals || 0;
                        const marcador = esLocal ? `${gF} - ${gC}` : `${gC} - ${gF}`;
                        resultadoHTML = `<span class="partido-resultado">${marcador}</span>`;
                        
                        const badgeClass = p.result === 'win' ? 'victoria' : p.result === 'draw' ? 'empate' : 'derrota';
                        const badgeText = p.result === 'win' ? 'Victoria' : p.result === 'draw' ? 'Empate' : 'Derrota';
                        badgeHTML = `<span class="resultado-badge ${badgeClass}">${badgeText}</span>`;
                    } else {
                        resultadoHTML = `<span class="partido-resultado pendiente">${hora || 'Por jugar'}</span>`;
                        badgeHTML = `<span class="resultado-badge pendiente">Pendiente</span>`;
                    }
                    
                    return `
                        <div class="partido-card">
                            <div class="partido-card-header">
                                <div class="partido-fecha">${fecha} ${hora ? '- ' + hora : ''}</div>
                                ${p.competition ? `<span class="partido-competicion">${p.competition}</span>` : ''}
                            </div>
                            <div class="partido-card-body">
                                <div class="partido-equipos">
                                    <div class="equipo">
                                        <div class="equipo-escudo">${esLocal 
                                            ? (clubData?.logo_url ? `<img src="${clubData.logo_url}" alt="" style="width:32px;height:32px;object-fit:contain;">` : '🏠') 
                                            : (p.opponent_logo ? `<img src="${p.opponent_logo}" alt="" style="width:32px;height:32px;object-fit:contain;">` : '🏟️')}</div>
                                        <div class="equipo-nombre">${esLocal ? (clubData?.name || 'Mi Equipo') : p.opponent}</div>
                                        <div class="equipo-tipo">Local</div>
                                    </div>
                                    ${resultadoHTML}
                                    <div class="equipo">
                                        <div class="equipo-escudo">${esLocal 
                                            ? (p.opponent_logo ? `<img src="${p.opponent_logo}" alt="" style="width:32px;height:32px;object-fit:contain;">` : '🏟️') 
                                            : (clubData?.logo_url ? `<img src="${clubData.logo_url}" alt="" style="width:32px;height:32px;object-fit:contain;">` : '🏠')}</div>
                                        <div class="equipo-nombre">${esLocal ? p.opponent : (clubData?.name || 'Mi Equipo')}</div>
                                        <div class="equipo-tipo">Visitante</div>
                                    </div>
                                </div>
                                ${badgeHTML}
                            </div>
                           <div class="partido-card-footer">
    <button class="btn-ver" onclick="verPartido('${p.id}')">Ver</button>
    <button class="btn-stats" onclick="editarPartido('${p.id}')">Editar</button>
    <button class="btn-pdf" onclick="abrirModalResultado('${p.id}')">Stats</button>
    <button class="btn-eliminar" onclick="eliminarPartido('${p.id}')">X</button>
</div>
                        </div>
                    `;
                }).join('');
                
            } catch (error) {
                lista.innerHTML = '<p style="color:red;">Error al cargar partidos</p>';
            }
        }
        
     async function abrirModalPartido(partidoId = null) {
            document.getElementById('modal-partido-titulo').textContent = partidoId ? 'Editar Partido' : 'Nuevo Partido';
            
            // Limpiar todo
            document.getElementById('partido-id').value = '';
            document.getElementById('partido-rival').value = '';
            document.getElementById('partido-competicion').value = '';
            document.getElementById('partido-fecha').value = new Date().toISOString().split('T')[0];
            document.getElementById('partido-hora').value = '';
            document.getElementById('partido-localidad').value = 'home';
            document.getElementById('partido-estadio').value = '';
            document.getElementById('partido-jornada').value = '';
            document.getElementById('partido-formato').value = '11';
            document.getElementById('partido-lugar-encuentro').value = '';
            document.getElementById('partido-hora-salida').value = '';
            document.getElementById('partido-fecha-salida').value = '';
            document.getElementById('partido-notas-convocatoria').value = '';
            document.getElementById('partido-video-url').value = '';
document.getElementById('video-preview-container').style.display = 'none';
            
            convocadosPartido = [];
            titularesPartido = [];
            
            await cargarConvocatoria();
            
            if (partidoId) {
                const { data: p } = await supabaseClient.from('matches').select('*').eq('id', partidoId).single();
                if (p) {
                    document.getElementById('partido-id').value = p.id;
                    document.getElementById('partido-rival').value = p.opponent || '';
                    document.getElementById('partido-competicion').value = p.competition || '';
                    document.getElementById('partido-fecha').value = p.match_date || '';
                    document.getElementById('partido-hora').value = p.kick_off_time || '';
                    document.getElementById('partido-localidad').value = p.home_away || 'home';
                    document.getElementById('partido-estadio').value = p.stadium || '';
                    document.getElementById('partido-jornada').value = p.round || '';
                    document.getElementById('partido-formato').value = p.formato_juego || '11';
                    document.getElementById('partido-lugar-encuentro').value = p.lugar_encuentro || '';
                    document.getElementById('partido-hora-salida').value = p.hora_salida || '';
                    document.getElementById('partido-fecha-salida').value = p.fecha_salida || '';
                    document.getElementById('partido-notas-convocatoria').value = p.notas_convocatoria || '';
                    // Cargar video
if (p.video_url) {
    document.getElementById('partido-video-url').value = p.video_url;
    actualizarPreviewVideo();
}
                    
                    // Cargar escudo rival
                    if (p.opponent_logo) {
                        cargarEscudoRival(p.opponent_logo);
                    }

                    // Cargar convocados
if (p.convocados && Array.isArray(p.convocados)) {
    convocadosPartido = p.convocados.map(c => String(c.id));
}

// Cargar titulares
if (p.titulares && Array.isArray(p.titulares)) {
    titularesPartido = p.titulares.map(t => String(t.id));
}
                    
                    renderizarConvocatoria();
                }
            }
            
            document.getElementById('modal-partido').style.display = 'flex';
        }
        async function verPartido(partidoId) {
    const { data: p } = await supabaseClient.from('matches').select('*').eq('id', partidoId).single();
    if (!p) {
        alert('Partido no encontrado');
        return;
    }
    
    const { data: club } = await supabaseClient.from('clubs').select('name, logo_url').eq('id', clubId).single();
    
    const fecha = new Date(p.match_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const hora = p.kick_off_time ? p.kick_off_time.slice(0, 5) : '';
    const esLocal = p.home_away === 'home';
    
    // Resultado
    let resultadoHTML = '';
    if (p.result) {
        const gF = p.team_goals || 0;
        const gC = p.opponent_goals || 0;
        const marcador = esLocal ? `${gF} - ${gC}` : `${gC} - ${gF}`;
        const resultText = p.result === 'win' ? 'Victoria' : p.result === 'draw' ? 'Empate' : 'Derrota';
        resultadoHTML = `
            <div style="text-align:center;margin:20px 0;">
                <div style="font-size:48px;font-weight:700;">${marcador}</div>
                <div style="color:#059669;font-weight:600;">${resultText}</div>
            </div>
        `;
    } else {
        resultadoHTML = `<div style="text-align:center;margin:20px 0;color:#9ca3af;">Partido pendiente</div>`;
    }
    
    // Convocados
    const convocados = p.convocados || [];
    const titulares = p.titulares || [];
    const suplentes = p.suplentes || [];
    
    let convocadosHTML = '<p style="color:#9ca3af;">No hay convocados</p>';
    if (convocados.length > 0) {
        convocadosHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;">
                ${convocados.sort((a,b) => (a.shirt_number || 99) - (b.shirt_number || 99)).map(j => `
                    <div style="display:flex;align-items:center;gap:8px;padding:8px;background:#f0fdf4;border-radius:8px;">
                        <span style="background:#059669;color:white;width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">${j.shirt_number || '-'}</span>
                        <span style="font-size:12px;">${j.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    let titularesHTML = '<p style="color:#9ca3af;">No hay titulares</p>';
    if (titulares.length > 0) {
        titularesHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;">
                ${titulares.sort((a,b) => (a.shirt_number || 99) - (b.shirt_number || 99)).map(j => `
                    <div style="display:flex;align-items:center;gap:8px;padding:8px;background:#dbeafe;border-radius:8px;">
                        <span style="background:#3b82f6;color:white;width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">${j.shirt_number || '-'}</span>
                        <span style="font-size:12px;">${j.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    let suplentesHTML = '';
    if (suplentes.length > 0) {
        suplentesHTML = `
            <div style="margin-top:15px;">
                <h4 style="font-size:13px;color:#6b7280;margin-bottom:10px;">Suplentes (${suplentes.length})</h4>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;">
                    ${suplentes.sort((a,b) => (a.shirt_number || 99) - (b.shirt_number || 99)).map(j => `
                        <div style="display:flex;align-items:center;gap:8px;padding:8px;background:#f3f4f6;border-radius:8px;">
                            <span style="background:#6b7280;color:white;width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">${j.shirt_number || '-'}</span>
                            <span style="font-size:12px;">${j.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Crear modal dinámico
    const modalHTML = `
        <div id="modal-ver-partido" class="modal-overlay" onclick="cerrarModalVerPartido(event)">
            <div class="modal-content" style="max-width:700px;" onclick="event.stopPropagation()">
                <div class="modal-header" style="background:linear-gradient(135deg,#059669,#047857);color:white;">
                    <div>
                        <h3 style="margin:0;">${esLocal ? (club?.name || 'Mi Equipo') : p.opponent} vs ${esLocal ? p.opponent : (club?.name || 'Mi Equipo')}</h3>
                        <p style="margin:5px 0 0;font-size:13px;opacity:0.9;">${p.competition || 'Partido'} • ${fecha} ${hora ? '• ' + hora : ''}</p>
                    </div>
                    <button class="modal-close" onclick="cerrarModalVerPartido()" style="color:white;">&times;</button>
                </div>
                <div class="modal-body">
                    ${resultadoHTML}
                    
${p.video_url ? generarVideoParaVerPartido(p.video_url) : ''}
                    
                    
                    <div style="margin-bottom:20px;">
                        <h4 style="font-size:14px;color:#374151;margin-bottom:10px;">📍 Información</h4>
                        <div style="background:#f8fafc;padding:15px;border-radius:10px;font-size:13px;">
                            ${p.stadium ? `<p style="margin:0 0 5px;"><strong>Estadio:</strong> ${p.stadium}</p>` : ''}
                            ${p.round ? `<p style="margin:0 0 5px;"><strong>Jornada:</strong> ${p.round}</p>` : ''}
                            ${p.lugar_encuentro ? `<p style="margin:0 0 5px;"><strong>Citación:</strong> ${p.lugar_encuentro} ${p.hora_salida ? 'a las ' + p.hora_salida : ''}</p>` : ''}
                            ${p.notas_convocatoria ? `<p style="margin:0;"><strong>Notas:</strong> ${p.notas_convocatoria}</p>` : ''}
                        </div>
                    </div>
                    
                    <div style="margin-bottom:20px;">
                        <h4 style="font-size:14px;color:#374151;margin-bottom:10px;">⚽ Titulares (${titulares.length})</h4>
                        ${titularesHTML}
                        ${suplentesHTML}
                    </div>
                    
                    <div>
                        <h4 style="font-size:14px;color:#374151;margin-bottom:10px;">📋 Convocados (${convocados.length})</h4>
                        ${convocadosHTML}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="generarPDFConvocatoriaDesdeVer('${partidoId}')">📋 PDF Convocatoria</button>
                    <button class="btn-secondary" onclick="exportarPartidoPDF('${partidoId}')">📄 PDF Partido</button>
                    <button class="btn-primary green" onclick="cerrarModalVerPartido(); editarPartido('${partidoId}');">Editar</button>
                </div>
            </div>
        </div>
    `;
    
    // Insertar modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function cerrarModalVerPartido(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('modal-ver-partido');
    if (modal) modal.remove();
}

async function generarPDFConvocatoriaDesdeVer(partidoId) {
    // Cargar datos del partido y generar PDF
    const { data: p } = await supabaseClient.from('matches').select('*').eq('id', partidoId).single();
    if (!p) return;
    
    // Cargar en el formulario temporalmente para usar la función existente
    document.getElementById('partido-id').value = p.id;
    document.getElementById('partido-rival').value = p.opponent || '';
    document.getElementById('partido-competicion').value = p.competition || '';
    document.getElementById('partido-fecha').value = p.match_date || '';
    document.getElementById('partido-hora').value = p.kick_off_time || '';
    document.getElementById('partido-localidad').value = p.home_away || 'home';
    document.getElementById('partido-estadio').value = p.stadium || '';
    document.getElementById('partido-lugar-encuentro').value = p.lugar_encuentro || '';
    document.getElementById('partido-hora-salida').value = p.hora_salida || '';
    document.getElementById('partido-fecha-salida').value = p.fecha_salida || '';
    document.getElementById('partido-notas-convocatoria').value = p.notas_convocatoria || '';
    
    // Cargar convocados y titulares
    plantillaPartido = await cargarPlantillaParaPDF();
    convocadosPartido = (p.convocados || []).map(c => String(c.id));
    titularesPartido = (p.titulares || []).map(t => String(t.id));
    
    await generarPDFConvocatoria();
}

async function cargarPlantillaParaPDF() {
    const { data } = await supabaseClient
        .from('season_players')
        .select('id, player_id, shirt_number, players(id, name, position, photo_url)')
        .eq('season_id', seasonId)
        .order('shirt_number');
    return data || [];
}
        function editarPartido(id) {
            abrirModalPartido(id);
        }
        
     
        
       async function cargarConvocatoria() {
    const grid = document.getElementById('convocatoria-grid');
    
    if (!seasonId) {
        grid.innerHTML = '<p style="color:#9ca3af;">No hay temporada activa seleccionada</p>';
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('season_players')
            .select('id, player_id, shirt_number, players(id, name, position, photo_url)')
            .eq('season_id', seasonId)
            .order('shirt_number');
        
        if (error) {
            console.error('Error cargando convocatoria:', error);
            grid.innerHTML = '<p style="color:#dc2626;">Error al cargar jugadores</p>';
            return;
        }
        
        plantillaPartido = data || [];
        
        if (plantillaPartido.length === 0) {
            grid.innerHTML = '<p style="color:#9ca3af;">No hay jugadores en la plantilla de esta temporada</p>';
            return;
        }
        
        renderizarConvocatoria();
        
    } catch (err) {
        console.error('Error:', err);
        grid.innerHTML = '<p style="color:#dc2626;">Error de conexión</p>';
    }
}

function renderizarConvocatoria() {
            const grid = document.getElementById('convocatoria-grid');
            
            grid.innerHTML = plantillaPartido.map(sp => {
                const j = sp.players;
                if (!j) return '';
                const seleccionado = convocadosPartido.includes(String(sp.id));
                const foto = j.photo_url;
                const inicial = j.name ? j.name.charAt(0).toUpperCase() : '?';
                return `
                    <div class="jugador-check ${seleccionado ? 'selected' : ''}" data-sp-id="${sp.id}" onclick="toggleConvocado('${sp.id}')">
                        <div class="jugador-foto-mini">
                            ${foto ? `<img src="${foto}" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">` 
                                   : `<span class="jugador-inicial" style="width:36px;height:36px;border-radius:50%;background:#6b21a8;color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;">${inicial}</span>`}
                        </div>
                        <div class="jugador-check-info">
                            <div class="nombre">${j.name}</div>
                            <div class="posicion">${j.position || ''}</div>
                        </div>
                        <div class="dorsal">${sp.shirt_number || '-'}</div>
                    </div>
                `;
            }).join('');
            
            actualizarContadorConvocados();
            renderizarAlineacion();
        }
        
     function toggleConvocado(spId) {
    spId = String(spId); // Asegurar que es string
    const idx = convocadosPartido.indexOf(spId);
    if (idx > -1) {
        convocadosPartido.splice(idx, 1);
        // También quitar de titulares si estaba
        const idxTit = titularesPartido.indexOf(spId);
        if (idxTit > -1) titularesPartido.splice(idxTit, 1);
    } else {
        convocadosPartido.push(spId);
    }
    renderizarConvocatoria();
}
        
        function actualizarContadorConvocados() {
            document.getElementById('contador-convocados').textContent = `${convocadosPartido.length} convocados`;
        }
        
       function renderizarAlineacion() {
    const grid = document.getElementById('alineacion-grid');
    const contadorTitulares = document.getElementById('contador-titulares');
    const formatoEl = document.getElementById('partido-formato');
    
    if (!grid) {
        console.log('Grid de alineación no encontrado');
        return;
    }
    
    const formato = formatoEl ? (parseInt(formatoEl.value) || 11) : 11;
    
    // Actualizar contador directamente
    if (contadorTitulares) {
        contadorTitulares.textContent = `${titularesPartido.length}/${formato} titulares`;
    }
    
    const convocados = plantillaPartido.filter(sp => convocadosPartido.includes(String(sp.id)));
    
    if (convocados.length === 0) {
        grid.innerHTML = '<p style="color:#9ca3af;font-size:13px;">Primero selecciona los convocados</p>';
        return;
    }
    
    grid.innerHTML = convocados.map(sp => {
        const j = sp.players;
        if (!j) return '';
        const esTitular = titularesPartido.includes(String(sp.id));
        const foto = j.photo_url;
        const inicial = j.name ? j.name.charAt(0).toUpperCase() : '?';
        return `
            <div class="jugador-titular ${esTitular ? 'es-titular' : ''}" data-sp-id="${sp.id}" onclick="toggleTitular('${sp.id}')">
                <div class="jugador-foto-mini">
                    ${foto ? `<img src="${foto}" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">` 
                           : `<span class="jugador-inicial" style="width:32px;height:32px;border-radius:50%;background:#6b21a8;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;">${inicial}</span>`}
                </div>
                <div class="dorsal">${sp.shirt_number || '-'}</div>
                <div class="nombre">${j.name}</div>
            </div>
        `;
    }).join('');
}
    

      function toggleTitular(spId) {
    spId = String(spId); // Asegurar que es string
    const formato = parseInt(document.getElementById('partido-formato').value) || 11;
    const idx = titularesPartido.indexOf(spId);
    
    if (idx > -1) {
        titularesPartido.splice(idx, 1);
    } else {
        if (titularesPartido.length >= formato) {
            alert(`Máximo ${formato} titulares para este formato`);
            return;
        }
        titularesPartido.push(spId);
    }
    renderizarAlineacion();
}
        function actualizarContadorTitulares() {
            const formato = parseInt(document.getElementById('partido-formato').value) || 11;
            document.getElementById('contador-titulares').textContent = `${titularesPartido.length}/${formato} titulares`;
        }
        // Evento para actualizar al cambiar formato
        document.addEventListener('DOMContentLoaded', function() {
            const formatoSelect = document.getElementById('partido-formato');
            if (formatoSelect) {
                formatoSelect.addEventListener('change', function() {
                    const nuevoFormato = parseInt(this.value);
                    // Si hay más titulares que el nuevo formato, recortar
                    if (titularesPartido.length > nuevoFormato) {
                        titularesPartido = titularesPartido.slice(0, nuevoFormato);
                    }
                    renderizarAlineacion();
                });
            }
        });
        function cerrarModalPartido(event) {
            if (event && event.target !== event.currentTarget) return;
            document.getElementById('modal-partido').style.display = 'none';
        }
        
     async function guardarPartido() {
            const rival = document.getElementById('partido-rival').value.trim();
            const fecha = document.getElementById('partido-fecha').value;
            
            if (!rival || !fecha) {
                alert('Rival y fecha son obligatorios');
                return;
            }
            
            // Obtener datos de convocados para guardar
     const convocadosData = plantillaPartido
    .filter(sp => convocadosPartido.includes(String(sp.id)))
                .map(sp => ({
                    id: sp.id,
                    player_id: sp.player_id,
                    name: sp.players?.name || '',
                    shirt_number: sp.shirt_number,
                    position: sp.position
                }));
            
            const titularesData = plantillaPartido
    .filter(sp => titularesPartido.includes(String(sp.id)))
                .map(sp => ({
                    id: sp.id,
                    player_id: sp.player_id,
                    name: sp.players?.name || '',
                    shirt_number: sp.shirt_number,
                    position: sp.position
                }));
            
            const suplentesData = convocadosData.filter(c => !titularesPartido.includes(String(c.id)));
            
            // Subir escudo rival si se seleccionó uno nuevo
            let opponentLogoUrl = escudoRivalUrl;
            const escudoInput = document.getElementById('partido-rival-escudo-input');
            if (escudoInput && escudoInput.files.length > 0) {
                const uploadedUrl = await subirEscudoRivalPartido();
                if (uploadedUrl) opponentLogoUrl = uploadedUrl;
            }

            const partidoData = {
                club_id: clubId,
                season_id: seasonId,
                opponent: rival,
                match_date: fecha,
                kick_off_time: document.getElementById('partido-hora').value || null,
                home_away: document.getElementById('partido-localidad').value,
                stadium: document.getElementById('partido-estadio').value || null,
                competition: document.getElementById('partido-competicion').value || null,
                round: document.getElementById('partido-jornada').value || null,
                formato_juego: parseInt(document.getElementById('partido-formato').value) || 11,
                lugar_encuentro: document.getElementById('partido-lugar-encuentro').value || null,
                hora_salida: document.getElementById('partido-hora-salida').value || null,
                fecha_salida: document.getElementById('partido-fecha-salida').value || null,
                notas_convocatoria: document.getElementById('partido-notas-convocatoria').value || null,
                video_url: document.getElementById('partido-video-url').value.trim() || null,
                opponent_logo: opponentLogoUrl || null,
                convocados: convocadosData,
                titulares: titularesData,
                suplentes: suplentesData
            };
            console.log('Datos a guardar:', JSON.stringify(partidoData, null, 2));
            const partidoId = document.getElementById('partido-id').value;
            
           try {
    let resultado;
    if (partidoId) {
        resultado = await supabaseClient.from('matches').update(partidoData).eq('id', partidoId);
    } else {
        resultado = await supabaseClient.from('matches').insert(partidoData);
    }
    
    if (resultado.error) {
        console.error('Error Supabase:', resultado.error);
        alert('Error: ' + resultado.error.message);
        return;
    }
                
                cerrarModalPartido();
                cargarPartidos();
            } catch (error) {
                alert('Error al guardar: ' + error.message);
            }
        }
        
        async function eliminarPartido(id) {
            if (!confirm('¿Eliminar este partido?')) return;
            await supabaseClient.from('match_player_stats').delete().eq('match_id', id);
            await supabaseClient.from('matches').delete().eq('id', id);
            cargarPartidos();
        }
        
        // ========== MATCHSTATS: RESULTADO ==========
      async function abrirModalResultado(partidoId) {
    document.getElementById('resultado-partido-id').value = partidoId;
    
    const { data: p } = await supabaseClient.from('matches').select('*').eq('id', partidoId).single();
    
    if (!p) {
        alert('Partido no encontrado');
        return;
    }
    
    document.getElementById('resultado-favor').value = p.team_goals || 0;
    document.getElementById('resultado-contra').value = p.opponent_goals || 0;
    
    // Usar los convocados guardados en el partido (ahora son objetos JSON)
    const convocados = p.convocados || [];
    const grid = document.getElementById('stats-jugadores-grid');
    
    if (convocados.length === 0) {
        grid.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:20px;">No hay jugadores convocados en este partido.<br>Edita el partido primero para añadir convocados.</p>';
    } else {
        // Cargar estadísticas existentes
        const { data: statsExist } = await supabaseClient
            .from('match_player_stats')
            .select('*')
            .eq('match_id', partidoId);
        
        const statsMap = {};
        (statsExist || []).forEach(s => statsMap[s.player_id] = s);
        
        // Ordenar por dorsal
        const convocadosOrdenados = convocados.sort((a, b) => (a.shirt_number || 99) - (b.shirt_number || 99));
        
        grid.innerHTML = convocadosOrdenados.map(j => {
            const s = statsMap[j.player_id] || {};
            const esTitular = (p.titulares || []).some(t => t.player_id === j.player_id);
            
            return `
                <div class="jugador-stats-row" data-player-id="${j.player_id}">
                    <div class="nombre">
                        <span style="display:inline-block;background:${esTitular ? '#3b82f6' : '#6b7280'};color:white;width:22px;height:22px;border-radius:6px;text-align:center;line-height:22px;font-size:11px;margin-right:8px;">${j.shirt_number || '-'}</span>
                        ${j.name}
                        ${esTitular ? '<span style="font-size:10px;color:#3b82f6;margin-left:5px;">TIT</span>' : '<span style="font-size:10px;color:#9ca3af;margin-left:5px;">SUP</span>'}
                    </div>
                    <input type="number" class="stat-min" value="${s.minutes_played || 0}" min="0" max="120" placeholder="Min">
                    <input type="number" class="stat-goles" value="${s.goals || 0}" min="0" placeholder="Gol">
                    <input type="number" class="stat-asist" value="${s.assists || 0}" min="0" placeholder="Asi">
                    <input type="number" class="stat-amarillas" value="${s.yellow_cards || 0}" min="0" max="2" placeholder="TA">
                    <input type="number" class="stat-rojas" value="${s.red_cards || 0}" min="0" max="1" placeholder="TR">
                </div>
            `;
        }).join('');
    }
    
    document.getElementById('modal-resultado').style.display = 'flex';
}
        
        function cerrarModalResultado(event) {
            if (event && event.target !== event.currentTarget) return;
            document.getElementById('modal-resultado').style.display = 'none';
        }
        
     async function guardarResultado() {
    const partidoId = document.getElementById('resultado-partido-id').value;
    const gF = parseInt(document.getElementById('resultado-favor').value) || 0;
    const gC = parseInt(document.getElementById('resultado-contra').value) || 0;
    
    let resultado = 'draw';
    if (gF > gC) resultado = 'win';
    else if (gF < gC) resultado = 'loss';
    
    // Actualizar resultado del partido
    const { error: errorPartido } = await supabaseClient.from('matches').update({
        team_goals: gF,
        opponent_goals: gC,
        result: resultado
    }).eq('id', partidoId);
    
    if (errorPartido) {
        alert('Error al guardar resultado: ' + errorPartido.message);
        return;
    }
    
    // Guardar estadísticas de cada jugador
    const rows = document.querySelectorAll('.jugador-stats-row');
    let errores = [];
    
    for (const row of rows) {
        const playerId = row.dataset.playerId;
        const minutos = parseInt(row.querySelector('.stat-min').value) || 0;
        const goles = parseInt(row.querySelector('.stat-goles').value) || 0;
        const asistencias = parseInt(row.querySelector('.stat-asist').value) || 0;
        const amarillas = parseInt(row.querySelector('.stat-amarillas').value) || 0;
        const rojas = parseInt(row.querySelector('.stat-rojas').value) || 0;
        
        // Verificar si ya existe un registro para este jugador en este partido
        const { data: existente } = await supabaseClient
            .from('match_player_stats')
            .select('id')
            .eq('match_id', partidoId)
            .eq('player_id', playerId)
            .single();
        
        if (existente) {
            // Actualizar registro existente
            const { error } = await supabaseClient
                .from('match_player_stats')
                .update({
                    minutes_played: minutos,
                    goals: goles,
                    assists: asistencias,
                    yellow_cards: amarillas,
                    red_cards: rojas
                })
                .eq('id', existente.id);
            
            if (error) errores.push(error.message);
        } else {
            // Crear nuevo registro
            const { error } = await supabaseClient
                .from('match_player_stats')
                .insert({
                    match_id: partidoId,
                    player_id: playerId,
                    minutes_played: minutos,
                    goals: goles,
                    assists: asistencias,
                    yellow_cards: amarillas,
                    red_cards: rojas
                });
            
            if (error) errores.push(error.message);
        }
    }
    
    if (errores.length > 0) {
        console.error('Errores al guardar stats:', errores);
        alert('Algunos datos no se guardaron correctamente');
    } else {
        alert('Resultado y estadísticas guardados correctamente');
    }
    
    cerrarModalResultado();
    cargarPartidos();
}
        
        // ========== MATCHSTATS: ESTADÍSTICAS ==========
        async function cargarSelectorTemporadasStats() {
            const select = document.getElementById('stats-temporada');
            const { data } = await supabaseClient.from('seasons').select('*').eq('club_id', clubId).order('start_date', { ascending: false });
            
            select.innerHTML = (data || []).map(t => {
                const selected = t.id === seasonId ? 'selected' : '';
                return `<option value="${t.id}" ${selected}>${t.name}</option>`;
            }).join('');
        }
        
        async function cargarEstadisticas() {
            const tempId = document.getElementById('stats-temporada').value || seasonId;
            const resumenDiv = document.getElementById('stats-resumen');
            const tablaBody = document.getElementById('stats-tabla-body');
            
            // Resumen partidos
            const { data: partidos } = await supabaseClient.from('matches').select('*').eq('season_id', tempId).not('result', 'is', null);
            
            const victorias = partidos?.filter(p => p.result === 'win').length || 0;
            const empates = partidos?.filter(p => p.result === 'draw').length || 0;
            const derrotas = partidos?.filter(p => p.result === 'loss').length || 0;
            const gF = partidos?.reduce((sum, p) => sum + (p.team_goals || 0), 0) || 0;
            const gC = partidos?.reduce((sum, p) => sum + (p.opponent_goals || 0), 0) || 0;
            
            resumenDiv.innerHTML = `
                <div class="stat-card victoria"><div class="valor">${victorias}</div><div class="label">Victorias</div></div>
                <div class="stat-card empate"><div class="valor">${empates}</div><div class="label">Empates</div></div>
                <div class="stat-card derrota"><div class="valor">${derrotas}</div><div class="label">Derrotas</div></div>
                <div class="stat-card"><div class="valor">${gF}</div><div class="label">Goles a favor</div></div>
                <div class="stat-card"><div class="valor">${gC}</div><div class="label">Goles en contra</div></div>
            `;
            
            // Stats por jugador
            const { data: stats } = await supabaseClient
                .from('match_player_stats')
                .select('*, players(id, name, position, photo_url), matches!inner(season_id)')
                .eq('matches.season_id', tempId);
            
            const jugadorStats = {};
            (stats || []).forEach(s => {
                const pid = s.player_id;
                if (!jugadorStats[pid]) {
                    jugadorStats[pid] = { player: s.players, pj: 0, min: 0, goles: 0, asist: 0, ta: 0, tr: 0 };
                }
                if (s.minutes_played > 0) jugadorStats[pid].pj++;
                jugadorStats[pid].min += s.minutes_played || 0;
                jugadorStats[pid].goles += s.goals || 0;
                jugadorStats[pid].asist += s.assists || 0;
                jugadorStats[pid].ta += s.yellow_cards || 0;
                jugadorStats[pid].tr += s.red_cards || 0;
            });
            
            const ordenados = Object.values(jugadorStats).sort((a, b) => b.goles - a.goles);
            
            if (ordenados.length === 0) {
                tablaBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#9ca3af;">No hay estadisticas</td></tr>';
            } else {
               tablaBody.innerHTML = ordenados.map(j => {
    const inicial = j.player?.name?.charAt(0) || '?';
    const playerId = j.player?.id;
    return `
        <tr onclick="abrirFichaJugador('${playerId}')" style="cursor: pointer;" title="Ver ficha completa">
            <td>
                <div class="jugador-cell">
                    <div class="jugador-mini-foto">
                        ${j.player?.photo_url ? `<img src="${j.player.photo_url}">` : inicial}
                    </div>
                    <div>
                        <strong>${j.player?.name || 'Sin nombre'}</strong>
                        <div style="font-size:12px;color:#6b7280;">${j.player?.position || ''}</div>
                    </div>
                </div>
            </td>
            <td>${j.pj}</td>
            <td>${j.min}</td>
            <td><strong>${j.goles}</strong></td>
            <td>${j.asist}</td>
            <td>${j.ta}</td>
            <td>${j.tr}</td>
        </tr>
    `;
}).join('');
            }
        }
        // ========== FICHA JUGADOR ==========


async function abrirFichaJugador(playerId) {
    if (!playerId) return;
    
    fichaJugadorActual = playerId;
    const tempId = document.getElementById('stats-temporada').value || seasonId;
    
    // Cargar datos del jugador
    const { data: jugador } = await supabaseClient
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();
    
    if (!jugador) {
        alert('Jugador no encontrado');
        return;
    }
    
    // Actualizar header del modal
    const fotoDiv = document.getElementById('ficha-foto');
    if (jugador.photo_url) {
        fotoDiv.innerHTML = `<img src="${jugador.photo_url}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
        fotoDiv.innerHTML = jugador.name?.charAt(0) || '?';
    }
    document.getElementById('ficha-nombre').textContent = jugador.name || 'Sin nombre';
    document.getElementById('ficha-posicion').textContent = jugador.position || 'Sin posición';
    
    // Datos personales
    const datosDiv = document.getElementById('ficha-datos-personales');
    const edad = jugador.birth_date ? calcularEdad(jugador.birth_date) : null;
    datosDiv.innerHTML = `
        ${jugador.birth_date ? `<div><strong>Edad:</strong> ${edad} años</div>` : ''}
        ${jugador.height_cm ? `<div><strong>Altura:</strong> ${jugador.height_cm} cm</div>` : ''}
        ${jugador.weight_kg ? `<div><strong>Peso:</strong> ${jugador.weight_kg} kg</div>` : ''}
        ${jugador.dominant_foot ? `<div><strong>Pie:</strong> ${jugador.dominant_foot}</div>` : ''}
        ${jugador.phone ? `<div><strong>Tel:</strong> ${jugador.phone}</div>` : ''}
        ${jugador.email ? `<div><strong>Email:</strong> ${jugador.email}</div>` : ''}
    `;
    
    // Cargar estadísticas del jugador en la temporada
    const { data: stats } = await supabaseClient
        .from('match_player_stats')
        .select('*, matches!inner(id, opponent, match_date, home_away, team_goals, opponent_goals, result, season_id)')
        .eq('player_id', playerId)
        .eq('matches.season_id', tempId)
        .order('matches(match_date)', { ascending: false });
    
    // Calcular resumen
    let totalPJ = 0, totalMin = 0, totalGoles = 0, totalAsist = 0, totalTA = 0, totalTR = 0;
    (stats || []).forEach(s => {
        if (s.minutes_played > 0) totalPJ++;
        totalMin += s.minutes_played || 0;
        totalGoles += s.goals || 0;
        totalAsist += s.assists || 0;
        totalTA += s.yellow_cards || 0;
        totalTR += s.red_cards || 0;
    });
    
    // Mostrar resumen
    document.getElementById('ficha-stats-resumen').innerHTML = `
        <div style="text-align:center;padding:15px;background:#ecfdf5;border-radius:10px;">
            <div style="font-size:28px;font-weight:700;color:#059669;">${totalPJ}</div>
            <div style="font-size:12px;color:#6b7280;">Partidos</div>
        </div>
        <div style="text-align:center;padding:15px;background:#eff6ff;border-radius:10px;">
            <div style="font-size:28px;font-weight:700;color:#3b82f6;">${totalMin}</div>
            <div style="font-size:12px;color:#6b7280;">Minutos</div>
        </div>
        <div style="text-align:center;padding:15px;background:#fef3c7;border-radius:10px;">
            <div style="font-size:28px;font-weight:700;color:#d97706;">${totalGoles}</div>
            <div style="font-size:12px;color:#6b7280;">Goles</div>
        </div>
        <div style="text-align:center;padding:15px;background:#f3e8ff;border-radius:10px;">
            <div style="font-size:28px;font-weight:700;color:#9333ea;">${totalAsist}</div>
            <div style="font-size:12px;color:#6b7280;">Asistencias</div>
        </div>
        <div style="text-align:center;padding:15px;background:#fef2f2;border-radius:10px;">
            <div style="font-size:28px;font-weight:700;color:#ef4444;">${totalTA}</div>
            <div style="font-size:12px;color:#6b7280;">Amarillas</div>
        </div>
        <div style="text-align:center;padding:15px;background:#fee2e2;border-radius:10px;">
            <div style="font-size:28px;font-weight:700;color:#dc2626;">${totalTR}</div>
            <div style="font-size:12px;color:#6b7280;">Rojas</div>
        </div>
    `;
    
    // Mostrar detalle partido a partido
    const tbody = document.getElementById('ficha-partidos-body');
    if (!stats || stats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:20px;">No hay partidos registrados</td></tr>';
    } else {
        tbody.innerHTML = stats.map(s => {
            const m = s.matches;
            const fecha = new Date(m.match_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            const esLocal = m.home_away === 'home';
            const marcador = esLocal ? `${m.team_goals || 0}-${m.opponent_goals || 0}` : `${m.opponent_goals || 0}-${m.team_goals || 0}`;
            
            let resultadoClass = '';
            let resultadoTexto = marcador;
            if (m.result === 'win') resultadoClass = 'color:#059669;font-weight:600;';
            else if (m.result === 'loss') resultadoClass = 'color:#dc2626;font-weight:600;';
            else if (m.result === 'draw') resultadoClass = 'color:#d97706;';
            
            return `
                <tr>
                    <td>${fecha}</td>
                    <td>${esLocal ? 'vs ' : '@ '}${m.opponent}</td>
                    <td style="${resultadoClass}">${resultadoTexto}</td>
                    <td>${s.minutes_played || 0}'</td>
                    <td><strong>${s.goals || 0}</strong></td>
                    <td>${s.assists || 0}</td>
                    <td>${s.yellow_cards || 0}</td>
                    <td>${s.red_cards || 0}</td>
                </tr>
            `;
        }).join('');
    }
    
    document.getElementById('modal-ficha-jugador').style.display = 'flex';
}

function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
}

function cerrarModalFichaJugador(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('modal-ficha-jugador').style.display = 'none';
}

function previsualizarEscudoRival(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        escudoRivalUrl = e.target.result; // Guardar el base64
        const container = document.getElementById('partido-rival-escudo');
        container.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
        container.style.border = 'none';
    };
    reader.readAsDataURL(file);
}

async function subirEscudoRivalPartido() {
    const input = document.getElementById('partido-rival-escudo-input');
    if (!input.files.length) return null;
    
    const file = input.files[0];
    const fileName = `rival_${Date.now()}.${file.name.split('.').pop()}`;
    
    const { data, error } = await supabaseClient.storage
        .from('logos')
        .upload(fileName, file);
    
    if (error) {
        console.error('Error subiendo escudo rival:', error);
        return null;
    }
    
    const { data: urlData } = supabaseClient.storage
        .from('logos')
        .getPublicUrl(fileName);
    
    return urlData.publicUrl;
}

function resetearEscudoRival() {
    escudoRivalUrl = null;
    const container = document.getElementById('partido-rival-escudo');
    container.innerHTML = '<span style="font-size: 20px;">🛡️</span>';
    container.style.border = '2px dashed #d1d5db';
    document.getElementById('partido-rival-escudo-input').value = '';
}

function cargarEscudoRival(url) {
    if (url) {
        escudoRivalUrl = url;
        const container = document.getElementById('partido-rival-escudo');
        container.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">`;
        container.style.border = 'none';
    } else {
        resetearEscudoRival();
    }
}

// Init: formato de partido listener
document.addEventListener('DOMContentLoaded', function() {
    var formatoSelect = document.getElementById('partido-formato');
    if (formatoSelect) {
        formatoSelect.addEventListener('change', function() {
            var nuevoFormato = parseInt(this.value);
            if (titularesPartido.length > nuevoFormato) {
                titularesPartido = titularesPartido.slice(0, nuevoFormato);
            }
            renderizarAlineacion();
        });
    }
});
