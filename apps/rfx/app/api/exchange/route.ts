import {NextRequest} from "next/server";
import {loadAuthorizedNetworkDiscovery} from "@/src/infrastructure/network-discovery/runtime";
import {loadAuthorizedResourceDiscovery} from "@/src/infrastructure/resource-network/discovery-runtime";
import {createServerOpportunityDiscoveryService} from "@/src/infrastructure/rfx/opportunity-discovery-runtime";
import {AccessFailure,failure,json,legacyOrigin,organizationCard,participant,type Card} from "./server";
export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:NextRequest){
 try{
  const p=request.nextUrl.searchParams;
  const lens=p.get('lens')||'rfx';
  if(!['rfx','resources','intelligence','capabilities'].includes(lens))return json({error:'Unknown Exchange lens.'},400);
  const q=(p.get('q')||'').trim();
  if(q.length>120||(p.get('cursor')||'').length>2048)return json({error:'Search is too long.'},400);
  const scope=await participant(request);
  const {access,map}=scope;
  const organizationId=String(access.membership.organizationId);
  const geographyId=String(map.model.selectedGeography.id);
  let items:Card[]=[];let nextCursor:string|null=null;let total:number|null=null;
  if(lens==='rfx'){
   if(access.state.lifecycleState!=='open-platform')throw new AccessFailure(403,'RFx becomes available when your organization setup is complete.');
   const result=await createServerOpportunityDiscoveryService().discover({organizationId:access.membership.organizationId,userId:access.context.user.id,membershipId:access.membership.id},{text:q,localityIds:[geographyId],deadlineWindow:p.get('deadline'),watched:p.get('watched')==='true'?true:null,cursor:p.get('cursor')});
   items=result.items.map(item=>({id:`opportunity:${item.reference}`,reference:item.reference,kind:'opportunity',title:item.title,
    subtitle:item.issuerDisplayName,summary:item.summary,location:item.localities.map(x=>x.label).join(', '),
    coordinate:null,tags:[item.requestFamilyLabel],facts:[['Buyer',item.issuerDisplayName],['Response deadline',item.responseDeadline],['Request family',item.requestFamilyLabel]],
    watched:item.watched,href:`${legacyOrigin()}/opportunities/${encodeURIComponent(item.reference)}`}));
   nextCursor=result.nextCursor;
  }else if(lens==='resources'){
   const network=await loadAuthorizedNetworkDiscovery({access,mapProjection:map});
   const markers=network.available?network.projection.organizations.map(org=>({organizationId:String(org.organizationId),marker:{id:org.marker.id,coordinate:org.marker.coordinate,accessibleLocationLabel:org.marker.accessibleLocationLabel}})):[];
   const result=await loadAuthorizedResourceDiscovery({access,mapProjection:map,query:q,availability:p.get('availability'),markers});
   if(!result.available)throw new AccessFailure(403,'Resources are not available for this organization or geography.');
   const providers=new Map(result.projection.providers.map(provider=>[String(provider.organizationId),provider]));
   items=result.projection.resources.map(item=>({id:`resource:${item.id}`,kind:'resource',organizationId:String(item.organizationId),title:item.title,
    subtitle:item.providerDisplayName,summary:item.summary,location:map.model.selectedGeography.name,
    coordinate:providers.get(String(item.organizationId))?.marker?.coordinate??null,tags:[],facts:[['Overview',item.description],['Eligibility',item.eligibility]],
    href:`${legacyOrigin()}/resources?resource=${encodeURIComponent(item.id)}`}));
   // Published provider entries remain useful when the provider has no separate resource record.
   for(const provider of result.projection.providers){
    if(items.some(item=>item.organizationId===String(provider.organizationId)))continue;
    items.push({id:`provider:${provider.organizationId}`,kind:'resource',organizationId:String(provider.organizationId),title:provider.displayName,subtitle:'Resource provider',summary:provider.services.map(s=>s.name).join(' · '),location:provider.territory.name,coordinate:provider.marker?.coordinate??null,tags:[...provider.categories].slice(0,4),facts:[['Eligibility',provider.eligibility],['Availability',provider.availability]],href:`${legacyOrigin()}/resources?provider=${encodeURIComponent(provider.organizationId)}`});
   }
   // Public locality listings are already released/filtered by the shared catalog runtime.
   for(const item of result.projection.listings){
    items.push({id:`listing:${item.id}`,kind:'resource',title:item.name,subtitle:item.service,summary:item.summary,location:item.locality||map.model.selectedGeography.name,coordinate:item.coordinate,tags:[],facts:[['Service',item.service],['Address',item.address||'']],href:`${legacyOrigin()}/resources?resource=${encodeURIComponent(item.id)}`});
   }
   total=items.length;
  }else{
   const result=await loadAuthorizedNetworkDiscovery({access,mapProjection:map,capability:q,page:p.get('cursor')||'1',focusedOrganizationId:p.get('selected')?.startsWith('organization:')?p.get('selected')!.slice(13):null});
   if(!result.available)throw new AccessFailure(403,'Organization discovery is not available for this geography.');
   items=result.projection.organizations.map(organizationCard);
   total=result.projection.totalMatched;
   nextCursor=result.projection.hasNextPage?String(result.projection.page+1):null;
  }
  return json({viewer:{id:String(access.context.user.id),membershipId:String(access.membership.id),organizationId,name:map.homeMarker.label},
   geography:{id:geographyId,name:map.model.selectedGeography.name},home:map.homeMarker,
   boundaries:map.model.features.map(feature=>({type:'Feature',properties:{role:feature.role},geometry:feature.boundary.geometry})),
   items,nextCursor,total,lens,loadedAt:new Date().toISOString()});
 }catch(error){return failure(error);}
}
