import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {RFXCHANGE_SESSION_COOKIE_NAME,resolveParticipantRoute} from "@/src/infrastructure/auth/participant-route-runtime";
import {loadAuthorizedParticipantMapProjection} from "@/src/infrastructure/geography/participant-map-runtime";
import {loadAuthorizedNetworkDiscovery} from "@/src/infrastructure/network-discovery/runtime";
import type {NetworkDiscoveryOrganization} from "@/src/application/network-discovery/network-discovery";

export const legacyOrigin = () => process.env.RFXCHANGE_LEGACY_EXCHANGE_ORIGIN || "https://rfxchange--rfxchange.us-east4.hosted.app";
export function json(value:unknown,status=200){return NextResponse.json(value,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});}
export class AccessFailure extends Error {constructor(readonly status:number,readonly participantMessage:string){super(participantMessage);}}
export async function participant(request:NextRequest){
 const access=await resolveParticipantRoute({sessionCookie:request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value});
 if(access.kind==='unauthenticated')throw new AccessFailure(401,'Sign in to view your Exchange.');
 if(access.kind!=='authorized')throw new AccessFailure(403,'Your account needs attention before you can enter this Exchange.');
 const map=await loadAuthorizedParticipantMapProjection(access);
 if(!map)throw new AccessFailure(503,'Your map is temporarily unavailable. Please try again.');
 return {access,map};
}
export function failure(error:unknown){
 if(error instanceof AccessFailure)return json({error:error.participantMessage},error.status);
 console.error('rfx-parallel-request-failed',error instanceof Error?error.name:'UnknownError');
 return json({error:'The Exchange could not load this information. Please try again.'},503);
}
export type Card=Readonly<{
 id:string;kind:'organization'|'opportunity'|'resource';organizationId?:string;title:string;subtitle:string;summary:string;
 location:string;coordinate:readonly [number,number]|null;tags:readonly string[];facts:readonly [string,string][];
 href:string;watched?:boolean;reference?:string;
}>;
export function organizationCard(org:NetworkDiscoveryOrganization):Card{
 const capabilities=org.capabilities.length?org.capabilities.map(c=>c.label):org.profile.capabilities.map(c=>c.name);
 const orgId=String(org.organizationId);
 return {id:`organization:${orgId}`,kind:'organization',organizationId:orgId,title:org.profile.displayName,
 subtitle:'Organization',summary:capabilities.join(' · '),location:org.profile.location.localityName,
 coordinate:org.marker.coordinate,tags:capabilities.slice(0,4),facts:[
  ['Location',org.marker.accessibleLocationLabel],['Capabilities',capabilities.join(' · ')],
  ...(org.profile.mainContact?[["Contact",`${org.profile.mainContact.displayName} · ${org.profile.mainContact.email}`] as [string,string]]:[])
 ],href:`${legacyOrigin()}/geography/canvas?selectedOrganization=${encodeURIComponent(orgId)}`};
}
export async function discoverOrganization(scope:Awaited<ReturnType<typeof participant>>,target:string){
 if(!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(target))throw new AccessFailure(400,'Organization identifier is invalid.');
 const discovery=await loadAuthorizedNetworkDiscovery({access:scope.access,mapProjection:scope.map,focusedOrganizationId:target});
 if(!discovery.available||!discovery.projection.organizations.some(org=>String(org.organizationId)===target))throw new AccessFailure(404,'This organization is not available in your Exchange.');
}
