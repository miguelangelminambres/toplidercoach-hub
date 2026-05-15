// ============================================================
// CM-CHAT.JS · Mensajeria interna del club
// TopLiderCoach HUB · Club Mode
// ============================================================
// Chat flotante abajo a la derecha.
// Se abre desde el panel de presencia o el icono de chat.
// ============================================================

var cmChatOpen = false;
var cmChatTargetUser = null;    // { wp_user_id, display_name, role_name }
var cmChatView = 'list';        // 'list' o 'conversation'
var cmChatInterval = null;
var cmChatUnread = 0;
var cmChatConversations = [];

// ========== AUTO-MONTAJE ==========
(function cmChatAutoMontar() {
    var intentos = 0;
    var intervalo = setInterval(function() {
        intentos++;
        if (intentos > 30) { clearInterval(intervalo); return; }
        if (typeof cmState === 'undefined' || !cmState.activo) return;
        if (!clubId || !usuario) return;
        clearInterval(intervalo);

        cmChatCrearUI();
        cmChatContarNoLeidos();

        // Polling cada 15 segundos
        cmChatInterval = setInterval(function() {
            cmChatContarNoLeidos();
            if (cmChatOpen && cmChatView === 'conversation' && cmChatTargetUser) {
                cmChatCargarMensajes(cmChatTargetUser.wp_user_id, false);
            }
        }, 15000);

        console.log('[Chat] Sistema de mensajeria montado');
    }, 1000);
})();


// ========== CREAR UI ==========
function cmChatCrearUI() {
    if (document.getElementById('cm-chat-widget')) return;

    var style = document.createElement('style');
    style.textContent =
        '#cm-chat-widget{position:fixed;bottom:20px;right:20px;z-index:8500}' +
        '#cm-chat-btn{width:52px;height:52px;border-radius:50%;background:#3b82f6;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(59,130,246,0.4);transition:transform .2s;position:relative}' +
        '#cm-chat-btn:hover{transform:scale(1.1)}' +
        '#cm-chat-btn svg{width:24px;height:24px;fill:white}' +
        '#cm-chat-badge{position:absolute;top:-2px;right:-2px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 4px}' +
        '#cm-chat-badge.hidden{display:none}' +
        '#cm-chat-panel{position:absolute;bottom:62px;right:0;width:340px;height:460px;background:#0f172a;border:1px solid #334155;border-radius:14px;box-shadow:0 20px 50px rgba(0,0,0,0.6);overflow:hidden;display:none;flex-direction:column}' +
        '#cm-chat-panel.open{display:flex}' +
        '.cm-chat-header{padding:14px 16px;border-bottom:1px solid #1e293b;display:flex;align-items:center;gap:10px;flex-shrink:0}' +
        '.cm-chat-header h4{margin:0;color:#e2e8f0;font-size:14px;flex:1}' +
        '.cm-chat-header button{background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;padding:4px 6px;border-radius:4px}' +
        '.cm-chat-header button:hover{background:#1e293b;color:#e2e8f0}' +
        '.cm-chat-body{flex:1;overflow-y:auto}' +
        // Conversation list
        '.cm-chat-conv{padding:12px 16px;display:flex;align-items:center;gap:10px;cursor:pointer;border-bottom:1px solid #1e293b;transition:background .15s}' +
        '.cm-chat-conv:hover{background:#1e293b}' +
        '.cm-chat-conv.has-unread{background:rgba(59,130,246,0.05);border-left:3px solid #3b82f6}' +
        '.cm-chat-conv-avatar{width:36px;height:36px;border-radius:50%;background:#334155;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#e2e8f0;flex-shrink:0}' +
        '.cm-chat-conv-info{flex:1;min-width:0}' +
        '.cm-chat-conv-name{color:#e2e8f0;font-size:13px;font-weight:600}' +
        '.cm-chat-conv-preview{color:#94a3b8;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
        '.cm-chat-conv-time{color:#64748b;font-size:11px;flex-shrink:0}' +
        '.cm-chat-conv-unread{background:#3b82f6;color:#fff;font-size:10px;font-weight:700;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}' +
        // Messages
        '.cm-chat-messages{padding:12px 16px;display:flex;flex-direction:column;gap:6px}' +
        '.cm-chat-msg{max-width:80%;padding:8px 12px;border-radius:12px;font-size:13px;line-height:1.4;word-wrap:break-word}' +
        '.cm-chat-msg.sent{align-self:flex-end;background:#3b82f6;color:#fff;border-bottom-right-radius:4px}' +
        '.cm-chat-msg.received{align-self:flex-start;background:#1e293b;color:#e2e8f0;border-bottom-left-radius:4px}' +
        '.cm-chat-msg-time{font-size:10px;opacity:0.6;margin-top:2px}' +
        '.cm-chat-msg-context{font-size:11px;padding:4px 8px;background:rgba(59,130,246,0.15);border-radius:6px;margin-bottom:4px;color:#60a5fa}' +
        // Input
        '.cm-chat-input-area{padding:10px 12px;border-top:1px solid #1e293b;display:flex;gap:8px;flex-shrink:0;align-items:flex-end}' +
        '.cm-chat-input-area textarea{flex:1;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#e2e8f0;padding:8px 10px;font-size:13px;font-family:inherit;resize:none;max-height:80px;min-height:36px;outline:none}' +
        '.cm-chat-input-area textarea:focus{border-color:#3b82f6}' +
        '.cm-chat-send{width:36px;height:36px;border-radius:50%;background:#3b82f6;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}' +
        '.cm-chat-send:hover{background:#2563eb}' +
        '.cm-chat-send svg{width:16px;height:16px;fill:white}' +
        '.cm-chat-empty{padding:40px 20px;text-align:center;color:#64748b;font-size:13px}' +
        '.cm-chat-date-sep{text-align:center;color:#64748b;font-size:11px;padding:8px 0;font-weight:600}';
    document.head.appendChild(style);

    var widget = document.createElement('div');
    widget.id = 'cm-chat-widget';
    widget.innerHTML =
        '<button id="cm-chat-btn" onclick="cmChatToggle()">' +
            '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>' +
            '<span id="cm-chat-badge" class="hidden">0</span>' +
        '</button>' +
        '<div id="cm-chat-panel">' +
            '<div class="cm-chat-header" id="cm-chat-header">' +
                '<h4>Mensajes</h4>' +
                '<button onclick="cmChatToggle()" title="Cerrar">✕</button>' +
            '</div>' +
            '<div class="cm-chat-body" id="cm-chat-body"></div>' +
        '</div>';

    document.body.appendChild(widget);
}


function cmChatToggle() {
    cmChatOpen = !cmChatOpen;
    var panel = document.getElementById('cm-chat-panel');
    if (panel) panel.classList.toggle('open', cmChatOpen);
    if (cmChatOpen) {
        if (cmChatTargetUser && cmChatView === 'conversation') {
            cmChatAbrirConversacion(cmChatTargetUser);
        } else {
            cmChatMostrarLista();
        }
    }
}


// ========== ABRIR CHAT DESDE PRESENCIA ==========
function cmChatIniciar(wpUserId, displayName, roleName) {
    cmChatTargetUser = { wp_user_id: wpUserId, display_name: displayName, role_name: roleName || '' };
    cmChatView = 'conversation';
    cmChatOpen = true;
    var panel = document.getElementById('cm-chat-panel');
    if (panel) panel.classList.add('open');
    cmChatAbrirConversacion(cmChatTargetUser);
}


// ========== LISTA DE CONVERSACIONES ==========
async function cmChatMostrarLista() {
    cmChatView = 'list';
    cmChatTargetUser = null;

    var header = document.getElementById('cm-chat-header');
    header.innerHTML = '<h4>Mensajes</h4><button onclick="cmChatToggle()" title="Cerrar">✕</button>';

    var body = document.getElementById('cm-chat-body');
    body.innerHTML = '<div class="cm-chat-empty">Cargando...</div>';

    // Cargar ultimos mensajes donde soy emisor o receptor
    var res = await supabaseClient.from('cm_messages')
        .select('*')
        .eq('club_id', clubId)
        .or('from_user_id.eq.' + usuario.id + ',to_user_id.eq.' + usuario.id)
        .order('created_at', { ascending: false })
        .limit(100);

    var messages = res.data || [];

    // Agrupar por conversacion (otro usuario)
    var convMap = {};
    messages.forEach(function(m) {
        var otherUserId = m.from_user_id === usuario.id ? m.to_user_id : m.from_user_id;
        var otherName = m.from_user_id === usuario.id ? m.to_name : m.from_name;

        if (!convMap[otherUserId]) {
            convMap[otherUserId] = {
                userId: otherUserId,
                name: otherName,
                lastMessage: m.message,
                lastTime: m.created_at,
                unread: 0
            };
        }
        // Contar no leidos (mensajes recibidos sin leer)
        if (m.to_user_id === usuario.id && !m.read_at) {
            convMap[otherUserId].unread++;
        }
    });

    var conversations = Object.values(convMap).sort(function(a, b) {
        return new Date(b.lastTime) - new Date(a.lastTime);
    });

    if (conversations.length === 0) {
        body.innerHTML = '<div class="cm-chat-empty">Sin conversaciones.<br>Haz clic en un usuario del panel de presencia para iniciar un chat.</div>';
        return;
    }

    var html = '';
    conversations.forEach(function(c) {
        var initials = '';
        var parts = c.name.split(' ');
        initials = (parts[0] ? parts[0][0] : '') + (parts.length > 1 ? parts[parts.length - 1][0] : '');

        var timeStr = cmChatFormatTime(c.lastTime);
        var preview = c.lastMessage.length > 35 ? c.lastMessage.substring(0, 35) + '...' : c.lastMessage;

        html +=
            '<div class="cm-chat-conv' + (c.unread > 0 ? ' has-unread' : '') + '" onclick="cmChatIniciar(' + c.userId + ',\'' + c.name.replace(/'/g, "\\'") + '\',\'\')">' +
                '<div class="cm-chat-conv-avatar">' + initials.toUpperCase() + '</div>' +
                '<div class="cm-chat-conv-info">' +
                    '<div class="cm-chat-conv-name">' + c.name + '</div>' +
                    '<div class="cm-chat-conv-preview">' + preview + '</div>' +
                '</div>' +
                '<div style="text-align:right">' +
                    '<div class="cm-chat-conv-time">' + timeStr + '</div>' +
                    (c.unread > 0 ? '<div class="cm-chat-conv-unread">' + c.unread + '</div>' : '') +
                '</div>' +
            '</div>';
    });

    body.innerHTML = html;
}


// ========== CONVERSACION INDIVIDUAL ==========
async function cmChatAbrirConversacion(targetUser) {
    cmChatView = 'conversation';
    cmChatTargetUser = targetUser;

    var header = document.getElementById('cm-chat-header');
    header.innerHTML =
        '<button onclick="cmChatMostrarLista()" style="font-size:18px" title="Volver">←</button>' +
        '<div style="flex:1"><div style="color:#e2e8f0;font-size:14px;font-weight:600">' + targetUser.display_name + '</div>' +
        (targetUser.role_name ? '<div style="color:#94a3b8;font-size:11px">' + targetUser.role_name + '</div>' : '') +
        '</div>' +
        '<button onclick="cmChatToggle()" title="Cerrar">✕</button>';

    var body = document.getElementById('cm-chat-body');
    body.innerHTML = '<div class="cm-chat-empty">Cargando...</div>';

    // Añadir input area si no existe
    if (!document.getElementById('cm-chat-input-area')) {
        var inputArea = document.createElement('div');
        inputArea.className = 'cm-chat-input-area';
        inputArea.id = 'cm-chat-input-area';
        inputArea.innerHTML =
            '<textarea id="cm-chat-input" placeholder="Escribe un mensaje..." rows="1" onkeydown="if(event.key===\'Enter\' && !event.shiftKey){event.preventDefault();cmChatEnviar();}"></textarea>' +
            '<button class="cm-chat-send" onclick="cmChatEnviar()" title="Enviar">' +
                '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>' +
            '</button>';
        var panel = document.getElementById('cm-chat-panel');
        panel.appendChild(inputArea);
    }
    document.getElementById('cm-chat-input-area').style.display = 'flex';

    await cmChatCargarMensajes(targetUser.wp_user_id, true);
}


async function cmChatCargarMensajes(otherUserId, scrollToBottom) {
    var body = document.getElementById('cm-chat-body');
    if (!body) return;

    var res = await supabaseClient.from('cm_messages')
        .select('*')
        .eq('club_id', clubId)
        .or(
            'and(from_user_id.eq.' + usuario.id + ',to_user_id.eq.' + otherUserId + '),' +
            'and(from_user_id.eq.' + otherUserId + ',to_user_id.eq.' + usuario.id + ')'
        )
        .order('created_at', { ascending: true })
        .limit(100);

    var messages = res.data || [];

    // Marcar como leidos los recibidos
    var unreadIds = messages.filter(function(m) {
        return m.to_user_id === usuario.id && !m.read_at;
    }).map(function(m) { return m.id; });

    if (unreadIds.length > 0) {
        await supabaseClient.from('cm_messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadIds);
        cmChatContarNoLeidos();
    }

    if (messages.length === 0) {
        body.innerHTML = '<div class="cm-chat-empty">Inicia la conversacion</div>';
        return;
    }

    var html = '<div class="cm-chat-messages">';
    var lastDate = '';

    messages.forEach(function(m) {
        var msgDate = new Date(m.created_at).toLocaleDateString('es-ES');
        if (msgDate !== lastDate) {
            html += '<div class="cm-chat-date-sep">' + msgDate + '</div>';
            lastDate = msgDate;
        }

        var isSent = m.from_user_id === usuario.id;
        var time = new Date(m.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        // Contexto vinculado
        var contextHtml = '';
        if (m.related_label) {
            contextHtml = '<div class="cm-chat-msg-context">' + m.related_label + '</div>';
        }

        html +=
            '<div class="cm-chat-msg ' + (isSent ? 'sent' : 'received') + '">' +
                contextHtml +
                m.message +
                '<div class="cm-chat-msg-time">' + time + '</div>' +
            '</div>';
    });

    html += '</div>';
    body.innerHTML = html;

    if (scrollToBottom) {
        body.scrollTop = body.scrollHeight;
    }
}


// ========== ENVIAR MENSAJE ==========
async function cmChatEnviar() {
    if (!cmChatTargetUser) return;
    var input = document.getElementById('cm-chat-input');
    var text = input.value.trim();
    if (!text) return;

    var nombre = usuario.display_name || usuario.name || usuario.username || 'Usuario';

    var msg = {
        club_id: clubId,
        from_user_id: usuario.id,
        from_name: nombre,
        to_user_id: cmChatTargetUser.wp_user_id,
        to_name: cmChatTargetUser.display_name,
        message: text
    };

    input.value = '';
    input.style.height = 'auto';

    var res = await supabaseClient.from('cm_messages').insert(msg).select().single();
    if (res.error) {
        showToast('Error al enviar: ' + res.error.message, 'error');
        return;
    }

    await cmChatCargarMensajes(cmChatTargetUser.wp_user_id, true);
}


// ========== CONTAR NO LEIDOS ==========
async function cmChatContarNoLeidos() {
    if (!usuario) return;

    var res = await supabaseClient.from('cm_messages')
        .select('id', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('to_user_id', usuario.id)
        .is('read_at', null);

    cmChatUnread = res.count || 0;

    var badge = document.getElementById('cm-chat-badge');
    if (badge) {
        badge.textContent = cmChatUnread > 9 ? '9+' : cmChatUnread;
        badge.classList.toggle('hidden', cmChatUnread === 0);
    }
}


// ========== HELPERS ==========
function cmChatFormatTime(dateStr) {
    var now = new Date();
    var date = new Date(dateStr);
    var diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Ahora';
    if (diff < 3600) return Math.floor(diff / 60) + ' min';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd';
    return date.toLocaleDateString('es-ES');
}


console.log('[Chat] cm-chat.js cargado');
