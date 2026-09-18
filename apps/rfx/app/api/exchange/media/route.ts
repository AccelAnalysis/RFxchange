import {createHash} from "node:crypto";
import {NextRequest} from "next/server";
import {organizationId} from "@/src/domain/organizations/model";
import {verifiedExternalVideo} from "@/src/domain/media/model";
import {getFirebaseAdminApp} from "@/src/infrastructure/firebase/admin";
import {getServerFirestore} from "@/src/infrastructure/firestore/runtime";
import {FirestoreOrganizationIntroductionMediaRepository,FirestorePublicMediaProjectionRepository} from "@/src/infrastructure/firestore/media-repositories";
import {FirestoreStoredAssetRepository} from "@/src/infrastructure/storage/firestore-stored-asset-repository";
import {FirebasePrivateObjectStore,firebaseStorageBucketFromEnvironment} from "@/src/infrastructure/storage/firebase-private-object-store";
import {AccessFailure,discoverOrganization,failure,json,participant} from "../server";
export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:NextRequest){
 try{
  const target=request.nextUrl.searchParams.get('organization')||'';
  const scope=await participant(request);
  await discoverOrganization(scope,target);
  const db=getServerFirestore();
  const intro=await new FirestoreOrganizationIntroductionMediaRepository(db).getPublishedByOrganizationId(organizationId(target));
  if(!intro||intro.organizationId!==target||intro.status!=='published'||!intro.publishedAt||intro.withdrawnAt)return json({video:null,poster:null});
  const base=`/api/exchange/media?organization=${encodeURIComponent(target)}`;
  const poster=intro.posterProjectionId?await new FirestorePublicMediaProjectionRepository(db).getById(intro.posterProjectionId):null;
  const validPoster=poster&&poster.status==='published'&&poster.publishedAt&&!poster.withdrawnAt&&poster.organizationId===target&&poster.kind==='organization-poster'?poster:null;
  const part=request.nextUrl.searchParams.get('part');
  const assets=new FirestoreStoredAssetRepository(db);
  const source=intro.source;
  const duration=source.kind==='linked-video'?source.video.durationSeconds:source.durationSeconds;
  if(!Number.isFinite(duration)||duration<=0||duration>30)throw new AccessFailure(404,'This introduction is unavailable.');
  const video=source.kind==='linked-video'
   ?{kind:'linked',url:verifiedExternalVideo(source.video).embedUrl,durationSeconds:duration}
   :{kind:'uploaded',url:`${base}&part=video`,durationSeconds:duration};
  if(!part)return json({video,poster:validPoster?`${base}&part=poster`:null});
  const assetId=part==='poster'?validPoster?.sourceAssetId:part==='video'&&source.kind==='uploaded-video'?source.assetId:null;
  if(!assetId)throw new AccessFailure(404,'This media is unavailable.');
  const asset=await assets.getById(assetId);
  const expectedHash=part==='poster'?validPoster!.sourceAssetSha256:source.kind==='uploaded-video'?source.assetSha256:null;
  const allowedTypes=part==='poster'?['image/jpeg','image/png','image/webp']:['video/mp4','video/webm'];
  const category=part==='poster'?'organization-media':'organization-intro-video';
  const maxBytes=part==='poster'?8*1024*1024:32*1024*1024;
  if(!asset||asset.organizationId!==target||asset.status!=='active'||asset.category!==category||!expectedHash||asset.sha256!==expectedHash||!allowedTypes.includes(asset.contentType)||asset.sizeBytes<=0||asset.sizeBytes>maxBytes)throw new AccessFailure(404,'This media is unavailable.');
  const object=await new FirebasePrivateObjectStore(getFirebaseAdminApp(),firebaseStorageBucketFromEnvironment()).get(asset.objectPath);
  if(object.contentType!==asset.contentType||object.bytes.byteLength!==asset.sizeBytes||createHash('sha256').update(object.bytes).digest('hex')!==expectedHash)throw new AccessFailure(503,'This media could not be verified.');
  const length=object.bytes.byteLength;
  const headers:Record<string,string>={'Content-Type':asset.contentType,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
  const range=request.headers.get('range');
  if(range){
   const match=/^bytes=(\d*)-(\d*)$/.exec(range);
   if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{...headers,'Content-Range':`bytes */${length}`}});
   const start=match[1]?Number(match[1]):Math.max(0,length-Number(match[2]));
   const end=match[1]&&match[2]?Math.min(length-1,Number(match[2])):length-1;
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=length||start>end)return new Response(null,{status:416,headers:{...headers,'Content-Range':`bytes */${length}`}});
   headers['Content-Range']=`bytes ${start}-${end}/${length}`;headers['Content-Length']=String(end-start+1);
   return new Response(new Uint8Array(object.bytes.slice(start,end+1)),{status:206,headers});
  }
  headers['Content-Length']=String(length);
  return new Response(new Uint8Array(object.bytes),{headers});
 }catch(error){return failure(error);}
}
