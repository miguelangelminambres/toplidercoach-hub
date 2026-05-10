// ========== CLUB-ADMIN-SUBGRUPOS.JS ==========
// Subgrupos transversales de jugadores

var subgrupos=[];

function initSecSubgrupos(){
    document.getElementById('sec-subgrupos').innerHTML='<div id="sg-content"></div>';
    cargarSubgrupos();
}

async function cargarSubgrupos(){
    var{data}=await SB.from('club_subgroups').select('*').eq('club_id',CI).eq('active',true).order('name');
    subgrupos=data||[];
    // Cargar conteo de jugadores por subgrupo
    var counts={};
    if(subgrupos.length){
        var ids=subgrupos.map(function(s){return s.id});
        var{data:rels}=await SB.from('club_subgroup_players').select('subgroup_id').in('subgroup_id',ids);
        (rels||[]).forEach(function(r){counts[r.subgroup_id]=(counts[r.subgroup_id]||0)+1});
    }
    var el=document.getElementById('sg-content');
    el.innerHTML='<div class="card"><div class="card-head"><h3>Subgrupos de jugadores</h3><button class="btn btn-primary" onclick="abrirModalSubgrupo()">+ Nuevo</button></div><div class="card-body">'+
        (subgrupos.length?'<table class="tbl"><thead><tr><th>Nombre</th><th>Tipo</th><th>Descripcion</th><th style="text-align:center">Deportistas</th><th></th></tr></thead><tbody>'+
        subgrupos.map(function(s){
            var cnt=counts[s.id]||0;
            var typeLabel={tecnico:'Tecnico',tactico:'Tactico',fisico:'Fisico',porteros:'Porteros',posicion:'Por posicion',especial:'Especial'}[s.type]||s.type;
            return'<tr><td><span class="tnl" onclick="verSubgrupo(\''+s.id+'\')">'+s.name+'</span></td>'+
                '<td><span class="badge badge-blue">'+typeLabel+'</span></td>'+
                '<td style="font-size:12px;color:var(--ts2)">'+(s.description||'—')+'</td>'+
                '<td style="text-align:center;font-weight:700;color:var(--accent)">'+cnt+'</td>'+
                '<td><div class="row-actions"><button class="btn btn-secondary btn-sm" onclick="verSubgrupo(\''+s.id+'\')">Ver</button><button class="btn btn-danger btn-sm" onclick="eliminarSubgrupo(\''+s.id+'\')">X</button></div></td></tr>';
        }).join('')+'</tbody></table>':'<div class="empty"><p>Sin subgrupos. Crea uno para agrupar jugadores de distintos equipos.</p></div>')+
        '</div></div>';
}

function abrirModalSubgrupo(data){
    var d=data||{};
    var html='<div class="modal-bg open" id="m-subgrupo"><div class="modal"><div class="modal-head"><h3>'+(d.id?'Editar':'Nuevo subgrupo')+'</h3><button class="modal-close" onclick="document.getElementById(\'m-subgrupo\').remove()">&times;</button></div><div class="modal-body">'+
        '<input type="hidden" id="sg-id" value="'+(d.id||'')+'">'+
        '<div class="fg"><label>Nombre *</label><input id="sg-name" value="'+(d.name||'')+'" placeholder="Ej: Subgrupo de porteros"></div>'+
        '<div class="fr"><div class="fg"><label>Tipo</label><select id="sg-type"><option value="tecnico"'+(d.type==='tecnico'?' selected':'')+'>Tecnico</option><option value="tactico"'+(d.type==='tactico'?' selected':'')+'>Tactico</option><option value="fisico"'+(d.type==='fisico'?' selected':'')+'>Fisico</option><option value="porteros"'+(d.type==='porteros'?' selected':'')+'>Porteros</option><option value="posicion"'+(d.type==='posicion'?' selected':'')+'>Por posicion</option><option value="especial"'+(d.type==='especial'?' selected':'')+'>Especial</option></select></div><div class="fg"><label>Color</label><input type="color" id="sg-color" value="'+(d.color||'#3882f6')+'" style="height:38px;padding:2px"></div></div>'+
        '<div class="fg"><label>Descripcion</label><textarea id="sg-desc">'+(d.description||'')+'</textarea></div>'+
        '</div><div class="modal-foot"><button class="btn btn-secondary" onclick="document.getElementById(\'m-subgrupo\').remove()">Cancelar</button><button class="btn btn-success" onclick="guardarSubgrupo()">Guardar</button></div></div></div>';
    document.body.insertAdjacentHTML('beforeend',html);
}

async function guardarSubgrupo(){
    var id=document.getElementById('sg-id').value;
    var obj={club_id:CI,name:document.getElementById('sg-name').value.trim(),type:document.getElementById('sg-type').value,color:document.getElementById('sg-color').value,description:document.getElementById('sg-desc').value.trim()||null};
    if(!obj.name){toast('Nombre obligatorio');return}
    var r;
    if(id)r=await SB.from('club_subgroups').update(obj).eq('id',id);
    else r=await SB.from('club_subgroups').insert(obj);
    if(r.error){toast(r.error.message);return}
    document.getElementById('m-subgrupo')?.remove();toast('OK');await cargarSubgrupos();
}

async function eliminarSubgrupo(id){
    if(!confirm('Eliminar subgrupo y todos sus jugadores?'))return;
    await SB.from('club_subgroups').update({active:false}).eq('id',id);
    toast('Eliminado');await cargarSubgrupos();
}

// ===== DETALLE SUBGRUPO =====
async function verSubgrupo(sgId){
    var sg=subgrupos.find(function(s){return s.id===sgId});
    if(!sg){toast('No encontrado');return}
    // Cargar jugadores del subgrupo
    var{data:rels}=await SB.from('club_subgroup_players').select('*,club_players(id,name,nickname,photo_url,birth_date,positions_main)').eq('subgroup_id',sgId);
    var jugSG=(rels||[]).map(function(r){return r.club_players}).filter(Boolean);
    // Cargar todos los jugadores con su equipo para el selector
    var{data:allSeasons}=await SB.from('club_player_seasons').select('player_id,club_teams(name)').eq('club_id',CI).order('season_name',{ascending:false});
    var playerTeam={};
    (allSeasons||[]).forEach(function(s){if(!playerTeam[s.player_id]&&s.club_teams)playerTeam[s.player_id]=s.club_teams.name});
    var jugIdsEnSG=jugSG.map(function(j){return j.id});
    var jugDisponibles=jugadoresClub.filter(function(j){return jugIdsEnSG.indexOf(j.id)===-1});

    var typeLabel={tecnico:'Tecnico',tactico:'Tactico',fisico:'Fisico',porteros:'Porteros',posicion:'Por posicion',especial:'Especial'}[sg.type]||sg.type;
    var el=document.getElementById('sg-content');
    var h='<button class="btn-back" onclick="cargarSubgrupos()">← Volver a subgrupos</button>';
    h+='<div class="card" style="margin-bottom:16px"><div class="card-body"><div style="display:flex;justify-content:space-between;align-items:center"><div><h2 style="margin:0">'+sg.name+'</h2><div style="display:flex;gap:6px;margin-top:6px"><span class="badge badge-blue">'+typeLabel+'</span><span style="font-size:12px;color:var(--ts2)">'+(sg.description||'')+'</span></div></div><div style="display:flex;gap:6px"><button class="btn btn-secondary btn-sm" onclick="abrirModalSubgrupo(subgrupos.find(function(s){return s.id===\''+sgId+'\'}))">Editar</button></div></div></div></div>';

    // Selector para añadir jugadores
    h+='<div class="card" style="margin-bottom:16px"><div class="card-body" style="padding:12px 20px"><div style="display:flex;align-items:center;gap:12px"><span style="font-size:12px;font-weight:600;color:var(--tp)">Anadir jugador:</span><select id="sg-add-player" style="flex:1;max-width:300px;padding:7px 10px;background:var(--bg-deep);border:1px solid var(--border);border-radius:var(--rs);color:var(--tp);font-family:inherit;font-size:12px"><option value="">— Seleccionar jugador —</option>';
    jugDisponibles.forEach(function(j){
        var team=playerTeam[j.id]||'';
        h+='<option value="'+j.id+'">'+(team?team+' — ':'')+j.name+(j.nickname?' ('+j.nickname+')':'')+'</option>';
    });
    h+='</select><button class="btn btn-primary btn-sm" onclick="anadirJugadorSubgrupo(\''+sgId+'\')">+ Anadir</button></div></div></div>';

    // Lista de jugadores
    h+='<div class="card"><div class="card-head"><h3>Jugadores del subgrupo</h3><span style="font-size:13px;color:var(--accent);font-weight:700">'+jugSG.length+'</span></div><div class="card-body">';
    if(jugSG.length){
        h+='<table class="tbl"><thead><tr><th></th><th>Jugador</th><th>Equipo</th><th>Posicion</th><th>Edad</th><th></th></tr></thead><tbody>';
        jugSG.forEach(function(j){
            var team=playerTeam[j.id]||'—';
            var pos=(j.positions_main||[]).map(function(p){return POS_LABELS[p]||p}).join(', ')||'—';
            h+='<tr><td>'+avt(j.photo_url,j.name,'avatar-sm')+'</td>';
            h+='<td><span class="tnl" onclick="verJugador(\''+j.id+'\',\'club\')">'+j.name+(j.nickname?' <span style="color:var(--tm)">('+j.nickname+')</span>':'')+'</span></td>';
            h+='<td style="font-size:12px;color:var(--ts2)">'+team+'</td>';
            h+='<td style="font-size:12px">'+pos+'</td>';
            h+='<td style="font-size:12px">'+(j.birth_date?edad(j.birth_date):'—')+'</td>';
            h+='<td><button class="btn btn-danger btn-sm" onclick="quitarJugadorSubgrupo(\''+sgId+'\',\''+j.id+'\')">Quitar</button></td></tr>';
        });
        h+='</tbody></table>';
    } else {
        h+='<div class="empty"><p>Sin jugadores. Usa el selector de arriba para anadir.</p></div>';
    }
    h+='</div></div>';
    el.innerHTML=h;
}

async function anadirJugadorSubgrupo(sgId){
    var sel=document.getElementById('sg-add-player');
    var pid=sel?.value;
    if(!pid){toast('Selecciona un jugador');return}
    var r=await SB.from('club_subgroup_players').insert({subgroup_id:sgId,player_id:pid});
    if(r.error){toast(r.error.message);return}
    toast('Anadido');verSubgrupo(sgId);
}

async function quitarJugadorSubgrupo(sgId,pid){
    await SB.from('club_subgroup_players').delete().eq('subgroup_id',sgId).eq('player_id',pid);
    toast('Quitado');verSubgrupo(sgId);
}

console.log('Club Admin Subgrupos cargado');
