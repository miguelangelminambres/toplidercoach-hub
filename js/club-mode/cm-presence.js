// ============================================================
// CM-PRESENCE.JS · Sistema de presencia online
// TopLiderCoach HUB · Club Mode
// ============================================================
// Muestra quien esta conectado en el club en tiempo real.
// Heartbeat cada 30s. Offline si no hay señal en 2 min.
// ============================================================

var cmPresInterval = null;
var cmPresHeartbeatInterval = null;
var cmPresOpen = false;
var cmPresOnlineCount = 0;
var cmPresUsers = [];

// ========== AUTO-MONTAJE ==========
(function cmPresAutoMontar() {
    var intentos = 0;
    var intervalo = setInterval(function() {
        intentos++;
        if (intentos > 30) { clearInterval(intervalo); return; }
        if (typeof cmState === 'undefined' || !cmState.activo) return;
        if (!clubId || !usuario) return;
        clearInterval(intervalo);

        cmPresCrearUI();
        cmPresHeartbeat();
        cmPresCargar();

        // Heartbeat cada 30 segundos
        cmPresHeartbeatInterval = setInterval(cmPresHeartbeat, 30000);
        // Refrescar lista cada 30 segundos
        cmPresInterval = setInterval(cmPresCargar, 30000);

        console.log('[Presencia] Sistema de presencia montado');
    }, 800);
})();


// ========== HEARTBEAT ==========
async function cmPresHeartbeat() {
    if (!clubId || !usuario) return;

    var nombre = usuario.display_name || usuario.name || usuario.username || 'Usuario';
    var rol = (typeof cmState !== 'undefined' && cmState.rol) ? cmState.rol.name : 'Coach';

    try {
        await supabaseClient.from('cm_presence').upsert({
            club_id: clubId,
            wp_user_id: usuario.id,
            display_name: nombre,
            role_name: rol,
            last_seen: new Date().toISOString(),
            status: 'online'
        }, { onConflict: 'club_id,wp_user_id' });
    } catch (e) {
        console.warn('[Presencia] Error heartbeat:', e);
    }
}


// ========== CREAR UI ==========
function cmPresCrearUI() {
    if (document.getElementById('cm-pres-icon')) return;

    var style = document.createElement('style');
    style.textContent =
        '#cm-pres-icon{position:relative;cursor:pointer;padding:6px 10px;border-radius:8px;transition:background .2s;display:inline-flex;align-items:center;gap:4px}' +
        '#cm-pres-icon:hover{background:rgba(34,197,94,0.15)}' +
        '#cm-pres-count{font-size:13px;font-weight:600;color:#22c55e}' +
        '#cm-pres-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px #22c55e55}' +
        '#cm-pres-panel{position:absolute;top:100%;right:0;width:280px;max-height:400px;background:#0f172a;border:1px solid #334155;border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,0.5);z-index:9999;overflow:hidden;display:none}' +
        '#cm-pres-panel.open{display:block}' +
        '.cm-pres-header{padding:14px 16px;border-bottom:1px solid #1e293b}' +
        '.cm-pres-header h4{margin:0;color:#e2e8f0;font-size:14px}' +
        '.cm-pres-list{overflow-y:auto;max-height:340px;padding:6px 0}' +
        '.cm-pres-user{padding:10px 16px;display:flex;align-items:center;gap:10px}' +
        '.cm-pres-avatar{width:32px;height:32px;border-radius:50%;background:#334155;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#e2e8f0;flex-shrink:0}' +
        '.cm-pres-info{flex:1;min-width:0}' +
        '.cm-pres-name{color:#e2e8f0;font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
        '.cm-pres-role{color:#94a3b8;font-size:11px}' +
        '.cm-pres-status{width:10px;height:10px;border-radius:50%;flex-shrink:0}' +
        '.cm-pres-status.online{background:#22c55e;box-shadow:0 0 6px #22c55e55}' +
        '.cm-pres-status.away{background:#f59e0b;box-shadow:0 0 6px #f59e0b55}' +
        '.cm-pres-status.offline{background:#64748b}' +
        '.cm-pres-empty{padding:30px 20px;text-align:center;color:#64748b;font-size:13px}' +
        '.cm-pres-section{padding:6px 16px 4px;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px}';
    document.head.appendChild(style);

    var presContainer = document.createElement('div');
    presContainer.id = 'cm-pres-icon';
    presContainer.style.cssText = 'position:relative;display:inline-flex;margin-right:4px;';
    presContainer.onclick = function(e) {
        e.stopPropagation();
        cmPresTogglePanel();
    };
    presContainer.innerHTML =
        '<span id="cm-pres-dot"></span>' +
        '<span id="cm-pres-count">0</span>' +
        '<div id="cm-pres-panel">' +
            '<div class="cm-pres-header"><h4>Equipo conectado</h4></div>' +
            '<div class="cm-pres-list" id="cm-pres-list"></div>' +
        '</div>';

    // Insertar antes de la campanita o del boton salir
    var bellIcon = document.getElementById('cm-notif-bell');
    if (bellIcon && bellIcon.parentElement) {
        bellIcon.parentElement.insertBefore(presContainer, bellIcon);
    } else {
        var salirBtn = document.querySelector('button[onclick*="logout"]') ||
                       document.querySelector('.logout-btn') ||
                       document.getElementById('btn-salir');
        if (salirBtn && salirBtn.parentElement) {
            salirBtn.parentElement.insertBefore(presContainer, salirBtn);
        }
    }

    // Cerrar al clic fuera
    document.addEventListener('click', function(e) {
        if (cmPresOpen && !presContainer.contains(e.target)) {
            cmPresCerrarPanel();
        }
    });
}


function cmPresTogglePanel() {
    var panel = document.getElementById('cm-pres-panel');
    if (!panel) return;
    cmPresOpen = !cmPresOpen;
    panel.classList.toggle('open', cmPresOpen);
    if (cmPresOpen) cmPresCargar();
}

function cmPresCerrarPanel() {
    var panel = document.getElementById('cm-pres-panel');
    if (panel) panel.classList.remove('open');
    cmPresOpen = false;
}


// ========== CARGAR USUARIOS ONLINE ==========
async function cmPresCargar() {
    if (!clubId) return;

    try {
        var res = await supabaseClient.from('cm_presence')
            .select('*')
            .eq('club_id', clubId)
            .order('last_seen', { ascending: false });

        var users = res.data || [];
        var ahora = new Date();

        // Clasificar por estado
        var online = [];
        var away = [];

        users.forEach(function(u) {
            var lastSeen = new Date(u.last_seen);
            var diffSeg = Math.floor((ahora - lastSeen) / 1000);

            if (diffSeg < 120) {
                // Online: señal en los ultimos 2 minutos
                u._status = 'online';
                u._diffSeg = diffSeg;
                online.push(u);
            } else if (diffSeg < 600) {
                // Away: señal entre 2 y 10 minutos
                u._status = 'away';
                u._diffSeg = diffSeg;
                away.push(u);
            }
            // Mas de 10 min: no se muestra
        });

        cmPresOnlineCount = online.length;
        cmPresUsers = online.concat(away);

        // Actualizar contador
        var countEl = document.getElementById('cm-pres-count');
        if (countEl) countEl.textContent = online.length;

        // Actualizar punto (verde si hay gente, gris si solo yo)
        var dotEl = document.getElementById('cm-pres-dot');
        if (dotEl) {
            dotEl.style.background = online.length > 1 ? '#22c55e' : '#64748b';
            dotEl.style.boxShadow = online.length > 1 ? '0 0 6px #22c55e55' : 'none';
        }

        // Renderizar lista si esta abierta
        if (cmPresOpen) {
            cmPresRenderLista(online, away);
        }

    } catch (e) {
        console.warn('[Presencia] Error cargando:', e);
    }
}


function cmPresRenderLista(online, away) {
    var list = document.getElementById('cm-pres-list');
    if (!list) return;

    if (online.length === 0 && away.length === 0) {
        list.innerHTML = '<div class="cm-pres-empty">Nadie mas conectado</div>';
        return;
    }

    var html = '';

    if (online.length > 0) {
        html += '<div class="cm-pres-section">En linea (' + online.length + ')</div>';
        online.forEach(function(u) {
            html += cmPresRenderUser(u);
        });
    }

    if (away.length > 0) {
        html += '<div class="cm-pres-section">Ausente (' + away.length + ')</div>';
        away.forEach(function(u) {
            html += cmPresRenderUser(u);
        });
    }

    list.innerHTML = html;
}


function cmPresRenderUser(u) {
    var initials = '';
    var parts = u.display_name.split(' ');
    initials = parts[0] ? parts[0][0] : '';
    if (parts.length > 1) initials += parts[parts.length - 1][0];
    initials = initials.toUpperCase();

    var esYo = usuario && u.wp_user_id === usuario.id;
    var nombreDisplay = u.display_name + (esYo ? ' (tu)' : '');

    return '<div class="cm-pres-user">' +
        '<div class="cm-pres-avatar">' + initials + '</div>' +
        '<div class="cm-pres-info">' +
            '<div class="cm-pres-name">' + nombreDisplay + '</div>' +
            '<div class="cm-pres-role">' + (u.role_name || '') + '</div>' +
        '</div>' +
        '<div class="cm-pres-status ' + u._status + '"></div>' +
    '</div>';
}


// ========== LIMPIAR AL CERRAR ==========
window.addEventListener('beforeunload', function() {
    if (cmPresHeartbeatInterval) clearInterval(cmPresHeartbeatInterval);
    if (cmPresInterval) clearInterval(cmPresInterval);

    // Marcar como offline al salir
    if (clubId && usuario) {
        navigator.sendBeacon && supabaseClient.from('cm_presence')
            .update({ status: 'offline', last_seen: new Date(Date.now() - 600000).toISOString() })
            .eq('club_id', clubId)
            .eq('wp_user_id', usuario.id);
    }
});

console.log('[Presencia] cm-presence.js cargado');
