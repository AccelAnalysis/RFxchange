import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { visibleImplementedAdminRuntimeDestinations } from "@/src/application/admin/portal-navigation";
import { AdminDomainWorkspace } from "@/src/components/admin/AdminDomainWorkspace";
import { AdminPortalShell } from "@/src/components/admin/AdminPortalShell";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { resolveAdminRoute } from "@/src/infrastructure/auth/admin-route-runtime";
import { loadAdminDomainSurface } from "@/src/infrastructure/admin/domain-operations-runtime";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { requireCataloguedAdminPermission } from "@/src/domain/admin-authorization/model";

function first(value:string|string[]|undefined):string{return typeof value==="string"?value.trim():Array.isArray(value)?value[0]?.trim()??"":"";}

export default async function Page({searchParams}:Readonly<{searchParams?:Promise<Readonly<Record<string,string|string[]|undefined>>>}>){
  const params=searchParams?await searchParams:{};const query=first(params.q);const status=first(params.status);
  const cookieStore=await cookies();const sessionCookie=cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  const access=await resolveAdminRoute({sessionCookie,permission:"provider.seed.promote",scope:"GLOBAL",access:"write"});
  const returnTo=encodeURIComponent("/admin/data-promotion");
  if(access.kind==="unauthenticated")redirect(`/signin?returnTo=${returnTo}`);
  if(access.kind==="privileged-access-denied"&&access.reason==="recent-reauthentication-required")redirect(`/signin?returnTo=${returnTo}`);
  if(access.kind!=="authorized")notFound();
  const data=await loadAdminDomainSurface({db:getServerFirestore(),key:"data-promotion",scope:access.scope,permissions:Object.freeze([requireCataloguedAdminPermission("provider.seed.promote")]),query:query||null,status:status||null});
  const destinations=visibleImplementedAdminRuntimeDestinations(access.authority,access.grants,new Date().toISOString());
  return <AdminPortalShell destinations={destinations} currentDestination="resource-providers" currentScope={access.scope.value}><AdminDomainWorkspace data={data} query={query} status={status} selectedId={first(params.selected)||null} currentPath="/admin/data-promotion"/></AdminPortalShell>;
}
