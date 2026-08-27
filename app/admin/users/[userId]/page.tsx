import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { buildUserAccess360 } from "@/src/application/admin/user-access-360";
import { AdminPortalShell } from "@/src/components/admin/AdminPortalShell";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { resolveAdminPortalAccess } from "@/src/infrastructure/auth/admin-route-runtime";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import {
  FirestoreOrganizationMembershipRepository,
  FirestoreOrganizationProfileRepository,
  FirestoreOrganizationUserAuthorizationRepository,
  FirestoreUserIdentityRepository,
} from "@/src/infrastructure/firestore/repositories";
import type { OrganizationProfileId } from "@/src/domain/organizations/model";
import { requireCataloguedAdminPermission } from "@/src/domain/admin-authorization/model";
import styles from "@/src/components/admin/AdminDomainWorkspace.module.css";

export default async function Page({params}:Readonly<{params:Promise<{userId:string}>}>){
  const {userId}=await params; const cookieStore=await cookies(); const sessionCookie=cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  const access=await resolveAdminPortalAccess({sessionCookie}); const returnTo=encodeURIComponent(`/admin/users/${userId}`);
  if(access.kind==="unauthenticated")redirect(`/signin?returnTo=${returnTo}`);
  if(access.kind==="privileged-access-denied"&&access.reason==="recent-reauthentication-required")redirect(`/signin?returnTo=${returnTo}`);
  if(access.kind!=="authorized")notFound();
  const effectivePermissions=access.authority.effectivePermissions.map(requireCataloguedAdminPermission);
  if(!effectivePermissions.includes(requireCataloguedAdminPermission("user.profile.read"))||!effectivePermissions.includes(requireCataloguedAdminPermission("user.access.read")))notFound();
  const destinations=access.destinations.filter((candidate)=>candidate.key==="users-access"); if(!destinations.length)notFound();
  const db=getServerFirestore(); const users=new FirestoreUserIdentityRepository(db); const membershipsRepo=new FirestoreOrganizationMembershipRepository(db); const authRepo=new FirestoreOrganizationUserAuthorizationRepository(db); const profilesRepo=new FirestoreOrganizationProfileRepository(db);
  const user=await users.getById(userId as Parameters<typeof users.getById>[0]); if(!user)notFound();
  const memberships=await membershipsRepo.listByUserId(user.id); const authorizations=await authRepo.listByUserId(user.id);
  const allowed=destinations.find((destination)=>destination.scope.kind==="GLOBAL")??destinations.find((destination)=>destination.scope.kind==="ORGANIZATION"&&memberships.some((membership)=>String(membership.organizationId)===String(destination.scope.kind==="ORGANIZATION"?destination.scope.targetId:""))); if(!allowed)notFound();
  const profiles=(await Promise.all(memberships.map(async(membership)=>{const snapshot=await db.collection("organizationProfiles").where("organizationId","==",membership.organizationId).limit(1).get();const id=snapshot.docs[0]?.id;return id?profilesRepo.getById(id as OrganizationProfileId):null;}))).filter((value):value is NonNullable<typeof value>=>value!==null);
  const projection=buildUserAccess360(access.authority,{user,memberships,organizationAuthorizations:authorizations,organizationProfiles:profiles,lastLoginAt:null});
  return <AdminPortalShell destinations={access.destinations} currentDestination="users-access" currentScope={allowed.scope.value}>
    <main className={styles.workspace}><header className={styles.header}><div><p className={styles.eyebrow}>Network & Identity</p><h1>{projection.identity.name}</h1><p className={styles.description}>User & Access 360 · authoritative identity, organization membership and effective access.</p></div><Link className={styles.secondaryAction} href="/admin/users">Back to users</Link></header>
      <div className={styles.split}><section className={styles.list}><div className={styles.row}><strong>{projection.identity.email}</strong><span className={styles.kind}>{projection.identity.authenticationProvider} · MFA {projection.identity.mfaEnabled?"enabled":"not enabled"}</span></div>{projection.memberships.map((membership)=><div className={styles.row} key={membership.membershipId}><strong>{membership.organizationName??membership.organizationId}</strong><span className={styles.kind}>{membership.status}{membership.roleKey?` · ${membership.roleKey}`:""}</span><span className={styles.subtitle}>{membership.permissions.length} granular permissions</span></div>)}</section>
      <aside className={styles.inspector}><p className={styles.eyebrow}>Access context</p><h2>{projection.identity.id}</h2><dl className={styles.facts}><div><dt>Memberships</dt><dd>{projection.memberships.length}</dd></div><div><dt>Granular permissions</dt><dd>{projection.granularPermissions.length}</dd></div><div><dt>Invitations</dt><dd>{projection.invitations.length}</dd></div><div><dt>Restrictions</dt><dd>{projection.restrictions.length}</dd></div><div><dt>Credential version</dt><dd>{projection.authenticationState.credentialVersion}</dd></div></dl></aside></div>
    </main>
  </AdminPortalShell>;
}
