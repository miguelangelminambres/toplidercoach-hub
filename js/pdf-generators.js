// ========== PDF-GENERATORS.JS - TopLiderCoach HUB ==========
// PDFs: ficha jugador, convocatoria, alineación, partido completo, estadísticas

async function exportarFichaJugadorPDF() {
    if (!fichaJugadorActual) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const tempId = document.getElementById('stats-temporada').value || seasonId;
    
    // Cargar datos
    const { data: jugador } = await supabaseClient.from('players').select('*').eq('id', fichaJugadorActual).single();
    const { data: club } = await supabaseClient.from('clubs').select('name, logo_url').eq('id', clubId).single();
    const { data: temporada } = await supabaseClient.from('seasons').select('name').eq('id', tempId).single();
    const { data: stats } = await supabaseClient
        .from('match_player_stats')
        .select('*, matches!inner(opponent, match_date, home_away, team_goals, opponent_goals, result, season_id)')
        .eq('player_id', fichaJugadorActual)
        .eq('matches.season_id', tempId)
        .order('matches(match_date)', { ascending: false });
    
    // Calcular totales
    let totalPJ = 0, totalMin = 0, totalGoles = 0, totalAsist = 0, totalTA = 0, totalTR = 0;
    (stats || []).forEach(s => {
        if (s.minutes_played > 0) totalPJ++;
        totalMin += s.minutes_played || 0;
        totalGoles += s.goals || 0;
        totalAsist += s.assists || 0;
        totalTA += s.yellow_cards || 0;
        totalTR += s.red_cards || 0;
    });
    
    // ===== HEADER =====
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, 210, 50, 'F');
    
    // Foto del jugador (placeholder circular)
    doc.setFillColor(107, 114, 128);
    doc.circle(30, 25, 15, 'F');
    if (jugador.photo_url) {
        try {
            doc.addImage(jugador.photo_url, 'JPEG', 15, 10, 30, 30);
        } catch (e) {
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.text(jugador.name?.charAt(0) || '?', 30, 28, { align: 'center' });
        }
    } else {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text(jugador.name?.charAt(0) || '?', 30, 28, { align: 'center' });
    }
    
    // Nombre y posición
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(jugador.name || 'Sin nombre', 55, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(jugador.position || '', 55, 30);
    doc.setFontSize(10);
    doc.text(`${club?.name || 'Mi Club'} - ${temporada?.name || 'Temporada'}`, 55, 40);
    
    // Escudo del club
    if (club?.logo_url) {
        try {
            doc.addImage(club.logo_url, 'PNG', 175, 10, 25, 25);
        } catch (e) {}
    }
    
    let y = 60;
    
    // ===== DATOS PERSONALES =====
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS PERSONALES', 15, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const edad = jugador.birth_date ? calcularEdad(jugador.birth_date) : null;
    let datosLinea = [];
    if (edad) datosLinea.push(`Edad: ${edad} años`);
    if (jugador.height_cm) datosLinea.push(`Altura: ${jugador.height_cm} cm`);
    if (jugador.weight_kg) datosLinea.push(`Peso: ${jugador.weight_kg} kg`);
    if (jugador.dominant_foot) datosLinea.push(`Pie: ${jugador.dominant_foot}`);
    doc.text(datosLinea.join('   |   '), 15, y);
    y += 15;
    
    // ===== RESUMEN ESTADÍSTICAS =====
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y - 5, 180, 25, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('RESUMEN DE TEMPORADA', 15, y + 2);
    y += 12;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`PJ: ${totalPJ}   |   Min: ${totalMin}   |   Goles: ${totalGoles}   |   Asist: ${totalAsist}   |   TA: ${totalTA}   |   TR: ${totalTR}`, 15, y + 2);
    y += 20;
    
    // ===== DETALLE PARTIDOS =====
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PARTICIPACION POR PARTIDO', 15, y);
    y += 8;
    
    if (stats && stats.length > 0) {
        const tableData = stats.map(s => {
            const m = s.matches;
            const fecha = new Date(m.match_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            const esLocal = m.home_away === 'home';
            const marcador = esLocal ? `${m.team_goals || 0}-${m.opponent_goals || 0}` : `${m.opponent_goals || 0}-${m.team_goals || 0}`;
            return [
                fecha,
                (esLocal ? 'vs ' : '@ ') + m.opponent,
                marcador,
                s.minutes_played || 0,
                s.goals || 0,
                s.assists || 0,
                s.yellow_cards || 0,
                s.red_cards || 0
            ];
        });
        
        doc.autoTable({
            startY: y,
            head: [['Fecha', 'Rival', 'Res', 'Min', 'Gol', 'Asi', 'TA', 'TR']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [31, 41, 55], fontSize: 9 },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 22 },
                1: { cellWidth: 50 },
                2: { cellWidth: 18 },
                3: { cellWidth: 18 },
                4: { cellWidth: 18 },
                5: { cellWidth: 18 },
                6: { cellWidth: 18 },
                7: { cellWidth: 18 }
            }
        });
    } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('No hay partidos registrados en esta temporada', 105, y + 10, { align: 'center' });
    }
    
    // ===== FOOTER =====
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generado con TopLiderCoach.com', 105, 285, { align: 'center' });
    
    // Guardar
    const nombreArchivo = `ficha_${jugador.name?.replace(/\s+/g, '_') || 'jugador'}.pdf`;
    doc.save(nombreArchivo);
}
        // ========== PDF EXPORTS ==========
     // ========== PDF CONVOCATORIA ==========
// ============================================================
// PDF CONVOCATORIA - VERSIÓN COMPACTA (caben 20 jugadores)
// ============================================================
async function generarPDFConvocatoria() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const rival = document.getElementById('partido-rival').value || 'Rival';
    const fecha = document.getElementById('partido-fecha').value;
    const hora = document.getElementById('partido-hora').value || '';
    const estadio = document.getElementById('partido-estadio').value || '';
    const localidad = document.getElementById('partido-localidad').value;
    const competicion = document.getElementById('partido-competicion').value || '';
    const formatoJuego = document.getElementById('partido-formato-juego')?.value || '11';
    const lugarEncuentro = document.getElementById('partido-lugar-encuentro')?.value || '';
    const horaSalida = document.getElementById('partido-hora-salida')?.value || '';
    const fechaSalida = document.getElementById('partido-fecha-salida')?.value || '';
    const notas = document.getElementById('partido-notas-convocatoria')?.value || '';
    
    const { data: club } = await supabaseClient
        .from('clubs')
        .select('name, logo_url')
        .eq('id', clubId)
        .single();
    
    // Obtener jugadores convocados
    const jugadoresConvocados = [];
    for (const spId of convocadosPartido) {
        const jugador = plantillaPartido.find(j => j.id === spId);
        if (jugador) {
            jugadoresConvocados.push({
                id: spId,
                nombre: jugador.players?.name || jugador.name || 'Sin nombre',
                dorsal: jugador.shirt_number || '',
                foto: jugador.players?.photo_url || jugador.photo_url || null
            });
        }
    }
    jugadoresConvocados.sort((a, b) => (a.dorsal || 99) - (b.dorsal || 99));
    
    const fechaFormateada = fecha ? new Date(fecha).toLocaleDateString('es-ES', { 
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    }) : '';
    const fechaCorta = fecha ? new Date(fecha).toLocaleDateString('es-ES', { 
        day: '2-digit', month: 'short', year: 'numeric' 
    }) : '';
    
    const colorPrimario = [5, 150, 105];
    const colorSecundario = [16, 185, 129];
    
    // ===== HEADER (compacto) =====
    doc.setFillColor(...colorPrimario);
    doc.rect(0, 0, 210, 38, 'F');
    doc.setFillColor(...colorSecundario);
    doc.rect(0, 35, 210, 4, 'F');
    
    let contenidoX = 12;
    if (club && club.logo_url) {
        try {
            doc.addImage(club.logo_url, 'PNG', 10, 5, 26, 26);
            contenidoX = 42;
        } catch (e) { console.log('No se pudo cargar el escudo'); }
    }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('CONVOCATORIA', contenidoX, 15);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(club?.name || 'Mi Club', contenidoX, 23);
    if (competicion) { doc.setFontSize(9); doc.text(competicion, contenidoX, 30); }
    
    // Badge formato
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(175, 10, 24, 10, 2, 2, 'F');
    doc.setTextColor(...colorPrimario);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`F${formatoJuego}`, 187, 17, { align: 'center' });
    
    let y = 46;
    
   // ===== DATOS DEL PARTIDO (con escudos) =====
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(10, y, 190, 24, 2, 2, 'F');
    
    const esLocal = localidad === 'home';
    const equipoLocal = esLocal ? (club?.name || 'Mi Equipo') : rival;
    const equipoVisitante = esLocal ? rival : (club?.name || 'Mi Equipo');
   const escudoLocal = esLocal ? club?.logo_url : (escudoRivalUrl || opponentActual?.logo_url || null);
    const escudoVisitante = esLocal ? (escudoRivalUrl || opponentActual?.logo_url || null) : club?.logo_url;
    
    // Escudo local
    if (escudoLocal) {
        try { doc.addImage(escudoLocal, 'PNG', 18, y + 3, 16, 16); } catch(e) {}
    }
    
    // Escudo visitante
    if (escudoVisitante) {
        try { doc.addImage(escudoVisitante, 'PNG', 176, y + 3, 16, 16); } catch(e) {}
    }
    
    // VS
    doc.setTextColor(...colorPrimario);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('VS', 105, y + 10, { align: 'center' });
    
    // Nombres equipos
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.text(equipoLocal.toUpperCase(), 55, y + 9, { align: 'center' });
    doc.text(equipoVisitante.toUpperCase(), 155, y + 9, { align: 'center' });
    
    // Etiquetas
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    doc.text('LOCAL', 55, y + 14, { align: 'center' });
    doc.text('VISITANTE', 155, y + 14, { align: 'center' });
    
    // Fecha, hora, estadio
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    doc.text(`${fechaCorta}  ${hora ? '| ' + hora + 'h' : ''}  ${estadio ? '| ' + estadio : ''}`, 105, y + 21, { align: 'center' });
    
    y += 28;
    
    // ===== TÍTULO CONVOCADOS =====
    doc.setFillColor(...colorPrimario);
    doc.roundedRect(10, y, 190, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`JUGADORES CONVOCADOS (${jugadoresConvocados.length})`, 105, y + 5.5, { align: 'center' });
    
    y += 12;
    
    // ===== GRID DE JUGADORES (COMPACTO) =====
    const columnas = 5;
    const anchoCard = 34;
    const altoCard = 32;
    const espacioH = (190 - (columnas * anchoCard)) / (columnas + 1);
    const espacioV = 4;
    
    for (let i = 0; i < jugadoresConvocados.length; i++) {
        const fila = Math.floor(i / columnas);
        const col = i % columnas;
        
        const xCard = 10 + espacioH + (col * (anchoCard + espacioH));
        const yCard = y + (fila * (altoCard + espacioV));
        
        await dibujarJugadorCardCompacta(doc, jugadoresConvocados[i], xCard, yCard, anchoCard, altoCard, colorPrimario);
    }
    
    const filasUsadas = Math.ceil(jugadoresConvocados.length / columnas);
    y += filasUsadas * (altoCard + espacioV) + 6;
    
    // ===== INFORMACIÓN LOGÍSTICA =====
    if (lugarEncuentro || fechaSalida || horaSalida || notas) {
        let altoLogistica = 12;
        let lineasUsadas = 0;
        if (lugarEncuentro) lineasUsadas++;
        if (fechaSalida || horaSalida) lineasUsadas++; // Fecha y hora en misma línea
        if (notas) {
            const lineasNotas = doc.splitTextToSize(notas, 165).length;
            lineasUsadas += lineasNotas;
        }
        altoLogistica += lineasUsadas * 6;
        
        doc.setFillColor(255, 251, 235);
        doc.setDrawColor(245, 158, 11);
        doc.setLineWidth(0.4);
        doc.roundedRect(10, y, 190, altoLogistica, 2, 2, 'FD');
        
        doc.setTextColor(180, 83, 9);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMACIÓN IMPORTANTE', 105, y + 5, { align: 'center' });
        
        let yInfo = y + 10;
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(7);
        
        if (lugarEncuentro) {
            doc.setFont('helvetica', 'bold');
            doc.text('Punto de encuentro:', 15, yInfo);
            doc.setFont('helvetica', 'normal');
            doc.text(lugarEncuentro, 48, yInfo);
            yInfo += 6;
        }
        
        // Fecha y hora de salida en la misma línea
        if (fechaSalida || horaSalida) {
            doc.setFont('helvetica', 'bold');
            if (fechaSalida) {
                const fechaSalidaFormateada = new Date(fechaSalida).toLocaleDateString('es-ES', { 
                    weekday: 'short', day: 'numeric', month: 'short' 
                });
                doc.text('Salida:', 15, yInfo);
                doc.setFont('helvetica', 'normal');
                doc.text(fechaSalidaFormateada + (horaSalida ? ' a las ' + horaSalida + 'h' : ''), 32, yInfo);
            } else if (horaSalida) {
                doc.text('Hora de salida:', 15, yInfo);
                doc.setFont('helvetica', 'normal');
                doc.text(horaSalida + 'h', 43, yInfo);
            }
            yInfo += 6;
        }
        
        if (notas) {
            doc.setFont('helvetica', 'bold');
            doc.text('Notas:', 15, yInfo);
            doc.setFont('helvetica', 'normal');
            const notasLineas = doc.splitTextToSize(notas, 160);
            doc.text(notasLineas, 30, yInfo);
        }
    }
    
    // ===== FOOTER =====
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('Generado con TopLiderCoach HUB', 105, 290, { align: 'center' });
    
    doc.save(`convocatoria_${rival.replace(/\s+/g, '_')}_${fecha || 'partido'}.pdf`);
}


// ============================================================
// PDF ALINEACIÓN - VERSIÓN COMPACTA
// ============================================================
async function generarPDFAlineacion() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const rival = document.getElementById('partido-rival').value || 'Rival';
    const fecha = document.getElementById('partido-fecha').value;
    const hora = document.getElementById('partido-hora').value || '';
    const estadio = document.getElementById('partido-estadio').value || '';
    const localidad = document.getElementById('partido-localidad').value;
    const competicion = document.getElementById('partido-competicion').value || '';
    const formatoJuego = document.getElementById('partido-formato-juego')?.value || '11';
    
    const { data: club } = await supabaseClient
        .from('clubs')
        .select('name, logo_url')
        .eq('id', clubId)
        .single();
    
    const titulares = [];
    const suplentes = [];
    
    for (const spId of convocadosPartido) {
        const jugador = plantillaPartido.find(j => j.id === spId);
        if (jugador) {
            const jugadorData = {
                id: spId,
                nombre: jugador.players?.name || jugador.name || 'Sin nombre',
                dorsal: jugador.shirt_number || '',
                foto: jugador.players?.photo_url || jugador.photo_url || null
            };
            if (titularesPartido.includes(spId)) {
                titulares.push(jugadorData);
            } else {
                suplentes.push(jugadorData);
            }
        }
    }
    
    titulares.sort((a, b) => (a.dorsal || 99) - (b.dorsal || 99));
    suplentes.sort((a, b) => (a.dorsal || 99) - (b.dorsal || 99));
    
    const fechaCorta = fecha ? new Date(fecha).toLocaleDateString('es-ES', { 
        day: '2-digit', month: 'short', year: 'numeric' 
    }) : '';
    
    const colorPrimario = [37, 99, 235];
    const colorSecundario = [59, 130, 246];
    const colorSuplentes = [107, 114, 128];
    
    // ===== HEADER =====
    doc.setFillColor(...colorPrimario);
    doc.rect(0, 0, 210, 38, 'F');
    doc.setFillColor(...colorSecundario);
    doc.rect(0, 35, 210, 4, 'F');
    
    let contenidoX = 12;
    if (club && club.logo_url) {
        try {
            doc.addImage(club.logo_url, 'PNG', 10, 5, 26, 26);
            contenidoX = 42;
        } catch (e) { console.log('No se pudo cargar el escudo'); }
    }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ALINEACIÓN', contenidoX, 15);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(club?.name || 'Mi Club', contenidoX, 23);
    if (competicion) { doc.setFontSize(9); doc.text(competicion, contenidoX, 30); }
    
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(175, 10, 24, 10, 2, 2, 'F');
    doc.setTextColor(...colorPrimario);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`F${formatoJuego}`, 187, 17, { align: 'center' });
    
    let y = 46;
    
    // ===== DATOS PARTIDO =====
  // ===== DATOS DEL PARTIDO (con escudos) =====
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(10, y, 190, 24, 2, 2, 'F');
    
    const esLocal = localidad === 'home';
    const equipoLocal = esLocal ? (club?.name || 'Mi Equipo') : rival;
    const equipoVisitante = esLocal ? rival : (club?.name || 'Mi Equipo');
 const escudoLocal = esLocal ? club?.logo_url : (escudoRivalUrl || opponentActual?.logo_url || null);
    const escudoVisitante = esLocal ? (escudoRivalUrl || opponentActual?.logo_url || null) : club?.logo_url;
    
    // Escudo local
    if (escudoLocal) {
        try { doc.addImage(escudoLocal, 'PNG', 18, y + 3, 16, 16); } catch(e) {}
    }
    
    // Escudo visitante
    if (escudoVisitante) {
        try { doc.addImage(escudoVisitante, 'PNG', 176, y + 3, 16, 16); } catch(e) {}
    }
    
    // VS
    doc.setTextColor(...colorPrimario);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('VS', 105, y + 10, { align: 'center' });
    
    // Nombres equipos
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.text(equipoLocal.toUpperCase(), 55, y + 9, { align: 'center' });
    doc.text(equipoVisitante.toUpperCase(), 155, y + 9, { align: 'center' });
    
    // Etiquetas
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    doc.text('LOCAL', 55, y + 14, { align: 'center' });
    doc.text('VISITANTE', 155, y + 14, { align: 'center' });
    
    // Fecha, hora, estadio
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    doc.text(`${fechaCorta}  ${hora ? '| ' + hora + 'h' : ''}  ${estadio ? '| ' + estadio : ''}`, 105, y + 21, { align: 'center' });
    
    y += 28;
    
    // ===== TITULARES =====
    doc.setFillColor(...colorPrimario);
    doc.roundedRect(10, y, 190, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`TITULARES (${titulares.length})`, 105, y + 5.5, { align: 'center' });
    y += 12;
    
    const columnas = 5;
    const anchoCard = 34;
    const altoCard = 32;
    const espacioH = (190 - (columnas * anchoCard)) / (columnas + 1);
    const espacioV = 4;
    
    for (let i = 0; i < titulares.length; i++) {
        const fila = Math.floor(i / columnas);
        const col = i % columnas;
        const xCard = 10 + espacioH + (col * (anchoCard + espacioH));
        const yCard = y + (fila * (altoCard + espacioV));
        await dibujarJugadorCardCompacta(doc, titulares[i], xCard, yCard, anchoCard, altoCard, colorPrimario);
    }
    
    y += Math.ceil(titulares.length / columnas) * (altoCard + espacioV) + 6;
    
    // ===== SUPLENTES =====
    if (suplentes.length > 0) {
        doc.setFillColor(...colorSuplentes);
        doc.roundedRect(10, y, 190, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`SUPLENTES (${suplentes.length})`, 105, y + 5.5, { align: 'center' });
        y += 12;
        
        for (let i = 0; i < suplentes.length; i++) {
            const fila = Math.floor(i / columnas);
            const col = i % columnas;
            const xCard = 10 + espacioH + (col * (anchoCard + espacioH));
            const yCard = y + (fila * (altoCard + espacioV));
            await dibujarJugadorCardCompacta(doc, suplentes[i], xCard, yCard, anchoCard, altoCard, colorSuplentes);
        }
    }
    
    // ===== FOOTER =====
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('Generado con TopLiderCoach HUB', 105, 290, { align: 'center' });
    
    doc.save(`alineacion_${rival.replace(/\s+/g, '_')}_${fecha || 'partido'}.pdf`);
}


// ============================================================
// FUNCIÓN AUXILIAR: Card de jugador COMPACTA
// ============================================================
async function dibujarJugadorCardCompacta(doc, jugador, x, y, ancho, alto, colorAccento) {
    console.log('Jugador:', jugador.nombre, 'Foto URL:', jugador.foto);
    // Fondo card
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, ancho, alto, 2, 2, 'FD');
    
    // Área de foto
    const fotoSize = 18;
    const fotoX = x + (ancho - fotoSize) / 2;
    const fotoY = y + 3;
    
    let fotoOK = false;
    if (jugador.foto) {
        try {
            doc.addImage(jugador.foto, 'JPEG', fotoX, fotoY, fotoSize, fotoSize);
            fotoOK = true;
        } catch (e) {
            // Si falla, dibujamos placeholder
        }
    }
    
    // Placeholder si no hay foto
    if (!fotoOK) {
        doc.setFillColor(230, 230, 230);
        doc.circle(fotoX + fotoSize/2, fotoY + fotoSize/2, fotoSize/2, 'F');
        doc.setFillColor(...colorAccento);
        const cx = fotoX + fotoSize/2;
        const cy = fotoY + fotoSize/2;
        doc.circle(cx, cy - 2, 3, 'F');
        doc.ellipse(cx, cy + 4, 5, 3, 'F');
    }
    
    // Dorsal (badge pequeño arriba derecha)
    if (jugador.dorsal) {
        const dorsalX = x + ancho - 10;
        const dorsalY = y + 1;
        doc.setFillColor(...colorAccento);
        doc.roundedRect(dorsalX, dorsalY, 9, 6, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.text(String(jugador.dorsal), dorsalX + 4.5, dorsalY + 4.2, { align: 'center' });
    }
    
    // Nombre (abajo centrado)
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    
    let nombre = jugador.nombre;
    if (nombre.length > 14) {
        const partes = nombre.split(' ');
        if (partes.length > 1) {
            nombre = partes[0].charAt(0) + '. ' + partes[partes.length - 1];
        }
        if (nombre.length > 14) {
            nombre = nombre.substring(0, 12) + '..';
        }
    }
    
    doc.text(nombre, x + ancho/2, y + alto - 3, { align: 'center' });
}

                async function exportarPartidoPDF(partidoId) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const { data: p } = await supabaseClient.from('matches').select('*').eq('id', partidoId).single();
            const { data: stats } = await supabaseClient.from('match_player_stats').select('*, players(name, position)').eq('match_id', partidoId).order('minutes_played', { ascending: false });
            
            const fecha = new Date(p.match_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            
            // Header
            doc.setFillColor(5, 150, 105);
            doc.rect(0, 0, 210, 50, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('ACTA DEL PARTIDO', 105, 20, { align: 'center' });
            doc.setFontSize(12);
            doc.text(fecha, 105, 32, { align: 'center' });
            doc.text(p.competition || 'Partido', 105, 42, { align: 'center' });
            
            // Resultado
            doc.setTextColor(30, 30, 30);
            doc.setFontSize(16);
            const esLocal = p.home_away === 'home';
            const eqLocal = esLocal ? (clubData?.name || 'Mi Equipo') : p.opponent;
            const eqVisit = esLocal ? p.opponent : (clubData?.name || 'Mi Equipo');
            const gLocal = esLocal ? (p.team_goals || 0) : (p.opponent_goals || 0);
            const gVisit = esLocal ? (p.opponent_goals || 0) : (p.team_goals || 0);
            
            doc.text(eqLocal, 50, 70, { align: 'center' });
            doc.text(eqVisit, 160, 70, { align: 'center' });
            doc.setFontSize(32);
            doc.text(`${gLocal} - ${gVisit}`, 105, 72, { align: 'center' });
            doc.setFontSize(10);
            doc.text('LOCAL', 50, 78, { align: 'center' });
            doc.text('VISITANTE', 160, 78, { align: 'center' });
            
            let y = 95;
            if (p.stadium) { doc.text(`Estadio: ${p.stadium}`, 20, y); y += 8; }
            if (p.round) { doc.text(`${p.round}`, 20, y); y += 8; }
            
            if (stats && stats.length > 0) {
                y += 10;
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('ESTADISTICAS POR JUGADOR', 105, y, { align: 'center' });
                y += 10;
                
                const tableData = stats.map(s => [
                    s.players?.name || 'Sin nombre',
                    s.players?.position || '',
                    s.minutes_played || 0,
                    s.goals || 0,
                    s.assists || 0,
                    s.yellow_cards || 0,
                    s.red_cards || 0
                ]);
                
                doc.autoTable({
                    startY: y,
                    head: [['Jugador', 'Pos', 'Min', 'Goles', 'Asist', 'TA', 'TR']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: { fillColor: [5, 150, 105] },
                    styles: { fontSize: 9 }
                });
            }
            
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Generado con HUB TopLiderCoach', 105, 285, { align: 'center' });
            
            doc.save(`partido_${p.opponent}_${p.match_date}.pdf`);
        }
        
        async function exportarEstadisticasPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const tempId = document.getElementById('stats-temporada').value || seasonId;
            const { data: temp } = await supabaseClient.from('seasons').select('name').eq('id', tempId).single();
            const { data: partidos } = await supabaseClient.from('matches').select('*').eq('season_id', tempId).not('result', 'is', null);
            
            const victorias = partidos?.filter(p => p.result === 'win').length || 0;
            const empates = partidos?.filter(p => p.result === 'draw').length || 0;
            const derrotas = partidos?.filter(p => p.result === 'loss').length || 0;
            const gF = partidos?.reduce((sum, p) => sum + (p.team_goals || 0), 0) || 0;
            const gC = partidos?.reduce((sum, p) => sum + (p.opponent_goals || 0), 0) || 0;
            
            const { data: stats } = await supabaseClient.from('match_player_stats').select('*, players(name, position), matches!inner(season_id)').eq('matches.season_id', tempId);
            
            const jugadorStats = {};
            (stats || []).forEach(s => {
                const pid = s.player_id;
                if (!jugadorStats[pid]) jugadorStats[pid] = { name: s.players?.name, pos: s.players?.position, pj: 0, min: 0, goles: 0, asist: 0, ta: 0, tr: 0 };
                if (s.minutes_played > 0) jugadorStats[pid].pj++;
                jugadorStats[pid].min += s.minutes_played || 0;
                jugadorStats[pid].goles += s.goals || 0;
                jugadorStats[pid].asist += s.assists || 0;
                jugadorStats[pid].ta += s.yellow_cards || 0;
                jugadorStats[pid].tr += s.red_cards || 0;
            });
            
            // Header
            doc.setFillColor(5, 150, 105);
            doc.rect(0, 0, 210, 45, 'F');
            doc.setTextColor(255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('ESTADISTICAS DE TEMPORADA', 105, 20, { align: 'center' });
            doc.setFontSize(14);
            doc.text(`${clubData?.name || 'Mi Club'} - ${temp?.name || 'Temporada'}`, 105, 35, { align: 'center' });
            
            doc.setTextColor(30);
            doc.setFontSize(11);
            let y = 60;
            doc.setFont('helvetica', 'bold');
            doc.text('RESUMEN', 20, y);
            y += 10;
            doc.setFont('helvetica', 'normal');
            doc.text(`Partidos: ${partidos?.length || 0}  |  V: ${victorias}  |  E: ${empates}  |  D: ${derrotas}  |  GF: ${gF}  |  GC: ${gC}`, 20, y);
            
            y += 20;
            const ordenados = Object.values(jugadorStats).sort((a, b) => b.goles - a.goles);
            const tableData = ordenados.map(j => [j.name, j.pos, j.pj, j.min, j.goles, j.asist, j.ta, j.tr]);
            
            doc.autoTable({
                startY: y,
                head: [['Jugador', 'Pos', 'PJ', 'Min', 'Goles', 'Asist', 'TA', 'TR']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [5, 150, 105] },
                styles: { fontSize: 9 }
            });
            
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Generado con HUB TopLiderCoach', 105, 285, { align: 'center' });
            
            doc.save(`estadisticas_${temp?.name || 'temporada'}.pdf`);
        }
        
