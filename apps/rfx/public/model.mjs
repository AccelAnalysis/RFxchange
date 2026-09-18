export const LENSES = Object.freeze({
 rfx:{title:'RFx',hint:'Search RFx or capabilities'},
 resources:{title:'Resources',hint:'Search resources or organizations'},
 intelligence:{title:'Intelligence',hint:'Search organizations or capabilities'},
 capabilities:{title:'Capabilities',hint:'Search organizations or capabilities'}
});
export const validLens = value => Object.hasOwn(LENSES, value) ? value : 'rfx';
export function routeState(search='') {
 const p = new URLSearchParams(search);
 return {lens:validLens(p.get('lens')),q:(p.get('q')||'').slice(0,120),selected:(p.get('selected')||'').slice(0,200),deadline:p.get('deadline')||'',watched:p.get('watched')==='true',availability:p.get('availability')||''};
}
export function routeQuery(state) {
 const p=new URLSearchParams({lens:validLens(state.lens)});
 for(const key of ['q','selected','deadline','availability']) if(state[key]) p.set(key,state[key]);
 if(state.watched) p.set('watched','true');
 return p.toString();
}
export function queryKey(state) {const {selected,...query}=state;return routeQuery({...query,selected:''});}
export function snapOffsets(height,viewport) {
 const partial=Math.min(height,Math.max(150,viewport*.42));
 return {expanded:0,partial:Math.max(0,height-partial),peek:Math.max(0,height-104)};
}
export function chooseSnap(offset,velocity,offsets) {
 const projected=offset+Math.max(-180,Math.min(180,velocity*160));
 return Object.keys(offsets).reduce((a,b)=>Math.abs(offsets[a]-projected)<=Math.abs(offsets[b]-projected)?a:b);
}
export function coordinate(value) {return Array.isArray(value)&&value.length===2&&value.every(Number.isFinite)&&Math.abs(value[0])<=180&&Math.abs(value[1])<=90?value:null;}
export function safeVideo(value) {
 if(!value||!Number.isFinite(value.durationSeconds)||value.durationSeconds<=0||value.durationSeconds>30)return null;
 if(value.kind==='uploaded'&&typeof value.url==='string'&&value.url.startsWith('/api/exchange/media?'))return value;
 if(value.kind==='linked'){
  try{const u=new URL(value.url);if(u.protocol!=='https:'||u.username||u.password)return null;
   if(u.port||u.search||u.hash)return null;
   if(u.hostname==='www.youtube-nocookie.com'&&/^\/embed\/[A-Za-z0-9_-]{11}$/.test(u.pathname))return value;
   if(u.hostname==='player.vimeo.com'&&/^\/video\/\d+$/.test(u.pathname))return value;
  }catch{}
 }
 return null;
}
export class MemoryCache {
 #values=new Map();
 constructor(ttl=30000,limit=12,clock=Date.now){this.ttl=ttl;this.limit=limit;this.clock=clock;}
 get(key){const item=this.#values.get(key);if(!item||this.clock()-item.time>this.ttl){this.#values.delete(key);return null;}return item.value;}
 set(key,value){this.#values.delete(key);this.#values.set(key,{value,time:this.clock()});while(this.#values.size>this.limit)this.#values.delete(this.#values.keys().next().value);}
 clear(){this.#values.clear();}
}
