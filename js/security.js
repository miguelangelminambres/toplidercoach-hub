// ========== SECURITY.JS - TopLiderCoach HUB ==========
// Módulo centralizado de seguridad
// Carga ANTES que core.js en index.html

const Security = (function() {
    'use strict';

    // ========== ESCAPE HTML (prevenir XSS en innerHTML) ==========
    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ========== ESCAPE PARA ATRIBUTOS HTML (onclick, data-, value) ==========
    function escapeAttr(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // ========== SANITIZAR URLs (solo http, https, data:image) ==========
    function sanitizeURL(url) {
        if (!url || typeof url !== 'string') return '';
        url = url.trim();
        if (/^https?:\/\//i.test(url)) return url;
        if (/^data:image\/(png|jpeg|jpg|gif|svg\+xml|webp);base64,/i.test(url)) return url;
        return '';
    }

    // ========== VALIDAR ID (UUID o entero positivo) ==========
    function isValidId(id) {
        if (!id) return false;
        var str = String(id);
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) return true;
        if (/^\d+$/.test(str) && parseInt(str) > 0) return true;
        return false;
    }

    // ========== WHITELIST DE EXTENSIONES Y MIME ==========
    var ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    var ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

    function isAllowedFileExtension(filename) {
        if (!filename) return false;
        var ext = filename.split('.').pop().toLowerCase();
        return ALLOWED_EXTENSIONS.indexOf(ext) !== -1;
    }

    function isAllowedMimeType(mimeType) {
        if (!mimeType) return false;
        return ALLOWED_MIME_TYPES.indexOf(mimeType.toLowerCase()) !== -1;
    }

    function validateFile(file, maxSizeMB) {
        maxSizeMB = maxSizeMB || 2;
        if (!file) return { valid: false, error: 'No se seleccionó archivo' };
        if (!isAllowedMimeType(file.type)) return { valid: false, error: 'Tipo de archivo no permitido. Usa: JPG, PNG, GIF, WebP' };
        if (!isAllowedFileExtension(file.name)) return { valid: false, error: 'Extensión de archivo no permitida' };
        if (file.size > maxSizeMB * 1024 * 1024) return { valid: false, error: 'Archivo demasiado grande. Máximo ' + maxSizeMB + 'MB' };
        return { valid: true };
    }

    function sanitizeFilename(filename) {
        if (!filename) return 'file';
        return filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.{2,}/g, '.').substring(0, 100);
    }

    // ========== JWT / SESIÓN ==========
    function isTokenExpired(token) {
        if (!token || typeof token !== 'string') return true;
        try {
            var parts = token.split('.');
            if (parts.length !== 3) return true;
            var payload = JSON.parse(atob(parts[1]));
            if (!payload.exp) return false;
            return (payload.exp * 1000) < Date.now();
        } catch (e) { return true; }
    }

    function secureSessionRestore() {
        try {
            var savedUser = localStorage.getItem('hub_user');
            var savedToken = localStorage.getItem('hub_token');
            if (!savedUser || !savedToken) return null;
            if (isTokenExpired(savedToken)) {
                localStorage.removeItem('hub_user');
                localStorage.removeItem('hub_token');
                return null;
            }
            var user = JSON.parse(savedUser);
            if (!user || !user.id || !user.name) {
                localStorage.removeItem('hub_user');
                localStorage.removeItem('hub_token');
                return null;
            }
            return { user: user, token: savedToken };
        } catch (e) {
            localStorage.removeItem('hub_user');
            localStorage.removeItem('hub_token');
            return null;
        }
    }

    // ========== ANTI PROMPT INJECTION ==========
    function sanitizePromptInput(text) {
        if (!text || typeof text !== 'string') return '';
        return text
            .replace(/ignore\s+(previous|all|above|prior)\s+(instructions?|prompts?|rules?)/gi, '[filtrado]')
            .replace(/you\s+are\s+now\s+/gi, '[filtrado]')
            .replace(/system\s*:\s*/gi, '[filtrado]')
            .replace(/\[INST\]/gi, '[filtrado]')
            .replace(/<\/?s>/gi, '')
            .replace(/<<SYS>>|<\/SYS>>/gi, '[filtrado]')
            .trim()
            .substring(0, 2000);
    }

    // ========== RATE LIMITER ==========
    var _rateLimits = {};
    function isRateLimited(key, maxRequests, windowMs) {
        maxRequests = maxRequests || 10;
        windowMs = windowMs || 60000;
        var now = Date.now();
        if (!_rateLimits[key]) _rateLimits[key] = [];
        _rateLimits[key] = _rateLimits[key].filter(function(t) { return (now - t) < windowMs; });
        if (_rateLimits[key].length >= maxRequests) return true;
        _rateLimits[key].push(now);
        return false;
    }

    // ========== ERROR SEGURO ==========
    function mostrarErrorSeguro(error, mensajeUsuario) {
        console.error('Error interno:', error);
        return mensajeUsuario || 'Ha ocurrido un error. Inténtalo de nuevo.';
    }

    // ========== SANITIZAR HTML CON DOMPURIFY ==========
    function safeHTML(html) {
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(html, {
                ALLOWED_TAGS: ['div','span','img','button','p','br','strong','em','h1','h2','h3','h4','h5','table','thead','tbody','tr','th','td','ul','ol','li','a','canvas','label','input','select','option','textarea','i','small','b'],
                ALLOWED_ATTR: ['class','id','style','src','alt','onclick','onchange','oninput','type','value','placeholder','data-id','data-tab','href','target','colspan','rowspan','disabled','checked','selected','title','draggable','min','max','step','name','for','width','height']
            });
        }
        return html;
    }

// ========== AUTO-SANITIZAR TODOS LOS innerHTML ==========
    function activarProteccionGlobal() {
        if (typeof DOMPurify === 'undefined') {
            console.warn('DOMPurify no cargado, protección global desactivada');
            return;
        }

        var config = {
            ALLOWED_TAGS: ['div','span','img','button','p','br','strong','em',
                'h1','h2','h3','h4','h5','h6','table','thead','tbody','tr','th','td',
                'ul','ol','li','a','canvas','label','input','select','option',
                'textarea','i','small','b','svg','path','circle','rect','line',
                'polyline','polygon','g','text','font','sub','sup','hr','pre','code'],
            ALLOWED_ATTR: ['class','id','style','src','alt','onclick','onchange',
                'oninput','onkeydown','onkeyup','onmousedown','onmouseup',
                'ondragstart','ondragover','ondrop','ondragend',
                'type','value','placeholder','href','target',
                'colspan','rowspan','disabled','checked','selected','title',
                'draggable','min','max','step','name','for','width','height',
                'viewBox','d','fill','stroke','stroke-width','cx','cy','r',
                'x','y','x1','y1','x2','y2','points','transform',
                'contenteditable','tabindex','role','aria-label'],
            ALLOW_DATA_ATTR: true
        };

        var desc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        if (!desc) return;

        Object.defineProperty(Element.prototype, 'innerHTML', {
            set: function(value) {
                if (typeof value === 'string' && value.trim() !== '') {
                    value = DOMPurify.sanitize(value, config);
                }
                desc.set.call(this, value);
            },
            get: function() {
                return desc.get.call(this);
            },
            configurable: true
        });

        console.log('🔒 Protección innerHTML global activada');
    }

    // Activar automáticamente
    activarProteccionGlobal();

    return {
        safeHTML: safeHTML,
        escapeHTML: escapeHTML,
        escapeAttr: escapeAttr,
        sanitizeURL: sanitizeURL,
        isValidId: isValidId,
        isAllowedFileExtension: isAllowedFileExtension,
        isAllowedMimeType: isAllowedMimeType,
        validateFile: validateFile,
        sanitizeFilename: sanitizeFilename,
        isTokenExpired: isTokenExpired,
        secureSessionRestore: secureSessionRestore,
        sanitizePromptInput: sanitizePromptInput,
        isRateLimited: isRateLimited,
        mostrarErrorSeguro: mostrarErrorSeguro
    };
})();
