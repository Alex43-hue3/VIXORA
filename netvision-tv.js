/* NETVISION 1.1 — TV + control remoto completo */
'use strict';
(function(){
 const qs=new URLSearchParams(location.search);
 const mode=qs.get('tv')==='1'?'tv':qs.get('remote')==='1'?'remote':null;
 const $=s=>document.querySelector(s);
 const PEER_URL='https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
 const state={peer:null,conn:null,code:'',connected:false,focus:0,focusables:[]};
 function loadPeer(){return new Promise((resolve,reject)=>{if(window.Peer)return resolve();const s=document.createElement('script');s.src=PEER_URL;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
 function makeCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let x='';for(let i=0;i<6;i++)x+=chars[Math.floor(Math.random()*chars.length)];return x}
 function nav(path){location.href=location.pathname+path}
 function addModal(){
  if($('#tvConnectModal'))return;
  // The modal lives in index.html; this fallback keeps the feature usable if the markup is cached.
 }
 function openConnect(){ $('#tvConnectModal')?.classList.remove('hidden'); }
 window.NV=window.NV||{}; NV.openTVConnect=openConnect;
 function bindConnect(){
  document.querySelectorAll('[data-close-tv]').forEach(x=>x.onclick=()=>$('#tvConnectModal')?.classList.add('hidden'));
  $('#openTvModeBtn')?.addEventListener('click',()=>nav('?tv=1'));
  $('#openRemoteModeBtn')?.addEventListener('click',()=>nav('?remote=1'));
 }
 function shell(){
  if($('#tv11Panel'))return;
  const d=document.createElement('div');d.id='tv11Panel';d.className='tv11-panel';
  if(mode==='tv') d.innerHTML=`<div class="tv11-card"><button id="tv11X" class="tv11-x" title="Cerrar"><i class="fa-solid fa-xmark"></i></button><div class="tv11-logo"><span>NET</span>VISION</div><div class="tv11-kicker">NETVISION TV 1.1</div><h2>Conecta tu teléfono</h2><p>En tu teléfono, abre NETVISION y selecciona <b>Este es el teléfono</b>.</p><div class="tv11-code" id="tv11Code">------</div><small>Introduce este código en tu teléfono.</small><div id="tv11Status" class="tv11-status">Generando código…</div><button id="tv11Close" class="outline-btn">Continuar sin teléfono</button></div>`;
  else d.innerHTML=`<div class="remote11-wrap"><button id="remote11X" class="remote11-x" title="Cerrar"><i class="fa-solid fa-xmark"></i></button><div class="remote11-head"><div><div class="tv11-logo"><span>NET</span>VISION</div><small>CONTROL REMOTO 1.1</small></div><span id="remote11Status" class="remote11-dot">● Desconectado</span></div><label class="remote11-connect">Código de la TV<input id="remote11Code" maxlength="6" inputmode="text" autocomplete="off" placeholder="ABC123"></label><button id="remote11Connect" class="primary-btn full">📺 Conectar a TV</button><div id="remote11Pad" class="remote11-pad hidden"><button data-cmd="back">↩</button><button data-cmd="up">▲</button><button data-cmd="menu">☰</button><button data-cmd="left">◀</button><button data-cmd="select" class="remote-ok">OK</button><button data-cmd="right">▶</button><button data-cmd="home">⌂</button><button data-cmd="down">▼</button><button data-cmd="search">⌕</button></div><div id="remote11Quick" class="remote11-quick hidden"><button data-cmd="playpause">▶ / ⏸</button><button data-cmd="prev">⏮</button><button data-cmd="next">⏭</button><button data-cmd="fullscreen">⛶</button><button data-cmd="disconnect">Desconectar</button></div><button id="remote11Menu" class="remote11-menu">← Menú de conexión</button><div class="remote11-tip">Controla toda la interfaz de NETVISION. Para buscar, toca el campo y usa el teclado del teléfono.</div></div>`;
  document.body.appendChild(d);
 }
 function status(t){const e=mode==='tv'?$('#tv11Status'):$('#remote11Status');if(e)e.textContent=t}
 function send(o){if(state.conn?.open)state.conn.send(o)}
 function focusables(){const screen=document.querySelector('.screen:not(.hidden)');if(!screen)return[];return [...screen.querySelectorAll('button:not([disabled]),input:not([disabled]),[tabindex="0"]')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width&&r.height&&s.display!=='none'&&s.visibility!=='hidden'})}
 function paint(){state.focusables.forEach(e=>e.classList.remove('remote-focus'));state.focusables=focusables();if(!state.focusables.length)return;if(state.focus>=state.focusables.length)state.focus=0;state.focusables[state.focus].classList.add('remote-focus');state.focusables[state.focus].scrollIntoView({block:'nearest'})}
 function move(dx,dy){state.focusables=focusables();if(!state.focusables.length)return;const cur=state.focusables[state.focus],a=cur.getBoundingClientRect(),ax=a.left+a.width/2,ay=a.top+a.height/2;let best=-1,score=1e9;state.focusables.forEach((e,i)=>{if(i===state.focus)return;const r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,vx=x-ax,vy=y-ay;if((dx&&Math.sign(vx)!==dx)||(dy&&Math.sign(vy)!==dy))return;const primary=dx?Math.abs(vx):Math.abs(vy),secondary=dx?Math.abs(vy):Math.abs(vx),sc=primary*3+secondary;if(sc<score){score=sc;best=i}});if(best>=0)state.focus=best;paint()}
 function command(c){
  if(c==='up')return move(0,-1);if(c==='down')return move(0,1);if(c==='left')return move(-1,0);if(c==='right')return move(1,0);
  if(c==='select'){const e=state.focusables[state.focus];if(e?.tagName==='INPUT'){e.focus();return}e?.click();setTimeout(paint,80);return}
  if(c==='home'||c==='menu')return NV?.setView('home');
  if(c==='back'){if(document.activeElement?.matches('input,textarea')){document.activeElement.blur();return}if(NV?.state?.view!=='home')NV.setView('home');else document.querySelector('.modal:not(.hidden) [data-close],.modal:not(.hidden) [data-close-settings],.modal:not(.hidden) [data-close-switch]')?.click();return}
  if(c==='search'){const e=NV?.state?.view==='tv'?$('#channelSearch'):$('#catalogSearch');e?.focus();e?.select?.();return}
  if(c==='prev')return NV?.changeChannel?.(-1);if(c==='next')return NV?.changeChannel?.(1);
  if(c==='fullscreen')return ($('#mediaFullscreen')||$('#tvFullscreen'))?.click();
  if(c==='playpause'){const v=NV?.state?.view==='tv'?$('#tvVideo'):$('#mediaVideo');if(v)v.paused?v.play().catch(()=>{}):v.pause();return}
  if(c==='disconnect')return disconnect();
 }
 function packet(){return{t:'state',view:NV?.state?.view||'home',title:$('#mediaTitle')?.textContent||$('#tvNowName')?.textContent||'',label:$('#catalogTitle')?.textContent||''}}
 function bindTV(){
  state.code=makeCode();$('#tv11Code').textContent=state.code;
  state.peer=new Peer(state.code);
  state.peer.on('open',()=>status('Esperando conexión…'));
  state.peer.on('connection',c=>{state.conn?.close();state.conn=c;c.on('open',()=>{state.connected=true;status('📱 Teléfono conectado');send(packet());paint()});c.on('data',d=>{if(d?.t==='cmd')command(d.c);if(d?.t==='text'){const e=document.activeElement?.matches('input')?document.activeElement:null;if(e){e.value=d.value;e.dispatchEvent(new Event('input',{bubbles:true}))}}});c.on('close',()=>{state.connected=false;status('Esperando conexión…')})});
  state.peer.on('error',()=>status('No se pudo iniciar la conexión. Recarga la TV.'));
  $('#tv11Close').onclick=()=>nav('');$('#tv11X').onclick=()=>nav('');
  const obs=new MutationObserver(()=>{if(state.connected)send(packet());setTimeout(paint,50)});obs.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});setInterval(()=>{if(state.connected)send(packet())},1200);
 }
 function disconnect(){try{state.conn?.close();state.peer?.destroy()}catch{}state.conn=null;state.peer=null;state.connected=false;status(mode==='tv'?'Esperando conexión…':'● Desconectado');if(mode==='remote'){document.querySelector('#remote11Pad')?.classList.add('hidden');document.querySelector('#remote11Quick')?.classList.add('hidden')}}
 function bindRemote(){
  $('#remote11Connect').onclick=async()=>{const c=($('#remote11Code').value||'').trim().toUpperCase();if(c.length!==6){status('Escribe el código de 6 caracteres');return}try{await loadPeer();state.peer=new Peer();state.peer.on('open',()=>{state.conn=state.peer.connect(c,{reliable:true});state.conn.on('open',()=>{state.connected=true;status('● TV conectada');$('#remote11Pad').classList.remove('hidden');$('#remote11Quick').classList.remove('hidden');send({t:'hello'})});state.conn.on('data',d=>{if(d?.t==='state')$('#remote11Status').textContent=`● TV conectada · ${d.label||d.title||d.view}`});state.conn.on('close',()=>{state.connected=false;status('● Desconectado')})});state.peer.on('error',()=>status('No se encontró esa TV. Revisa el código.'))}catch{status('No se pudo cargar el control remoto')}};
  document.querySelectorAll('[data-cmd]').forEach(b=>b.onclick=()=>send({t:'cmd',c:b.dataset.cmd}));
  $('#remote11Code').oninput=e=>e.target.value=e.target.value.replace(/[^a-z0-9]/gi,'').toUpperCase();
  $('#remote11X').onclick=()=>nav('');$('#remote11Menu').onclick=()=>nav('');
 }
 function start(){bindConnect();if(!mode)return;shell();loadPeer().then(()=>mode==='tv'?bindTV():bindRemote()).catch(()=>status('No se pudo cargar NETVISION TV'))}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
 document.addEventListener('keydown',e=>{if(mode==='tv'&&e.key==='Escape')nav('');});
})();
