import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { ADMIN_PORTAL_SECTION_KEYS, ADMIN_PORTAL_SECTIONS, IMPLEMENTED_ADMIN_RUNTIME_DESTINATION_KEYS, visibleAdminPortalSections, visibleImplementedAdminRuntimeDestinations } from "../src/application/admin/portal-navigation.ts";
import { createAdminPermissionGrant } from "../src/domain/admin-authorization/grants.ts";
import { defaultAdminRolePreset, resolveAuthorityContextFromAdminRolePreset } from "../src/domain/admin-authorization/role-presets.ts";

assert.equal(ADMIN_PORTAL_SECTION_KEYS.length,19);
assert.equal(ADMIN_PORTAL_SECTIONS.length,19);
assert.equal(new Set(ADMIN_PORTAL_SECTIONS.map((section)=>section.href)).size,19);
assert.ok(ADMIN_PORTAL_SECTIONS.every((section)=>section.visibilityPermissions.length>0));
for(const key of ADMIN_PORTAL_SECTION_KEYS)assert.ok(IMPLEMENTED_ADMIN_RUNTIME_DESTINATION_KEYS.includes(key));
assert.ok(IMPLEMENTED_ADMIN_RUNTIME_DESTINATION_KEYS.includes("organization-claims"));

const root=resolveAuthorityContextFromAdminRolePreset("guard-root",defaultAdminRolePreset("super-admin"));
const technical=resolveAuthorityContextFromAdminRolePreset("guard-tech",defaultAdminRolePreset("technical-system-administrator"));
assert.equal(visibleAdminPortalSections(root).length,19);
assert.equal(visibleAdminPortalSections(technical).some((section)=>section.key==="commerce"),false);
assert.equal(visibleAdminPortalSections(technical).some((section)=>section.key==="integrations-system"),true);
assert.equal(visibleAdminPortalSections(technical).some((section)=>section.key==="overview"),true);
assert.equal(visibleAdminPortalSections(technical).some((section)=>section.key==="work-queues"),true);

const implementedGrants=[
  createAdminPermissionGrant({id:"guard-claims",administratorId:root.administratorId,permission:"organization.claim.read",scope:"GLOBAL",createdAt:"2026-08-10T12:00:00.000Z"}),
  createAdminPermissionGrant({id:"guard-providers",administratorId:root.administratorId,permission:"provider.application.read",scope:"GLOBAL",createdAt:"2026-08-10T12:00:00.000Z"}),
];
assert.deepEqual(visibleImplementedAdminRuntimeDestinations(root,implementedGrants,"2026-08-10T12:30:00.000Z").map((destination)=>destination.key),[
  "overview","work-queues","claims-verification","resource-providers","organization-claims",
]);
assert.deepEqual(visibleImplementedAdminRuntimeDestinations(root,[],"2026-08-10T12:30:00.000Z"),[]);
const boundedDestinations=visibleImplementedAdminRuntimeDestinations(root,[
  createAdminPermissionGrant({id:"guard-provider-org-b",administratorId:root.administratorId,permission:"provider.application.read",scope:"ORGANIZATION:org-b",createdAt:"2026-08-10T12:00:00.000Z"}),
  createAdminPermissionGrant({id:"guard-provider-org-a",administratorId:root.administratorId,permission:"provider.application.read",scope:"ORGANIZATION:org-a",createdAt:"2026-08-10T12:00:00.000Z"}),
],"2026-08-10T12:30:00.000Z").filter((destination)=>destination.key==="resource-providers");
assert.deepEqual(boundedDestinations.map((destination)=>destination.scope.value),["ORGANIZATION:org-a","ORGANIZATION:org-b"]);

const entry=await readFile("app/admin/page.tsx","utf8");
assert.match(entry,/resolveAdminPortalAccess/);assert.match(entry,/access\.destinations\[0\]\.href/);assert.doesNotMatch(entry,/redirect\("\/admin\/overview"\)/);assert.doesNotMatch(entry,/buildAdministrativeCommandCenter/);
for(const path of ["app/admin/overview/page.tsx","app/admin/work-queues/page.tsx","app/admin/cases/[caseId]/page.tsx","app/admin/search/page.tsx","src/infrastructure/admin/operating-core-runtime.ts","app/admin/organizations/page.tsx","app/admin/users/page.tsx","app/admin/claims-verification/page.tsx"])assert.ok((await readFile(path,"utf8")).length>0,`${path} must exist.`);

const account=await readFile("app/organization-profile/page.tsx","utf8");
assert.doesNotMatch(account,/resolveAdminPortalAccess|accountAdministrationHref|administrationHref=/,"Optional administrative access resolution must not block the participant Account page.");
const shellAdministration=await readFile("app/api/participant-shell/administration/route.ts","utf8");
assert.match(shellAdministration,/resolveAdminPortalAccess/);assert.match(shellAdministration,/access\.kind === "authorized" \? "\/admin" : null/);assert.match(shellAdministration,/catch[\s\S]*closedAdministrationContext/);assert.match(shellAdministration,/cache-control/);
const participantNavigation=await readFile("src/components/participant/ParticipantTopNavigation.tsx","utf8");
assert.match(participantNavigation,/\/api\/participant-shell\/administration/);assert.match(participantNavigation,/if \(administrationResolved\) return/);assert.match(participantNavigation,/administrationHref \? \(/);assert.match(participantNavigation,/resolveAdministration\(\)/);

const configuredAcceptance=await readFile("scripts/acceptance-post-wave3-admin-runtime-configured.mjs","utf8");
for(const requirement of ["superAdmin","narrowAdmin","participant","require-reauthentication","assert-zero","adminPermissionGrants"])assert.match(configuredAcceptance,new RegExp(requirement));
const user360=await readFile("src/application/admin/user-access-360.ts","utf8");
for(const field of ["identity","authenticationState","memberships","platformRole","granularPermissions","securityEvents","invitations","restrictions","termsVersionsAccepted","recentActions"])assert.match(user360,new RegExp(field));
assert.match(user360,/user\.profile\.read/);assert.match(user360,/user\.access\.read/);
const repair=await readFile("src/application/admin/membership-repair.ts","utf8");
assert.match(repair,/user\.access\.manage/);assert.match(repair,/resolveUserOrganizationAccess/);assert.match(repair,/route-to-account-resolution/);assert.match(repair,/would orphan an active user/);
const model=await readFile("src/domain/admin-authorization/model.ts","utf8");assert.match(model,/user\.access\.manage/);
const presets=await readFile("src/domain/admin-authorization/role-presets.ts","utf8");assert.match(presets,/member-success-support-administrator/);assert.match(presets,/user\.access\.manage/);
for(const component of ["src/components/admin/AdminPortalNavigation.tsx","src/components/admin/AdminPortalShell.tsx","src/components/admin/AdminPortalCommandBar.tsx","src/components/admin/UserAccess360.tsx","src/components/admin/AdminDomainWorkspace.tsx"]){const source=await readFile(component,"utf8");assert.ok(source.length>0,`${component} must exist`);}
console.log("ADM-057/ADM-067/ADM-069 admin portal and complete protected runtime guardrails validated.");
