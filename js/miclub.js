// ========== MICLUB.JS - TopLiderCoach HUB ==========
// Datos del club, temporadas, plantilla de jugadores

registrarModulo('config', cargarDatosClub);
registrarSubTab('config', 'temporadas', cargarTemporadas);
registrarSubTab('config', 'plantilla', function() {
    cargarSelectorTemporadas();
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
                const fileName = `club-${clubId}-${Date.now()}.${file.name.split('.').pop()}`;
                const { error: upErr } = await supabaseClient.storage.from('logos').upload(fileName, file);
                if (!upErr) {
                    const { data: urlData } = supabaseClient.storage.from('logos').getPublicUrl(fileName);
                    logoUrl = urlData.publicUrl;
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
                document.getElementById('club-badge').innerHTML = `<img src="${logoUrl}" alt=""><span>${nombre}</span>`;
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
                
                return `
                    <div class="temporada-card ${isActive ? 'active' : ''}">
                        <div class="temporada-info">
                            <h4>${t.name} ${isActive ? '<span class="temporada-badge">ACTIVA</span>' : ''}</h4>
                            <p>${fI} - ${fF}</p>
                        </div>
                        <div class="temporada-actions">
                            ${!isActive ? `<button class="btn-activar" onclick="activarTemporada('${t.id}')">Activar</button>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
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
                return `<option value="${t.id}" ${selected}>${t.name} ${t.is_active ? '(activa)' : ''}</option>`;
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
                    .select('id, player_id, shirt_number, players(id, name, status, position, photo_url)')
                    .eq('season_id', tempId)
                    .order('shirt_number');
                
                if (error) throw error;
                
                const count = (data || []).length;
                
                const contador = document.getElementById('plantilla-contador');
                contador.textContent = `${count} / 30 jugadores`;
                contador.className = 'plantilla-contador';
                if (count >= 25) contador.classList.add('warning');
                if (count >= 30) contador.classList.add('full');
                
                let html = (data || []).map(sp => {
                    const j = sp.players || {};
                    const statusClass = j.status || 'available';
                    const statusText = { available: 'Disponible', injured: 'Lesionado', suspended: 'Sancionado' }[statusClass] || 'Disponible';
                    const inicial = j.name ? j.name.charAt(0).toUpperCase() : '?';

return `
    <div class="jugador-card">
        <div class="jugador-foto">
            ${j.photo_url 
                ? `<img src="${j.photo_url}" alt="${j.name}">` 
                : `<span>${inicial}</span>`
            }
        </div>
                            <div class="jugador-info">
                                <h4>${j.name || 'Sin nombre'}</h4>
                                <p>${j.position || ''}</p>
                                <span class="jugador-status ${statusClass}">${statusText}</span>
                            </div>
                            <div class="jugador-dorsal">${sp.shirt_number || '-'}</div>
                            <div class="jugador-actions">
                                <button class="btn-edit" onclick="editarJugador('${j.id}', '${sp.id}')">Editar</button>
                                <button class="btn-delete" onclick="eliminarJugadorDePlantilla('${sp.id}')">X</button>
                            </div>
                        </div>
                    `;
                }).join('');
                
                if (count < 30) {
                    html += `<div class="add-jugador-card" onclick="abrirModalJugador()"><div class="icon">+</div><span>Anadir Jugador</span></div>`;
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
