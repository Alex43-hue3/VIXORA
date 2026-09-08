/* NETVISION TV 1.1 — control remoto completo, foco de interfaz y conexión */
'use strict';
(function(){
  const qs=new URLSearchParams(location.search);
  const mode=qs.get('tv')==='1'?'tv':qs.get('remote')==='1'?'remote':qs.get('connect')==='1'?'connect':null;
  if(!mode)return;

  const PEER_URL='https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
  const state={peer:null,conn:null,code:'',focus:0,focusables:[],connected:false,unlocked:false,lastView:'home'};
  const $=s=>document.querySelector(s);
  const basePath=location.pathname;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  function loadPeer(){return new Promise((resolve,reject)=>{
    if(window.Peer)return resolve();
    const s=document.createElement('script');s.src=PEER_URL;s.async=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
  })}
  function makeCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let x='';for(let i=0;i<6;i++)x+=chars[Math.floor(Math.random()*chars.length)];return x}
  function go(path){location.href=path}
  function closeMode(){disconnect();go(basePath)}

  function ensureShell(){
    if($('#tv11Panel'))return;
    const d=document.createElement('div');d.id='tv11Panel';d.className='tv11-panel';
    if(mode==='connect'){
      d.innerHTML=`<div class="tv11-card tv11-connect-card">
        <button id="tv11Exit" class="tv11-x" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
        <div class="tv11-logo"><span>NET</span>VISION</div><div class="tv11-kicker">NETVISION TV 1.1</div>
        <h2>Conectar a NETVISION TV</h2><p>Elige qué dispositivo estás usando.</p>
        <div class="tv11-available"><div class="tv11-available-head"><strong>TVs disponibles</strong><button id="tv11RefreshList" class="tv11-mini-btn"><i class="fa-solid fa-rotate"></i> Actualizar</button></div><div id="tv11AvailableList" class="tv11-available-list"></div></div>
        <div class="tv11-choice-grid">
          <button id="tv11AsTV" class="tv11-choice"><span class="tv11-choice-icon">📺</span><strong>Esta es la TV</strong><small>Abrir NETVISION en esta pantalla y mostrar un código.</small></button>
          <button id="tv11AsRemote" class="tv11-choice"><span class="tv11-choice-icon">📱</span><strong>Este es el teléfono</strong><small>Usar el teléfono como control remoto.</small></button>
        </div>
        <div class="tv11-info"><i class="fa-solid fa-circle-info"></i> En navegador web, las TVs no pueden detectarse automáticamente por Wi-Fi sin un servicio de descubrimiento. Puedes conectar con el código de la TV.</div>
      </div>`;
    }else if(mode==='tv'){
      d.innerHTML=`<div class="tv11-card tv11-tv-card">
        <button id="tv11Exit" class="tv11-x" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
        <div class="tv11-logo"><span>NET</span>VISION</div><div class="tv11-kicker">NETVISION TV 1.1</div>
        <h2>Conecta tu teléfono</h2><p>En tu teléfono abre NETVISION y selecciona <b>Este es el teléfono</b>.</p>
        <div class="tv11-code" id="tv11Code">------</div><small>Introduce este código en tu teléfono.</small>
        <div id="tv11Status" class="tv11-status">Iniciando NETVISION TV…</div>
        <button id="tv11Close" class="outline-btn">Continuar sin teléfono</button>
      </div>`;
    }else{
      d.innerHTML=`<div class="remote11-wrap">
        <div class="remote11-head"><button id="remote11Back" class="remote11-icon" title="Volver"><i class="fa-solid fa-arrow-left"></i></button><div class="remote11-brand"><div class="tv11-logo"><span>NET</span>VISION</div><small>CONTROL REMOTO</small></div><button id="remote11Exit" class="remote11-icon" title="Cerrar"><i class="fa-solid fa-xmark"></i></button></div>
        <section id="remote11ConnectionCard" class="remote11-card"><div class="remote11-section-title">Conectar a una TV</div><div id="remote11Status" class="remote11-dot">● Desconectado</div><label class="remote11-connect">Código de la TV<input id="remote11Code" maxlength="6" inputmode="text" autocomplete="off" placeholder="ABC123"></label><button id="remote11Connect" class="primary-btn full">📺 Conectar a TV</button></section>
        <section id="remote11Controller" class="remote11-controller hidden">
          <div class="remote11-online"><span>●</span><div><strong>TV conectada</strong><small id="remote11Where">NETVISION TV</small></div><button id="remote11Disconnect" title="Desconectar"><i class="fa-solid fa-link-slash"></i></button></div>
          <div class="remote11-search"><i class="fa-solid fa-magnifying-glass"></i><input id="remote11Search" placeholder="Buscar en NETVISION..." autocomplete="off"><button id="remote11SearchClear" title="Limpiar">×</button></div>
          <div class="remote11-nav-title">NAVEGACIÓN</div>
          <div class="remote11-pad">
            <button data-cmd="back" title="Atrás"><i class="fa-solid fa-arrow-left"></i></button><button data-cmd="up" title="Arriba"><i class="fa-solid fa-chevron-up"></i></button><button data-cmd="home" title="Menú principal"><i class="fa-solid fa-house"></i></button>
            <button data-cmd="left" title="Izquierda"><i class="fa-solid fa-chevron-left"></i></button><button data-cmd="select" class="remote-ok" title="Seleccionar">OK</button><button data-cmd="right" title="Derecha"><i class="fa-solid fa-chevron-right"></i></button>
            <span></span><button data-cmd="down" title="Abajo"><i class="fa-solid fa-chevron-down"></i></button><button data-cmd="search" title="Buscar"><i class="fa-solid fa-magnifying-glass"></i></button>
          </div>
          <div class="remote11-row-title">REPRODUCCIÓN</div>
          <div class="remote11-action-row three"><button data-cmd="prev"><i class="fa-solid fa-backward-step"></i><span>Anterior</span></button><button data-cmd="playpause" class="accent"><i class="fa-solid fa-play"></i><span>Reproducir / Pausa</span></button><button data-cmd="next"><i class="fa-solid fa-forward-step"></i><span>Siguiente</span></button></div>
          <div class="remote11-row-title">VOLUMEN</div>
          <div class="remote11-action-row three"><button data-cmd="voldown"><i class="fa-solid fa-volume-low"></i><span>Bajar</span></button><button data-cmd="mute"><i class="fa-solid fa-volume-xmark"></i><span>Silenciar</span></button><button data-cmd="volup"><i class="fa-solid fa-volume-high"></i><span>Subir</span></button></div>
          <div class="remote11-row-title">PANTALLA</div>
          <div class="remote11-action-row two"><button data-cmd="fullscreen"><i class="fa-solid fa-expand"></i><span>Pantalla completa</span></button><button data-cmd="activate"><i class="fa-solid fa-volume-high"></i><span>Activar reproducción</span></button></div>
        </section>
        <div class="remote11-tip">Usa el control para recorrer toda la interfaz de NETVISION: inicio, TV, películas, series, Mi Lista, búsqueda, ajustes y perfil.</div>
      </div>`;
    }
    document.body.appendChild(d);
  }

  function status(text){const e=mode==='tv'?$('#tv11Status'):$('#remote11Status');if(e)e.textContent=text}
  function send(obj){if(state.conn?.open)try{state.conn.send(obj)}catch{}}
  function saveRecent(code){if(!code)return;try{let a=JSON.parse(localStorage.getItem('nv_tv_recent')||'[]');a=a.filter(x=>x.code!==code);a.unshift({code,name:'NETVISION TV',at:Date.now()});localStorage.setItem('nv_tv_recent',JSON.stringify(a.slice(0,5)))}catch{}}
  function renderAvailable(){const box=$('#tv11AvailableList');if(!box)return;let a=[];try{a=JSON.parse(localStorage.getItem('nv_tv_recent')||'[]')}catch{}if(!a.length){box.innerHTML='<div class="tv11-no-tv"><i class="fa-solid fa-tv"></i><span>No hay TVs guardadas todavía</span><small>Abre primero NETVISION en la TV para obtener el código.</small></div>';return}box.innerHTML=a.map(x=>`<button class="tv11-recent" data-code="${x.code}"><span class="tv11-recent-icon"><i class="fa-solid fa-tv"></i></span><span><strong>${x.name}</strong><small>Código ${x.code}</small></span><i class="fa-solid fa-chevron-right"></i></button>`).join('');box.querySelectorAll('.tv11-recent').forEach(b=>b.onclick=()=>{go(basePath+'?remote=1&code='+encodeURIComponent(b.dataset.code))})}

  function hideTVPanel(){const p=$('#tv11Panel');if(p)p.classList.add('tv11-connected-hidden');$('#tv11Badge')?.remove()}
  function showTVPanel(){const p=$('#tv11Panel');if(p)p.classList.remove('tv11-connected-hidden');$('#tv11Badge')?.remove()}
  function showPlaybackHint(){let b=$('#tv11PlaybackHint');if(!b){b=document.createElement('button');b.id='tv11PlaybackHint';b.className='tv11-playback-hint';b.innerHTML='<i class="fa-solid fa-play"></i> Activar reproducción';document.body.appendChild(b);b.onclick=()=>unlockPlayback()}b.classList.remove('hidden')}
  function hidePlaybackHint(){$('#tv11PlaybackHint')?.classList.add('hidden')}
  async function unlockPlayback(){state.unlocked=true;window.__NVTV_UNLOCKED=true;hidePlaybackHint();const v=getVideo();if(v){v.muted=false;try{await v.play()}catch{} }NV?.toast?.('Reproducción activada')}

  function globalFocusables(){return ['#homeBtn','#mainMenuBtn','#tvConnectBtn','#searchBtn','#settingsBtn','#profileBtn'].flatMap(s=>{const e=$(s);return e&&isVisible(e)?[e]:[]})}
  function isVisible(e){if(!e)return false;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&s.pointerEvents!=='none'}
  function getFocusables(){
    const modal=document.querySelector('.modal:not(.hidden)');
    if(modal){
      const arr=[...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].filter(isVisible);
      return arr;
    }
    const screen=document.querySelector('.screen:not(.hidden)');let arr=globalFocusables();
    if(screen)arr=arr.concat([...screen.querySelectorAll('button:not([disabled]),input:not([disabled]),[tabindex="0"],.catalog-card,.channel-item,.genre-chip,.home-card,.episode-item')].filter(e=>isVisible(e)&&!e.closest('#tv11Panel')));
    const seen=new Set();return arr.filter(e=>{if(seen.has(e))return false;seen.add(e);return true});
  }
  function paintFocus(){state.focusables.forEach(x=>x.classList.remove('remote-focus'));state.focusables=getFocusables();if(!state.focusables.length)return;if(state.focus>=state.focusables.length)state.focus=0;const el=state.focusables[state.focus];el?.classList.add('remote-focus');el?.scrollIntoView({block:'nearest',inline:'nearest'});send(statePacket())}
  function refreshFocus(){setTimeout(paintFocus,100)}
  function specialHomeMove(dx,dy){
    const cards=[...document.querySelectorAll('#homeScreen .home-card')].filter(isVisible), list=$('#myListBtn');
    if(!cards.length)return false;
    const cur=state.focusables[state.focus];
    if(cards.includes(cur)){
      const i=cards.indexOf(cur);
      if((dx===1&&i<cards.length-1)||(dx===-1&&i>0)){state.focus=state.focusables.indexOf(cards[i+dx]);paintFocus();return true}
      if(dy===1){if(i<cards.length-1){state.focus=state.focusables.indexOf(cards[i+1]);paintFocus();return true}if(list&&isVisible(list)){state.focus=state.focusables.indexOf(list);paintFocus();return true}}
      if(dy===-1){const idx=globalFocusables().length; if(idx){let candidate=state.focusables.findIndex(e=>e.id==='mainMenuBtn');if(candidate>=0){state.focus=candidate;paintFocus();return true}}}
    }
    if(cur===list&&dy===-1){const i=state.focusables.indexOf(cards[cards.length-1]);if(i>=0){state.focus=i;paintFocus();return true}}
    return false;
  }
  function move(dx,dy){
    if(NV?.state?.view==='home'&&specialHomeMove(dx,dy))return;
    state.focusables=getFocusables();if(!state.focusables.length)return;const current=state.focusables[state.focus];if(!current)return;const cr=current.getBoundingClientRect();let best=-1,score=Infinity;
    state.focusables.forEach((el,i)=>{if(i===state.focus)return;const r=el.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2,tx=cr.left+cr.width/2,ty=cr.top+cr.height/2,vx=cx-tx,vy=cy-ty;if((dx&&Math.sign(vx)!==dx)||(dy&&Math.sign(vy)!==dy))return;const primary=dx?Math.abs(vx):Math.abs(vy),secondary=dx?Math.abs(vy):Math.abs(vx),sc=primary*3+secondary;if(sc<score){score=sc;best=i}});if(best>=0){state.focus=best;paintFocus()}}
  function select(){const el=state.focusables[state.focus];if(!el)return;if(el.tagName==='INPUT'){el.focus();send(statePacket());return}el.click();refreshFocus()}

  function getVideo(){const a=$('#mediaVideo'),b=$('#tvVideo');if(NV?.state?.view==='media'&&a)return a;if(NV?.state?.view==='tv'&&b)return b;return a||b||null}
  function togglePseudoFullscreen(){const target=NV?.state?.view==='media'?$('#mediaPlayer'):$('#tvPlayer');if(!target)return;const active=target.classList.toggle('remote-fullscreen');document.body.classList.toggle('nv-remote-fullscreen',active);if(!active)target.classList.remove('is-fullscreen')}
  function exitRemoteFullscreen(){if(document.fullscreenElement)document.exitFullscreen?.();document.querySelectorAll('.remote-fullscreen').forEach(x=>x.classList.remove('remote-fullscreen'));document.body.classList.remove('nv-remote-fullscreen');}
  async function playPause(){const v=getVideo();if(!v)return;if(v.paused){try{if(!state.unlocked){v.muted=true;await v.play();showPlaybackHint();}else{await v.play()}}catch{showPlaybackHint();NV?.toast?.('La TV necesita una activación local de reproducción una sola vez.')}}else v.pause()}
  function setVolume(delta){const v=getVideo();if(!v)return;v.muted=false;v.volume=Math.max(0,Math.min(1,(v.volume||0)+delta))}
  function toggleMute(){const v=getVideo();if(v)v.muted=!v.muted}
  function focusSearch(){const i=NV?.state?.view==='tv'?$('#channelSearch'):$('#catalogSearch');if(i){i.focus();i.select?.();return true}return false}
  function tvCommand(c){
    if(c==='up')return move(0,-1);if(c==='down')return move(0,1);if(c==='left')return move(-1,0);if(c==='right')return move(1,0);if(c==='select')return select();
    if(c==='back'){if(document.activeElement?.tagName==='INPUT'){document.activeElement.blur();return}if(document.fullscreenElement||document.querySelector('.remote-fullscreen')){exitRemoteFullscreen();return}if(NV?.state?.view!=='home')NV.setView('home');else {const m=document.querySelector('.modal:not(.hidden)');if(m)m.querySelector('[data-close],[data-close-settings],[data-close-switch]')?.click();}refreshFocus();return}
    if(c==='home')return NV?.setView('home');if(c==='search'){focusSearch();return}
    if(c==='prev')return NV?.changeChannel?.(-1);if(c==='next')return NV?.changeChannel?.(1);if(c==='fullscreen')return togglePseudoFullscreen();if(c==='activate')return unlockPlayback();if(c==='playpause')return playPause();
    if(c==='volup')return setVolume(.1);if(c==='voldown')return setVolume(-.1);if(c==='mute')return toggleMute();if(c==='disconnect'){disconnect();showTVPanel();return}
  }
  function statePacket(){return {t:'state',view:NV?.state?.view||'home',title:$('#mediaTitle')?.textContent||$('#tvNowName')?.textContent||'',label:$('#catalogTitle')?.textContent||'',focus:state.focusables[state.focus]?.getAttribute('aria-label')||state.focusables[state.focus]?.textContent?.trim().slice(0,50)||''}}

  function bindConnect(){$('#tv11Exit').onclick=closeMode;$('#tv11AsTV').onclick=()=>go(basePath+'?tv=1');$('#tv11AsRemote').onclick=()=>go(basePath+'?remote=1');$('#tv11RefreshList').onclick=renderAvailable;renderAvailable()}
  function bindTV(){
    const peerId=makeCode();state.code=peerId;$('#tv11Code').textContent=peerId;
    try{state.peer=new Peer(peerId)}catch(e){status('No se pudo iniciar la conexión. Recarga la TV.');return}
    state.peer.on('open',()=>status('✓ TV lista · Esperando teléfono…'));
    state.peer.on('connection',conn=>{if(state.conn?.open)state.conn.close();state.conn=conn;conn.on('open',()=>{state.connected=true;status('✓ Teléfono conectado');saveRecent(peerId);state.focus=0;paintFocus();send(statePacket());hideTVPanel();showPlaybackHint()});conn.on('data',d=>{if(d?.t==='cmd')tvCommand(d.c);if(d?.t==='text'){const i=document.activeElement?.matches('input')?document.activeElement:null;if(i){i.value=d.value;i.dispatchEvent(new Event('input',{bubbles:true}))}}if(d?.t==='enter'){document.activeElement?.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))}});conn.on('close',()=>{state.connected=false;showTVPanel();status('Teléfono desconectado · Esperando otro teléfono…');showPlaybackHint()});conn.on('error',()=>status('Error de comunicación con el teléfono'))});
    state.peer.on('error',e=>{console.warn('NETVISION TV PeerJS',e);status(e?.type==='unavailable-id'?'Código ocupado. Recarga la TV para generar otro.':'No se pudo iniciar la conexión. Recarga la TV.')});
    $('#tv11Close').onclick=closeMode;$('#tv11Exit').onclick=closeMode;
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.querySelector('.remote-fullscreen')){e.preventDefault();exitRemoteFullscreen();paintFocus()}});
    const obs=new MutationObserver(()=>{if(state.connected)send(statePacket());refreshFocus()});obs.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});setInterval(()=>{if(state.connected)send(statePacket())},1200);
  }
  function bindRemote(){
    $('#remote11Back').onclick=()=>go(basePath+'?connect=1');$('#remote11Exit').onclick=closeMode;$('#remote11Disconnect').onclick=()=>{send({t:'cmd',c:'disconnect'});disconnect();showRemoteDisconnected()};
    $('#remote11Connect').onclick=connectRemote;
    const codeFromUrl=qs.get('code');if(codeFromUrl){$('#remote11Code').value=codeFromUrl.toUpperCase();setTimeout(connectRemote,120)}
    document.querySelectorAll('#remote11Controller [data-cmd]').forEach(b=>b.onclick=()=>send({t:'cmd',c:b.dataset.cmd}));
    $('#remote11Code').addEventListener('input',e=>e.target.value=e.target.value.replace(/[^a-z0-9]/gi,'').toUpperCase());
    const search=$('#remote11Search');search.addEventListener('input',()=>send({t:'text',value:search.value}));search.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();send({t:'enter'})}});$('#remote11SearchClear').onclick=()=>{search.value='';send({t:'text',value:''})};
    window.addEventListener('pagehide',()=>{try{send({t:'cmd',c:'disconnect'})}catch{}disconnect()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();go(basePath+'?connect=1')}});
  }
  async function connectRemote(){const c=($('#remote11Code').value||'').trim().toUpperCase();if(c.length!==6){status('Escribe un código de 6 caracteres');return}try{await loadPeer();if(state.peer&&!state.peer.destroyed)try{state.peer.destroy()}catch{}state.peer=new Peer();state.peer.on('open',()=>{status('Conectando…');state.conn=state.peer.connect(c,{reliable:true});state.conn.on('open',()=>{state.connected=true;saveRecent(c);status('● TV conectada');$('#remote11ConnectionCard').classList.add('hidden');$('#remote11Controller').classList.remove('hidden');$('#remote11Where').textContent='Código '+c;send({t:'hello'});$('#remote11Search').focus()});state.conn.on('data',d=>{if(d?.t==='state'){$('#remote11Status').textContent=`● TV conectada · ${d.label||d.title||d.view||'NETVISION'}`}});state.conn.on('close',showRemoteDisconnected);state.conn.on('error',()=>status('Error de comunicación'))});state.peer.on('error',()=>status('No se pudo conectar a esa TV'))}catch(e){console.warn(e);status('No se pudo cargar NETVISION TV')}}
  function showRemoteDisconnected(){state.connected=false;$('#remote11ConnectionCard')?.classList.remove('hidden');$('#remote11Controller')?.classList.add('hidden');status('● Desconectado')}
  function disconnect(){try{state.conn?.close();state.peer?.destroy()}catch{}state.conn=null;state.peer=null;state.connected=false}

  ensureShell();
  if(mode==='connect'){bindConnect();document.title='NETVISION | Conectar TV';return}
  loadPeer().then(()=>mode==='tv'?bindTV():bindRemote()).catch(()=>status('No se pudo cargar NETVISION TV'));
  document.title=mode==='remote'?'NETVISION | Control remoto':'NETVISION | TV 1.1';
})();
