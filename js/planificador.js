// ========== PLANIFICADOR.JS - TopLiderCoach HUB ==========
// Ejercicios, sesiones, PDF sesión, calendario de sesiones

// Registro en el sistema de navegación
registrarInit(function() {
    cargarFiltrosOpciones();
    cargarEjercicios();
    cargarJugadoresSesion();
    renderizarSesion();
});

registrarSubTab('planificador', 'mis-sesiones', cargarMisSesiones);
registrarSubTab('planificador', 'calendario', cargarCalendarioUnificado);

        async function cargarEjercicios(pagina = 1) {
            paginaEjercicios = pagina;
            const lista = document.getElementById('lista-ejercicios');
            lista.innerHTML = '<div class="loading">Cargando...</div>';
            
            try {
                // Construir URL con filtros
                let url = `${API_BASE}/ejercicios?page=${pagina}&per_page=10`;
                
                const buscar = document.getElementById('filtro-buscar')?.value;
                const entrenador = document.getElementById('filtro-entrenador')?.value;
                const equipo = document.getElementById('filtro-equipo')?.value;
                const tema = document.getElementById('filtro-tema')?.value;
                const dificultad = document.getElementById('filtro-dificultad')?.value;
                
                if (buscar) url += `&search=${encodeURIComponent(buscar)}`;
                if (entrenador) url += `&entrenador=${encodeURIComponent(entrenador)}`;
                if (equipo) url += `&equipo=${encodeURIComponent(equipo)}`;
                if (tema) url += `&tema=${encodeURIComponent(tema)}`;
                if (dificultad) url += `&dificultad=${dificultad}`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                if (!data.ejercicios || data.ejercicios.length === 0) {
                    lista.innerHTML = '<p style="text-align:center;color:#9ca3af;">No hay ejercicios</p>';
                    return;
                }
                
                lista.innerHTML = data.ejercicios.map(ej => {
                    const ejercicioData = {
                        id: ej.id,
                        titulo: ej.titulo,
                        imagen: ej.imagen,
                        duracion: ej.duracion || 10
                    };
                    
                    return `
                    <div class="ejercicio-card" onclick="seleccionarEjercicio(${ej.id})">
                        <img src="${ej.imagen || 'https://via.placeholder.com/80x60?text=Sin+img'}" alt="">
                        <div class="info">
                            <div class="titulo">${ej.titulo}</div>
                            <div class="tags">
                                ${ej.tema ? `<span class="tag">${ej.tema}</span>` : ''}
                                ${ej.dificultad ? `<span class="tag dificultad">Dif: ${ej.dificultad}</span>` : ''}
                            </div>
                        </div>
                        <button class="btn-agregar" 
                                data-ejercicio='${JSON.stringify(ejercicioData).replace(/'/g, "&#39;")}'
                                onclick="event.stopPropagation(); agregarEjercicioDesdeBoton(this)">
                            + Anadir
                        </button>
                    </div>
                `}).join('');
                
                // Paginación
                const pag = document.getElementById('paginacion-ejercicios');
                pag.innerHTML = `
                    <button class="btn-secondary" onclick="cargarEjercicios(${pagina - 1})" ${pagina <= 1 ? 'disabled' : ''}>Anterior</button>
                    <span style="margin: 0 15px;">Pagina ${pagina}</span>
                    <button class="btn-secondary" onclick="cargarEjercicios(${pagina + 1})" ${data.ejercicios.length < 10 ? 'disabled' : ''}>Siguiente</button>
                `;
                
            } catch (error) {
                lista.innerHTML = '<p style="color:red;">Error al cargar</p>';
            }
        }
        let jugadoresPlantilla = [];
        let jugadoresSeleccionados = [];
        
        async function cargarJugadoresSesion() {
            const grid = document.getElementById('jugadores-sesion-grid');
            
            if (!seasonId) {
                grid.innerHTML = '<p style="color:#9ca3af;font-size:12px;grid-column:1/-1;text-align:center;">No hay temporada activa</p>';
                return;
            }
            
            try {
               const { data: jugadores, error } = await supabaseClient
                    .from('season_players')
                    .select('id, player_id, shirt_number, players(id, name, photo_url)')
                    .eq('season_id', seasonId)
                    .order('shirt_number');
                
                if (error) throw error;
                
                jugadoresPlantilla = jugadores || [];
                jugadoresSeleccionados = [];
                
                if (jugadoresPlantilla.length === 0) {
                    grid.innerHTML = '<p style="color:#9ca3af;font-size:12px;grid-column:1/-1;text-align:center;">No hay jugadores en la plantilla</p>';
                    return;
                }
                
                renderizarJugadoresSesion();
                
            } catch (error) {
                console.error('Error cargando jugadores:', error);
                grid.innerHTML = '<p style="color:red;font-size:12px;grid-column:1/-1;text-align:center;">Error al cargar</p>';
            }
        }
        
      function renderizarJugadoresSesion() {
            const grid = document.getElementById('jugadores-sesion-grid');
            
            grid.innerHTML = jugadoresPlantilla.map(sp => {
                const jugador = sp.players;
                const seleccionado = jugadoresSeleccionados.some(id => String(id) === String(sp.id));
                const foto = jugador?.photo_url;
                const inicial = jugador?.name ? jugador.name.charAt(0).toUpperCase() : '?';
                return `
                    <div class="jugador-check ${seleccionado ? 'selected' : ''}" data-id="${sp.id}">
                        <div class="jugador-foto-mini">
                            ${foto ? `<img src="${foto}" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">` 
                                   : `<span class="jugador-inicial" style="width:36px;height:36px;border-radius:50%;background:#6b21a8;color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;">${inicial}</span>`}
                        </div>
                        <span class="dorsal">${sp.shirt_number || '?'}</span>
                        <span class="nombre">${jugador?.name || 'Sin nombre'}</span>
                    </div>
                `;
            }).join('');
            
            // Añadir eventos de clic
            grid.querySelectorAll('.jugador-check').forEach(el => {
                el.addEventListener('click', function() {
                    const spId = this.dataset.id;
                    toggleJugadorSesion(spId);
                });
            });
            
            actualizarContadorJugadores();
        }
        
      function toggleJugadorSesion(spId) {
            const idx = jugadoresSeleccionados.findIndex(id => String(id) === String(spId));
            if (idx > -1) {
                jugadoresSeleccionados.splice(idx, 1);
            } else {
                jugadoresSeleccionados.push(spId);
            }
            renderizarJugadoresSesion();
        }
        
        function toggleTodosJugadores() {
            if (jugadoresSeleccionados.length === jugadoresPlantilla.length) {
                jugadoresSeleccionados = [];
            } else {
                jugadoresSeleccionados = jugadoresPlantilla.map(sp => sp.id);
            }
            renderizarJugadoresSesion();
        }
        
        function actualizarContadorJugadores() {
            document.getElementById('contador-jugadores').textContent = `${jugadoresSeleccionados.length} seleccionados`;
        }
        
        function obtenerJugadoresParaGuardar() {
            return jugadoresPlantilla
                .filter(sp => jugadoresSeleccionados.includes(sp.id))
                .map(sp => ({
                    id: sp.id,
                    player_id: sp.player_id,
                    name: sp.players?.name || '',
                    shirt_number: sp.shirt_number,
                    position: sp.position
                }));
        }
      function toggleInfoSesion() {
            const info = document.getElementById('sesion-info-grid');
            const toggle = document.querySelector('.info-sesion-toggle');
            info.classList.toggle('collapsed');
            toggle.classList.toggle('collapsed');
        }
        function toggleFiltros() {
            const filtros = document.getElementById('filtros-biblioteca');
            const toggle = document.getElementById('filtros-toggle');
            filtros.classList.toggle('collapsed');
            toggle.classList.toggle('collapsed');
        }
        function limpiarFiltros() {
            document.getElementById('filtro-buscar').value = '';
            document.getElementById('filtro-entrenador').value = '';
            document.getElementById('filtro-equipo').value = '';
            document.getElementById('filtro-tema').value = '';
            document.getElementById('filtro-dificultad').value = '';
            cargarEjercicios(1);
        }
        
    async function cargarFiltrosOpciones() {
            try {
                const response = await fetch(`${API_BASE}/filtros`);
                const data = await response.json();
                
                if (data.success && data.filtros) {
                    if (data.filtros.entrenadores) {
                        const select = document.getElementById('filtro-entrenador');
                        data.filtros.entrenadores.forEach(e => {
                            select.innerHTML += `<option value="${e}">${e.replace(/_/g, ' ')}</option>`;
                        });
                    }
                    
                    if (data.filtros.equipos) {
                        const select = document.getElementById('filtro-equipo');
                        data.filtros.equipos.forEach(e => {
                            select.innerHTML += `<option value="${e}">${e.replace(/_/g, ' ')}</option>`;
                        });
                    }
                    
                    if (data.filtros.temas) {
                        const select = document.getElementById('filtro-tema');
                        data.filtros.temas.forEach(t => {
                            select.innerHTML += `<option value="${t}">${t}</option>`;
                        });
                    }
                }
            } catch (error) {
                console.error('Error cargando filtros:', error);
            }
        }
        
        function seleccionarEjercicio(ejercicioId) {
            const detalle = document.getElementById('detalle-ejercicio');
            detalle.innerHTML = '<div class="loading">Cargando detalles...</div>';
            
            fetch(`${API_BASE}/ejercicio/${ejercicioId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const ej = data.ejercicio;
                        ejercicioSeleccionado = ej;
                        
                        detalle.className = 'detalle-ejercicio active';
                        detalle.innerHTML = `
                            <img src="${ej.imagen || 'https://via.placeholder.com/400x300?text=Sin+imagen'}" alt="${ej.titulo}">
                            <h3>${ej.titulo}</h3>
                            <div class="meta" style="font-size:13px;color:#666;line-height:1.8;margin-bottom:10px;">
                                ${ej.entrenador ? `<strong>Entrenador:</strong> ${ej.entrenador.replace(/_/g, ' ')}<br>` : ''}
                                ${ej.equipo ? `<strong>Equipo:</strong> ${ej.equipo.replace(/_/g, ' ')}<br>` : ''}
                                ${ej.tema ? `<strong>Tema:</strong> ${ej.tema}<br>` : ''}
                                ${ej.dificultad ? `<strong>Dificultad:</strong> ${ej.dificultad}<br>` : ''}
                                <strong>Duracion:</strong> ${ej.duracion || 10} min
                            </div>
                            ${ej.objetivo ? `
                                <div class="detalle-seccion">
                                    <h4>Objetivo</h4>
                                    <p>${ej.objetivo}</p>
                                </div>
                            ` : ''}
                            ${ej.organizacion ? `
                                <div class="detalle-seccion">
                                    <h4>Organizacion y Desarrollo</h4>
                                    <p>${ej.organizacion}</p>
                                </div>
                            ` : ''}
                            ${ej.url ? `<a href="${ej.url}" target="_blank" class="btn-ver-completo">Ver ejercicio completo</a>` : ''}
                            <button class="btn-primary purple" style="width:100%;margin-top:10px;" onclick="abrirModalSeccion()">Anadir a Sesion</button>
                        `;
                    } else {
                        detalle.innerHTML = '<p style="color:red;">Error al cargar el ejercicio</p>';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    detalle.innerHTML = '<p style="color:red;">Error de conexion</p>';
                });
        }
        
        function abrirModalSeccion() {
            if (!ejercicioSeleccionado) return;
            document.getElementById('modal-seccion').style.display = 'flex';
        }
        
        function cerrarModalSeccion(event) {
            if (event && event.target !== event.currentTarget) return;
            document.getElementById('modal-seccion').style.display = 'none';
        }
        
    function seleccionarSeccion(seccion) {
            if (!ejercicioSeleccionado) return;
            
            // Funcion para limpiar HTML
            function limpiarHTML(html) {
                if (!html) return '';
                const temp = document.createElement('div');
                temp.innerHTML = html;
                return temp.textContent || temp.innerText || '';
            }
            
            const ejercicioParaSesion = {
                id: ejercicioSeleccionado.id,
                titulo: ejercicioSeleccionado.titulo,
                duracion: parseInt(document.getElementById('ejercicio-duracion-input').value) || 15,
                imagen: ejercicioSeleccionado.imagen || '',
                objetivo: limpiarHTML(ejercicioSeleccionado.objetivo),
                entrenador: ejercicioSeleccionado.entrenador || '',
                equipo: ejercicioSeleccionado.equipo || ''
            };
            
            sesion[seccion].push(ejercicioParaSesion);
            cerrarModalSeccion();
            renderizarSesion();
        }
        
        async function agregarEjercicioDesdeBoton(btn) {
            const ejercicioData = JSON.parse(btn.dataset.ejercicio);
            
            // Cargar detalles completos del ejercicio
            try {
                const response = await fetch(`${API_BASE}/ejercicio/${ejercicioData.id}`);
                const data = await response.json();
                
                if (data.success) {
                    const ej = data.ejercicio;
                    
                    // Funcion para limpiar HTML
                    function limpiarHTML(html) {
                        if (!html) return '';
                        const temp = document.createElement('div');
                        temp.innerHTML = html;
                        return temp.textContent || temp.innerText || '';
                    }
                    
                    ejercicioSeleccionado = {
                        id: ej.id,
                        titulo: ej.titulo,
                        duracion: ej.duracion || 10,
                        imagen: ej.imagen || '',
                        objetivo: limpiarHTML(ej.objetivo),
                        entrenador: ej.entrenador || '',
                        equipo: ej.equipo || ''
                    };
                    
                    abrirModalSeccion();
                }
            } catch (error) {
                console.error('Error cargando ejercicio:', error);
                alert('Error al cargar el ejercicio');
            }
        }
        
        function renderizarSesion() {
            let duracionTotal = 0;
            
            ['calentamiento', 'principal', 'enfriamiento'].forEach(seccion => {
                const lista = document.getElementById(`lista-${seccion}`);
                const tiempo = document.getElementById(`tiempo-${seccion}`);
                
                const totalMin = sesion[seccion].reduce((sum, ej) => sum + (ej.duracion || 0), 0);
                duracionTotal += totalMin;
                tiempo.textContent = `${totalMin} min`;
                
                if (sesion[seccion].length === 0) {
                    lista.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:20px;font-size:13px;">Arrastra ejercicios aqui</p>';
              } else {
                    lista.innerHTML = sesion[seccion].map((ej, idx) => `
                        <div class="ejercicio-en-sesion" onclick="seleccionarEjercicio(${ej.id})" style="cursor: pointer;">
                            <div>
                                <div class="nombre">${ej.titulo}</div>
                                <div class="duracion">${ej.duracion} min</div>
                            </div>
                            <button onclick="event.stopPropagation(); quitarEjercicio('${seccion}', ${idx})">Quitar</button>
                        </div>
                    `).join('');
                }
            });
            
            document.getElementById('duracion-total').textContent = `${duracionTotal} min`;
        }
        function quitarEjercicio(seccion, idx) {
            sesion[seccion].splice(idx, 1);
            renderizarSesion();
        }
        
       function limpiarSesion() {
            sesion = { nombre: '', fecha: new Date().toISOString().split('T')[0], calentamiento: [], principal: [], enfriamiento: [] };
            document.getElementById('sesion-nombre').value = '';
            document.getElementById('sesion-fecha').value = sesion.fecha;
            document.getElementById('sesion-hora').value = '';
            document.getElementById('sesion-microciclo').value = '';
            document.getElementById('sesion-md').value = '';
            document.getElementById('sesion-jugadores').value = '';
            document.getElementById('sesion-equipo').value = '';
            document.getElementById('sesion-objetivo').value = '';
            document.getElementById('sesion-material').value = '';
            document.getElementById('sesion-notas').value = '';
            renderizarSesion();
            jugadoresSeleccionados = [];
            renderizarJugadoresSesion();
        }
        
        async function guardarSesion() {
            const nombre = document.getElementById('sesion-nombre').value.trim();
            const fecha = document.getElementById('sesion-fecha').value;
            const hora = document.getElementById('sesion-hora').value;
            const microciclo = document.getElementById('sesion-microciclo').value.trim();
            const md = document.getElementById('sesion-md').value.trim();
            const jugadores = document.getElementById('sesion-jugadores').value;
            const equipo = document.getElementById('sesion-equipo').value.trim();
            const objetivo = document.getElementById('sesion-objetivo').value.trim();
            const material = document.getElementById('sesion-material').value.trim();
            const notas = document.getElementById('sesion-notas').value.trim();
            
            if (!nombre) {
                alert('El nombre de la sesion es obligatorio');
                return;
            }
            
            if (sesion.calentamiento.length === 0 && sesion.principal.length === 0 && sesion.enfriamiento.length === 0) {
                alert('Anade al menos un ejercicio a la sesion');
                return;
            }
            
            try {
                const { data: sesionCreada, error } = await supabaseClient
    .from('training_sessions')
    .insert({
                        club_id: clubId,
                        season_id: seasonId,
                        name: nombre,
                        session_date: fecha,
                        session_time: hora || null,
                        microciclo: microciclo || null,
                        match_day: md || null,
                        num_players: jugadores ? parseInt(jugadores) : null,
                        team_category: equipo || null,
                        objective: objetivo || null,
                        materials: material || null,
                        notes: notas || null,
                        warm_up: sesion.calentamiento,
                        main_part: sesion.principal,
                        cool_down: sesion.enfriamiento,
                        players: obtenerJugadoresParaGuardar()
                    })
.select('id')
.single();
                
              if (error) throw error;

// Guardar asistencia de jugadores seleccionados
const jugadoresParaAsistencia = obtenerJugadoresParaGuardar();
if (jugadoresParaAsistencia.length > 0 && sesionCreada?.id) {
    const registrosAsistencia = jugadoresParaAsistencia.map(j => ({
        sesion_id: sesionCreada.id,
        jugador_id: j.player_id,
        asistio: true,
        motivo_ausencia: null,
        peso: null,
        wellness: null,
        estado_muscular: null,
        notas: null
    }));
    
    await supabaseClient
        .from('asistencia_sesiones')
        .insert(registrosAsistencia);
}

alert('Sesion guardada correctamente');
                limpiarSesion();
                
            } catch (error) {
                alert('Error al guardar: ' + error.message);
            }
        }
        
        // ========== PLANIFICADOR: MIS SESIONES ==========
        async function cargarMisSesiones() {
            const lista = document.getElementById('lista-mis-sesiones');
            lista.innerHTML = '<div class="loading">Cargando sesiones...</div>';
            
            try {
                const fechaDesde = document.getElementById('filtro-sesion-desde').value;
                const fechaHasta = document.getElementById('filtro-sesion-hasta').value;
                
                let query = supabaseClient
                    .from('training_sessions')
                    .select('*')
                    .eq('club_id', clubId);
                
                if (fechaDesde) query = query.gte('session_date', fechaDesde);
                if (fechaHasta) query = query.lte('session_date', fechaHasta);
                
                query = query.order('session_date', { ascending: false });
                
                const { data, error } = await query;
                
                if (error) throw error;
                
                if (!data || data.length === 0) {
                    lista.innerHTML = '<div class="empty-state"><h3>No hay sesiones guardadas</h3><p>Crea tu primera sesion de entrenamiento</p></div>';
                    return;
                }
                
                lista.innerHTML = data.map(s => {
                    const cal = s.warm_up || [];
                    const pri = s.main_part || [];
                    const enf = s.cool_down || [];
                    
                    const tCal = cal.reduce((sum, ej) => sum + (ej.duracion || 0), 0);
                    const tPri = pri.reduce((sum, ej) => sum + (ej.duracion || 0), 0);
                    const tEnf = enf.reduce((sum, ej) => sum + (ej.duracion || 0), 0);
                    
                    const fecha = new Date(s.session_date).toLocaleDateString('es-ES');
                    
                    return `
                        <div class="sesion-card">
                            <div class="sesion-card-header">
                                <h3>${s.name}</h3>
                                <div class="sesion-card-meta">
                                    <span>Fecha: ${fecha}</span>
                                </div>
                            </div>
                            <div class="sesion-card-resumen">
                                <div class="seccion-resumen calentamiento">
                                    <strong>${cal.length}</strong>
                                    ejercicios<br>${tCal} min
                                </div>
                                <div class="seccion-resumen principal">
                                    <strong>${pri.length}</strong>
                                    ejercicios<br>${tPri} min
                                </div>
                                <div class="seccion-resumen enfriamiento">
                                    <strong>${enf.length}</strong>
                                    ejercicios<br>${tEnf} min
                                </div>
                            </div>
                            <div class="sesion-card-actions">
                                <button class="btn-cargar" onclick="cargarSesionEnEditor('${s.id}')">Cargar</button>
<button class="btn-asistencia" onclick="abrirModalAsistenciaSesion('${s.id}')">Asistencia</button>
<button class="btn-pdf-sesion" onclick="abrirModalPDFSesion('${s.id}')">PDF</button>
<button class="btn-eliminar-sesion" onclick="eliminarSesion('${s.id}')">Eliminar</button>
                            </div>
                        </div>
                    `;
                }).join('');
                
            } catch (error) {
                lista.innerHTML = '<p style="color:red;">Error al cargar</p>';
            }
        }
        
        function limpiarFiltroSesiones() {
            document.getElementById('filtro-sesion-desde').value = '';
            document.getElementById('filtro-sesion-hasta').value = '';
            cargarMisSesiones();
        }
        
        async function cargarSesionEnEditor(id) {
            try {
                const { data } = await supabaseClient
                    .from('training_sessions')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                sesion = {
                    nombre: data.name,
                    fecha: data.session_date,
                    calentamiento: data.warm_up || [],
                    principal: data.main_part || [],
                    enfriamiento: data.cool_down || []
                };
                
                document.getElementById('sesion-nombre').value = data.name;
                document.getElementById('sesion-fecha').value = data.session_date;
                
                renderizarSesion();
                
                // Cambiar a pestaña crear
                document.querySelector('.planificador-subtabs .sub-tab').click();
                
            } catch (error) {
                alert('Error al cargar sesion');
            }
        }
        
        async function eliminarSesion(id) {
            if (!confirm('¿Eliminar esta sesion?')) return;
            
            await supabaseClient.from('training_sessions').delete().eq('id', id);
            cargarMisSesiones();
        }
        let sesionPDFId = null;

function abrirModalPDFSesion(id) {
    sesionPDFId = id;
    document.getElementById('modal-pdf-sesion').style.display = 'flex';
}

function cerrarModalPDFSesion(event) {
    if (!event || event.target.classList.contains('modal-overlay')) {
        document.getElementById('modal-pdf-sesion').style.display = 'none';
    }
}

function descargarPDFSesion(conTitulos) {
    cerrarModalPDFSesion();
    exportarSesionPDF(sesionPDFId, conTitulos);
}
async function exportarSesionPDF(id, conTitulos = true) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const { data: s } = await supabaseClient.from('training_sessions').select('*').eq('id', id).single();
            const { data: club } = await supabaseClient.from('clubs').select('name, logo_url').eq('id', clubId).single();
            
            const fecha = new Date(s.session_date).toLocaleDateString('es-ES');
            const hora = s.session_time ? s.session_time.substring(0, 5) : '';
            
            // Funcion para limpiar texto
            function limpiarTexto(texto) {
                if (!texto) return '';
                return texto
                    .replace(/<[^>]*>/g, '')
                    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
                    .replace(/[\u{2600}-\u{26FF}]/gu, '')
                    .replace(/[\u{2700}-\u{27BF}]/gu, '')
                    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
                    .replace(/[\u{1F000}-\u{1F02F}]/gu, '')
                    .replace(/[^\x00-\x7F\xA0-\xFF\u0100-\u017F]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
            }
            
            // Calcular duracion total
            const duracionTotal = (s.warm_up || []).reduce((sum, e) => sum + (e.duracion || 0), 0) +
                                  (s.main_part || []).reduce((sum, e) => sum + (e.duracion || 0), 0) +
                                  (s.cool_down || []).reduce((sum, e) => sum + (e.duracion || 0), 0);
            
            // ===== HEADER =====
            doc.setFillColor(0, 51, 102);
            doc.rect(0, 0, 210, 28, 'F');
            
            // Escudo del club (si existe)
            let tituloX = 10;
            if (club && club.logo_url) {
                try {
                    doc.addImage(club.logo_url, 'PNG', 8, 3, 22, 22);
                    tituloX = 35;
                } catch (e) {
                    console.log('No se pudo cargar el escudo');
                }
            }
            
            // Titulo sesion
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(s.name.toUpperCase(), tituloX, 10);
            
            // Nombre del club
            if (club && club.name) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text(club.name, tituloX, 16);
            }
            
            // Info en header (fila)
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            
            const headerInfo = [];
            headerInfo.push(`Fecha: ${fecha}`);
            if (hora) headerInfo.push(`Hora: ${hora}`);
            if (s.microciclo) headerInfo.push(`Microciclo: ${s.microciclo}`);
            if (s.match_day) headerInfo.push(`MD: ${s.match_day}`);
            if (s.num_players) headerInfo.push(`Jugadores: ${s.num_players}`);
            if (s.team_category) headerInfo.push(`Equipo: ${s.team_category}`);
            headerInfo.push(`Duracion: ${duracionTotal} min`);
            
            doc.text(headerInfo.join('   |   '), tituloX, 24);
            
            // Linea amarilla decorativa
            doc.setFillColor(255, 204, 0);
            doc.rect(0, 28, 210, 2, 'F');
            
            let y = 35;
            
            // ===== Jugadores aptos para entrenar =====
         // ===== Jugadores aptos para entrenar =====
if (s.players && s.players.length > 0) {
    const nombresJugadores = s.players.map(j => `${j.shirt_number || '?'}.${j.name}`).join('  |  ');
    const jugadoresLines = doc.splitTextToSize(nombresJugadores, 155);
    const alturaBloque = 10 + (jugadoresLines.length * 4);
    
    doc.setFillColor(240, 240, 240);
    doc.rect(10, y, 190, alturaBloque, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('CONVOCADOS:', 12, y + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(7);
    
    jugadoresLines.forEach((linea, idx) => {
        doc.text(linea, 38, y + 5 + (idx * 4));
    });
    
    y += alturaBloque + 4;
}
            
            y += 3;
            
            // ===== OBJETIVO GENERAL =====
            if (s.objective) {
                doc.setFillColor(240, 240, 240);
                doc.rect(10, y - 4, 190, 12, 'F');
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 51, 102);
                doc.text('OBJETIVO:', 12, y + 2);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(50, 50, 50);
                const objText = doc.splitTextToSize(limpiarTexto(s.objective), 150);
                doc.text(objText[0], 35, y + 2);
                y += 14;
            }
            
            // ===== MATERIAL =====
            if (s.materials) {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(100, 100, 100);
                doc.text('Material: ', 10, y);
                doc.setFont('helvetica', 'normal');
                doc.text(limpiarTexto(s.materials), 28, y);
                y += 8;
            }
            
            // ===== SECCIONES =====
            const secciones = [
                { nombre: 'CALENTAMIENTO', datos: s.warm_up || [], color: [255, 153, 0] },
                { nombre: 'PARTE PRINCIPAL', datos: s.main_part || [], color: [0, 102, 204] },
                { nombre: 'PARTE FINAL', datos: s.cool_down || [], color: [0, 153, 76] }
            ];
            
            for (const sec of secciones) {
                if (sec.datos.length > 0) {
                    const tiempoSeccion = sec.datos.reduce((sum, e) => sum + (e.duracion || 0), 0);
                    
                    // Verificar espacio para header de seccion
                    if (y > 260) {
                        doc.addPage();
                        y = 20;
                    }
                    
                    // Header seccion
                    doc.setFillColor(...sec.color);
                    doc.rect(10, y, 190, 8, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.text(sec.nombre, 12, y + 6);
                    doc.text(tiempoSeccion + ' min', 195, y + 6, { align: 'right' });
                    y += 12;
                    
                    // Ejercicios de la seccion
                    for (let i = 0; i < sec.datos.length; i++) {
                        const ej = sec.datos[i];
                        const alturaEjercicio = 45;
                        
                        // Verificar espacio, nueva pagina si necesario
                        if (y + alturaEjercicio > 280) {
                            doc.addPage();
                            y = 20;
                        }
                        
                        // Fila del titulo
                        doc.setFillColor(245, 245, 245);
                        doc.rect(10, y, 190, 7, 'F');
                        doc.setTextColor(0, 0, 0);
                        doc.setFontSize(9);
                        doc.setFont('helvetica', 'bold');
                        doc.text(conTitulos ? `${i + 1}. ${ej.titulo}` : `Ejercicio ${i + 1}`, 12, y + 5);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(100, 100, 100);
                        doc.text(`${ej.duracion} min`, 195, y + 5, { align: 'right' });
                        y += 9;
                        
                        const contenidoY = y;
                        
                        // === COLUMNA 1: IMAGEN (izquierda) ===
                        const imgX = 10;
                        const imgWidth = 55;
                        const imgHeight = 35;
                        
                        if (ej.imagen) {
                            try {
                                doc.addImage(ej.imagen, 'JPEG', imgX, contenidoY, imgWidth, imgHeight);
                            } catch (e) {
                                doc.setDrawColor(200, 200, 200);
                                doc.rect(imgX, contenidoY, imgWidth, imgHeight);
                                doc.setFontSize(7);
                                doc.setTextColor(150, 150, 150);
                                doc.text('Sin imagen', imgX + 18, contenidoY + 18);
                            }
                        } else {
                            doc.setDrawColor(200, 200, 200);
                            doc.rect(imgX, contenidoY, imgWidth, imgHeight);
                            doc.setFontSize(7);
                            doc.setTextColor(150, 150, 150);
                            doc.text('Sin imagen', imgX + 18, contenidoY + 18);
                        }
                        
                        // === COLUMNA 2: DESCRIPCION (centro) ===
                        const descX = 70;
                        const descWidth = 65;
                        
                        doc.setDrawColor(230, 230, 230);
                        doc.rect(descX, contenidoY, descWidth, imgHeight);
                        
                        if (ej.objetivo) {
                            doc.setFontSize(7);
                            doc.setTextColor(60, 60, 60);
                            const objetivoLimpio = limpiarTexto(ej.objetivo);
                            const objetivoLines = doc.splitTextToSize(objetivoLimpio, descWidth - 4);
                            const lineasMostrar = objetivoLines.slice(0, 8);
                            doc.text(lineasMostrar, descX + 2, contenidoY + 4);
                        } else {
                            doc.setFontSize(7);
                            doc.setTextColor(180, 180, 180);
                            doc.text('Sin descripcion', descX + 15, contenidoY + 18);
                        }
                        
                        // === COLUMNA 3: NOTAS ENTRENADOR (derecha) ===
                        const notasX = 140;
                        const notasWidth = 60;
                        
                        doc.setDrawColor(230, 230, 230);
                        doc.rect(notasX, contenidoY, notasWidth, imgHeight);
                        
                        // Titulo "Notas"
                        doc.setFontSize(7);
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(150, 150, 150);
                        doc.text('Notas:', notasX + 2, contenidoY + 4);
                        doc.setFont('helvetica', 'normal');
                        
                        // Lineas para escribir
                        doc.setDrawColor(220, 220, 220);
                        for (let lineY = contenidoY + 10; lineY < contenidoY + imgHeight - 2; lineY += 6) {
                            doc.line(notasX + 2, lineY, notasX + notasWidth - 2, lineY);
                        }
                        
                        y = contenidoY + imgHeight + 5;
                    }
                    
                    y += 5;
                }
            }
            
            // ===== NOTAS GENERALES =====
            if (s.notes) {
                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }
                doc.setFillColor(255, 255, 200);
                const notasLines = doc.splitTextToSize(limpiarTexto(s.notes), 180);
                doc.rect(10, y, 190, 8 + notasLines.length * 4, 'F');
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(100, 80, 0);
                doc.text('NOTAS:', 12, y + 5);
                doc.setFont('helvetica', 'normal');
                doc.text(notasLines, 30, y + 5);
            }
            
            // ===== FOOTER =====
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.text('TopLiderCoach.com', 105, 292, { align: 'center' });
            }
            
            doc.save(`sesion_${s.name.replace(/\s+/g, '_')}.pdf`);
        }
            
          
       
        
        // ========== CALENDARIO UNIFICADO (Sesiones + Partidos) ==========
        
        let calendarioMes = new Date().getMonth();
        let calendarioAnio = new Date().getFullYear();
        
        async function cargarCalendarioUnificado() {
            const mesActualEl = document.getElementById('mes-actual-calendario');
            if (mesActualEl) mesActualEl.textContent = `${MESES[calendarioMes]} ${calendarioAnio}`;
            
            const primerDia = new Date(calendarioAnio, calendarioMes, 1);
            const ultimoDia = new Date(calendarioAnio, calendarioMes + 1, 0);
            
            const inicioMes = `${calendarioAnio}-${String(calendarioMes + 1).padStart(2, '0')}-01`;
            const finMes = `${calendarioAnio}-${String(calendarioMes + 1).padStart(2, '0')}-${ultimoDia.getDate()}`;
            
            // Cargar sesiones del mes
            const { data: sesiones, error: errorSesiones } = await supabaseClient
                .from('training_sessions')
                .select('id, name, session_date, session_time')
                .eq('club_id', clubId)
                .gte('session_date', inicioMes)
                .lte('session_date', finMes)
                .order('session_date');
            
            if (errorSesiones) console.error('Error cargando sesiones:', errorSesiones);
            
            // Cargar partidos del mes
            let queryPartidos = supabaseClient
                .from('matches')
                .select('*')
                .eq('club_id', clubId)
                .gte('match_date', inicioMes)
                .lte('match_date', finMes)
                .order('match_date');
            
            if (seasonId) queryPartidos = queryPartidos.eq('season_id', seasonId);
            
            const { data: partidos } = await queryPartidos;
            
            // Agrupar por día
            const sesionesPorDia = {};
            (sesiones || []).forEach(s => {
                const dia = new Date(s.session_date).getDate();
                if (!sesionesPorDia[dia]) sesionesPorDia[dia] = [];
                sesionesPorDia[dia].push(s);
            });
            
            const partidosPorDia = {};
            (partidos || []).forEach(p => {
                const dia = new Date(p.match_date).getDate();
                if (!partidosPorDia[dia]) partidosPorDia[dia] = [];
                partidosPorDia[dia].push(p);
            });
            
            // Escudo del club
            const miEscudo = clubData?.logo_url || '';
            
            // Generar grid
            const grid = document.getElementById('calendario-unificado');
            let html = '';
            
            // Headers
            ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach(d => {
                html += `<div class="calendario-dia-header">${d}</div>`;
            });
            
            // Días vacíos
            let diaInicio = primerDia.getDay() || 7;
            for (let i = 1; i < diaInicio; i++) {
                html += '<div class="calendario-dia otro-mes"></div>';
            }
            
            // Días del mes
            const hoy = new Date();
            for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
                const esHoy = dia === hoy.getDate() && calendarioMes === hoy.getMonth() && calendarioAnio === hoy.getFullYear();
                const tieneSesion = sesionesPorDia[dia] && sesionesPorDia[dia].length > 0;
                const tienePartido = partidosPorDia[dia] && partidosPorDia[dia].length > 0;
                const esSabado = new Date(calendarioAnio, calendarioMes, dia).getDay() === 6;
                const esDomingo = new Date(calendarioAnio, calendarioMes, dia).getDay() === 0;
                
                let eventosHTML = '';
                
                // Sesiones del día
                if (tieneSesion) {
                    sesionesPorDia[dia].forEach(s => {
                        const hora = s.session_time ? s.session_time.slice(0, 5) : '';
                        eventosHTML += `
                            <div class="cal-evento cal-sesion" onclick="cargarSesionEnEditor('${s.id}')">
                                <span class="cal-evento-nombre">${s.name}</span>
                                ${hora ? `<span class="cal-evento-hora">${hora}</span>` : ''}
                            </div>`;
                    });
                }
                
                // Partidos del día
                if (tienePartido) {
                    partidosPorDia[dia].forEach(p => {
                        const esLocal = p.home_away === 'home';
                        const jugado = !!p.result;
                        const resultClass = jugado ? (p.result === 'win' ? 'victoria' : (p.result === 'draw' ? 'empate' : 'derrota')) : 'pendiente';
                        
                        let info = '';
                        if (jugado) {
                            const gF = p.team_goals || 0;
                            const gC = p.opponent_goals || 0;
                            info = esLocal ? `${gF}-${gC}` : `${gC}-${gF}`;
                        } else {
                            info = p.kick_off_time ? p.kick_off_time.slice(0, 5) : 'TBD';
                        }
                        
                        const escudoRival = p.opponent_logo 
                            ? `<img src="${p.opponent_logo}" class="cal-escudo">` 
                            : '';
                        
                        eventosHTML += `
                            <div class="cal-evento cal-partido ${resultClass}" onclick="verPartido('${p.id}')">
                                ${escudoRival}
                                <span class="cal-evento-nombre">${p.opponent}</span>
                                <span class="cal-partido-resultado">${info}</span>
                            </div>`;
                    });
                }
                
                html += `
                    <div class="calendario-dia ${esHoy ? 'hoy' : ''} ${esSabado || esDomingo ? 'fin-semana' : ''} ${tienePartido ? 'dia-partido' : ''}">
                        <div class="numero">${dia}</div>
                        ${eventosHTML}
                    </div>
                `;
            }
            
            grid.innerHTML = html;
            
            // Resumen del mes
            const resumenEl = document.getElementById('calendario-resumen');
            if (resumenEl) {
                const numSesiones = (sesiones || []).length;
                const numPartidos = (partidos || []).length;
                const victorias = (partidos || []).filter(p => p.result === 'win').length;
                const empates = (partidos || []).filter(p => p.result === 'draw').length;
                const derrotas = (partidos || []).filter(p => p.result === 'loss').length;
                const pendientes = (partidos || []).filter(p => !p.result).length;
                
                resumenEl.innerHTML = `
                    <div class="resumen-item"><span class="resumen-num">${numSesiones}</span><span class="resumen-label">Sesiones</span></div>
                    <div class="resumen-item"><span class="resumen-num">${numPartidos}</span><span class="resumen-label">Partidos</span></div>
                    <div class="resumen-item victoria"><span class="resumen-num">${victorias}</span><span class="resumen-label">Victorias</span></div>
                    <div class="resumen-item empate"><span class="resumen-num">${empates}</span><span class="resumen-label">Empates</span></div>
                    <div class="resumen-item derrota"><span class="resumen-num">${derrotas}</span><span class="resumen-label">Derrotas</span></div>
                    <div class="resumen-item pendiente"><span class="resumen-num">${pendientes}</span><span class="resumen-label">Pendientes</span></div>
                `;
            }
        }
        
        function mesAnteriorCalendario() {
            calendarioMes--;
            if (calendarioMes < 0) { calendarioMes = 11; calendarioAnio--; }
            cargarCalendarioUnificado();
        }
        
        function mesSiguienteCalendario() {
            calendarioMes++;
            if (calendarioMes > 11) { calendarioMes = 0; calendarioAnio++; }
            cargarCalendarioUnificado();
        }
   
