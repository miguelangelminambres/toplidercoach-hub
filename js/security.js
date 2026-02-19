// ========== SECURITY.JS - TopLiderCoach HUB ==========
// Utilidades de seguridad: sanitización, validación, protección XSS

// ========== HTML ESCAPING (Anti-XSS) ==========

/**
 * Escapa caracteres HTML peligrosos para prevenir XSS.
 * Usar SIEMPRE que se inserte dato de usuario/BD en innerHTML.
 */
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Escapa un valor para uso seguro dentro de atributos HTML (onclick, data-, etc.)
 */
function escapeAttr(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Sanitiza una URL - solo permite http(s) y data:image
 */
function sanitizeURL(url) {
    if (!url) return '';
    const str = String(url).trim();
    // Permitir URLs http/https y data:image para previews
    if (/^https?:\/\//i.test(str)) return str;
    if (/^data:image\//i.test(str)) return str;
    return '';
}

// ========== INPUT VALIDATION ==========

/**
 * Valida que un ID sea un UUID válido o un entero positivo (formatos comunes en Supabase)
 */
function isValidId(id) {
    if (!id) return false;
    const str = String(id);
    // UUID v4
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) return true;
    // Integer positivo
    if (/^\d+$/.test(str) && parseInt(str) > 0) return true;
    return false;
}

/**
 * Valida extensión de archivo contra una whitelist
 */
function isAllowedFileExtension(fileName, allowedExtensions) {
    if (!fileName) return false;
    const ext = fileName.split('.').pop().toLowerCase();
    const defaults = allowedExtensions || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    return defaults.includes(ext);
}

/**
 * Valida tipo MIME de archivo contra una whitelist
 */
function isAllowedMimeType(file, allowedTypes) {
    if (!file || !file.type) return false;
    const defaults = allowedTypes || [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
    ];
    return defaults.includes(file.type);
}

// ========== TOKEN VALIDATION ==========

/**
 * Decodifica un JWT y extrae el payload (sin verificar firma - eso lo hace el servidor)
 */
function decodeJWTPayload(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]));
        return payload;
    } catch (e) {
        return null;
    }
}

/**
 * Comprueba si un token JWT ha expirado
 */
function isTokenExpired(token) {
    const payload = decodeJWTPayload(token);
    if (!payload || !payload.exp) return true;
    // Añadir margen de 60 segundos
    return (payload.exp * 1000) < (Date.now() - 60000);
}

/**
 * Restaura sesión de forma segura: valida token antes de confiar en él
 */
function secureSessionRestore() {
    const savedUser = localStorage.getItem('hub_user');
    const savedToken = localStorage.getItem('hub_token');

    if (!savedUser || !savedToken) return null;

    // Validar que el token no ha expirado
    if (isTokenExpired(savedToken)) {
        console.warn('Token expirado, cerrando sesión');
        localStorage.removeItem('hub_user');
        localStorage.removeItem('hub_token');
        return null;
    }

    // Validar que el JSON del usuario es parseable y tiene estructura esperada
    try {
        const user = JSON.parse(savedUser);
        if (!user || !user.id) {
            console.warn('Datos de usuario inválidos');
            localStorage.removeItem('hub_user');
            localStorage.removeItem('hub_token');
            return null;
        }
        return { user, token: savedToken };
    } catch (e) {
        console.warn('Error parseando datos de usuario');
        localStorage.removeItem('hub_user');
        localStorage.removeItem('hub_token');
        return null;
    }
}

// ========== PROMPT INJECTION PROTECTION ==========

/**
 * Sanitiza el input del usuario antes de enviarlo al LLM.
 * Elimina intentos comunes de prompt injection.
 */
function sanitizePromptInput(input) {
    if (!input) return '';
    let clean = String(input);

    // Limitar longitud (prevenir DoS por prompts gigantes)
    if (clean.length > 5000) {
        clean = clean.substring(0, 5000);
    }

    // Eliminar intentos de inyección de instrucciones del sistema
    const injectionPatterns = [
        /ignore\s+(all\s+)?previous\s+instructions/gi,
        /ignore\s+(all\s+)?prior\s+instructions/gi,
        /disregard\s+(all\s+)?previous/gi,
        /you\s+are\s+now\s+/gi,
        /new\s+instructions?\s*:/gi,
        /system\s*:\s*/gi,
        /\[INST\]/gi,
        /\[\/INST\]/gi,
        /<\|im_start\|>/gi,
        /<\|im_end\|>/gi,
    ];

    injectionPatterns.forEach(pattern => {
        clean = clean.replace(pattern, '[filtrado]');
    });

    return clean.trim();
}

// ========== RATE LIMITING ==========

/**
 * Simple rate limiter para llamadas a API
 */
const _rateLimitState = {};

function isRateLimited(key, maxCalls, windowMs) {
    const now = Date.now();
    if (!_rateLimitState[key]) {
        _rateLimitState[key] = [];
    }

    // Limpiar entradas antiguas
    _rateLimitState[key] = _rateLimitState[key].filter(t => now - t < windowMs);

    if (_rateLimitState[key].length >= maxCalls) {
        return true;
    }

    _rateLimitState[key].push(now);
    return false;
}

// ========== ERROR HANDLING ==========

/**
 * Muestra un error al usuario de forma segura (sin exponer detalles internos)
 */
function mostrarErrorSeguro(mensajeUsuario, errorInterno) {
    console.error('[Error interno]:', errorInterno);
    // Solo mostrar mensaje genérico al usuario
    alert(mensajeUsuario || 'Ha ocurrido un error. Inténtalo de nuevo.');
}

console.log('Security module loaded');
