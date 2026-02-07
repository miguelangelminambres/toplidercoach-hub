// ========== VIDEO-UTILS.JS - TopLiderCoach HUB ==========
// Detección de plataforma, embeds de video

function detectarPlataformaVideo(url) {
    if (!url) return null;
    
    url = url.toLowerCase();
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return 'youtube';
    } else if (url.includes('vimeo.com')) {
        return 'vimeo';
    } else if (url.includes('drive.google.com')) {
        return 'drive';
    } else if (url.includes('http')) {
        return 'otro';
    }
    
    return null;
}

// Extraer ID del video según la plataforma
function extraerVideoId(url, plataforma) {
    if (!url || !plataforma) return null;
    
    try {
        if (plataforma === 'youtube') {
            // Formatos: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
            let videoId = null;
            if (url.includes('watch?v=')) {
                videoId = url.split('watch?v=')[1].split('&')[0];
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            } else if (url.includes('/embed/')) {
                videoId = url.split('/embed/')[1].split('?')[0];
            }
            return videoId;
        } else if (plataforma === 'vimeo') {
            // Formato: vimeo.com/ID
            const match = url.match(/vimeo\.com\/(\d+)/);
            return match ? match[1] : null;
        } else if (plataforma === 'drive') {
            // Formato: drive.google.com/file/d/ID/view
            const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            return match ? match[1] : null;
        }
    } catch (e) {
        console.error('Error extrayendo video ID:', e);
    }
    
    return null;
}

// Generar código embed según la plataforma
function generarVideoEmbed(url, plataforma, videoId) {
    if (!plataforma) return '';
    
    const embedConfig = {
        youtube: {
            emoji: '▶️',
            nombre: 'YouTube',
            color: '#dc2626',
            embed: videoId ? `<iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>` : null
        },
        vimeo: {
            emoji: '🎬',
            nombre: 'Vimeo',
            color: '#4f46e5',
            embed: videoId ? `<iframe src="https://player.vimeo.com/video/${videoId}" allowfullscreen></iframe>` : null
        },
        drive: {
            emoji: '📁',
            nombre: 'Google Drive',
            color: '#2563eb',
            embed: videoId ? `<iframe src="https://drive.google.com/file/d/${videoId}/preview" allowfullscreen></iframe>` : null
        },
        otro: {
            emoji: '🔗',
            nombre: 'Enlace externo',
            color: '#6b7280',
            embed: null
        }
    };
    
    const config = embedConfig[plataforma] || embedConfig.otro;
    
    if (config.embed) {
        return `
            <div class="video-detected-badge ${plataforma}">
                ${config.emoji} ${config.nombre} detectado
            </div>
            <div class="video-preview-box">
                ${config.embed}
            </div>
        `;
    } else {
        return `
            <div class="video-detected-badge ${plataforma}">
                ${config.emoji} ${config.nombre}
            </div>
            <div class="video-preview-box">
                <div class="video-placeholder">
                    <div class="icon">${config.emoji}</div>
                    <div class="plataforma">Vista previa no disponible</div>
                    <p style="font-size: 12px; opacity: 0.7;">Haz clic en "Abrir en nueva pestaña" para ver el video</p>
                </div>
            </div>
        `;
    }
}

// Actualizar preview del video cuando el usuario escribe
function actualizarPreviewVideo() {
    const url = document.getElementById('partido-video-url').value.trim();
    const previewContainer = document.getElementById('video-preview-container');
    const preview = document.getElementById('video-preview');
    const linkExterno = document.getElementById('video-link-externo');
    
    if (!url) {
        previewContainer.style.display = 'none';
        return;
    }
    
    const plataforma = detectarPlataformaVideo(url);
    
    if (plataforma) {
        const videoId = extraerVideoId(url, plataforma);
        preview.innerHTML = generarVideoEmbed(url, plataforma, videoId);
        linkExterno.href = url;
        previewContainer.style.display = 'block';
    } else {
        previewContainer.style.display = 'none';
    }
}

// Eliminar video del partido
function eliminarVideoPartido() {
    document.getElementById('partido-video-url').value = '';
    document.getElementById('video-preview-container').style.display = 'none';
}

// Generar HTML del video para la vista del partido
function generarVideoParaVerPartido(videoUrl) {
    if (!videoUrl) return '';
    
    const plataforma = detectarPlataformaVideo(videoUrl);
    const videoId = extraerVideoId(videoUrl, plataforma);
    
    const embedConfig = {
        youtube: {
            emoji: '▶️',
            nombre: 'YouTube',
            embed: videoId ? `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe></div>` : null
        },
        vimeo: {
            emoji: '🎬',
            nombre: 'Vimeo',
            embed: videoId ? `<div class="video-embed"><iframe src="https://player.vimeo.com/video/${videoId}" allowfullscreen></iframe></div>` : null
        },
        drive: {
            emoji: '📁',
            nombre: 'Google Drive',
            embed: videoId ? `<div class="video-embed"><iframe src="https://drive.google.com/file/d/${videoId}/preview" allowfullscreen></iframe></div>` : null
        },
        otro: {
            emoji: '🔗',
            nombre: 'Enlace',
            embed: null
        }
    };
    
    const config = embedConfig[plataforma] || embedConfig.otro;
    
    let contenido = '';
    
    if (config.embed) {
        contenido = config.embed;
    } else {
        contenido = `
            <div class="video-link-box">
                <div class="icon">${config.emoji}</div>
                <div class="info">
                    <div class="titulo">Video del partido</div>
                    <div class="url">${videoUrl.substring(0, 50)}...</div>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="video-section-ver">
            <h4>🎥 Video del Partido</h4>
            ${contenido}
            <div style="margin-top: 12px; text-align: center;">
                <a href="${videoUrl}" target="_blank" class="btn-ver-video">
                    ${config.emoji} Ver en ${config.nombre}
                </a>
            </div>
        </div>
    `;
}

// === MODIFICACIONES A FUNCIONES EXISTENTES ===

// 1. En abrirModalPartido() - añadir después de limpiar los campos:
// document.getElementById('partido-video-url').value = '';
// document.getElementById('video-preview-container').style.display = 'none';
// 
// Y cuando carga un partido existente, añadir:
// if (p.video_url) {
//     document.getElementById('partido-video-url').value = p.video_url;
//     actualizarPreviewVideo();
// }

// 2. En guardarPartido() - añadir al objeto partidoData:
// video_url: document.getElementById('partido-video-url').value.trim() || null,

// 3. En verPartido() - añadir el video al HTML del modal:
