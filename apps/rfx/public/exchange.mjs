import {LENSES,routeState,routeQuery,queryKey,snapOffsets,chooseSnap,coordinate,safeVideo,MemoryCache} from './model.mjs';

const $=id=>document.getElementById(id);
const svg=name=>{const node=document.createElementNS('http://www.w3.org/2000/svg','svg');const use=document.createElementNS(node.namespaceURI,'use');use.setAttribute('href',`#i-${name}`);node.append(use);node.setAttribute('aria-hidden','true');return node;};
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const wide=matchMedia('(min-width:760px), (min-width:560px) and (max-height:500px)');
let state=routeState(location.search),viewer=null,config=null,records=[],map=null,home=null,boundaries=[];
let dataRequest=null,epoch=0,selected='',savedDetail=null,snap='partial',noticeTimer,activeMedia=null,auth=null,authModules=null;
const playingVisibility=new IntersectionObserver(entries=>{for(const entry of entries)if(!entry.isIntersecting&&entry.target===activeMedia){playingVisibility.unobserve(entry.target);pauseMedia();}},{threshold:.1});
let nextCursor=null,mediaObserver=null,mediaPending=0,mapStyle='streets',clusters=true;
const queryCache=new MemoryCache(),mediaCache=new MemoryCache(60000,60),lensStates=new Map(),scrolls=new Map(),cardNodes=new Map(),mediaQueue=[];
const stateKey=()=>viewer?`${viewer.id}:${viewer.membershipId}:${viewer.organizationId}`:'';
const api=async(url,options={})=>{const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});let body;try{body=await response.json();}catch{body={error:'The server returned an unreadable response.'};}if(!response.ok){const error=new Error(body.error||body.message||'The request could not be completed.');error.status=response.status;throw error;}return body;};
function notice(message){$('notice').textContent=message;$('notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').hidden=true,5000);}
function openDialog(id){pauseMedia();const dialog=$(id);if(!dialog.open)dialog.showModal();}
function setStatus(title,body,error=false,retry=false){const box=$('status');box.replaceChildren(el('h2','',title),el('p','',body));box.classList.toggle('error',error);box.hidden=false;if(retry){const button=el('button','secondary','Try again');button.onclick=()=>loadData(true);box.append(button);}}
function clearPrivateState(){epoch++;dataRequest?.abort();queryCache.clear();mediaCache.clear();mediaQueue.length=0;mediaObserver?.disconnect();pauseMedia();records=[];viewer=null;selected='';savedDetail=null;state.selected='';lensStates.clear();scrolls.clear();cardNodes.clear();$('result-list').replaceChildren();$('detail').replaceChildren();$('detail').hidden=true;$('result-list').hidden=false;$('result-count').hidden=true;$('load-more').hidden=true;home=null;boundaries=[];$('recenter').disabled=true;updateMap();}
function route(push=true){const href=`/?${routeQuery({...state,selected})}`;if(href!==location.pathname+location.search)history[push?'pushState':'replaceState']({},'',href);}
function updateNavigation(){for(const node of document.querySelectorAll('[data-lens]')){if(node.dataset.lens===state.lens)node.setAttribute('aria-current','page');else node.removeAttribute('aria-current');}$('lens-heading').textContent=LENSES[state.lens].title;$('query').placeholder=LENSES[state.lens].hint;$('query').value=state.q;$('filter-badge').hidden=!(state.deadline||state.watched||state.availability);}
function setLens(lens){if(lens===state.lens)return;lensStates.set(state.lens,{...state,selected:''});scrolls.set(state.lens,$('sheet-body').scrollTop);closeDetail(false);state=lensStates.get(lens)||{lens,q:'',deadline:'',watched:false,availability:'',selected:''};selected='';updateNavigation();route();loadData();}
async function loadData(force=false,append=false){
 const myEpoch=++epoch;dataRequest?.abort();dataRequest=new AbortController();const key=`${stateKey()}|${queryKey(state)}`;
 const cached=!force&&!append&&viewer?queryCache.get(key):null;
 if(cached){renderPayload(cached,false);return;}
 const params=new URLSearchParams(routeQuery({...state,selected}));if(append&&nextCursor)params.set('cursor',nextCursor);
 if(!append){pauseMedia();$('result-list').replaceChildren();$('detail').hidden=true;$('result-list').hidden=false;$('result-count').hidden=true;records=[];cardNodes.clear();updateMap();setStatus(`Loading ${LENSES[state.lens].title.toLowerCase()}…`,'Your map stays in place.');}
 $('load-more').disabled=true;
 try{
  const payload=await api(`/api/exchange?${params}`,{signal:dataRequest.signal});if(myEpoch!==epoch)return;
  const priorKey=stateKey();const nextKey=`${payload.viewer.id}:${payload.viewer.membershipId}:${payload.viewer.organizationId}`;
  if(priorKey&&priorKey!==nextKey){queryCache.clear();mediaCache.clear();lensStates.clear();scrolls.clear();selected='';savedDetail=null;}
  viewer=payload.viewer;const freshKey=`${stateKey()}|${queryKey(state)}`;
  if(!append)queryCache.set(freshKey,payload);
  renderPayload(payload,append);
 }catch(error){
  if(error.name==='AbortError'||myEpoch!==epoch)return;
  if(error.status===401){clearPrivateState();setStatus('Your Exchange is ready.','Sign in to discover and connect.');openDialog('signin');}
  else if(error.status===403){clearPrivateState();setStatus('Access needs attention.',error.message,true);const a=el('a','secondary','Review account setup');a.href=`${config.exchangeOrigin}/join`;$('status').append(a);}
  else setStatus('Unable to load results.',error.message,true,true);
 }finally{$('load-more').disabled=false;}
}
function renderPayload(payload,append){
 viewer=payload.viewer;const first=!home;home=payload.home;boundaries=payload.boundaries||[];
 $('recenter').disabled=!coordinate(home?.coordinate);$('geography-label').textContent=payload.geography.name;$('viewer-name').textContent=viewer.name;
 $('filter-geography').textContent=`Showing your authorized Exchange in ${payload.geography.name}.`;
 nextCursor=payload.nextCursor;records=append?[...records,...payload.items.filter(item=>!records.some(prior=>prior.id===item.id))]:payload.items;
 $('result-count').textContent=payload.total==null?`${records.length}${nextCursor?'+':''}`:String(payload.total);$('result-count').hidden=false;
 $('load-more').hidden=!nextCursor;
 if(!append){$('result-list').replaceChildren();cardNodes.clear();mediaObserver?.disconnect();}
 const added=append?payload.items:records;
 for(const record of added){if(cardNodes.has(record.id))continue;const card=renderCard(record);cardNodes.set(record.id,card);$('result-list').append(card);}
 if(records.length)$('status').hidden=true;else setStatus('No matching results.','Try another search or reset your filters.');
 updateMap();if(first&&map&&coordinate(home?.coordinate))map.jumpTo({center:home.coordinate,zoom:12});
 const intended=selected||state.selected;
 if(intended&&records.some(item=>item.id===intended))openDetail(intended,false);else {selected='';$('detail').hidden=true;$('result-list').hidden=false;requestAnimationFrame(()=>$('sheet-body').scrollTop=append?$('sheet-body').scrollTop:(scrolls.get(state.lens)||0));}
 buildMenu();
}
function renderCard(record){
 const card=el('article','result-card');card.dataset.recordId=record.id;
 if(record.kind==='organization')card.append(mediaArea(record));
 const open=el('button','card-open');open.type='button';open.setAttribute('aria-label',`View ${record.title}`);
 open.append(el('p','card-kicker',record.subtitle),el('h2','',record.title),el('p','card-location',record.location),el('p','card-summary',record.summary));open.onclick=()=>openDetail(record.id);
 const footer=el('div','card-footer'),tags=el('div','card-tags');for(const tag of record.tags.slice(0,3))tags.append(el('span','chip',tag));footer.append(tags);
 const select=el('button','',coordinate(record.coordinate)?'On map':'View');select.type='button';select.setAttribute('aria-label',coordinate(record.coordinate)?`Locate ${record.title} on the map`:`View ${record.title}`);
 select.onclick=()=>coordinate(record.coordinate)?selectRecord(record.id,true):openDetail(record.id);footer.append(select);card.append(open,footer);return card;
}
function selectRecord(id,pan=false){const item=records.find(record=>record.id===id);if(!item)return;selected=id;for(const [key,card] of cardNodes)card.classList.toggle('selected',key===id);updateMapSelection();
 if(pan&&map&&coordinate(item.coordinate))map.easeTo({center:item.coordinate,duration:reduced.matches?0:260});
 if(!pan){if(snap==='peek')setSnap('partial');const card=cardNodes.get(id);card?.scrollIntoView({block:'nearest',behavior:'auto'});card?.querySelector('.card-open')?.focus({preventScroll:true});}
}
function openDetail(id,push=true){const item=records.find(record=>record.id===id);if(!item)return;pauseMedia();if(!savedDetail)savedDetail={scroll:$('sheet-body').scrollTop,snap};selected=id;state.selected=id;selectRecord(id);
 const detail=$('detail');detail.replaceChildren();const back=el('button','detail-back','Back to results');back.prepend(svg('back'));back.onclick=()=>{closeDetail();};detail.append(back);
 if(item.kind==='organization')detail.append(mediaArea(item));detail.append(el('p','card-kicker',item.subtitle),el('h2','',item.title),el('p','muted',item.location),el('p','',item.summary));
 const facts=el('dl');for(const [label,value] of item.facts||[]){if(value){facts.append(el('dt','',label),el('dd','',value));}}detail.append(facts);
 if(item.kind==='opportunity'){
  const watch=el('button','secondary',item.watched?'Stop watching':'Watch RFx');watch.onclick=async()=>{watch.disabled=true;try{await api('/api/opportunities',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'set-watch',commandId:crypto.randomUUID(),reference:item.reference,watching:!item.watched})});item.watched=!item.watched;watch.textContent=item.watched?'Stop watching':'Watch RFx';queryCache.clear();}catch(e){if(e.status===401||e.status===403){clearPrivateState();openDialog('signin');}notice(e.message);}finally{watch.disabled=false;}};detail.append(watch);
 }
 try{const u=new URL(item.href);if(u.origin===config.exchangeOrigin){const action=el('a','primary',item.kind==='opportunity'?'Open response workspace':'Open full organization / resource workspace');action.href=u.href;detail.append(action,el('p','handoff-note','Continues in the existing RFxchange workspace.'));}}catch{}
 $('result-list').hidden=true;$('load-more').hidden=true;$('status').hidden=true;detail.hidden=false;
 if(!wide.matches)setSnap('expanded');$('sheet-body').scrollTop=0;detail.focus({preventScroll:true});if(push)route();
}
function closeDetail(push=true){pauseMedia();$('detail').hidden=true;$('result-list').hidden=false;$('load-more').hidden=!nextCursor;state.selected='';selected='';if(savedDetail){const saved=savedDetail;savedDetail=null;setSnap(saved.snap);requestAnimationFrame(()=>$('sheet-body').scrollTop=saved.scroll);}if(push)route();}
function pauseMedia(){if(activeMedia){playingVisibility.unobserve(activeMedia);if(activeMedia.tagName==='VIDEO')activeMedia.pause();activeMedia.remove();activeMedia=null;}}
function mediaArea(record){const area=el('div','card-media');area.append(el('span','media-monogram',record.title.split(/\s+/).slice(0,2).map(word=>word[0]||'').join('')));area.dataset.organization=record.organizationId;
 const cached=mediaCache.get(`${stateKey()}|${record.organizationId}`);if(cached)applyMedia(area,cached);else{mediaObserver??=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){mediaObserver.unobserve(entry.target);mediaQueue.push({area:entry.target,owner:stateKey()});drainMedia();}},{root:$('sheet-body'),threshold:.25});mediaObserver.observe(area);}return area;}
function drainMedia(){while(mediaPending<2&&mediaQueue.length){const task=mediaQueue.shift();if(!task.area.isConnected||task.owner!==stateKey())continue;mediaPending++;
 api(`/api/exchange/media?organization=${encodeURIComponent(task.area.dataset.organization)}`).then(value=>{if(task.owner!==stateKey())return;mediaCache.set(`${task.owner}|${task.area.dataset.organization}`,value);if(task.area.isConnected)applyMedia(task.area,value);}).catch(()=>{/* Optional media never blocks the card. */}).finally(()=>{mediaPending--;drainMedia();});}}
function applyMedia(area,info){if(info.poster&&info.poster.startsWith('/api/exchange/media?')){const image=el('img');image.src=info.poster;image.alt='';image.loading='lazy';image.decoding='async';area.append(image);}
 const video=safeVideo(info.video);if(!video)return;const play=el('button','video-play');play.type='button';play.setAttribute('aria-label',`Play organization introduction, ${Math.ceil(video.durationSeconds)} seconds`);play.append(svg('play'),el('span','',`Introduction · ${Math.ceil(video.durationSeconds)}s`));area.append(play);
 play.onclick=()=>{pauseMedia();if(video.kind==='uploaded'){
  const player=el('video');player.controls=true;player.playsInline=true;player.preload='none';player.src=video.url;player.setAttribute('aria-label','Organization introduction');area.append(player);activeMedia=player;playingVisibility.observe(player);
  player.onloadedmetadata=()=>{if(!Number.isFinite(player.duration)||player.duration>30.05){player.remove();activeMedia=null;notice('This introduction exceeds the 30-second limit.');}};
  player.onplay=()=>{if(activeMedia&&activeMedia!==player)pauseMedia();activeMedia=player;};player.onended=()=>{player.remove();activeMedia=null;};player.play().catch(()=>notice('Tap the video play control to start.'));
 }else{const player=el('iframe');const url=new URL(video.url);url.searchParams.set('autoplay','1');player.src=url.href;player.title='Organization introduction';player.allow='autoplay; fullscreen';player.referrerPolicy='no-referrer';player.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation');area.append(player);activeMedia=player;playingVisibility.observe(player);}
 };}
// Gesture state is local to this handle; only transform is written at animation-frame cadence.
let gesture=null,paintFrame=0;
function offsets(){return snapOffsets($('sheet').offsetHeight,innerHeight);}
function setSnap(next,animate=true){snap=next;$('sheet').dataset.snap=next;$('drag-handle').setAttribute('aria-expanded',String(next!=='peek'));if(!animate)$('sheet').dataset.dragging='true';$('sheet').style.setProperty('--sheet-offset',`${offsets()[next]}px`);if(!animate)requestAnimationFrame(()=>delete $('sheet').dataset.dragging);}
$('drag-handle').addEventListener('pointerdown',event=>{if(wide.matches||(event.pointerType==='mouse'&&event.button!==0))return;gesture={id:event.pointerId,start:event.clientY,last:event.clientY,time:performance.now(),velocity:0,bounds:offsets(),offset:offsets()[snap],next:offsets()[snap],moved:false};event.currentTarget.setPointerCapture(event.pointerId);$('sheet').dataset.dragging='true';pauseMedia();});
$('drag-handle').addEventListener('pointermove',event=>{if(!gesture||event.pointerId!==gesture.id)return;const now=performance.now();gesture.velocity=(event.clientY-gesture.last)/Math.max(1,now-gesture.time);gesture.last=event.clientY;gesture.time=now;const delta=event.clientY-gesture.start;gesture.moved||=Math.abs(delta)>5;gesture.next=Math.max(0,Math.min(gesture.bounds.peek,gesture.offset+delta));if(!paintFrame)paintFrame=requestAnimationFrame(()=>{paintFrame=0;if(gesture)$('sheet').style.setProperty('--sheet-offset',`${gesture.next}px`);});});
let suppressHandleClick=false;
function endDrag(event){if(!gesture||event.pointerId!==gesture.id)return;const g=gesture;gesture=null;cancelAnimationFrame(paintFrame);paintFrame=0;delete $('sheet').dataset.dragging;suppressHandleClick=g.moved;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);setSnap(event.type==='pointercancel'||event.type==='lostpointercapture'?snap:chooseSnap(g.next,g.velocity,offsets()));}
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('drag-handle').addEventListener(event,endDrag);
$('drag-handle').onclick=()=>{if(suppressHandleClick){suppressHandleClick=false;return;}setSnap(snap==='peek'?'partial':snap==='partial'?'expanded':'peek');};
$('drag-handle').onkeydown=event=>{const next=event.key==='ArrowUp'?(snap==='peek'?'partial':'expanded'):event.key==='ArrowDown'?(snap==='expanded'?'partial':'peek'):event.key==='Home'||event.key==='Escape'?'peek':event.key==='End'?'expanded':null;if(next){event.preventDefault();setSnap(next);}};
addEventListener('resize',()=>{if(!gesture)setSnap(snap,false);});wide.addEventListener('change',()=>{$('sheet').hidden=false;$('show-panel').hidden=true;setSnap(snap,false);map?.resize();});
$('panel-toggle').onclick=()=>{if(wide.matches){$('sheet').hidden=true;$('show-panel').hidden=false;}else setSnap('peek');};$('show-panel').onclick=()=>{$('sheet').hidden=false;$('show-panel').hidden=true;};
$('search-form').onsubmit=event=>{event.preventDefault();state.q=$('query').value.trim();state.selected='';selected='';savedDetail=null;scrolls.set(state.lens,0);route();loadData();$('query').blur();};
for(const node of document.querySelectorAll('[data-lens]'))node.onclick=()=>setLens(node.dataset.lens);
$('filter-toggle').onclick=()=>{const form=$('filters-form');form.elements.search.value=state.q;form.elements.deadline.value=state.deadline;form.elements.watched.checked=state.watched;form.elements.availability.value=state.availability;$('rfx-filters').hidden=state.lens!=='rfx';$('resource-filters').hidden=state.lens!=='resources';openDialog('filters');};
$('filters-form').onsubmit=event=>{event.preventDefault();const form=event.currentTarget;state={...state,q:form.elements.search.value.trim(),selected:'',deadline:state.lens==='rfx'?form.elements.deadline.value:'',watched:state.lens==='rfx'&&form.elements.watched.checked,availability:state.lens==='resources'?form.elements.availability.value:''};selected='';savedDetail=null;scrolls.set(state.lens,0);$('filters').close();updateNavigation();route();loadData();};
$('reset-filters').onclick=()=>{$('filters-form').reset();$('filters-form').elements.search.value='';};
$('map-toggle').onclick=()=>openDialog('map-options');$('menu-toggle').onclick=()=>openDialog('menu');
for(const button of document.querySelectorAll('[data-close]'))button.onclick=()=>button.closest('dialog').close();
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',event=>{if(dialog.id==='signin')return;const rect=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom))dialog.close();});
$('signin').addEventListener('cancel',event=>{if(!viewer)event.preventDefault();});
$('load-more').onclick=()=>loadData(true,true);
function buildMenu(){if(!config)return;const links=$('menu-links');links.replaceChildren();for(const [label,path] of [['My organization','/organization-profile'],['Members and account','/organization-profile'],['Notifications and communications','/account/communications'],['Referrals','/referrals'],['Membership','/acquisition/founding']]){const a=el('a','',label);a.href=new URL(path,config.exchangeOrigin).href;links.append(a);}}
async function loadAuth(){if(auth)return auth;if(!config?.configured)throw new Error('Sign-in is not configured on this preview yet.');
 const [app,modules]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js')]);authModules=modules;auth=modules.getAuth(app.initializeApp(config.firebase));return auth;}
$('signin-form').onsubmit=async event=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector('[type=submit]');button.disabled=true;$('signin-error').hidden=true;
 try{const csrfPromise=api('/api/auth/session').then(value=>({value}),error=>({error}));const firebaseAuth=await loadAuth();await authModules.signInWithEmailAndPassword(firebaseAuth,form.elements.email.value.trim(),form.elements.password.value);const [csrfResult,idToken]=await Promise.all([csrfPromise,firebaseAuth.currentUser.getIdToken(false)]);if(csrfResult.error)throw csrfResult.error;const csrf=csrfResult.value;
  const result=await api('/api/auth/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({csrfToken:csrf.csrfToken,idToken})});form.elements.password.value='';
  if(!result.state||!['controlled-platform','open-platform'].includes(result.state.lifecycleState)){location.assign(`${config.exchangeOrigin}/join`);return;}
  $('signin').close();await loadData(true);
 }catch(error){$('signin-error').hidden=false;$('signin-error').textContent=String(error.code||'').startsWith('auth/')?'Sign-in could not be completed. Check your email and password, then try again.':error.message;}finally{button.disabled=false;}};
$('signout').onclick=async()=>{clearPrivateState();$('menu').close();openDialog('signin');try{await api('/api/auth/session',{method:'DELETE'});if(auth)await authModules.signOut(auth);setStatus('Signed out.','Sign in to continue.');}catch(error){notice('Sign-out could not be confirmed. Please retry.');}};
addEventListener('popstate',()=>{pauseMedia();savedDetail=null;state=routeState(location.search);selected=state.selected;updateNavigation();loadData();});
addEventListener('pagehide',pauseMedia);
let hiddenAt=0;document.addEventListener('visibilitychange',()=>{if(document.hidden){hiddenAt=Date.now();pauseMedia();}else if(viewer&&Date.now()-hiddenAt>30000)loadData(true);});
function featureData(){return {type:'FeatureCollection',features:records.filter(item=>coordinate(item.coordinate)).map(item=>({type:'Feature',id:item.id,properties:{id:item.id,title:item.title},geometry:{type:'Point',coordinates:item.coordinate}}))};}
function installLayers(){if(!map||!map.isStyleLoaded())return;
 for(const id of ['rfx-selected','rfx-points','rfx-cluster-label','rfx-clusters','rfx-boundary'])if(map.getLayer(id))map.removeLayer(id);
 for(const id of ['rfx-records','rfx-area'])if(map.getSource(id))map.removeSource(id);
 map.addSource('rfx-records',{type:'geojson',data:featureData(),cluster:clusters,clusterMaxZoom:14,clusterRadius:44,promoteId:'id'});
 map.addSource('rfx-area',{type:'geojson',data:{type:'FeatureCollection',features:boundaries}});
 map.addLayer({id:'rfx-boundary',type:'line',source:'rfx-area',layout:{visibility:$('map-boundaries').checked?'visible':'none'},paint:{'line-color':'#2E5EAA','line-width':1.5,'line-opacity':.55}});
 map.addLayer({id:'rfx-clusters',type:'circle',source:'rfx-records',filter:['has','point_count'],paint:{'circle-radius':21,'circle-color':'#475467','circle-stroke-width':3,'circle-stroke-color':'#ffffff','circle-opacity':.92}});
 map.addLayer({id:'rfx-cluster-label',type:'symbol',source:'rfx-records',filter:['has','point_count'],layout:{'text-field':['get','point_count_abbreviated'],'text-size':12},paint:{'text-color':'#ffffff'}});
 map.addLayer({id:'rfx-points',type:'circle',source:'rfx-records',filter:['!', ['has','point_count']],paint:{'circle-radius':8,'circle-color':'#475467','circle-stroke-width':3,'circle-stroke-color':'#ffffff'}});
 map.addLayer({id:'rfx-selected',type:'circle',source:'rfx-records',filter:['==',['get','id'],selected||''],paint:{'circle-radius':12,'circle-color':'#2E5EAA','circle-stroke-width':3,'circle-stroke-color':'#ffffff'}});
}
function updateMap(){if(!map?.isStyleLoaded())return;const source=map.getSource('rfx-records');if(source)source.setData(featureData());else installLayers();map.getSource('rfx-area')?.setData({type:'FeatureCollection',features:boundaries});updateMapSelection();}
function updateMapSelection(){if(map?.getLayer('rfx-selected'))map.setFilter('rfx-selected',['==',['get','id'],selected||'']);}
async function startMap(){if(!config.mapboxToken){$('map-message').textContent='The map will appear when its access token is configured.';return;}
 try{if(!window.mapboxgl){const css=el('link');css.rel='stylesheet';css.href='https://api.mapbox.com/mapbox-gl-js/v3.25.0/mapbox-gl.css';document.head.append(css);await new Promise((resolve,reject)=>{const script=el('script');script.src='https://api.mapbox.com/mapbox-gl-js/v3.25.0/mapbox-gl.js';script.onload=resolve;script.onerror=reject;document.head.append(script);});}
  window.mapboxgl.accessToken=config.mapboxToken;
  map=new window.mapboxgl.Map({container:'map',style:'mapbox://styles/mapbox/light-v11',center:coordinate(home?.coordinate)||[-76.3,36.85],zoom:home?12:8.6,attributionControl:{compact:true},pitch:0,antialias:false});
  map.on('load',()=>{$('map-message')?.remove();});map.on('style.load',installLayers);
  map.on('click','rfx-points',event=>{const id=event.features?.[0]?.properties?.id;if(id)selectRecord(id,false);});
  map.on('click','rfx-clusters',async event=>{const feature=event.features?.[0];if(!feature)return;try{const zoom=await new Promise((resolve,reject)=>map.getSource('rfx-records').getClusterExpansionZoom(feature.properties.cluster_id,(error,value)=>error?reject(error):resolve(value)));map.easeTo({center:feature.geometry.coordinates,zoom,duration:reduced.matches?0:250});}catch{}});
  map.on('error',()=>notice('Some map imagery could not load. Your results are still available.'));
 }catch{notice('The map could not load. You can still browse the result cards.');}}
$('recenter').onclick=()=>{if(map&&coordinate(home?.coordinate))map.easeTo({center:home.coordinate,zoom:12,bearing:0,duration:reduced.matches?0:300});};
for(const button of document.querySelectorAll('[data-style]'))button.onclick=()=>{mapStyle=button.dataset.style;for(const item of document.querySelectorAll('[data-style]'))item.setAttribute('aria-pressed',String(item===button));map?.setStyle(mapStyle==='satellite'?'mapbox://styles/mapbox/satellite-streets-v12':'mapbox://styles/mapbox/light-v11');};
$('map-clusters').onchange=()=>{clusters=$('map-clusters').checked;installLayers();};$('map-boundaries').onchange=()=>{if(map?.getLayer('rfx-boundary'))map.setLayoutProperty('rfx-boundary','visibility',$('map-boundaries').checked?'visible':'none');};
$('map-pitch').onchange=()=>map?.easeTo({pitch:$('map-pitch').checked?45:0,duration:reduced.matches?0:240});$('north-up').onclick=()=>{map?.easeTo({pitch:0,bearing:0,duration:reduced.matches?0:240});$('map-pitch').checked=false;};
updateNavigation();setSnap('partial',false);
try{config=await api('/runtime-config.json');$('accelpo-link').href=config.purchasingOrigin;$('join-link').href=`${config.exchangeOrigin}/join`;buildMenu();startMap();await loadData();if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});}catch(error){setStatus('The Exchange is not ready yet.','Please try again shortly.',true,true);console.error('rfx-shell-start',error.message);}
