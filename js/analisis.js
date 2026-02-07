// ========== ANALISIS.JS - TopLiderCoach HUB ==========
// Análisis de partidos, campo fútbol visual, rivales, historial

// Variables del módulo
let analisisActual = null;
let partidoSeleccionadoAnalisis = null;
let opponentActual = null;

registrarSubTab('matchstats', 'analisis', cargarPartidosParaAnalisis);

async function cargarPartidosParaAnalisis() {
    const select = document.getElementById('analisis-partido-select');
    select.innerHTML = '<option value="">-- Elige un partido jugado --</option>';
    
    const { data: partidos } = await supabaseClient
        .from('matches')
        .select('*')
        .eq('club_id', clubId)
        .eq('season_id', seasonId)
        .not('result', 'is', null)
        .order('match_date', { ascending: false });
    
    if (partidos && partidos.length > 0) {
        partidos.forEach(p => {
            const fecha = new Date(p.match_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            const esLocal = p.home_away === 'home';
            const gF = p.team_goals || 0;
            const gC = p.opponent_goals || 0;
            const marcador = esLocal ? gF + '-' + gC : gC + '-' + gF;
            const resultado = p.result === 'win' ? '✅' : p.result === 'draw' ? '🟡' : '❌';
            
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = resultado + ' ' + fecha + ' - ' + (esLocal ? 'vs ' : '@ ') + p.opponent + ' (' + marcador + ')';
            select.appendChild(option);
        });
    }
}

async function cargarAnalisisPartido() {
    const select = document.getElementById('analisis-partido-select');
    const matchId = select.value;
    const contenido = document.getElementById('analisis-contenido');
    
    if (!matchId) {
        contenido.style.display = 'none';
        return;
    }
    
    contenido.style.display = 'block';
    
    // Cargar datos del partido
    const { data: partido } = await supabaseClient
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();
    
    if (partido) {
        partidoSeleccionadoAnalisis = partido;
        mostrarInfoPartido(partido);
        await buscarOCrearRival(partido.opponent);
        await cargarAnalisisExistente(matchId);
        await cargarHistorialRival(partido.opponent);
    }
}

function mostrarInfoPartido(partido) {
    const info = document.getElementById('analisis-partido-info');
    const fecha = new Date(partido.match_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const esLocal = partido.home_away === 'home';
    const gF = partido.team_goals || 0;
    const gC = partido.opponent_goals || 0;
    
    const resultadoTexto = partido.result === 'win' ? 'Victoria' : partido.result === 'draw' ? 'Empate' : 'Derrota';
    const resultadoColor = partido.result === 'win' ? '#10b981' : partido.result === 'draw' ? '#f59e0b' : '#ef4444';
    
    info.innerHTML = 
        '<div class="partido-info-izq">' +
            '<div style="font-size: 14px; opacity: 0.8;">' + fecha + '</div>' +
            '<div style="font-size: 20px; font-weight: 700; margin-top: 5px;">' +
                (esLocal ? (clubData?.name || 'Mi Equipo') + ' vs ' + partido.opponent : partido.opponent + ' vs ' + (clubData?.name || 'Mi Equipo')) +
            '</div>' +
            (partido.competition ? '<div style="margin-top: 5px; font-size: 13px; opacity: 0.8;">' + partido.competition + '</div>' : '') +
        '</div>' +
        '<div class="partido-info-der" style="text-align: right;">' +
            '<div style="font-size: 32px; font-weight: 700;">' + (esLocal ? gF + ' - ' + gC : gC + ' - ' + gF) + '</div>' +
            '<div style="background: ' + resultadoColor + '; padding: 5px 15px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-top: 5px; display: inline-block;">' + resultadoTexto + '</div>' +
        '</div>';
}

async function buscarOCrearRival(nombreRival) {
    // Buscar si el rival ya existe
    const { data: rival } = await supabaseClient
        .from('opponents')
        .select('*')
        .eq('club_id', clubId)
        .eq('name', nombreRival)
        .single();
    
    if (rival) {
        opponentActual = rival;
        mostrarRival(rival);
    } else {
        // Crear nuevo rival
        const { data: nuevoRival } = await supabaseClient
            .from('opponents')
            .insert({
                club_id: clubId,
                name: nombreRival
            })
            .select()
            .single();
        
        opponentActual = nuevoRival;
        mostrarRival(nuevoRival);
    }
}

function mostrarRival(rival) {
    document.getElementById('rival-nombre').textContent = rival.name;
    
    const logoPreview = document.getElementById('rival-logo-preview');
    const logoPlaceholder = document.getElementById('rival-logo-placeholder');
    
    if (rival.logo_url) {
        logoPreview.src = rival.logo_url;
        logoPreview.style.display = 'block';
        logoPlaceholder.style.display = 'none';
    } else {
        logoPreview.style.display = 'none';
        logoPlaceholder.style.display = 'flex';
    }
}
// ========== CAMPO DE FÚTBOL VISUAL ==========
const SISTEMAS_POSICIONES = {
    '1-4-3-3': [
        { pos: 'POR', x: 50, y: 92 },
        { pos: 'LD', x: 85, y: 75 },
        { pos: 'DFC', x: 65, y: 78 },
        { pos: 'DFC', x: 35, y: 78 },
        { pos: 'LI', x: 15, y: 75 },
        { pos: 'MC', x: 50, y: 55 },
        { pos: 'MC', x: 75, y: 48 },
        { pos: 'MC', x: 25, y: 48 },
        { pos: 'ED', x: 82, y: 22 },
        { pos: 'DC', x: 50, y: 18 },
        { pos: 'EI', x: 18, y: 22 }
    ],
    '1-4-4-2': [
        { pos: 'POR', x: 50, y: 92 },
        { pos: 'LD', x: 85, y: 75 },
        { pos: 'DFC', x: 65, y: 78 },
        { pos: 'DFC', x: 35, y: 78 },
        { pos: 'LI', x: 15, y: 75 },
        { pos: 'MD', x: 82, y: 50 },
        { pos: 'MC', x: 62, y: 55 },
        { pos: 'MC', x: 38, y: 55 },
        { pos: 'MI', x: 18, y: 50 },
        { pos: 'DC', x: 62, y: 22 },
        { pos: 'DC', x: 38, y: 22 }
    ],
    '1-4-2-3-1': [
        { pos: 'POR', x: 50, y: 92 },
        { pos: 'LD', x: 85, y: 75 },
        { pos: 'DFC', x: 65, y: 78 },
        { pos: 'DFC', x: 35, y: 78 },
        { pos: 'LI', x: 15, y: 75 },
        { pos: 'MCD', x: 62, y: 58 },
        { pos: 'MCD', x: 38, y: 58 },
        { pos: 'ED', x: 80, y: 35 },
        { pos: 'MP', x: 50, y: 38 },
        { pos: 'EI', x: 20, y: 35 },
        { pos: 'DC', x: 50, y: 18 }
    ],
    '1-4-1-4-1': [
        { pos: 'POR', x: 50, y: 92 },
        { pos: 'LD', x: 85, y: 75 },
        { pos: 'DFC', x: 65, y: 78 },
        { pos: 'DFC', x: 35, y: 78 },
        { pos: 'LI', x: 15, y: 75 },
        { pos: 'MCD', x: 50, y: 58 },
        { pos: 'MD', x: 82, y: 42 },
        { pos: 'MC', x: 62, y: 45 },
        { pos: 'MC', x: 38, y: 45 },
        { pos: 'MI', x: 18, y: 42 },
        { pos: 'DC', x: 50, y: 18 }
    ],
    '1-3-5-2': [
        { pos: 'POR', x: 50, y: 92 },
        { pos: 'DFC', x: 75, y: 78 },
        { pos: 'DFC', x: 50, y: 80 },
        { pos: 'DFC', x: 25, y: 78 },
        { pos: 'CAD', x: 88, y: 55 },
        { pos: 'MC', x: 65, y: 52 },
        { pos: 'MC', x: 50, y: 55 },
        { pos: 'MC', x: 35, y: 52 },
        { pos: 'CAI', x: 12, y: 55 },
        { pos: 'DC', x: 62, y: 22 },
        { pos: 'DC', x: 38, y: 22 }
    ],
    '1-3-4-3': [
        { pos: 'POR', x: 50, y: 92 },
        { pos: 'DFC', x: 75, y: 78 },
        { pos: 'DFC', x: 50, y: 80 },
        { pos: 'DFC', x: 25, y: 78 },
        { pos: 'MD', x: 85, y: 52 },
        { pos: 'MC', x: 62, y: 55 },
        { pos: 'MC', x: 38, y: 55 },
        { pos: 'MI', x: 15, y: 52 },
        { pos: 'ED', x: 78, y: 22 },
        { pos: 'DC', x: 50, y: 18 },
        { pos: 'EI', x: 22, y: 22 }
    ],
    '1-5-3-2': [
        { pos: 'POR', x: 50, y: 92 },
        { pos: 'CAD', x: 90, y: 70 },
        { pos: 'DFC', x: 70, y: 78 },
        { pos: 'DFC', x: 50, y: 80 },
        { pos: 'DFC', x: 30, y: 78 },
        { pos: 'CAI', x: 10, y: 70 },
        { pos: 'MC', x: 70, y: 50 },
        { pos: 'MC', x: 50, y: 52 },
        { pos: 'MC', x: 30, y: 50 },
        { pos: 'DC', x: 62, y: 22 },
        { pos: 'DC', x: 38, y: 22 }
    ],
    '1-5-4-1': [
        { pos: 'POR', x: 50, y: 92 },
        { pos: 'CAD', x: 90, y: 70 },
        { pos: 'DFC', x: 70, y: 78 },
        { pos: 'DFC', x: 50, y: 80 },
        { pos: 'DFC', x: 30, y: 78 },
        { pos: 'CAI', x: 10, y: 70 },
        { pos: 'MD', x: 80, y: 45 },
        { pos: 'MC', x: 60, y: 50 },
        { pos: 'MC', x: 40, y: 50 },
        { pos: 'MI', x: 20, y: 45 },
        { pos: 'DC', x: 50, y: 18 }
    ],
    '1-4-5-1': [
        { pos: 'POR', x: 50, y: 92 },
        { pos: 'LD', x: 85, y: 75 },
        { pos: 'DFC', x: 65, y: 78 },
        { pos: 'DFC', x: 35, y: 78 },
        { pos: 'LI', x: 15, y: 75 },
        { pos: 'MD', x: 85, y: 48 },
        { pos: 'MC', x: 65, y: 52 },
        { pos: 'MC', x: 50, y: 50 },
        { pos: 'MC', x: 35, y: 52 },
        { pos: 'MI', x: 15, y: 48 },
        { pos: 'DC', x: 50, y: 18 }
    ],
    '1-4-4-1-1': [
        { pos: 'POR', x: 50, y: 92 },
        { pos: 'LD', x: 85, y: 75 },
        { pos: 'DFC', x: 65, y: 78 },
        { pos: 'DFC', x: 35, y: 78 },
        { pos: 'LI', x: 15, y: 75 },
        { pos: 'MD', x: 82, y: 55 },
        { pos: 'MC', x: 62, y: 58 },
        { pos: 'MC', x: 38, y: 58 },
        { pos: 'MI', x: 18, y: 55 },
        { pos: 'MP', x: 50, y: 38 },
        { pos: 'DC', x: 50, y: 18 }
    ]
};

let alineacionCampo = {}; // { posicionIndex: jugadorId }

function mostrarCampoFutbol(sistema) {
    const container = document.getElementById('campo-container');
    const campo = document.getElementById('campo-futbol');
    const label = document.getElementById('campo-sistema-label');
    
    if (!sistema || !SISTEMAS_POSICIONES[sistema]) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    label.textContent = sistema;
    
    // Limpiar jugadores anteriores
    campo.querySelectorAll('.jugador-posicion').forEach(el => el.remove());
    
    const posiciones = SISTEMAS_POSICIONES[sistema];
    
    posiciones.forEach((pos, index) => {
        const jugadorAsignado = alineacionCampo[index];
        const jugador = jugadorAsignado ? obtenerJugadorPorId(jugadorAsignado) : null;
        
        const div = document.createElement('div');
        div.className = 'jugador-posicion';
        div.style.left = pos.x + '%';
        div.style.top = pos.y + '%';
        div.dataset.index = index;
        div.onclick = () => abrirSelectorJugador(index, pos.pos);
        
        if (jugador) {
            div.innerHTML = `
                <div class="jugador-posicion-circulo">
                    ${jugador.photo_url ? `<img src="${jugador.photo_url}">` : jugador.name.charAt(0)}
                </div>
                ${jugador.dorsal ? `<span class="jugador-posicion-dorsal">${jugador.dorsal}</span>` : ''}
                <div class="jugador-posicion-nombre">${jugador.name.split(' ').pop()}</div>
            `;
        } else {
            div.innerHTML = `
                <div class="jugador-posicion-circulo vacio">+</div>
                <div class="jugador-posicion-nombre">${pos.pos}</div>
            `;
        }
        
        campo.appendChild(div);
    });
    
    mostrarSuplentesCampo();
}

function obtenerJugadorPorId(id) {
    console.log('Buscando jugador ID:', id);
    console.log('titularesAnalisis:', window.titularesAnalisis);
    
    if (window.titularesAnalisis) {
        const jugador = window.titularesAnalisis.find(j => j.id == id || j.player_id == id);
        console.log('Jugador encontrado:', jugador);
        if (jugador) {
            return {
                id: jugador.id || jugador.player_id,
                name: jugador.name || jugador.players?.name || 'Jugador',
                photo_url: jugador.photo_url || jugador.players?.photo_url,
                dorsal: jugador.shirt_number || jugador.dorsal
            };
        }
    }
    return null;
}
function abrirSelectorJugador(posIndex, posNombre) {
    // Obtener jugadores disponibles (titulares no asignados)
    const asignados = Object.values(alineacionCampo);
    const disponibles = (window.titularesAnalisis || []).filter(j => {
        const jId = j.id || j.player_id;
        return !asignados.includes(jId) || alineacionCampo[posIndex] == jId;
    });
    
    if (disponibles.length === 0) {
        alert('No hay jugadores disponibles');
        return;
    }
    
    // Crear modal simple de selección
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 350px; max-height: 80vh; overflow-y: auto;">
            <div class="modal-header">
                <h3>Seleccionar ${posNombre}</h3>
                <button class="btn-cerrar" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div style="padding: 15px;">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${alineacionCampo[posIndex] ? `
                        <button onclick="quitarJugadorPosicion(${posIndex}); this.closest('.modal-overlay').remove();" 
                            style="padding: 10px; background: #fee2e2; color: #dc2626; border: none; border-radius: 8px; cursor: pointer;">
                            ❌ Quitar jugador
                        </button>
                    ` : ''}
                    ${disponibles.map(j => {
                        const jId = j.id || j.player_id;
                        const nombre = j.name || j.players?.name;
                        const foto = j.photo_url || j.players?.photo_url;
                        const dorsal = j.shirt_number || j.dorsal || '';
                        return `
                            <button onclick="asignarJugadorPosicion(${posIndex}, '${jId}'); this.closest('.modal-overlay').remove();"
                                style="display: flex; align-items: center; gap: 10px; padding: 10px; background: #f3f4f6; border: none; border-radius: 8px; cursor: pointer; text-align: left;">
                                <div style="width: 35px; height: 35px; border-radius: 50%; background: #e5e7eb; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                                    ${foto ? `<img src="${foto}" style="width:100%;height:100%;object-fit:cover;">` : nombre?.charAt(0)}
                                </div>
                                <div>
                                    <div style="font-weight: 600;">${dorsal ? '#' + dorsal + ' ' : ''}${nombre}</div>
                                </div>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function asignarJugadorPosicion(posIndex, jugadorId) {
    // Quitar de otra posición si ya estaba
    Object.keys(alineacionCampo).forEach(key => {
        if (alineacionCampo[key] == jugadorId) {
            delete alineacionCampo[key];
        }
    });
    
    alineacionCampo[posIndex] = jugadorId;
    const sistema = document.getElementById('team-formation-initial').value;
    mostrarCampoFutbol(sistema);
}

function quitarJugadorPosicion(posIndex) {
    delete alineacionCampo[posIndex];
    const sistema = document.getElementById('team-formation-initial').value;
    mostrarCampoFutbol(sistema);
}

function mostrarSuplentesCampo() {
    const container = document.getElementById('suplentes-campo');
    const lista = document.getElementById('suplentes-lista');
    
    if (!window.suplentesAnalisis || window.suplentesAnalisis.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    lista.innerHTML = window.suplentesAnalisis.map(j => {
        const nombre = j.name || j.players?.name;
        const foto = j.photo_url || j.players?.photo_url;
        const dorsal = j.shirt_number || j.dorsal || '';
        return `
            <div style="display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.1); padding: 5px 10px; border-radius: 20px;">
                <div style="width: 24px; height: 24px; border-radius: 50%; background: #4b5563; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white;">
                    ${foto ? `<img src="${foto}" style="width:100%;height:100%;object-fit:cover;">` : nombre?.charAt(0)}
                </div>
                <span style="color: white; font-size: 11px;">${dorsal ? '#' + dorsal + ' ' : ''}${nombre?.split(' ').pop()}</span>
            </div>
        `;
    }).join('');
}
async function cargarFotosJugadores(jugadores) {
    if (!jugadores || jugadores.length === 0) return [];
    
    // Obtener los player_id de todos los jugadores
    const playerIds = jugadores.map(j => j.player_id).filter(id => id);
    
    if (playerIds.length === 0) return jugadores;
    
    // Cargar fotos desde la tabla players
    const { data: players } = await supabaseClient
        .from('players')
        .select('id, photo_url')
        .in('id', playerIds);
    
    // Añadir foto a cada jugador
    return jugadores.map(j => {
        const playerData = players?.find(p => p.id === j.player_id);
        return {
            ...j,
            photo_url: playerData?.photo_url || null
        };
    });
}
function cargarAlineacionEnCampo(titulares, suplentes) {
    window.titularesAnalisis = titulares || [];
    window.suplentesAnalisis = suplentes || [];
    
    // NO resetear si ya hay posiciones cargadas desde el análisis guardado
    if (Object.keys(alineacionCampo).length === 0) {
        alineacionCampo = {};
    }
    
    const sistema = document.getElementById('team-formation-initial').value;
    if (sistema) {
        mostrarCampoFutbol(sistema);
    }
}
    
    const sistema = document.getElementById('team-formation-initial').value;
    if (sistema) {
        mostrarCampoFutbol(sistema);
    }



document.addEventListener('DOMContentLoaded', function() {
    var selectorSistema = document.getElementById('team-formation-initial');
    if (selectorSistema) {
        selectorSistema.addEventListener('change', function() {
            mostrarCampoFutbol(this.value);
        });
    }
});

async function subirLogoRival() {
    const input = document.getElementById('rival-logo-input');
    const file = input.files[0];
    
    if (!file || !opponentActual) return;
    
    // Convertir a base64 para guardar (simple approach)
    const reader = new FileReader();
    reader.onload = async function(e) {
        const logoUrl = e.target.result;
        
        // Actualizar en la base de datos
        await supabaseClient
            .from('opponents')
            .update({ logo_url: logoUrl })
            .eq('id', opponentActual.id);
        
        opponentActual.logo_url = logoUrl;
        mostrarRival(opponentActual);
    };
    reader.readAsDataURL(file);
}

async function cargarAnalisisExistente(matchId) {
    const { data: analisis } = await supabaseClient
        .from('match_analysis')
        .select('*')
        .eq('match_id', matchId)
        .single();
    
    // Limpiar formulario
    limpiarFormularioAnalisis();
    
    if (analisis) {
        analisisActual = analisis;
        
        // Mi equipo - Formaciones
        document.getElementById('team-formation-initial').value = analisis.team_formation_initial || '';
        // Cargar posiciones del campo si existen
        if (analisis.team_lineup_positions) {
            alineacionCampo = analisis.team_lineup_positions;
        }
        document.getElementById('team-change1-min').value = analisis.team_formation_change1_minute || '';
        document.getElementById('team-change1-system').value = analisis.team_formation_change1_system || '';
        document.getElementById('team-change2-min').value = analisis.team_formation_change2_minute || '';
        document.getElementById('team-change2-system').value = analisis.team_formation_change2_system || '';
        document.getElementById('team-change3-min').value = analisis.team_formation_change3_minute || '';
        document.getElementById('team-change3-system').value = analisis.team_formation_change3_system || '';
        document.getElementById('team-change4-min').value = analisis.team_formation_change4_minute || '';
        document.getElementById('team-change4-system').value = analisis.team_formation_change4_system || '';
        
        // Mi equipo - Análisis
        document.getElementById('team-strengths').value = analisis.team_strengths || '';
        document.getElementById('team-improvements').value = analisis.team_improvements || '';
        document.getElementById('team-tactical-notes').value = analisis.team_tactical_notes || '';
        
        // Rival - Formaciones
        document.getElementById('opponent-formation-initial').value = analisis.opponent_formation_initial || '';
        document.getElementById('opponent-change1-min').value = analisis.opponent_formation_change1_minute || '';
        document.getElementById('opponent-change1-system').value = analisis.opponent_formation_change1_system || '';
        document.getElementById('opponent-change2-min').value = analisis.opponent_formation_change2_minute || '';
        document.getElementById('opponent-change2-system').value = analisis.opponent_formation_change2_system || '';
        document.getElementById('opponent-change3-min').value = analisis.opponent_formation_change3_minute || '';
        document.getElementById('opponent-change3-system').value = analisis.opponent_formation_change3_system || '';
        document.getElementById('opponent-change4-min').value = analisis.opponent_formation_change4_minute || '';
        document.getElementById('opponent-change4-system').value = analisis.opponent_formation_change4_system || '';
        
        // Rival - Análisis
        document.getElementById('opponent-strengths').value = analisis.opponent_strengths || '';
        document.getElementById('opponent-weaknesses').value = analisis.opponent_weaknesses || '';
        document.getElementById('opponent-key-players').value = analisis.opponent_key_players || '';
        
        // Conclusiones
        document.getElementById('general-conclusions').value = analisis.general_conclusions || '';
} else {
        analisisActual = null;
    }
    
    // Cargar titulares y suplentes en el campo visual
    const { data: partido } = await supabaseClient
        .from('matches')
        .select('titulares, suplentes')
        .eq('id', matchId)
        .single();
    
    if (partido) {
        // Obtener fotos de los jugadores
        const titularesConFoto = await cargarFotosJugadores(partido.titulares || []);
        const suplentesConFoto = await cargarFotosJugadores(partido.suplentes || []);
        cargarAlineacionEnCampo(titularesConFoto, suplentesConFoto);
    }
    
    // Mostrar campo si hay sistema seleccionado
    const sistema = document.getElementById('team-formation-initial').value;
    if (sistema) {
        mostrarCampoFutbol(sistema);
    }
}
function limpiarFormularioAnalisis() {
    document.getElementById('team-formation-initial').value = '';
    document.getElementById('team-change1-min').value = '';
    document.getElementById('team-change1-system').value = '';
    document.getElementById('team-change2-min').value = '';
    document.getElementById('team-change2-system').value = '';
    document.getElementById('team-change3-min').value = '';
    document.getElementById('team-change3-system').value = '';
    document.getElementById('team-change4-min').value = '';
    document.getElementById('team-change4-system').value = '';
    document.getElementById('team-strengths').value = '';
    document.getElementById('team-improvements').value = '';
    document.getElementById('team-tactical-notes').value = '';
    document.getElementById('opponent-formation-initial').value = '';
    document.getElementById('opponent-change1-min').value = '';
    document.getElementById('opponent-change1-system').value = '';
    document.getElementById('opponent-change2-min').value = '';
    document.getElementById('opponent-change2-system').value = '';
    document.getElementById('opponent-change3-min').value = '';
    document.getElementById('opponent-change3-system').value = '';
    document.getElementById('opponent-change4-min').value = '';
    document.getElementById('opponent-change4-system').value = '';
    document.getElementById('opponent-strengths').value = '';
    document.getElementById('opponent-weaknesses').value = '';
    document.getElementById('opponent-key-players').value = '';
    document.getElementById('general-conclusions').value = '';
}

async function guardarAnalisis() {
    if (!partidoSeleccionadoAnalisis) {
        alert('Selecciona un partido primero');
        return;
    }
    
    const datos = {
        match_id: partidoSeleccionadoAnalisis.id,
        club_id: clubId,
        opponent_id: opponentActual?.id,
        
        // Mi equipo
        team_formation_initial: document.getElementById('team-formation-initial').value || null,
        team_formation_change1_minute: document.getElementById('team-change1-min').value ? parseInt(document.getElementById('team-change1-min').value) : null,
        team_formation_change1_system: document.getElementById('team-change1-system').value || null,
        team_formation_change2_minute: document.getElementById('team-change2-min').value ? parseInt(document.getElementById('team-change2-min').value) : null,
        team_formation_change2_system: document.getElementById('team-change2-system').value || null,
        team_formation_change3_minute: document.getElementById('team-change3-min').value ? parseInt(document.getElementById('team-change3-min').value) : null,
        team_formation_change3_system: document.getElementById('team-change3-system').value || null,
        team_formation_change4_minute: document.getElementById('team-change4-min').value ? parseInt(document.getElementById('team-change4-min').value) : null,
        team_formation_change4_system: document.getElementById('team-change4-system').value || null,
        team_strengths: document.getElementById('team-strengths').value || null,
        team_improvements: document.getElementById('team-improvements').value || null,
        team_tactical_notes: document.getElementById('team-tactical-notes').value || null,
        
        // Rival
        opponent_formation_initial: document.getElementById('opponent-formation-initial').value || null,
        opponent_formation_change1_minute: document.getElementById('opponent-change1-min').value ? parseInt(document.getElementById('opponent-change1-min').value) : null,
        opponent_formation_change1_system: document.getElementById('opponent-change1-system').value || null,
        opponent_formation_change2_minute: document.getElementById('opponent-change2-min').value ? parseInt(document.getElementById('opponent-change2-min').value) : null,
        opponent_formation_change2_system: document.getElementById('opponent-change2-system').value || null,
        opponent_formation_change3_minute: document.getElementById('opponent-change3-min').value ? parseInt(document.getElementById('opponent-change3-min').value) : null,
        opponent_formation_change3_system: document.getElementById('opponent-change3-system').value || null,
        opponent_formation_change4_minute: document.getElementById('opponent-change4-min').value ? parseInt(document.getElementById('opponent-change4-min').value) : null,
        opponent_formation_change4_system: document.getElementById('opponent-change4-system').value || null,
        opponent_strengths: document.getElementById('opponent-strengths').value || null,
        opponent_weaknesses: document.getElementById('opponent-weaknesses').value || null,
        opponent_key_players: document.getElementById('opponent-key-players').value || null,
        
        // General
        general_conclusions: document.getElementById('general-conclusions').value || null,
        // Alineación visual
        team_lineup_positions: Object.keys(alineacionCampo).length > 0 ? alineacionCampo : null,
        updated_at: new Date().toISOString()
    };
    
    
    console.log('Datos a guardar:', datos);
    console.log('alineacionCampo:', alineacionCampo);
    let error;
    
    if (analisisActual) {
        // Actualizar
        const result = await supabaseClient
            .from('match_analysis')
            .update(datos)
            .eq('id', analisisActual.id);
        error = result.error;
    } else {
        // Crear nuevo
        const result = await supabaseClient
            .from('match_analysis')
            .insert(datos)
            .select()
            .single();
        error = result.error;
        if (result.data) analisisActual = result.data;
    }
    
    if (error) {
        alert('Error al guardar: ' + error.message);
    } else {
        alert('✅ Análisis guardado correctamente');
    }
}

async function cargarHistorialRival(nombreRival) {
    const historialDiv = document.getElementById('historial-rival');
    const historialPartidos = document.getElementById('historial-partidos');
    const historialNombre = document.getElementById('historial-rival-nombre');
    
    // Buscar partidos contra este rival
    const { data: partidos } = await supabaseClient
        .from('matches')
        .select('*')
        .eq('club_id', clubId)
        .eq('opponent', nombreRival)
        .not('result', 'is', null)
        .neq('id', partidoSeleccionadoAnalisis.id)
        .order('match_date', { ascending: false });
    
    if (partidos && partidos.length > 0) {
        historialDiv.style.display = 'block';
        historialNombre.textContent = nombreRival;
        
        let html = '<div class="historial-lista">';
        
        for (const p of partidos) {
            const fecha = new Date(p.match_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
            const esLocal = p.home_away === 'home';
            const gF = p.team_goals || 0;
            const gC = p.opponent_goals || 0;
            const marcador = esLocal ? gF + '-' + gC : gC + '-' + gF;
            const resultado = p.result === 'win' ? '✅' : p.result === 'draw' ? '🟡' : '❌';
            
            // Verificar si tiene análisis
            const { data: analisis } = await supabaseClient
                .from('match_analysis')
                .select('id')
                .eq('match_id', p.id)
                .single();
            
            html += '<div class="historial-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: white; border-radius: 8px; margin-bottom: 8px;">' +
                '<div>' +
                    '<span style="font-weight: 600;">' + resultado + ' ' + marcador + '</span>' +
                    '<span style="color: #6b7280; margin-left: 10px;">' + fecha + ' - ' + (esLocal ? 'Local' : 'Visitante') + '</span>' +
                '</div>' +
                (analisis ? '<span style="font-size: 12px; background: #dbeafe; color: #1d4ed8; padding: 4px 8px; border-radius: 4px;">📊 Analizado</span>' : '') +
            '</div>';
        }
        
        html += '</div>';
        historialPartidos.innerHTML = html;
    } else {
        historialDiv.style.display = 'none';
    }
}

async function generarPDFAnalisis() {
    if (!partidoSeleccionadoAnalisis) {
        alert('Selecciona un partido primero');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const partido = partidoSeleccionadoAnalisis;
    const fecha = new Date(partido.match_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const esLocal = partido.home_away === 'home';
    const gF = partido.team_goals || 0;
    const gC = partido.opponent_goals || 0;
    const marcador = esLocal ? gF + ' - ' + gC : gC + ' - ' + gF;
    
    let y = 15;
    
    // Colores
    const colorPrimario = [30, 41, 59];
    const colorVerde = [16, 185, 129];
    const colorNaranja = [249, 115, 22];
    const colorRojo = [239, 68, 68];
    const colorGris = [107, 114, 128];
    
    // ===== HEADER =====
    doc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.rect(0, 0, 210, 55, 'F');
    
    // Título
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('ANALISIS DE PARTIDO', 105, 15, { align: 'center' });
    
    // Fecha
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(fecha.toUpperCase(), 105, 23, { align: 'center' });
    
    // Escudos y equipos
    const equipoLocal = esLocal ? (clubData?.name || 'Mi Equipo') : partido.opponent;
    const equipoVisitante = esLocal ? partido.opponent : (clubData?.name || 'Mi Equipo');
    
    // Intentar cargar escudos
    try {
        // Escudo local (mi equipo si es local, rival si es visitante)
        if (esLocal && clubData?.logo_url) {
    doc.addImage(clubData.logo_url, 'PNG', 30, 28, 20, 20);
        } else if (!esLocal && opponentActual?.logo_url) {
            doc.addImage(opponentActual.logo_url, 'PNG', 30, 28, 20, 20);
        }
        
        // Escudo visitante (rival si es local, mi equipo si es visitante)
        if (esLocal && opponentActual?.logo_url) {
            doc.addImage(opponentActual.logo_url, 'PNG', 160, 28, 20, 20);
        } else if (!esLocal && clubData?.logo_url) {
    doc.addImage(clubData.logo_url, 'PNG', 160, 28, 20, 20);
        }
    } catch (e) {
        console.log('No se pudieron cargar los escudos');
    }
    
    // Nombres equipos
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(equipoLocal, 55, 38);
    doc.text(equipoVisitante, 155, 38, { align: 'right' });
    
    // VS
    doc.setFontSize(10);
    doc.text('VS', 105, 35, { align: 'center' });
    
    // Resultado
    const colorResultado = partido.result === 'win' ? colorVerde : partido.result === 'draw' ? colorNaranja : colorRojo;
    doc.setFillColor(colorResultado[0], colorResultado[1], colorResultado[2]);
    doc.roundedRect(85, 42, 40, 10, 2, 2, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(marcador, 105, 50, { align: 'center' });
    
    y = 65;
    
    // Función auxiliar para añadir sección
    function addSeccion(titulo, color) {
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(15, y, 180, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(titulo, 20, y + 7);
        y += 15;
        doc.setTextColor(0, 0, 0);
    }
    
    // Función auxiliar para añadir campo
    function addCampo(label, valor) {
        if (!valor || valor.trim() === '') return;
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
        doc.text(label, 20, y);
        y += 5;
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        const lines = doc.splitTextToSize(valor, 170);
        lines.forEach(function(line) {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            doc.text(line, 20, y);
            y += 5;
        });
        y += 3;
    }
    
    // Función auxiliar para añadir formación
    function addFormacion(label, formacion, cambios) {
        if (!formacion && cambios.filter(c => c.min && c.sys).length === 0) return;
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
        doc.text(label, 20, y);
        y += 6;
        doc.setTextColor(0, 0, 0);
        
        if (formacion) {
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(formacion, 20, y);
            y += 7;
        }
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        cambios.forEach(function(cambio) {
            if (cambio.min && cambio.sys) {
                doc.setTextColor(colorNaranja[0], colorNaranja[1], colorNaranja[2]);
                doc.text('Min ' + cambio.min + "'", 20, y);
                doc.setTextColor(0, 0, 0);
                doc.text(' -> ' + cambio.sys, 40, y);
                y += 5;
            }
        });
        y += 3;
    }
    
    // ===== MI EQUIPO =====
    addSeccion('MI EQUIPO', colorVerde);
    
    const teamFormation = document.getElementById('team-formation-initial').value;
    const teamCambios = [
        { min: document.getElementById('team-change1-min').value, sys: document.getElementById('team-change1-system').value },
        { min: document.getElementById('team-change2-min').value, sys: document.getElementById('team-change2-system').value },
        { min: document.getElementById('team-change3-min').value, sys: document.getElementById('team-change3-system').value },
        { min: document.getElementById('team-change4-min').value, sys: document.getElementById('team-change4-system').value }
    ];
    
    addFormacion('Sistema de juego:', teamFormation, teamCambios);
     // ===== CAMPO VISUAL DE ALINEACIÓN =====
    if (teamFormation && Object.keys(alineacionCampo).length > 0) {
        // Verificar espacio
        if (y > 170) {
            doc.addPage();
            y = 20;
        }
        
        // Dibujar campo
        const campoX = 55;
        const campoY = y + 5;
        const campoAncho = 100;
        const campoAlto = 75;
        
        // Etiqueta del sistema arriba
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text('Alineacion ' + teamFormation, campoX + campoAncho/2, campoY - 3, { align: 'center' });
        
        // Fondo verde del campo
        doc.setFillColor(45, 90, 39);
        doc.roundedRect(campoX, campoY, campoAncho, campoAlto, 2, 2, 'F');
        
        // Líneas del campo
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.3);
        
        // Línea central
        doc.line(campoX, campoY + campoAlto/2, campoX + campoAncho, campoY + campoAlto/2);
        
        // Círculo central
        doc.circle(campoX + campoAncho/2, campoY + campoAlto/2, 8, 'S');
        
        // Área grande arriba
        doc.rect(campoX + campoAncho*0.2, campoY, campoAncho*0.6, campoAlto*0.16, 'S');
        
        // Área grande abajo
        doc.rect(campoX + campoAncho*0.2, campoY + campoAlto*0.84, campoAncho*0.6, campoAlto*0.16, 'S');
        
        // Área pequeña arriba
        doc.rect(campoX + campoAncho*0.35, campoY, campoAncho*0.3, campoAlto*0.07, 'S');
        
        // Área pequeña abajo
        doc.rect(campoX + campoAncho*0.35, campoY + campoAlto*0.93, campoAncho*0.3, campoAlto*0.07, 'S');
        
        // Dibujar jugadores en sus posiciones
        const posiciones = SISTEMAS_POSICIONES[teamFormation];
        if (posiciones) {
            for (let i = 0; i < posiciones.length; i++) {
                const jugadorId = alineacionCampo[i];
                if (!jugadorId) continue;
                
                const jugador = obtenerJugadorPorId(jugadorId);
                if (!jugador) continue;
                
                const pos = posiciones[i];
                // Ajustar posición Y del portero (92% -> 88%)
                const posY = pos.y > 90 ? 86 : pos.y;
                const jx = campoX + (pos.x / 100) * campoAncho;
                const jy = campoY + (posY / 100) * campoAlto;
                
                // Foto del jugador o círculo
                const radioJugador = 5;
                if (jugador.photo_url) {
                    try {
                        doc.addImage(jugador.photo_url, 'JPEG', jx - radioJugador, jy - radioJugador, radioJugador * 2, radioJugador * 2);
                    } catch (e) {
                        // Si falla la foto, dibujar círculo
                        doc.setFillColor(59, 130, 246);
                        doc.circle(jx, jy, radioJugador, 'F');
                    }
                } else {
                    doc.setFillColor(59, 130, 246);
                    doc.circle(jx, jy, radioJugador, 'F');
                }
                
                // Dorsal (badge naranja)
                if (jugador.dorsal) {
                    doc.setFillColor(249, 115, 22);
                    doc.circle(jx + 4, jy - 4, 2.5, 'F');
                    doc.setFontSize(4);
                    doc.setTextColor(255, 255, 255);
                    doc.setFont(undefined, 'bold');
                    doc.text(String(jugador.dorsal), jx + 4, jy - 3, { align: 'center' });
                }
                
                // Nombre debajo
                doc.setFontSize(5);
                doc.setTextColor(255, 255, 255);
                doc.setFont(undefined, 'bold');
                const nombreCorto = jugador.name.split(' ').pop().substring(0, 10);
                doc.text(nombreCorto, jx, jy + radioJugador + 3, { align: 'center' });
            }
        }
        
        y += campoAlto + 15;
    }
     addCampo('Puntos fuertes:', document.getElementById('team-strengths').value);
    addCampo('Aspectos a mejorar:', document.getElementById('team-improvements').value);
    addCampo('Notas tacticas:', document.getElementById('team-tactical-notes').value);
    
 
    // ===== RIVAL =====
    addSeccion('RIVAL: ' + partido.opponent.toUpperCase(), colorRojo);
    
    const oppFormation = document.getElementById('opponent-formation-initial').value;
    const oppCambios = [
        { min: document.getElementById('opponent-change1-min').value, sys: document.getElementById('opponent-change1-system').value },
        { min: document.getElementById('opponent-change2-min').value, sys: document.getElementById('opponent-change2-system').value },
        { min: document.getElementById('opponent-change3-min').value, sys: document.getElementById('opponent-change3-system').value },
        { min: document.getElementById('opponent-change4-min').value, sys: document.getElementById('opponent-change4-system').value }
    ];
    
    addFormacion('Sistema de juego:', oppFormation, oppCambios);
    addCampo('Puntos fuertes:', document.getElementById('opponent-strengths').value);
    addCampo('Puntos debiles:', document.getElementById('opponent-weaknesses').value);
    addCampo('Jugadores clave:', document.getElementById('opponent-key-players').value);
    
    y += 5;
    
    // ===== CONCLUSIONES =====
    const conclusions = document.getElementById('general-conclusions').value;
    if (conclusions && conclusions.trim() !== '') {
        addSeccion('CONCLUSIONES', colorPrimario);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const lines = doc.splitTextToSize(conclusions, 170);
        lines.forEach(function(line) {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            doc.text(line, 20, y);
            y += 5;
        });
    }
    
    // ===== FOOTER =====
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
        doc.text('TopLiderCoach - Analisis de Partido', 105, 290, { align: 'center' });
        doc.text('Pagina ' + i + ' de ' + totalPages, 195, 290, { align: 'right' });
    }
    
    // Guardar
    const nombreArchivo = 'Analisis_' + partido.opponent.replace(/\s+/g, '_') + '_' + partido.match_date + '.pdf';
    doc.save(nombreArchivo);
}
