// ========== MICLUB.JS - TopLiderCoach HUB ==========
// Datos del club, temporadas, plantilla de jugadores

registrarModulo('config', cargarDatosClub);
registrarSubTab('config', 'temporadas', cargarTemporadas);
registrarSubTab('config', 'plantilla', async function() {
    await cargarSelectorTemporadas();
    cargarPlantilla();
});
registrarSubTab('config', 'datos', cargarDatosClub);

        async function cargarDatosClub() {
            if (!clubId) return;
            
            const { data } = await supabaseClient.from('clubs').select('*').eq('id', clubId).single();
            clubData = data;
            
            document.getElementById('club-nombre').value = data.name || '';
            document.getElementById('club-pais').value = data.country || 'Espana';
            document.getElementById('club-formato').value = data.team_format || '11';
            
            if (data.logo_url) {
                document.getElementById('escudo-preview').src = data.logo_url;
                document.getElementById('escudo-preview').style.display = 'block';
                document.getElementById('escudo-placeholder').style.display = 'none';
            }
        }
        
        function previsualizarEscudo(event) {
            const file = event.target.files[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) { alert('Maximo 2MB'); return; }

            // Validar tipo MIME y extensión
            if (!isAllowedMimeType(file)) {
                alert('Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, GIF, WebP, SVG).');
                event.target.value = '';
                return;
            }
            if (!isAllowedFileExtension(file.name)) {
                alert('Extensión de archivo no permitida. Solo se aceptan: jpg, jpeg, png, gif, webp, svg.');
                event.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('escudo-preview').src = e.target.result;
                document.getElementById('escudo-preview').style.display = 'block';
                document.getElementById('escudo-placeholder').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
        
        async function guardarClub() {
            const nombre = document.getElementById('club-nombre').value.trim();
            if (!nombre) { alert('El nombre es obligatorio'); return; }
            
            let logoUrl = clubData?.logo_url;
            const escudoInput = document.getElementById('escudo-input');
            
            if (escudoInput.files.length > 0) {
                const file = escudoInput.files[0];

                // Validación de seguridad en la subida
                if (!isAllowedMimeType(file) || !isAllowedFileExtension(file.name)) {
                    alert('Tipo de archivo no permitido.');
                } else {
                    // Sanitizar extensión: solo usar extensiones conocidas
                    const ext = file.name.split('.').pop().toLowerCase();
                    const safeExt = ['jpg','jpeg','png','gif','webp','svg'].includes(ext) ? ext : 'png';
                    const fileName = `club-${clubId}-${Date.now()}.${safeExt}`;
                    const { error: upErr } = await supabaseClient.storage.from('logos').upload(fileName, file);
                    if (!upErr) {
                        const { data: urlData } = supabaseClient.storage.from('logos').getPublicUrl(fileName);
                        logoUrl = urlData.publicUrl;
                    }
                }
            }
            
            await supabaseClient.from('clubs').update({
                name: nombre,
                country: document.getElementById('club-pais').value,
                team_format: document.getElementById('club-formato').value,
                logo_url: logoUrl
            }).eq('id', clubId);
            
            clubData.name = nombre;
            clubData.logo_url = logoUrl;
            
            // Actualizar header
            document.getElementById('club-nombre-header').textContent = nombre;
            if (logoUrl) {
                document.getElementById('club-badge').innerHTML = `<img src="${sanitizeURL(logoUrl)}" alt=""><span>${escapeHTML(nombre)}</span>`;
            }
            
            alert('Club guardado');
        }
        
        // ========== MI CLUB: TEMPORADAS ==========
        async function cargarTemporadas() {
            const lista = document.getElementById('lista-temporadas');
            lista.innerHTML = '<div class="loading">Cargando...</div>';
            
            const { data } = await supabaseClient.from('seasons').select('*').eq('club_id', clubId).order('start_date', { ascending: false });
            
            if (!data || data.length === 0) {
                lista.innerHTML = '<p style="text-align:center;color:#9ca3af;">No hay temporadas</p>';
                return;
            }
            
            lista.innerHTML = data.map(t => {
                const isActive = t.is_active;
                const fI = t.start_date ? new Date(t.start_date).toLocaleDateString('es-ES') : '';
                const fF = t.end_date ? new Date(t.end_date).toLocaleDateString('es-ES') : '';
                const startVal = t.start_date || '';
                const endVal = t.end_date || '';
                
                return `
                    <div class="temporada-card ${isActive ? 'active' : ''}" id="temp-card-${escapeAttr(t.id)}">
                        <div class="temporada-info" id="temp-view-${escapeAttr(t.id)}">
                            <h4>${escapeHTML(t.name)} ${isActive ? '<span class="temporada-badge">ACTIVA</span>' : ''}</h4>
                            <p>${escapeHTML(fI)} - ${escapeHTML(fF)}</p>
                        </div>
                        <div class="temporada-edit" id="temp-edit-${escapeAttr(t.id)}" style="display:none;flex:1;">
                            <input type="text" id="temp-edit-nombre-${escapeAttr(t.id)}" value="${escapeAttr(t.name)}" style="width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;margin-bottom:6px;font-size:14px;">
                            <div style="display:flex;gap:8px;">
                                <div style="flex:1;"><label style="font-size:11px;color:#6b7280;">Inicio</label><input type="date" id="temp-edit-inicio-${escapeAttr(t.id)}" value="${escapeAttr(startVal)}" style="width:100%;padding:5px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;"></div>
                                <div style="flex:1;"><label style="font-size:11px;color:#6b7280;">Fin</label><input type="date" id="temp-edit-fin-${escapeAttr(t.id)}" value="${escapeAttr(endVal)}" style="width:100%;padding:5px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;"></div>
                            </div>
                            <div style="display:flex;gap:6px;margin-top:8px;">
                                <button onclick="guardarEdicionTemporada('${escapeAttr(t.id)}')" style="padding:5px 14px;background:#059669;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">Guardar</button>
                                <button onclick="cancelarEdicionTemporada('${escapeAttr(t.id)}')" style="padding:5px 14px;background:#e5e7eb;color:#374151;border:none;border-radius:6px;cursor:pointer;font-size:12px;">Cancelar</button>
                            </div>
                        </div>
                        <div class="temporada-actions">
                            <button class="btn-edit-temp" onclick="editarTemporada('${escapeAttr(t.id)}')" title="Editar">✏️</button>
                            <button class="btn-delete-temp" onclick="eliminarTemporada('${escapeAttr(t.id)}', '${escapeAttr(t.name)}', ${isActive})" title="Eliminar">🗑️</button>
                            ${!isActive ? `<button class="btn-activar" onclick="activarTemporada('${escapeAttr(t.id)}')">Activar</button>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        function editarTemporada(tempId) {
            document.getElementById('temp-view-' + tempId).style.display = 'none';
            document.getElementById('temp-edit-' + tempId).style.display = 'block';
        }
        
        function cancelarEdicionTemporada(tempId) {
            document.getElementById('temp-view-' + tempId).style.display = '';
            document.getElementById('temp-edit-' + tempId).style.display = 'none';
        }
        
        async function guardarEdicionTemporada(tempId) {
            const nombre = document.getElementById('temp-edit-nombre-' + tempId).value.trim();
            if (!nombre) { alert('El nombre es obligatorio'); return; }
            
            const { error } = await supabaseClient.from('seasons').update({
                name: nombre,
                start_date: document.getElementById('temp-edit-inicio-' + tempId).value || null,
                end_date: document.getElementById('temp-edit-fin-' + tempId).value || null
            }).eq('id', tempId);
            
            if (error) { alert('Error: ' + error.message); return; }
            
            cargarTemporadas();
            cargarSelectorTemporadas();
        }
        
        async function eliminarTemporada(tempId, nombre, isActive) {
            if (isActive) {
                alert('No se puede eliminar la temporada activa. Activa otra temporada primero.');
                return;
            }
            
            const confirmacion = prompt(`⚠️ ATENCIÓN: Esto eliminará la temporada "${nombre}" y TODOS sus datos asociados (jugadores de plantilla, partidos, estadísticas, sesiones...).\n\nEsta acción es IRREVERSIBLE.\n\nEscribe el nombre de la temporada para confirmar:`);
            
            if (confirmacion === null) return;
            if (confirmacion.trim() !== nombre.trim()) {
                alert('El nombre no coincide. Eliminación cancelada.');
                return;
            }
            
            try {
                // Eliminar season_players de esa temporada
                await supabaseClient.from('season_players').delete().eq('season_id', tempId);
                // Eliminar stats de partidos de esa temporada
                const { data: matches } = await supabaseClient.from('matches').select('id').eq('season_id', tempId);
                if (matches && matches.length > 0) {
                    const matchIds = matches.map(m => m.id);
                    await supabaseClient.from('match_player_stats').delete().in('match_id', matchIds);
                }
                // Eliminar partidos
                await supabaseClient.from('matches').delete().eq('season_id', tempId);
                // Eliminar sesiones de entrenamiento
                await supabaseClient.from('training_sessions').delete().eq('season_id', tempId);
                // Eliminar la temporada
                await supabaseClient.from('seasons').delete().eq('id', tempId);
                
                alert('Temporada eliminada correctamente.');
                cargarTemporadas();
                cargarSelectorTemporadas();
            } catch (err) {
                alert('Error al eliminar: ' + err.message);
            }
        }

        async function crearTemporada() {
            const nombre = document.getElementById('nueva-temp-nombre').value.trim();
            if (!nombre) { alert('El nombre es obligatorio'); return; }
            
            await supabaseClient.from('seasons').insert({
                club_id: clubId,
                name: nombre,
                start_date: document.getElementById('nueva-temp-inicio').value || null,
                end_date: document.getElementById('nueva-temp-fin').value || null,
                is_active: false
            });
            
            document.getElementById('nueva-temp-nombre').value = '';
            document.getElementById('nueva-temp-inicio').value = '';
            document.getElementById('nueva-temp-fin').value = '';
            
            alert('Temporada creada');
            cargarTemporadas();
        }
        
        async function activarTemporada(tempId) {
            if (!confirm('Activar esta temporada?')) return;
            
            await supabaseClient.from('seasons').update({ is_active: false }).eq('club_id', clubId);
            await supabaseClient.from('seasons').update({ is_active: true }).eq('id', tempId);
            
            seasonId = tempId;
            alert('Temporada activada');
            cargarTemporadas();
        }
        
        // ========== MI CLUB: PLANTILLA ==========
        async function cargarSelectorTemporadas() {
            const select = document.getElementById('plantilla-temporada');
            const { data } = await supabaseClient.from('seasons').select('*').eq('club_id', clubId).order('start_date', { ascending: false });
            
            select.innerHTML = (data || []).map(t => {
                const selected = t.is_active ? 'selected' : '';
                return `<option value="${escapeAttr(t.id)}" ${selected}>${escapeHTML(t.name)} ${t.is_active ? '(activa)' : ''}</option>`;
            }).join('');
        }
        
     async function cargarPlantilla() {
            const tempId = document.getElementById('plantilla-temporada').value;
            if (!tempId) return;
            
            const lista = document.getElementById('lista-jugadores');
            lista.innerHTML = '<div class="loading">Cargando...</div>';
            
            try {
                const { data, error } = await supabaseClient
                    .from('season_players')
                    .select('id, player_id, shirt_number, players(id, name, status, position, photo_url, birth_date, height_cm, weight_kg, dominant_foot)')
                    .eq('season_id', tempId)
                    .order('shirt_number');
                
                if (error) throw error;
                
                // Cargar estadísticas de todos los jugadores de la temporada
                const playerIds = (data || []).map(sp => sp.player_id).filter(Boolean);
                let statsMap = {};
                if (playerIds.length > 0) {
                    const { data: allStats } = await supabaseClient
                        .from('match_player_stats')
                        .select('player_id, minutes_played, goals, assists, yellow_cards, red_cards, matches!inner(season_id)')
                        .in('player_id', playerIds)
                        .eq('matches.season_id', tempId);
                    
                    (allStats || []).forEach(s => {
                        if (!statsMap[s.player_id]) statsMap[s.player_id] = { pj:0, min:0, g:0, a:0, ta:0, tr:0 };
                        if (s.minutes_played > 0) statsMap[s.player_id].pj++;
                        statsMap[s.player_id].min += s.minutes_played || 0;
                        statsMap[s.player_id].g += s.goals || 0;
                        statsMap[s.player_id].a += s.assists || 0;
                        statsMap[s.player_id].ta += s.yellow_cards || 0;
                        statsMap[s.player_id].tr += s.red_cards || 0;
                    });
                }
                
                const count = (data || []).length;
                
                const contador = document.getElementById('plantilla-contador');
                contador.textContent = `${count} / 30 jugadores`;
                contador.className = 'plantilla-contador';
                if (count >= 25) contador.classList.add('warning');
                if (count >= 30) contador.classList.add('full');
                
                function posColor(pos) {
                    if (!pos) return '#6b7280';
                    const p = pos.toLowerCase();
                    if (p.includes('porter')) return '#f59e0b';
                    if (p.includes('lateral') || p.includes('central') || p.includes('defens') || p.includes('libre')) return '#3b82f6';
                    if (p.includes('extrem') || p.includes('delanter') || p.includes('punta') || p.includes('mediapunta')) return '#ef4444';
                    if (p.includes('medio') || p.includes('centro') || p.includes('pivote') || p.includes('interior')) return '#22c55e';
                    return '#6b7280';
                }
                
                function posAbrev(pos) {
                    if (!pos) return '—';
                    const p = pos.toLowerCase();
                    if (p.includes('porter')) return 'POR';
                    if (p.includes('lateral derecho')) return 'LD';
                    if (p.includes('lateral izquierdo')) return 'LI';
                    if (p.includes('central')) return 'DFC';
                    if (p.includes('defens')) return 'DEF';
                    if (p.includes('mediocentro') || p.includes('medio centro')) return 'MC';
                    if (p.includes('mediapunta')) return 'MP';
                    if (p.includes('pivote')) return 'PIV';
                    if (p.includes('interior')) return 'INT';
                    if (p.includes('extremo derecho')) return 'ED';
                    if (p.includes('extremo izquierdo')) return 'EI';
                    if (p.includes('delantero centro')) return 'DC';
                    if (p.includes('delanter')) return 'DEL';
                    return pos.substring(0, 3).toUpperCase();
                }
                
                function calcEdad(bd) {
                    if (!bd) return null;
                    const hoy = new Date();
                    const nac = new Date(bd);
                    let edad = hoy.getFullYear() - nac.getFullYear();
                    const m = hoy.getMonth() - nac.getMonth();
                    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
                    return edad;
                }
                
                let html = (data || []).map(sp => {
                    const j = sp.players || {};
                    const st = statsMap[sp.player_id] || { pj:0, min:0, g:0, a:0, ta:0, tr:0 };
                    const statusClass = j.status || 'available';
                    const statusIcon = { available: '●', injured: '🏥', suspended: '⛔' }[statusClass] || '●';
                    const statusText = { available: 'OK', injured: 'Lesión', suspended: 'Sanc.' }[statusClass] || 'OK';
                    const inicial = j.name ? j.name.charAt(0).toUpperCase() : '?';
                    const col = posColor(j.position);
                    const posAb = posAbrev(j.position);
                    const edad = calcEdad(j.birth_date);
                    const pie = j.dominant_foot ? (j.dominant_foot === 'Derecho' || j.dominant_foot === 'Right' ? 'D' : j.dominant_foot === 'Izquierdo' || j.dominant_foot === 'Left' ? 'I' : 'A') : '';
                    const altura = j.height_cm ? j.height_cm + 'cm' : '';
                    const apellido = j.name ? j.name.split(' ').pop().toUpperCase() : 'SIN NOMBRE';
                    const nombre = j.name ? j.name.split(' ').slice(0, -1).join(' ') : '';

return `
    <div class="pcard" onclick="abrirFichaJugador('${escapeAttr(j.id)}')" style="--pos-color:${escapeAttr(col)};">
        <div class="pcard-top">
            <div class="pcard-dorsal">${escapeHTML(sp.shirt_number || '-')}</div>
            <div class="pcard-pos-badge">${escapeHTML(posAb)}</div>
            <div class="pcard-status pcard-st-${escapeAttr(statusClass)}" title="${escapeAttr(statusText)}">${statusIcon}</div>
        </div>
        <div class="pcard-foto">
            ${j.photo_url
                ? `<img src="${sanitizeURL(j.photo_url)}" alt="${escapeAttr(j.name)}">`
                : `<div class="pcard-nofoto">${escapeHTML(inicial)}</div>`
            }
        </div>
        <div class="pcard-name-bar">
            <div class="pcard-apellido">${escapeHTML(apellido)}</div>
            ${nombre ? `<div class="pcard-nombre-small">${escapeHTML(nombre)}</div>` : ''}
        </div>
        <div class="pcard-meta">
            ${edad ? `<span>${parseInt(edad)||0} años</span>` : ''}
            ${altura ? `<span>${escapeHTML(altura)}</span>` : ''}
            ${pie ? `<span>Pie ${escapeHTML(pie)}</span>` : ''}
        </div>
        <div class="pcard-stats">
            <div class="pcard-stat"><span class="pcard-stat-val">${parseInt(st.pj)||0}</span><span class="pcard-stat-lbl">PJ</span></div>
            <div class="pcard-stat"><span class="pcard-stat-val">${parseInt(st.min)||0}</span><span class="pcard-stat-lbl">MIN</span></div>
            <div class="pcard-stat"><span class="pcard-stat-val">${parseInt(st.g)||0}</span><span class="pcard-stat-lbl">GOL</span></div>
            <div class="pcard-stat"><span class="pcard-stat-val">${parseInt(st.a)||0}</span><span class="pcard-stat-lbl">ASI</span></div>
            <div class="pcard-stat pcard-stat-ta"><span class="pcard-stat-val">${parseInt(st.ta)||0}</span><span class="pcard-stat-lbl">TA</span></div>
        </div>
        <div class="pcard-actions">
            <button class="pcard-btn-edit" onclick="event.stopPropagation();editarJugador('${escapeAttr(j.id)}', '${escapeAttr(sp.id)}')">✏️</button>
            <button class="pcard-btn-del" onclick="event.stopPropagation();eliminarJugadorDePlantilla('${escapeAttr(sp.id)}')">🗑️</button>
        </div>
    </div>
`;
                }).join('');
                
                if (count < 30) {
                    html += `<div class="add-jugador-card" onclick="abrirModalJugador()"><div class="icon">+</div><span>Añadir Jugador</span></div>`;
                }
                
                lista.innerHTML = html;
                
            } catch (err) {
                console.error('Error cargando plantilla:', err);
                lista.innerHTML = '<p style="color:red;">Error al cargar jugadores</p>';
            }
        }
        
        function abrirModalJugador() {
            jugadorEditando = null;
            document.getElementById('modal-jugador-titulo').textContent = 'Nuevo Jugador';
            
            document.getElementById('jugador-id').value = '';
            document.getElementById('jugador-sp-id').value = '';
            document.getElementById('jugador-nombre').value = '';
            document.getElementById('jugador-dorsal').value = '';
            document.getElementById('jugador-posicion').value = '';
            document.getElementById('jugador-nacimiento').value = '';
            document.getElementById('jugador-pie').value = 'Derecho';
            document.getElementById('jugador-altura').value = '';
            document.getElementById('jugador-peso').value = '';
            document.getElementById('jugador-telefono').value = '';
            document.getElementById('jugador-email').value = '';
            document.getElementById('jugador-estado').value = 'available';
            
            document.getElementById('jugador-foto-preview').style.display = 'none';
            document.getElementById('jugador-foto-placeholder').style.display = 'flex';
            
            document.getElementById('modal-jugador').style.display = 'flex';
        }
        
        async function editarJugador(playerId, spId) {
            jugadorEditando = { playerId, spId };
            document.getElementById('modal-jugador-titulo').textContent = 'Editar Jugador';
            
            const { data: player } = await supabaseClient.from('players').select('*').eq('id', playerId).single();
            const { data: sp } = await supabaseClient.from('season_players').select('shirt_number').eq('id', spId).single();
            
            document.getElementById('jugador-id').value = playerId;
            document.getElementById('jugador-sp-id').value = spId;
            document.getElementById('jugador-nombre').value = player.name || '';
            document.getElementById('jugador-dorsal').value = sp?.shirt_number || '';
            document.getElementById('jugador-posicion').value = player.position || '';
            document.getElementById('jugador-nacimiento').value = player.birth_date || '';
            document.getElementById('jugador-pie').value = player.dominant_foot || 'Derecho';
            document.getElementById('jugador-altura').value = player.height_cm || '';
            document.getElementById('jugador-peso').value = player.weight_kg || '';
            document.getElementById('jugador-telefono').value = player.phone || '';
            document.getElementById('jugador-email').value = player.email || '';
            document.getElementById('jugador-estado').value = player.status || 'available';
            
            if (player.photo_url) {
                document.getElementById('jugador-foto-preview').src = player.photo_url;
                document.getElementById('jugador-foto-preview').style.display = 'block';
                document.getElementById('jugador-foto-placeholder').style.display = 'none';
            } else {
                document.getElementById('jugador-foto-preview').style.display = 'none';
                document.getElementById('jugador-foto-placeholder').style.display = 'flex';
            }
            
            document.getElementById('modal-jugador').style.display = 'flex';
        }
        
        function cerrarModalJugador(event) {
            if (event && event.target !== event.currentTarget) return;
            document.getElementById('modal-jugador').style.display = 'none';
            jugadorEditando = null;
        }
        // ========== ESCUDO RIVAL EN MODAL PARTIDO ==========

        function previsualizarFotoJugador(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('jugador-foto-preview').src = e.target.result;
                document.getElementById('jugador-foto-preview').style.display = 'block';
                document.getElementById('jugador-foto-placeholder').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
        
        async function guardarJugador() {
            const nombre = document.getElementById('jugador-nombre').value.trim();
            const dorsal = document.getElementById('jugador-dorsal').value;
            const posicion = document.getElementById('jugador-posicion').value;
            
            if (!nombre || !dorsal || !posicion) {
                alert('Nombre, dorsal y posicion son obligatorios');
                return;
            }
            
            const tempId = document.getElementById('plantilla-temporada').value;
            
            let photoUrl = null;
            const fotoInput = document.getElementById('jugador-foto-input');
            if (fotoInput.files.length > 0) {
                const file = fotoInput.files[0];
                const fileName = `player-${Date.now()}.${file.name.split('.').pop()}`;
                const { error: upErr } = await supabaseClient.storage.from('photos').upload(fileName, file);
                if (!upErr) {
                    const { data: urlData } = supabaseClient.storage.from('photos').getPublicUrl(fileName);
                    photoUrl = urlData.publicUrl;
                }
            }
            
            const playerData = {
                club_id: clubId,
                name: nombre,
                position: posicion,
                birth_date: document.getElementById('jugador-nacimiento').value || null,
                dominant_foot: document.getElementById('jugador-pie').value,
                height_cm: document.getElementById('jugador-altura').value || null,
                weight_kg: document.getElementById('jugador-peso').value || null,
                phone: document.getElementById('jugador-telefono').value,
                email: document.getElementById('jugador-email').value,
                status: document.getElementById('jugador-estado').value
            };
            
            if (photoUrl) playerData.photo_url = photoUrl;
            
            if (jugadorEditando) {
                await supabaseClient.from('players').update(playerData).eq('id', jugadorEditando.playerId);
                await supabaseClient.from('season_players').update({ shirt_number: parseInt(dorsal) }).eq('id', jugadorEditando.spId);
            } else {
                const { data: newPlayer } = await supabaseClient.from('players').insert(playerData).select().single();
                await supabaseClient.from('season_players').insert({
                    season_id: tempId,
                    player_id: newPlayer.id,
                    shirt_number: parseInt(dorsal)
                });
            }
            
            cerrarModalJugador();
            cargarPlantilla();
            alert('Jugador guardado');
        }
        
        async function eliminarJugadorDePlantilla(spId) {
            if (!confirm('Eliminar este jugador de la plantilla?')) return;
            await supabaseClient.from('season_players').delete().eq('id', spId);
            cargarPlantilla();
        }
        // ========== VIDEO DEL PARTIDO ==========
// Añadir estas funciones en la sección de JavaScript

// Detectar plataforma del video