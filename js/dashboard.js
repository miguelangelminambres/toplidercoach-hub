// ========== DASHBOARD.JS - TopLiderCoach HUB ==========
// Dashboard principal, gráficos Chart.js, alertas

registrarModulo('dashboard', function() {
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
    
    // Últimos 10 partidos
    mostrarUltimosPartidos(partidosJugados.slice(0, 10));
    
    // Gráfico de resultados (donut)
    crearGraficoResultados(victorias, empates, derrotas);
    
    // Gráfico de goles
    crearGraficoGoles(golesFavor, golesContra);
    
    // Leyenda
    document.getElementById('legend-victorias').textContent = `Victorias: ${victorias} (${calcularPorcentaje(victorias, partidosJugados.length)}%)`;
    document.getElementById('legend-empates').textContent = `Empates: ${empates} (${calcularPorcentaje(empates, partidosJugados.length)}%)`;
    document.getElementById('legend-derrotas').textContent = `Derrotas: ${derrotas} (${calcularPorcentaje(derrotas, partidosJugados.length)}%)`;
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
    
    crearGraficoResultados(0, 0, 0);
    crearGraficoGoles(0, 0);
}

function mostrarUltimosPartidos(partidos) {
    const container = document.getElementById('dash-ultimos-partidos');
    
    if (!partidos || partidos.length === 0) {
        container.innerHTML = `
            <div class="sin-datos">
                <div class="icono">⚽</div>
                <p>No hay partidos jugados</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = partidos.map(p => {
        const esLocal = p.home_away === 'home';
        const gF = p.team_goals || 0;
        const gC = p.opponent_goals || 0;
        const resultado = esLocal ? `${gF}-${gC}` : `${gC}-${gF}`;
        const clase = p.result === 'win' ? 'victoria' : p.result === 'draw' ? 'empate' : 'derrota';
        const fecha = new Date(p.match_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        
        return `
            <div class="partido-badge ${clase}" onclick="verPartido('${p.id}')" title="${p.opponent}">
                <div class="resultado">${resultado}</div>
                <div class="rival">${esLocal ? 'vs' : '@'} ${p.opponent.substring(0, 10)}</div>
                <div class="fecha">${fecha}</div>
            </div>
        `;
    }).join('');
}

function crearGraficoResultados(victorias, empates, derrotas) {
    const ctx = document.getElementById('chart-resultados');
    if (!ctx) return;
    
    // Destruir gráfico anterior si existe
    if (chartResultados) {
        chartResultados.destroy();
    }
    
    const total = victorias + empates + derrotas;
    
    if (total === 0) {
        chartResultados = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Sin partidos'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#e5e7eb'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
        return;
    }
    
    chartResultados = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Victorias', 'Empates', 'Derrotas'],
            datasets: [{
                data: [victorias, empates, derrotas],
                backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
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
        }
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

</script>
