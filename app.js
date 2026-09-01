const API="https://pelisplushd.tvymas.workers.dev";
const diag=[];
const state={view:"movies",page:1,hls:null,item:null, mobile:/Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent)};

const $=s=>document.querySelector(s);
const grid=$("#grid");

function setStatus(t){$("#status").textContent=t}
function pstatus(t){$("#playerStatus").textContent=t}
function dlog(level,message,extra){
  const entry={time:new Date().toISOString(),level,message,...(extra||{})};
  diag.push(entry);
  const pre=$("#debug");
  if(pre) pre.textContent=JSON.stringify(diag,null,2);
  const summary=$("#diagnosticSummary");
  if(summary){
    summary.className="diagSummary "+(level==="error"?"diag-error":level==="warn"?"diag-warn":"diag-ok");
    summary.textContent=message;
  }
  console[level==="error"?"error":level==="warn"?"warn":"log"]("[NETVISION DIAG]",message,extra||"");
}
function resetDiag(){diag.length=0;dlog("info","Iniciando diagnóstico de reproducción",{userAgent:navigator.userAgent,platform:navigator.platform,online:navigator.onLine,viewport:`${innerWidth}x${innerHeight}`,connection:navigator.connection?{effectiveType:navigator.connection.effectiveType,downlink:navigator.connection.downlink}:null});}
function mediaErrorText(e){if(!e)return "sin código";return ({1:"MEDIA_ERR_ABORTED",2:"MEDIA_ERR_NETWORK",3:"MEDIA_ERR_DECODE",4:"MEDIA_ERR_SRC_NOT_SUPPORTED"}[e.code]||"MEDIA_ERR_UNKNOWN")+` (código ${e.code})`; }
function describeCandidate(c){return {type:c.type,url:c.url,https:c.url.startsWith("https://"),hls:isHls(c.url)}}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

async function getJSON(url){
  const r=await fetch(url,{headers:{Accept:"application/json"}});
  if(!r.ok) throw new Error("HTTP "+r.status);
  return r.json();
}

function arr(data,keys){
  for(const k of keys) if(Array.isArray(data?.[k])) return data[k];
  return Array.isArray(data)?data:[];
}

function norm(x){
  return {
    title:x?.title||x?.name||"Sin título",
    image:x?.image||x?.poster||x?.posterUrl||x?.thumbnail||x?.cover||"",
    year:x?.year||"",
    rating:x?.rating||"",
    url:x?.url||x?.link||x?.detailUrl||"",
    raw:x
  };
}

async function loadCatalog(){
  grid.innerHTML="";
  setStatus("Cargando catálogo…");
  const endpoint=state.view==="movies"
    ? `${API}/peliculas?page=${state.page}`
    : `${API}/series?page=${state.page}`;
  try{
    const data=await getJSON(endpoint);
    const items=arr(data,["peliculas","movies","series","results","data","items"]).map(norm);
    const total=data?.totalPages||data?.total_pages||data?.pages||null;
    $("#pageLabel").textContent=total?`Página ${state.page} / ${total}`:`Página ${state.page}`;
    $("#prev").disabled=state.page<=1;
    $("#next").disabled=total?state.page>=total:false;
    if(!items.length){setStatus("La API no devolvió contenido.");return}
    setStatus(`${items.length} elementos encontrados`);
    items.forEach(x=>{
      const c=document.createElement("article");
      c.className="card";
      c.innerHTML=`<img src="${esc(x.image)}" alt=""><div class="info"><h3>${esc(x.title)}</h3><div class="meta">${esc(x.year)}${x.rating?" · ⭐ "+esc(x.rating):""}</div></div>`;
      c.onclick=()=>openDetail(x);
      grid.appendChild(c);
    });
  }catch(e){console.error(e);setStatus("Error: "+e.message)}
}

async function openDetail(item){
  state.item=item;
  $("#catalogView").hidden=true;$("#detailView").hidden=false;
  $("#detail").innerHTML=`<div class="detailBox"><div class="detailHead"><div><img src="${esc(item.image)}" alt=""></div><div><h2>${esc(item.title)}</h2><p id="detailStatus">Cargando información…</p><div id="movieServers"></div><div id="seriesSeasons"></div></div></div></div>`;
  try{
    const data=await getJSON(item.url);
    if(state.view==="movies") renderMovieDetail(data);
    else renderSeriesDetail(data);
  }catch(e){
    $("#detailStatus").textContent="No se pudo obtener el detalle: "+e.message;
  }
}

function videoEntries(data){
  if(Array.isArray(data?.embeds?.video)) return data.embeds.video;
  if(Array.isArray(data?.videos)) return data.videos;
  if(Array.isArray(data?.servers)) return data.servers;
  return [];
}

function streamFrom(x){
  return x?.stream_url||x?.streamUrl||x?.streamurl||x?.stream?.url||null;
}

function renderMovieDetail(data){
  const servers=videoEntries(data);
  $("#detailStatus").textContent=servers.length?"Servidor detectado. Reproducción automática activada.":"No se encontraron servidores";
  const box=$("#movieServers");
  if(!servers.length)return;
  const preferred=servers.find(s=>/vidhide/i.test(String(s?.name||s?.server||"")));
  const selected=preferred||servers.find(s=>streamFrom(s))||servers[0];
  if(streamFrom(selected)) playStreamEndpoint(streamFrom(selected));
  else if(selected?.link||selected?.url) playCandidate({url:selected.link||selected.url,type:"embed"});
}

function renderSeriesDetail(data){
  const seasons=extractSeasons(data);
  const box=$("#seriesSeasons");
  if(!seasons.length){
    $("#detailStatus").textContent="La API no devolvió temporadas/episodios reconocibles.";
    return;
  }
  $("#detailStatus").textContent="Selecciona un episodio.";
  box.innerHTML=`<div class="seasons"><h3>Temporadas</h3></div>`;
  const root=box.querySelector(".seasons");
  seasons.forEach((season,si)=>{
    const s=document.createElement("div");s.className="season";
    s.innerHTML=`<strong>Temporada ${esc(season.number||si+1)}</strong><div class="episodes"></div>`;
    const epBox=s.querySelector(".episodes");
    season.episodes.forEach((ep,ei)=>{
      const b=document.createElement("button");b.className="episode";
      b.textContent=`▶ ${ep.title||`Episodio ${ei+1}`}`;
      b.onclick=()=>playEpisode(ep);
      epBox.appendChild(b);
    });
    root.appendChild(s);
  });
}

function extractSeasons(data){
  const raw=arr(data,["seasons","temporadas"]);
  if(raw.length){
    return raw.map((s,i)=>({
      number:s?.number||s?.season_number||i+1,
      episodes:arr(s,["episodes","episodios","items"]).map(normalizeEpisode)
    })).filter(s=>s.episodes.length);
  }

  const rawEpisodes=arr(data,["episodes","episodios"]);
  if(rawEpisodes.length){
    const map=new Map();
    rawEpisodes.forEach((e,i)=>{
      const ep=normalizeEpisode(e);
      const n=ep.season||1;
      if(!map.has(n))map.set(n,[]);
      map.get(n).push(ep);
    });
    return [...map.entries()].map(([number,episodes])=>({number,episodes}));
  }

  // Algunas APIs pueden devolver una lista de capítulos directamente.
  const direct=arr(data,["chapters","chapters_list"]);
  if(direct.length) return [{number:1,episodes:direct.map(normalizeEpisode)}];

  return [];
}

function normalizeEpisode(e){
  return {
    title:e?.title||e?.name||e?.episode_title||`Episodio ${e?.episode_number||""}`.trim(),
    season:e?.season||e?.season_number||1,
    number:e?.episode||e?.episode_number||e?.number||"",
    url:e?.url||e?.link||e?.detailUrl||"",
    stream_url:e?.stream_url||e?.streamUrl||null,
    raw:e
  };
}

async function playEpisode(ep){
  if(ep.stream_url){await playStreamEndpoint(ep.stream_url);return}
  if(ep.url){
    try{
      const data=await getJSON(ep.url);
      const entries=videoEntries(data);
      const preferred=entries.find(s=>/vidhide/i.test(String(s?.name||s?.server||"")));
      const chosen=preferred||entries.find(s=>streamFrom(s))||entries[0];
      if(streamFrom(chosen)) return playStreamEndpoint(streamFrom(chosen));
      if(chosen?.link||chosen?.url) return playCandidate({url:chosen.link||chosen.url,type:"embed"});
      const direct=collect(data)[0];
      if(direct)return playCandidate(direct);
      throw new Error("No se encontró una fuente reproducible para el episodio.");
    }catch(e){openPlayer();pstatus("Error: "+e.message)}
    return;
  }
  pstatus("El episodio no tiene URL de reproducción.");
}

function collect(data){
  const out=[];
  const add=(url,type,priority=50)=>{
    if(typeof url!=="string")return;
    url=url.trim();
    if(!/^https?:\/\//i.test(url))return;
    if(!out.some(x=>x.url===url))out.push({url,type,priority});
  };

  // On mobile, proxy URLs and provider embeds are usually more reliable than
  // trying to load a third-party media file directly (CORS/referer restrictions).
  add(data?.proxy_url,"proxy_url",10);
  add(data?.proxyUrl,"proxy_url",10);
  add(data?.stream_url,"stream_url",30);

  for(const x of data?.embeds?.video||[]){
    add(x?.link||x?.url,"embed",state.mobile?15:40);
    add(streamFrom(x),"stream_url",35);
  }
  for(const x of data?.embeds||[]){
    add(x?.link||x?.url,"embed",state.mobile?15:40);
    add(streamFrom(x),"stream_url",35);
  }
  for(const x of data?.sources||[])add(x?.url||x?.src,"source",40);
  for(const x of data?.files||[])add(x?.url||x?.src,"file",45);
  for(const q of data?.qualities||[]){
    add(q?.proxy_url,"proxy_url",state.mobile?60:10);
    add(q?.proxyUrl,"proxy_url",state.mobile?60:10);
    const qu=q?.url;
    add(qu,"quality_url",state.mobile && isProviderPlayerUrl(qu||"")?5:40);
  }
  for(const x of data?.videos?.hls||[])add(x,"hls",state.mobile?50:35);

  // Si el endpoint entrega el reproductor .txt, en móvil es la opción
  // preferida porque el navegador ya demostró que no puede consumir esas
  // listas directamente como <video>.
  for(const c of out){
    if(state.mobile && isProviderPlayerUrl(c.url)){ c.priority=1; c.type="provider_player"; }
  }

  return out.sort((a,b)=>a.priority-b.priority);
}

async function playStreamEndpoint(endpoint){
  openPlayer();pstatus("Buscando automáticamente la fuente…");
  dlog("info","Consultando endpoint de reproducción",{endpoint});
  try{
    const data=await getJSON(endpoint);
    dlog("info","Endpoint respondió correctamente",{responseType:typeof data,keys:data&&typeof data==="object"?Object.keys(data):[]});
    const candidates=collect(data);
    dlog("info",`Se encontraron ${candidates.length} fuentes candidato`,{candidates:candidates.map(describeCandidate)});
    if(!candidates.length)throw new Error("El endpoint no devolvió fuentes.");
    let lastError=null;
    for(const c of candidates){
      try{dlog("info","Probando fuente",describeCandidate(c));await prepareCandidate(c);dlog("ok","Fuente preparada correctamente",describeCandidate(c));return}catch(e){lastError=e;dlog("warn","Falló una fuente; probando la siguiente",{candidate:describeCandidate(c),error:e?.message||String(e)})}
    }
    throw lastError||new Error("Ninguna fuente pudo reproducirse.");
  }catch(e){dlog("error","No se pudo preparar ninguna fuente",{error:e?.message||String(e)});pstatus("No se pudo reproducir: "+e.message);showPlayButton()}
}

function openPlayer(){
  resetDiag();
  $("#detailView").hidden=true;$("#playerView").hidden=false;destroy();
  $("#playButton").hidden=true;
}

function isHls(u){return /\.m3u8(?:$|[?#])/i.test(u)||u.includes("/streamproxy?")}

// Algunas fuentes del proveedor terminan en .txt aunque en realidad son
// reproductores/playlist que deben abrirse dentro de un iframe. En móviles
// el <video> intenta interpretarlas como media y Chrome devuelve código 4.
function isProviderPlayerUrl(u){
  return /mobilephoneaccess\.shop\/.*\/master\.txt(?:$|[?#])/i.test(u);
}

function showPlayButton(){
  const b=$("#playButton");
  const v=$("#video");
  if(!b)return;
  b.hidden=false;
  b.textContent="▶ Reproducir";
  b.onclick=async()=>{
    try{
      dlog("info","Usuario pulsó Reproducir",{src:v.currentSrc});
      await v.play();
      b.hidden=true;
      pstatus("Reproduciendo");
    }catch(e){
      dlog("error","El navegador rechazó el inicio de reproducción",{name:e?.name,message:e?.message,src:v.currentSrc});
      pstatus("El navegador no pudo iniciar el video. Toca el botón ▶ del reproductor.");
      try{v.focus()}catch{}
    }
  };
}

async function prepareCandidate(c){
  destroy();
  const u=c.url;
  if(!u) throw new Error("Fuente vacía");
  dlog("info","Preparando candidato",describeCandidate(c));

  // Algunas URLs .txt del proveedor son reproducibles mediante su propio
  // reproductor. En móvil deben abrirse como iframe, no como <video>.
  // Esto evita el MEDIA_ERR_SRC_NOT_SUPPORTED (código 4) que vimos en el
  // diagnóstico y permite que el segundo reproductor que sí funciona sea
  // el primero que se muestre en teléfonos.
  if(c.type==="embed" || isProviderPlayerUrl(u) || (!isHls(u) && !/\.(mp4|webm|mov)(?:$|[?#])/i.test(u))){
    pstatus(isProviderPlayerUrl(u) ? "Abriendo reproductor del proveedor…" : "Abriendo reproductor compatible…");
    const frame=$("#frame");
    frame.hidden=false;
    frame.src=u;
    frame.setAttribute("allow","autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write");
    frame.setAttribute("allowfullscreen","");
    frame.onload=()=>{pstatus("Reproductor cargado. Pulsa ▶ dentro del reproductor si aparece.");dlog("ok","El iframe terminó de cargar (esto NO garantiza que el proveedor permita reproducir)",{url:u})};
    // Give the iframe a moment; an inaccessible iframe is still reported rather
    // than leaving a blank black video element.
    setTimeout(()=>{ if(!frame.hidden && frame.src===u){pstatus("Reproductor cargado. Si no inicia, pulsa ▶ dentro del video.");dlog("warn","El iframe sigue cargado después de 1.2 s; el navegador no permite inspeccionar desde aquí si el proveedor bloqueó el video.",{url:u})} },1200);
    return;
  }

  const v=$("#video");
  v.hidden=false;
  v.controls=true;
  v.autoplay=false;
  v.muted=false;
  v.setAttribute("playsinline","");
  v.setAttribute("webkit-playsinline","");
  v.setAttribute("controlsList","nodownload");
  try{v.crossOrigin="anonymous";}catch{}

  if(isHls(u)){
    pstatus("Preparando video…");
    if(v.canPlayType("application/vnd.apple.mpegurl")){
      v.src=u;
      v.load();
      await waitForVideoReady(v,15000);
      pstatus("Video listo. Pulsa ▶ para reproducir.");
      showPlayButton();
      return;
    }
    if(!window.Hls||!Hls.isSupported())throw new Error("Este teléfono no puede reproducir HLS directamente.");
    await new Promise((resolve,reject)=>{
      const h=new Hls({
        enableWorker:true,
        lowLatencyMode:false,
        backBufferLength:30,
        maxBufferLength:45,
        maxMaxBufferLength:60,
        startLevel:-1,
        xhrSetup:(xhr)=>{try{xhr.withCredentials=false}catch{}}
      });
      state.hls=h;
      let finished=false;
      const fail=err=>{
        if(finished)return;
        finished=true;
        try{h.destroy()}catch{}
        state.hls=null;
        reject(err||new Error("HLS no pudo cargar la fuente"));
      };
      h.on(Hls.Events.MANIFEST_PARSED,(_,data)=>{
        dlog("ok","HLS: manifiesto cargado correctamente",{url:u,levels:data?.levels?.length});
        if(finished)return;
        finished=true;
        pstatus("Video listo. Pulsa ▶ para reproducir.");
        showPlayButton();
        resolve();
      });
      h.on(Hls.Events.ERROR,(_,d)=>{
        dlog(d?.fatal?"error":"warn","HLS reportó un error",{url:u,type:d?.type,details:d?.details,fatal:d?.fatal,response:d?.response?{code:d.response.code,text:d.response.text,url:d.response.url}:null});
        if(d?.fatal)fail(new Error(`HLS: ${d?.details||"error fatal"}${d?.response?.code?` HTTP ${d.response.code}`:""}`));
      });
      h.loadSource(u);
      h.attachMedia(v);
      setTimeout(()=>{if(!finished)fail(new Error("Tiempo de espera agotado al cargar el video."))},18000);
    });
    return;
  }

  v.src=u;
  v.load();
  await waitForVideoReady(v,15000);
  pstatus("Video listo. Pulsa ▶ para reproducir.");
  showPlayButton();
}

function waitForVideoReady(v,timeout){
  return new Promise((resolve,reject)=>{
    if(v.readyState>=2){resolve();return}
    let done=false;
    const cleanup=()=>{
      v.removeEventListener("loadedmetadata",ok);
      v.removeEventListener("canplay",ok);
      v.removeEventListener("error",fail);
      clearTimeout(timer);
    };
    const ok=()=>{if(done)return;done=true;cleanup();resolve()};
    const fail=()=>{if(done)return;done=true;cleanup();dlog("error","El elemento <video> no pudo cargar la fuente",{error:mediaErrorText(v.error),networkState:v.networkState,readyState:v.readyState,currentSrc:v.currentSrc});reject(new Error(`El video no pudo cargar: ${mediaErrorText(v.error)}`))};
    const timer=setTimeout(()=>fail(),timeout);
    v.addEventListener("loadedmetadata",ok);
    v.addEventListener("canplay",ok);
    v.addEventListener("error",fail);
  });
}

// Surface media errors instead of silently leaving a black player.
$("#video").addEventListener("error",()=>{
  const v=$("#video"),e=v.error;
  if(e){dlog("error","Evento error del elemento video",{error:mediaErrorText(e),currentSrc:v.currentSrc,networkState:v.networkState,readyState:v.readyState});pstatus(`No se pudo reproducir esta fuente (${mediaErrorText(e)}).`);}
});
$("#video").addEventListener("playing",()=>{$("#playButton").hidden=true;pstatus("Reproduciendo");dlog("ok","El video comenzó a reproducirse",{currentSrc:$("#video").currentSrc});});
$("#video").addEventListener("loadedmetadata",()=>dlog("info","Metadata del video cargada",{duration:$("#video").duration,videoWidth:$("#video").videoWidth,videoHeight:$("#video").videoHeight}));
$("#video").addEventListener("stalled",()=>dlog("warn","El navegador reportó stalled en el video",{currentSrc:$("#video").currentSrc}));
$("#video").addEventListener("waiting",()=>dlog("warn","El video está esperando datos",{currentTime:$("#video").currentTime}));


async function playCandidate(c){
  await prepareCandidate(c);
}

function destroy(){
  if(state.hls){state.hls.destroy();state.hls=null}
  const v=$("#video");v.pause();v.removeAttribute("src");v.load();v.hidden=false;
  $("#frame").src="";$("#frame").hidden=true;
}

function backCatalog(){destroy();$("#detailView").hidden=true;$("#playerView").hidden=true;$("#catalogView").hidden=false}
function backDetail(){destroy();$("#playerView").hidden=true;$("#detailView").hidden=false}

$("#back").onclick=backCatalog;
$("#backFromPlayer").onclick=backDetail;
$("#prev").onclick=()=>{if(state.page>1){state.page--;loadCatalog()}};
$("#next").onclick=()=>{state.page++;loadCatalog()};
document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{
  state.view=b.dataset.view;state.page=1;
  $("#pageTitle").textContent=state.view==="movies"?"Películas":"Series";
  document.querySelectorAll("[data-view]").forEach(x=>x.style.background=x===b?"#745cff":"#222638");
  loadCatalog();
});
loadCatalog();

$("#copyDebug")?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("#debug").textContent);dlog("ok","Diagnóstico copiado al portapapeles")}catch(e){dlog("warn","No se pudo copiar automáticamente; selecciona el texto manualmente")}});
window.addEventListener("online",()=>dlog("ok","Conexión recuperada"));
window.addEventListener("offline",()=>dlog("error","El dispositivo quedó sin conexión"));
