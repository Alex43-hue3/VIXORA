/* NETVISION 1.1 V2 — TV + control remoto completo */
'use strict';
(function(){
  const qs=new URLSearchParams(location.search);
  const mode=qs.get('tv')==='1'?'tv':qs.get('remote')==='1'?'remote':qs.get('connect')==='1'?'connect':null;
  if(!mode)return;

  const PEER_URL='https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
  const state={peer:null,conn:null,code:'',focus:0,focusables:[],connected:false};
  const $=s=>document.querySelector(s);
  const basePath=location.pathname;

  function loadPeer(){return new Promise((resolve,reject)=>{
    if(window.Peer)return resolve();
    const s=document.createElement('script');s.src=PEER_URL;
    s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
  })}
  function makeCode(){
    const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let x='';
    for(let i=0;i<6;i++)x+=chars[Math.floor(Math.random()*chars.length)];
    return x;
  }
  function go(path){location.href=path}
  function closeMode(){disconnect();go(basePath)}

  function ensureShell(){
    if($('#tv11Panel'))return;
    const d=document.createElement('div');d.id='tv11Panel';d.className='tv11-panel';

    if(mode==='connect'){
      d.innerHTML=`<div class="tv11-card tv11-connect-card">
        <button id="tv11Exit" class="tv11-x" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
        <div class="tv11-logo"><span>NET</span>VISION</div>
        <div class="tv11-kicker">NETVISION TV 1.1</div>
        <h2>Conectar a una TV</h2>
        <p>Elige qué dispositivo estás usando. Lo más sencillo es que la TV y el teléfono estén en la misma red Wi-Fi.</p>
        <div class="tv11-choice-grid">
          <button id="tv11AsTV" class="tv11-choice"><span class="tv11-choice-icon">📺</span><strong>Esta es la TV</strong><small>Abrir NETVISION en la TV y mostrar un código.</small></button>
          <button id="tv11AsRemote" class="tv11-choice"><span class="tv11-choice-icon">📱</span><strong>Este es el teléfono</strong><small>Usar el teléfono como control remoto.</small></button>
        </div>
        <div class="tv11-info"><i class="fa-solid fa-circle-info"></i> La conexión se realiza mediante un código de 6 caracteres.</div>
      </div>`;
    }else if(mode==='tv'){
      d.innerHTML=`<div class="tv11-card tv11-tv-card">
        <button id="tv11Exit" class="tv11-x" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
        <div class="tv11-logo"><span>NET</span>VISION</div>
        <div class="tv11-kicker">NETVISION TV 1.1</div>
        <h2>Conecta tu teléfono</h2>
        <p>En tu teléfono abre NETVISION y selecciona <b>Este es el teléfono</b>.</p>
        <div class="tv11-code" id="tv11Code">------</div>
        <small>Introduce este código en tu teléfono.</small>
        <div id="tv11Status" class="tv11-status">Iniciando NETVISION TV…</div>
        <button id="tv11Close" class="outline-btn">Continuar sin teléfono</button>
      </div>`;
    }else{
      d.innerHTML=`<div class="remote11-wrap">
        <div class="remote11-head">
          <button id="remote11Back" class="remote11-icon" title="Volver"><i class="fa-solid fa-arrow-left"></i></button>
          <div class="remote11-brand"><div class="tv11-logo"><span>NET</span>VISION</div><small>CONTROL REMOTO 1.1</small></div>
          <button id="remote11Exit" class="remote11-icon" title="Cerrar"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="remote11-connection-card" id="remote11ConnectionCard">
          <div class="remote11-section-title">Conectar a una TV</div>
          <div id="remote11Status" class="remote11-dot">● Desconectado</div>
          <label class="remote11-connect">Código de la TV<input id="remote11Code" maxlength="6" inputmode="text" autocomplete="off" placeholder="ABC123"></label>
          <button id="remote11Connect" class="primary-btn full">📺 Conectar a TV</button>
        </div>
        <div id="remote11Pad" class="remote11-pad hidden">
          <button data-cmd="back" title="Atrás">↩</button><button data-cmd="up" title="Arriba">▲</button><button data-cmd="menu" title="Menú">☰</button>
          <button data-cmd="left" title="Izquierda">◀</button><button data-cmd="select" class="remote-ok" title="Seleccionar">OK</button><button data-cmd="right" title="Derecha">▶</button>
          <button data-cmd="home" title="Inicio">⌂</button><button data-cmd="down" title="Abajo">▼</button><button data-cmd="search" title="Buscar">⌕</button>
        </div>
        <div id="remote11Quick" class="remote11-quick hidden">
          <button data-cmd="playpause">▶︎ / ⏸</button><button data-cmd="prev">⏮</button><button data-cmd="next">⏭</button><button data-cmd="fullscreen">⛶</button>
          <button data-cmd="home">⌂ Menú</button><button data-cmd="disconnect">Desconectar</button>
        </div>
        <div class="remote11-tip">El teléfono controla la interfaz completa de NETVISION en la TV.</div>
      </div>`;
    }
    document.body.appendChild(d);
  }

  function status(text){const e=mode==='tv'?$('#tv11Status'):$('#remote11Status');if(e)e.textContent=text}
  function send(obj){if(state.conn?.open)state.conn.send(obj)}
  function hideTVPanel(){
    const p=$('#tv11Panel');if(p)p.classList.add('tv11-connected-hidden');
    let badge=$('#tv11Badge');
    if(!badge){badge=document.createElement('div');badge.id='tv11Badge';badge.className='tv11-badge';document.body.appendChild(badge)}
    badge.innerHTML=`<span>●</span> NETVISION TV · Teléfono conectado <button id="tv11BadgeClose" aria-label="Cerrar aviso">×</button>`;
    $('#tv11BadgeClose').onclick=()=>badge.remove();
  }
  function showTVPanel(){const p=$('#tv11Panel');if(p)p.classList.remove('tv11-connected-hidden');$('#tv11Badge')?.remove()}

  function getFocusables(){
    const screen=document.querySelector('.screen:not(.hidden)');if(!screen)return[];
    return [...screen.querySelectorAll('button:not([disabled]),input:not([disabled]),[tabindex="0"]')].filter(e=>{
      const r=e.getBoundingClientRect(),s=getComputedStyle(e);
      return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';
    });
  }
  function paintFocus(){
    state.focusables.forEach(x=>x.classList.remove('remote-focus'));state.focusables=getFocusables();
    if(!state.focusables.length)return;if(state.focus>=state.focusables.length)state.focus=0;
    state.focusables[state.focus]?.classList.add('remote-focus');state.focusables[state.focus]?.scrollIntoView({block:'nearest',inline:'nearest'});
  }
  function refreshFocus(){setTimeout(paintFocus,80)}
  function select(){
    const el=state.focusables[state.focus];if(!el)return;
    if(el.tagName==='INPUT'){el.focus();send(statePacket());return}
    el.click();refreshFocus();
  }
  function move(dx,dy){
    state.focusables=getFocusables();if(!state.focusables.length)return;
    const current=state.focusables[state.focus];if(!current)return;
    const cr=current.getBoundingClientRect();let best=-1,score=Infinity;
    state.focusables.forEach((el,i)=>{if(i===state.focus)return;const r=el.getBoundingClientRect();
      const cx=r.left+r.width/2,cy=r.top+r.height/2,tx=cr.left+cr.width/2,ty=cr.top+cr.height/2,vx=cx-tx,vy=cy-ty;
      if((dx&&Math.sign(vx)!==dx)||(dy&&Math.sign(vy)!==dy))return;
      const primary=dx?Math.abs(vx):Math.abs(vy),secondary=dx?Math.abs(vy):Math.abs(vx),sc=primary*3+secondary;
      if(sc<score){score=sc;best=i}
    });
    if(best>=0)state.focus=best;paintFocus();
  }
  function tvCommand(c){
    if(c==='up')return move(0,-1);if(c==='down')return move(0,1);if(c==='left')return move(-1,0);if(c==='right')return move(1,0);if(c==='select')return select();
    if(c==='back'){if(document.activeElement?.tagName==='INPUT'){document.activeElement.blur();return}if(NV?.state?.view!=='home')NV.setView('home');else document.querySelector('.modal:not(.hidden) [data-close],.modal:not(.hidden) [data-close-settings],.modal:not(.hidden) [data-close-switch]')?.click();return}
    if(c==='home'||c==='menu'){NV?.setView('home');return}
    if(c==='search'){const i=$('#catalogSearch')||$('#channelSearch');if(i){i.focus();i.select?.()}return}
    if(c==='prev'){NV?.changeChannel?.(-1);return}if(c==='next'){NV?.changeChannel?.(1);return}
    if(c==='fullscreen'){($('#mediaFullscreen')||$('#tvFullscreen'))?.click();return}
    if(c==='playpause'){const v=$('#mediaVideo')||$('#tvVideo');if(v){v.paused?v.play().catch(()=>{}):v.pause()}return}
    if(c==='disconnect'){disconnect();showTVPanel();return}
  }
  function statePacket(){return {t:'state',view:NV?.state?.view||'home',title:$('#mediaTitle')?.textContent||$('#tvNowName')?.textContent||'',label:$('#catalogTitle')?.textContent||''}}

  function bindConnect(){
    $('#tv11Exit').onclick=()=>closeMode();
    $('#tv11AsTV').onclick=()=>go(basePath+'?tv=1');
    $('#tv11AsRemote').onclick=()=>go(basePath+'?remote=1');
  }

  function bindTV(){
    const peerId=makeCode();state.code=peerId;$('#tv11Code').textContent=peerId;
    try{state.peer=new Peer(peerId)}catch(e){status('No se pudo iniciar la conexión. Recarga la TV.');return}
    state.peer.on('open',()=>status('✓ TV lista · Esperando teléfono…'));
    state.peer.on('connection',conn=>{
      if(state.conn?.open)state.conn.close();state.conn=conn;
      conn.on('open',()=>{
        state.connected=true;status('✓ Teléfono conectado');send(statePacket());paintFocus();hideTVPanel();
      });
      conn.on('data',d=>{
        if(d?.t==='cmd')tvCommand(d.c);
        if(d?.t==='text'){const i=document.activeElement?.matches('input')?document.activeElement:null;if(i){i.value=d.value;i.dispatchEvent(new Event('input',{bubbles:true}))}}
      });
      conn.on('close',()=>{state.connected=false;showTVPanel();status('Teléfono desconectado · Esperando otro teléfono…')});
      conn.on('error',()=>status('Error de comunicación con el teléfono'));
    });
    state.peer.on('error',e=>{
      console.warn('NETVISION TV PeerJS',e);
      if(e?.type==='unavailable-id')status('Código ocupado. Recarga la TV para generar otro.');
      else status('No se pudo iniciar la conexión. Recarga la TV.');
    });
    $('#tv11Close').onclick=closeMode;$('#tv11Exit').onclick=closeMode;
    const obs=new MutationObserver(()=>{if(state.connected)send(statePacket());refreshFocus()});
    obs.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    setInterval(()=>{if(state.connected)send(statePacket())},1500);
  }

  function bindRemote(){
    $('#remote11Back').onclick=()=>go(basePath+'?connect=1');
    $('#remote11Exit').onclick=closeMode;
    $('#remote11Connect').onclick=async()=>{
      const c=($('#remote11Code').value||'').trim().toUpperCase();
      if(c.length!==6){status('Escribe un código de 6 caracteres');return}
      try{
        await loadPeer();
        if(state.peer&&!state.peer.destroyed)try{state.peer.destroy()}catch{}
        state.peer=new Peer();
        state.peer.on('open',()=>{
          status('Conectando…');state.conn=state.peer.connect(c,{reliable:true});
          state.conn.on('open',()=>{state.connected=true;status('● TV conectada');$('#remote11Pad').classList.remove('hidden');$('#remote11Quick').classList.remove('hidden');$('#remote11ConnectionCard').classList.add('hidden');send({t:'hello'});});
          state.conn.on('data',d=>{if(d?.t==='state'){const e=$('#remote11Status');e.textContent=`● TV conectada · ${d.label||d.title||d.view||'Lista'}`}});
          state.conn.on('close',()=>{state.connected=false;$('#remote11Pad').classList.add('hidden');$('#remote11Quick').classList.add('hidden');$('#remote11ConnectionCard').classList.remove('hidden');status('● Desconectado')});
          state.conn.on('error',()=>status('Error de comunicación'));
        });
        state.peer.on('error',e=>{console.warn('NETVISION Remote PeerJS',e);status('No se pudo conectar a esa TV');});
      }catch(e){console.warn(e);status('No se pudo cargar NETVISION TV');}
    };
    document.querySelectorAll('[data-cmd]').forEach(b=>b.onclick=()=>send({t:'cmd',c:b.dataset.cmd}));
    $('#remote11Code').addEventListener('input',e=>{e.target.value=e.target.value.replace(/[^a-z0-9]/gi,'').toUpperCase()});
  }

  function disconnect(){try{state.conn?.close();state.peer?.destroy()}catch{}state.conn=null;state.peer=null;state.connected=false}

  ensureShell();
  if(mode==='connect'){bindConnect();document.title='NETVISION | Conectar TV';return}
  loadPeer().then(()=>mode==='tv'?bindTV():bindRemote()).catch(()=>status('No se pudo cargar NETVISION TV'));
  document.title=mode==='remote'?'NETVISION | Control remoto':'NETVISION | TV 1.1';
})();
