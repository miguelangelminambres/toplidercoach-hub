// ========== DASHBOARD.JS - TopLiderCoach HUB ==========
// Dashboard principal, gráficos Chart.js, alertas

registrarModulo('dashboard', function() {
    cargarSelectorTemporadasDashboard();
    cargarDashboard();
});

// Dashboard es el módulo visible por defecto, cargar al iniciar la app
registrarInit(function() {
    cargarSelectorTemporadasDashboard();
    cargarDashboard();
});

async function cargarSelectorTemporadasDashboard() {
    const select = document.getElementById('dashboard-temporada');
    if (!select) return;
    
    const { data: temporadas } = await supabaseClient
        .from('seasons')
        .select('*')
        .eq('club_id', clubId)
        .order('start_date', { ascending: false });
    
    select.innerHTML = '<option value="">Todas las temporadas</option>';
    
    if (temporadas) {
        temporadas.forEach(t => {
            const option = document.createElement('option');
            option.value = t.id;
            option.textContent = t.name;
            if (t.id === seasonId) option.selected = true;
            select.appendChild(option);
        });
    }
}

// Función principal para cargar todo el dashboard
async function cargarDashboard() {
    await cargarDatosPartidosDashboard();
    await cargarDatosEntrenamientosDashboard();
    await cargarProximosEventos();
    await cargarAlertasWellness();
}

// Cargar datos de partidos
async function cargarDatosPartidosDashboard() {
    const tempSelect = document.getElementById('dashboard-temporada');
    const tempId = tempSelect?.value || seasonId;
    
    let query = supabaseClient
        .from('matches')
        .select('*')
        .eq('club_id', clubId)
        .order('match_date', { ascending: false });
    
    if (tempId) {
        query = query.eq('season_id', tempId);
    }
    
    const { data: partidos } = await query;
    
    if (!partidos || partidos.length === 0) {
        mostrarSinDatosPartidos();
        return;
    }
    
    // Calcular estadísticas
    const partidosJugados = partidos.filter(p => p.result);
    const victorias = partidosJugados.filter(p => p.result === 'win').length;
    const empates = partidosJugados.filter(p => p.result === 'draw').length;
    const derrotas = partidosJugados.filter(p => p.result === 'loss').length;
    const golesFavor = partidosJugados.reduce((sum, p) => sum + (p.team_goals || 0), 0);
    const golesContra = partidosJugados.reduce((sum, p) => sum + (p.opponent_goals || 0), 0);
    
    // Actualizar tarjetas
    document.getElementById('dash-victorias').textContent = victorias;
    document.getElementById('dash-empates').textContent = empates;
    document.getElementById('dash-derrotas').textContent = derrotas;
    document.getElementById('dash-goles').textContent = golesFavor;
    
    // Diferencia de goles
    const diferencia = golesFavor - golesContra;
    const difEl = document.getElementById('dash-diferencia-goles');
    difEl.textContent = (diferencia >= 0 ? '+' : '') + diferencia;
    difEl.style.color = diferencia >= 0 ? '#22c55e' : '#ef4444';
    
    // Últimos y próximos partidos (jugados recientes + pendientes)
    const jugadosRecientes = partidosJugados.slice(0, 5);
    const pendientes = partidos.filter(p => !p.result).reverse().slice(0, 5);
    const todosParaMostrar = [...jugadosRecientes, ...pendientes]
        .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
        .slice(-10);
    mostrarUltimosPartidos(todosParaMostrar);
    
    // Gráfico de resultados por competición (multi-donut)
    crearGraficosResultadosPorCompeticion(partidosJugados);
    
    // Gráfico de goles
    crearGraficoGoles(golesFavor, golesContra);
}

function calcularPorcentaje(valor, total) {
    if (total === 0) return 0;
    return Math.round((valor / total) * 100);
}

function mostrarSinDatosPartidos() {
    document.getElementById('dash-victorias').textContent = '0';
    document.getElementById('dash-empates').textContent = '0';
    document.getElementById('dash-derrotas').textContent = '0';
    document.getElementById('dash-goles').textContent = '0';
    document.getElementById('dash-diferencia-goles').textContent = '+0';
    
    document.getElementById('dash-ultimos-partidos').innerHTML = `
        <div class="sin-datos">
            <div class="icono">⚽</div>
            <p>No hay partidos registrados</p>
        </div>
    `;
    
    crearGraficosResultadosPorCompeticion([]);
    crearGraficoGoles(0, 0);
}

function mostrarUltimosPartidos(partidos) {
    const container = document.getElementById('dash-ultimos-partidos');
    
    if (!partidos || partidos.length === 0) {
        container.innerHTML = `
            <div class="sin-datos">
                <div class="icono">⚽</div>
                <p>No hay partidos registrados</p>
            </div>
        `;
        return;
    }
    
    const miEscudo = clubData?.logo_url 
        ? `<img src="${clubData.logo_url}" alt="" class="escudo-mini">` 
        : `<span class="escudo-placeholder">🏠</span>`;
    const miNombre = clubData?.name || 'Mi Equipo';
    
    container.innerHTML = partidos.map(p => {
        const esLocal = p.home_away === 'home';
        const jugado = !!p.result;
        const fecha = new Date(p.match_date);
        const fechaStr = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
        const hora = p.kick_off_time ? p.kick_off_time.slice(0, 5) : '';
        
        // Competición + jornada
        let competicionStr = '';
        if (p.competition) {
            competicionStr = p.competition;
            if (p.round) competicionStr += '. ' + p.round;
        }
        
        // Escudo rival
        const rivalEscudo = p.opponent_logo 
            ? `<img src="${p.opponent_logo}" alt="" class="escudo-mini">` 
            : `<span class="escudo-placeholder">🏟️</span>`;
        
        // Equipo izquierda (local) y derecha (visitante)
        const equipoIzq = esLocal ? miNombre : p.opponent;
        const escudoIzq = esLocal ? miEscudo : rivalEscudo;
        const equipoDer = esLocal ? p.opponent : miNombre;
        const escudoDer = esLocal ? rivalEscudo : miEscudo;
        
        // Marcador o hora
        let centroHTML = '';
        if (jugado) {
            const gF = p.team_goals || 0;
            const gC = p.opponent_goals || 0;
            const marcador = esLocal ? `${gF}-${gC}` : `${gC}-${gF}`;
            centroHTML = `<span class="match-score">${marcador}</span>`;
        } else {
            centroHTML = `<span class="match-time">${hora || 'TBD'}</span>`;
        }
        
        // Badge resultado
        let badgeHTML = '';
        if (jugado) {
            const claseRes = p.result === 'win' ? 'badge-win' : p.result === 'draw' ? 'badge-draw' : 'badge-loss';
            badgeHTML = `<span class="match-badge ${claseRes}">Fin</span>`;
        }
        
        return `
            <div class="match-row ${jugado ? 'played' : 'upcoming'}" onclick="verPartido('${p.id}')">
                ${badgeHTML}
                ${competicionStr ? `<div class="match-competition">${competicionStr}</div>` : ''}
                <div class="match-teams">
                    <div class="match-team left">
                        <span class="team-name">${equipoIzq}</span>
                        ${escudoIzq}
                    </div>
                    <div class="match-center">
                        ${centroHTML}
                    </div>
                    <div class="match-team right">
                        ${escudoDer}
                        <span class="team-name">${equipoDer}</span>
                    </div>
                </div>
                <div class="match-date">${fechaStr}</div>
            </div>
        `;
    }).join('');
}

// Charts por competición almacenados
let chartsCompeticion = [];

function crearGraficosResultadosPorCompeticion(partidosJugados) {
    // Destruir charts anteriores
    chartsCompeticion.forEach(c => c.destroy());
    chartsCompeticion = [];
    
    // Calcular stats totales
    const totalV = partidosJugados.filter(p => p.result === 'win').length;
    const totalE = partidosJugados.filter(p => p.result === 'draw').length;
    const totalD = partidosJugados.filter(p => p.result === 'loss').length;
    const totalP = totalV + totalE + totalD;
    
    // Crear donut Total
    const ctxTotal = document.getElementById('chart-resultados-total');
    if (ctxTotal) {
        const chart = crearDonut(ctxTotal, totalV, totalE, totalD);
        if (chart) chartsCompeticion.push(chart);
    }
    
    const statsTotal = document.getElementById('stats-total');
    if (statsTotal) {
        statsTotal.innerHTML = `<span class="donut-stat-line">${totalP} PJ · ${totalV}V · ${totalE}E · ${totalD}D</span>`;
    }
    
    // Agrupar por competición
    const porCompeticion = {};
    partidosJugados.forEach(p => {
        const comp = p.competition || 'Sin clasificar';
        if (!porCompeticion[comp]) porCompeticion[comp] = [];
        porCompeticion[comp].push(p);
    });
    
    // Crear donuts por competición
    const container = document.getElementById('donuts-competiciones');
    if (!container) return;
    container.innerHTML = '';
    
    const competiciones = Object.keys(porCompeticion).sort();
    
    if (competiciones.length === 0) {
        container.innerHTML = '<p style="color:#9ca3af;font-size:12px;text-align:center;grid-column:1/-1;">No hay datos por competición</p>';
        return;
    }
    
    competiciones.forEach(comp => {
        const partidos = porCompeticion[comp];
        const v = partidos.filter(p => p.result === 'win').length;
        const e = partidos.filter(p => p.result === 'draw').length;
        const d = partidos.filter(p => p.result === 'loss').length;
        const pj = v + e + d;
        
        const canvasId = 'chart-comp-' + comp.replace(/\s+/g, '-').toLowerCase();
        
        const wrapper = document.createElement('div');
        wrapper.className = 'resultado-donut mini';
        wrapper.innerHTML = `
            <canvas id="${canvasId}"></canvas>
            <div class="donut-label">${comp}</div>
            <div class="donut-stats"><span class="donut-stat-line">${pj}PJ · ${v}V · ${e}E · ${d}D</span></div>
        `;
        container.appendChild(wrapper);
        
        const ctx = document.getElementById(canvasId);
        if (ctx) {
            const chart = crearDonut(ctx, v, e, d);
            if (chart) chartsCompeticion.push(chart);
        }
    });
}

function crearDonut(ctx, victorias, empates, derrotas) {
    const total = victorias + empates + derrotas;
    
    if (total === 0) {
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Sin partidos'],
                datasets: [{ data: [1], backgroundColor: ['#e5e7eb'], borderWidth: 0 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    }
    
    // Plugin para texto central
    const centerTextPlugin = {
        id: 'centerText',
        afterDraw: function(chart) {
            const { ctx: c, chartArea } = chart;
            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2;
            const pct = total > 0 ? Math.round((victorias / total) * 100) : 0;
            
            c.save();
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.font = 'bold ' + (chart.canvas.parentElement.classList.contains('principal') ? '22px' : '16px') + ' system-ui';
            c.fillStyle = '#22c55e';
            c.fillText(pct + '%', centerX, centerY - 6);
            c.font = (chart.canvas.parentElement.classList.contains('principal') ? '11px' : '9px') + ' system-ui';
            c.fillStyle = '#9ca3af';
            c.fillText('victorias', centerX, centerY + 12);
            c.restore();
        }
    };
    
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Victorias', 'Empates', 'Derrotas'],
            datasets: [{
                data: [victorias, empates, derrotas],
                backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '68%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percentage = Math.round((value / total) * 100);
                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        },
        plugins: [centerTextPlugin]
    });
}

function crearGraficoGoles(favor, contra) {
    const ctx = document.getElementById('chart-goles');
    if (!ctx) return;
    
    // Destruir gráfico anterior si existe
    if (chartGoles) {
        chartGoles.destroy();
    }
    
    chartGoles = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['A favor', 'En contra', 'Diferencia'],
            datasets: [{
                data: [favor, contra, favor - contra],
                backgroundColor: ['#22c55e', '#ef4444', favor >= contra ? '#3b82f6' : '#f97316'],
                borderRadius: 8,
                barThickness: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.raw} goles`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f0f0f0'
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// Cargar datos de entrenamientos del mes actual
async function cargarDatosEntrenamientosDashboard() {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).toISOString().split('T')[0];
    
    // Sesiones del mes
    const { data: sesiones } = await supabaseClient
        .from('training_sessions')
        .select('id')
        .eq('club_id', clubId)
        .gte('session_date', inicioMes)
        .lte('session_date', finMes);
    
    const numSesiones = sesiones?.length || 0;
    document.getElementById('dash-sesiones').textContent = numSesiones;
    
    if (numSesiones === 0) {
        document.getElementById('dash-asistencia-media').textContent = '-';
        document.getElementById('dash-wellness-medio').textContent = '-';
        return;
    }
    
    // Asistencia del mes
    const sesionIds = sesiones.map(s => s.id);
    const { data: asistencias } = await supabaseClient
        .from('attendance')
        .select('asistio, wellness')
        .in('sesion_id', sesionIds);
    
    if (asistencias && asistencias.length > 0) {
        const totalRegistros = asistencias.length;
        const asistieron = asistencias.filter(a => a.asistio).length;
        const porcentaje = Math.round((asistieron / totalRegistros) * 100);
        document.getElementById('dash-asistencia-media').textContent = porcentaje + '%';
        
        // Wellness medio
        const wellnessValues = asistencias.filter(a => a.wellness).map(a => a.wellness);
        if (wellnessValues.length > 0) {
            const wellnessMedio = (wellnessValues.reduce((a, b) => a + b, 0) / wellnessValues.length).toFixed(1);
            document.getElementById('dash-wellness-medio').textContent = wellnessMedio;
        } else {
            document.getElementById('dash-wellness-medio').textContent = '-';
        }
    } else {
        document.getElementById('dash-asistencia-media').textContent = '-';
        document.getElementById('dash-wellness-medio').textContent = '-';
    }
}

// Cargar próximos eventos (partidos y sesiones)
async function cargarProximosEventos() {
    const container = document.getElementById('dash-proximos-eventos');
    const hoy = new Date().toISOString().split('T')[0];
    
    // Próximos partidos
    const { data: partidos } = await supabaseClient
        .from('matches')
        .select('*')
        .eq('club_id', clubId)
        .gte('match_date', hoy)
        .is('result', null)
        .order('match_date')
        .limit(3);
    
    // Próximas sesiones
    const { data: sesiones } = await supabaseClient
        .from('training_sessions')
        .select('*')
        .eq('club_id', clubId)
        .gte('session_date', hoy)
        .order('session_date')
        .limit(3);
    
    // Combinar y ordenar
    const eventos = [];
    
    (partidos || []).forEach(p => {
        eventos.push({
            tipo: 'partido',
            fecha: p.match_date,
            titulo: `vs ${p.opponent}`,
            subtitulo: p.home_away === 'home' ? 'Local' : 'Visitante',
            hora: p.kick_off_time ? p.kick_off_time.slice(0, 5) : ''
        });
    });
    
    (sesiones || []).forEach(s => {
        eventos.push({
            tipo: 'sesion',
            fecha: s.session_date,
            titulo: s.name,
            subtitulo: s.objective || 'Entrenamiento',
            hora: s.hora_inicio || ''
        });
    });
    
    // Ordenar por fecha
    eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    // Mostrar solo los 5 primeros
    const eventosLimitados = eventos.slice(0, 5);
    
    if (eventosLimitados.length === 0) {
        container.innerHTML = `
            <div class="sin-datos">
                <div class="icono">📅</div>
                <p>No hay eventos próximos programados</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = eventosLimitados.map(e => {
        const fecha = new Date(e.fecha);
        const dia = fecha.getDate();
        const mes = fecha.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
        
        return `
            <div class="evento-item ${e.tipo}">
                <div class="evento-fecha">
                    <div class="dia">${dia}</div>
                    <div class="mes">${mes}</div>
                </div>
                <div class="evento-info">
                    <div class="titulo">${e.titulo}</div>
                    <div class="subtitulo">${e.subtitulo}${e.hora ? ' - ' + e.hora : ''}</div>
                </div>
                <div class="evento-tipo ${e.tipo}">${e.tipo === 'partido' ? '⚽ Partido' : '🏃 Entreno'}</div>
            </div>
        `;
    }).join('');
}

// Cargar alertas de bienestar (wellness bajo o daño muscular alto)
async function cargarAlertasWellness() {
    const container = document.getElementById('dash-alertas-wellness');
    
    // Obtener la última sesión con asistencia
    const { data: ultimaSesion } = await supabaseClient
        .from('training_sessions')
        .select('id, session_date, name')
        .eq('club_id', clubId)
        .order('session_date', { ascending: false })
        .limit(1)
        .single();
    
    if (!ultimaSesion) {
        container.innerHTML = `
            <div class="sin-datos">
                <div class="icono">✅</div>
                <p>Sin datos de bienestar recientes</p>
            </div>
        `;
        return;
    }
    
    // Obtener asistencia de la última sesión
    const { data: asistencias } = await supabaseClient
        .from('attendance')
        .select(`
            wellness,
            estado_muscular,
            jugador_id,
            players (name, position)
        `)
        .eq('sesion_id', ultimaSesion.id)
        .eq('asistio', true);
    
    if (!asistencias || asistencias.length === 0) {
        container.innerHTML = `
            <div class="sin-datos">
                <div class="icono">✅</div>
                <p>Sin registros de bienestar en la última sesión</p>
            </div>
        `;
        return;
    }
    
    // Filtrar alertas
    const alertas = [];
    
    asistencias.forEach(a => {
        if (a.wellness && a.wellness <= 5) {
            alertas.push({
                jugador: a.players?.name || 'Jugador',
                tipo: 'Wellness bajo',
                valor: a.wellness,
                clase: a.wellness <= 3 ? '' : 'warning'
            });
        }
        if (a.estado_muscular && a.estado_muscular >= 6) {
            alertas.push({
                jugador: a.players?.name || 'Jugador',
                tipo: 'Daño muscular',
                valor: a.estado_muscular,
                clase: a.estado_muscular >= 8 ? '' : 'warning'
            });
        }
    });
    
    if (alertas.length === 0) {
        container.innerHTML = `
            <div class="sin-datos">
                <div class="icono">✅</div>
                <p>¡Todo el equipo está en buenas condiciones!</p>
            </div>
        `;
        return;
    }
    
    // Ordenar: más graves primero
    alertas.sort((a, b) => {
        if (a.clase === '' && b.clase === 'warning') return -1;
        if (a.clase === 'warning' && b.clase === '') return 1;
        return 0;
    });
    
    container.innerHTML = alertas.slice(0, 5).map(a => `
        <div class="alerta-item ${a.clase}">
            <div>
                <div class="jugador-nombre">${a.jugador}</div>
                <div class="alerta-detalle">${a.tipo}</div>
            </div>
            <div class="valor">${a.valor}</div>
        </div>
    `).join('');
}

