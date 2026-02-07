// ========== ASISTENCIA.JS - TopLiderCoach HUB ==========
// Asistencia a sesiones, bienestar, resumen mensual, PDF

// Botón flotante: navegar a la pestaña de asistencia
function togglePanelAsistencia() {
    // Activar módulo planificador
    var tabPlanificador = document.querySelector('.main-tab.planificador');
    if (tabPlanificador) cambiarModulo('planificador', tabPlanificador);
    // Activar subtab asistencia
    var btnAsistencia = document.querySelector('#modulo-planificador .sub-tab:last-child');
    if (btnAsistencia) cambiarSubTab('planificador', 'asistencia', btnAsistencia);
}

// Registro en navegación (reemplaza el monkey-patch anterior)
registrarSubTab('planificador', 'asistencia', function() {
    cargarSelectorMeses();
    cargarAsistenciaMes();
});

// También cargar los meses al iniciar la app (por si el subtab no dispara)
registrarInit(function() {
    cargarSelectorMeses();
});

async function abrirModalAsistenciaSesion(sesionId) {
    sesionAsistenciaActual = sesionId;
    document.getElementById('modal-asistencia-sesion').style.display = 'flex';
    document.getElementById('modal-asistencia-jugadores').innerHTML = '<p style="text-align:center;color:#9ca3af;">Cargando...</p>';
    
    try {
        // Obtener datos de la sesión
        const { data: sesion, error: errorSesion } = await supabaseClient
            .from('training_sessions')
            .select('*')
            .eq('id', sesionId)
            .single();
        
        if (errorSesion) throw errorSesion;
        
        document.getElementById('asistencia-sesion-nombre').textContent = sesion.name;
        document.getElementById('asistencia-sesion-fecha').textContent = new Date(sesion.session_date).toLocaleDateString('es-ES');
        
        // Obtener jugadores de la sesión (guardados en players)
        const jugadoresSesion = sesion.players || [];
        
        if (jugadoresSesion.length === 0) {
            document.getElementById('modal-asistencia-jugadores').innerHTML = '<p style="text-align:center;color:#9ca3af;">No hay jugadores en esta sesión</p>';
            return;
        }
        
        // Obtener asistencias existentes
        const { data: asistencias } = await supabaseClient
            .from('asistencia_sesiones')
            .select('*')
            .eq('sesion_id', sesionId);
        
        const asistenciasMap = {};
        (asistencias || []).forEach(a => {
            asistenciasMap[a.jugador_id] = a;
        });
        
        // Renderizar jugadores
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
                    <input type="number" class="wellness-input" placeholder="Well 1-10" min="1" max="10" value="${wellness}" title="Wellness (1-10)">
                    <input type="number" class="muscular-input" placeholder="Musc 0-10" min="0" max="10" value="${muscular}" title="Estado Muscular (0-10)">
                </div>
            `;
        });
        
        document.getElementById('modal-asistencia-jugadores').innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando asistencia:', error);
        document.getElementById('modal-asistencia-jugadores').innerHTML = '<p style="color:red;">Error al cargar</p>';
    }
}

// Toggle asistencia
function toggleAsistencia(btn) {
    const row = btn.closest('.asistencia-jugador-row');
    const motivoSelect = row.querySelector('.motivo-select');
    
    if (btn.classList.contains('si')) {
        btn.classList.remove('si');
        btn.classList.add('no');
        btn.textContent = '✗ No';
        motivoSelect.classList.add('visible');
    } else {
        btn.classList.remove('no');
        btn.classList.add('si');
        btn.textContent = '✓ Asistió';
        motivoSelect.classList.remove('visible');
        motivoSelect.value = '';
    }
}
// Mostrar guía de escalas
function mostrarGuiaEscalas() {
    const modalHTML = `
        <div class="modal-overlay" onclick="if(event.target === this) this.remove()" style="z-index:1100;">
            <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                    <h3 style="color:white;">📊 Guía de Escalas - Wellness y Daño Muscular</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="color:white;">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- WELLNESS -->
                    <div style="margin-bottom:25px;">
                        <h4 style="background:#10b981;color:white;padding:10px 15px;border-radius:8px;margin-bottom:12px;">
                            💚 ESCALA DE WELLNESS (1-10)
                        </h4>
                        <p style="font-size:12px;color:#6b7280;margin-bottom:10px;">¿Cómo te sientes hoy para entrenar?</p>
                        <table style="width:100%;border-collapse:collapse;font-size:13px;">
                            <tr style="background:#fee2e2;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;width:50px;text-align:center;">1</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>KO total:</strong> "Hoy toca recuperar sí o sí."</td></tr>
                            <tr style="background:#fee2e2;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">2</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Muy bajo:</strong> "Cuerpo pesado, energía mínima."</td></tr>
                            <tr style="background:#fef3c7;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">3</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Bajo:</strong> "Voy en modo supervivencia."</td></tr>
                            <tr style="background:#fef3c7;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">4</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Justo:</strong> "Puedo, pero con cuidado."</td></tr>
                            <tr style="background:#fef9c3;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">5</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Normal:</strong> "Estoy ok, sin chispa."</td></tr>
                            <tr style="background:#d1fae5;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">6</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Bien:</strong> "Buenas sensaciones, ritmo estable."</td></tr>
                            <tr style="background:#d1fae5;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">7</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Muy bien:</strong> "Me noto suelto y con ganas."</td></tr>
                            <tr style="background:#bbf7d0;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">8</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Excelente:</strong> "Fuerte, rápido y concentrado."</td></tr>
                            <tr style="background:#bbf7d0;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">9</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Top:</strong> "Listo para apretar de verdad."</td></tr>
                            <tr style="background:#86efac;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">10</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Prime:</strong> "Día perfecto: voy volando."</td></tr>
                        </table>
                    </div>
                    
                    <!-- DAÑO MUSCULAR -->
                    <div>
                        <h4 style="background:#ef4444;color:white;padding:10px 15px;border-radius:8px;margin-bottom:12px;">
                            💪 ESCALA DE DAÑO MUSCULAR (0-10)
                        </h4>
                        <p style="font-size:12px;color:#6b7280;margin-bottom:10px;">¿Cuánto daño muscular sientes?</p>
                        <table style="width:100%;border-collapse:collapse;font-size:13px;">
                            <tr style="background:#f0fdf4;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;width:50px;text-align:center;">0</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Descanso total:</strong> Recuperación completa / no entreno</td></tr>
                            <tr style="background:#d1fae5;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">1</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Sin daño:</strong> Sensación muy buena, carga muy alta OK</td></tr>
                            <tr style="background:#d1fae5;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">2</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Daño muy leve:</strong> Rigidez mínima, carga muy alta OK</td></tr>
                            <tr style="background:#d1fae5;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">3</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Daño leve:</strong> Agujetas suaves, carga muy alta OK</td></tr>
                            <tr style="background:#fef9c3;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">4</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Daño leve-moderado:</strong> Carga alta OK</td></tr>
                            <tr style="background:#fef9c3;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">5</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Daño normal:</strong> Carga alta OK</td></tr>
                            <tr style="background:#fef3c7;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">6</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Daño moderado:</strong> Se nota en gestos fuertes</td></tr>
                            <tr style="background:#fed7aa;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">7</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Daño alto:</strong> Dolor/tensión, limitar intensidad alta</td></tr>
                            <tr style="background:#fecaca;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">8</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Daño muy alto:</strong> Me limita claramente</td></tr>
                            <tr style="background:#fca5a5;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">9</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Daño extremo:</strong> Sensación de riesgo de lesión</td></tr>
                            <tr style="background:#ef4444;color:white;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;text-align:center;">10</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>LESIÓN MUSCULAR:</strong> No apto para entrenar</td></tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}
// Cerrar modal
function cerrarModalAsistenciaSesion() {
    document.getElementById('modal-asistencia-sesion').style.display = 'none';
    sesionAsistenciaActual = null;
}

// Guardar asistencia
async function guardarAsistenciaSesion() {
    if (!sesionAsistenciaActual) return;
    
    const rows = document.querySelectorAll('.asistencia-jugador-row');
    const registros = [];
    
    rows.forEach(row => {
        const playerId = row.dataset.playerId;
        const asistio = row.querySelector('.toggle-asistio').classList.contains('si');
        const motivo = row.querySelector('.motivo-select').value || null;
        const peso = parseFloat(row.querySelector('.peso-input').value) || null;
        const wellness = parseInt(row.querySelector('.wellness-input').value) || null;
        const muscular = parseInt(row.querySelector('.muscular-input').value) || null;
        
        registros.push({
            sesion_id: sesionAsistenciaActual,
            jugador_id: playerId,
            asistio: asistio,
            motivo_ausencia: asistio ? null : motivo,
            peso: peso,
            wellness: wellness,
            estado_muscular: muscular
        });
    });
    
    try {
        // Eliminar registros anteriores de esta sesión
        await supabaseClient
            .from('asistencia_sesiones')
            .delete()
            .eq('sesion_id', sesionAsistenciaActual);
        
        // Insertar nuevos
        const { error } = await supabaseClient
            .from('asistencia_sesiones')
            .insert(registros);
        
        if (error) throw error;
        
        alert('Asistencia guardada correctamente');
        cerrarModalAsistenciaSesion();
        
    } catch (error) {
        console.error('Error guardando asistencia:', error);
        alert('Error al guardar: ' + error.message);
    }
}
// Variables globales asistencia
let asistenciaMesActual = new Date().toISOString().slice(0, 7); // YYYY-MM

// Cargar selector de meses
async function cargarSelectorMeses() {
    var select = document.getElementById('asistencia-mes');
    if (!select) { console.error('Select asistencia-mes no encontrado'); return; }
    
    // Construir todas las opciones de una vez
    var opciones = '<option value="">Selecciona mes...</option>';
    var hoy = new Date();
    for (var i = 0; i < 12; i++) {
        var fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        var valor = fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0');
        var nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        var selected = (i === 0) ? ' selected' : '';
        opciones += '<option value="' + valor + '"' + selected + '>' + nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1) + '</option>';
    }
    select.innerHTML = opciones;
    
    asistenciaMesActual = select.value;
}

// Cargar asistencia del mes
async function cargarAsistenciaMes() {
    const select = document.getElementById('asistencia-mes');
    const mes = select ? select.value : asistenciaMesActual;
    
    if (!mes) {
        alert('Selecciona un mes');
        return;
    }
    
    asistenciaMesActual = mes;
    
    const tbody = document.getElementById('asistencia-tabla-body');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Cargando...</td></tr>';
    
   try {
    // Obtener club del usuario
    const { data: clubData, error: errorClub } = await supabaseClient
        .from('clubs')
        .select('id')
        .eq('wp_user_id', usuario.id)
        .single();
    
    if (errorClub || !clubData) {
        throw new Error('No se encontró el club');
    }

    // Obtener sesiones del mes
        const inicioMes = `${mes}-01`;
        const [anio, mesNum] = mes.split('-').map(Number);
const ultimoDia = new Date(anio, mesNum, 0).getDate();
const finMes = `${mes}-${String(ultimoDia).padStart(2, '0')}`;
        console.log('Buscando sesiones desde:', inicioMes, 'hasta:', finMes, 'club:', clubData.id);
        const { data: sesiones, error: errorSesiones } = await supabaseClient
            .from('training_sessions')
            .select('id, session_date')
            .eq('club_id', clubData.id)
            .gte('session_date', inicioMes)
            .lte('session_date', finMes)
            .order('session_date', { ascending: true });
        
        if (errorSesiones) throw errorSesiones;
        
        const totalSesiones = sesiones ? sesiones.length : 0;
        document.getElementById('asistencia-total-sesiones').textContent = totalSesiones;
        
        if (totalSesiones === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#9ca3af;">No hay sesiones en este mes</td></tr>';
            document.getElementById('asistencia-promedio').textContent = '0%';
            return;
        }
        
        // Obtener jugadores activos
        const { data: jugadores, error: errorJugadores } = await supabaseClient
            .from('players')
            .select('id, name, shirt_number, photo_url, position')
            .eq('club_id', clubData.id)
            .eq('status', 'available')
            .order('shirt_number', { ascending: true });
        
        if (errorJugadores) throw errorJugadores;
        
        if (!jugadores || jugadores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#9ca3af;">No hay jugadores registrados</td></tr>';
            return;
        }
        
        // Obtener asistencias del mes
        const sesionIds = sesiones.map(s => s.id);
        const { data: asistencias, error: errorAsist } = await supabaseClient
            .from('asistencia_sesiones')
            .select('*')
            .in('sesion_id', sesionIds);
        
        if (errorAsist) throw errorAsist;
        
        // Calcular stats por jugador
        let htmlRows = '';
        let totalPorcentaje = 0;
        
        for (const jugador of jugadores) {
            const asistJugador = asistencias ? asistencias.filter(a => a.jugador_id === jugador.id) : [];
            const asistencias_si = asistJugador.filter(a => a.asistio === true).length;
            const porcentaje = totalSesiones > 0 ? Math.round((asistencias_si / totalSesiones) * 100) : 0;
            totalPorcentaje += porcentaje;
            
            // Promedios
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
                                <br><small style="color:#6b7280;">#${jugador.number || '-'} - ${jugador.position || ''}</small>
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
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#dc2626;">Error al cargar datos</td></tr>';
    }
}

// Ver detalle de un jugador
async function verDetalleJugador(jugadorId, nombreJugador) {
    const mes = asistenciaMesActual;
    const inicioMes = `${mes}-01`;
    const [anio, mesNum] = mes.split('-').map(Number);
const ultimoDia = new Date(anio, mesNum, 0).getDate();
const finMes = `${mes}-${String(ultimoDia).padStart(2, '0')}`;
    
   try {
        // Obtener club
        const { data: clubData } = await supabaseClient
            .from('clubs')
            .select('id')
            .eq('wp_user_id', usuario.id)
            .single();

        // Sesiones del mes
        const { data: sesiones } = await supabaseClient
            .from('training_sessions')
            .select('id, name, session_date')
            .eq('club_id', clubData.id)
            .gte('session_date', inicioMes)
.lte('session_date', finMes)
            .order('session_date', { ascending: true });
        
        // Asistencias del jugador
        const sesionIds = sesiones ? sesiones.map(s => s.id) : [];
        const { data: asistencias } = await supabaseClient
            .from('asistencia_sesiones')
            .select('*')
            .eq('jugador_id', jugadorId)
            .in('sesion_id', sesionIds);
        
        let htmlHistorial = '';
        
        for (const sesion of sesiones || []) {
            const asist = asistencias ? asistencias.find(a => a.sesion_id === sesion.id) : null;
            const asistio = asist ? asist.asistio : null;
            const fechaFormato = new Date(sesion.session_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
            
            if (asistio === true) {
                htmlHistorial += `
                    <div class="historial-sesion-row asistio">
                        <div>
                            <span class="historial-fecha">${fechaFormato}</span> - ${sesion.name}
                        </div>
                        <div class="historial-datos">
                            <span>✅ Asistió</span>
                            ${asist.peso ? `<span>⚖️ ${asist.peso}kg</span>` : ''}
                            ${asist.wellness ? `<span>💚 ${asist.wellness}/10</span>` : ''}
                            ${asist.estado_muscular ? `<span>💪 ${asist.estado_muscular}/10</span>` : ''}
                        </div>
                    </div>
                `;
            } else if (asistio === false) {
                htmlHistorial += `
                    <div class="historial-sesion-row no-asistio">
                        <div>
                            <span class="historial-fecha">${fechaFormato}</span> - ${sesion.name}
                        </div>
                        <div>
                            <span class="historial-motivo">${asist.motivo_ausencia || 'Sin motivo'}</span>
                        </div>
                    </div>
                `;
            } else {
                htmlHistorial += `
                    <div class="historial-sesion-row" style="border-left: 4px solid #9ca3af;">
                        <div>
                            <span class="historial-fecha">${fechaFormato}</span> - ${sesion.name}
                        </div>
                        <div style="color:#9ca3af;">Sin registrar</div>
                    </div>
                `;
            }
        }
        
        if (!htmlHistorial) htmlHistorial = '<p style="text-align:center; color:#9ca3af;">No hay sesiones en este mes</p>';
        
        const modalHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) this.remove()">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3>📊 Detalle de ${nombreJugador}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="margin-bottom: 15px; color: #6b7280;">Mes: <strong>${new Date(mes + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</strong></p>
                        <div class="detalle-asistencia-historial">
                            ${htmlHistorial}
                        </div>
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

// Generar PDF individual del jugador
async function generarPDFJugador(jugadorId) {
    const mes = asistenciaMesActual;
    const inicioMes = `${mes}-01`;
    const [anio, mesNum] = mes.split('-').map(Number);
    const ultimoDia = new Date(anio, mesNum, 0).getDate();
    const finMes = `${mes}-${String(ultimoDia).padStart(2, '0')}`;
    
    try {
        // Datos del jugador
        const { data: jugador } = await supabaseClient
            .from('players')
            .select('*')
            .eq('id', jugadorId)
            .single();
        
        if (!jugador) {
            alert('Jugador no encontrado');
            return;
        }
        
        // Obtener club con todos los datos
        const { data: clubData } = await supabaseClient
            .from('clubs')
            .select('*')
            .eq('wp_user_id', usuario.id)
            .single();

        // Sesiones del mes
        const { data: sesiones } = await supabaseClient
            .from('training_sessions')
            .select('id, name, session_date')
            .eq('club_id', clubData.id)
            .gte('session_date', inicioMes)
            .lte('session_date', finMes)
            .order('session_date', { ascending: true });
        
        const sesionIds = sesiones ? sesiones.map(s => s.id) : [];
        
        // Asistencias
        const { data: asistencias } = await supabaseClient
            .from('asistencia_sesiones')
            .select('*')
            .eq('jugador_id', jugadorId)
            .in('sesion_id', sesionIds);
        
        // Calcular stats
        const totalSesiones = sesiones ? sesiones.length : 0;
        const asistio = asistencias ? asistencias.filter(a => a.asistio === true).length : 0;
        const faltas = asistencias ? asistencias.filter(a => a.asistio === false).length : 0;
        const sinRegistrar = totalSesiones - asistio - faltas;
        const porcentaje = totalSesiones > 0 ? Math.round((asistio / totalSesiones) * 100) : 0;
        
        // Promedios
        const conPeso = asistencias ? asistencias.filter(a => a.peso) : [];
        const conWellness = asistencias ? asistencias.filter(a => a.wellness) : [];
        const conMuscular = asistencias ? asistencias.filter(a => a.estado_muscular) : [];
        
        const promPeso = conPeso.length > 0 ? (conPeso.reduce((s, a) => s + parseFloat(a.peso), 0) / conPeso.length).toFixed(1) : '-';
        const promWellness = conWellness.length > 0 ? (conWellness.reduce((s, a) => s + a.wellness, 0) / conWellness.length).toFixed(1) : '-';
        const promMuscular = conMuscular.length > 0 ? (conMuscular.reduce((s, a) => s + a.estado_muscular, 0) / conMuscular.length).toFixed(1) : '-';
        
        // Motivos de ausencia
        const motivos = {};
        if (asistencias) {
            asistencias.filter(a => !a.asistio && a.motivo_ausencia).forEach(a => {
                motivos[a.motivo_ausencia] = (motivos[a.motivo_ausencia] || 0) + 1;
            });
        }
        
        // Generar PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const nombreMes = new Date(mes + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        const nombreMesCap = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
        
        // ========== HEADER PREMIUM ==========
        // Fondo degradado header
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 50, 'F');
        
        // Linea decorativa dorada
        doc.setFillColor(251, 191, 36);
        doc.rect(0, 50, 210, 3, 'F');
        
        // Logo del club (si existe)
        if (clubData.logo_url) {
            try {
                doc.addImage(clubData.logo_url, 'PNG', 12, 8, 32, 32);
            } catch(e) {
                doc.setFillColor(251, 191, 36);
                doc.circle(28, 24, 16, 'F');
                doc.setTextColor(15, 23, 42);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text(clubData.name ? clubData.name.charAt(0) : 'C', 28, 28, { align: 'center' });
            }
        } else {
            doc.setFillColor(251, 191, 36);
            doc.circle(28, 24, 16, 'F');
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(clubData.name ? clubData.name.charAt(0) : 'C', 28, 28, { align: 'center' });
        }
        
        // Titulo principal
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORME DE RENDIMIENTO', 115, 18, { align: 'center' });
        
        // Subtitulo
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(203, 213, 225);
        doc.text('Control de Asistencia y Bienestar', 115, 28, { align: 'center' });
        
        // Nombre del club y mes
        doc.setFontSize(10);
        doc.setTextColor(251, 191, 36);
        doc.text(`${clubData.name || 'Mi Club'}  |  ${nombreMesCap}`, 115, 40, { align: 'center' });
        
        let y = 62;
        
        // ========== FICHA DEL JUGADOR ==========
        // Caja del jugador
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(12, y, 186, 38, 3, 3, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(12, y, 186, 38, 3, 3, 'S');
        
        // Foto del jugador (circulo)
        if (jugador.photo_url) {
            try {
                doc.addImage(jugador.photo_url, 'JPEG', 18, y + 4, 30, 30);
            } catch(e) {
                doc.setFillColor(124, 58, 237);
                doc.circle(33, y + 19, 15, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(18);
                doc.setFont('helvetica', 'bold');
                doc.text(jugador.name.charAt(0), 33, y + 24, { align: 'center' });
            }
        } else {
            doc.setFillColor(124, 58, 237);
            doc.circle(33, y + 19, 15, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(jugador.name.charAt(0), 33, y + 24, { align: 'center' });
        }
        
        // Nombre del jugador
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(jugador.name.toUpperCase(), 55, y + 14);
        
        // Datos del jugador
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`Posicion: ${jugador.position || '-'}`, 55, y + 24);
        
        // Porcentaje grande
        const porcColor = porcentaje >= 80 ? [16, 185, 129] : porcentaje >= 50 ? [245, 158, 11] : [239, 68, 68];
        doc.setFillColor(...porcColor);
        doc.roundedRect(155, y + 5, 38, 28, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(`${porcentaje}%`, 174, y + 23, { align: 'center' });
        doc.setFontSize(7);
        doc.text('ASISTENCIA', 174, y + 30, { align: 'center' });
        
        y += 48;
        
        // ========== ESTADISTICAS ==========
        // Titulo seccion
        doc.setFillColor(124, 58, 237);
        doc.roundedRect(12, y, 186, 9, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('RESUMEN DE ASISTENCIA', 105, y + 6.5, { align: 'center' });
        
        y += 14;
        
        // Cajas de estadisticas
        const boxWidth = 58;
        const boxHeight = 28;
        
        // Box Sesiones
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(12, y, boxWidth, boxHeight, 3, 3, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(`${totalSesiones}`, 41, y + 14, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('SESIONES', 41, y + 23, { align: 'center' });
        
        // Box Asistencias
        doc.setFillColor(220, 252, 231);
        doc.roundedRect(76, y, boxWidth, boxHeight, 3, 3, 'F');
        doc.setTextColor(22, 163, 74);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(`${asistio}`, 105, y + 14, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('ASISTENCIAS', 105, y + 23, { align: 'center' });
        
        // Box Ausencias
        doc.setFillColor(254, 226, 226);
        doc.roundedRect(140, y, boxWidth, boxHeight, 3, 3, 'F');
        doc.setTextColor(220, 38, 38);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(`${faltas}`, 169, y + 14, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('AUSENCIAS', 169, y + 23, { align: 'center' });
        
        y += 38;
        
        // ========== BIENESTAR ==========
        doc.setFillColor(59, 130, 246);
        doc.roundedRect(12, y, 186, 9, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('DATOS DE BIENESTAR (Promedios del mes)', 105, y + 6.5, { align: 'center' });
        
        y += 14;
        
        // Cajas de bienestar
        // Peso
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(12, y, boxWidth, boxHeight, 3, 3, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`${promPeso}`, 41, y + 12, { align: 'center' });
        doc.setFontSize(10);
        doc.text('kg', 41, y + 20, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('PESO PROM.', 41, y + 26, { align: 'center' });
        
        // Wellness
        const wellnessNum = promWellness !== '-' ? parseFloat(promWellness) : 0;
        const wellnessColor = wellnessNum >= 7 ? [220, 252, 231] : wellnessNum >= 5 ? [254, 249, 195] : [254, 226, 226];
        doc.setFillColor(...wellnessColor);
        doc.roundedRect(76, y, boxWidth, boxHeight, 3, 3, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`${promWellness}`, 105, y + 12, { align: 'center' });
        doc.setFontSize(10);
        doc.text('/10', 105, y + 20, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('WELLNESS', 105, y + 26, { align: 'center' });
        
        // Estado Muscular
        const muscularNum = promMuscular !== '-' ? parseFloat(promMuscular) : 10;
        const muscularColor = muscularNum <= 4 ? [220, 252, 231] : muscularNum <= 6 ? [254, 249, 195] : [254, 226, 226];
        doc.setFillColor(...muscularColor);
        doc.roundedRect(140, y, boxWidth, boxHeight, 3, 3, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`${promMuscular}`, 169, y + 12, { align: 'center' });
        doc.setFontSize(10);
        doc.text('/10', 169, y + 20, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('MUSCULAR', 169, y + 26, { align: 'center' });
        
        y += 38;
        
        // ========== MOTIVOS DE AUSENCIA ==========
        if (Object.keys(motivos).length > 0) {
            doc.setFillColor(239, 68, 68);
            doc.roundedRect(12, y, 186, 9, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('MOTIVOS DE AUSENCIA', 105, y + 6.5, { align: 'center' });
            
            y += 14;
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            
            let xMotivo = 20;
            for (const [motivo, cantidad] of Object.entries(motivos)) {
                doc.setFillColor(254, 226, 226);
                doc.roundedRect(xMotivo - 3, y - 5, 40, 14, 2, 2, 'F');
                doc.setTextColor(185, 28, 28);
                doc.text(`${motivo}: ${cantidad}`, xMotivo, y + 3);
                xMotivo += 50;
            }
            y += 18;
        }
        
        // ========== HISTORIAL DETALLADO ==========
        doc.setFillColor(71, 85, 105);
        doc.roundedRect(12, y, 186, 9, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('HISTORIAL DETALLADO DEL MES', 105, y + 6.5, { align: 'center' });
        
        y += 14;
        
        // Cabecera tabla
        doc.setFillColor(241, 245, 249);
        doc.rect(12, y, 186, 8, 'F');
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('FECHA', 18, y + 5.5);
        doc.text('SESION', 50, y + 5.5);
        doc.text('ESTADO', 115, y + 5.5);
        doc.text('PESO', 145, y + 5.5);
        doc.text('WELL', 163, y + 5.5);
        doc.text('MUSC', 180, y + 5.5);
        
        y += 10;
        
        let filaColor = false;
        for (const sesion of sesiones || []) {
            if (y > 270) {
                doc.addPage();
                y = 20;
                
                // Header en nueva pagina
                doc.setFillColor(15, 23, 42);
                doc.rect(0, 0, 210, 15, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`${jugador.name} - Historial (continuacion)`, 105, 10, { align: 'center' });
                y = 25;
            }
            
            const asist = asistencias ? asistencias.find(a => a.sesion_id === sesion.id) : null;
            const fechaFormato = new Date(sesion.session_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            
            // Fondo alternado
            if (filaColor) {
                doc.setFillColor(248, 250, 252);
                doc.rect(12, y - 3, 186, 9, 'F');
            }
            filaColor = !filaColor;
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(15, 23, 42);
            doc.text(fechaFormato, 18, y + 3);
            doc.text(sesion.name.substring(0, 30), 50, y + 3);
            
            if (asist) {
                if (asist.asistio) {
                    doc.setTextColor(22, 163, 74);
                    doc.text('Asistio', 115, y + 3);
                    doc.setTextColor(15, 23, 42);
                    doc.text(asist.peso ? `${asist.peso}` : '-', 145, y + 3);
                    doc.text(asist.wellness ? `${asist.wellness}` : '-', 165, y + 3);
                    doc.text(asist.estado_muscular ? `${asist.estado_muscular}` : '-', 182, y + 3);
                } else {
                    doc.setTextColor(220, 38, 38);
                    doc.text(asist.motivo_ausencia || 'Falta', 115, y + 3);
                    doc.setTextColor(156, 163, 175);
                    doc.text('-', 145, y + 3);
                    doc.text('-', 165, y + 3);
                    doc.text('-', 182, y + 3);
                }
            } else {
                doc.setTextColor(156, 163, 175);
                doc.text('Sin registrar', 115, y + 3);
                doc.text('-', 145, y + 3);
                doc.text('-', 165, y + 3);
                doc.text('-', 182, y + 3);
            }
            
            y += 9;
        }
        
        // ========== FOOTER ==========
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 282, 210, 15, 'F');
        doc.setFillColor(251, 191, 36);
        doc.rect(0, 282, 210, 1, 'F');
        
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generado el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`, 15, 290);
        
        doc.setTextColor(251, 191, 36);
        doc.setFont('helvetica', 'bold');
        doc.text('TopLiderCoach HUB', 195, 290, { align: 'right' });
        
        // Guardar
        const nombreArchivo = `Informe_${jugador.name.replace(/\s/g, '_')}_${mes}.pdf`;
        doc.save(nombreArchivo);
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        alert('Error al generar el PDF: ' + error.message);
    }
}
