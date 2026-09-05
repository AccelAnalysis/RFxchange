import { FieldPath, Filter, type Firestore } from "firebase-admin/firestore";

import { adminDomainSurface, type AdminDomainSurfaceKey, type AdminDomainSurfaceDefinition } from "../../application/admin/domain-operations.ts";
import type { AdminGrantScope } from "../../domain/admin-authorization/grants.ts";
import { requireCataloguedAdminPermission, type AdminPermissionKey } from "../../domain/admin-authorization/model.ts";

export interface AdminDomainFact { readonly label: string; readonly value: string; }
export interface AdminDomainRecord {
  readonly id: string; readonly kind: string; readonly kindLabel: string; readonly title: string;
  readonly subtitle: string | null; readonly status: string | null; readonly facts: readonly AdminDomainFact[];
  readonly attention: boolean; readonly href: string | null; readonly searchText: string;
}
export interface AdminDomainMetric { readonly label: string; readonly value: number; readonly href: string | null; }
export interface AdminDomainSurfaceData {
  readonly definition: AdminDomainSurfaceDefinition; readonly records: readonly AdminDomainRecord[];
  readonly metrics: readonly AdminDomainMetric[]; readonly nextCursor: string | null;
}

type FirestoreRecord = Readonly<Record<string, unknown> & { id: string }>;
function record(document: FirebaseFirestore.DocumentSnapshot): FirestoreRecord { return Object.freeze({ ...document.data(), id: document.id }); }
function text(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object" && "toDate" in value) {
    const candidate = (value as { toDate?: unknown }).toDate;
    if (typeof candidate === "function") {
      try { return (candidate as () => Date).call(value).toISOString(); } catch { return null; }
    }
  }
  return null;
}
function nested(value: unknown, path: string): unknown {
  let current = value;
  for (const part of path.split(".")) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
function firstField(source: FirestoreRecord, fields: readonly string[]): string | null {
  for (const field of fields) { const value = text(nested(source, field)); if (value) return value; }
  return null;
}
function normalized(value: string | null): string { return (value ?? "").trim().toLowerCase(); }
function has(permissions: readonly AdminPermissionKey[], permission: string): boolean { return permissions.includes(requireCataloguedAdminPermission(permission)); }
function isAttention(status: string | null): boolean {
  const value = normalized(status);
  return ["submitted","conflict","evidence-requested","information-requested","needs-review","action-required","overdue","failed","retryable-failure","terminal-failure","restricted","suspended","integrity-hold","degraded","critical","unknown"].some((candidate) => value.includes(candidate));
}
const SCOPE_FIELDS: Readonly<Record<string, Partial<Record<AdminGrantScope["kind"], readonly string[]>>>> = {
  organizationProfiles: { ORGANIZATION: ["organizationId"] },
  organizationAuthorityClaims: { ORGANIZATION: ["organizationId"], GEOGRAPHY: ["geographyId"] },
  organizationCredentials: { ORGANIZATION: ["organizationId"] },
  geographies: { GEOGRAPHY: ["__name__"] },
  geographyParticipationAuthorizations: { GEOGRAPHY: ["geographyId"] },
  rfxAggregates: { ORGANIZATION: ["issuerOrganizationId"] },
  businessReferrals: { ORGANIZATION: ["senderOrganizationId", "attachedRecipientOrganizationId"] },
  accessRestrictions: { ORGANIZATION: ["target.organizationId"] },
  organizationCommercialAccounts: { ORGANIZATION: ["organizationId"] },
  administrativeCases: { ORGANIZATION: ["organizationId"], CASE: ["__name__"] },
  platformAdministrativeAuditEvents: { ORGANIZATION: ["target.organizationId"], CASE: ["relatedCaseId"] },
};
function scopeQuery(db: Firestore, collection: string, scope: AdminGrantScope): FirebaseFirestore.Query | null {
  const query = db.collection(collection);
  if (scope.kind === "GLOBAL") return query;
  const fields = SCOPE_FIELDS[collection]?.[scope.kind];
  if (!fields?.length || !scope.targetId) return null;
  const filters = fields.map((field) => Filter.where(field === "__name__" ? FieldPath.documentId() : field, "==", String(scope.targetId)));
  return query.where(filters.length === 1 ? filters[0] : Filter.or(...filters));
}
function pageCursors(cursor: string | null | undefined): Record<string, string | null> {
  if (!cursor) return {};
  if (cursor.length > 10000) throw new Error("Invalid administrative page cursor.");
  const parsed: unknown = JSON.parse(cursor);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
      Object.values(parsed).some((value) => value !== null && (typeof value !== "string" || value.length > 1500))) {
    throw new Error("Invalid administrative page cursor.");
  }
  return parsed as Record<string, string | null>;
}
function detailHref(key: AdminDomainSurfaceKey, source: FirestoreRecord, id: string): string | null {
  if (key === "organizations") { const organizationId=firstField(source,["organizationId","id"]); return organizationId?`/admin/organizations/${encodeURIComponent(organizationId)}`:null; }
  if (key === "users-access") { const userId=firstField(source,["userId","id"]); return userId?`/admin/users/${encodeURIComponent(userId)}`:null; }
  if (key === "support-feedback") return `/admin/cases/${encodeURIComponent(id)}`;
  return null;
}
function projectRecord(key:AdminDomainSurfaceKey,definition:AdminDomainSurfaceDefinition,source:FirestoreRecord,kind:string,kindLabel:string,appendedFacts:readonly AdminDomainFact[]=[]):AdminDomainRecord {
  const title=firstField(source,definition.titleFields)??`${kindLabel} ${source.id}`;
  const subtitle=firstField(source,definition.subtitleFields); const status=firstField(source,definition.statusFields);
  const facts=definition.facts.flatMap((fact)=>{const value=firstField(source,fact.fields);return value?[Object.freeze({label:fact.label,value})]:[];});
  const searchText=[source.id,title,subtitle,status,...definition.searchFields.map((field)=>text(nested(source,field)))].filter((value):value is string=>Boolean(value)).join(" ").toLowerCase();
  return Object.freeze({id:source.id,kind,kindLabel,title,subtitle,status,facts:Object.freeze([...facts,...appendedFacts]),attention:isAttention(status),href:detailHref(key,source,source.id),searchText});
}
async function collectionPage(db: Firestore, collection: string, limit: number, cursor: string | null, scope: AdminGrantScope) {
  const bounded = Math.max(1, Math.min(limit, 50));
  // An organization user directory paginates that organization's memberships,
  // then hydrates only those users. No capped global user scan can hide members.
  const userMembershipPage = collection === "users" && scope.kind === "ORGANIZATION";
  let query = userMembershipPage
    ? db.collection("organizationMemberships").where("organizationId", "==", String(scope.targetId))
    : scopeQuery(db, collection, scope);
  if (!query) return { rows: Object.freeze([]), nextCursor: null };
  if (collection === "administrativeCases") query = query.where("readPermission", "==", "support.case.read");
  query = query.orderBy(FieldPath.documentId()).limit(bounded + 1);
  if (cursor) query = query.startAfter(cursor);
  const snapshot = await query.get();
  const documents = snapshot.docs.slice(0, bounded);
  let rows: readonly FirestoreRecord[] = documents.map(record);
  if (userMembershipPage) {
    const ids = [...new Set(documents.map((doc) => text(doc.data().userId)).filter((id): id is string => Boolean(id)))];
    rows = ids.length ? (await db.getAll(...ids.map((id) => db.collection("users").doc(id)))).filter((doc) => doc.exists).map(record) : [];
  }
  return { rows: Object.freeze(rows), nextCursor: snapshot.docs.length > bounded ? documents.at(-1)?.id ?? null : null };
}
async function boundedRecords(db:Firestore,collection:string,limit=200):Promise<readonly FirestoreRecord[]> {const snapshot=await db.collection(collection).limit(Math.max(1,Math.min(limit,200))).get();return Object.freeze(snapshot.docs.map(record));}

function canReadKind(key:AdminDomainSurfaceKey,kind:string,permissions:readonly AdminPermissionKey[]):boolean {
  if(key==="organizations")return has(permissions,"organization.profile.read");
  if(key==="users-access")return has(permissions,"user.profile.read")&&has(permissions,"user.access.read");
  if(key==="claims-verification")return kind==="authority"?has(permissions,"organization.claim.read"):has(permissions,"credibility.organization.verify");
  if(key==="geographies")return has(permissions,"geography.definition.read")||has(permissions,"geography.release.read");
  if(key==="institutions-partners")return has(permissions,"geography.release.read");
  if(key==="rfx-opportunities")return has(permissions,"rfx.record.read");
  if(key==="referrals-teaming")return has(permissions,"referral.record.read");
  if(key==="credibility")return has(permissions,"credibility.organization.verify");
  if(key==="trust-safety")return has(permissions,"trust.case.review");
  if(key==="commerce")return has(permissions,"commerce.account.read");
  if(key==="support-feedback")return has(permissions,"support.case.read");
  if(key==="communications")return has(permissions,"system.health.read");
  if(key==="policies-configuration")return has(permissions,"config.value.read");
  if(key==="integrations-system")return has(permissions,"system.health.read");
  if(key==="audit-security")return has(permissions,"audit.event.read");
  return key==="analytics"?has(permissions,"analytics.dashboard.read"):false;
}

async function organizationContext(db: Firestore, organizationIds: readonly string[], permissions: readonly AdminPermissionKey[]) {
  const sources = [
    ["Members", "organizationMemberships", "user.access.read", "organizationId"],
    ["Authority claims", "organizationAuthorityClaims", "organization.claim.read", "organizationId"],
    ["Credential records", "organizationCredentials", "credibility.organization.verify", "organizationId"],
    ["Provider records", "providerApplications", "provider.application.read", "organizationId"],
    ["Commercial accounts", "organizationCommercialAccounts", "commerce.account.read", "organizationId"],
    ["Support cases", "administrativeCases", "support.case.read", "organizationId"],
    ["Restriction records", "accessRestrictions", "trust.case.review", "target.organizationId"],
  ] as const;
  return new Map(await Promise.all(organizationIds.map(async (organizationId) => {
    const facts = await Promise.all(sources.filter(([, , permission]) => has(permissions, permission)).map(async ([label, collection, , field]) => {
      let query = db.collection(collection).where(field, "==", organizationId);
      if (collection === "administrativeCases") query = query.where("readPermission", "==", "support.case.read");
      const result = await query.count().get();
      return Object.freeze({ label, value: String(result.data().count) });
    }));
    return [organizationId, Object.freeze(facts)] as const;
  })));
}
async function userContext(db: Firestore, userIds: readonly string[], scope: AdminGrantScope) {
  return new Map(await Promise.all(userIds.map(async (userId) => {
    let query = db.collection("organizationMemberships").where("userId", "==", userId);
    if (scope.kind === "ORGANIZATION") query = query.where("organizationId", "==", String(scope.targetId));
    const result = await query.count().get();
    // A scoped count does not establish global account-resolution or restriction state.
    return [userId, Object.freeze([Object.freeze({ label: "Memberships in this scope", value: String(result.data().count) })])] as const;
  })));
}
async function analyticsMetrics(db:Firestore,scope:AdminGrantScope):Promise<readonly AdminDomainMetric[]> {
  if(scope.kind!=="GLOBAL")return Object.freeze([]);
  const definitions=[["Organizations","organizationProfiles","/admin/organizations"],["RFx records","rfxAggregates","/admin/rfx"],["Resource Providers","officialResourceProviderStatuses","/admin/resource-providers"],["Referrals","businessReferrals","/admin/referrals-teaming"],["Commercial accounts","organizationCommercialAccounts","/admin/commerce"],["Support cases","administrativeCases","/admin/support"],["Active restrictions","accessRestrictions","/admin/trust-safety"]]as const;
  return Object.freeze(await Promise.all(definitions.map(async([label,collection,href])=>{let query: FirebaseFirestore.Query = db.collection(collection); if(collection==="accessRestrictions")query=query.where("state","in",["restricted","suspended","integrity-hold","terminated"]); if(collection==="administrativeCases")query=query.where("readPermission","==","support.case.read"); const aggregate=await query.count().get();return Object.freeze({label,value:aggregate.data().count,href});})));
}
async function dataPromotionPackages(db:Firestore,scope:AdminGrantScope):Promise<readonly AdminDomainRecord[]> {
  if(scope.kind!=="GLOBAL")return Object.freeze([]);
  const definition=adminDomainSurface("data-promotion"); const[sources,candidates,comparisons,approvals,receipts]=await Promise.all([boundedRecords(db,"providerSeedSourceRecords"),boundedRecords(db,"providerSeedPromotionCandidates"),boundedRecords(db,"providerSeedCanonicalComparisons"),boundedRecords(db,"providerSeedPromotionApprovals"),boundedRecords(db,"providerSeedPromotionReceipts")]);
  const markets=new Map<string,FirestoreRecord[]>();for(const source of sources){const market=firstField(source,["marketKey"])??"unassigned-source-package";markets.set(market,[...(markets.get(market)??[]),source]);}
  return Object.freeze([...markets.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([marketKey,rows])=>{const synthetic:FirestoreRecord=Object.freeze({id:marketKey,marketKey,displayName:marketKey});return projectRecord("data-promotion",definition,synthetic,"source-package","Source package",Object.freeze([Object.freeze({label:"Loaded source records",value:String(rows.length)}),Object.freeze({label:"Loaded candidates",value:String(candidates.filter((row)=>firstField(row,["marketKey"])===marketKey).length)}),Object.freeze({label:"Loaded comparisons",value:String(comparisons.filter((row)=>firstField(row,["marketKey"])===marketKey).length)}),Object.freeze({label:"Loaded approvals",value:String(approvals.filter((row)=>firstField(row,["marketKey"])===marketKey).length)}),Object.freeze({label:"Loaded committed receipts",value:String(receipts.filter((row)=>firstField(row,["marketKey"])===marketKey).length)}),Object.freeze({label:"Coverage",value:"Up to 200 records per source collection; totals may be incomplete"}),Object.freeze({label:"Publication",value:"Separate from promotion"})]));}));
}

export async function loadAdminDomainSurface(input:Readonly<{db:Firestore;key:AdminDomainSurfaceKey;scope:AdminGrantScope;permissions:readonly AdminPermissionKey[];query?:string|null;status?:string|null;cursor?:string|null;limit?:number}>):Promise<AdminDomainSurfaceData>{
  const definition=adminDomainSurface(input.key);
  if(input.key==="analytics")return Object.freeze({definition,records:Object.freeze([]),metrics:has(input.permissions,"analytics.dashboard.read")?await analyticsMetrics(input.db,input.scope):Object.freeze([]),nextCursor:null});
  if(input.key==="data-promotion"){if (!has(input.permissions,"provider.seed.promote")) throw new Error("Source package access denied."); let records=await dataPromotionPackages(input.db,input.scope);const needle=normalized(input.query??null);if(needle)records=Object.freeze(records.filter((row)=>row.searchText.includes(needle)));return Object.freeze({definition,records,metrics:Object.freeze([]),nextCursor:null});}
  const limit=input.query?50:input.limit??30;const projected:AdminDomainRecord[]=[];const cursors = pageCursors(input.cursor); const next: Record<string,string|null> = {};
  for(const sourceDefinition of definition.collections){
    if(!canReadKind(input.key,sourceDefinition.kind,input.permissions))continue;
    if (cursors[sourceDefinition.collection] === null) { next[sourceDefinition.collection] = null; continue; }
    const page=await collectionPage(input.db,sourceDefinition.collection,input.query?50:limit,cursors[sourceDefinition.collection]??null,input.scope);
    next[sourceDefinition.collection] = page.nextCursor;
    const scopedRows=page.rows;
    let context=new Map<string,readonly AdminDomainFact[]>();
    if(input.key==="organizations"){const ids=scopedRows.map((row)=>firstField(row,["organizationId","id"])).filter((value):value is string=>Boolean(value));context=await organizationContext(input.db,ids,input.permissions);}else if(input.key==="users-access"){const ids=scopedRows.map((row)=>firstField(row,["userId","id"])).filter((value):value is string=>Boolean(value));context=await userContext(input.db,ids,input.scope);}
    for(const source of scopedRows){const contextId=input.key==="organizations"?firstField(source,["organizationId","id"]):input.key==="users-access"?firstField(source,["userId","id"]):null;projected.push(projectRecord(input.key,definition,source,sourceDefinition.kind,sourceDefinition.kindLabel,contextId?context.get(contextId)??[]:[]));}
  }
  const needle=normalized(input.query??null);const requestedStatus=normalized(input.status??null);const records=projected.filter((row)=>!needle||row.searchText.includes(needle)).filter((row)=>!requestedStatus||normalized(row.status).includes(requestedStatus)).sort((a,b)=>Number(b.attention)-Number(a.attention)||a.title.localeCompare(b.title));
  return Object.freeze({definition,records:Object.freeze(records),metrics:Object.freeze([]),nextCursor:Object.values(next).some((value)=>value!==null)?JSON.stringify(next):null});
}
