/* NETVISION TV 1.1 V7 — mando remoto natural y navegación por secciones */
'use strict';
(function(){
  const qs=new URLSearchParams(location.search);
  const mode=qs.get('tv')==='1'?'tv':qs.get('remote')==='1'?'remote':qs.get('connect')==='1'?'connect':null;
  if(!mode)return;

  const PEER_URL='https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
  const state={peer:null,conn:null,code:'',focus:0,focusables:[],connected:false,unlocked:false,viewMemory:{}};
  const $=s=>document.querySelector(s);
  const basePath=location.pathname;

  function loadPeer(){return new Promise((resolve,reject)=>{
    if(window.Peer)return resolve();
    const s=document.createElement('script');s.src=PEER_URL;s.async=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
  })}
  function makeCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let x='';for(let i=0;i<6;i++)x+=chars[Math.floor(Math.random()*chars.length)];return x}
  function go(path){location.href=path}
  function closeMode(){disconnect();go(basePath)}
  function visible(e){if(!e)return false;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&s.pointerEvents!=='none'}
  function show(el){el?.classList.remove('hidden')}
  function hide(el){el?.classList.add('hidden')}

  function ensureShell(){
    if($('#tv11Panel')||$('#remote11Root'))return;
    if(mode==='connect'){
      const d=document.createElement('div');d.id='tv11Panel';d.className='tv11-panel';
      d.innerHTML=`<div class="tv11-card tv11-connect-card">
        <button id="tv11Exit" class="tv11-x" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
        <div class="tv11-logo"><span>NET</span>VISION</div><div class="tv11-kicker">NETVISION TV 1.1</div>
        <h2>Conectar a NETVISION TV</h2><p>Elige qué dispositivo estás usando.</p>
        <div class="tv11-choice-grid">
          <button id="tv11AsTV" class="tv11-choice"><span class="tv11-choice-icon">📺</span><strong>Esta es la TV</strong><small>Abrir NETVISION en esta pantalla y mostrar un código para el teléfono.</small></button>
          <button id="tv11AsRemote" class="tv11-choice"><span class="tv11-choice-icon">📱</span><strong>Este es el teléfono</strong><small>Usar este teléfono como control remoto completo.</small></button>
        </div>
        <div class="tv11-info"><i class="fa-solid fa-circle-info"></i> La conexión se realiza con un código mostrado por la TV.</div>
      </div>`;
      document.body.appendChild(d);
      return;
    }
    if(mode==='tv'){
      const d=document.createElement('div');d.id='tv11Panel';d.className='tv11-panel';
      d.innerHTML=`<div class="tv11-card tv11-tv-card">
        <button id="tv11Exit" class="tv11-x" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
        <div class="tv11-logo"><span>NET</span>VISION</div><div class="tv11-kicker">NETVISION TV 1.1</div>
        <h2>Conecta tu teléfono</h2><p>En tu teléfono abre NETVISION y selecciona <b>Este es el teléfono</b>.</p>
        <div class="tv11-code" id="tv11Code">------</div><small>Introduce este código en tu teléfono.</small>
        <div id="tv11Status" class="tv11-status">Iniciando NETVISION TV…</div>
        <button id="tv11Close" class="outline-btn">Continuar sin teléfono</button>
      </div>`;
      document.body.appendChild(d);
      return;
    }
    const d=document.createElement('div');d.id='remote11Root';d.className='remote11-wrap';
    d.innerHTML=`<div class="remote11-shell">
      <header class="remote11-head">
        <button id="remote11Back" class="remote11-icon" title="Volver"><i class="fa-solid fa-arrow-left"></i></button>
        <div class="remote11-brand"><div class="tv11-logo"><span>NET</span>VISION</div><small>CONTROL REMOTO</small></div>
        <button id="remote11Exit" class="remote11-icon" title="Cerrar"><i class="fa-solid fa-xmark"></i></button>
      </header>
      <section id="remote11ConnectionCard" class="remote11-card">
        <div class="remote11-section-title">Conectar a una TV</div>
        <div id="remote11Status" class="remote11-dot">● Desconectado</div>
        <label class="remote11-connect">Código de la TV<input id="remote11Code" maxlength="6" inputmode="text" autocomplete="off" placeholder="ABC123"></label>
        <button id="remote11Connect" class="primary-btn full">📺 Conectar a TV</button>
      </section>
      <section id="remote11Controller" class="remote11-controller hidden">
        <div class="remote11-online"><span class="online-dot">●</span><div><strong>TV conectada</strong><small id="remote11Where">NETVISION TV</small></div><button id="remote11Disconnect" title="Desconectar"><i class="fa-solid fa-link-slash"></i></button></div>
        <div class="remote11-row-title">ACCESOS RÁPIDOS</div>
        <div class="remote11-shortcuts">
          <button data-nav="home"><i class="fa-solid fa-house"></i><span>Inicio</span></button>
          <button data-nav="tv"><i class="fa-solid fa-tv"></i><span>TV en vivo</span></button>
          <button data-nav="movies"><i class="fa-solid fa-film"></i><span>Películas</span></button>
          <button data-nav="series"><i class="fa-solid fa-clapperboard"></i><span>Series</span></button>
          <button data-nav="mylist"><i class="fa-regular fa-bookmark"></i><span>Mi lista</span></button>
          <button data-nav="settings"><i class="fa-solid fa-gear"></i><span>Ajustes</span></button>
          <button data-nav="profile"><i class="fa-solid fa-user"></i><span>Perfil</span></button>
        </div>
        <div class="remote11-row-title">NAVEGACIÓN</div>
        <div class="remote11-pad">
          <button data-cmd="back" title="Atrás"><i class="fa-solid fa-arrow-left"></i></button><button data-cmd="up" title="Arriba"><i class="fa-solid fa-chevron-up"></i></button><button data-cmd="home" title="Inicio"><i class="fa-solid fa-house"></i></button>
          <button data-cmd="left" title="Izquierda"><i class="fa-solid fa-chevron-left"></i></button><button data-cmd="select" class="remote-ok" title="Seleccionar">OK</button><button data-cmd="right" title="Derecha"><i class="fa-solid fa-chevron-right"></i></button>
          <button class="remote-empty" tabindex="-1" aria-hidden="true"></button><button data-cmd="down" title="Abajo"><i class="fa-solid fa-chevron-down"></i></button><button data-cmd="back" title="Atrás"><i class="fa-solid fa-arrow-rotate-left"></i></button>
        </div>
        <div class="remote11-row-title">REPRODUCCIÓN</div>
        <div class="remote11-action-row three"><button data-cmd="prev"><i class="fa-solid fa-backward-step"></i><span>Anterior</span></button><button data-cmd="playpause" class="accent"><i class="fa-solid fa-play"></i><span>Reproducir / Pausa</span></button><button data-cmd="next"><i class="fa-solid fa-forward-step"></i><span>Siguiente</span></button></div>
        <div class="remote11-row-title">VOLUMEN</div>
        <div class="remote11-action-row three"><button data-cmd="voldown"><i class="fa-solid fa-volume-low"></i><span>Bajar</span></button><button data-cmd="mute"><i class="fa-solid fa-volume-xmark"></i><span>Silenciar</span></button><button data-cmd="volup"><i class="fa-solid fa-volume-high"></i><span>Subir</span></button></div>
        <div class="remote11-row-title">PANTALLA</div>
        <div class="remote11-action-row two"><button data-cmd="fullscreen"><i class="fa-solid fa-expand"></i><span>Pantalla completa</span></button><button data-cmd="activate"><i class="fa-solid fa-play-circle"></i><span>Activar reproducción</span></button></div>
      </section>
      <div class="remote11-tip">El control puede recorrer toda la interfaz de NETVISION. Usa OK para entrar y Atrás para regresar.</div>
    </div>`;
    document.body.appendChild(d);
  }

  function status(text){const e=mode==='tv'?$('#tv11Status'):$('#remote11Status');if(e)e.textContent=text}
  function send(obj){if(state.conn?.open)try{state.conn.send(obj)}catch{} }
  function hideTVPanel(){const p=$('#tv11Panel');if(p){p.classList.add('tv11-connected-hidden');p.setAttribute('aria-hidden','true')}hide($('#tv11PlaybackHint'))}
  function showTVPanel(){const p=$('#tv11Panel');if(p){p.classList.remove('tv11-connected-hidden');p.removeAttribute('aria-hidden')}}
  function getVideo(){return NV?.state?.view==='tv'?$('#tvVideo'):NV?.state?.view==='media'?$('#mediaVideo'):$('#mediaVideo')||$('#tvVideo')}
  function showPlaybackHint(){let b=$('#tv11PlaybackHint');if(!b){b=document.createElement('button');b.id='tv11PlaybackHint';b.className='tv11-playback-hint';b.innerHTML='<i class="fa-solid fa-play"></i> Activar reproducción';document.body.appendChild(b);b.onclick=()=>unlockPlayback()}show(b)}
  function hidePlaybackHint(){hide($('#tv11PlaybackHint'))}
  async function unlockPlayback(){state.unlocked=true;window.__NVTV_UNLOCKED=true;hidePlaybackHint();const v=getVideo();if(v){v.muted=false;try{await v.play()}catch{}}}

  /* ----- foco y navegación ----- */
  function headerItems(){return ['#homeBtn','#mainMenuBtn','#tvConnectBtn','#settingsBtn','#profileBtn'].map(s=>$(s)).filter(visible)}
  function clean(arr){const seen=new Set();return arr.filter(e=>e&&visible(e)&&!seen.has(e)&&(seen.add(e),true))}
  function viewFocusables(){
    const view=NV?.state?.view||'home';
    if(view==='home') return clean([...document.querySelectorAll('#homeScreen .home-card,#myListBtn'),...headerItems()]);
    if(view==='tv') return clean([...document.querySelectorAll('#tvScreen #categoryTabs .category-tab,#tvScreen #channelList .channel-item,#tvScreen .tv-now-bar button,#tvScreen .tv-top-overlay .player-back')]);
    if(view==='movies'||view==='series') return clean([...document.querySelectorAll('#catalogScreen .back-home,#catalogScreen #catalogGenres .genre-chip,#catalogScreen #catalogRefresh,#catalogScreen #catalogGrid .catalog-card,#catalogScreen #catalogMore')]);
    if(view==='media') return clean([...document.querySelectorAll('#mediaScreen #mediaBack,#mediaScreen #mediaPlayAgain,#mediaScreen #mediaListBtn,#mediaScreen #mediaFullscreen,#mediaScreen #episodeList .episode-item,#mediaScreen #closeEpisodes')]);
    return headerItems();
  }
  function modalFocusables(){const m=document.querySelector('.modal:not(.hidden)');return m?clean([...m.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')]):null}
  function getFocusables(){return modalFocusables()||viewFocusables()}
  function rememberView(){const v=NV?.state?.view||'home';if(state.focusables[state.focus])state.viewMemory[v]=state.focusables[state.focus]}
  function restoreFocus(){state.focusables=getFocusables();if(!state.focusables.length)return;const saved=state.viewMemory[NV?.state?.view||'home'];let idx=saved?state.focusables.indexOf(saved):-1;if(idx<0)idx=Math.min(state.focus,state.focusables.length-1);state.focus=Math.max(0,idx);paintFocus()}
  function paintFocus(){state.focusables.forEach(x=>x.classList.remove('remote-focus'));state.focusables=getFocusables();if(!state.focusables.length)return;if(state.focus>=state.focusables.length)state.focus=state.focusables.length-1;const el=state.focusables[state.focus];el?.classList.add('remote-focus');el?.scrollIntoView({block:'nearest',inline:'nearest'});send(statePacket())}
  function refreshFocus(){setTimeout(restoreFocus,80)}

  function gridMove(dx,dy){
    const view=NV?.state?.view||'home';
    if(view==='movies'||view==='series'){
      const cards=[...document.querySelectorAll('#catalogGrid .catalog-card')].filter(visible);const cur=state.focusables[state.focus];
      if(cards.includes(cur)){
        const i=cards.indexOf(cur);if(dx!==0){const row=cur.getBoundingClientRect().top;const same=cards.filter(c=>Math.abs(c.getBoundingClientRect().top-row)<20);const pos=same.indexOf(cur);const next=same[pos+dx];if(next){state.focus=state.focusables.indexOf(next);paintFocus();return true}}
        if(dy!==0){const r=cur.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let best=null,score=Infinity;for(const c of cards){if(c===cur)continue;const q=c.getBoundingClientRect(),qx=q.left+q.width/2,qy=q.top+q.height/2;if((dy>0&&qy<=cy+5)||(dy<0&&qy>=cy-5))continue;const primary=Math.abs(qy-cy),secondary=Math.abs(qx-cx);const s=primary*4+secondary;if(s<score){score=s;best=c}}if(best){state.focus=state.focusables.indexOf(best);paintFocus();return true}}
      }
    }
    if(view==='home'){
      const cards=[...document.querySelectorAll('#homeScreen .home-card')].filter(visible),list=$('#myListBtn'),cur=state.focusables[state.focus];
      if(cards.includes(cur)){const i=cards.indexOf(cur);if(dx&&cards[i+dx]){state.focus=state.focusables.indexOf(cards[i+dx]);paintFocus();return true}if(dy>0&&list&&visible(list)){state.focus=state.focusables.indexOf(list);paintFocus();return true}if(dy<0){const h=$('#mainMenuBtn');if(h&&visible(h)){state.focus=state.focusables.indexOf(h);paintFocus();return true}}}
      if(cur===list&&dy<0){const c=cards[cards.length-1];if(c){state.focus=state.focusables.indexOf(c);paintFocus();return true}}
    }
    return false;
  }
  function move(dx,dy){
    if(gridMove(dx,dy))return;
    const arr=getFocusables();if(!arr.length)return;state.focusables=arr;const cur=arr[state.focus];if(!cur){state.focus=0;paintFocus();return}const r=cur.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let best=-1,score=Infinity;
    arr.forEach((el,i)=>{if(i===state.focus)return;const q=el.getBoundingClientRect(),x=q.left+q.width/2,y=q.top+q.height/2,vx=x-cx,vy=y-cy;if(dx&&Math.sign(vx)!==dx)return;if(dy&&Math.sign(vy)!==dy)return;const primary=dx?Math.abs(vx):Math.abs(vy),secondary=dx?Math.abs(vy):Math.abs(vx);const s=primary*5+secondary;if(s<score){score=s;best=i}});
    if(best>=0){state.focus=best;paintFocus()}
  }
  function select(){const el=state.focusables[state.focus];if(!el)return;if(el.tagName==='INPUT'){el.focus();return}rememberView();el.click();refreshFocus()}

  /* ----- reproducción ----- */
  function togglePseudoFullscreen(){const target=NV?.state?.view==='media'?$('#mediaPlayer'):$('#tvPlayer');if(!target)return;const active=target.classList.toggle('remote-fullscreen');document.body.classList.toggle('nv-remote-fullscreen',active);}
  function exitRemoteFullscreen(){if(document.fullscreenElement)document.exitFullscreen?.().catch?.(()=>{});document.querySelectorAll('.remote-fullscreen').forEach(x=>x.classList.remove('remote-fullscreen'));document.body.classList.remove('nv-remote-fullscreen');}
  async function playPause(){const v=getVideo();if(!v){NV?.toast?.('No hay reproducción activa');return}if(v.paused){try{if(!state.unlocked){v.muted=true;await v.play();state.unlocked=true;v.muted=false;hidePlaybackHint()}else await v.play()}catch{showPlaybackHint()}}else v.pause()}
  function setVolume(delta){const v=getVideo();if(v){v.muted=false;v.volume=Math.max(0,Math.min(1,(v.volume||0)+delta))}}
  function toggleMute(){const v=getVideo();if(v)v.muted=!v.muted}

  function navigateTo(view){
    if(view==='home')return NV?.setView('home');
    if(view==='tv'||view==='movies'||view==='series')return NV?.setView(view);
    if(view==='mylist')return NV?.openMyList?.();
    if(view==='settings')return NV?.openSettings?.();
    if(view==='profile')return NV?.openProfileSwitcher?.();
  }
  function tvCommand(c){
    if(c==='up')return move(0,-1);if(c==='down')return move(0,1);if(c==='left')return move(-1,0);if(c==='right')return move(1,0);if(c==='select')return select();
    if(c==='back'){if(document.activeElement?.matches('input,textarea')){document.activeElement.blur();return}if(document.fullscreenElement||document.querySelector('.remote-fullscreen')){exitRemoteFullscreen();return}const modal=document.querySelector('.modal:not(.hidden)');if(modal){modal.querySelector('[data-close],[data-close-settings],[data-close-switch],[data-close-list]')?.click();refreshFocus();return}if(NV?.state?.view!=='home'){rememberView();NV.setView('home');refreshFocus()}return}
    if(c==='home'){rememberView();return NV?.setView('home')}
    if(c==='prev')return NV?.state?.view==='tv'?NV.changeChannel?.(-1):window.prevEpisode?.();
    if(c==='next')return NV?.state?.view==='tv'?NV.changeChannel?.(1):window.nextEpisode?.();
    if(c==='fullscreen')return togglePseudoFullscreen();if(c==='activate')return unlockPlayback();if(c==='playpause')return playPause();
    if(c==='volup')return setVolume(.1);if(c==='voldown')return setVolume(-.1);if(c==='mute')return toggleMute();
    if(c==='disconnect'){disconnect();showRemoteDisconnected();return}
  }
  function statePacket(){const el=state.focusables[state.focus];return {t:'state',view:NV?.state?.view||'home',title:$('#mediaTitle')?.textContent||$('#tvNowName')?.textContent||'',label:$('#catalogTitle')?.textContent||'',focus:el?.getAttribute('aria-label')||el?.textContent?.trim().replace(/\s+/g,' ').slice(0,45)||''}}

  function bindConnect(){$('#tv11Exit').onclick=closeMode;$('#tv11AsTV').onclick=()=>go(basePath+'?tv=1');$('#tv11AsRemote').onclick=()=>go(basePath+'?remote=1')}
  function bindTV(){
    const peerId=makeCode();state.code=peerId;$('#tv11Code').textContent=peerId;
    try{state.peer=new Peer(peerId)}catch{status('No se pudo iniciar la conexión. Recarga la TV.');return}
    state.peer.on('open',()=>status('✓ TV lista · Esperando teléfono…'));
    state.peer.on('connection',conn=>{
      if(state.conn?.open)state.conn.close();state.conn=conn;
      conn.on('open',()=>{state.connected=true;state.unlocked=false;status('✓ Teléfono conectado');paintFocus();send(statePacket());hideTVPanel()});
      conn.on('data',d=>{if(d?.t==='cmd')tvCommand(d.c);if(d?.t==='nav')navigateTo(d.view);});
      conn.on('close',()=>{state.connected=false;showTVPanel();status('Teléfono desconectado · Esperando otro teléfono…');hidePlaybackHint()});
      conn.on('error',()=>status('Error de comunicación con el teléfono'));
    });
    state.peer.on('error',e=>{console.warn('NETVISION TV PeerJS',e);status(e?.type==='unavailable-id'?'Código ocupado. Recarga la TV para generar otro.':'No se pudo iniciar la conexión. Recarga la TV.')});
    $('#tv11Close').onclick=closeMode;$('#tv11Exit').onclick=closeMode;
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(document.fullscreenElement||document.querySelector('.remote-fullscreen'))){e.preventDefault();exitRemoteFullscreen();refreshFocus()}});
    const obs=new MutationObserver(()=>{if(state.connected)send(statePacket());if(state.connected)refreshFocus()});obs.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
    setInterval(()=>{if(state.connected)send(statePacket())},1200);
  }
  function bindRemote(){
    $('#remote11Back').onclick=()=>go(basePath+'?connect=1');$('#remote11Exit').onclick=closeMode;
    $('#remote11Disconnect').onclick=()=>{send({t:'cmd',c:'disconnect'});disconnect();showRemoteDisconnected()};
    $('#remote11Connect').onclick=connectRemote;
    const codeFromUrl=qs.get('code');if(codeFromUrl){$('#remote11Code').value=codeFromUrl.toUpperCase();setTimeout(connectRemote,120)}
    document.querySelectorAll('#remote11Controller [data-cmd]').forEach(b=>b.onclick=()=>send({t:'cmd',c:b.dataset.cmd}));
    document.querySelectorAll('#remote11Controller [data-nav]').forEach(b=>b.onclick=()=>send({t:'nav',view:b.dataset.nav}));
    $('#remote11Code').addEventListener('input',e=>e.target.value=e.target.value.replace(/[^a-z0-9]/gi,'').toUpperCase());
    window.addEventListener('pagehide',()=>{try{send({t:'cmd',c:'disconnect'})}catch{}disconnect()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();go(basePath+'?connect=1')}});
  }
  async function connectRemote(){const c=($('#remote11Code').value||'').trim().toUpperCase();if(c.length!==6){status('Escribe un código de 6 caracteres');return}try{await loadPeer();if(state.peer&&!state.peer.destroyed)try{state.peer.destroy()}catch{}state.peer=new Peer();state.peer.on('open',()=>{status('Conectando…');state.conn=state.peer.connect(c,{reliable:true});state.conn.on('open',()=>{state.connected=true;status('● TV conectada');$('#remote11ConnectionCard').classList.add('hidden');$('#remote11Controller').classList.remove('hidden');$('#remote11Where').textContent='NETVISION TV';});state.conn.on('data',d=>{if(d?.t==='state')$('#remote11Where').textContent='NETVISION · '+(d.view==='tv'?'TV en vivo':d.view==='movies'?'Películas':d.view==='series'?'Series':d.view==='media'?'Reproducción':'Inicio')});state.conn.on('close',showRemoteDisconnected);state.conn.on('error',()=>status('Error de comunicación'))});state.peer.on('error',()=>status('No se pudo conectar a esa TV'))}catch{status('No se pudo cargar NETVISION TV')}}
  function showRemoteDisconnected(){state.connected=false;show($('#remote11ConnectionCard'));hide($('#remote11Controller'));status('● Desconectado')}
  function disconnect(){try{state.conn?.close();state.peer?.destroy()}catch{}state.conn=null;state.peer=null;state.connected=false}

  ensureShell();
  if(mode==='connect'){bindConnect();document.title='NETVISION | Conectar TV';return}
  loadPeer().then(()=>mode==='tv'?bindTV():bindRemote()).catch(()=>status('No se pudo cargar NETVISION TV'));
  document.title=mode==='remote'?'NETVISION | Control remoto':'NETVISION | TV 1.1';
})();
