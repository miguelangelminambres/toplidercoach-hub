// ========== PLANPARTIDO.JS - TopLiderCoach HUB ==========
var pp = {planActual:null,partidoActual:null,rivalActual:null,jugadorEditIdx:-1,semana:{dias:[],sesiones:[],microciclo:null},objEditIdx:-1,plantilla:[],abpEditIdx:-1};
var PP_POSICIONES = ['Portero','Lateral Dcho.','Lateral Izdo.','Central','Central Dcho.','Central Izdo.','LT Dcho.','LT Izdo.','Mediocentro','MCD','MCO','Mediapunta','Interior','Ext Dcho.','Ext Izdo.','Delantero','2º Punta'];
var PP_LINEAS = {porteros:{label:'Porteros',color:'#22c55e',posiciones:['Portero']},defensas:{label:'Linea defensiva',color:'#3b82f6',posiciones:['Lateral Dcho.','Lateral Izdo.','Central','Central Dcho.','Central Izdo.','LT Dcho.','LT Izdo.']},medios:{label:'Linea medio campo',color:'#f59e0b',posiciones:['Mediocentro','MCD','MCO','Mediapunta','Interior']},delanteros:{label:'Linea delanteros',color:'#ef4444',posiciones:['Ext Dcho.','Ext Izdo.','Delantero','2º Punta']}};
var PP_FASES_DEFAULT = [{id:'fo_saque',title:'Fase ofensiva: saque portero',notes:'',media:[]},{id:'fo_posicional',title:'Fase ofensiva: ataque posicional',notes:'',media:[]},{id:'tad',title:'Transicion ataque - defensa',notes:'',media:[]},{id:'fd_saque',title:'Fase defensiva: saque portero rival',notes:'',media:[]},{id:'fd_posicional',title:'Fase defensiva: defensa posicional',notes:'',media:[]},{id:'tda',title:'Transicion defensa - ataque',notes:'',media:[]}];
var PP_ORIENTACIONES = ['Descanso','Introduccion Aerobica','Fuerza','Resistencia','Velocidad','Activacion','Tactica','Recuperacion'];
var PP_CONTENIDOS = [
    {id:'indoor_pre',label:'Indoor / Pre sesion',color:'#f97316'},
    {id:'activador',label:'Activador Campo',color:'#eab308'},
    {id:'principales',label:'Principales Campo',color:'#22c55e'},
    {id:'post',label:'Post Sesion',color:'#3b82f6'}
];
var PP_MAX_MEDIA_POR_FASE = 8;
var _ppJugadorMedia = [];
var _ppAbpForm = null;
var _ppObjEjercicios = [];

var PP_OUR_SECTIONS = [
    {type:'title',label:'ASPECTOS OFENSIVOS',color:'#22c55e'},
    {id:'of_reinicios',title:'Reinicios del juego desde portero',color:'#22c55e'},
    {id:'of_construccion',title:'Construccion del juego',color:'#22c55e'},
    {id:'of_posesion',title:'Posesion zona intermedia',color:'#22c55e'},
    {id:'of_finalizacion',title:'Juego en zona de finalizacion',color:'#22c55e'},
    {type:'title',label:'ASPECTOS DEFENSIVOS',color:'#3b82f6'},
    {id:'df_reinicios',title:'Presion a reinicios del juego',color:'#3b82f6'},
    {id:'df_presion',title:'Presion alta',color:'#3b82f6'},
    {id:'df_medio',title:'Bloque medio',color:'#3b82f6'},
    {id:'df_bajo',title:'Bloque bajo',color:'#3b82f6'},
    {type:'title',label:'TRANSICIONES',color:'#f59e0b'},
    {id:'tr_of_df',title:'Transicion ofensivo a defensivo',color:'#f59e0b'},
    {id:'tr_df_of',title:'Transicion defensivo a ofensivo',color:'#f59e0b'},
    {type:'title',label:'CONSIGNAS',color:'#a855f7'},
    {id:'consignas',title:'Consignas principales / Resumen',color:'#a855f7'}
];

var PP_ABP_ROLES_OF = ['remate','ejecuta','rechace','atras','en_corto'];
var PP_ABP_ROLES_OF_LABELS = {remate:'Remate',ejecuta:'Ejecuta',rechace:'Rechace',atras:'Atras',en_corto:'En corto'};
var PP_ABP_ROLES_DF = ['palo','corta','al_saque','zona','rechace','arriba'];
var PP_ABP_ROLES_DF_LABELS = {palo:'Palo',corta:'Corta',al_saque:'Al saque',zona:'Zona',rechace:'Rechace',arriba:'Arriba'};

// === UTILIDADES ===
function ppEsc(s){if(!s)return '';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function ppSelectFormacion(id,val,onch){var fs=['1-4-3-3','1-4-4-2','1-4-2-3-1','1-4-1-4-1','1-3-5-2','1-3-4-3','1-5-3-2','1-5-4-1','1-4-5-1','1-4-4-1-1'];var h='<select id="'+id+'" onchange="'+onch+'" style="width:100%;max-width:300px;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:14px"><option value="">Seleccionar...</option>';fs.forEach(function(f){h+='<option value="'+f+'"'+(val===f?' selected':'')+'>'+f+'</option>'});return h+'</select>'}
function ppComprimirImagen(file,maxW){return new Promise(function(resolve,reject){var img=new Image();img.onload=function(){var w=img.width,h=img.height;if(w>maxW){h=Math.round(h*(maxW/w));w=maxW}var c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);resolve(c.toDataURL('image/jpeg',0.85))};img.onerror=function(){reject(new Error('Error imagen'))};img.src=URL.createObjectURL(file)})}
async function ppGuardarCampo(campo,valor){if(!pp.planActual)return;try{var up={updated_at:new Date().toISOString()};up[campo]=valor||null;var{error}=await supabaseClient.from('match_plans').update(up).eq('id',pp.planActual.id);if(error)throw error;pp.planActual[campo]=valor||null}catch(e){showToast('Error: '+e.message)}}

async function ppCargarPlantilla(){if(!seasonId)return;try{var{data,error}=await supabaseClient.from('season_players').select('id,shirt_number,players(name,position,photo_url)').eq('season_id',seasonId).order('shirt_number',{ascending:true});if(error)throw error;pp.plantilla=(data||[]).map(function(sp){return{id:String(sp.id),number:sp.shirt_number,name:sp.players?sp.players.name:'?',position:sp.players?sp.players.position:'',photo:sp.players?sp.players.photo_url:''}})}catch(e){pp.plantilla=[]}}

// === VISOR ===
function ppMostrarVisor(src){var prev=document.getElementById('pp-img-viewer');if(prev)prev.remove();var ov=document.createElement('div');ov.id='pp-img-viewer';ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer';ov.onclick=function(){ov.remove()};ov.innerHTML='<img src="'+src+'" style="max-width:90%;max-height:90%;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.5)"><div style="position:absolute;top:16px;right:20px;color:#fff;font-size:24px;cursor:pointer">✕</div>';document.body.appendChild(ov)}
function ppVerImagen(i){var m=_ppJugadorMedia[i];if(m&&m.url)ppMostrarVisor(m.url)}
function ppVerImagenFase(fi,mi){var f=ppGetFases();if(f[fi]&&f[fi].media&&f[fi].media[mi])ppMostrarVisor(f[fi].media[mi].url)}
function ppVerImagenOur(secId,mi){var phases=ppGetOurPhases();var sec=phases[secId];if(sec&&sec.media&&sec.media[mi])ppMostrarVisor(sec.media[mi].url)}

// === SUBIDA GENERICA ===
async function ppSubirArchivo(file,title,btn,pa,pb,pt,callback){if(file.size>50*1024*1024){showToast('Max 50MB');return}btn.disabled=true;btn.textContent='Preparando...';pa.style.display='block';pb.style.width='30%';pt.textContent='Leyendo...';try{if(file.type.startsWith('image/')){pb.style.width='60%';pt.textContent='Comprimiendo...';var dataUrl=await ppComprimirImagen(file,1200);pb.style.width='100%';pt.textContent='Listo';callback(dataUrl,'image')}else{var b64=await new Promise(function(r,j){var rd=new FileReader();rd.onload=function(){r(rd.result.split(',')[1])};rd.onerror=function(){j(new Error('Error'))};rd.readAsDataURL(file)});pb.style.width='50%';pt.textContent='Subiendo...';btn.textContent='Subiendo...';var res=await fetch('https://toplidercoach.com/wp-content/uploads/ejercicios/upload-video.php',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer toplider_thumb_2026'},body:JSON.stringify({video:b64,id:'pp_'+Date.now()})});pb.style.width='90%';pt.textContent='Procesando...';var data=await res.json();if(data.ok&&data.url){pb.style.width='100%';callback(data.url,'video')}else throw new Error(data.error||'Error')}}catch(e){showToast('Error: '+e.message);btn.disabled=false;btn.textContent='Subir archivo'}}

// === MODAL MEDIA ===
function ppAbrirModalMedia(overlayId,onSave){var prev=document.getElementById(overlayId);if(prev)prev.remove();var ov=document.createElement('div');ov.id=overlayId;ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';ov.onclick=function(e){if(e.target===ov)ov.remove()};ov.innerHTML='<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;max-width:480px;width:100%;padding:24px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 style="margin:0;color:#e2e8f0;font-size:16px">Añadir video o imagen</h3><button onclick="document.getElementById(\''+overlayId+'\').remove()" style="background:none;border:none;color:#9ca3af;font-size:20px;cursor:pointer">✕</button></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px"><button onclick="ppModalMediaModo(\''+overlayId+'\',\'url\')" id="'+overlayId+'-btn-url" style="padding:16px;background:#1e3a5f;border:2px solid #3b82f6;color:#93c5fd;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600">🔗 Pegar URL</button><button onclick="ppModalMediaModo(\''+overlayId+'\',\'file\')" id="'+overlayId+'-btn-file" style="padding:16px;background:#1e293b;border:2px solid #334155;color:#9ca3af;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600">📁 Subir archivo</button></div><div id="'+overlayId+'-url-area"><div style="margin-bottom:10px"><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">URL</label><input type="text" id="'+overlayId+'-url" placeholder="https://..." style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div style="margin-bottom:12px"><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">Titulo</label><input type="text" id="'+overlayId+'-title" style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><button id="'+overlayId+'-url-btn" style="width:100%;padding:10px;background:#3b82f6;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">Añadir</button></div><div id="'+overlayId+'-file-area" style="display:none"><div style="margin-bottom:10px"><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">Titulo</label><input type="text" id="'+overlayId+'-file-title" style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div style="margin-bottom:12px"><input type="file" id="'+overlayId+'-file-input" accept="video/*,image/*" style="width:100%;padding:8px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div id="'+overlayId+'-progress" style="display:none;margin-bottom:12px"><div style="background:#1e293b;border-radius:4px;overflow:hidden;height:6px"><div id="'+overlayId+'-pbar" style="height:100%;background:#3b82f6;width:0%;transition:width 0.3s"></div></div><div id="'+overlayId+'-ptext" style="font-size:11px;color:#64748b;margin-top:4px;text-align:center"></div></div><button id="'+overlayId+'-upload-btn" style="width:100%;padding:10px;background:#f97316;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">Subir archivo</button></div></div>';document.body.appendChild(ov);document.getElementById(overlayId+'-url-btn').onclick=function(){var url=document.getElementById(overlayId+'-url').value.trim();if(!url){showToast('URL obligatoria');return}var title=document.getElementById(overlayId+'-title').value.trim()||'';var tipo='link';if(url.match(/\.(mp4|mov|webm)$/i)||url.indexOf('youtube')>=0||url.indexOf('youtu.be')>=0||url.indexOf('veo.co')>=0)tipo='video';else if(url.match(/\.(jpg|jpeg|png|gif|webp)$/i))tipo='image';onSave(url,title,tipo);document.getElementById(overlayId).remove()};document.getElementById(overlayId+'-upload-btn').onclick=function(){var fi=document.getElementById(overlayId+'-file-input');var file=fi.files[0];if(!file){showToast('Selecciona archivo');return}var title=document.getElementById(overlayId+'-file-title').value.trim()||file.name;ppSubirArchivo(file,title,document.getElementById(overlayId+'-upload-btn'),document.getElementById(overlayId+'-progress'),document.getElementById(overlayId+'-pbar'),document.getElementById(overlayId+'-ptext'),function(url,tipo){onSave(url,title,tipo);document.getElementById(overlayId).remove()})}}
function ppModalMediaModo(oid,m){var u=document.getElementById(oid+'-url-area'),f=document.getElementById(oid+'-file-area'),bu=document.getElementById(oid+'-btn-url'),bf=document.getElementById(oid+'-btn-file');if(m==='url'){u.style.display='block';f.style.display='none';bu.style.background='#1e3a5f';bu.style.borderColor='#3b82f6';bu.style.color='#93c5fd';bf.style.background='#1e293b';bf.style.borderColor='#334155';bf.style.color='#9ca3af'}else{u.style.display='none';f.style.display='block';bf.style.background='#1e3a5f';bf.style.borderColor='#f97316';bf.style.color='#fdba74';bu.style.background='#1e293b';bu.style.borderColor='#334155';bu.style.color='#9ca3af'}}

// === ALINEACION VISUAL ===
function ppParseFormacion(str){if(!str)return null;var nums=str.split('-').map(Number);if(nums.length<3)return null;var all=[];for(var i=0;i<nums.length;i++){var yP=i===0?88:88-(i*(73/(nums.length-1)));for(var j=0;j<nums[i];j++){var c=nums[i];var xP=c===1?50:c===2?35+j*30:c===3?22+j*28:c===4?14+j*24:10+j*(80/(c-1));all.push({slotId:i+'_'+j,x:xP,y:yP,lineIdx:i})}}return all}
// ========== SQUAD BUILDER — REEMPLAZA FUNCIONES DE ALINEACION ==========
// Sustituir en planpartido.js las funciones: ppRenderCampo, ppRenderAlineacion, ppAbrirSelectorSlot, ppAsignarSlot
// Busca cada funcion antigua y reemplazala por la nueva version aqui

// --- UTILIDAD: migrar formato viejo (valor unico) a nuevo (array) ---
function ppMigrarLineup(lineup){
    if(!lineup)return{};
    var nuevo={};
    Object.keys(lineup).forEach(function(k){
        var v=lineup[k];
        if(v===null||v===undefined){nuevo[k]=[]}
        else if(Array.isArray(v)){nuevo[k]=v}
        else{nuevo[k]=[v]}
    });
    return nuevo;
}

// --- RENDER CAMPO con listas de jugadores por posicion ---
function ppShowTooltip(evt,idx){var jug=pp.planActual.rival_players||[];var j=jug[idx];if(!j)return;var prev=document.getElementById('pp-tooltip');if(prev)prev.remove();var t=document.createElement('div');t.id='pp-tooltip';var info=[];if(j.position)info.push(j.position);if(j.foot)info.push('Pie: '+j.foot);if(j.year)info.push('Nac: '+j.year);var stats=[];if(j.games)stats.push('PJ:'+j.games);if(j.minutes)stats.push(j.minutes+"'");if(j.goals)stats.push(j.goals+' gol'+(j.goals>1?'es':''));t.innerHTML='<div style="font-weight:700;font-size:13px;margin-bottom:4px;color:#f59e0b">'+(j.number?'#'+j.number+' ':'')+ppEsc(j.name)+'</div>'+(info.length?'<div style="font-size:11px;color:#94a3b8;margin-bottom:4px">'+ppEsc(info.join(' · '))+'</div>':'')+(stats.length?'<div style="font-size:11px;color:#60a5fa;margin-bottom:4px">'+stats.join(' · ')+'</div>':'')+(j.analysis?'<div style="font-size:11px;color:#cbd5e1;line-height:1.4;max-height:80px;overflow:hidden">'+ppEsc(j.analysis)+'</div>':'');t.style.cssText='position:fixed;z-index:99999;background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;padding:10px 14px;max-width:260px;box-shadow:0 8px 24px rgba(0,0,0,0.6);pointer-events:none';var r=evt.target.getBoundingClientRect();t.style.left=Math.min(r.left,window.innerWidth-280)+'px';t.style.top=(r.top-10)+'px';t.style.transform='translateY(-100%)';document.body.appendChild(t)}
function ppHideTooltip(){var t=document.getElementById('pp-tooltip');if(t)t.remove()}
function ppRenderCampo(slots,lineup,jug,size){
    var lu=ppMigrarLineup(lineup);
    var click=size!=='big';
    var bw=size==='big'?3:2;
    var maxW=size==='big'?600:500;
    var h='<div style="position:relative;width:100%;max-width:'+maxW+'px;margin:0 auto;aspect-ratio:68/105;background:linear-gradient(180deg,#15803d 0%,#16a34a 25%,#15803d 50%,#16a34a 75%,#15803d 100%);border:'+bw+'px solid rgba(255,255,255,0.4);border-radius:12px;overflow:visible;box-shadow:inset 0 0 40px rgba(0,0,0,0.15)">';
    h+='<div style="position:absolute;top:50%;left:0;right:0;height:2px;background:rgba(255,255,255,0.35)"></div>';
    h+='<div style="position:absolute;top:50%;left:50%;width:90px;height:90px;border:2px solid rgba(255,255,255,0.3);border-radius:50%;transform:translate(-50%,-50%)"></div>';
    h+='<div style="position:absolute;top:50%;left:50%;width:6px;height:6px;background:rgba(255,255,255,0.4);border-radius:50%;transform:translate(-50%,-50%)"></div>';
    h+='<div style="position:absolute;top:0;left:50%;width:132px;height:44px;border:2px solid rgba(255,255,255,0.3);border-bottom:2px solid rgba(255,255,255,0.3);transform:translateX(-50%);border-top:none;border-radius:0 0 4px 4px"></div>';
    h+='<div style="position:absolute;top:0;left:50%;width:60px;height:20px;border:2px solid rgba(255,255,255,0.25);transform:translateX(-50%);border-top:none;border-radius:0 0 4px 4px"></div>';
    h+='<div style="position:absolute;bottom:0;left:50%;width:132px;height:44px;border:2px solid rgba(255,255,255,0.3);border-top:2px solid rgba(255,255,255,0.3);transform:translateX(-50%);border-bottom:none;border-radius:4px 4px 0 0"></div>';
    h+='<div style="position:absolute;bottom:0;left:50%;width:60px;height:20px;border:2px solid rgba(255,255,255,0.25);transform:translateX(-50%);border-bottom:none;border-radius:4px 4px 0 0"></div>';
    slots.forEach(function(s){
        var asignados=lu[s.slotId]||[];
        var tieneJugadores=asignados.length>0;
        var gk=s.lineIdx===0;
        h+='<div style="position:absolute;left:'+s.x+'%;top:'+s.y+'%;transform:translate(-50%,-50%);text-align:center;z-index:2;min-width:70px">';
        if(tieneJugadores){
            h+='<div style="display:flex;flex-direction:column;align-items:center;gap:2px">';
            asignados.forEach(function(pi){
                var p=(pi!==undefined&&pi!==null&&jug[pi])?jug[pi]:null;
                if(!p)return;
                var bg=gk?'linear-gradient(135deg,#d97706,#b45309)':'linear-gradient(135deg,#2563eb,#1d4ed8)';
                h+='<div'+(click?' onclick="ppAbrirSelectorSlot(\''+s.slotId+'\')"':'')+' onmouseenter="ppShowTooltip(event,'+pi+')" onmouseleave="ppHideTooltip()" style="background:'+bg+';padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;color:#fff;white-space:nowrap;cursor:'+(click?'pointer':'default')+';border:1px solid rgba(255,255,255,0.25);max-width:100px;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 8px rgba(0,0,0,0.4);letter-spacing:0.3px;transition:transform 0.15s;text-shadow:0 1px 2px rgba(0,0,0,0.3)" onmouseenter="this.style.transform=\'scale(1.08)\';ppShowTooltip(event,'+pi+')" onmouseleave="this.style.transform=\'scale(1)\';ppHideTooltip()">';
                h+=(p.number?p.number+'. ':'')+ppEsc(p.name.split(' ').pop());
                h+='</div>';
            });
            h+='</div>';
        }else{
            h+='<div'+(click?' onclick="ppAbrirSelectorSlot(\''+s.slotId+'\')"':'')+' style="width:34px;height:34px;background:rgba(255,255,255,0.12);border:2px dashed rgba(255,255,255,0.35);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:rgba(255,255,255,0.45);margin:0 auto;cursor:'+(click?'pointer':'default')+';transition:all 0.2s;box-shadow:0 2px 6px rgba(0,0,0,0.2)" onmouseenter="this.style.borderColor=\'rgba(255,255,255,0.7)\';this.style.background=\'rgba(255,255,255,0.2)\'" onmouseleave="this.style.borderColor=\'rgba(255,255,255,0.35)\';this.style.background=\'rgba(255,255,255,0.12)\'">+</div>';
        }
        h+='</div>';
    });
    return h+'</div>';
}

// --- RENDER ALINEACION (seccion scouting) ---
function ppRenderAlineacion(){
    var p=pp.planActual;
    if(!p||!p.rival_formation)return '<div style="padding:16px;background:#1e293b;border-radius:8px;text-align:center;color:#475569;font-size:12px;margin-top:12px">Selecciona formacion</div>';
    var s=ppParseFormacion(p.rival_formation);
    if(!s)return '';
    var lineup=ppMigrarLineup((p.weekly_map&&p.weekly_map.rival_lineup)||{});
    return '<div style="margin-top:16px"><h4 style="margin:0 0 10px;color:#e2e8f0;font-size:14px">Alineacion rival — '+p.rival_formation+'</h4><p style="margin:0 0 10px;font-size:11px;color:#64748b">Haz clic en una posicion para asignar jugadores. Puedes poner varios jugadores por posicion.</p>'+ppRenderCampo(s,lineup,p.rival_players||[],'normal')+'</div>';
}

// --- SELECTOR MULTI-JUGADOR ---
function ppAbrirSelectorSlot(slotId){
    var jug=pp.planActual.rival_players||[];
    if(!jug.length){showToast('Anade jugadores primero en la pestana Jugadores Rival');return}

    var lu=ppMigrarLineup((pp.planActual.weekly_map&&pp.planActual.weekly_map.rival_lineup)||{});
    var asignados=lu[slotId]||[];

    var prev=document.getElementById('pp-slot-overlay');if(prev)prev.remove();
    var ov=document.createElement('div');ov.id='pp-slot-overlay';
    ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
    ov.onclick=function(e){if(e.target===ov)ov.remove()};

    var h='<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;max-width:380px;width:100%;padding:20px;max-height:75vh;overflow-y:auto">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h4 style="margin:0;color:#e2e8f0;font-size:14px">Asignar jugadores a posicion</h4><button onclick="document.getElementById(\'pp-slot-overlay\').remove()" style="background:none;border:none;color:#9ca3af;font-size:18px;cursor:pointer">x</button></div>';
    h+='<p style="margin:0 0 12px;font-size:11px;color:#64748b">Marca los jugadores que pueden jugar en esta posicion. Puedes seleccionar varios.</p>';

    // Agrupar por linea
    var lineas=[
        {label:'Porteros',color:'#22c55e',poss:PP_LINEAS.porteros.posiciones},
        {label:'Defensas',color:'#3b82f6',poss:PP_LINEAS.defensas.posiciones},
        {label:'Medios',color:'#f59e0b',poss:PP_LINEAS.medios.posiciones},
        {label:'Delanteros',color:'#ef4444',poss:PP_LINEAS.delanteros.posiciones}
    ];

    lineas.forEach(function(lin){
        var jugLin=[];
        jug.forEach(function(j,idx){if(lin.poss.indexOf(j.position)>=0)jugLin.push({j:j,idx:idx})});
        if(!jugLin.length)return;

        h+='<div style="margin-bottom:10px"><div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><div style="width:3px;height:14px;background:'+lin.color+';border-radius:2px"></div><span style="font-size:11px;font-weight:700;color:'+lin.color+';text-transform:uppercase">'+lin.label+'</span></div>';
        jugLin.forEach(function(it){
            var checked=asignados.indexOf(it.idx)>=0;
            h+='<label style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:'+(checked?'#1e3a5f':'#1e293b')+';border:1px solid '+(checked?'#3b82f6':'#334155')+';border-radius:8px;margin-bottom:4px;cursor:pointer" onmouseenter="this.style.borderColor=\'#3b82f6\'" onmouseleave="this.style.borderColor=\''+(checked?'#3b82f6':'#334155')+'\'">';
            h+='<input type="checkbox" data-idx="'+it.idx+'" '+(checked?'checked':'')+' style="accent-color:#3b82f6;width:16px;height:16px">';
            h+='<div style="width:28px;height:28px;background:#0f172a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#f59e0b;flex-shrink:0">'+(it.j.number||'?')+'</div>';
            h+='<div><div style="font-size:13px;color:#e2e8f0;font-weight:600">'+ppEsc(it.j.name)+'</div><div style="font-size:10px;color:#94a3b8">'+ppEsc(it.j.position||'')+'</div></div>';
            h+='</label>';
        });
        h+='</div>';
    });

    // Jugadores sin posicion asignada
    var sinPos=[];
    jug.forEach(function(j,idx){
        var enLinea=false;
        lineas.forEach(function(lin){if(lin.poss.indexOf(j.position)>=0)enLinea=true});
        if(!enLinea)sinPos.push({j:j,idx:idx});
    });
    if(sinPos.length){
        h+='<div style="margin-bottom:10px"><div style="font-size:11px;font-weight:700;color:#9ca3af;margin-bottom:6px">OTROS</div>';
        sinPos.forEach(function(it){
            var checked=asignados.indexOf(it.idx)>=0;
            h+='<label style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:'+(checked?'#1e3a5f':'#1e293b')+';border:1px solid '+(checked?'#3b82f6':'#334155')+';border-radius:8px;margin-bottom:4px;cursor:pointer">';
            h+='<input type="checkbox" data-idx="'+it.idx+'" '+(checked?'checked':'')+' style="accent-color:#3b82f6;width:16px;height:16px">';
            h+='<div style="width:28px;height:28px;background:#0f172a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#f59e0b;flex-shrink:0">'+(it.j.number||'?')+'</div>';
            h+='<div><div style="font-size:13px;color:#e2e8f0;font-weight:600">'+ppEsc(it.j.name)+'</div><div style="font-size:10px;color:#94a3b8">'+ppEsc(it.j.position||'Sin posicion')+'</div></div>';
            h+='</label>';
        });
        h+='</div>';
    }

    h+='<div style="display:flex;gap:8px;margin-top:14px">';
    h+='<button onclick="ppLimpiarSlot(\''+slotId+'\')" style="flex:1;padding:8px;background:#1e293b;border:1px solid #475569;color:#9ca3af;border-radius:6px;cursor:pointer;font-size:12px">Vaciar posicion</button>';
    h+='<button onclick="ppGuardarSlotMulti(\''+slotId+'\')" style="flex:1;padding:8px;background:#3b82f6;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">Guardar</button>';
    h+='</div></div>';

    ov.innerHTML=h;
    document.body.appendChild(ov);
}

// --- GUARDAR SELECCION MULTIPLE ---
async function ppGuardarSlotMulti(slotId){
    var ov=document.getElementById('pp-slot-overlay');
    if(!ov)return;
    var checks=ov.querySelectorAll('input[type="checkbox"][data-idx]');
    var seleccionados=[];
    checks.forEach(function(cb){
        if(cb.checked)seleccionados.push(parseInt(cb.getAttribute('data-idx')));
    });

    var wm=pp.planActual.weekly_map||{};
    var lu=ppMigrarLineup(wm.rival_lineup||{});
    lu[slotId]=seleccionados;
    wm.rival_lineup=lu;

    try{
        await supabaseClient.from('match_plans').update({weekly_map:wm,updated_at:new Date().toISOString()}).eq('id',pp.planActual.id);
        pp.planActual.weekly_map=wm;
        ov.remove();
        ppMostrarTab('scouting');
    }catch(e){showToast('Error: '+e.message)}
}

// --- LIMPIAR POSICION ---
async function ppLimpiarSlot(slotId){
    var wm=pp.planActual.weekly_map||{};
    var lu=ppMigrarLineup(wm.rival_lineup||{});
    lu[slotId]=[];
    wm.rival_lineup=lu;

    try{
        await supabaseClient.from('match_plans').update({weekly_map:wm,updated_at:new Date().toISOString()}).eq('id',pp.planActual.id);
        pp.planActual.weekly_map=wm;
        var ov=document.getElementById('pp-slot-overlay');if(ov)ov.remove();
        ppMostrarTab('scouting');
    }catch(e){showToast('Error: '+e.message)}
}

// --- MANTENER ppAsignarSlot como legacy por si se usa en otro sitio ---
async function ppAsignarSlot(slotId,pi){
    var wm=pp.planActual.weekly_map||{};
    var lu=ppMigrarLineup(wm.rival_lineup||{});
    if(pi===null)lu[slotId]=[];
    else{if(!lu[slotId])lu[slotId]=[];if(lu[slotId].indexOf(pi)<0)lu[slotId].push(pi)}
    wm.rival_lineup=lu;
    try{
        await supabaseClient.from('match_plans').update({weekly_map:wm,updated_at:new Date().toISOString()}).eq('id',pp.planActual.id);
        pp.planActual.weekly_map=wm;
        var ov=document.getElementById('pp-slot-overlay');if(ov)ov.remove();
        ppMostrarTab('scouting');
    }catch(e){showToast('Error: '+e.message)}
}
// === INIT ===
function ppMostrarGuia(){var prev=document.getElementById('pp-guia-overlay');if(prev)prev.remove();var ov=document.createElement('div');ov.id='pp-guia-overlay';ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';ov.onclick=function(e){if(e.target===ov)ov.remove()};ov.innerHTML='<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:16px;max-width:640px;width:100%;max-height:85vh;display:flex;flex-direction:column"><div style="padding:20px 24px;border-bottom:1px solid #1e3a5f;display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0;color:#f59e0b;font-size:18px">? Guia rapida — Plan de Partido</h3><button onclick="document.getElementById(\'pp-guia-overlay\').remove()" style="background:none;border:none;color:#9ca3af;font-size:22px;cursor:pointer">x</button></div><div style="flex:1;overflow-y:auto;padding:20px 24px;color:#e2e8f0;font-size:13px;line-height:1.7"><p style="color:#94a3b8;margin:0 0 16px">Prepara cada partido de forma organizada: scouting, tactica, ABPs y planificacion semanal.</p><div style="margin-bottom:18px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="width:6px;height:6px;background:#3b82f6;border-radius:50%"></div><span style="font-weight:700;color:#93c5fd">1. Selecciona partido</span></div><p style="margin:0 0 0 14px;color:#94a3b8">Elige un partido pendiente (sin resultado) del desplegable.</p></div><div style="margin-bottom:18px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="width:6px;height:6px;background:#22c55e;border-radius:50%"></div><span style="font-weight:700;color:#86efac">2. Scouting Rival</span></div><p style="margin:0 0 0 14px;color:#94a3b8">Formacion, estilo, puntos fuertes y debiles. Campo visual para asignar jugadores a posiciones.</p></div><div style="margin-bottom:18px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="width:6px;height:6px;background:#f59e0b;border-radius:50%"></div><span style="font-weight:700;color:#fcd34d">3. Jugadores Rival</span></div><p style="margin:0 0 0 14px;color:#94a3b8">Crea la plantilla rival con dorsal, posicion, estadisticas, analisis y archivos multimedia (video/imagen).</p></div><div style="margin-bottom:18px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="width:6px;height:6px;background:#ef4444;border-radius:50%"></div><span style="font-weight:700;color:#fca5a5">4. Fases del Juego Rival</span></div><p style="margin:0 0 0 14px;color:#94a3b8">6 fases predefinidas (ofensivas, defensivas, transiciones). Notas de texto + imagenes/videos por fase (max 8).</p></div><div style="margin-bottom:18px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="width:6px;height:6px;background:#a855f7;border-radius:50%"></div><span style="font-weight:700;color:#c4b5fd">5. Plan Tactico Propio</span></div><p style="margin:0 0 0 14px;color:#94a3b8">Tu plan de juego: ofensivo (verde), defensivo (azul), transiciones (dorado) y consignas (morado). Con imagenes/videos.</p></div><div style="margin-bottom:18px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="width:6px;height:6px;background:#ec4899;border-radius:50%"></div><span style="font-weight:700;color:#f9a8d4">6. ABPs</span></div><p style="margin:0 0 0 14px;color:#94a3b8">Acciones a balon parado ofensivas y defensivas. Roles, marcas, imagen tactica, sena, explicacion. PDF individual y resumen por jugador.</p></div><div style="margin-bottom:18px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="width:6px;height:6px;background:#06b6d4;border-radius:50%"></div><span style="font-weight:700;color:#67e8f9">7. Integracion en Semana</span></div><p style="margin:0 0 0 14px;color:#94a3b8">Mapa semanal MD-6 a MD. Orientaciones, objetivos por contenido, vinculacion de ejercicios (TopLiderCoach + propios). PDF semanal.</p></div><div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px;margin-bottom:12px"><div style="font-weight:700;color:#f59e0b;margin-bottom:6px">Salidas</div><p style="margin:0;color:#94a3b8"><span style="color:#c4b5fd;font-weight:600">PDF:</span> Documento completo con portada, escudos, scouting, jugadores, fases, plan tactico, ABPs y semana.<br><span style="color:#6ee7b7;font-weight:600">Charla:</span> Presentacion a pantalla completa para proyector. Flechas o barra espaciadora para navegar, Escape para salir.</p></div><div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px"><div style="font-weight:700;color:#f59e0b;margin-bottom:6px">Estados del plan</div><p style="margin:0;color:#94a3b8"><span style="color:#94a3b8">Borrador</span> → <span style="color:#4ade80">Listo</span> → <span style="color:#60a5fa">Presentado</span>. Solo informativos, no bloquean nada.</p></div></div></div>';document.body.appendChild(ov)}
function initPlanPartido(){var r=document.getElementById('planpartido-root');if(!r)return;ppRenderMain();ppCargarPartidosPendientes();ppCargarPlantilla()}
function ppRenderMain(){var r=document.getElementById('planpartido-root');if(!r)return;r.innerHTML='<div style="max-width:1200px;margin:0 auto;padding:10px 0"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px"><h2 style="margin:0;font-size:20px;color:#e2e8f0">📋 Plan de Partido</h2><div style="display:flex;align-items:center;gap:8px"><button onclick="ppMostrarGuia()" style="padding:6px 14px;background:#1e293b;border:1px solid #7c3aed;color:#c4b5fd;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600">? Guia rapida</button><div id="pp-status-badge"></div></div></div><div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:16px;margin-bottom:16px"><label style="font-size:13px;color:#9ca3af;display:block;margin-bottom:6px">Selecciona el proximo partido:</label><select id="pp-partido-select" onchange="ppSeleccionarPartido()" style="width:100%;padding:10px 14px;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:14px"><option value="">-- Elige partido --</option></select></div><div id="pp-contenido" style="display:none"></div></div>'}
async function ppCargarPartidosPendientes(){if(!clubId||!seasonId)return;var s=document.getElementById('pp-partido-select');if(!s)return;try{var{data:p,error}=await supabaseClient.from('matches').select('*').eq('club_id',clubId).eq('season_id',seasonId).is('result',null).order('match_date',{ascending:true});if(error)throw error;if(!p||!p.length){s.innerHTML='<option value="">-- Sin partidos --</option>';return}var h='<option value="">-- Elige partido --</option>';p.forEach(function(m){var f=new Date(m.match_date+'T12:00:00');h+='<option value="'+m.id+'">'+['Dom','Lun','Mar','Mie','Jue','Vie','Sab'][f.getDay()]+' '+f.getDate()+'/'+(f.getMonth()+1)+(m.kick_off_time?' '+m.kick_off_time.slice(0,5):'')+' — '+(m.home_away==='home'?'vs ':'@ ')+m.opponent+(m.competition?' · '+m.competition:'')+'</option>'});s.innerHTML=h}catch(e){showToast('Error: '+e.message)}}
async function ppSeleccionarPartido(){var s=document.getElementById('pp-partido-select'),mid=s.value,c=document.getElementById('pp-contenido');if(!mid){c.style.display='none';pp.planActual=null;pp.partidoActual=null;ppRenderStatusBadge();return}c.style.display='block';c.innerHTML='<div style="text-align:center;padding:40px;color:#64748b">Cargando...</div>';try{var{data:par}=await supabaseClient.from('matches').select('*').eq('id',mid).single();pp.partidoActual=par;var{data:riv}=await supabaseClient.from('opponents').select('*').eq('club_id',clubId).eq('name',par.opponent).single();pp.rivalActual=riv||{name:par.opponent};if(!pp.rivalActual.logo_url&&par.opponent_logo)pp.rivalActual.logo_url=par.opponent_logo;var{data:plan,error:e2}=await supabaseClient.from('match_plans').select('*').eq('match_id',mid).single();if(e2&&e2.code==='PGRST116'){var{data:np}=await supabaseClient.from('match_plans').insert({club_id:clubId,season_id:seasonId,match_id:mid,status:'draft'}).select().single();plan=np;showToast('Plan creado')}else if(e2)throw e2;pp.planActual=plan;ppRenderContenido()}catch(e){c.innerHTML='<div style="text-align:center;padding:40px;color:#ef4444">'+e.message+'</div>'}}

// === CABECERA + STATUS ===
function ppRenderCabecera(){var p=pp.partidoActual;if(!p)return '';var f=new Date(p.match_date+'T12:00:00');var fl=f.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'});var eL=p.home_away==='home';var h=p.kick_off_time?p.kick_off_time.slice(0,5):'';var co=p.competition||'';var eR=(pp.rivalActual&&pp.rivalActual.logo_url)?'<img src="'+pp.rivalActual.logo_url+'" style="width:48px;height:48px;object-fit:contain;border-radius:8px">':'<div style="width:48px;height:48px;background:#1e293b;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px">🛡️</div>';var eP=(clubData&&clubData.logo_url)?'<img src="'+clubData.logo_url+'" style="width:48px;height:48px;object-fit:contain;border-radius:8px">':'<div style="width:48px;height:48px;background:#1e293b;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px">🏠</div>';return '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e3a5f;border-radius:12px;padding:20px;margin-bottom:16px"><div style="display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap"><div style="text-align:center">'+(eL?eP:eR)+'<div style="font-size:14px;font-weight:700;color:#e2e8f0;margin-top:6px">'+(eL?((clubData&&clubData.name)||'Mi Equipo'):p.opponent)+'</div></div><div style="text-align:center;padding:0 10px"><div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px">'+co+'</div><div style="font-size:24px;font-weight:700;color:#f59e0b;margin:4px 0">VS</div><div style="font-size:13px;color:#94a3b8">'+fl+'</div>'+(h?'<div style="font-size:13px;color:#94a3b8">'+h+'h</div>':'')+'</div><div style="text-align:center">'+(eL?eR:eP)+'<div style="font-size:14px;font-weight:700;color:#e2e8f0;margin-top:6px">'+(eL?p.opponent:((clubData&&clubData.name)||'Mi Equipo'))+'</div></div></div></div>'}
function ppRenderStatusBadge(){var b=document.getElementById('pp-status-badge');if(!b)return;if(!pp.planActual){b.innerHTML='';return}var s=pp.planActual.status;var c={draft:{bg:'#1e293b',bc:'#475569',tc:'#94a3b8',l:'📝 Borrador'},ready:{bg:'#052e16',bc:'#15803d',tc:'#4ade80',l:'✅ Listo'},presented:{bg:'#172554',bc:'#1d4ed8',tc:'#60a5fa',l:'📊 Presentado'}}[s]||{bg:'#1e293b',bc:'#475569',tc:'#94a3b8',l:'📝 Borrador'};b.innerHTML='<div style="display:flex;align-items:center;gap:8px"><span style="padding:5px 14px;background:'+c.bg+';border:1px solid '+c.bc+';color:'+c.tc+';border-radius:20px;font-size:12px;font-weight:600">'+c.l+'</span><select onchange="ppCambiarEstado(this.value)" style="padding:5px 8px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#94a3b8;font-size:11px"><option value="draft"'+(s==='draft'?' selected':'')+'>Borrador</option><option value="ready"'+(s==='ready'?' selected':'')+'>Listo</option><option value="presented"'+(s==='presented'?' selected':'')+'>Presentado</option></select></div>'}
async function ppCambiarEstado(v){if(!pp.planActual)return;try{await supabaseClient.from('match_plans').update({status:v,updated_at:new Date().toISOString()}).eq('id',pp.planActual.id);pp.planActual.status=v;ppRenderStatusBadge();showToast('Estado: '+v)}catch(e){showToast('Error: '+e.message)}}

// === TABS ===
function ppRenderContenido(){var c=document.getElementById('pp-contenido');if(!c)return;ppRenderStatusBadge();c.innerHTML=ppRenderCabecera()+'<div id="pp-tabs" style="display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap">'+ppTabBtn('scouting','🔍 Scouting Rival',true)+ppTabBtn('jugadores','👤 Jugadores Rival',false)+ppTabBtn('fases','⚽ Fases del Juego Rival',false)+ppTabBtn('tactica','⚔️ Plan Tactico Propio',false)+ppTabBtn('abp','🎯 ABPs',false)+ppTabBtn('semana','📅 Integracion en Semana',false)+'</div><div id="pp-tab-content"></div>';ppMostrarTab('scouting')}
function ppTabBtn(id,l,a){return '<button onclick="ppMostrarTab(\''+id+'\')" id="pp-tab-'+id+'" style="padding:8px 16px;border-radius:8px;border:1px solid '+(a?'#3b82f6':'#334155')+';background:'+(a?'#1e3a5f':'#0f172a')+';color:'+(a?'#93c5fd':'#9ca3af')+';font-size:13px;font-weight:600;cursor:pointer">'+l+'</button>'}
function ppMostrarTab(t){['scouting','jugadores','fases','tactica','abp','semana'].forEach(function(x){var b=document.getElementById('pp-tab-'+x);if(b){var a=x===t;b.style.borderColor=a?'#3b82f6':'#334155';b.style.background=a?'#1e3a5f':'#0f172a';b.style.color=a?'#93c5fd':'#9ca3af'}});var area=document.getElementById('pp-tab-content');if(!area)return;if(t==='scouting')area.innerHTML=ppRenderScouting();else if(t==='jugadores')area.innerHTML=ppRenderJugadores();else if(t==='fases')area.innerHTML=ppRenderFases();else if(t==='tactica')area.innerHTML=ppRenderTactica();else if(t==='abp')area.innerHTML=ppRenderABPs();else if(t==='semana'){area.innerHTML='<div style="text-align:center;padding:30px;color:#64748b">Cargando...</div>';ppCargarSemana()}else if(t==='contenido')area.innerHTML=ppRenderContenidos()}

// === TAB: SCOUTING ===
function ppRenderScouting(){var p=pp.planActual;return '<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:20px"><h3 style="margin:0 0 16px;color:#e2e8f0;font-size:16px">🔍 Scouting del rival</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px"><div><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">Formacion</label>'+ppSelectFormacion('pp-rf',p.rival_formation,"ppGuardarCampo(\'rival_formation\',this.value);setTimeout(function(){ppMostrarTab(\'scouting\')},200)")+'</div><div><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">Estilo</label><input type="text" value="'+ppEsc(p.rival_style)+'" onchange="ppGuardarCampo(\'rival_style\',this.value)" placeholder="Ej: Juego directo..." style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:14px"></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">💪 Fuertes</label><textarea onchange="ppGuardarCampo(\'rival_strengths\',this.value)" rows="4" style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;resize:vertical">'+ppEsc(p.rival_strengths)+'</textarea></div><div><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">📉 Debiles</label><textarea onchange="ppGuardarCampo(\'rival_weaknesses\',this.value)" rows="4" style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;resize:vertical">'+ppEsc(p.rival_weaknesses)+'</textarea></div></div>'+ppRenderAlineacion()+'</div>'}

// === TAB: JUGADORES ===
function ppRenderJugadorMedia(media){if(!media||!media.length)return '<div style="font-size:10px;color:#475569">Sin archivos</div>';var h='';media.forEach(function(m,i){var ic=m.type==='video'?'🎬':(m.type==='image'?'🖼️':'🔗');var esData=m.url&&m.url.indexOf('data:')===0;h+='<div style="display:flex;align-items:center;gap:6px;background:#0f172a;border:1px solid #334155;border-radius:6px;padding:4px 8px;font-size:11px;margin-bottom:3px"><span>'+ic+'</span><a href="'+(esData?'#':ppEsc(m.url))+'" '+(esData?'onclick="event.preventDefault();ppVerImagen('+i+')"':'target="_blank"')+' style="color:#60a5fa;text-decoration:none;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+ppEsc(m.title||'Archivo')+'</a><button onclick="ppQuitarMediaJugador('+i+')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:13px;padding:0 2px">✕</button></div>'});return h}
function ppQuitarMediaJugador(i){_ppJugadorMedia.splice(i,1);var l=document.getElementById('ppj-media-list');if(l)l.innerHTML=ppRenderJugadorMedia(_ppJugadorMedia)}
function ppAgregarMediaJugador(){ppAbrirModalMedia('pp-jm-overlay',function(url,title,tipo){_ppJugadorMedia.push({url:url,title:title,type:tipo});var l=document.getElementById('ppj-media-list');if(l)l.innerHTML=ppRenderJugadorMedia(_ppJugadorMedia);showToast('Añadido')})}
function ppRenderJugadores(){var jug=pp.planActual.rival_players||[];var h='<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:20px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px"><h3 style="margin:0;color:#e2e8f0;font-size:16px">👤 Jugadores ('+jug.length+')</h3><button onclick="ppAbrirFormJugador(-1)" style="padding:8px 16px;background:#3b82f6;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">+ Añadir</button></div><div id="pp-jugador-form-area" style="display:none;margin-bottom:16px"></div>';['porteros','defensas','medios','delanteros'].forEach(function(lk){var li=PP_LINEAS[lk];var jl=[];jug.forEach(function(j,i){if(li.posiciones.indexOf(j.position)>=0)jl.push({j:j,i:i})});h+='<div style="margin-bottom:16px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="width:4px;height:18px;background:'+li.color+';border-radius:2px"></div><span style="font-size:13px;font-weight:600;color:'+li.color+';text-transform:uppercase">'+li.label+' ('+jl.length+')</span></div>';if(!jl.length)h+='<div style="padding:12px;background:#1e293b;border-radius:8px;color:#475569;font-size:12px;text-align:center">Sin jugadores</div>';else{h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px">';jl.forEach(function(it){h+=ppRenderJugadorCard(it.j,it.i)});h+='</div>'}h+='</div>'});var sp=[];jug.forEach(function(j,i){var en=false;Object.keys(PP_LINEAS).forEach(function(k){if(PP_LINEAS[k].posiciones.indexOf(j.position)>=0)en=true});if(!en)sp.push({j:j,i:i})});if(sp.length){h+='<div style="margin-bottom:16px"><div style="font-size:13px;font-weight:600;color:#9ca3af;margin-bottom:8px">Sin posicion</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px">';sp.forEach(function(it){h+=ppRenderJugadorCard(it.j,it.i)});h+='</div></div>'}return h+'</div>'}
function ppRenderJugadorCard(j,idx){var st='';if(j.games||j.minutes||j.goals){var p=[];if(j.games)p.push('PJ:'+j.games);if(j.minutes)p.push(j.minutes+"'");if(j.goals)p.push(j.goals+' gol'+(j.goals>1?'es':''));st=p.join(' · ')}var mc=j.media&&j.media.length?'<div style="font-size:10px;color:#60a5fa;margin-top:4px">🎬 '+j.media.length+' archivo'+(j.media.length>1?'s':'')+'</div>':'';return '<div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:12px;cursor:pointer" onclick="ppAbrirFormJugador('+idx+')" onmouseenter="this.style.borderColor=\'#3b82f6\'" onmouseleave="this.style.borderColor=\'#334155\'"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><div style="width:32px;height:32px;background:#0f172a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#f59e0b">'+(j.number||'?')+'</div><div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+ppEsc(j.name||'?')+(j.year?' <span style="color:#64748b;font-size:11px">('+j.year+')</span>':'')+'</div><div style="font-size:11px;color:#94a3b8">'+ppEsc(j.position||'')+(j.foot?' · '+j.foot:'')+'</div></div></div>'+(st?'<div style="font-size:11px;color:#64748b;margin-bottom:4px">'+st+'</div>':'')+(j.club_from?'<div style="font-size:10px;color:#475569;margin-bottom:4px">Procede: '+ppEsc(j.club_from)+'</div>':'')+(j.analysis?'<div style="font-size:11px;color:#94a3b8;line-height:1.4;max-height:44px;overflow:hidden">'+ppEsc(j.analysis)+'</div>':'<div style="font-size:11px;color:#475569;font-style:italic">Sin analisis</div>')+mc+'</div>'}
function ppAbrirFormJugador(idx){pp.jugadorEditIdx=idx;var area=document.getElementById('pp-jugador-form-area');if(!area)return;var jug=pp.planActual.rival_players||[];var j=idx>=0?jug[idx]:{name:'',number:'',position:'',foot:'Diestro',year:'',club_from:'',games:'',minutes:'',goals:'',analysis:'',media:[]};_ppJugadorMedia=(j.media||[]).slice();var esE=idx>=0;var po='<option value="">--</option>';PP_POSICIONES.forEach(function(p){po+='<option value="'+p+'"'+(j.position===p?' selected':'')+'>'+p+'</option>'});area.style.display='block';area.innerHTML='<div style="background:#0f2744;border:1px solid #1e3a5f;border-radius:10px;padding:16px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h4 style="margin:0;color:#e2e8f0;font-size:14px">'+(esE?'Editar':'Nuevo jugador')+'</h4><button onclick="ppCerrarFormJugador()" style="background:none;border:none;color:#9ca3af;font-size:18px;cursor:pointer">✕</button></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:12px"><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Nombre *</label><input type="text" id="ppj-name" value="'+ppEsc(j.name)+'" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Dorsal</label><input type="number" id="ppj-number" value="'+(j.number||'')+'" min="1" max="99" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Posicion</label><select id="ppj-position" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px">'+po+'</select></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Pie</label><select id="ppj-foot" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"><option value="Diestro"'+(j.foot==='Diestro'?' selected':'')+'>Diestro</option><option value="Zurdo"'+(j.foot==='Zurdo'?' selected':'')+'>Zurdo</option><option value="Ambidiestro"'+(j.foot==='Ambidiestro'?' selected':'')+'>Ambidiestro</option></select></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Año</label><input type="number" id="ppj-year" value="'+(j.year||'')+'" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Procede</label><input type="text" id="ppj-club" value="'+ppEsc(j.club_from)+'" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px"><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">PJ</label><input type="number" id="ppj-games" value="'+(j.games||'')+'" min="0" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Min</label><input type="number" id="ppj-minutes" value="'+(j.minutes||'')+'" min="0" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Goles</label><input type="number" id="ppj-goals" value="'+(j.goals||'')+'" min="0" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div></div><div style="margin-bottom:12px"><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Archivos</label><div id="ppj-media-list" style="margin-bottom:6px">'+ppRenderJugadorMedia(j.media||[])+'</div><button type="button" onclick="ppAgregarMediaJugador()" style="padding:5px 12px;background:#0f172a;border:1px solid #334155;color:#94a3b8;border-radius:6px;cursor:pointer;font-size:11px">+ Añadir</button></div><div style="margin-bottom:12px"><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Analisis</label><textarea id="ppj-analysis" rows="3" style="width:100%;padding:8px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;resize:vertical">'+ppEsc(j.analysis)+'</textarea></div><div style="display:flex;gap:8px;justify-content:flex-end">'+(esE?'<button onclick="ppEliminarJugador('+idx+')" style="padding:7px 14px;background:#7f1d1d;border:1px solid #dc2626;color:#fca5a5;border-radius:6px;cursor:pointer;font-size:12px;margin-right:auto">Eliminar</button>':'')+'<button onclick="ppCerrarFormJugador()" style="padding:7px 16px;background:#1e293b;border:1px solid #475569;color:#9ca3af;border-radius:6px;cursor:pointer;font-size:12px">Cancelar</button><button onclick="ppGuardarJugador()" style="padding:7px 16px;background:#3b82f6;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">'+(esE?'Guardar':'Añadir')+'</button></div></div>';area.scrollIntoView({behavior:'smooth',block:'nearest'})}
function ppCerrarFormJugador(){var a=document.getElementById('pp-jugador-form-area');if(a)a.style.display='none';pp.jugadorEditIdx=-1}
async function ppGuardarJugador(){var name=document.getElementById('ppj-name').value.trim();if(!name){showToast('Nombre obligatorio');return}var j={name:name,number:document.getElementById('ppj-number').value?parseInt(document.getElementById('ppj-number').value):null,position:document.getElementById('ppj-position').value||'',foot:document.getElementById('ppj-foot').value||'Diestro',year:document.getElementById('ppj-year').value?parseInt(document.getElementById('ppj-year').value):null,club_from:document.getElementById('ppj-club').value.trim()||'',games:document.getElementById('ppj-games').value?parseInt(document.getElementById('ppj-games').value):null,minutes:document.getElementById('ppj-minutes').value?parseInt(document.getElementById('ppj-minutes').value):null,goals:document.getElementById('ppj-goals').value?parseInt(document.getElementById('ppj-goals').value):null,analysis:document.getElementById('ppj-analysis').value.trim()||'',media:_ppJugadorMedia.slice()};var jug=pp.planActual.rival_players||[];if(pp.jugadorEditIdx>=0)jug[pp.jugadorEditIdx]=j;else jug.push(j);try{await supabaseClient.from('match_plans').update({rival_players:jug,updated_at:new Date().toISOString()}).eq('id',pp.planActual.id);pp.planActual.rival_players=jug;showToast(pp.jugadorEditIdx>=0?'Actualizado':'Añadido');ppCerrarFormJugador();ppMostrarTab('jugadores')}catch(e){showToast('Error: '+e.message)}}
async function ppEliminarJugador(idx){if(!confirm('¿Eliminar?'))return;var jug=pp.planActual.rival_players||[];jug.splice(idx,1);try{await supabaseClient.from('match_plans').update({rival_players:jug,updated_at:new Date().toISOString()}).eq('id',pp.planActual.id);pp.planActual.rival_players=jug;ppCerrarFormJugador();ppMostrarTab('jugadores')}catch(e){showToast('Error: '+e.message)}}

// === TAB: FASES RIVAL ===
function ppGetFases(){var f=pp.planActual.tactical_phases;if(!f||!Array.isArray(f)||!f.length)return PP_FASES_DEFAULT.map(function(x){return{id:x.id,title:x.title,notes:'',media:[]}});return f}
function ppRenderFases(){var fases=ppGetFases();var cols=['#0f6e56','#085041','#993c1d','#0c447c','#3c3489','#712b13'];var h='<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:20px"><h3 style="margin:0 0 6px;color:#e2e8f0;font-size:16px">⚽ Fases del juego rival</h3><p style="margin:0 0 16px;font-size:12px;color:#64748b">Analiza cada fase.</p>';fases.forEach(function(f,i){var mh='';if(f.media&&f.media.length){mh='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">';f.media.forEach(function(m,mi){if(m.type==='image'&&m.url){mh+='<div style="display:inline-flex;flex-direction:column;align-items:center;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:6px;position:relative;max-width:160px"><img src="'+m.url+'" onclick="ppVerImagenFase('+i+','+mi+')" style="width:150px;height:auto;border-radius:6px;cursor:pointer"><div style="font-size:10px;margin-top:4px;color:#94a3b8;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+ppEsc(m.title||'')+'</div><button onclick="ppEliminarMediaFase('+i+','+mi+')" style="position:absolute;top:2px;right:2px;background:#7f1d1d;border:none;color:#fca5a5;cursor:pointer;font-size:10px;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center">✕</button></div>'}else{mh+='<div style="display:flex;align-items:center;gap:6px;background:#0f172a;border:1px solid #334155;border-radius:6px;padding:5px 10px;font-size:11px"><span style="font-size:14px">'+(m.type==='video'?'🎬':'🔗')+'</span><a href="'+ppEsc(m.url)+'" target="_blank" style="color:#60a5fa;text-decoration:none;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+ppEsc(m.title||'Media')+'</a><button onclick="ppEliminarMediaFase('+i+','+mi+')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px">✕</button></div>'}});mh+='</div>'}h+='<div style="background:#1e293b;border-left:4px solid '+cols[i%cols.length]+';border-radius:0 8px 8px 0;padding:14px;margin-bottom:10px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="font-size:13px;font-weight:600;color:#e2e8f0">'+ppEsc(f.title)+'</div><button onclick="ppAgregarMediaFase('+i+')" style="padding:4px 10px;background:#0f172a;border:1px solid #334155;color:#94a3b8;border-radius:6px;cursor:pointer;font-size:11px">+ Video/Imagen</button></div><textarea id="pp-fase-'+i+'" onchange="ppGuardarFase('+i+',this.value)" rows="3" placeholder="Notas..." style="width:100%;padding:8px 10px;background:#0f172a;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;resize:vertical">'+ppEsc(f.notes)+'</textarea>'+mh+'</div>'});return h+'</div>'}
async function ppGuardarFase(i,v){var f=ppGetFases();f[i].notes=v||'';try{await supabaseClient.from('match_plans').update({tactical_phases:f,updated_at:new Date().toISOString()}).eq('id',pp.planActual.id);pp.planActual.tactical_phases=f}catch(e){showToast('Error: '+e.message)}}
function ppAgregarMediaFase(idx){var fc=ppGetFases()[idx];if(fc.media&&fc.media.length>=PP_MAX_MEDIA_POR_FASE){showToast('Max '+PP_MAX_MEDIA_POR_FASE);return}ppAbrirModalMedia('pp-media-overlay',function(url,title,tipo){ppSaveMediaFase(idx,url,title,tipo)})}
async function ppSaveMediaFase(idx,url,title,tipo){var f=ppGetFases();if(!f[idx].media)f[idx].media=[];f[idx].media.push({url:url,title:title,type:tipo});try{await supabaseClient.from('match_plans').update({tactical_phases:f,updated_at:new Date().toISOString()}).eq('id',pp.planActual.id);pp.planActual.tactical_phases=f;showToast('Añadido');ppMostrarTab('fases')}catch(e){showToast('Error: '+e.message)}}
async function ppEliminarMediaFase(fi,mi){var f=ppGetFases();f[fi].media.splice(mi,1);try{await supabaseClient.from('match_plans').update({tactical_phases:f,updated_at:new Date().toISOString()}).eq('id',pp.planActual.id);pp.planActual.tactical_phases=f;ppMostrarTab('fases')}catch(e){showToast('Error: '+e.message)}}

// === TAB: PLAN TACTICO PROPIO ===
function ppGetOurPhases(){return (pp.planActual.weekly_map||{}).our_phases||{}}
async function ppSaveOurPhases(phases){var wm=pp.planActual.weekly_map||{};wm.our_phases=phases;try{await supabaseClient.from('match_plans').update({weekly_map:wm,updated_at:new Date().toISOString()}).eq('id',pp.planActual.id);pp.planActual.weekly_map=wm}catch(e){showToast('Error: '+e.message)}}
function ppRenderTactica(){var p=pp.planActual;var phases=ppGetOurPhases();var h='<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:20px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px"><h3 style="margin:0;color:#e2e8f0;font-size:16px">⚔️ Plan Tactico Propio</h3><div><label style="font-size:12px;color:#9ca3af;margin-right:8px">Formacion:</label>'+ppSelectFormacion('pp-of',p.our_formation,"ppGuardarCampo(\'our_formation\',this.value)")+'</div></div>';PP_OUR_SECTIONS.forEach(function(sec){if(sec.type==='title'){h+='<div style="margin-top:16px;margin-bottom:8px;display:flex;align-items:center;gap:8px"><div style="width:4px;height:20px;background:'+sec.color+';border-radius:2px"></div><span style="font-size:14px;font-weight:700;color:'+sec.color+';text-transform:uppercase;letter-spacing:0.5px">'+sec.label+'</span></div>'}else{var data=phases[sec.id]||{notes:'',media:[]};h+='<div style="background:#1e293b;border-left:4px solid '+sec.color+';border-radius:0 8px 8px 0;padding:14px;margin-bottom:8px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="font-size:13px;font-weight:600;color:#e2e8f0">'+ppEsc(sec.title)+'</div><button onclick="ppAgregarMediaOur(\''+sec.id+'\')" style="padding:4px 10px;background:#0f172a;border:1px solid #334155;color:#94a3b8;border-radius:6px;cursor:pointer;font-size:11px">+ Video/Imagen</button></div><textarea onchange="ppGuardarOurFase(\''+sec.id+'\',this.value)" rows="3" placeholder="Notas..." style="width:100%;padding:8px 10px;background:#0f172a;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;resize:vertical">'+ppEsc(data.notes)+'</textarea>';if(data.media&&data.media.length){h+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">';data.media.forEach(function(m,mi){if(m.type==='image'&&m.url){h+='<div style="display:inline-flex;flex-direction:column;align-items:center;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:6px;position:relative;max-width:160px"><img src="'+m.url+'" onclick="ppVerImagenOur(\''+sec.id+'\','+mi+')" style="width:150px;height:auto;border-radius:6px;cursor:pointer"><div style="font-size:10px;margin-top:4px;color:#94a3b8;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+ppEsc(m.title||'')+'</div><button onclick="ppEliminarMediaOur(\''+sec.id+'\','+mi+')" style="position:absolute;top:2px;right:2px;background:#7f1d1d;border:none;color:#fca5a5;cursor:pointer;font-size:10px;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center">✕</button></div>'}else{h+='<div style="display:flex;align-items:center;gap:6px;background:#0f172a;border:1px solid #334155;border-radius:6px;padding:5px 10px;font-size:11px"><span style="font-size:14px">'+(m.type==='video'?'🎬':'🔗')+'</span><a href="'+ppEsc(m.url)+'" target="_blank" style="color:#60a5fa;text-decoration:none">'+ppEsc(m.title||'Media')+'</a><button onclick="ppEliminarMediaOur(\''+sec.id+'\','+mi+')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px">✕</button></div>'}});h+='</div>'}h+='</div>'}});return h+'</div>'}
async function ppGuardarOurFase(secId,valor){var phases=ppGetOurPhases();if(!phases[secId])phases[secId]={notes:'',media:[]};phases[secId].notes=valor||'';await ppSaveOurPhases(phases)}
function ppAgregarMediaOur(secId){ppAbrirModalMedia('pp-our-media',function(url,title,tipo){var phases=ppGetOurPhases();if(!phases[secId])phases[secId]={notes:'',media:[]};if(!phases[secId].media)phases[secId].media=[];phases[secId].media.push({url:url,title:title,type:tipo});ppSaveOurPhases(phases).then(function(){showToast('Añadido');ppMostrarTab('tactica')})})}
async function ppEliminarMediaOur(secId,mi){var phases=ppGetOurPhases();if(phases[secId]&&phases[secId].media){phases[secId].media.splice(mi,1);await ppSaveOurPhases(phases);ppMostrarTab('tactica')}}

// === TAB: ABPs ===
function ppGetAbpCards(){return((pp.planActual.weekly_map||{}).abp_cards)||[]}
async function ppSaveAbpCards(cards){var wm=pp.planActual.weekly_map||{};wm.abp_cards=cards;try{await supabaseClient.from('match_plans').update({weekly_map:wm,updated_at:new Date().toISOString()}).eq('id',pp.planActual.id);pp.planActual.weekly_map=wm}catch(e){showToast('Error: '+e.message)}}
function ppNewAbpCard(){return{id:'abp_'+Date.now(),name:'',tipo:'ofensiva',subtipo:'corner',espacio:'',perfil:'',distancia:'',of_remate:[],of_ejecuta:[],of_rechace:[],of_atras:[],of_en_corto:[],sena:'',marcas:[],df_palo:[],df_corta:[],df_al_saque:[],df_zona:[],df_rechace:[],df_arriba:[],df_barrera:[],explicacion:'',imagen:'',video:''}}
function ppRenderABPs(){var cards=ppGetAbpCards();var ofensivas=cards.filter(function(c){return c.tipo==='ofensiva'});var defensivas=cards.filter(function(c){return c.tipo==='defensiva'});var h='<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:20px">';h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px"><h3 style="margin:0;color:#e2e8f0;font-size:16px">🎯 Acciones a Balon Parado ('+cards.length+')</h3><div style="display:flex;gap:8px"><button onclick="ppMostrarResumenJugadores()" style="padding:8px 16px;background:#0f172a;border:1px solid #f59e0b;color:#f59e0b;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600">📊 Resumen jugador</button><button onclick="ppAbrirFormAbp(-1)" style="padding:8px 16px;background:#a855f7;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">+ Nueva ABP</button></div></div>';h+='<div id="pp-abp-form-area" style="display:none;margin-bottom:16px"></div>';h+='<div style="margin-bottom:20px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><div style="width:4px;height:18px;background:#22c55e;border-radius:2px"></div><span style="font-size:13px;font-weight:700;color:#22c55e;text-transform:uppercase">OFENSIVAS ('+ofensivas.length+')</span></div>';if(!ofensivas.length)h+='<div style="padding:16px;background:#1e293b;border-radius:8px;text-align:center;color:#475569;font-size:12px">Sin ABPs ofensivas</div>';else{h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px">';ofensivas.forEach(function(c){h+=ppRenderAbpCard(c,cards.indexOf(c))});h+='</div>'}h+='</div>';h+='<div><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><div style="width:4px;height:18px;background:#3b82f6;border-radius:2px"></div><span style="font-size:13px;font-weight:700;color:#3b82f6;text-transform:uppercase">DEFENSIVAS ('+defensivas.length+')</span></div>';if(!defensivas.length)h+='<div style="padding:16px;background:#1e293b;border-radius:8px;text-align:center;color:#475569;font-size:12px">Sin ABPs defensivas</div>';else{h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px">';defensivas.forEach(function(c){h+=ppRenderAbpCard(c,cards.indexOf(c))});h+='</div>'}h+='</div></div>';return h}
function ppMostrarResumenJugadores(){var cards=ppGetAbpCards();if(!cards.length){showToast('No hay ABPs');return}var jugP=pp.plantilla;var jugR=(pp.planActual.rival_players||[]).map(function(j,i){return{id:'r_'+i,number:j.number,name:j.name}});var mapa={};function addEntry(pid,abpName,rol,jugadores){if(!pid)return;if(!mapa[pid]){var p=jugadores.find(function(j){return j.id===pid});mapa[pid]={name:p?((p.number?'#'+p.number+' ':'')+p.name):pid,entries:[],esRival:jugadores===jugR}}mapa[pid].entries.push({abp:abpName,rol:rol})}cards.forEach(function(c){var tags=[c.subtipo,c.espacio,c.perfil].filter(Boolean).join(' ');var label=(c.name||'ABP')+' ('+tags+')';if(c.tipo==='ofensiva'){PP_ABP_ROLES_OF.forEach(function(r){(c['of_'+r]||[]).forEach(function(pid){addEntry(pid,label,PP_ABP_ROLES_OF_LABELS[r],jugP)})})}if(c.tipo==='defensiva'){(c.marcas||[]).forEach(function(m){if(m.propio_id){var rn=jugR.find(function(j){return j.id===m.rival_idx});addEntry(m.propio_id,label,'Marca a '+(rn?rn.name:'?'),jugP)}if(m.rival_idx){var pn=jugP.find(function(j){return j.id===m.propio_id});addEntry(m.rival_idx,label,'Marcado por '+(pn?pn.name:'?'),jugR)}});PP_ABP_ROLES_DF.forEach(function(r){(c['df_'+r]||[]).forEach(function(pid){addEntry(pid,label,PP_ABP_ROLES_DF_LABELS[r],jugP)})});(c.df_barrera||[]).forEach(function(pid){addEntry(pid,label,'Barrera',jugP)})}});var propios=[];var rivales=[];Object.keys(mapa).forEach(function(pid){if(mapa[pid].esRival)rivales.push(mapa[pid]);else propios.push(mapa[pid])});propios.sort(function(a,b){return a.name.localeCompare(b.name)});rivales.sort(function(a,b){return a.name.localeCompare(b.name)});var prev=document.getElementById('pp-resumen-overlay');if(prev)prev.remove();var ov=document.createElement('div');ov.id='pp-resumen-overlay';ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';ov.onclick=function(e){if(e.target===ov)ov.remove()};var h='<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;max-width:700px;width:100%;max-height:85vh;display:flex;flex-direction:column"><div style="padding:16px 20px;border-bottom:1px solid #1e3a5f;display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0;color:#e2e8f0;font-size:16px">📊 Resumen ABPs por jugador</h3><button onclick="ppExportarResumenPDF()" style="padding:5px 12px;background:#4c1d95;border:1px solid #7c3aed;color:#c4b5fd;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;margin-left:auto;margin-right:8px">📄 PDF</button><button onclick="document.getElementById(\'pp-resumen-overlay\').remove()" style="background:none;border:none;color:#9ca3af;font-size:20px;cursor:pointer">✕</button></div><div style="flex:1;overflow-y:auto;padding:16px 20px">';if(propios.length){h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><div style="width:4px;height:18px;background:#22c55e;border-radius:2px"></div><span style="font-size:13px;font-weight:700;color:#22c55e;text-transform:uppercase">Mi equipo</span></div>';propios.forEach(function(p){h+='<div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:12px;margin-bottom:8px"><div style="font-size:14px;font-weight:700;color:#e2e8f0;margin-bottom:8px">'+ppEsc(p.name)+' <span style="font-size:11px;color:#64748b;font-weight:400">('+p.entries.length+' ABP'+(p.entries.length>1?'s':'')+')</span></div>';p.entries.forEach(function(e){h+='<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;margin-bottom:3px;background:#0f172a;border-radius:6px;font-size:12px"><span style="color:#f59e0b;font-weight:600;min-width:100px">'+ppEsc(e.rol)+'</span><span style="color:#94a3b8">→</span><span style="color:#e2e8f0">'+ppEsc(e.abp)+'</span></div>'});h+='</div>'})}if(rivales.length){h+='<div style="display:flex;align-items:center;gap:8px;margin:16px 0 12px"><div style="width:4px;height:18px;background:#ef4444;border-radius:2px"></div><span style="font-size:13px;font-weight:700;color:#ef4444;text-transform:uppercase">Rivales</span></div>';rivales.forEach(function(p){h+='<div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:12px;margin-bottom:8px"><div style="font-size:14px;font-weight:700;color:#e2e8f0;margin-bottom:8px">'+ppEsc(p.name)+'</div>';p.entries.forEach(function(e){h+='<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;margin-bottom:3px;background:#0f172a;border-radius:6px;font-size:12px"><span style="color:#3b82f6;font-weight:600;min-width:100px">'+ppEsc(e.rol)+'</span><span style="color:#94a3b8">→</span><span style="color:#e2e8f0">'+ppEsc(e.abp)+'</span></div>'});h+='</div>'})}if(!propios.length&&!rivales.length)h+='<div style="text-align:center;padding:30px;color:#64748b">Sin jugadores asignados</div>';h+='</div></div>';ov.innerHTML=h;document.body.appendChild(ov)}
function ppExportarResumenPDF(){var cards=ppGetAbpCards();if(!cards.length)return;var par=pp.partidoActual;if(!par)return;var jugP=pp.plantilla;var jugR=(pp.planActual.rival_players||[]).map(function(j,i){return{id:'r_'+i,number:j.number,name:j.name}});var mapa={};function addE(pid,abpName,rol,jugs,esR){if(!pid)return;if(!mapa[pid]){var p=jugs.find(function(j){return j.id===pid});mapa[pid]={name:p?((p.number?'#'+p.number+' ':'')+p.name):pid,entries:[],esRival:esR}}mapa[pid].entries.push({abp:abpName,rol:rol})}cards.forEach(function(c){var tags=[c.subtipo,c.espacio,c.perfil].filter(Boolean).join(' ');var label=(c.name||'ABP')+' ('+tags+')';if(c.tipo==='ofensiva')PP_ABP_ROLES_OF.forEach(function(r){(c['of_'+r]||[]).forEach(function(pid){addE(pid,label,PP_ABP_ROLES_OF_LABELS[r],jugP,false)})});if(c.tipo==='defensiva'){(c.marcas||[]).forEach(function(m){if(m.propio_id){var rn=jugR.find(function(j){return j.id===m.rival_idx});addE(m.propio_id,label,'Marca a '+(rn?rn.name:'?'),jugP,false)}});PP_ABP_ROLES_DF.forEach(function(r){(c['df_'+r]||[]).forEach(function(pid){addE(pid,label,PP_ABP_ROLES_DF_LABELS[r],jugP,false)})});(c.df_barrera||[]).forEach(function(pid){addE(pid,label,'Barrera',jugP,false)})}});var propios=[];Object.keys(mapa).forEach(function(pid){if(!mapa[pid].esRival)propios.push(mapa[pid])});propios.sort(function(a,b){return a.name.localeCompare(b.name)});var doc=new jspdf.jsPDF('p','mm','a4');var eL=par.home_away==='home';var miEq=(clubData&&clubData.name)||'Mi Equipo';doc.setFillColor(15,23,42);doc.rect(0,0,210,28,'F');doc.setFillColor(168,85,247);doc.rect(0,28,210,1.5,'F');doc.setTextColor(255,255,255);doc.setFontSize(16);doc.setFont('helvetica','bold');doc.text('RESUMEN ABPs POR JUGADOR',105,11,{align:'center'});doc.setFontSize(10);doc.setFont('helvetica','normal');doc.text((eL?miEq+' vs '+par.opponent:par.opponent+' vs '+miEq),105,18,{align:'center'});doc.setFontSize(8);doc.setTextColor(180,180,200);doc.text(new Date(par.match_date+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'}),105,24,{align:'center'});var y=36;propios.forEach(function(p){if(y>265){doc.addPage();y=15}doc.setFillColor(30,41,59);doc.roundedRect(12,y,186,8,2,2,'F');doc.setTextColor(245,158,11);doc.setFontSize(10);doc.setFont('helvetica','bold');doc.text(p.name,16,y+5.5);doc.setTextColor(148,163,184);doc.setFontSize(8);doc.setFont('helvetica','normal');doc.text(p.entries.length+' ABP'+(p.entries.length>1?'s':''),194,y+5.5,{align:'right'});y+=11;p.entries.forEach(function(e){if(y>280){doc.addPage();y=15}doc.setFillColor(241,245,249);doc.roundedRect(16,y-1,178,6,1,1,'F');doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(168,85,247);doc.text(e.rol,18,y+3);doc.setFont('helvetica','normal');doc.setTextColor(100,116,139);doc.text('→',65,y+3);doc.setTextColor(50,50,50);doc.text(e.abp,72,y+3);y+=7});y+=4});var tp=doc.internal.getNumberOfPages();for(var i=1;i<=tp;i++){doc.setPage(i);doc.setFillColor(15,23,42);doc.rect(0,287,210,10,'F');doc.setFontSize(7);doc.setTextColor(100,116,139);doc.text('TopLiderCoach — Resumen ABPs',105,292,{align:'center'});doc.text(i+'/'+tp,195,292,{align:'right'})}doc.save('Resumen_ABPs_'+par.opponent.replace(/\s+/g,'_')+'.pdf');showToast('PDF generado')}
function ppRenderAbpCard(c,idx){var tags=[c.subtipo,c.espacio,c.perfil,c.distancia].filter(Boolean).join(' · ');var hasImg=c.imagen&&c.imagen.length>50;var color=c.tipo==='ofensiva'?'#22c55e':'#3b82f6';return '<div style="background:#1e293b;border:1px solid #334155;border-radius:10px;overflow:hidden;cursor:pointer" onclick="ppAbrirFormAbp('+idx+')" onmouseenter="this.style.borderColor=\''+color+'\'" onmouseleave="this.style.borderColor=\'#334155\'">'+(hasImg?'<div style="width:100%;aspect-ratio:16/9;overflow:hidden;background:#0f172a"><img src="'+c.imagen+'" style="width:100%;height:100%;object-fit:cover"></div>':'<div style="width:100%;aspect-ratio:16/9;background:#0f172a;display:flex;align-items:center;justify-content:center;font-size:32px;color:#334155">🎯</div>')+'<div style="padding:10px"><div style="font-size:14px;font-weight:600;color:#e2e8f0;margin-bottom:4px">'+ppEsc(c.name||'Sin nombre')+'</div><div style="font-size:11px;color:'+color+';margin-bottom:4px;text-transform:capitalize">'+c.tipo+'</div>'+(tags?'<div style="font-size:10px;color:#64748b">'+ppEsc(tags)+'</div>':'')+(c.video?'<div style="font-size:10px;color:#f97316;margin-top:4px">🎬 Video</div>':'')+'<div style="display:flex;gap:4px;margin-top:6px"><button onclick="event.stopPropagation();ppExportarAbpPDF('+idx+')" style="padding:3px 8px;background:#4c1d95;border:1px solid #7c3aed;color:#c4b5fd;border-radius:4px;cursor:pointer;font-size:10px;font-weight:600">📄 PDF</button><button onclick="event.stopPropagation();ppEliminarAbp('+idx+')" style="padding:3px 8px;background:#7f1d1d;border:1px solid #dc2626;color:#fca5a5;border-radius:4px;cursor:pointer;font-size:10px">Eliminar</button></div></div></div>'}
function ppAbpPlayerSelect(id,selected,usedIds,jugadores,label){var h='<div style="margin-bottom:6px"><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">'+label+'</label><div style="display:flex;flex-wrap:wrap;gap:4px" id="'+id+'-chips">';(selected||[]).forEach(function(pid,i){var p=jugadores.find(function(j){return j.id===pid});if(p)h+='<span style="display:flex;align-items:center;gap:4px;padding:3px 8px;background:#0f172a;border:1px solid #334155;border-radius:12px;font-size:11px;color:#e2e8f0">'+(p.number?'#'+p.number+' ':'')+ppEsc(p.name.split(' ').pop())+'<button onclick="ppAbpRemovePlayer(\''+id+'\','+i+')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:12px;padding:0">✕</button></span>'});h+='</div><select onchange="ppAbpAddPlayer(\''+id+'\',this.value);this.value=\'\'" style="margin-top:4px;padding:5px 8px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:12px;max-width:200px"><option value="">+ Añadir...</option>';jugadores.forEach(function(j){var disabled=usedIds.indexOf(j.id)>=0;h+='<option value="'+j.id+'"'+(disabled?' disabled style="color:#475569"':'')+'>'+( j.number?'#'+j.number+' ':'')+ppEsc(j.name)+(disabled?' (asignado)':'')+'</option>'});return h+'</select></div>'}
function ppAbrirFormAbp(idx){pp.abpEditIdx=idx;var cards=ppGetAbpCards();var c=idx>=0?JSON.parse(JSON.stringify(cards[idx])):ppNewAbpCard();_ppAbpForm=c;ppRenderAbpForm()}
function ppRenderAbpForm(){var area=document.getElementById('pp-abp-form-area');if(!area)return;var c=_ppAbpForm;if(!c)return;var esE=pp.abpEditIdx>=0;var jugPropios=pp.plantilla;var jugRivales=(pp.planActual.rival_players||[]).map(function(j,i){return{id:'r_'+i,number:j.number,name:j.name,position:j.position}});var usedOf=[];PP_ABP_ROLES_OF.forEach(function(r){(c['of_'+r]||[]).forEach(function(pid){if(usedOf.indexOf(pid)<0)usedOf.push(pid)})});var usedDf=[];PP_ABP_ROLES_DF.forEach(function(r){(c['df_'+r]||[]).forEach(function(pid){if(usedDf.indexOf(pid)<0)usedDf.push(pid)})});(c.df_barrera||[]).forEach(function(pid){if(usedDf.indexOf(pid)<0)usedDf.push(pid)});(c.marcas||[]).forEach(function(m){if(m.propio_id&&usedDf.indexOf(m.propio_id)<0)usedDf.push(m.propio_id)});var h='<div style="background:#0f2744;border:1px solid #1e3a5f;border-radius:10px;padding:16px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h4 style="margin:0;color:#e2e8f0;font-size:14px">'+(esE?'Editar ABP':'Nueva ABP')+'</h4><button onclick="ppCerrarFormAbp()" style="background:none;border:none;color:#9ca3af;font-size:18px;cursor:pointer">✕</button></div>';h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:12px"><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Nombre *</label><input type="text" id="ppabp-name" value="'+ppEsc(c.name)+'" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Tipo</label><select id="ppabp-tipo" onchange="ppAbpTipoChange(this.value)" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"><option value="ofensiva"'+(c.tipo==='ofensiva'?' selected':'')+'>⚡ Ofensiva</option><option value="defensiva"'+(c.tipo==='defensiva'?' selected':'')+'>🛡️ Defensiva</option></select></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Subtipo</label><select id="ppabp-subtipo" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"><option value="corner"'+(c.subtipo==='corner'?' selected':'')+'>Corner</option><option value="falta"'+(c.subtipo==='falta'?' selected':'')+'>Falta</option><option value="saque_banda"'+(c.subtipo==='saque_banda'?' selected':'')+'>Saque de banda</option><option value="penalti"'+(c.subtipo==='penalti'?' selected':'')+'>Penalti</option></select></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Espacio</label><select id="ppabp-espacio" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"><option value="">--</option><option value="lateral"'+(c.espacio==='lateral'?' selected':'')+'>Lateral</option><option value="central"'+(c.espacio==='central'?' selected':'')+'>Central</option></select></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Perfil</label><select id="ppabp-perfil" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"><option value="">--</option><option value="izquierda"'+(c.perfil==='izquierda'?' selected':'')+'>Izquierda</option><option value="derecha"'+(c.perfil==='derecha'?' selected':'')+'>Derecha</option></select></div><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Distancia</label><select id="ppabp-distancia" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"><option value="">--</option><option value="cercana"'+(c.distancia==='cercana'?' selected':'')+'>Cercana</option><option value="media"'+(c.distancia==='media'?' selected':'')+'>Media</option><option value="lejana"'+(c.distancia==='lejana'?' selected':'')+'>Lejana</option></select></div></div>';if(c.tipo==='ofensiva'){h+='<div style="border-top:1px solid #1e3a5f;padding-top:12px;margin-bottom:12px"><div style="font-size:12px;font-weight:700;color:#22c55e;text-transform:uppercase;margin-bottom:8px">Roles ofensivos</div>';PP_ABP_ROLES_OF.forEach(function(r){h+=ppAbpPlayerSelect('ppabp-of-'+r,c['of_'+r]||[],usedOf,jugPropios,PP_ABP_ROLES_OF_LABELS[r])});h+='<div style="margin-top:8px"><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Seña</label><input type="text" id="ppabp-sena" value="'+ppEsc(c.sena||'')+'" placeholder="Ej: Levanto el brazo..." style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div></div>'}if(c.tipo==='defensiva'){h+='<div style="border-top:1px solid #1e3a5f;padding-top:12px;margin-bottom:12px"><div style="font-size:12px;font-weight:700;color:#3b82f6;text-transform:uppercase;margin-bottom:8px">Marcas — Emparejar jugadores</div>';var marcas=c.marcas||[];var usedRivals={};var usedPropiosMarca={};marcas.forEach(function(m){if(m.rival_idx)usedRivals[m.rival_idx]=true;if(m.propio_id)usedPropiosMarca[m.propio_id]=true});for(var mi=0;mi<7;mi++){var marca=marcas[mi]||{rival_idx:'',propio_id:''};h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;padding:6px 10px;background:#0f172a;border:1px solid #1e293b;border-radius:6px"><span style="font-size:11px;color:#64748b;font-weight:600;min-width:60px">Marca '+(mi+1)+'</span><select id="ppabp-marca-r-'+mi+'" onchange="ppAbpMarcaChange()" style="flex:1;padding:5px 8px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:12px"><option value="">Rival...</option>';jugRivales.forEach(function(j){var yaU=usedRivals[j.id]&&marca.rival_idx!==j.id;h+='<option value="'+j.id+'"'+(marca.rival_idx===j.id?' selected':'')+(yaU?' disabled style="color:#475569"':'')+'>'+( j.number?'#'+j.number+' ':'')+ppEsc(j.name)+(yaU?' (asignado)':'')+'</option>'});h+='</select><span style="color:#f59e0b;font-size:14px">⚔️</span><select id="ppabp-marca-p-'+mi+'" onchange="ppAbpMarcaChange()" style="flex:1;padding:5px 8px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:12px"><option value="">Propio...</option>';jugPropios.forEach(function(j){var yaU=usedPropiosMarca[j.id]&&marca.propio_id!==j.id;h+='<option value="'+j.id+'"'+(marca.propio_id===j.id?' selected':'')+(yaU?' disabled style="color:#475569"':'')+'>'+( j.number?'#'+j.number+' ':'')+ppEsc(j.name)+(yaU?' (asignado)':'')+'</option>'});h+='</select></div>'}h+='<div style="font-size:12px;font-weight:700;color:#3b82f6;text-transform:uppercase;margin:12px 0 8px">Roles defensivos</div>';PP_ABP_ROLES_DF.forEach(function(r){h+=ppAbpPlayerSelect('ppabp-df-'+r,c['df_'+r]||[],usedDf,jugPropios,PP_ABP_ROLES_DF_LABELS[r])});h+=ppAbpPlayerSelect('ppabp-df-barrera',c.df_barrera||[],usedDf,jugPropios,'Barrera (1-7)');h+='</div>'}h+='<div style="margin-bottom:12px"><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Explicacion</label><textarea id="ppabp-explicacion" rows="3" style="width:100%;padding:8px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;resize:vertical">'+ppEsc(c.explicacion)+'</textarea></div>';h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px"><div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Imagen (PNG)</label>';if(c.imagen){h+='<div style="position:relative;display:inline-block"><img src="'+c.imagen+'" style="max-width:100%;max-height:200px;border-radius:8px;cursor:pointer" onclick="ppMostrarVisor(_ppAbpForm.imagen)"><button onclick="ppAbpQuitarImagen()" style="position:absolute;top:4px;right:4px;background:#7f1d1d;border:none;color:#fca5a5;cursor:pointer;font-size:10px;width:20px;height:20px;border-radius:50%">✕</button></div>'}else{h+='<div style="padding:20px;background:#1e293b;border:2px dashed #334155;border-radius:8px;text-align:center;cursor:pointer" onclick="document.getElementById(\'ppabp-img-input\').click()"><div style="font-size:24px;color:#475569;margin-bottom:4px">🖼️</div><div style="font-size:11px;color:#64748b">Clic para subir</div></div>'}h+='<input type="file" id="ppabp-img-input" accept="image/*" style="display:none" onchange="ppAbpSubirImagen(this)"></div>';h+='<div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Video</label>';if(c.video){var esDataV=c.video.indexOf('data:')===0;h+='<div style="display:flex;align-items:center;gap:8px;padding:8px;background:#1e293b;border:1px solid #334155;border-radius:6px"><span style="font-size:14px">🎬</span><a href="'+(esDataV?'#':ppEsc(c.video))+'" '+(esDataV?'':'target="_blank"')+' style="color:#60a5fa;text-decoration:none;flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+ppEsc(c.video.substring(0,60))+'</a><button onclick="_ppAbpForm.video=\'\';ppCollectAbpFormData();ppRenderAbpForm()" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px">✕</button></div>'}else{h+='<button onclick="ppAbpAgregarVideo()" style="padding:10px;width:100%;background:#1e293b;border:2px dashed #334155;border-radius:8px;color:#64748b;cursor:pointer;font-size:12px">🎬 Añadir video</button>'}h+='<input type="hidden" id="ppabp-video" value="'+ppEsc(c.video)+'"></div></div>';h+='<div style="display:flex;gap:8px;justify-content:flex-end">';if(esE)h+='<button onclick="ppEliminarAbp('+pp.abpEditIdx+')" style="padding:7px 14px;background:#7f1d1d;border:1px solid #dc2626;color:#fca5a5;border-radius:6px;cursor:pointer;font-size:12px;margin-right:auto">Eliminar</button>';h+='<button onclick="ppCerrarFormAbp()" style="padding:7px 16px;background:#1e293b;border:1px solid #475569;color:#9ca3af;border-radius:6px;cursor:pointer;font-size:12px">Cancelar</button><button onclick="ppGuardarAbp()" style="padding:7px 16px;background:#a855f7;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">'+(esE?'Guardar':'Crear ABP')+'</button></div></div>';area.style.display='block';area.innerHTML=h;area.scrollIntoView({behavior:'smooth',block:'nearest'})}
function ppAbpTipoChange(val){_ppAbpForm.tipo=val;ppCollectAbpFormData();ppRenderAbpForm()}
function ppAbpMarcaChange(){ppCollectAbpFormData();ppRenderAbpForm()}
function ppAbpAddPlayer(fieldId,playerId){if(!playerId)return;var key=fieldId.replace('ppabp-','').replace(/-/g,'_');if(!_ppAbpForm[key])_ppAbpForm[key]=[];if(_ppAbpForm[key].indexOf(playerId)<0)_ppAbpForm[key].push(playerId);ppCollectAbpFormData();ppRenderAbpForm()}
function ppAbpRemovePlayer(fieldId,idx){var key=fieldId.replace('ppabp-','').replace(/-/g,'_');if(_ppAbpForm[key])_ppAbpForm[key].splice(idx,1);ppCollectAbpFormData();ppRenderAbpForm()}
async function ppAbpSubirImagen(input){var file=input.files[0];if(!file)return;try{var dataUrl=await ppComprimirImagen(file,1400);_ppAbpForm.imagen=dataUrl;ppCollectAbpFormData();ppRenderAbpForm()}catch(e){showToast('Error: '+e.message)}}
function ppAbpQuitarImagen(){_ppAbpForm.imagen='';ppCollectAbpFormData();ppRenderAbpForm()}
function ppAbpAgregarVideo(){ppAbrirModalMedia('pp-abp-video-overlay',function(url,title,tipo){_ppAbpForm.video=url;ppCollectAbpFormData();ppRenderAbpForm();showToast('Video añadido')})}
function ppCollectAbpFormData(){var c=_ppAbpForm;if(!c)return;var el;el=document.getElementById('ppabp-name');if(el)c.name=el.value;el=document.getElementById('ppabp-tipo');if(el)c.tipo=el.value;el=document.getElementById('ppabp-subtipo');if(el)c.subtipo=el.value;el=document.getElementById('ppabp-espacio');if(el)c.espacio=el.value;el=document.getElementById('ppabp-perfil');if(el)c.perfil=el.value;el=document.getElementById('ppabp-distancia');if(el)c.distancia=el.value;el=document.getElementById('ppabp-explicacion');if(el)c.explicacion=el.value;el=document.getElementById('ppabp-video');if(el)c.video=el.value.trim();el=document.getElementById('ppabp-sena');if(el)c.sena=el.value;if(c.tipo==='defensiva'){c.marcas=[];for(var mi=0;mi<7;mi++){var rEl=document.getElementById('ppabp-marca-r-'+mi);var pEl=document.getElementById('ppabp-marca-p-'+mi);if(rEl&&pEl&&(rEl.value||pEl.value))c.marcas.push({rival_idx:rEl.value||'',propio_id:pEl.value||''})}}}
function ppCerrarFormAbp(){var a=document.getElementById('pp-abp-form-area');if(a)a.style.display='none';pp.abpEditIdx=-1;_ppAbpForm=null}
async function ppGuardarAbp(){ppCollectAbpFormData();var c=_ppAbpForm;if(!c)return;if(!c.name.trim()){showToast('Nombre obligatorio');return}c.name=c.name.trim();c.explicacion=(c.explicacion||'').trim();var cards=ppGetAbpCards();if(pp.abpEditIdx>=0)cards[pp.abpEditIdx]=c;else cards.push(c);await ppSaveAbpCards(cards);showToast(pp.abpEditIdx>=0?'Actualizada':'Creada');ppCerrarFormAbp();ppMostrarTab('abp')}
async function ppEliminarAbp(idx){if(!confirm('¿Eliminar?'))return;var cards=ppGetAbpCards();cards.splice(idx,1);await ppSaveAbpCards(cards);showToast('Eliminada');ppCerrarFormAbp();ppMostrarTab('abp')}
function ppAbpPlayerName(pid,jugadores){var p=jugadores.find(function(j){return j.id===pid});return p?((p.number?'#'+p.number+' ':'')+p.name):pid}
function ppExportarAbpPDF(idx){var cards=ppGetAbpCards();var c=cards[idx];if(!c)return;var par=pp.partidoActual;if(!par)return;var doc=new jspdf.jsPDF('p','mm','a4');var jugP=pp.plantilla;var jugR=(pp.planActual.rival_players||[]).map(function(j,i){return{id:'r_'+i,number:j.number,name:j.name}});var esOf=c.tipo==='ofensiva';var accentR=esOf?[34,197,94]:[59,130,246];var eL=par.home_away==='home';var miEq=(clubData&&clubData.name)||'Mi Equipo';var fecha=new Date(par.match_date+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'});doc.setFillColor(15,23,42);doc.rect(0,0,210,32,'F');doc.setFillColor(accentR[0],accentR[1],accentR[2]);doc.rect(0,32,210,1.5,'F');doc.setTextColor(255,255,255);doc.setFontSize(18);doc.setFont('helvetica','bold');doc.text(c.name||'ABP',105,12,{align:'center'});doc.setFontSize(10);doc.setFont('helvetica','normal');doc.text((eL?miEq+' vs '+par.opponent:par.opponent+' vs '+miEq),105,19,{align:'center'});doc.setFontSize(8);doc.setTextColor(180,180,200);doc.text(fecha+(par.competition?' · '+par.competition:''),105,25,{align:'center'});var y=38;var tags=[c.tipo.toUpperCase(),c.subtipo,c.espacio,c.perfil,c.distancia].filter(Boolean);var tagX=105-(tags.length*14);doc.setFontSize(8);doc.setFont('helvetica','bold');tags.forEach(function(t,i){var tw=doc.getTextWidth(t)+8;var tx=tagX+i*30;doc.setFillColor(accentR[0],accentR[1],accentR[2]);doc.roundedRect(tx,y-4,tw,7,2,2,'F');doc.setTextColor(255,255,255);doc.text(t,tx+tw/2,y,{align:'center'})});y+=10;if(c.imagen&&c.imagen.length>50){try{doc.setDrawColor(accentR[0],accentR[1],accentR[2]);doc.setLineWidth(0.8);doc.roundedRect(14,y-1,182,107,3,3,'S');doc.addImage(c.imagen,'JPEG',15,y,180,105);y+=113}catch(e){}}function drawSection(title,color){if(y>270){doc.addPage();y=15}doc.setFillColor(color[0],color[1],color[2]);doc.roundedRect(12,y,186,7,1.5,1.5,'F');doc.setTextColor(255,255,255);doc.setFontSize(9);doc.setFont('helvetica','bold');doc.text(title,16,y+5);y+=10}function drawField(label,value){if(!value)return;if(y>275){doc.addPage();y=15}doc.setFillColor(240,245,255);doc.roundedRect(12,y-1,186,6+Math.ceil(value.length/90)*4,1,1,'F');doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setTextColor(accentR[0],accentR[1],accentR[2]);doc.text(label,14,y+3);doc.setFont('helvetica','normal');doc.setTextColor(40,40,50);doc.setFontSize(9);var lines=doc.splitTextToSize(value,150);doc.text(lines,50,y+3);y+=5+lines.length*4}function drawFieldWide(label,value){if(!value)return;if(y>270){doc.addPage();y=15}doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setTextColor(accentR[0],accentR[1],accentR[2]);doc.text(label,14,y+3);y+=5;doc.setFillColor(245,247,252);doc.roundedRect(12,y-2,186,4+Math.ceil(value.length/80)*4,1,1,'F');doc.setFont('helvetica','normal');doc.setTextColor(40,40,50);doc.setFontSize(9);doc.splitTextToSize(value,182).forEach(function(ln){if(y>285){doc.addPage();y=15}doc.text(ln,14,y+2);y+=4});y+=3}if(esOf){if(c.sena){drawSection('SEÑA',[168,85,247]);drawFieldWide('',c.sena)}var hasRoles=false;PP_ABP_ROLES_OF.forEach(function(r){if((c['of_'+r]||[]).length)hasRoles=true});if(hasRoles){drawSection('ROLES OFENSIVOS',accentR);PP_ABP_ROLES_OF.forEach(function(r){var pls=c['of_'+r]||[];if(pls.length)drawField(PP_ABP_ROLES_OF_LABELS[r]+':',pls.map(function(pid){return ppAbpPlayerName(pid,jugP)}).join(', '))})}}if(!esOf){var marcas=c.marcas||[];var hasMarcas=marcas.some(function(m){return m.rival_idx||m.propio_id});if(hasMarcas){drawSection('MARCAS',accentR);marcas.forEach(function(m,i){if(!m.rival_idx&&!m.propio_id)return;if(y>280){doc.addPage();y=15}doc.setFillColor(i%2===0?240:248,245,255);doc.roundedRect(12,y-1,186,6,1,1,'F');doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(accentR[0],accentR[1],accentR[2]);doc.text('Marca '+(i+1),14,y+3);doc.setFont('helvetica','normal');doc.setTextColor(40,40,50);doc.text(ppAbpPlayerName(m.rival_idx,jugR),45,y+3);doc.setTextColor(245,158,11);doc.text(' ←→ ',100,y+3,{align:'center'});doc.setTextColor(40,40,50);doc.text(ppAbpPlayerName(m.propio_id,jugP),115,y+3);y+=7})}var hasRolesDf=false;PP_ABP_ROLES_DF.forEach(function(r){if((c['df_'+r]||[]).length)hasRolesDf=true});if(hasRolesDf||(c.df_barrera&&c.df_barrera.length)){drawSection('ROLES DEFENSIVOS',accentR);PP_ABP_ROLES_DF.forEach(function(r){var pls=c['df_'+r]||[];if(pls.length)drawField(PP_ABP_ROLES_DF_LABELS[r]+':',pls.map(function(pid){return ppAbpPlayerName(pid,jugP)}).join(', '))});if(c.df_barrera&&c.df_barrera.length)drawField('Barrera:',c.df_barrera.map(function(pid){return ppAbpPlayerName(pid,jugP)}).join(', '))}}if(c.explicacion){drawSection('EXPLICACION',[100,116,139]);drawFieldWide('',c.explicacion)}if(c.video){drawSection('VIDEO',[249,115,22]);drawFieldWide('',c.video)}var tp=doc.internal.getNumberOfPages();for(var i=1;i<=tp;i++){doc.setPage(i);doc.setFillColor(15,23,42);doc.rect(0,287,210,10,'F');doc.setFontSize(7);doc.setTextColor(100,116,139);doc.text('TopLiderCoach — ABP — '+(c.name||''),105,292,{align:'center'})}doc.save('ABP_'+(c.name||'sin_nombre').replace(/\s+/g,'_')+'.pdf');showToast('PDF generado')}

// === TAB: SEMANA (nuevo sistema de objetivos) ===
function ppCalcularSemana(){var md=new Date(pp.partidoActual.match_date+'T12:00:00');var d=[];for(var i=6;i>=0;i--){var x=new Date(md);x.setDate(x.getDate()-i);d.push({date:x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0'),dayName:['Dom','Lun','Mar','Mie','Jue','Vie','Sab'][x.getDay()],md:i===0?'MD':'MD-'+i,dayNum:x.getDate(),month:x.getMonth()+1})}return d}
async function ppCargarSemana(){var d=ppCalcularSemana();pp.semana.dias=d;try{var{data:s}=await supabaseClient.from('training_sessions').select('id,name,session_date,rpe').eq('club_id',clubId).gte('session_date',d[0].date).lte('session_date',d[d.length-1].date).order('session_date');pp.semana.sesiones=s||[];var{data:m}=await supabaseClient.from('training_periods').select('*').eq('club_id',clubId).eq('type','micro').lte('date_start',d[d.length-1].date).gte('date_end',d[0].date).limit(1);pp.semana.microciclo=(m&&m.length)?m[0]:null}catch(e){}var a=document.getElementById('pp-tab-content');if(a)a.innerHTML=ppRenderSemana()}
function ppRenderSemana(){var d=pp.semana.dias,s=pp.semana.sesiones,mic=pp.semana.microciclo,p=pp.planActual,wm=p.weekly_map||{},ob=p.weekly_objectives||[];var h='<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:20px">';if(mic)h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:10px 14px;background:#1e293b;border-radius:8px;border-left:4px solid '+(mic.color||'#22c55e')+'"><span style="font-size:13px;font-weight:600;color:#e2e8f0">'+ppEsc(mic.name)+'</span><span style="color:#64748b;font-size:11px">Microciclo</span></div>';h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><h3 style="margin:0;color:#e2e8f0;font-size:16px">📅 Mapa semanal</h3><button onclick="ppGenerarPDFSemanal()" style="padding:5px 12px;background:#4c1d95;border:1px solid #7c3aed;color:#c4b5fd;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600">📄 PDF Semanal</button></div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:20px">';d.forEach(function(dia){var eM=dia.md==='MD';var sd=s.filter(function(x){return x.session_date===dia.date});var or=wm[dia.md]||'';h+='<div style="background:'+(eM?'#7f1d1d':'#1e293b')+';border:1px solid '+(eM?'#ef4444':'#334155')+';border-radius:8px;padding:8px;min-height:100px"><div style="text-align:center;margin-bottom:6px"><div style="font-size:10px;color:#64748b;text-transform:uppercase">'+dia.dayName+'</div><div style="font-size:16px;font-weight:700;color:'+(eM?'#fca5a5':'#e2e8f0')+'">'+dia.dayNum+'/'+dia.month+'</div><div style="font-size:11px;font-weight:600;color:'+(eM?'#ef4444':'#f59e0b')+'">'+dia.md+'</div></div>';if(!eM){h+='<select onchange="ppGuardarOrientacion(\''+dia.md+'\',this.value)" style="width:100%;padding:3px;background:#0f172a;border:1px solid #334155;border-radius:4px;color:#94a3b8;font-size:10px;margin-bottom:4px"><option value="">Orientacion...</option>';PP_ORIENTACIONES.forEach(function(o){h+='<option value="'+o+'"'+(or===o?' selected':'')+'>'+o+'</option>'});h+='</select>'}else h+='<div style="text-align:center;font-size:11px;font-weight:600;color:#ef4444;margin-bottom:4px">⚽ PARTIDO</div>';if(sd.length)sd.forEach(function(x){h+='<div onclick="cambiarModulo(\'planificador\',document.querySelector(\'.main-tab.planificador\'));setTimeout(function(){cargarSesionEnEditor(\''+x.id+'\')},300)" style="background:#0f172a;border:1px solid #334155;border-radius:4px;padding:4px 6px;margin-top:3px;cursor:pointer;font-size:10px;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📋 '+ppEsc(x.name.substring(0,15))+(x.rpe?' <span style="color:#f59e0b">RPE:'+x.rpe+'</span>':'')+'</div>'});else if(!eM)h+='<div style="font-size:10px;color:#475569;text-align:center;margin-top:6px">Sin sesion</div>';var dayObjs=ob.filter(function(o){return o.session_day===dia.md});if(dayObjs.length){dayObjs.forEach(function(o){var cont=PP_CONTENIDOS.find(function(c){return c.id===o.contenido});var color=cont?cont.color:'#64748b';h+='<div onclick="ppAbrirFormObjetivo('+ob.indexOf(o)+')" style="background:'+color+'22;border:1px solid '+color+'44;border-radius:4px;padding:3px 6px;margin-top:3px;cursor:pointer;font-size:9px;color:'+color+';font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+ppEsc(o.text)+'">🎯 '+ppEsc(o.text.substring(0,18))+'</div>'})}h+='</div>'});h+='</div>';
// Objetivos
h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><h3 style="margin:0;color:#e2e8f0;font-size:16px">🎯 Objetivos ('+ob.length+')</h3><button onclick="ppAbrirFormObjetivo(-1)" style="padding:6px 14px;background:#3b82f6;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">+ Añadir</button></div><div id="pp-obj-form-area" style="display:none;margin-bottom:12px"></div>';
if(!ob.length)h+='<div style="padding:20px;background:#1e293b;border-radius:8px;text-align:center;color:#475569;font-size:13px">Sin objetivos</div>';
else{h+='<div style="display:flex;flex-direction:column;gap:8px">';ob.forEach(function(o,i){
    var cont=PP_CONTENIDOS.find(function(c){return c.id===o.contenido})||{label:'',color:'#64748b'};
    var ejCount=(o.ejercicios||[]).length;
    h+='<div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:12px;cursor:pointer" onclick="ppAbrirFormObjetivo('+i+')" onmouseenter="this.style.borderColor=\'#3b82f6\'" onmouseleave="this.style.borderColor=\'#334155\'">';
    h+='<div style="display:flex;align-items:center;gap:10px"><div style="width:4px;height:36px;background:'+cont.color+';border-radius:2px;flex-shrink:0"></div><div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600;color:#e2e8f0">'+ppEsc(o.text)+'</div>';
    h+='<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">';
    if(cont.label)h+='<span style="padding:2px 8px;background:'+cont.color+'22;border:1px solid '+cont.color+'44;border-radius:4px;font-size:10px;color:'+cont.color+';font-weight:600">'+cont.label+'</span>';
    if(o.session_day)h+='<span style="padding:2px 8px;background:#0f172a;border:1px solid #334155;border-radius:4px;font-size:10px;color:#f59e0b;font-weight:600">'+o.session_day+'</span>';
    if(ejCount)h+='<span style="padding:2px 8px;background:#0f172a;border:1px solid #334155;border-radius:4px;font-size:10px;color:#a855f7;font-weight:600">'+ejCount+' ejercicio'+(ejCount>1?'s':'')+'</span>';
    h+='</div>';
    if(o.notas)h+='<div style="font-size:11px;color:#64748b;margin-top:4px">'+ppEsc(o.notas)+'</div>';
    h+='</div></div>';
    // Mini thumbnails
    if(o.ejercicios&&o.ejercicios.length){h+='<div style="display:flex;gap:6px;margin-top:8px;margin-left:14px">';o.ejercicios.forEach(function(ej){var thumb=ej.thumbnail_svg&&ej.thumbnail_svg.length>50?ej.thumbnail_svg:(ej.thumbnail_url?'<img src="'+ej.thumbnail_url+'" style="width:100%;height:100%;object-fit:cover">':'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:12px;color:#334155">🎨</div>');h+='<div style="width:60px;height:38px;border-radius:4px;overflow:hidden;background:#0f4c2a;flex-shrink:0">'+thumb+'</div>'});h+='</div>'}
    h+='</div>';
});h+='</div>'}
return h+'</div>'}
function ppGenerarPDFSemanal() {
    if (!pp.planActual || !pp.partidoActual) return;
    var par = pp.partidoActual, plan = pp.planActual, wm = plan.weekly_map || {}, ob = plan.weekly_objectives || [];
    var dias = ppCalcularSemana();
    var doc = new jspdf.jsPDF('l', 'mm', 'a4'); // landscape
    var W = 297, H = 210;
    var eL = par.home_away === 'home';
    var miEq = (clubData && clubData.name) || 'Mi Equipo';
    var fecha = new Date(par.match_date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    // Cabecera
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, W, 22, 'F');
    doc.setFillColor(245, 158, 11); doc.rect(0, 22, W, 1.5, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('PLAN SEMANAL — ' + (eL ? miEq + ' vs ' + par.opponent : par.opponent + ' vs ' + miEq), W / 2, 10, { align: 'center' });
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 180, 200);
    doc.text(fecha + (par.competition ? '  ·  ' + par.competition : ''), W / 2, 17, { align: 'center' });

    // Microciclo
    var mic = pp.semana.microciclo;

    // Table config
    var startY = 28;
    var rowLabels = ['ORIENTACION', 'INDOOR / PRE SESION', 'ACTIVADOR CAMPO', 'PRINCIPALES CAMPO', 'POST SESION'];
    var contenidoIds = ['', 'indoor_pre', 'activador', 'principales', 'post'];
    var rowColors = [[168, 85, 247], [249, 115, 22], [234, 179, 8], [34, 197, 94], [59, 130, 246]];
    var labelW = 38;
    var colW = (W - labelW - 10) / 7;
    var startX = 5;
    var rowH = 28;

    // Header row (days)
    var hdrY = startY;
    doc.setFillColor(30, 41, 59); doc.rect(startX, hdrY, labelW, 14, 'F');
    doc.setTextColor(148, 163, 184); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text('SEMANA', startX + labelW / 2, hdrY + 5, { align: 'center' });
    if (mic) { doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.text(mic.name || '', startX + labelW / 2, hdrY + 10, { align: 'center' }); }

    dias.forEach(function(dia, di) {
        var x = startX + labelW + di * colW;
        var esMD = dia.md === 'MD';
        doc.setFillColor(esMD ? 127 : 30, esMD ? 29 : 41, esMD ? 29 : 59);
        doc.rect(x, hdrY, colW, 14, 'F');
        doc.setTextColor(esMD ? 252 : 226, esMD ? 165 : 232, esMD ? 165 : 240);
        doc.setFontSize(7); doc.setFont('helvetica', 'bold');
        doc.text(dia.dayName.toUpperCase(), x + colW / 2, hdrY + 4, { align: 'center' });
        doc.setFontSize(10);
        doc.text(dia.dayNum + '/' + dia.month, x + colW / 2, hdrY + 9, { align: 'center' });
        doc.setFontSize(7); doc.setTextColor(esMD ? 239 : 245, esMD ? 68 : 158, esMD ? 68 : 11);
        doc.text(dia.md, x + colW / 2, hdrY + 13, { align: 'center' });
    });

    startY = hdrY + 16;

    // Content rows
    rowLabels.forEach(function(label, ri) {
        var y = startY + ri * rowH;
        var rc = rowColors[ri];

        // Label cell
        doc.setFillColor(rc[0], rc[1], rc[2]); doc.rect(startX, y, labelW, rowH, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(6); doc.setFont('helvetica', 'bold');
        var labelLines = doc.splitTextToSize(label, labelW - 4);
        var labelY = y + (rowH / 2) - (labelLines.length * 3) + 3;
        labelLines.forEach(function(ln, li) { doc.text(ln, startX + labelW / 2, labelY + li * 5, { align: 'center' }); });

        // Day cells
        dias.forEach(function(dia, di) {
            var x = startX + labelW + di * colW;
            var esMD = dia.md === 'MD';

            doc.setFillColor(di % 2 === 0 ? 241 : 248, 245, di % 2 === 0 ? 249 : 255);
            doc.rect(x, y, colW, rowH, 'F');
            doc.setDrawColor(200, 210, 220); doc.setLineWidth(0.2);
            doc.rect(x, y, colW, rowH, 'S');

            if (esMD && ri === 0) {
                doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(239, 68, 68);
                doc.text('PARTIDO', x + colW / 2, y + rowH / 2 + 2, { align: 'center' });
                return;
            }

            var cellTexts = [];

            if (ri === 0) {
                // Orientacion
                var or = wm[dia.md] || '';
                if (or) cellTexts.push(or);
            } else {
                // Objectives for this day + content
                var contId = contenidoIds[ri];
                var dayObjs = ob.filter(function(o) { return o.session_day === dia.md && o.contenido === contId; });
                dayObjs.forEach(function(o) {
                    cellTexts.push(o.text);
                    if (o.ejercicios && o.ejercicios.length) {
                        o.ejercicios.forEach(function(ej) { cellTexts.push('  → ' + ej.name); });
                    }
                    if (o.notas) cellTexts.push('  (' + o.notas + ')');
                });
            }

            if (cellTexts.length) {
                doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 50);
                var ty = y + 3;
                cellTexts.forEach(function(t) {
                    var lines = doc.splitTextToSize(t, colW - 4);
                    lines.forEach(function(ln) {
                        if (ty < y + rowH - 1) {
                            doc.text(ln, x + 2, ty + 3);
                            ty += 4;
                        }
                    });
                });
            }
        });
    });

    // Sessions row
    var sesY = startY + rowLabels.length * rowH;
    doc.setFillColor(100, 116, 139); doc.rect(startX, sesY, labelW, 12, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(6); doc.setFont('helvetica', 'bold');
    doc.text('SESIONES', startX + labelW / 2, sesY + 7, { align: 'center' });
    var ses = pp.semana.sesiones || [];
    dias.forEach(function(dia, di) {
        var x = startX + labelW + di * colW;
        doc.setFillColor(di % 2 === 0 ? 241 : 248, 245, di % 2 === 0 ? 249 : 255);
        doc.rect(x, sesY, colW, 12, 'F');
        doc.setDrawColor(200, 210, 220); doc.rect(x, sesY, colW, 12, 'S');
        var daySes = ses.filter(function(s) { return s.session_date === dia.date; });
        if (daySes.length) {
            doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 50);
            daySes.forEach(function(s, si) {
                doc.text(s.name.substring(0, 20) + (s.rpe ? ' RPE:' + s.rpe : ''), x + 2, sesY + 4 + si * 4);
            });
        }
    });

    // Footer
    doc.setFillColor(15, 23, 42); doc.rect(0, H - 8, W, 8, 'F');
    doc.setFontSize(6); doc.setTextColor(100, 116, 139);
    doc.text('TopLiderCoach — Plan Semanal', W / 2, H - 3, { align: 'center' });

    doc.save('PlanSemanal_' + par.opponent.replace(/\s+/g, '_') + '.pdf');
    showToast('PDF semanal generado');
}

async function ppGuardarOrientacion(md,v){var wm=pp.planActual.weekly_map||{};wm[md]=v||'';try{await supabaseClient.from('match_plans').update({weekly_map:wm,updated_at:new Date().toISOString()}).eq('id',pp.planActual.id);pp.planActual.weekly_map=wm}catch(e){showToast('Error: '+e.message)}}

// === FORMULARIO OBJETIVO (nuevo) ===
function ppAbrirFormObjetivo(idx) {
    var oldIdx = pp.objEditIdx;
    pp.objEditIdx = idx;
    var a = document.getElementById('pp-obj-form-area'); if (!a) return;
    var ob = pp.planActual.weekly_objectives || [];
    var o = idx >= 0 ? ob[idx] : { text: '', contenido: '', session_day: '', notas: '', ejercicios: [] };
    if (oldIdx !== idx) _ppObjEjercicios = (o.ejercicios || []).slice();
    var esE = idx >= 0;
    var contOpts = '<option value="">Seleccionar...</option>';
    PP_CONTENIDOS.forEach(function(c) { contOpts += '<option value="' + c.id + '"' + (o.contenido === c.id ? ' selected' : '') + '>' + c.label + '</option>'; });
    var dO = '<option value="">Sin asignar</option>';
    pp.semana.dias.forEach(function(d) { if (d.md !== 'MD') dO += '<option value="' + d.md + '"' + (o.session_day === d.md ? ' selected' : '') + '>' + d.md + ' (' + d.dayName + ' ' + d.dayNum + '/' + d.month + ')</option>'; });
    // Render ejercicios vinculados
    var ejHtml = '';
    _ppObjEjercicios.forEach(function(ej, i) {
        var hasSvg = ej.thumbnail_svg && ej.thumbnail_svg.length > 50;
        var thumbHtml = hasSvg ? ej.thumbnail_svg : (ej.thumbnail_url ? '<img src="' + ej.thumbnail_url + '" style="width:100%;height:100%;object-fit:cover">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#334155">🎨</div>');
        var esTlc = ej.fuente === 'tlc' || (ej.id && String(ej.id).indexOf('tlc_') === 0);
        ejHtml += '<div style="display:flex;align-items:center;gap:10px;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:8px 10px;margin-bottom:4px">' +
            '<div style="width:64px;height:40px;border-radius:6px;overflow:hidden;background:#0f4c2a;flex-shrink:0;cursor:pointer" onclick="ppObjVerEjercicio(' + i + ')">' + thumbHtml + '</div>' +
            '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + ppEsc(ej.name) + '</div>' +
            '<div style="font-size:10px;color:#64748b">' + (ej.category || '') + (esTlc ? ' <span style="color:#7c3aed">TLC</span>' : ' <span style="color:#3b82f6">Propio</span>') + '</div></div>' +
            '<button onclick="ppObjQuitarEjercicio(' + i + ')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px">✕</button></div>';
    });

    a.style.display = 'block';
    a.innerHTML = '<div style="background:#0f2744;border:1px solid #1e3a5f;border-radius:10px;padding:14px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h4 style="margin:0;color:#e2e8f0;font-size:14px">' + (esE ? 'Editar objetivo' : 'Nuevo objetivo') + '</h4><button onclick="ppCerrarFormObjetivo()" style="background:none;border:none;color:#9ca3af;font-size:18px;cursor:pointer">✕</button></div>' +
        '<div style="margin-bottom:10px"><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Objetivo *</label><input type="text" id="ppo-text" value="' + ppEsc(o.text) + '" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">' +
            '<div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Contenido</label><select id="ppo-contenido" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px">' + contOpts + '</select></div>' +
            '<div><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Sesion</label><select id="ppo-day" style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px">' + dO + '</select></div>' +
        '</div>' +
        '<div style="margin-bottom:10px"><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Ejercicios vinculados</label>' +
            '<div id="ppo-ejercicios-list">' + ejHtml + '</div>' +
            '<button onclick="ppObjBuscarEjercicio()" style="padding:5px 12px;background:#0f172a;border:1px solid #334155;color:#94a3b8;border-radius:6px;cursor:pointer;font-size:11px;margin-top:4px">+ Vincular ejercicio</button>' +
        '</div>' +
        '<div style="margin-bottom:10px"><label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Notas</label><input type="text" id="ppo-notas" value="' + ppEsc(o.notas) + '" placeholder="Observaciones..." style="width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end">' +
            (esE ? '<button onclick="ppEliminarObjetivo(' + idx + ')" style="padding:7px 14px;background:#7f1d1d;border:1px solid #dc2626;color:#fca5a5;border-radius:6px;cursor:pointer;font-size:12px;margin-right:auto">Eliminar</button>' : '') +
            '<button onclick="ppCerrarFormObjetivo()" style="padding:7px 16px;background:#1e293b;border:1px solid #475569;color:#9ca3af;border-radius:6px;cursor:pointer;font-size:12px">Cancelar</button>' +
            '<button onclick="ppGuardarObjetivo()" style="padding:7px 16px;background:#3b82f6;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">' + (esE ? 'Guardar' : 'Añadir') + '</button>' +
        '</div></div>';
    a.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function ppCerrarFormObjetivo(){var a=document.getElementById('pp-obj-form-area');if(a)a.style.display='none';pp.objEditIdx=-1;_ppObjEjercicios=[]}
function ppObjVerEjercicio(i){var ej=_ppObjEjercicios[i];if(!ej)return;if(ej.url){window.open(ej.url,'_blank')}else if(ej.fuente==='tlc'){window.open('https://toplidercoach.com/wp-json/toplider/v1/ejercicio/'+String(ej.id).replace('tlc_',''),'_blank')}else{showToast('Sin URL disponible')}}
function ppObjQuitarEjercicio(i) {
    _ppObjEjercicios.splice(i, 1);
    ppAbrirFormObjetivo(pp.objEditIdx); // re-render preserving form data
}
var _ppObjBibFuente = 'tlc';
async function ppObjBuscarEjercicio() {
    var prev = document.getElementById('pp-ej-overlay'); if (prev) prev.remove();
    var ov = document.createElement('div'); ov.id = 'pp-ej-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
    ov.onclick = function(e) { if (e.target === ov) ov.remove(); };
    ov.innerHTML = '<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;max-width:700px;width:100%;max-height:80vh;display:flex;flex-direction:column"><div style="padding:16px 20px;border-bottom:1px solid #1e3a5f;display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0;color:#e2e8f0;font-size:16px">Vincular ejercicio</h3><button onclick="document.getElementById(\'pp-ej-overlay\').remove()" style="background:none;border:none;color:#9ca3af;font-size:20px;cursor:pointer">✕</button></div><div style="padding:12px 20px;border-bottom:1px solid #1e3a5f"><div style="display:flex;gap:6px;margin-bottom:10px"><button onclick="ppObjCambiarFuente(\'tlc\')" id="ppobj-tab-tlc" style="flex:1;padding:8px;font-size:12px;font-weight:600;border-radius:6px;border:2px solid #7c3aed;background:#7c3aed;color:#fff;cursor:pointer">TopLiderCoach</button><button onclick="ppObjCambiarFuente(\'mis\')" id="ppobj-tab-mis" style="flex:1;padding:8px;font-size:12px;font-weight:600;border-radius:6px;border:2px solid #7c3aed;background:transparent;color:#7c3aed;cursor:pointer">Mis Ejercicios</button></div><input type="text" id="pp-ej-search" oninput="clearTimeout(window._ppSearchTimer);window._ppSearchTimer=setTimeout(ppObjFiltrarActual,400)" placeholder="Buscar..." style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div id="pp-ej-results" style="flex:1;overflow-y:auto;padding:12px 20px"><div style="text-align:center;padding:20px;color:#64748b">Cargando...</div></div></div>';
    document.body.appendChild(ov);
    _ppObjBibFuente = 'tlc';
    ppObjCargarTLC(1);
}
function ppObjCambiarFuente(fuente) {
    _ppObjBibFuente = fuente;
    var btlc = document.getElementById('ppobj-tab-tlc'), bmis = document.getElementById('ppobj-tab-mis');
    if (fuente === 'tlc') { btlc.style.background = '#7c3aed'; btlc.style.color = '#fff'; bmis.style.background = 'transparent'; bmis.style.color = '#7c3aed'; ppObjCargarTLC(1); }
    else { bmis.style.background = '#7c3aed'; bmis.style.color = '#fff'; btlc.style.background = 'transparent'; btlc.style.color = '#7c3aed'; ppObjCargarMis(); }
}
async function ppObjCargarTLC(pagina, append) {
    var r = document.getElementById('pp-ej-results'); if (!r) return;
    if (!append) r.innerHTML = '<div style="text-align:center;padding:20px;color:#64748b">Cargando biblioteca...</div>';
    else { var lb = r.querySelector('[data-loadmore]'); if (lb) lb.remove(); }
    try {
        var s = (document.getElementById('pp-ej-search')?.value || '').trim();
        var url = 'https://toplidercoach.com/wp-json/toplider/v1/ejercicios?page=' + pagina + '&per_page=40';
        // filtrado client-side
        var res = await fetch(url);
        var data = await res.json();
        var ejercicios=data.ejercicios||[];if(s){var sl=s.toLowerCase();ejercicios=ejercicios.filter(function(e){return((e.titulo||'')+(e.entrenador||'')+(e.tema||'')).toLowerCase().indexOf(sl)>=0})}if(!ejercicios.length){r.innerHTML='<div style="text-align:center;padding:20px;color:#64748b">Sin resultados — carga mas ejercicios</div>';return}
        var yaIds = _ppObjEjercicios.map(function(e) { return 'tlc_' + e.id; });
        var h = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">';
        ejercicios.forEach(function(ej) {
            var yaVinc = yaIds.indexOf('tlc_' + ej.id) >= 0;
            h += '<div onclick="' + (yaVinc ? '' : 'ppObjVincularTLC(' + ej.id + ')') + '" style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:8px;cursor:' + (yaVinc ? 'not-allowed' : 'pointer') + ';opacity:' + (yaVinc ? '0.4' : '1') + '">' +
                '<div style="width:100%;aspect-ratio:8/5;border-radius:6px;overflow:hidden;background:#0f4c2a"><img src="' + (ej.imagen || 'https://via.placeholder.com/200x125?text=Sin+img') + '" style="width:100%;height:100%;object-fit:cover"></div>' +
                '<div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + ppEsc(ej.titulo) + '</div>' +
                (ej.tema ? '<div style="font-size:10px;color:#64748b">' + ppEsc(ej.tema) + '</div>' : '') +
                '</div>';
        });
        h += '</div>';
        if (data.pagination && data.pagination.total_pages > pagina) {
            h += '<div style="text-align:center;margin-top:12px;padding-bottom:8px"><button onclick="ppObjCargarTLC(' + (pagina + 1) + ',true)" style="padding:8px 24px;background:#3b82f6;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">Cargar mas (' + pagina + '/' + data.total_pages + ')</button></div>';
        }
        if (append) { var tmp = document.createElement('div'); tmp.innerHTML = h; while (tmp.firstChild) r.appendChild(tmp.firstChild); } else r.innerHTML = h;
    } catch (e) { if (!append) r.innerHTML = '<div style="color:#ef4444;text-align:center;padding:20px">Error: ' + e.message + '</div>'; }
}
async function ppObjVincularTLC(ejId) {
    try {
        var res = await fetch('https://toplidercoach.com/wp-json/toplider/v1/ejercicio/' + ejId);
        var data = await res.json();
        if (data.success && data.ejercicio) {
            var ej = data.ejercicio;
            _ppObjEjercicios.push({ id: 'tlc_' + ej.id, name: ej.titulo, category: ej.tema || '', thumbnail_svg: '', thumbnail_url: ej.imagen || '', fuente: 'tlc', url: ej.url || '' });
            var ov = document.getElementById('pp-ej-overlay'); if (ov) ov.remove();
            showToast('Ejercicio vinculado');
            ppObjRefreshForm();
        }
    } catch (e) { showToast('Error: ' + e.message); }
}
function ppObjRefreshForm() {
    var text = document.getElementById('ppo-text')?.value || '';
    var cont = document.getElementById('ppo-contenido')?.value || '';
    var day = document.getElementById('ppo-day')?.value || '';
    var notas = document.getElementById('ppo-notas')?.value || '';
    var savedEjs = _ppObjEjercicios.slice();
    ppAbrirFormObjetivo(pp.objEditIdx);
    _ppObjEjercicios = savedEjs;
    // Re-render exercise list
    var ejHtml = '';
    _ppObjEjercicios.forEach(function(ej, i) {
        var hasSvg = ej.thumbnail_svg && ej.thumbnail_svg.length > 50;
        var thumbHtml = hasSvg ? ej.thumbnail_svg : (ej.thumbnail_url ? '<img src="' + ej.thumbnail_url + '" style="width:100%;height:100%;object-fit:cover">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#334155">🎨</div>');
        var esTlc = ej.fuente === 'tlc' || (ej.id && String(ej.id).indexOf('tlc_') === 0);
        ejHtml += '<div style="display:flex;align-items:center;gap:10px;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:8px 10px;margin-bottom:4px"><div style="width:64px;height:40px;border-radius:6px;overflow:hidden;background:#0f4c2a;flex-shrink:0;cursor:pointer" onclick="ppObjVerEjercicio(' + i + ')">' + thumbHtml + '</div><div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + ppEsc(ej.name) + '</div><div style="font-size:10px;color:#64748b">' + (ej.category || '') + (esTlc ? ' <span style="color:#7c3aed">TLC</span>' : ' <span style="color:#3b82f6">Propio</span>') + '</div></div><button onclick="ppObjQuitarEjercicio(' + i + ')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px">✕</button></div>';
    });
    var listEl = document.getElementById('ppo-ejercicios-list');
    if (listEl) listEl.innerHTML = ejHtml;
    setTimeout(function() {
        var el;
        el = document.getElementById('ppo-text'); if (el) el.value = text;
        el = document.getElementById('ppo-contenido'); if (el) el.value = cont;
        el = document.getElementById('ppo-day'); if (el) el.value = day;
        el = document.getElementById('ppo-notas'); if (el) el.value = notas;
    }, 50);
}
async function ppObjCargarMis() {
    var r = document.getElementById('pp-ej-results'); if (!r) return;
    r.innerHTML = '<div style="text-align:center;padding:20px;color:#64748b">Cargando...</div>';
    try {
        var { data } = await supabaseClient.from('custom_exercises').select('id,name,category,tema,objectives,thumbnail_svg,animation_url').eq('coach_id', String(typeof usuario !== 'undefined' ? usuario.id : '')).order('name');
        window._ppEjCache = data || [];
        ppObjFiltrarMis();
    } catch (e) { r.innerHTML = '<div style="color:#ef4444;text-align:center;padding:20px">' + e.message + '</div>'; }
}
function ppObjFiltrarActual() { if (_ppObjBibFuente === 'tlc') ppObjCargarTLC(1); else ppObjFiltrarMis(); }
function ppObjFiltrarMis() {
    var s = (document.getElementById('pp-ej-search')?.value || '').toLowerCase();
    var r = document.getElementById('pp-ej-results'); if (!r) return;
    var yaIds = _ppObjEjercicios.map(function(e) { return e.id; });
    var f = (window._ppEjCache || []).filter(function(e) { return yaIds.indexOf(e.id) < 0 && (!s || ((e.name || '') + ' ' + (e.category || '') + ' ' + (e.tema || '')).toLowerCase().indexOf(s) >= 0); });
    if (!f.length) { r.innerHTML = '<div style="text-align:center;padding:20px;color:#64748b">Sin resultados</div>'; return; }
    var h = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">';
    f.forEach(function(e) {
        h += '<div onclick="ppObjVincularEjercicio(\'' + e.id + '\')" style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:8px;cursor:pointer">' +
            (e.thumbnail_svg && e.thumbnail_svg.length > 100 ? '<div style="width:100%;aspect-ratio:8/5;border-radius:6px;overflow:hidden;background:#0f4c2a">' + e.thumbnail_svg + '</div>' : '<div style="width:100%;aspect-ratio:8/5;border-radius:6px;background:#1e293b;display:flex;align-items:center;justify-content:center;font-size:20px;color:#334155">🎨</div>') +
            '<div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + ppEsc(e.name) + '</div></div>';
    });
    r.innerHTML = h + '</div>';
}
function ppObjFiltrarEjercicios() {
    var s = (document.getElementById('pp-ej-search')?.value || '').toLowerCase();
    var r = document.getElementById('pp-ej-results'); if (!r) return;
    var yaIds = _ppObjEjercicios.map(function(e) { return e.id; });
    var f = (window._ppEjCache || []).filter(function(e) { return yaIds.indexOf(e.id) < 0 && (!s || ((e.name || '') + ' ' + (e.category || '') + ' ' + (e.tema || '')).toLowerCase().indexOf(s) >= 0); });
    if (!f.length) { r.innerHTML = '<div style="text-align:center;padding:20px;color:#64748b">Sin resultados</div>'; return; }
    var h = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">';
    f.forEach(function(e) {
        h += '<div onclick="ppObjVincularEjercicio(\'' + e.id + '\')" style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:8px;cursor:pointer" onmouseenter="this.style.borderColor=\'#3b82f6\'" onmouseleave="this.style.borderColor=\'#334155\'">' +
            (e.thumbnail_svg && e.thumbnail_svg.length > 100 ? '<div style="width:100%;aspect-ratio:8/5;border-radius:6px;overflow:hidden;background:#0f4c2a">' + e.thumbnail_svg + '</div>' : '<div style="width:100%;aspect-ratio:8/5;border-radius:6px;background:#1e293b;display:flex;align-items:center;justify-content:center;font-size:20px;color:#334155">🎨</div>') +
            '<div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + ppEsc(e.name) + '</div></div>';
    });
    r.innerHTML = h + '</div>';
}
function ppObjVincularEjercicio(ejId) {
    var ej = (window._ppEjCache || []).find(function(e) { return e.id === ejId; });
    if (!ej) return;
    _ppObjEjercicios.push({ id: ej.id, name: ej.name, category: ej.category || '', thumbnail_svg: ej.thumbnail_svg || '', fuente: 'custom' });
    var ov = document.getElementById('pp-ej-overlay'); if (ov) ov.remove();
    showToast('Ejercicio vinculado');
    ppObjRefreshForm();
}
async function ppGuardarObjetivo() {
    var t = document.getElementById('ppo-text').value.trim();
    if (!t) { showToast('Obligatorio'); return; }
    var o = {
        text: t,
        contenido: document.getElementById('ppo-contenido').value || '',
        session_day: document.getElementById('ppo-day').value || '',
        notas: document.getElementById('ppo-notas').value.trim() || '',
        ejercicios: _ppObjEjercicios.slice()
    };
    var ob = pp.planActual.weekly_objectives || [];
    if (pp.objEditIdx >= 0) ob[pp.objEditIdx] = o; else ob.push(o);
    try {
        await supabaseClient.from('match_plans').update({ weekly_objectives: ob, updated_at: new Date().toISOString() }).eq('id', pp.planActual.id);
        pp.planActual.weekly_objectives = ob;
        ppCerrarFormObjetivo();
        ppCargarSemana();
    } catch (e) { showToast('Error: ' + e.message); }
}
async function ppEliminarObjetivo(i){if(!confirm('¿Eliminar?'))return;var ob=pp.planActual.weekly_objectives||[];ob.splice(i,1);try{await supabaseClient.from('match_plans').update({weekly_objectives:ob,updated_at:new Date().toISOString()}).eq('id',pp.planActual.id);pp.planActual.weekly_objectives=ob;ppCerrarFormObjetivo();ppCargarSemana()}catch(e){showToast('Error: '+e.message)}}

// === TAB: ARCHIVOS ===
function ppRenderContenidos(){var p=pp.planActual;var ejs=p.linked_exercises||[],abps=p.linked_abps||[],vids=p.tacticlip_videos||[];var h='<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:20px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><h3 style="margin:0;color:#e2e8f0;font-size:16px">🎯 Ejercicios ('+ejs.length+')</h3><button onclick="ppBuscarEjercicio(\'exercise\')" style="padding:6px 14px;background:#3b82f6;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">+ Vincular</button></div>';if(!ejs.length)h+='<div style="padding:16px;background:#1e293b;border-radius:8px;text-align:center;color:#475569;font-size:12px;margin-bottom:20px">Vincula ejercicios</div>';else{h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin-bottom:20px">';ejs.forEach(function(e,i){h+=ppRenderEjCard(e,i,'exercise')});h+='</div>'}h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><h3 style="margin:0;color:#a855f7;font-size:16px">⚽ ABPs ('+abps.length+')</h3><button onclick="ppBuscarEjercicio(\'abp\')" style="padding:6px 14px;background:#a855f7;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">+ Vincular</button></div>';if(!abps.length)h+='<div style="padding:16px;background:#1e293b;border-radius:8px;text-align:center;color:#475569;font-size:12px;margin-bottom:20px">Selecciona ABPs</div>';else{h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin-bottom:20px">';abps.forEach(function(e,i){h+=ppRenderEjCard(e,i,'abp')});h+='</div>'}h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><h3 style="margin:0;color:#f97316;font-size:16px">🎬 Videos ('+vids.length+')</h3><button onclick="ppAgregarTactiClip()" style="padding:6px 14px;background:#f97316;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">+ Añadir</button></div>';if(!vids.length)h+='<div style="padding:16px;background:#1e293b;border-radius:8px;text-align:center;color:#475569;font-size:12px">Videos tacticos</div>';else{h+='<div style="display:flex;flex-direction:column;gap:6px">';vids.forEach(function(v,i){h+='<div style="display:flex;align-items:center;gap:10px;background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 14px"><span style="font-size:14px">🎬</span><div style="flex:1"><a href="'+ppEsc(v.url)+'" target="_blank" style="color:#60a5fa;text-decoration:none;font-size:13px">'+ppEsc(v.title||v.url)+'</a></div><button onclick="ppEliminarTactiClip('+i+')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:16px">✕</button></div>'});h+='</div>'}return h+'</div>'}
function ppRenderEjCard(ej,idx,tipo){var hs=ej.thumbnail_svg&&ej.thumbnail_svg.length>100;return '<div style="background:#0f172a;border:1px solid '+(tipo==='abp'?'#7c3aed':'#334155')+';border-radius:10px;padding:10px;position:relative"><button onclick="event.stopPropagation();ppDesvincularEjercicio('+idx+',\''+tipo+'\')" style="position:absolute;top:6px;right:6px;background:#7f1d1d;border:none;color:#fca5a5;cursor:pointer;font-size:12px;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:1">✕</button>'+(hs?'<div style="width:100%;aspect-ratio:8/5;border-radius:6px;overflow:hidden;background:#0f4c2a;margin-bottom:6px">'+ej.thumbnail_svg+'</div>':'<div style="width:100%;aspect-ratio:8/5;border-radius:6px;background:#1e293b;display:flex;align-items:center;justify-content:center;margin-bottom:6px;font-size:24px;color:#334155">🎨</div>')+'<div style="font-size:12px;font-weight:600;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+ppEsc(ej.name)+'</div></div>'}
async function ppBuscarEjercicio(tipo){var prev=document.getElementById('pp-ej-overlay');if(prev)prev.remove();var ov=document.createElement('div');ov.id='pp-ej-overlay';ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';ov.onclick=function(e){if(e.target===ov)ov.remove()};ov.innerHTML='<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;max-width:700px;width:100%;max-height:80vh;display:flex;flex-direction:column"><div style="padding:16px 20px;border-bottom:1px solid #1e3a5f;display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0;color:#e2e8f0;font-size:16px">'+(tipo==='abp'?'Vincular ABP':'Vincular ejercicio')+'</h3><button onclick="document.getElementById(\'pp-ej-overlay\').remove()" style="background:none;border:none;color:#9ca3af;font-size:20px;cursor:pointer">✕</button></div><div style="padding:12px 20px;border-bottom:1px solid #1e3a5f"><input type="text" id="pp-ej-search" oninput="ppFiltrarEjercicios(\''+tipo+'\')" placeholder="Buscar..." style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px"></div><div id="pp-ej-results" style="flex:1;overflow-y:auto;padding:12px 20px"><div style="text-align:center;padding:20px;color:#64748b">Cargando...</div></div></div>';document.body.appendChild(ov);try{var{data}=await supabaseClient.from('custom_exercises').select('id,name,category,tema,objectives,thumbnail_svg,animation_url').eq('coach_id',String(typeof usuario!=='undefined'?usuario.id:'')).order('name');window._ppEjCache=data||[];ppFiltrarEjercicios(tipo)}catch(e){document.getElementById('pp-ej-results').innerHTML='<div style="color:#ef4444;text-align:center;padding:20px">'+e.message+'</div>'}}
function ppFiltrarEjercicios(tipo){var s=(document.getElementById('pp-ej-search')?.value||'').toLowerCase();var r=document.getElementById('pp-ej-results');if(!r)return;var ya=tipo==='abp'?(pp.planActual.linked_abps||[]):(pp.planActual.linked_exercises||[]);var ids=ya.map(function(e){return e.id});var f=(window._ppEjCache||[]).filter(function(e){return ids.indexOf(e.id)<0&&(!s||((e.name||'')+' '+(e.category||'')+' '+(e.tema||'')).toLowerCase().indexOf(s)>=0)});if(!f.length){r.innerHTML='<div style="text-align:center;padding:20px;color:#64748b">Sin resultados</div>';return}var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">';f.forEach(function(e){h+='<div onclick="ppVincularEjercicio(\''+e.id+'\',\''+tipo+'\')" style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:8px;cursor:pointer">'+(e.thumbnail_svg&&e.thumbnail_svg.length>100?'<div style="width:100%;aspect-ratio:8/5;border-radius:6px;overflow:hidden;background:#0f4c2a">'+e.thumbnail_svg+'</div>':'<div style="width:100%;aspect-ratio:8/5;border-radius:6px;background:#1e293b;display:flex;align-items:center;justify-content:center;font-size:20px;color:#334155">🎨</div>')+'<div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+ppEsc(e.name)+'</div></div>'});r.innerHTML=h+'</div>'}
async function ppVincularEjercicio(ejId,tipo){var ej=(window._ppEjCache||[]).find(function(e){return e.id===ejId});if(!ej)return;var campo=tipo==='abp'?'linked_abps':'linked_exercises';var lista=pp.planActual[campo]||[];lista.push({id:ej.id,name:ej.name,category:ej.category||'',tema:ej.tema||'',objectives:ej.objectives||'',thumbnail_svg:ej.thumbnail_svg||'',animation_url:ej.animation_url||''});try{var up={updated_at:new Date().toISOString()};up[campo]=lista;await supabaseClient.from('match_plans').update(up).eq('id',pp.planActual.id);pp.planActual[campo]=lista;showToast('Vinculado');var ov=document.getElementById('pp-ej-overlay');if(ov)ov.remove();ppMostrarTab('contenido')}catch(e){showToast('Error: '+e.message)}}
async function ppDesvincularEjercicio(idx,tipo){if(!confirm('¿Desvincular?'))return;var campo=tipo==='abp'?'linked_abps':'linked_exercises';var lista=pp.planActual[campo]||[];lista.splice(idx,1);try{var up={updated_at:new Date().toISOString()};up[campo]=lista;await supabaseClient.from('match_plans').update(up).eq('id',pp.planActual.id);pp.planActual[campo]=lista;ppMostrarTab('contenido')}catch(e){showToast('Error: '+e.message)}}
function ppAgregarTactiClip(){ppAbrirModalMedia('pp-tc-overlay',function(url,title){ppSaveTactiClip(url,title,'')})}
async function ppSaveTactiClip(url,title,desc){var v=pp.planActual.tacticlip_videos||[];v.push({url:url,title:title,description:desc});try{await supabaseClient.from('match_plans').update({tacticlip_videos:v,updated_at:new Date().toISOString()}).eq('id',pp.planActual.id);pp.planActual.tacticlip_videos=v;showToast('Añadido');ppMostrarTab('contenido')}catch(e){showToast('Error: '+e.message)}}
async function ppEliminarTactiClip(i){if(!confirm('¿Eliminar?'))return;var v=pp.planActual.tacticlip_videos||[];v.splice(i,1);try{await supabaseClient.from('match_plans').update({tacticlip_videos:v,updated_at:new Date().toISOString()}).eq('id',pp.planActual.id);pp.planActual.tacticlip_videos=v;ppMostrarTab('contenido')}catch(e){showToast('Error: '+e.message)}}

// === PDF + PRESENTACION ===
function ppAddBotonesSalida(){var b=document.getElementById('pp-status-badge');if(!b||!pp.planActual)return;if(b.innerHTML.indexOf('pp-btn-pdf')>=0)return;b.innerHTML='<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><button id="pp-btn-pdf" onclick="ppGenerarPDF()" style="padding:5px 12px;background:#4c1d95;border:1px solid #7c3aed;color:#c4b5fd;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600">📄 PDF</button><button onclick="ppPresentacion()" style="padding:5px 12px;background:#065f46;border:1px solid #10b981;color:#6ee7b7;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600">📺 Charla</button>'+b.innerHTML+'</div>'}

function ppLoadImg(url){return new Promise(function(resolve){if(!url){resolve(null);return}if(url.indexOf('data:')===0){resolve(url);return}var img=new Image();img.crossOrigin='anonymous';img.onload=function(){try{var c=document.createElement('canvas');c.width=img.width;c.height=img.height;c.getContext('2d').drawImage(img,0,0);resolve(c.toDataURL('image/png'))}catch(e){resolve(null)}};img.onerror=function(){resolve(null)};img.src=url})}

function ppGetImgSize(dataUrl){return new Promise(function(resolve){var img=new Image();img.onload=function(){resolve({w:img.naturalWidth,h:img.naturalHeight})};img.onerror=function(){resolve({w:4,h:3})};img.src=dataUrl})}

async function ppGenerarPDF(){
if(!pp.planActual||!pp.partidoActual)return;
showToast('Generando PDF...');
var plan=pp.planActual,par=pp.partidoActual;
var doc=new jspdf.jsPDF('p','mm','a4');
var W=210,MG=12,CW=W-MG*2;
var eL=par.home_away==='home';
var miEq=(clubData&&clubData.name)||'Mi Equipo';
var rivalNom=par.opponent||'Rival';
var fecha=new Date(par.match_date+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
var hora=par.kick_off_time?par.kick_off_time.slice(0,5)+'h':'';

var logoClub=null,logoRival=null;
try{logoClub=await ppLoadImg(clubData&&clubData.logo_url)}catch(e){}
try{logoRival=await ppLoadImg((pp.rivalActual&&pp.rivalActual.logo_url)||par.opponent_logo)}catch(e){}

var y=0;
var cDark=[15,23,42],cAccent=[245,158,11],cGreen=[34,197,94],cBlue=[59,130,246],cRed=[239,68,68],cPurple=[168,85,247],cGray=[100,116,139];

function newPage(){doc.addPage();y=12;return y}
function checkSpace(need){if(y+need>278){newPage()}return y}

// =============================================
// PORTADA — layout vertical
// =============================================
doc.setFillColor(cDark[0],cDark[1],cDark[2]);
doc.rect(0,0,W,297,'F');
doc.setFillColor(cAccent[0],cAccent[1],cAccent[2]);
doc.rect(0,0,W,3,'F');

doc.setTextColor(cAccent[0],cAccent[1],cAccent[2]);
doc.setFontSize(11);doc.setFont('helvetica','normal');
doc.text('TOPLIDERCOACH HUB',105,28,{align:'center'});

doc.setFontSize(28);doc.setFont('helvetica','bold');
doc.setTextColor(255,255,255);
doc.text('PLAN DE PARTIDO',105,48,{align:'center'});

// Equipo local (arriba)
var localName=eL?miEq:rivalNom;
var visitName=eL?rivalNom:miEq;
var localLogo=eL?logoClub:logoRival;
var visitLogo=eL?logoRival:logoClub;

if(localLogo){try{doc.addImage(localLogo,'PNG',80,68,20,20)}catch(e){}}
doc.setFontSize(16);doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);
doc.text(localName.toUpperCase(),105,96,{align:'center'});

// VS
doc.setFontSize(20);doc.setTextColor(cAccent[0],cAccent[1],cAccent[2]);doc.setFont('helvetica','bold');
doc.text('VS',105,112,{align:'center'});
doc.setDrawColor(cAccent[0],cAccent[1],cAccent[2]);doc.setLineWidth(0.3);
doc.line(50,106,90,106);doc.line(120,106,160,106);

// Equipo visitante (abajo)
if(visitLogo){try{doc.addImage(visitLogo,'PNG',80,120,20,20)}catch(e){}}
doc.setFontSize(16);doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);
doc.text(visitName.toUpperCase(),105,148,{align:'center'});

// Linea separadora
doc.setDrawColor(cAccent[0],cAccent[1],cAccent[2]);doc.setLineWidth(0.5);
doc.line(60,160,150,160);

// Info partido
doc.setFontSize(12);doc.setFont('helvetica','normal');doc.setTextColor(200,210,230);
doc.text(fecha,105,172,{align:'center'});
var infoLine=[];
if(hora)infoLine.push(hora);
if(par.competition)infoLine.push(par.competition);
if(par.stadium)infoLine.push(par.stadium);
if(infoLine.length){doc.setFontSize(10);doc.text(infoLine.join('  |  '),105,180,{align:'center'})}

var statusText={draft:'BORRADOR',ready:'LISTO',presented:'PRESENTADO'}[plan.status]||'BORRADOR';
doc.setFontSize(9);doc.setTextColor(cAccent[0],cAccent[1],cAccent[2]);
doc.text(statusText,105,195,{align:'center'});

doc.setFillColor(cAccent[0],cAccent[1],cAccent[2]);
doc.rect(0,294,W,3,'F');

// =============================================
// FUNCIONES AUXILIARES (sin emoji)
// =============================================
function miniHeader(){
    doc.setFillColor(cDark[0],cDark[1],cDark[2]);doc.rect(0,0,W,20,'F');
    if(localLogo){try{doc.addImage(localLogo,'PNG',MG+2,3,14,14)}catch(e){}}
    doc.setTextColor(255,255,255);doc.setFontSize(9);doc.setFont('helvetica','bold');
    doc.text(localName,MG+20,11);
    doc.setTextColor(cAccent[0],cAccent[1],cAccent[2]);doc.setFontSize(10);
    doc.text('VS',105,11,{align:'center'});
    doc.setTextColor(255,255,255);doc.setFontSize(9);
    doc.text(visitName,W-MG-2,11,{align:'right'});
    if(visitLogo){try{doc.addImage(visitLogo,'PNG',W-MG-16,3,14,14)}catch(e){}}
    doc.setFillColor(cAccent[0],cAccent[1],cAccent[2]);doc.rect(0,20,W,1.5,'F');
}

function sectionHeader(title,color){
    checkSpace(14);
    doc.setFillColor(color[0],color[1],color[2]);
    doc.roundedRect(MG,y,CW,10,2,2,'F');
    doc.setTextColor(255,255,255);doc.setFontSize(12);doc.setFont('helvetica','bold');
    doc.text(title,MG+5,y+7);
    y+=14;
}

function subHeader(title,color){
    checkSpace(10);
    doc.setFillColor(color[0],color[1],color[2]);
    doc.rect(MG,y,3,7,'F');
    doc.setTextColor(color[0],color[1],color[2]);doc.setFontSize(10);doc.setFont('helvetica','bold');
    doc.text(title,MG+6,y+5.5);
    y+=10;
}

function textBlock(text,indent){
    if(!text)return;
    checkSpace(8);
    var ix=indent||0;
    doc.setFontSize(9);doc.setFont('helvetica','normal');doc.setTextColor(50,50,50);
    var lines=doc.splitTextToSize(text,CW-4-ix);
    lines.forEach(function(ln){
        checkSpace(4);
        doc.text(ln,MG+2+ix,y+3);
        y+=4;
    });
    y+=2;
}

async function addMediaImages(mediaArr){
    if(!mediaArr||!mediaArr.length)return;
    var imgs=mediaArr.filter(function(m){return m.type==='image'&&m.url&&m.url.length>50});
    if(!imgs.length)return;
    for(var ii=0;ii<imgs.length;ii++){
        var m=imgs[ii];
        var maxW=CW-20,maxH=80;
        try{
            var sz=await ppGetImgSize(m.url);
            var ratio=sz.w/sz.h;
            var drawW=maxW;
            var drawH=drawW/ratio;
            if(drawH>maxH){drawH=maxH;drawW=drawH*ratio}
            checkSpace(drawH+8);
            var imgX=MG+(CW-drawW)/2;
            doc.addImage(m.url,'JPEG',imgX,y,drawW,drawH);
            y+=drawH+2;
            if(m.title){
                doc.setFontSize(7);doc.setTextColor(cGray[0],cGray[1],cGray[2]);doc.setFont('helvetica','italic');
                doc.text(m.title,105,y+2,{align:'center'});
                y+=5;
            }
        }catch(e){y+=2}
    }
}

// =============================================
// PAGINA 2: SCOUTING
// =============================================
newPage();
miniHeader();
y=26;

sectionHeader('SCOUTING DEL RIVAL',cDark);

if(plan.rival_formation||plan.rival_style){
    checkSpace(12);
    doc.setFillColor(241,245,249);doc.roundedRect(MG,y,CW,10,2,2,'F');
    doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(cDark[0],cDark[1],cDark[2]);
    var formText=[];
    if(plan.rival_formation)formText.push('Formacion: '+plan.rival_formation);
    if(plan.rival_style)formText.push('Estilo: '+plan.rival_style);
    doc.text(formText.join('     '),MG+5,y+6.5);
    y+=14;
}

if(plan.rival_strengths||plan.rival_weaknesses){
    checkSpace(30);
    var halfW=(CW-4)/2;
    var startY=y;
    var endY1=startY,endY2=startY;
    if(plan.rival_strengths){
        doc.setFillColor(cGreen[0],cGreen[1],cGreen[2]);doc.roundedRect(MG,y,halfW,6,1.5,1.5,'F');
        doc.setTextColor(255,255,255);doc.setFontSize(8);doc.setFont('helvetica','bold');
        doc.text('PUNTOS FUERTES',MG+3,y+4.2);
        var sy=y+9;
        doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(50,50,50);
        doc.splitTextToSize(plan.rival_strengths,halfW-6).forEach(function(ln){
            if(sy<278){doc.text(ln,MG+3,sy);sy+=3.5}
        });
        endY1=sy;
    }
    if(plan.rival_weaknesses){
        var rx=MG+halfW+4;
        doc.setFillColor(cRed[0],cRed[1],cRed[2]);doc.roundedRect(rx,startY,halfW,6,1.5,1.5,'F');
        doc.setTextColor(255,255,255);doc.setFontSize(8);doc.setFont('helvetica','bold');
        doc.text('PUNTOS DEBILES',rx+3,startY+4.2);
        var sy2=startY+9;
        doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(50,50,50);
        doc.splitTextToSize(plan.rival_weaknesses,halfW-6).forEach(function(ln){
            if(sy2<278){doc.text(ln,rx+3,sy2);sy2+=3.5}
        });
        endY2=sy2;
    }
    y=Math.max(endY1,endY2)+4;
}

// =============================================
// JUGADORES
// =============================================
var jg=plan.rival_players||[];
if(jg.length){
    checkSpace(14);
    sectionHeader('JUGADORES RIVAL ('+jg.length+')',cDark);

    var lineas=[
        {key:'porteros',label:'PORTEROS',color:cGreen,poss:PP_LINEAS.porteros.posiciones},
        {key:'defensas',label:'DEFENSAS',color:cBlue,poss:PP_LINEAS.defensas.posiciones},
        {key:'medios',label:'MEDIOS',color:cAccent,poss:PP_LINEAS.medios.posiciones},
        {key:'delanteros',label:'DELANTEROS',color:cRed,poss:PP_LINEAS.delanteros.posiciones}
    ];

    lineas.forEach(function(lin){
        var jugLin=jg.filter(function(j){return lin.poss.indexOf(j.position)>=0});
        if(!jugLin.length)return;
        checkSpace(10);
        subHeader(lin.label+' ('+jugLin.length+')',lin.color);

        jugLin.forEach(function(j){
            checkSpace(22);
            doc.setFillColor(cDark[0],cDark[1],cDark[2]);
            doc.circle(MG+6,y+5,4.5,'F');
            doc.setTextColor(cAccent[0],cAccent[1],cAccent[2]);doc.setFontSize(9);doc.setFont('helvetica','bold');
            doc.text(String(j.number||'?'),MG+6,y+6.2,{align:'center'});

            doc.setTextColor(cDark[0],cDark[1],cDark[2]);doc.setFontSize(10);doc.setFont('helvetica','bold');
            doc.text(j.name||'?',MG+14,y+4.5);
            doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(cGray[0],cGray[1],cGray[2]);
            var meta=[];
            if(j.position)meta.push(j.position);
            if(j.foot)meta.push(j.foot);
            if(j.year)meta.push(String(j.year));
            if(j.club_from)meta.push('Proc: '+j.club_from);
            doc.text(meta.join(' - '),MG+14,y+8);

            var stats=[];
            if(j.games)stats.push('PJ:'+j.games);
            if(j.minutes)stats.push(j.minutes+"'");
            if(j.goals)stats.push(j.goals+' gol'+(j.goals>1?'es':''));
            if(stats.length){
                doc.setFontSize(7);doc.setTextColor(cAccent[0],cAccent[1],cAccent[2]);doc.setFont('helvetica','bold');
                doc.text(stats.join(' - '),W-MG-2,y+4.5,{align:'right'});
            }
            y+=10;

            if(j.analysis){
                doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(60,60,70);
                var alines=doc.splitTextToSize(j.analysis,CW-16);
                alines.forEach(function(ln){
                    checkSpace(4);
                    doc.text(ln,MG+14,y+2);
                    y+=3.5;
                });
            }
            y+=2;
            doc.setDrawColor(226,232,240);doc.setLineWidth(0.2);
            doc.line(MG+14,y,W-MG,y);
            y+=3;
        });
    });
}

// =============================================
// FASES DEL JUEGO RIVAL
// =============================================
var fa=plan.tactical_phases||[];
var fasesConContenido=fa.filter(function(f){return f.notes||(f.media&&f.media.length)});
if(fasesConContenido.length){
    checkSpace(14);
    sectionHeader('FASES DEL JUEGO RIVAL',cDark);

    var faseColors=[[15,110,86],[8,80,65],[153,60,29],[12,68,124],[60,52,137],[113,43,19]];
    for(var fi=0;fi<fa.length;fi++){
        var f=fa[fi];
        if(!f.notes&&(!f.media||!f.media.length))continue;
        checkSpace(16);

        var fc=faseColors[fi%faseColors.length];
        doc.setFillColor(fc[0],fc[1],fc[2]);doc.roundedRect(MG,y,CW,7,1.5,1.5,'F');
        doc.setTextColor(255,255,255);doc.setFontSize(9);doc.setFont('helvetica','bold');
        doc.text(f.title,MG+4,y+5);
        y+=10;

        if(f.notes){textBlock(f.notes)}
        await addMediaImages(f.media);
    }
}

// =============================================
// PLAN TACTICO PROPIO
// =============================================
var ourPhases=ppGetOurPhases();
var hasOur=false;
PP_OUR_SECTIONS.forEach(function(sec){if(sec.id){var d=ourPhases[sec.id];if(d&&(d.notes||(d.media&&d.media.length)))hasOur=true}});

if(hasOur){
    checkSpace(14);
    sectionHeader('PLAN TACTICO PROPIO'+(plan.our_formation?' — '+plan.our_formation:''),cDark);

    for(var si=0;si<PP_OUR_SECTIONS.length;si++){
        var sec=PP_OUR_SECTIONS[si];
        if(sec.type==='title'){
            checkSpace(10);
            var tColor=sec.color==='#22c55e'?cGreen:sec.color==='#3b82f6'?cBlue:sec.color==='#f59e0b'?cAccent:cPurple;
            subHeader(sec.label,tColor);
            continue;
        }
        var d=ourPhases[sec.id];
        if(!d||(!d.notes&&(!d.media||!d.media.length)))continue;

        checkSpace(10);
        doc.setFontSize(9);doc.setFont('helvetica','bold');
        var secColor=sec.color==='#22c55e'?cGreen:sec.color==='#3b82f6'?cBlue:sec.color==='#f59e0b'?cAccent:cPurple;
        doc.setTextColor(secColor[0],secColor[1],secColor[2]);
        doc.text(sec.title+':',MG+6,y+3);
        y+=6;

        if(d.notes){textBlock(d.notes,4)}
        await addMediaImages(d.media);
    }
}

// =============================================
// ABPs
// =============================================
var abpCards=ppGetAbpCards();
if(abpCards.length){
    checkSpace(14);
    sectionHeader('ABPs — ACCIONES A BALON PARADO ('+abpCards.length+')',cPurple);

    var jugP=pp.plantilla;
    var jugR=(plan.rival_players||[]).map(function(j,i){return{id:'r_'+i,number:j.number,name:j.name}});

    for(var ci=0;ci<abpCards.length;ci++){
        var c=abpCards[ci];
        checkSpace(30);
        var esOf=c.tipo==='ofensiva';
        var abpColor=esOf?cGreen:cBlue;

        doc.setFillColor(abpColor[0],abpColor[1],abpColor[2]);doc.roundedRect(MG,y,CW,8,2,2,'F');
        doc.setTextColor(255,255,255);doc.setFontSize(10);doc.setFont('helvetica','bold');
        doc.text((c.name||'ABP '+(ci+1)),MG+4,y+5.5);
        var tags=[c.tipo.toUpperCase(),c.subtipo,c.espacio,c.perfil,c.distancia].filter(Boolean);
        doc.setFontSize(7);doc.setFont('helvetica','normal');
        doc.text(tags.join(' | '),W-MG-2,y+5.5,{align:'right'});
        y+=12;

        // Imagen ABP respetando proporcion
        if(c.imagen&&c.imagen.length>50){
            try{
                var abpSz=await ppGetImgSize(c.imagen);
                var abpRatio=abpSz.w/abpSz.h;
                var abpMaxW=CW-20,abpMaxH=70;
                var abpW=abpMaxW,abpH=abpW/abpRatio;
                if(abpH>abpMaxH){abpH=abpMaxH;abpW=abpH*abpRatio}
                checkSpace(abpH+6);
                var abpX=MG+(CW-abpW)/2;
                doc.setDrawColor(abpColor[0],abpColor[1],abpColor[2]);doc.setLineWidth(0.8);
                doc.roundedRect(abpX-1,y-1,abpW+2,abpH+2,2,2,'S');
                doc.addImage(c.imagen,'JPEG',abpX,y,abpW,abpH);
                y+=abpH+4;
            }catch(e){}
        }

        if(esOf){
            var hasRoles=false;
            PP_ABP_ROLES_OF.forEach(function(r){if((c['of_'+r]||[]).length)hasRoles=true});
            if(hasRoles){
                checkSpace(8);
                PP_ABP_ROLES_OF.forEach(function(r){
                    var pls=c['of_'+r]||[];
                    if(!pls.length)return;
                    checkSpace(5);
                    doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(abpColor[0],abpColor[1],abpColor[2]);
                    doc.text(PP_ABP_ROLES_OF_LABELS[r]+':',MG+4,y+3);
                    doc.setFont('helvetica','normal');doc.setTextColor(50,50,50);
                    doc.text(pls.map(function(pid){return ppAbpPlayerName(pid,jugP)}).join(', '),MG+30,y+3);
                    y+=5;
                });
            }
            if(c.sena){
                checkSpace(5);
                doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(cPurple[0],cPurple[1],cPurple[2]);
                doc.text('Sena:',MG+4,y+3);
                doc.setFont('helvetica','normal');doc.setTextColor(50,50,50);
                doc.text(c.sena,MG+20,y+3);
                y+=5;
            }
        }

        if(!esOf){
            var marcas=c.marcas||[];
            var hasMarcas=marcas.some(function(m){return m.rival_idx||m.propio_id});
            if(hasMarcas){
                checkSpace(8);
                doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(abpColor[0],abpColor[1],abpColor[2]);
                doc.text('MARCAS:',MG+4,y+3);y+=5;
                marcas.forEach(function(m,mi){
                    if(!m.rival_idx&&!m.propio_id)return;
                    checkSpace(5);
                    doc.setFillColor(mi%2===0?245:250,247,252);doc.roundedRect(MG+4,y-1,CW-8,5,1,1,'F');
                    doc.setFontSize(7.5);doc.setFont('helvetica','normal');doc.setTextColor(50,50,50);
                    doc.text(ppAbpPlayerName(m.rival_idx,jugR),MG+8,y+2.5);
                    doc.setTextColor(cAccent[0],cAccent[1],cAccent[2]);doc.setFont('helvetica','bold');
                    doc.text('vs',105,y+2.5,{align:'center'});
                    doc.setTextColor(50,50,50);doc.setFont('helvetica','normal');
                    doc.text(ppAbpPlayerName(m.propio_id,jugP),112,y+2.5);
                    y+=5.5;
                });
            }
            PP_ABP_ROLES_DF.forEach(function(r){
                var pls=c['df_'+r]||[];
                if(!pls.length)return;
                checkSpace(5);
                doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(abpColor[0],abpColor[1],abpColor[2]);
                doc.text(PP_ABP_ROLES_DF_LABELS[r]+':',MG+4,y+3);
                doc.setFont('helvetica','normal');doc.setTextColor(50,50,50);
                doc.text(pls.map(function(pid){return ppAbpPlayerName(pid,jugP)}).join(', '),MG+30,y+3);
                y+=5;
            });
            if(c.df_barrera&&c.df_barrera.length){
                checkSpace(5);
                doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(abpColor[0],abpColor[1],abpColor[2]);
                doc.text('Barrera:',MG+4,y+3);
                doc.setFont('helvetica','normal');doc.setTextColor(50,50,50);
                doc.text(c.df_barrera.map(function(pid){return ppAbpPlayerName(pid,jugP)}).join(', '),MG+24,y+3);
                y+=5;
            }
        }

        if(c.explicacion){
            checkSpace(8);
            doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(cGray[0],cGray[1],cGray[2]);
            doc.text('Explicacion:',MG+4,y+3);y+=4;
            textBlock(c.explicacion,4);
        }

        y+=3;
        doc.setDrawColor(226,232,240);doc.setLineWidth(0.3);
        doc.line(MG,y,W-MG,y);
        y+=5;
    }
}

// =============================================
// PLAN SEMANAL
// =============================================
var ob=plan.weekly_objectives||[];
if(ob.length){
    checkSpace(14);
    sectionHeader('PLAN SEMANAL ('+ob.length+' objetivos)',cAccent);

    ob.forEach(function(o,i){
        checkSpace(16);
        var cont=PP_CONTENIDOS.find(function(c){return c.id===o.contenido});
        var cc=!cont?cGray:cont.color==='#f97316'?[249,115,22]:cont.color==='#eab308'?[234,179,8]:cont.color==='#22c55e'?cGreen:cont.color==='#3b82f6'?cBlue:cGray;

        doc.setFillColor(cc[0],cc[1],cc[2]);doc.circle(MG+4,y+3,3,'F');
        doc.setTextColor(255,255,255);doc.setFontSize(9);doc.setFont('helvetica','bold');
        doc.text(String(i+1),MG+4,y+4.2,{align:'center'});

        doc.setTextColor(cDark[0],cDark[1],cDark[2]);doc.setFontSize(10);
        doc.text(o.text,MG+10,y+4.5);
        y+=7;

        var meta2=[];
        if(cont)meta2.push(cont.label);
        if(o.session_day)meta2.push(o.session_day);
        if(o.ejercicios&&o.ejercicios.length)meta2.push(o.ejercicios.length+' ejercicio'+(o.ejercicios.length>1?'s':''));
        if(meta2.length){
            doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(cGray[0],cGray[1],cGray[2]);
            doc.text(meta2.join('  |  '),MG+10,y+2);
            y+=5;
        }

        if(o.notas){
            doc.setFontSize(8);doc.setFont('helvetica','italic');doc.setTextColor(cGray[0],cGray[1],cGray[2]);
            doc.text(o.notas,MG+10,y+2);
            y+=5;
        }

        if(o.ejercicios&&o.ejercicios.length){
            o.ejercicios.forEach(function(ej){
                checkSpace(5);
                doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(cPurple[0],cPurple[1],cPurple[2]);
                doc.text('> '+ej.name+(ej.category?' ('+ej.category+')':''),MG+14,y+2);
                y+=4;
            });
        }
        y+=2;
    });
}

// =============================================
// PIE DE PAGINA
// =============================================
var tp=doc.internal.getNumberOfPages();
for(var pg=1;pg<=tp;pg++){
    doc.setPage(pg);
    if(pg===1)continue;
    doc.setFillColor(cDark[0],cDark[1],cDark[2]);doc.rect(0,287,W,10,'F');
    doc.setFillColor(cAccent[0],cAccent[1],cAccent[2]);doc.rect(0,287,W,0.5,'F');
    doc.setFontSize(7);doc.setTextColor(cGray[0],cGray[1],cGray[2]);
    doc.text('TopLiderCoach HUB — '+localName+' vs '+visitName,105,292,{align:'center'});
    doc.text(pg+'/'+tp,W-MG,292,{align:'right'});
    doc.setTextColor(cAccent[0],cAccent[1],cAccent[2]);
    doc.text(fecha,MG,292);
}

doc.save('PlanPartido_'+rivalNom.replace(/\s+/g,'_')+'.pdf');
showToast('PDF generado');
}

function ppPresentacion(){if(!pp.planActual||!pp.partidoActual)return;var plan=pp.planActual,par=pp.partidoActual,sl=[];var rN=par.opponent;var eR=(pp.rivalActual&&pp.rivalActual.logo_url)?'<img src="'+pp.rivalActual.logo_url+'" style="width:120px;height:120px;object-fit:contain">':'<div style="width:120px;height:120px;background:#1e293b;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:60px">🛡️</div>';var eP=(clubData&&clubData.logo_url)?'<img src="'+clubData.logo_url+'" style="width:120px;height:120px;object-fit:contain">':'';var fe=new Date(par.match_date+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});sl.push('<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:24px">'+eR+'<div style="font-size:48px;font-weight:800;color:#fff;text-transform:uppercase">'+ppEsc(rN)+'</div><div style="font-size:24px;color:#f59e0b">'+(par.competition||'')+'</div><div style="font-size:20px;color:#94a3b8">'+fe+'</div></div>');if(plan.rival_formation){var sP=ppParseFormacion(plan.rival_formation);if(sP)sl.push('<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:20px"><div style="font-size:28px;color:#fff;font-weight:700;margin-bottom:16px">'+ppEsc(rN)+' — '+plan.rival_formation+'</div>'+ppRenderCampo(sP,(plan.weekly_map&&plan.weekly_map.rival_lineup)||{},plan.rival_players||[],'big')+'</div>')}if(plan.rival_strengths||plan.rival_weaknesses){sl.push('<div style="padding:40px"><h2 style="font-size:36px;color:#fff;margin:0 0 30px;border-bottom:3px solid #f59e0b;padding-bottom:10px">Scouting</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:30px">'+(plan.rival_strengths?'<div><div style="font-size:18px;color:#22c55e;font-weight:700;margin-bottom:10px">💪 Fuertes</div><div style="font-size:16px;color:#e2e8f0;line-height:1.6;white-space:pre-wrap">'+ppEsc(plan.rival_strengths)+'</div></div>':'')+(plan.rival_weaknesses?'<div><div style="font-size:18px;color:#ef4444;font-weight:700;margin-bottom:10px">📉 Debiles</div><div style="font-size:16px;color:#e2e8f0;line-height:1.6;white-space:pre-wrap">'+ppEsc(plan.rival_weaknesses)+'</div></div>':'')+'</div></div>')}(plan.tactical_phases||[]).forEach(function(f){if(!f.notes&&(!f.media||!f.media.length))return;var imgs='';if(f.media&&f.media.length){var ii=f.media.filter(function(m){return (m.type==='image'||m.type==='video'||m.type==='link')&&m.url});if(ii.length){imgs='<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:20px;justify-content:center">';ii.forEach(function(m){if(m.type==='image'){imgs+='<div style="text-align:center"><img src="'+m.url+'" onclick="ppMostrarVisor(this.src)" style="max-width:400px;max-height:300px;cursor:pointer;border-radius:8px;border:2px solid rgba(255,255,255,0.2)"><div style="font-size:12px;color:#94a3b8;margin-top:6px">'+ppEsc(m.title||'')+'</div></div>'}else{imgs+='<div style="text-align:center"><a href="'+ppEsc(m.url)+'" target="_blank" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:#1e293b;border:2px solid #f97316;border-radius:10px;color:#f97316;text-decoration:none;font-size:14px;font-weight:600;cursor:pointer">🎬 '+ppEsc(m.title||'Ver video')+'</a></div>'}});imgs+='</div>'}}sl.push('<div style="padding:40px;overflow-y:auto;height:100%"><h2 style="font-size:32px;color:#fff;margin:0 0 24px;border-bottom:3px solid #f59e0b;padding-bottom:10px">'+ppEsc(f.title)+'</h2>'+(f.notes?'<div style="font-size:18px;color:#e2e8f0;line-height:1.8;white-space:pre-wrap">'+ppEsc(f.notes)+'</div>':'')+imgs+'</div>')});var ourPhases2=ppGetOurPhases();var currentTitle='';PP_OUR_SECTIONS.forEach(function(sec){if(sec.type==='title'){currentTitle=sec.label;return}var d=ourPhases2[sec.id];if(!d||(!d.notes&&(!d.media||!d.media.length)))return;var imgs='';if(d.media&&d.media.length){var ii=d.media.filter(function(m){return (m.type==='image'||m.type==='video'||m.type==='link')&&m.url});if(ii.length){imgs='<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:20px;justify-content:center">';ii.forEach(function(m){if(m.type==='image'){imgs+='<div style="text-align:center"><img src="'+m.url+'" onclick="ppMostrarVisor(this.src)" style="max-width:400px;max-height:300px;cursor:pointer;border-radius:8px;border:2px solid rgba(255,255,255,0.2)"><div style="font-size:12px;color:#94a3b8;margin-top:6px">'+ppEsc(m.title||'')+'</div></div>'}else{imgs+='<div style="text-align:center"><a href="'+ppEsc(m.url)+'" target="_blank" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:#1e293b;border:2px solid #f97316;border-radius:10px;color:#f97316;text-decoration:none;font-size:14px;font-weight:600;cursor:pointer">🎬 '+ppEsc(m.title||'Ver video')+'</a></div>'}});imgs+='</div>'}}sl.push('<div style="padding:40px;overflow-y:auto;height:100%"><div style="font-size:14px;color:'+sec.color+';text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">'+currentTitle+'</div><h2 style="font-size:32px;color:#fff;margin:0 0 24px;border-bottom:3px solid '+sec.color+';padding-bottom:10px">'+ppEsc(sec.title)+'</h2>'+(d.notes?'<div style="font-size:18px;color:#e2e8f0;line-height:1.8;white-space:pre-wrap">'+ppEsc(d.notes)+'</div>':'')+imgs+'</div>')});var abpCards=ppGetAbpCards();if(abpCards.length){sl.push('<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%"><h2 style="font-size:42px;color:#a855f7;font-weight:800;margin:0">🎯 ABPs</h2><div style="font-size:20px;color:#94a3b8;margin-top:10px">'+abpCards.length+' accion'+(abpCards.length>1?'es':'')+' a balon parado</div></div>');abpCards.forEach(function(c){var tags=[c.tipo,c.subtipo,c.espacio,c.perfil].filter(Boolean).join(' · ');var color=c.tipo==='ofensiva'?'#22c55e':'#3b82f6';var imgHtml=c.imagen&&c.imagen.length>50?'<div style="margin:16px auto;text-align:center"><img src="'+c.imagen+'" onclick="ppMostrarVisor(this.src)" style="max-width:700px;max-height:400px;border-radius:12px;border:3px solid '+color+';cursor:pointer"></div>':'';var rolesHtml='';if(c.tipo==='ofensiva'){var rols=[];PP_ABP_ROLES_OF.forEach(function(r){var pls=c['of_'+r]||[];if(pls.length)rols.push('<span style="color:'+color+';font-weight:700">'+PP_ABP_ROLES_OF_LABELS[r]+':</span> '+pls.map(function(pid){return ppAbpPlayerName(pid,pp.plantilla)}).join(', '))});if(c.sena)rols.push('<span style="color:#a855f7;font-weight:700">Seña:</span> '+ppEsc(c.sena));if(rols.length)rolesHtml='<div style="font-size:16px;color:#e2e8f0;line-height:2;margin-top:16px">'+rols.join('<br>')+'</div>'}if(c.tipo==='defensiva'){var rols=[];(c.marcas||[]).forEach(function(m,i){if(m.rival_idx||m.propio_id){var rn=ppAbpPlayerName(m.rival_idx,(pp.planActual.rival_players||[]).map(function(j,k){return{id:'r_'+k,number:j.number,name:j.name}}));var pn=ppAbpPlayerName(m.propio_id,pp.plantilla);rols.push('<span style="color:#f59e0b">Marca '+(i+1)+':</span> '+rn+' ⚔️ '+pn)}});PP_ABP_ROLES_DF.forEach(function(r){var pls=c['df_'+r]||[];if(pls.length)rols.push('<span style="color:'+color+';font-weight:700">'+PP_ABP_ROLES_DF_LABELS[r]+':</span> '+pls.map(function(pid){return ppAbpPlayerName(pid,pp.plantilla)}).join(', '))});if(rols.length)rolesHtml='<div style="font-size:15px;color:#e2e8f0;line-height:2;margin-top:16px">'+rols.join('<br>')+'</div>'}sl.push('<div style="padding:30px;overflow-y:auto;height:100%"><div style="display:flex;align-items:center;gap:12px;margin-bottom:8px"><div style="font-size:14px;color:'+color+';text-transform:uppercase;letter-spacing:1px;font-weight:700">'+ppEsc(c.tipo)+'</div><div style="font-size:12px;color:#64748b">'+ppEsc(tags)+'</div></div><h2 style="font-size:32px;color:#fff;margin:0 0 12px;border-bottom:3px solid '+color+';padding-bottom:10px">'+ppEsc(c.name||'ABP')+'</h2>'+imgHtml+rolesHtml+(c.explicacion?'<div style="font-size:16px;color:#94a3b8;margin-top:16px;line-height:1.6;white-space:pre-wrap">'+ppEsc(c.explicacion)+'</div>':'')+'</div>')})}
(plan.linked_exercises||[]).forEach(function(ej){if(ej.thumbnail_svg)sl.push('<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px"><div style="font-size:24px;color:#fff;font-weight:700;margin-bottom:16px">'+ppEsc(ej.name)+'</div><div style="width:80%;max-width:900px;aspect-ratio:8/5;border-radius:12px;overflow:hidden;background:#0f4c2a">'+ej.thumbnail_svg+'</div></div>')});sl.push('<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:20px">'+eP+'<div style="font-size:36px;font-weight:800;color:#f59e0b">VAMOS A POR ELLOS</div></div>');if(!sl.length){showToast('Sin contenido');return}window._ppPresSlides=sl;window._ppPresIdx=0;function render(){var c=document.getElementById('pp-pres-content');if(c)c.innerHTML=sl[window._ppPresIdx];var ct=document.getElementById('pp-pres-counter');if(ct)ct.textContent=(window._ppPresIdx+1)+' / '+sl.length}window._ppPresRender=render;var ov=document.createElement('div');ov.id='pp-presentacion';ov.style.cssText='position:fixed;inset:0;z-index:99999;background:#0a0a0a;display:flex;flex-direction:column';ov.innerHTML='<div id="pp-pres-content" style="flex:1;overflow-y:auto;display:flex;align-items:center;justify-content:center"></div><div style="padding:12px 20px;display:flex;align-items:center;justify-content:space-between;background:#111"><button onclick="ppPresAnterior()" style="padding:8px 20px;background:#1e293b;border:1px solid #334155;color:#94a3b8;border-radius:6px;cursor:pointer;font-size:14px">← Anterior</button><span id="pp-pres-counter" style="color:#64748b;font-size:14px"></span><div style="display:flex;gap:8px"><button onclick="ppPresSiguiente()" style="padding:8px 20px;background:#3b82f6;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:14px">Siguiente →</button><button onclick="ppPresCerrar()" style="padding:8px 16px;background:#7f1d1d;border:1px solid #dc2626;color:#fca5a5;border-radius:6px;cursor:pointer;font-size:14px">✕ Salir</button></div></div>';document.body.appendChild(ov);render();document.addEventListener('keydown',ppPresKeyHandler)}
function ppPresAnterior(){if(window._ppPresIdx>0){window._ppPresIdx--;window._ppPresRender()}}
function ppPresSiguiente(){if(window._ppPresIdx<window._ppPresSlides.length-1){window._ppPresIdx++;window._ppPresRender()}}
function ppPresCerrar(){var el=document.getElementById('pp-presentacion');if(el)el.remove();document.removeEventListener('keydown',ppPresKeyHandler)}
function ppPresKeyHandler(e){if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();ppPresSiguiente()}else if(e.key==='ArrowLeft'){e.preventDefault();ppPresAnterior()}else if(e.key==='Escape'){ppPresCerrar()}}
var _ppOrig=ppRenderContenido;ppRenderContenido=function(){_ppOrig();setTimeout(ppAddBotonesSalida,100)};

registrarSubTab('matchstats', 'planpartido', initPlanPartido);