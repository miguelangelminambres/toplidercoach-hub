// ========== DASHBOARD.JS - TopLiderCoach HUB ==========
registrarModulo('dashboard', function() { cargarSelectorTemporadasDashboard(); cargarDashboard(); });
registrarInit(function() { cargarSelectorTemporadasDashboard(); cargarDashboard(); });

async function cargarSelectorTemporadasDashboard() {
    const select = document.getElementById('dashboard-temporada');
    if (!select) return;
    const { data: temporadas } = await supabaseClient.from('seasons').select('*').eq('club_id', clubId).order('start_date', { ascending: false });
    select.innerHTML = '<option value="">Todas</option>';
    if (temporadas) temporadas.forEach(t => { const o = document.createElement('option'); o.value = t.id; o.textContent = t.name; if (t.id === seasonId) o.selected = true; select.appendChild(o); });
}

async function cargarDashboard() {
    cargarHeroBanner();
    await cargarDatosPartidosDashboard();
    await cargarTopPerformers();
    await cargarEstadoPlantilla();
    await cargarDatosEntrenamientosDashboard();
    await cargarProximosEventos();
    await cargarAlertasWellness();
}

function cargarHeroBanner() {
    const logoEl = document.getElementById('dash-club-logo');
    const nameEl = document.getElementById('dash-club-name');
    if (clubData) {
        nameEl.textContent = clubData.name || 'Mi Equipo';
        logoEl.innerHTML = clubData.logo_url ? `<img src="${sanitizeURL(clubData.logo_url)}" alt="">` : '⚽';
    }
}

function actualizarHeroStats(pj,v,e,d,gf,gc) {
    document.getElementById('dh-pj').textContent = pj;
    document.getElementById('dh-v').textContent = v;
    document.getElementById('dh-e').textContent = e;
    document.getElementById('dh-d').textContent = d;
    document.getElementById('dh-gf').textContent = gf;
    document.getElementById('dh-gc').textContent = gc;
    const dif = gf - gc;
    const difEl = document.getElementById('dh-dif');
    difEl.textContent = (dif >= 0 ? '+' : '') + dif;
    difEl.style.color = dif >= 0 ? '#22c55e' : '#ef4444';
    document.getElementById('dh-pct').textContent = (pj > 0 ? Math.round((v/pj)*100) : 0) + '%';
}

async function cargarDatosPartidosDashboard() {
    const tempId = document.getElementById('dashboard-temporada')?.value || seasonId;
    let query = supabaseClient.from('matches').select('*').eq('club_id', clubId).order('match_date', { ascending: false });
    if (tempId) query = query.eq('season_id', tempId);
    const { data: partidos } = await query;
    if (!partidos || partidos.length === 0) { actualizarHeroStats(0,0,0,0,0,0); mostrarSinDatosPartidos(); return; }
    const pj = partidos.filter(p => p.result);
    const v = pj.filter(p => p.result === 'win').length, e = pj.filter(p => p.result === 'draw').length, d = pj.filter(p => p.result === 'loss').length;
    const gf = pj.reduce((s,p) => s + (p.team_goals||0), 0), gc = pj.reduce((s,p) => s + (p.opponent_goals||0), 0);
    actualizarHeroStats(pj.length, v, e, d, gf, gc);
    const difEl = document.getElementById('dash-diferencia-goles');
    if (difEl) { difEl.textContent = (gf-gc >= 0 ? '+' : '') + (gf-gc); difEl.style.color = gf>=gc ? '#22c55e' : '#ef4444'; }
    const jugados = pj.slice(0,5), pend = partidos.filter(p => !p.result).reverse().slice(0,5);
    mostrarUltimosPartidos([...jugados,...pend].sort((a,b) => new Date(a.match_date)-new Date(b.match_date)).slice(-10));
    crearGraficosResultadosPorCompeticion(pj);
    crearGraficoGoles(gf, gc);
}

function mostrarSinDatosPartidos() {
    const d = document.getElementById('dash-diferencia-goles'); if(d) d.textContent = '+0';
    document.getElementById('dash-ultimos-partidos').innerHTML = '<div class="sin-datos"><div class="icono">⚽</div><p>No hay partidos registrados</p></div>';
    crearGraficosResultadosPorCompeticion([]);
    crearGraficoGoles(0, 0);
}

// ========== TOP PERFORMERS ==========
async function cargarTopPerformers() {
    const tempId = document.getElementById('dashboard-temporada')?.value || seasonId;
    const grid = document.getElementById('dash-perf-grid');
    const container = document.getElementById('dash-performers');
    if (!grid || !tempId) { if(container) container.style.display='none'; return; }
    const { data: stats } = await supabaseClient.from('match_player_stats').select('player_id, minutes_played, goals, assists, yellow_cards, red_cards, matches!inner(season_id)').eq('matches.season_id', tempId);
    if (!stats || stats.length === 0) { container.style.display='none'; return; }
    const agg = {};
    stats.forEach(s => { const pid = s.player_id; if (!agg[pid]) agg[pid]={pj:0,min:0,g:0,a:0}; if(s.minutes_played>0) agg[pid].pj++; agg[pid].min+=s.minutes_played||0; agg[pid].g+=s.goals||0; agg[pid].a+=s.assists||0; });
    const playerIds = Object.keys(agg);
    const { data: players } = await supabaseClient.from('players').select('id, name, photo_url, position').in('id', playerIds);
    const pm = {}; (players||[]).forEach(p => pm[p.id]=p);
    const topG = Object.entries(agg).sort((a,b)=>b[1].g-a[1].g)[0];
    const topA = Object.entries(agg).sort((a,b)=>b[1].a-a[1].a)[0];
    const topM = Object.entries(agg).sort((a,b)=>b[1].min-a[1].min)[0];
    const topP = Object.entries(agg).sort((a,b)=>b[1].pj-a[1].pj)[0];
    const perfs = [
        {label:'Máx. Goleador',icon:'⚽',pid:topG?.[0],val:topG?.[1]?.g||0,unit:'goles',color:'#22c55e'},
        {label:'Máx. Asistente',icon:'👟',pid:topA?.[0],val:topA?.[1]?.a||0,unit:'asist.',color:'#3b82f6'},
        {label:'Más Minutos',icon:'⏱️',pid:topM?.[0],val:topM?.[1]?.min||0,unit:'min',color:'#8b5cf6'},
        {label:'Más Partidos',icon:'🏟️',pid:topP?.[0],val:topP?.[1]?.pj||0,unit:'PJ',color:'#f59e0b'}
    ];
    if (!perfs.some(p=>p.val>0)) { container.style.display='none'; return; }
    container.style.display = '';
    grid.innerHTML = perfs.filter(p=>p.val>0).map(p => {
        const pl = pm[p.pid]||{};
        const nombre = pl.name ? escapeHTML(pl.name.split(' ').pop().toUpperCase()) : '—';
        const foto = pl.photo_url ? `<img src="${sanitizeURL(pl.photo_url)}" alt="">` : `<div class="dash-perf-nofoto">${escapeHTML((pl.name||'?').charAt(0))}</div>`;
        return `<div class="dash-perf-card" style="--perf-color:${escapeAttr(p.color)}"><div class="dash-perf-foto">${foto}</div><div class="dash-perf-info"><div class="dash-perf-name">${nombre}</div><div class="dash-perf-pos">${escapeHTML(pl.position||'')}</div></div><div class="dash-perf-stat"><span class="dash-perf-val">${parseInt(p.val)||0}</span><span class="dash-perf-unit">${escapeHTML(p.unit)}</span></div><div class="dash-perf-label">${escapeHTML(p.icon)} ${escapeHTML(p.label)}</div></div>`;
    }).join('');
}

// ========== ESTADO PLANTILLA ==========
async function cargarEstadoPlantilla() {
    const c = document.getElementById('dash-squad-status'); if(!c) return;
    const { data: sp } = await supabaseClient.from('season_players').select('shirt_number, players(id, name, photo_url, position, status)').eq('season_id', seasonId).order('shirt_number');
    if (!sp || sp.length===0) { c.innerHTML='<div class="sin-datos"><div class="icono">👥</div><p>Sin plantilla</p></div>'; return; }
    const inj = sp.filter(s=>s.players?.status==='injured'), sus = sp.filter(s=>s.players?.status==='suspended'), avail = sp.filter(s=>s.players?.status==='available'||!s.players?.status);
    if (inj.length===0 && sus.length===0) { c.innerHTML=`<div class="dash-squad-ok"><div class="dash-squad-ok-icon">✅</div><div class="dash-squad-ok-text">Plantilla completa</div><div class="dash-squad-ok-count">${avail.length} disponibles</div></div>`; return; }
    let html = `<div class="dash-squad-summary"><span class="dash-sq-avail">${avail.length} disp.</span>${inj.length?`<span class="dash-sq-inj">${inj.length} lesion.</span>`:''}${sus.length?`<span class="dash-sq-sus">${sus.length} sanc.</span>`:''}</div>`;
    [...inj.map(s=>({...s,tipo:'injured'})),...sus.map(s=>({...s,tipo:'suspended'}))].forEach(s => {
        const j=s.players||{};
        const foto=j.photo_url?`<img src="${sanitizeURL(j.photo_url)}" alt="">`:`<span>${escapeHTML((j.name||'?').charAt(0))}</span>`;
        html+=`<div class="dash-sq-player ${s.tipo==='injured'?'inj':'sus'}"><div class="dash-sq-foto">${foto}</div><div class="dash-sq-info"><div class="dash-sq-name">${escapeHTML(j.name||'')}</div><div class="dash-sq-pos">${escapeHTML(j.position||'')} · #${escapeHTML(s.shirt_number||'-')}</div></div><div class="dash-sq-badge ${s.tipo==='injured'?'inj':'sus'}">${s.tipo==='injured'?'🏥 Lesión':'⛔ Sanción'}</div></div>`;
    });
    c.innerHTML = html;
}

// ========== ÚLTIMOS PARTIDOS ==========
function mostrarUltimosPartidos(partidos) {
    const c = document.getElementById('dash-ultimos-partidos');
    if (!partidos||partidos.length===0) { c.innerHTML='<div class="sin-datos"><div class="icono">⚽</div><p>No hay partidos</p></div>'; return; }
    const miEsc = clubData?.logo_url?`<img src="${sanitizeURL(clubData.logo_url)}" alt="" class="escudo-mini">`:'<span class="escudo-placeholder">🏠</span>';
    const miN = escapeHTML(clubData?.name||'Mi Equipo');
    c.innerHTML = partidos.map(p => {
        const loc=p.home_away==='home', jug=!!p.result;
        const fechaStr = new Date(p.match_date).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
        let comp = escapeHTML(p.competition||''); if(comp&&p.round) comp+='. '+escapeHTML(p.round);
        const rivEsc = p.opponent_logo?`<img src="${sanitizeURL(p.opponent_logo)}" alt="" class="escudo-mini">`:'<span class="escudo-placeholder">🏟️</span>';
        const safeId = isValidId(p.id) ? escapeAttr(p.id) : '';
        let centro='';
        if(jug){const gf=parseInt(p.team_goals)||0,gc=parseInt(p.opponent_goals)||0;centro=`<span class="match-score">${loc?gf+'-'+gc:gc+'-'+gf}</span>`;}
        else{centro=`<span class="match-time">${p.kick_off_time?escapeHTML(p.kick_off_time.slice(0,5)):'TBD'}</span>`;}
        const badge=jug?`<span class="match-badge badge-${p.result==='win'?'win':p.result==='draw'?'draw':'loss'}"></span>`:'';
        const opp = escapeHTML(p.opponent);
        return `<div class="match-row ${jug?'played':'upcoming'}" onclick="verPartido('${safeId}')">${badge}${comp?`<div class="match-competition">${comp}</div>`:''}<div class="match-teams"><div class="match-team left"><span class="team-name">${loc?miN:opp}</span>${loc?miEsc:rivEsc}</div><div class="match-center">${centro}</div><div class="match-team right">${loc?rivEsc:miEsc}<span class="team-name">${loc?opp:miN}</span></div></div><div class="match-date">${escapeHTML(fechaStr)}</div></div>`;
    }).join('');
}

// ========== CHARTS ==========
let chartsCompeticion = [];
function crearGraficosResultadosPorCompeticion(pj) {
    chartsCompeticion.forEach(c=>c.destroy()); chartsCompeticion=[];
    const tv=pj.filter(p=>p.result==='win').length,te=pj.filter(p=>p.result==='draw').length,td=pj.filter(p=>p.result==='loss').length,tp=tv+te+td;
    const ctx=document.getElementById('chart-resultados-total');
    if(ctx){const ch=crearDonut(ctx,tv,te,td);if(ch)chartsCompeticion.push(ch);}
    const st=document.getElementById('stats-total');if(st)st.innerHTML=`<span class="donut-stat-line">${tp}PJ · ${tv}V · ${te}E · ${td}D</span>`;
    const porComp={};pj.forEach(p=>{const c=p.competition||'Sin clasificar';if(!porComp[c])porComp[c]=[];porComp[c].push(p);});
    const cont=document.getElementById('donuts-competiciones');if(!cont)return;cont.innerHTML='';
    Object.keys(porComp).sort().forEach(comp=>{
        const ps=porComp[comp],v=ps.filter(p=>p.result==='win').length,e=ps.filter(p=>p.result==='draw').length,d=ps.filter(p=>p.result==='loss').length,n=v+e+d;
        const cid='chart-comp-'+comp.replace(/\s+/g,'-').toLowerCase();
        const w=document.createElement('div');w.className='resultado-donut mini';
        w.innerHTML=`<canvas id="${cid}"></canvas><div class="donut-label">${comp}</div><div class="donut-stats"><span class="donut-stat-line">${n}PJ·${v}V·${e}E·${d}D</span></div>`;
        cont.appendChild(w);const cx=document.getElementById(cid);if(cx){const ch=crearDonut(cx,v,e,d);if(ch)chartsCompeticion.push(ch);}
    });
}

function crearDonut(ctx,vic,emp,der) {
    const t=vic+emp+der;
    if(t===0) return new Chart(ctx,{type:'doughnut',data:{labels:['Sin partidos'],datasets:[{data:[1],backgroundColor:['#e5e7eb'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:false},tooltip:{enabled:false}}}});
    const ctp={id:'centerText',afterDraw:function(chart){const{ctx:c,chartArea}=chart;const cx=(chartArea.left+chartArea.right)/2,cy=(chartArea.top+chartArea.bottom)/2;c.save();c.textAlign='center';c.textBaseline='middle';const big=chart.canvas.parentElement.classList.contains('principal');c.font='bold '+(big?'22px':'16px')+' system-ui';c.fillStyle='#22c55e';c.fillText(Math.round((vic/t)*100)+'%',cx,cy-6);c.font=(big?'11px':'9px')+' system-ui';c.fillStyle='#9ca3af';c.fillText('victorias',cx,cy+12);c.restore();}};
    return new Chart(ctx,{type:'doughnut',data:{labels:['Victorias','Empates','Derrotas'],datasets:[{data:[vic,emp,der],backgroundColor:['#22c55e','#f59e0b','#ef4444'],borderWidth:2,borderColor:'#fff',hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:true,cutout:'68%',plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return c.label+': '+c.raw+' ('+Math.round((c.raw/t)*100)+'%)';}}}}},plugins:[ctp]});
}

function crearGraficoGoles(f,c) {
    const ctx=document.getElementById('chart-goles');if(!ctx)return;
    if(chartGoles)chartGoles.destroy();
    chartGoles=new Chart(ctx,{type:'bar',data:{labels:['A favor','En contra','Diferencia'],datasets:[{data:[f,c,f-c],backgroundColor:['#22c55e','#ef4444',f>=c?'#3b82f6':'#f97316'],borderRadius:8,barThickness:50}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#f0f0f0'}},x:{grid:{display:false}}}}});
}

// ========== ENTRENAMIENTOS ==========
async function cargarDatosEntrenamientosDashboard() {
    const now=new Date(),ini=new Date(now.getFullYear(),now.getMonth(),1).toISOString().split('T')[0],fin=new Date(now.getFullYear(),now.getMonth()+1,0).toISOString().split('T')[0];
    const{data:ses}=await supabaseClient.from('training_sessions').select('id').eq('club_id',clubId).gte('session_date',ini).lte('session_date',fin);
    const n=ses?.length||0;document.getElementById('dash-sesiones').textContent=n;
    if(n===0){document.getElementById('dash-asistencia-media').textContent='-';document.getElementById('dash-wellness-medio').textContent='-';return;}
    const{data:att}=await supabaseClient.from('attendance').select('asistio, wellness').in('sesion_id',ses.map(s=>s.id));
    if(att&&att.length>0){const tot=att.length,ok=att.filter(a=>a.asistio).length;document.getElementById('dash-asistencia-media').textContent=Math.round((ok/tot)*100)+'%';const wv=att.filter(a=>a.wellness).map(a=>a.wellness);document.getElementById('dash-wellness-medio').textContent=wv.length>0?(wv.reduce((a,b)=>a+b,0)/wv.length).toFixed(1):'-';}
    else{document.getElementById('dash-asistencia-media').textContent='-';document.getElementById('dash-wellness-medio').textContent='-';}
}

// ========== PRÓXIMOS EVENTOS ==========
async function cargarProximosEventos() {
    const c=document.getElementById('dash-proximos-eventos');const hoy=new Date().toISOString().split('T')[0];
    const{data:pa}=await supabaseClient.from('matches').select('*').eq('club_id',clubId).gte('match_date',hoy).is('result',null).order('match_date').limit(3);
    const{data:se}=await supabaseClient.from('training_sessions').select('*').eq('club_id',clubId).gte('session_date',hoy).order('session_date').limit(3);
    const ev=[];
    (pa||[]).forEach(p=>ev.push({tipo:'partido',fecha:p.match_date,titulo:`vs ${escapeHTML(p.opponent)}`,sub:p.home_away==='home'?'Local':'Visitante',hora:p.kick_off_time?escapeHTML(p.kick_off_time.slice(0,5)):''}));
    (se||[]).forEach(s=>ev.push({tipo:'sesion',fecha:s.session_date,titulo:escapeHTML(s.name),sub:escapeHTML(s.objective||'Entrenamiento'),hora:s.hora_inicio?escapeHTML(s.hora_inicio):''}));
    ev.sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
    if(ev.length===0){c.innerHTML='<div class="sin-datos"><div class="icono">📅</div><p>No hay eventos próximos</p></div>';return;}
    c.innerHTML=ev.slice(0,5).map(e=>{const f=new Date(e.fecha);return`<div class="evento-item ${escapeAttr(e.tipo)}"><div class="evento-fecha"><div class="dia">${f.getDate()}</div><div class="mes">${f.toLocaleDateString('es-ES',{month:'short'}).toUpperCase()}</div></div><div class="evento-info"><div class="titulo">${e.titulo}</div><div class="subtitulo">${e.sub}${e.hora?' - '+e.hora:''}</div></div><div class="evento-tipo ${escapeAttr(e.tipo)}">${e.tipo==='partido'?'⚽':'🏃'}</div></div>`;}).join('');
}

// ========== ALERTAS WELLNESS ==========
async function cargarAlertasWellness() {
    const c=document.getElementById('dash-alertas-wellness');
    const{data:us}=await supabaseClient.from('training_sessions').select('id').eq('club_id',clubId).order('session_date',{ascending:false}).limit(1).single();
    if(!us){c.innerHTML='<div class="sin-datos"><div class="icono">✅</div><p>Sin datos recientes</p></div>';return;}
    const{data:att}=await supabaseClient.from('attendance').select('wellness, estado_muscular, jugador_id, players(name)').eq('sesion_id',us.id).eq('asistio',true);
    if(!att||att.length===0){c.innerHTML='<div class="sin-datos"><div class="icono">✅</div><p>Sin registros</p></div>';return;}
    const al=[];
    att.forEach(a=>{if(a.wellness&&a.wellness<=5)al.push({j:a.players?.name||'Jugador',t:'Wellness bajo',v:parseInt(a.wellness)||0,cl:a.wellness<=3?'':'warning'});if(a.estado_muscular&&a.estado_muscular>=6)al.push({j:a.players?.name||'Jugador',t:'Daño muscular',v:parseInt(a.estado_muscular)||0,cl:a.estado_muscular>=8?'':'warning'});});
    if(al.length===0){c.innerHTML='<div class="sin-datos"><div class="icono">✅</div><p>¡Equipo en buenas condiciones!</p></div>';return;}
    c.innerHTML=al.slice(0,5).map(a=>`<div class="alerta-item ${escapeAttr(a.cl)}"><div><div class="jugador-nombre">${escapeHTML(a.j)}</div><div class="alerta-detalle">${escapeHTML(a.t)}</div></div><div class="valor">${parseInt(a.v)||0}</div></div>`).join('');
}