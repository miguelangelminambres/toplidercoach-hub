// ========== ASISTENCIA.JS - TopLiderCoach HUB ==========
// Asistencia por rango de fechas, bienestar, PDF individual y general

function togglePanelAsistencia() {
    var tabPlanificador = document.querySelector('.main-tab.planificador');
    if (tabPlanificador) cambiarModulo('planificador', tabPlanificador);
    var btnAsistencia = document.querySelector('#modulo-planificador .sub-tab:last-child');
    if (btnAsistencia) cambiarSubTab('planificador', 'asistencia', btnAsistencia);
}

registrarSubTab('planificador', 'asistencia', function() {
    initFechasAsistencia();
    cargarAsistenciaRango();
});

registrarInit(function() {
    initFechasAsistencia();
});

// ========== INICIALIZAR FECHAS (mes actual por defecto) ==========
function initFechasAsistencia() {
    const inputInicio = document.getElementById('asistencia-fecha-inicio');
    const inputFin = document.getElementById('asistencia-fecha-fin');
    if (!inputInicio || !inputFin) return;
    
    // Solo setear si están vacíos (para no pisar selección del usuario)
    if (!inputInicio.value) {
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        inputInicio.value = primerDia.toISOString().split('T')[0];
        inputFin.value = ultimoDia.toISOString().split('T')[0];
    }
}

// Helpers para obtener fechas del rango
function getFechaInicio() {
    return document.getElementById('asistencia-fecha-inicio')?.value || '';
}
function getFechaFin() {
    return document.getElementById('asistencia-fecha-fin')?.value || '';
}
function getRangoTexto() {
    const ini = getFechaInicio();
    const fin = getFechaFin();
    if (!ini || !fin) return '';
    const fIni = new Date(ini).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const fFin = new Date(fin).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${fIni} — ${fFin}`;
}

// ========== CARGAR ASISTENCIA POR RANGO ==========
async function cargarAsistenciaRango() {
    const fechaInicio = getFechaInicio();
    const fechaFin = getFechaFin();
    
    if (!fechaInicio || !fechaFin) {
        alert('Selecciona fecha de inicio y fin');
        return;
    }
    
    if (fechaInicio > fechaFin) {
        alert('La fecha de inicio no puede ser posterior a la fecha fin');
        return;
    }
    
    const tbody = document.getElementById('asistencia-tabla-body');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Cargando...</td></tr>';
    
    try {
        const { data: clubInfo } = await supabaseClient
            .from('clubs').select('id').eq('wp_user_id', usuario.id).single();
        if (!clubInfo) throw new Error('Club no encontrado');
        
        // Sesiones en el rango
        const { data: sesiones, error: errSes } = await supabaseClient
            .from('training_sessions')
            .select('id, session_date')
            .eq('club_id', clubInfo.id)
            .gte('session_date', fechaInicio)
            .lte('session_date', fechaFin)
            .order('session_date', { ascending: true });
        
        if (errSes) throw errSes;
        
        const totalSesiones = sesiones ? sesiones.length : 0;
        document.getElementById('asistencia-total-sesiones').textContent = totalSesiones;
        
        if (totalSesiones === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#9ca3af;">No hay sesiones en este periodo</td></tr>';
            document.getElementById('asistencia-promedio').textContent = '0%';
            const elJ = document.getElementById('asistencia-total-jugadores'); if (elJ) elJ.textContent = '0';
            return;
        }
        
        // Jugadores de la plantilla activa
        let currentSeasonId = seasonId;
        if (!currentSeasonId) {
            // Fallback: buscar temporada activa
            const { data: tempData } = await supabaseClient
                .from('seasons').select('id').eq('club_id', clubInfo.id).eq('is_active', true).single();
            currentSeasonId = tempData?.id;
        }
        
        if (!currentSeasonId) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#9ca3af;">No hay temporada activa seleccionada</td></tr>';
            return;
        }
        
        const { data: spData } = await supabaseClient
            .from('season_players')
            .select('player_id, shirt_number, players(id, name, photo_url, position, status)')
            .eq('season_id', currentSeasonId)
            .order('shirt_number');
        
        const jugadores = (spData || []).map(sp => ({
            id: sp.players.id,
            name: sp.players.name,
            photo_url: sp.players.photo_url,
            position: sp.players.position,
            status: sp.players.status,
            shirt_number: sp.shirt_number
        }));
        
        if (jugadores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#9ca3af;">No hay jugadores en la plantilla</td></tr>';
            return;
        }
        
        const elJ = document.getElementById('asistencia-total-jugadores'); 
        if (elJ) elJ.textContent = jugadores.length;
        
        // Asistencias del periodo
        const sesionIds = sesiones.map(s => s.id);
        const { data: asistencias } = await supabaseClient
            .from('asistencia_sesiones')
            .select('*')
            .in('sesion_id', sesionIds);
        
        // Calcular stats por jugador
        let htmlRows = '';
        let totalPorcentaje = 0;
        
        for (const jugador of jugadores) {
            const asistJugador = asistencias ? asistencias.filter(a => a.jugador_id === jugador.id) : [];
            const asistencias_si = asistJugador.filter(a => a.asistio === true).length;
            const porcentaje = totalSesiones > 0 ? Math.round((asistencias_si / totalSesiones) * 100) : 0;
            totalPorcentaje += porcentaje;
            
            const conPeso = asistJugador.filter(a => a.peso);
            const conWellness = asistJugador.filter(a => a.wellness);
            const conMuscular = asistJugador.filter(a => a.estado_muscular);
            
            const promPeso = conPeso.length > 0 ? (conPeso.reduce((s, a) => s + parseFloat(a.peso), 0) / conPeso.length).toFixed(1) : '-';
            const promWellness = conWellness.length > 0 ? (conWellness.reduce((s, a) => s + a.wellness, 0) / conWellness.length).toFixed(1) : '-';
            const promMuscular = conMuscular.length > 0 ? (conMuscular.reduce((s, a) => s + a.estado_muscular, 0) / conMuscular.length).toFixed(1) : '-';
            
            const clasePorc = porcentaje >= 80 ? 'porcentaje-alto' : porcentaje >= 50 ? 'porcentaje-medio' : 'porcentaje-bajo';
            
            htmlRows += `
                <tr>
                    <td>
                        <div class="jugador-cell">
                            <div class="jugador-mini-foto">
                                ${jugador.photo_url ? `<img src="${jugador.photo_url}" alt="">` : jugador.name.charAt(0)}
                            </div>
                            <div>
                                <strong>${jugador.name}</strong>
                                <br><small style="color:#6b7280;">#${jugador.shirt_number || '-'} - ${jugador.position || ''}</small>
                            </div>
                        </div>
                    </td>
                    <td>${totalSesiones}</td>
                    <td>${asistencias_si}</td>
                    <td class="${clasePorc}">${porcentaje}%</td>
                    <td>${promPeso} kg</td>
                    <td>${promWellness}</td>
                    <td>${promMuscular}</td>
                    <td>
                        <button class="btn-ver-detalle" onclick="verDetalleJugador('${jugador.id}', '${jugador.name}')">👁 Ver</button>
                        <button class="btn-pdf-jugador" onclick="generarPDFJugador('${jugador.id}')">📄 PDF</button>
                    </td>
                </tr>
            `;
        }
        
        tbody.innerHTML = htmlRows;
        
        const promedioGeneral = jugadores.length > 0 ? Math.round(totalPorcentaje / jugadores.length) : 0;
        document.getElementById('asistencia-promedio').textContent = promedioGeneral + '%';
        
    } catch (error) {
        console.error('Error cargando asistencia:', error);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#dc2626;">Error al cargar datos</td></tr>';
    }
}

// ========== MODAL ASISTENCIA SESIÓN (sin cambios funcionales) ==========
async function abrirModalAsistenciaSesion(sesionId) {
    sesionAsistenciaActual = sesionId;
    document.getElementById('modal-asistencia-sesion').style.display = 'flex';
    document.getElementById('modal-asistencia-jugadores').innerHTML = '<p style="text-align:center;color:#9ca3af;">Cargando...</p>';
    
    try {
        const { data: sesion } = await supabaseClient
            .from('training_sessions').select('*').eq('id', sesionId).single();
        
        document.getElementById('asistencia-sesion-nombre').textContent = sesion.name;
        document.getElementById('asistencia-sesion-fecha').textContent = new Date(sesion.session_date).toLocaleDateString('es-ES');
        
        const jugadoresSesion = sesion.players || [];
        if (jugadoresSesion.length === 0) {
            document.getElementById('modal-asistencia-jugadores').innerHTML = '<p style="text-align:center;color:#9ca3af;">No hay jugadores en esta sesión</p>';
            return;
        }
        
        const { data: asistencias } = await supabaseClient
            .from('asistencia_sesiones').select('*').eq('sesion_id', sesionId);
        
        const asistenciasMap = {};
        (asistencias || []).forEach(a => { asistenciasMap[a.jugador_id] = a; });
        
        let html = '';
        jugadoresSesion.forEach(j => {
            const asist = asistenciasMap[j.player_id] || {};
            const asistio = asist.asistio !== false;
            const motivo = asist.motivo_ausencia || '';
            const peso = asist.peso || '';
            const wellness = asist.wellness || '';
            const muscular = asist.estado_muscular || '';
            
            html += `
                <div class="asistencia-jugador-row" data-player-id="${j.player_id}">
                    <div class="nombre">${j.shirt_number || '?'}. ${j.name}</div>
                    <button type="button" class="toggle-asistio ${asistio ? 'si' : 'no'}" onclick="toggleAsistencia(this)">
                        ${asistio ? '✓ Asistió' : '✗ No'}
                    </button>
                    <select class="motivo-select ${asistio ? '' : 'visible'}">
                        <option value="">Motivo...</option>
                        <option value="enfermo" ${motivo === 'enfermo' ? 'selected' : ''}>Enfermo</option>
                        <option value="lesionado" ${motivo === 'lesionado' ? 'selected' : ''}>Lesionado</option>
                        <option value="ausente" ${motivo === 'ausente' ? 'selected' : ''}>Ausente</option>
                        <option value="sancionado" ${motivo === 'sancionado' ? 'selected' : ''}>Sancionado</option>
                    </select>
                    <input type="number" class="peso-input" placeholder="Peso kg" step="0.1" min="30" max="150" value="${peso}">
                    <input type="number" class="wellness-input" placeholder="Well 1-10" min="1" max="10" value="${wellness}">
                    <input type="number" class="muscular-input" placeholder="Musc 0-10" min="0" max="10" value="${muscular}">
                </div>
            `;
        });
        
        document.getElementById('modal-asistencia-jugadores').innerHTML = html;
    } catch (error) {
        console.error('Error cargando asistencia:', error);
        document.getElementById('modal-asistencia-jugadores').innerHTML = '<p style="color:red;">Error al cargar</p>';
    }
}

function toggleAsistencia(btn) {
    const row = btn.closest('.asistencia-jugador-row');
    const motivoSelect = row.querySelector('.motivo-select');
    if (btn.classList.contains('si')) {
        btn.classList.remove('si'); btn.classList.add('no'); btn.textContent = '✗ No';
        motivoSelect.classList.add('visible');
    } else {
        btn.classList.remove('no'); btn.classList.add('si'); btn.textContent = '✓ Asistió';
        motivoSelect.classList.remove('visible'); motivoSelect.value = '';
    }
}

function mostrarGuiaEscalas() {
    const modalHTML = `
        <div class="modal-overlay" onclick="if(event.target === this) this.remove()" style="z-index:1100;">
            <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                    <h3 style="color:white;">📊 Guía de Escalas - Wellness y Daño Muscular</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="color:white;">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom:25px;">
                        <h4 style="background:#10b981;color:white;padding:10px 15px;border-radius:8px;margin-bottom:12px;">💚 ESCALA DE WELLNESS (1-10)</h4>
                        <p style="font-size:12px;color:#6b7280;margin-bottom:10px;">¿Cómo te sientes hoy para entrenar?</p>
                        <table style="width:100%;border-collapse:collapse;font-size:13px;">
                            <tr style="background:#fee2e2;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;width:50px;text-align:center;">1</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>KO total</strong></td></tr>
                            <tr style="background:#fee2e2;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">2-3</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Muy bajo / Bajo</strong></td></tr>
                            <tr style="background:#fef3c7;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">4-5</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Justo / Normal</strong></td></tr>
                            <tr style="background:#d1fae5;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">6-7</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Bien / Muy bien</strong></td></tr>
                            <tr style="background:#bbf7d0;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">8-10</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Excelente / Top / Prime</strong></td></tr>
                        </table>
                    </div>
                    <div>
                        <h4 style="background:#ef4444;color:white;padding:10px 15px;border-radius:8px;margin-bottom:12px;">💪 ESCALA DE DAÑO MUSCULAR (0-10)</h4>
                        <p style="font-size:12px;color:#6b7280;margin-bottom:10px;">0=sin daño, 10=lesión</p>
                        <table style="width:100%;border-collapse:collapse;font-size:13px;">
                            <tr style="background:#d1fae5;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;width:50px;text-align:center;">0-3</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Sin daño / Leve:</strong> Carga alta OK</td></tr>
                            <tr style="background:#fef9c3;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">4-5</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Moderado:</strong> Carga alta OK con cuidado</td></tr>
                            <tr style="background:#fed7aa;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">6-7</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Alto:</strong> Limitar intensidad</td></tr>
                            <tr style="background:#fecaca;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">8-9</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Muy alto:</strong> Riesgo de lesión</td></tr>
                            <tr style="background:#ef4444;color:white;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">10</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>LESIÓN MUSCULAR</strong></td></tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function cerrarModalAsistenciaSesion() {
    document.getElementById('modal-asistencia-sesion').style.display = 'none';
    sesionAsistenciaActual = null;
}

async function guardarAsistenciaSesion() {
    if (!sesionAsistenciaActual) return;
    const rows = document.querySelectorAll('.asistencia-jugador-row');
    const registros = [];
    rows.forEach(row => {
        registros.push({
            sesion_id: sesionAsistenciaActual,
            jugador_id: row.dataset.playerId,
            asistio: row.querySelector('.toggle-asistio').classList.contains('si'),
            motivo_ausencia: row.querySelector('.toggle-asistio').classList.contains('si') ? null : (row.querySelector('.motivo-select').value || null),
            peso: parseFloat(row.querySelector('.peso-input').value) || null,
            wellness: parseInt(row.querySelector('.wellness-input').value) || null,
            estado_muscular: parseInt(row.querySelector('.muscular-input').value) || null
        });
    });
    try {
        await supabaseClient.from('asistencia_sesiones').delete().eq('sesion_id', sesionAsistenciaActual);
        const { error } = await supabaseClient.from('asistencia_sesiones').insert(registros);
        if (error) throw error;
        alert('Asistencia guardada correctamente');
        cerrarModalAsistenciaSesion();
    } catch (error) {
        console.error('Error guardando asistencia:', error);
        alert('Error al guardar: ' + error.message);
    }
}

// ========== VER DETALLE JUGADOR ==========
async function verDetalleJugador(jugadorId, nombreJugador) {
    const fechaInicio = getFechaInicio();
    const fechaFin = getFechaFin();
    
    try {
        const { data: clubInfo } = await supabaseClient.from('clubs').select('id').eq('wp_user_id', usuario.id).single();
        const { data: sesiones } = await supabaseClient
            .from('training_sessions').select('id, name, session_date')
            .eq('club_id', clubInfo.id).gte('session_date', fechaInicio).lte('session_date', fechaFin)
            .order('session_date', { ascending: true });
        
        const sesionIds = sesiones ? sesiones.map(s => s.id) : [];
        const { data: asistencias } = await supabaseClient
            .from('asistencia_sesiones').select('*').eq('jugador_id', jugadorId).in('sesion_id', sesionIds);
        
        let htmlHistorial = '';
        for (const sesion of sesiones || []) {
            const asist = asistencias ? asistencias.find(a => a.sesion_id === sesion.id) : null;
            const fechaFormato = new Date(sesion.session_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
            
            if (asist && asist.asistio === true) {
                htmlHistorial += `<div class="historial-sesion-row asistio"><div><span class="historial-fecha">${fechaFormato}</span> - ${sesion.name}</div><div class="historial-datos"><span>✅ Asistió</span>${asist.peso ? `<span>⚖️ ${asist.peso}kg</span>` : ''}${asist.wellness ? `<span>💚 ${asist.wellness}/10</span>` : ''}${asist.estado_muscular ? `<span>💪 ${asist.estado_muscular}/10</span>` : ''}</div></div>`;
            } else if (asist && asist.asistio === false) {
                htmlHistorial += `<div class="historial-sesion-row no-asistio"><div><span class="historial-fecha">${fechaFormato}</span> - ${sesion.name}</div><div><span class="historial-motivo">${asist.motivo_ausencia || 'Sin motivo'}</span></div></div>`;
            } else {
                htmlHistorial += `<div class="historial-sesion-row" style="border-left:4px solid #9ca3af;"><div><span class="historial-fecha">${fechaFormato}</span> - ${sesion.name}</div><div style="color:#9ca3af;">Sin registrar</div></div>`;
            }
        }
        if (!htmlHistorial) htmlHistorial = '<p style="text-align:center;color:#9ca3af;">No hay sesiones en este periodo</p>';
        
        const modalHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) this.remove()">
                <div class="modal-content" style="max-width:600px;">
                    <div class="modal-header"><h3>📊 Detalle de ${nombreJugador}</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
                    <div class="modal-body">
                        <p style="margin-bottom:15px;color:#6b7280;">Periodo: <strong>${getRangoTexto()}</strong></p>
                        <div class="detalle-asistencia-historial">${htmlHistorial}</div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar detalle');
    }
}

// ========== PDF INDIVIDUAL JUGADOR ==========
async function generarPDFJugador(jugadorId) {
    const fechaInicio = getFechaInicio();
    const fechaFin = getFechaFin();
    
    try {
        const { data: jugador } = await supabaseClient.from('players').select('*').eq('id', jugadorId).single();
        if (!jugador) { alert('Jugador no encontrado'); return; }
        
        const { data: clubInfo } = await supabaseClient.from('clubs').select('*').eq('wp_user_id', usuario.id).single();
        const { data: sesiones } = await supabaseClient
            .from('training_sessions').select('id, name, session_date')
            .eq('club_id', clubInfo.id).gte('session_date', fechaInicio).lte('session_date', fechaFin)
            .order('session_date', { ascending: true });
        
        const sesionIds = sesiones ? sesiones.map(s => s.id) : [];
        const { data: asistencias } = await supabaseClient
            .from('asistencia_sesiones').select('*').eq('jugador_id', jugadorId).in('sesion_id', sesionIds);
        
        const totalSesiones = sesiones ? sesiones.length : 0;
        const asistio = asistencias ? asistencias.filter(a => a.asistio === true).length : 0;
        const faltas = asistencias ? asistencias.filter(a => a.asistio === false).length : 0;
        const porcentaje = totalSesiones > 0 ? Math.round((asistio / totalSesiones) * 100) : 0;
        
        const conPeso = asistencias ? asistencias.filter(a => a.peso) : [];
        const conWellness = asistencias ? asistencias.filter(a => a.wellness) : [];
        const conMuscular = asistencias ? asistencias.filter(a => a.estado_muscular) : [];
        const promPeso = conPeso.length > 0 ? (conPeso.reduce((s, a) => s + parseFloat(a.peso), 0) / conPeso.length).toFixed(1) : '-';
        const promWellness = conWellness.length > 0 ? (conWellness.reduce((s, a) => s + a.wellness, 0) / conWellness.length).toFixed(1) : '-';
        const promMuscular = conMuscular.length > 0 ? (conMuscular.reduce((s, a) => s + a.estado_muscular, 0) / conMuscular.length).toFixed(1) : '-';
        
        const motivos = {};
        if (asistencias) asistencias.filter(a => !a.asistio && a.motivo_ausencia).forEach(a => { motivos[a.motivo_ausencia] = (motivos[a.motivo_ausencia] || 0) + 1; });
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const rangoTexto = getRangoTexto();
        
        // HEADER
        doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 50, 'F');
        doc.setFillColor(251, 191, 36); doc.rect(0, 50, 210, 3, 'F');
        if (clubInfo.logo_url) { try { doc.addImage(clubInfo.logo_url, 'PNG', 12, 8, 32, 32); } catch(e) { doc.setFillColor(251,191,36); doc.circle(28,24,16,'F'); doc.setTextColor(15,23,42); doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.text(clubInfo.name?clubInfo.name.charAt(0):'C',28,28,{align:'center'}); } }
        else { doc.setFillColor(251,191,36); doc.circle(28,24,16,'F'); doc.setTextColor(15,23,42); doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.text(clubInfo.name?clubInfo.name.charAt(0):'C',28,28,{align:'center'}); }
        
        doc.setTextColor(255,255,255); doc.setFontSize(22); doc.setFont('helvetica','bold');
        doc.text('INFORME DE RENDIMIENTO', 115, 18, {align:'center'});
        doc.setFontSize(11); doc.setFont('helvetica','normal'); doc.setTextColor(203,213,225);
        doc.text('Control de Asistencia y Bienestar', 115, 28, {align:'center'});
        doc.setFontSize(10); doc.setTextColor(251,191,36);
        doc.text(`${clubInfo.name || 'Mi Club'}  |  ${rangoTexto}`, 115, 40, {align:'center'});
        
        let y = 62;
        
        // FICHA JUGADOR
        doc.setFillColor(248,250,252); doc.roundedRect(12,y,186,38,3,3,'F');
        doc.setDrawColor(226,232,240); doc.roundedRect(12,y,186,38,3,3,'S');
        if (jugador.photo_url) { try { doc.addImage(jugador.photo_url, 'JPEG', 18, y+4, 30, 30); } catch(e) { doc.setFillColor(124,58,237); doc.circle(33,y+19,15,'F'); doc.setTextColor(255,255,255); doc.setFontSize(18); doc.setFont('helvetica','bold'); doc.text(jugador.name.charAt(0),33,y+24,{align:'center'}); } }
        else { doc.setFillColor(124,58,237); doc.circle(33,y+19,15,'F'); doc.setTextColor(255,255,255); doc.setFontSize(18); doc.setFont('helvetica','bold'); doc.text(jugador.name.charAt(0),33,y+24,{align:'center'}); }
        
        doc.setTextColor(15,23,42); doc.setFontSize(18); doc.setFont('helvetica','bold');
        doc.text(jugador.name.toUpperCase(), 55, y+14);
        doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setTextColor(100,116,139);
        doc.text(`Posicion: ${jugador.position || '-'}`, 55, y+24);
        
        const porcColor = porcentaje >= 80 ? [16,185,129] : porcentaje >= 50 ? [245,158,11] : [239,68,68];
        doc.setFillColor(...porcColor); doc.roundedRect(155,y+5,38,28,3,3,'F');
        doc.setTextColor(255,255,255); doc.setFontSize(20); doc.setFont('helvetica','bold');
        doc.text(`${porcentaje}%`, 174, y+23, {align:'center'});
        doc.setFontSize(7); doc.text('ASISTENCIA', 174, y+30, {align:'center'});
        
        y += 48;
        
        // STATS
        doc.setFillColor(124,58,237); doc.roundedRect(12,y,186,9,2,2,'F');
        doc.setTextColor(255,255,255); doc.setFontSize(10); doc.setFont('helvetica','bold');
        doc.text('RESUMEN DE ASISTENCIA', 105, y+6.5, {align:'center'}); y += 14;
        
        const bw = 58, bh = 28;
        doc.setFillColor(241,245,249); doc.roundedRect(12,y,bw,bh,3,3,'F');
        doc.setTextColor(15,23,42); doc.setFontSize(22); doc.setFont('helvetica','bold');
        doc.text(`${totalSesiones}`, 41, y+14, {align:'center'});
        doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(100,116,139);
        doc.text('SESIONES', 41, y+23, {align:'center'});
        
        doc.setFillColor(220,252,231); doc.roundedRect(76,y,bw,bh,3,3,'F');
        doc.setTextColor(22,163,74); doc.setFontSize(22); doc.setFont('helvetica','bold');
        doc.text(`${asistio}`, 105, y+14, {align:'center'});
        doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.text('ASISTENCIAS', 105, y+23, {align:'center'});
        
        doc.setFillColor(254,226,226); doc.roundedRect(140,y,bw,bh,3,3,'F');
        doc.setTextColor(220,38,38); doc.setFontSize(22); doc.setFont('helvetica','bold');
        doc.text(`${faltas}`, 169, y+14, {align:'center'});
        doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.text('AUSENCIAS', 169, y+23, {align:'center'});
        y += 38;
        
        // BIENESTAR
        doc.setFillColor(59,130,246); doc.roundedRect(12,y,186,9,2,2,'F');
        doc.setTextColor(255,255,255); doc.setFontSize(10); doc.setFont('helvetica','bold');
        doc.text('DATOS DE BIENESTAR (Promedios)', 105, y+6.5, {align:'center'}); y += 14;
        
        doc.setFillColor(241,245,249); doc.roundedRect(12,y,bw,bh,3,3,'F');
        doc.setTextColor(15,23,42); doc.setFontSize(18); doc.setFont('helvetica','bold');
        doc.text(`${promPeso}`, 41, y+12, {align:'center'}); doc.setFontSize(10); doc.text('kg', 41, y+20, {align:'center'});
        doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(100,116,139); doc.text('PESO PROM.', 41, y+26, {align:'center'});
        
        const wn = promWellness !== '-' ? parseFloat(promWellness) : 0;
        doc.setFillColor(...(wn >= 7 ? [220,252,231] : wn >= 5 ? [254,249,195] : [254,226,226]));
        doc.roundedRect(76,y,bw,bh,3,3,'F');
        doc.setTextColor(15,23,42); doc.setFontSize(18); doc.setFont('helvetica','bold');
        doc.text(`${promWellness}`, 105, y+12, {align:'center'}); doc.setFontSize(10); doc.text('/10', 105, y+20, {align:'center'});
        doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(100,116,139); doc.text('WELLNESS', 105, y+26, {align:'center'});
        
        const mn = promMuscular !== '-' ? parseFloat(promMuscular) : 10;
        doc.setFillColor(...(mn <= 4 ? [220,252,231] : mn <= 6 ? [254,249,195] : [254,226,226]));
        doc.roundedRect(140,y,bw,bh,3,3,'F');
        doc.setTextColor(15,23,42); doc.setFontSize(18); doc.setFont('helvetica','bold');
        doc.text(`${promMuscular}`, 169, y+12, {align:'center'}); doc.setFontSize(10); doc.text('/10', 169, y+20, {align:'center'});
        doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(100,116,139); doc.text('MUSCULAR', 169, y+26, {align:'center'});
        y += 38;
        
        // HISTORIAL
        doc.setFillColor(71,85,105); doc.roundedRect(12,y,186,9,2,2,'F');
        doc.setTextColor(255,255,255); doc.setFontSize(10); doc.setFont('helvetica','bold');
        doc.text('HISTORIAL DETALLADO', 105, y+6.5, {align:'center'}); y += 14;
        
        doc.setFillColor(241,245,249); doc.rect(12,y,186,8,'F');
        doc.setTextColor(71,85,105); doc.setFontSize(8); doc.setFont('helvetica','bold');
        doc.text('FECHA',18,y+5.5); doc.text('SESION',50,y+5.5); doc.text('ESTADO',115,y+5.5);
        doc.text('PESO',145,y+5.5); doc.text('WELL',163,y+5.5); doc.text('MUSC',180,y+5.5);
        y += 10;
        
        let filaColor = false;
        for (const sesion of sesiones || []) {
            if (y > 270) { doc.addPage(); y = 20; }
            const asist = asistencias ? asistencias.find(a => a.sesion_id === sesion.id) : null;
            const fechaF = new Date(sesion.session_date).toLocaleDateString('es-ES', {day:'2-digit',month:'2-digit'});
            if (filaColor) { doc.setFillColor(248,250,252); doc.rect(12,y-3,186,9,'F'); }
            filaColor = !filaColor;
            doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(15,23,42);
            doc.text(fechaF, 18, y+3); doc.text(sesion.name.substring(0,30), 50, y+3);
            if (asist) {
                if (asist.asistio) { doc.setTextColor(22,163,74); doc.text('Asistio',115,y+3); doc.setTextColor(15,23,42); doc.text(asist.peso?`${asist.peso}`:'-',145,y+3); doc.text(asist.wellness?`${asist.wellness}`:'-',165,y+3); doc.text(asist.estado_muscular?`${asist.estado_muscular}`:'-',182,y+3); }
                else { doc.setTextColor(220,38,38); doc.text(asist.motivo_ausencia||'Falta',115,y+3); doc.setTextColor(156,163,175); doc.text('-',145,y+3); doc.text('-',165,y+3); doc.text('-',182,y+3); }
            } else { doc.setTextColor(156,163,175); doc.text('Sin registrar',115,y+3); doc.text('-',145,y+3); doc.text('-',165,y+3); doc.text('-',182,y+3); }
            y += 9;
        }
        
        // FOOTER
        doc.setFillColor(15,23,42); doc.rect(0,282,210,15,'F');
        doc.setFillColor(251,191,36); doc.rect(0,282,210,1,'F');
        doc.setTextColor(148,163,184); doc.setFontSize(8); doc.setFont('helvetica','normal');
        doc.text(`Generado el ${new Date().toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'})}`, 15, 290);
        doc.setTextColor(251,191,36); doc.setFont('helvetica','bold');
        doc.text('TopLiderCoach HUB', 195, 290, {align:'right'});
        
        doc.save(`Informe_${jugador.name.replace(/\s/g,'_')}_${fechaInicio}_${fechaFin}.pdf`);
    } catch (error) {
        console.error('Error generando PDF:', error);
        alert('Error al generar el PDF: ' + error.message);
    }
}

// ========== PDF GENERAL PLANTILLA ==========
async function generarPDFPlantillaGeneral() {
    const fechaInicio = getFechaInicio();
    const fechaFin = getFechaFin();
    if (!fechaInicio || !fechaFin) { alert('Selecciona fechas primero'); return; }
    
    try {
        const { data: clubInfo } = await supabaseClient.from('clubs').select('*').eq('wp_user_id', usuario.id).single();
        if (!clubInfo) throw new Error('Club no encontrado');
        
        // Sesiones
        const { data: sesiones } = await supabaseClient
            .from('training_sessions').select('id, name, session_date')
            .eq('club_id', clubInfo.id).gte('session_date', fechaInicio).lte('session_date', fechaFin)
            .order('session_date', { ascending: true });
        
        const totalSesiones = sesiones ? sesiones.length : 0;
        if (totalSesiones === 0) { alert('No hay sesiones en el periodo seleccionado'); return; }
        
        // Jugadores plantilla
        let currentSeasonId = seasonId;
        if (!currentSeasonId) {
            const { data: tempData } = await supabaseClient
                .from('seasons').select('id').eq('club_id', clubInfo.id).eq('is_active', true).single();
            currentSeasonId = tempData?.id;
        }
        if (!currentSeasonId) { alert('No hay temporada activa'); return; }
        
        const { data: spData } = await supabaseClient
            .from('season_players')
            .select('player_id, shirt_number, players(id, name, photo_url, position)')
            .eq('season_id', currentSeasonId)
            .order('shirt_number');
        
        const jugadores = (spData || []).map(sp => ({
            id: sp.players.id, name: sp.players.name, photo_url: sp.players.photo_url,
            position: sp.players.position, shirt_number: sp.shirt_number
        }));
        
        if (jugadores.length === 0) { alert('No hay jugadores en la plantilla'); return; }
        
        // Asistencias
        const sesionIds = sesiones.map(s => s.id);
        const { data: asistencias } = await supabaseClient
            .from('asistencia_sesiones').select('*').in('sesion_id', sesionIds);
        
        // Calcular stats por jugador
        const statsJugadores = jugadores.map(j => {
            const asistJ = asistencias ? asistencias.filter(a => a.jugador_id === j.id) : [];
            const si = asistJ.filter(a => a.asistio === true).length;
            const no = asistJ.filter(a => a.asistio === false).length;
            const pct = totalSesiones > 0 ? Math.round((si / totalSesiones) * 100) : 0;
            const cW = asistJ.filter(a => a.wellness); const cM = asistJ.filter(a => a.estado_muscular); const cP = asistJ.filter(a => a.peso);
            return {
                ...j, asistencias: si, ausencias: no, porcentaje: pct,
                promWellness: cW.length > 0 ? (cW.reduce((s,a) => s+a.wellness, 0)/cW.length).toFixed(1) : '-',
                promMuscular: cM.length > 0 ? (cM.reduce((s,a) => s+a.estado_muscular, 0)/cM.length).toFixed(1) : '-',
                promPeso: cP.length > 0 ? (cP.reduce((s,a) => s+parseFloat(a.peso), 0)/cP.length).toFixed(1) : '-'
            };
        });
        
        // Ordenar por % asistencia descendente
        statsJugadores.sort((a, b) => b.porcentaje - a.porcentaje);
        
        const promedioGeneral = statsJugadores.length > 0 ? Math.round(statsJugadores.reduce((s,j) => s+j.porcentaje, 0) / statsJugadores.length) : 0;
        
        // GENERAR PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        const rangoTexto = getRangoTexto();
        
        // HEADER
        doc.setFillColor(15, 23, 42); doc.rect(0, 0, 297, 45, 'F');
        doc.setFillColor(251, 191, 36); doc.rect(0, 45, 297, 3, 'F');
        
        if (clubInfo.logo_url) { try { doc.addImage(clubInfo.logo_url, 'PNG', 12, 6, 30, 30); } catch(e) {} }
        
        doc.setTextColor(255,255,255); doc.setFontSize(24); doc.setFont('helvetica','bold');
        doc.text('INFORME GENERAL DE ASISTENCIA', 148, 16, {align:'center'});
        doc.setFontSize(12); doc.setFont('helvetica','normal'); doc.setTextColor(203,213,225);
        doc.text('Control de Asistencia de la Plantilla', 148, 26, {align:'center'});
        doc.setFontSize(10); doc.setTextColor(251,191,36);
        doc.text(`${clubInfo.name || 'Mi Club'}  |  ${rangoTexto}`, 148, 36, {align:'center'});
        
        let y = 55;
        
        // RESUMEN GENERAL
        doc.setFillColor(124,58,237); doc.roundedRect(10,y,277,9,2,2,'F');
        doc.setTextColor(255,255,255); doc.setFontSize(10); doc.setFont('helvetica','bold');
        doc.text('RESUMEN GENERAL', 148, y+6.5, {align:'center'}); y += 14;
        
        const bw2 = 65, bh2 = 24;
        // Sesiones
        doc.setFillColor(241,245,249); doc.roundedRect(10,y,bw2,bh2,3,3,'F');
        doc.setTextColor(15,23,42); doc.setFontSize(20); doc.setFont('helvetica','bold');
        doc.text(`${totalSesiones}`, 42, y+12, {align:'center'});
        doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(100,116,139);
        doc.text('SESIONES', 42, y+20, {align:'center'});
        
        // Jugadores
        doc.setFillColor(241,245,249); doc.roundedRect(80,y,bw2,bh2,3,3,'F');
        doc.setTextColor(15,23,42); doc.setFontSize(20); doc.setFont('helvetica','bold');
        doc.text(`${jugadores.length}`, 112, y+12, {align:'center'});
        doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(100,116,139);
        doc.text('JUGADORES', 112, y+20, {align:'center'});
        
        // Asistencia media
        const pctColor = promedioGeneral >= 80 ? [16,185,129] : promedioGeneral >= 50 ? [245,158,11] : [239,68,68];
        doc.setFillColor(...pctColor); doc.roundedRect(150,y,bw2,bh2,3,3,'F');
        doc.setTextColor(255,255,255); doc.setFontSize(20); doc.setFont('helvetica','bold');
        doc.text(`${promedioGeneral}%`, 182, y+12, {align:'center'});
        doc.setFontSize(8); doc.text('ASISTENCIA MEDIA', 182, y+20, {align:'center'});
        
        // Periodo
        doc.setFillColor(241,245,249); doc.roundedRect(220,y,67,bh2,3,3,'F');
        doc.setTextColor(15,23,42); doc.setFontSize(9); doc.setFont('helvetica','bold');
        doc.text(rangoTexto, 253, y+14, {align:'center'});
        doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(100,116,139);
        doc.text('PERIODO', 253, y+20, {align:'center'});
        
        y += 32;
        
        // TABLA
        doc.setFillColor(71,85,105); doc.roundedRect(10,y,277,9,2,2,'F');
        doc.setTextColor(255,255,255); doc.setFontSize(10); doc.setFont('helvetica','bold');
        doc.text('DETALLE POR JUGADOR', 148, y+6.5, {align:'center'}); y += 12;
        
        // Cabecera tabla
        doc.setFillColor(241,245,249); doc.rect(10,y,277,8,'F');
        doc.setTextColor(71,85,105); doc.setFontSize(8); doc.setFont('helvetica','bold');
        doc.text('#', 14, y+5.5);
        doc.text('JUGADOR', 24, y+5.5);
        doc.text('POSICIÓN', 90, y+5.5);
        doc.text('SES', 140, y+5.5);
        doc.text('ASIST', 158, y+5.5);
        doc.text('AUS', 178, y+5.5);
        doc.text('%', 196, y+5.5);
        doc.text('PESO', 212, y+5.5);
        doc.text('WELL', 234, y+5.5);
        doc.text('MUSC', 256, y+5.5);
        y += 10;
        
        let filaColor = false;
        for (const j of statsJugadores) {
            if (y > 190) {
                doc.addPage('landscape');
                y = 15;
                doc.setFillColor(241,245,249); doc.rect(10,y,277,8,'F');
                doc.setTextColor(71,85,105); doc.setFontSize(8); doc.setFont('helvetica','bold');
                doc.text('#',14,y+5.5); doc.text('JUGADOR',24,y+5.5); doc.text('POSICIÓN',90,y+5.5);
                doc.text('SES',140,y+5.5); doc.text('ASIST',158,y+5.5); doc.text('AUS',178,y+5.5);
                doc.text('%',196,y+5.5); doc.text('PESO',212,y+5.5); doc.text('WELL',234,y+5.5); doc.text('MUSC',256,y+5.5);
                y += 10;
                filaColor = false;
            }
            
            if (filaColor) { doc.setFillColor(248,250,252); doc.rect(10,y-3,277,9,'F'); }
            filaColor = !filaColor;
            
            // Color % asistencia
            doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(15,23,42);
            doc.text(`${j.shirt_number || '-'}`, 14, y+3);
            doc.text(j.name.substring(0, 28), 24, y+3);
            doc.setTextColor(100,116,139);
            doc.text((j.position || '-').substring(0, 20), 90, y+3);
            doc.setTextColor(15,23,42);
            doc.text(`${totalSesiones}`, 142, y+3);
            doc.setTextColor(22,163,74); doc.text(`${j.asistencias}`, 162, y+3);
            doc.setTextColor(220,38,38); doc.text(`${j.ausencias}`, 180, y+3);
            
            // % con color
            const pc = j.porcentaje;
            if (pc >= 80) doc.setTextColor(22,163,74);
            else if (pc >= 50) doc.setTextColor(245,158,11);
            else doc.setTextColor(220,38,38);
            doc.setFont('helvetica','bold');
            doc.text(`${pc}%`, 196, y+3);
            
            doc.setFont('helvetica','normal'); doc.setTextColor(15,23,42);
            doc.text(`${j.promPeso}`, 214, y+3);
            doc.text(`${j.promWellness}`, 238, y+3);
            doc.text(`${j.promMuscular}`, 260, y+3);
            
            y += 9;
        }
        
        // FOOTER
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFillColor(15,23,42); doc.rect(0, pageH-12, 297, 12, 'F');
        doc.setFillColor(251,191,36); doc.rect(0, pageH-12, 297, 1, 'F');
        doc.setTextColor(148,163,184); doc.setFontSize(8); doc.setFont('helvetica','normal');
        doc.text(`Generado el ${new Date().toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'})}`, 15, pageH-4);
        doc.setTextColor(251,191,36); doc.setFont('helvetica','bold');
        doc.text('TopLiderCoach HUB', 282, pageH-4, {align:'right'});
        
        doc.save(`Asistencia_General_${fechaInicio}_${fechaFin}.pdf`);
        
    } catch (error) {
        console.error('Error generando PDF general:', error);
        alert('Error al generar PDF: ' + error.message);
    }
}