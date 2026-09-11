/* NETVISION CATALOG — catálogo, categorías, paginación y filtro */
'use strict';
(function(){
 const CACHE_KEY='netvision_catalog_cache_v4_pelisplushd';
 const CACHE_TTL=15*60*1000;
 const C={mode:'movies',page:1,items:[],hasNext:false,busy:false,totalPages:0,genre:'Todos',prefetching:false,prefetchPromise:null,genreList:[],query:'',loading:false,cacheComplete:false,searching:false};
 function setText(id,v){const e=NV.$(id);if(e)e.textContent=v||''}
 function readCache(mode){try{const all=JSON.parse(localStorage.getItem(CACHE_KEY)||'{}');const x=all?.[mode];if(!x||!Array.isArray(x.items)||!x.savedAt)return null;return x}catch{return null}}
 function writeCache(mode,data){try{const all=JSON.parse(localStorage.getItem(CACHE_KEY)||'{}');all[mode]=data;localStorage.setItem(CACHE_KEY,JSON.stringify(all))}catch(e){console.warn('[NETVISION] cache',e)}}
 function applyCache(mode,cached){if(!cached)return false;C.items=uniqueById(cached.items||[]);C.page=Number(cached.page)||1;C.hasNext=!!cached.hasNext;C.totalPages=Number(cached.totalPages)||0;C.genreList=Array.isArray(cached.genreList)?cached.genreList:[];C.cacheComplete=!!cached.complete;NV.state.catalogItems[mode]=C.items.slice();return C.items.length>0}
 function skeletons(count=12){const g=NV.$('#catalogGrid');if(!g)return;g.innerHTML=Array.from({length:count},()=>`<article class=\"catalog-card catalog-skeleton\"><div class=\"catalog-poster\"></div><div class=\"catalog-info\"><span></span><span></span></div></article>`).join('')}
 function placeholder(title){return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 750"><rect width="100%" height="100%" fill="#0a1220"/><text x="50%" y="50%" fill="#4388ff" font-size="32" text-anchor="middle" font-family="Arial">${title}</text></svg>`)}
 function itemGenres(item){return (item.genres||[]).map(g=>String(g).trim()).filter(Boolean)}
 function uniqueById(items){const seen=new Set();return items.filter(x=>{const id=String(x.id||'').trim().toLowerCase();const title=NV.norm(x.title||'');const year=String(x.year||'').trim();const k=id?`id:${id}`:`title:${title}|year:${year}`;if(seen.has(k))return false;seen.add(k);return true})}
 function renderGenres(){
   const box=NV.$('#catalogGenres');if(!box)return;
   const fromItems=C.items.flatMap(itemGenres);
   const all=[...new Set(['Todos',...C.genreList,...fromItems].map(x=>String(x).trim()).filter(Boolean))];
   box.innerHTML=all.map(g=>`<button class="genre-chip ${g===C.genre?'active':''}" data-genre="${NV.esc(g)}">${NV.esc(g)}</button>`).join('');
   NV.$$('#catalogGenres .genre-chip').forEach(b=>b.onclick=async()=>{C.genre=b.dataset.genre;renderGenres();renderItems();if(C.genre!=='Todos'&&!C.items.some(x=>itemGenres(x).some(g=>NV.norm(g)===NV.norm(C.genre)))){await prefetchAll();renderGenres();renderItems()}});
 }
 function visibleItems(){
   if(C.genre==='Todos')return C.items;
   const q=NV.norm(C.genre);return C.items.filter(x=>itemGenres(x).some(g=>NV.norm(g)===q||NV.norm(g).includes(q)||q.includes(NV.norm(g))));
 }
 function render(items=C.items){
   const g=NV.$('#catalogGrid');if(!g)return;g.innerHTML='';
   if(!items.length){g.innerHTML=`<div class="empty-catalog"><i class="fa-solid fa-film"></i><h2>No se encontró contenido</h2><p>Prueba otra categoría o actualiza el catálogo.</p><button id="retryCatalog" class="primary-btn">Reintentar</button></div>`;NV.$('#retryCatalog').onclick=()=>NVCatalog.load(C.mode);return}
   items.forEach(item=>{const c=document.createElement('article');c.className='catalog-card';const poster=item.image||item.banner||placeholder('NETVISION');const genres=itemGenres(item).slice(0,2).join(' · ');c.innerHTML=`<div class="catalog-poster"><img src="${NV.esc(poster)}" alt="${NV.esc(item.title)}" loading="lazy"><span class="rating">★ ${NV.esc(item.rating||'—')}</span><button class="play-card" aria-label="Reproducir"><i class="fa-solid fa-play"></i></button></div><div class="catalog-info"><h3 title="${NV.esc(item.title)}">${NV.esc(item.title)}</h3><span>${NV.esc(item.year||'')} · ${NV.esc(genres|| (C.mode==='movies'?'Película':'Serie'))}</span></div>`;c.onclick=()=>NV.openMedia(item,C.mode);c.querySelector('.play-card').onclick=e=>{e.stopPropagation();NV.openMedia(item,C.mode)};g.appendChild(c)})
 }
 function filteredBySearch(items){const q=NV.norm(C.query);if(!q)return items;return items.filter(x=>NV.norm([x.title,x.year,x.description,...itemGenres(x)].join(' ')).includes(q));}
 function renderItems(){const v=filteredBySearch(visibleItems());const label=C.mode==='movies'?'películas':'series';setText('#catalogStatus',`${v.length} ${label}${C.genre!=='Todos'?' en '+C.genre:''}${C.query?' · búsqueda: '+C.query:''}`);render(v);NV.$('#catalogMore')?.classList.toggle('hidden',!C.hasNext||C.genre!=='Todos'||!!C.query);NV.$('#catalogSearchClear')?.classList.toggle('hidden',!C.query)}
 async function prefetchNext(){
   if(C.prefetching||!C.hasNext)return;
   C.prefetching=true;
   try{
     const next=C.page+1,r=await NVApi.list(C.mode,next);
     if(!r.items?.length)return;
     C.items=uniqueById([...C.items,...r.items]);C.page=next;C.hasNext=!!r.hasNext;C.totalPages=r.totalPages||C.totalPages;
     NV.state.catalogItems[C.mode]=C.items.slice();renderGenres();
     if(C.genre==='Todos'&&!C.query)renderItems();
     writeCache(C.mode,{savedAt:Date.now(),items:C.items,page:C.page,hasNext:C.hasNext,totalPages:C.totalPages,genreList:C.genreList});
   }catch(e){console.warn('[NETVISION] prefetch next',e)}finally{C.prefetching=false}
 }
 async function prefetchAll(){
   if(C.prefetching)return C.prefetchPromise||Promise.resolve();
   C.prefetching=true;
   const started=performance.now();
   const batchSize=C.mode==='movies'?6:6;
   C.prefetchPromise=(async()=>{
     try{
       let next=C.page+1;
       let knownTotal=Number(C.totalPages)||0;
       let loadedPages=0;
       let noContentStreak=0;
       let failedBatchStreak=0;
       let lastPage=C.page;

       while(true){
         while(C.searching){await new Promise(resolve=>setTimeout(resolve,150));}
         const pages=Array.from({length:batchSize},(_,i)=>next+i);
         // Si algún proveedor reportó un total, seguimos hasta el MAYOR total
         // reportado por ambos; nunca usamos el total de un solo proveedor como fin.
         if(knownTotal) {
           const filtered=pages.filter(p=>p<=knownTotal);
           if(!filtered.length) break;
           pages.splice(0,pages.length,...filtered);
         }

         const results=await Promise.all(pages.map(async page=>{
           try{return await NVApi.list(C.mode,page)}catch(e){
             // Último intento a nivel de página. Un fallo simultáneo de ambos
             // proveedores no debe interpretarse como fin del catálogo.
             await new Promise(resolve=>setTimeout(resolve,700));
             try{return await NVApi.list(C.mode,page)}catch(err){
               return {items:[],hasNext:null,totalPages:0,page,errors:[err.message]};
             }
           }
         }));
         let got=0;
         let anyProviderNext=false;
         let maxPage=next;
         for(const r of results){
           if(r?.totalPages) knownTotal=Math.max(knownTotal,Number(r.totalPages)||0);
           if(r?.items?.length){got+=r.items.length;C.items=uniqueById([...C.items,...r.items]);}
           if(r?.hasNext) anyProviderNext=true;
           maxPage=Math.max(maxPage,Number(r?.page)||0,Number(r?.current)||0);
         }
         loadedPages+=pages.length;
         lastPage=Math.max(lastPage,maxPage);
         C.page=lastPage;
         C.totalPages=knownTotal||C.totalPages;
         C.hasNext=knownTotal ? C.page<knownTotal : anyProviderNext;
         noContentStreak=got?0:noContentStreak+1;
         failedBatchStreak=(got===0 && results.some(r=>Array.isArray(r?.errors)&&r.errors.length))?failedBatchStreak+1:0;
         NV.state.catalogItems[C.mode]=C.items.slice();

         if(!C.searching && (loadedPages===pages.length || loadedPages%12===0)){
           renderGenres();
           if(C.genre==='Todos'&&!C.query)renderItems();
         }
         if(loadedPages%12===0 || !C.hasNext){
           writeCache(C.mode,{savedAt:Date.now(),items:C.items,page:C.page,hasNext:C.hasNext,totalPages:C.totalPages,genreList:C.genreList});
         }

         const elapsed=((performance.now()-started)/1000).toFixed(1);
         const progress=knownTotal?`Página ${Math.min(C.page,knownTotal)}/${knownTotal}`:`Páginas procesadas: ${loadedPages}`;
         setText('#catalogStatus',`Construyendo catálogo doble con recuperación… ${C.items.length} títulos · ${progress} · ${elapsed}s`);

         if(!got && !anyProviderNext && failedBatchStreak>=2) break;
         if(!got && !anyProviderNext && !knownTotal && noContentStreak>=3) break;
         if(knownTotal && C.page>=knownTotal) break;
         if(!knownTotal && noContentStreak>=3) break;
         next=C.page+1;
       }

       const actuallyComplete=knownTotal ? C.page>=knownTotal : !C.hasNext;
       C.hasNext=!actuallyComplete;
       const elapsed=((performance.now()-started)/1000).toFixed(1);
       writeCache(C.mode,{savedAt:Date.now(),items:C.items,page:C.page,hasNext:C.hasNext,totalPages:C.totalPages,genreList:C.genreList,complete:actuallyComplete,providers:'PelisPlusHD'});
       renderGenres();renderItems();
       setText('#catalogStatus',actuallyComplete
         ? `${C.items.length} ${C.mode==='movies'?'películas':'series'} · catálogo doble completo · cargado en ${elapsed}s`
         : `${C.items.length} ${C.mode==='movies'?'películas':'series'} · carga doble parcial · página ${C.page}/${C.totalPages||'?'} · ${elapsed}s`);
     }catch(e){
       console.warn('[NETVISION] construcción del catálogo doble',e);
       setText('#catalogStatus',`Carga parcial: ${C.items.length} títulos disponibles`);
     }finally{C.prefetching=false;C.prefetchPromise=null;}
   })();
   return C.prefetchPromise;
 }
 async function globalSearch(query){
   const wanted=NV.norm(query);
   if(!wanted)return [];

   const local=filteredBySearch(C.items);
   if(local.length)return local;

   C.searching=true;
   // MODO BÚSQUEDA: no descargamos el catálogo completo. Recorremos páginas
   // en bloques grandes y detenemos la operación en cuanto aparece una coincidencia.
   // Como NVApi.list comparte promesas por página, una página que ya esté en vuelo
   // por el precargador no se solicita dos veces.
   const batchSize=C.mode==='movies'?24:16;
   let nextPage=1;
   let knownTotal=Number(C.totalPages)||0;
   let scanned=0;

   try{
     while(true){
       const pages=Array.from({length:batchSize},(_,i)=>nextPage+i)
         .filter(p=>!knownTotal || p<=knownTotal);
       if(!pages.length)break;

       setText('#catalogStatus',`Buscando “${query}”… revisando ${scanned.toLocaleString()} títulos · la carga del catálogo está en pausa`);
       const results=await Promise.all(pages.map(page=>NVApi.list(C.mode,page).catch(()=>null)));
       let valid=0;
       let ended=false;

       for(const r of results){
         if(!r?.items?.length)continue;
         valid++;
         if(r.totalPages)knownTotal=Math.max(knownTotal,Number(r.totalPages)||0);
         if(r.hasNext===false)ended=true;
         C.items=uniqueById([...C.items,...r.items]);
         scanned+=r.items.length;
       }

       C.totalPages=knownTotal||C.totalPages;
       C.page=Math.max(C.page,...pages);
       C.hasNext=knownTotal ? C.page<knownTotal : !ended;
       NV.state.catalogItems[C.mode]=C.items.slice();

       const found=filteredBySearch(C.items);
       setText('#catalogStatus',found.length
         ? `${found.length} resultados encontrados · búsqueda: ${query}`
         : `Buscando “${query}”… ${scanned.toLocaleString()} títulos revisados`);

       if(found.length){
         // Mostramos inmediatamente lo encontrado, pero NO terminamos la
         // búsqueda: una franquicia puede estar repartida en muchas páginas.
         // La interfaz recibe resultados progresivamente mientras seguimos
         // revisando el catálogo.
         C.query=query;
         renderGenres();
         renderItems();
         writeCache(C.mode,{savedAt:Date.now(),items:C.items,page:C.page,hasNext:C.hasNext,totalPages:C.totalPages,genreList:C.genreList});
       }
       if(!valid || ended || (knownTotal && C.page>=knownTotal))break;
       nextPage=Math.max(nextPage+batchSize,C.page+1);
     }
     const finalResults=filteredBySearch(C.items);
     writeCache(C.mode,{savedAt:Date.now(),items:C.items,page:C.page,hasNext:C.hasNext,totalPages:C.totalPages,genreList:C.genreList});
     return finalResults;
   }finally{
     C.searching=false;
   }
 }
 let searchSeq=0;
 async function runCatalogSearch(value){
   C.query=String(value||'').trim();renderGenres();renderItems();
   if(!C.query){return}
   const seq=++searchSeq;
   const local=filteredBySearch(visibleItems());
   if(local.length)return;
   setText('#catalogStatus','Buscando en todo el catálogo…');
   NV.$('#catalogLoading')?.classList.remove('hidden');
   try{
     const found=await globalSearch(C.query);
     if(seq!==searchSeq)return;
     renderGenres();
     const v=filteredBySearch(visibleItems());
     setText('#catalogStatus',v.length?`${v.length} ${C.mode==='movies'?'películas':'series'} encontradas · búsqueda: ${C.query}`:`No encontramos “${C.query}” en el catálogo disponible.`);
     render(v);
     NV.$('#catalogMore')?.classList.add('hidden');
   }finally{
     NV.$('#catalogLoading')?.classList.add('hidden');
   }
 }
 NV.$('#catalogSearch')?.addEventListener('input',e=>{clearTimeout(NV.$('#catalogSearch')._t);NV.$('#catalogSearch')._t=setTimeout(()=>runCatalogSearch(e.target.value),400)});
 NV.$('#catalogSearchClear')?.addEventListener('click',()=>{if(NV.$('#catalogSearch')){NV.$('#catalogSearch').value='';runCatalogSearch('');NV.$('#catalogSearch').focus()}});
 window.NVCatalog={
   ...C,
   async load(mode){
     C.mode=mode;C.page=1;C.items=[];C.hasNext=false;C.genre='Todos';C.totalPages=0;C.genreList=[];C.query='';C.loading=true;C.cacheComplete=false;
     setText('#catalogTitle',mode==='movies'?'Películas':'Series');setText('#catalogEyebrow',mode==='movies'?'PELÍCULAS':'SERIES');setText('#catalogSubtitle',mode==='movies'?'Explora películas por categoría.':'Explora series por categoría, temporadas y episodios.');
     NV.$('#catalogGenres').innerHTML='';if(NV.$('#catalogSearch'))NV.$('#catalogSearch').value='';
     const cached=readCache(mode);
     const freshEnough=cached && (Date.now()-Number(cached.savedAt||0)<CACHE_TTL);
     if(applyCache(mode,cached)){
       renderGenres();renderItems();NV.hide('#catalogLoading');setText('#catalogStatus',`${C.items.length} ${mode==='movies'?'películas':'series'} · cargado desde caché`);
     }else{
       NV.show('#catalogLoading');skeletons();setText('#catalogStatus',`Cargando ${mode==='movies'?'películas':'series'}…`);
     }
     try{
       const r=await NVApi.list(mode,1);
       if(r.items?.length){
         C.items=uniqueById(r.items);C.page=1;C.hasNext=!!r.hasNext;C.totalPages=r.totalPages||0;NV.state.catalogItems[mode]=C.items.slice();
         renderGenres();renderItems();
         writeCache(mode,{savedAt:Date.now(),items:C.items,page:C.page,hasNext:C.hasNext,totalPages:C.totalPages,genreList:C.genreList});
         NV.hide('#catalogLoading');
         // PRUEBA DE CATÁLOGO COMPLETO: después de mostrar la primera página,
         // seguimos cargando todas las páginas de la API en segundo plano.
         if(C.hasNext && !C.cacheComplete && !C.query) prefetchAll();
       }else if(!C.items.length){
         throw new Error(r.errors?.join(' | ')||'Sin contenido');
       }
       // Las categorías no bloquean la aparición del catálogo.
       NVApi.genres().then(gs=>{
         C.genreList=(gs||[]).map(x=>typeof x==='string'?x:(x?.name||x?.title||x?.genre||'')).filter(Boolean);
         renderGenres();
         writeCache(mode,{savedAt:Date.now(),items:C.items,page:C.page,hasNext:C.hasNext,totalPages:C.totalPages,genreList:C.genreList});
       }).catch(()=>{});
     }catch(e){
       if(!C.items.length){setText('#catalogStatus','No pudimos cargar el contenido');render([]);NV.toast('No se pudo cargar el catálogo')}
       else NV.toast('Mostrando contenido guardado; no se pudo actualizar ahora.');
     }finally{C.loading=false;NV.hide('#catalogLoading')}
   },
      async more(){
     if(C.busy||!C.hasNext)return;C.busy=true;NV.show('#catalogLoading');
     try{const r=await NVApi.list(C.mode,C.page+1);C.items=uniqueById([...C.items,...(r.items||[])]);C.page++;C.hasNext=!!r.hasNext;NV.state.catalogItems[C.mode]=C.items.slice();renderGenres();renderItems()}finally{C.busy=false;NV.hide('#catalogLoading')}
   },
   get items(){return C.items},
   get mode(){return C.mode}
 };
 NV.$('#catalogMore')?.addEventListener('click',()=>NVCatalog.more());
})();
