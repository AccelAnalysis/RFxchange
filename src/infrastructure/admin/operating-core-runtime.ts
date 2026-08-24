import type { Firestore } from "firebase-admin/firestore";

import type {
  AdminAttentionQueueProvider,
  AdminHealthMetric,
  AdminHealthPanelProvider,
} from "../../application/admin/command-center.ts";
import type { AdminSearchProvider } from "../../application/admin/universal-search.ts";
import { AdministrativeCaseWorkQueueProvider } from "../../application/admin/administrative-case-service.ts";
import {
  authorizeScopedAdministrativeAction,
  createScopedAdministrativeActionRequirement,
  type AdminPermissionGrant,
} from "../../domain/admin-authorization/grants.ts";
import type {
  AdminPermissionKey,
  PlatformAdministratorAuthorityContext,
} from "../../domain/admin-authorization/model.ts";
import type { AdministrativeCase } from "../../domain/admin-cases/model.ts";
import type { AdministrativeWorkQueueProvider } from "../../domain/admin-work-queue/model.ts";
import {
  FirestoreAdministrativeCaseRepository,
} from "../firestore/administrative-case-repository.ts";

const OPEN_CLAIM_STATUSES = new Set([
  "submitted",
  "evidence-requested",
  "existing-administrator-notified",
  "evidence-compared",
  "conflict",
]);
const OPEN_PROVIDER_STATUSES = new Set([
  "submitted",
  "under-review",
  "information-requested",
  "resubmitted",
]);
const FAILED_JOB_STATUSES = new Set(["retryable-failure", "terminal-failure"]);

type FirestoreRecord = Readonly<Record<string, unknown> & { id: string }>;

function metric(key: string, label: string, value: number): AdminHealthMetric {
  return Object.freeze({ key, label, value, unit: "count" as const });
}

function normalized(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function containsAny(value: unknown, terms: readonly string[]): boolean {
  const text = normalized(value);
  return terms.some((term) => text.includes(term));
}

function firestoreRecord(id: string, data: Record<string, unknown>): FirestoreRecord {
  return Object.freeze({ ...data, id });
}

async function collectionRecords(db: Firestore, collection: string): Promise<readonly FirestoreRecord[]> {
  const snapshot = await db.collection(collection).get();
  return snapshot.docs.map((document) => firestoreRecord(document.id, document.data()));
}

async function boundedCollectionRecords(
  db: Firestore,
  collection: string,
  limit: number,
): Promise<readonly FirestoreRecord[]> {
  const snapshot = await db.collection(collection).limit(Math.max(1, Math.min(limit, 200))).get();
  return snapshot.docs.map((document) => firestoreRecord(document.id, document.data()));
}

function caseHasPermission(record: AdministrativeCase, permission: string): boolean {
  return String(record.readPermission) === permission || String(record.actionPermission) === permission;
}

function correctionCase(record: AdministrativeCase): boolean {
  return containsAny(record.type, ["correction", "data-fix", "repair"]) ||
    containsAny(record.source, ["correction", "data-fix", "repair"]);
}

/**
 * Narrows the persisted authority context to permissions that also have an active GLOBAL grant.
 * The existing command-center/work-queue/search application models are permission-aware; this
 * adapter prevents a permission in the role context from widening a missing or expired grant.
 */
export function authorityWithActiveGlobalGrants(
  authority: PlatformAdministratorAuthorityContext,
  grants: readonly AdminPermissionGrant[],
  now: string,
): PlatformAdministratorAuthorityContext {
  const effectivePermissions = authority.effectivePermissions.filter((permission) =>
    authorizeScopedAdministrativeAction(
      authority,
      grants,
      createScopedAdministrativeActionRequirement({
        permission,
        access: "read",
        scope: "GLOBAL",
      }),
      { now, satisfiedConditionKeys: Object.freeze([]) },
    ).kind === "allow",
  );

  return Object.freeze({
    ...authority,
    effectivePermissions: Object.freeze(effectivePermissions),
  });
}

export function createServerAdministrativeWorkQueueProvider(
  db: Firestore,
): AdministrativeWorkQueueProvider {
  return new AdministrativeCaseWorkQueueProvider(
    new FirestoreAdministrativeCaseRepository(db),
  );
}

export function createServerAdminCommandCenterProviders(db: Firestore): Readonly<{
  queueProviders: readonly AdminAttentionQueueProvider[];
  healthProviders: readonly AdminHealthPanelProvider[];
}> {
  const caseRepository = new FirestoreAdministrativeCaseRepository(db);
  let casePromise: Promise<readonly AdministrativeCase[]> | null = null;
  let claimsPromise: Promise<readonly Readonly<Record<string, unknown>>[]> | null = null;
  let providersPromise: Promise<readonly Readonly<Record<string, unknown>>[]> | null = null;
  let restrictionsPromise: Promise<readonly Readonly<Record<string, unknown>>[]> | null = null;
  let jobsPromise: Promise<readonly Readonly<Record<string, unknown>>[]> | null = null;

  const cases = () => casePromise ??= caseRepository.listOpen();
  const claims = () => claimsPromise ??= collectionRecords(db, "organizationAuthorityClaims");
  const providerApplications = () => providersPromise ??= collectionRecords(db, "providerApplications");
  const restrictions = () => restrictionsPromise ??= collectionRecords(db, "accessRestrictions");
  const jobs = () => jobsPromise ??= collectionRecords(db, "backgroundJobs");

  const countCases = async (predicate: (record: AdministrativeCase) => boolean) =>
    (await cases()).filter(predicate).length;

  const queueProviders: readonly AdminAttentionQueueProvider[] = Object.freeze([
    Object.freeze({
      key: "claims-awaiting-review" as const,
      label: "Authority claims",
      requiredPermission: "organization.claim.read",
      async count() {
        return (await claims()).filter((record) => OPEN_CLAIM_STATUSES.has(normalized(record.status))).length;
      },
    }),
    Object.freeze({
      key: "verification-reviews" as const,
      label: "Verification reviews",
      requiredPermission: "credibility.organization.verify",
      async count() {
        return countCases((record) =>
          caseHasPermission(record, "credibility.organization.verify") ||
          containsAny(record.type, ["verification"]),
        );
      },
    }),
    Object.freeze({
      key: "resource-provider-applications" as const,
      label: "Provider applications",
      requiredPermission: "provider.application.read",
      async count() {
        return (await providerApplications()).filter((record) => OPEN_PROVIDER_STATUSES.has(normalized(record.status))).length;
      },
    }),
    Object.freeze({
      key: "rfx-flagged" as const,
      label: "RFx moderation",
      requiredPermission: "rfx.moderation.review",
      async count() {
        return countCases((record) => caseHasPermission(record, "rfx.moderation.review"));
      },
    }),
    Object.freeze({
      key: "trust-reports" as const,
      label: "Trust reports",
      requiredPermission: "trust.report.read",
      async count() {
        return countCases((record) => String(record.readPermission) === "trust.report.read");
      },
    }),
    Object.freeze({
      key: "integrity-holds" as const,
      label: "Integrity holds",
      requiredPermission: "trust.case.review",
      async count() {
        return (await restrictions()).filter((record) => normalized(record.state) === "integrity-hold").length;
      },
    }),
    Object.freeze({
      key: "billing-exceptions" as const,
      label: "Billing exceptions",
      requiredPermission: "commerce.account.read",
      async count() {
        return countCases((record) => caseHasPermission(record, "commerce.adjustment.review"));
      },
    }),
    Object.freeze({
      key: "data-corrections" as const,
      label: "Data corrections",
      requiredPermission: "support.case.read",
      async count() {
        return countCases(correctionCase);
      },
    }),
    Object.freeze({
      key: "support-cases" as const,
      label: "Support cases",
      requiredPermission: "support.case.read",
      async count() {
        return countCases((record) =>
          String(record.readPermission) === "support.case.read" && !correctionCase(record),
        );
      },
    }),
    Object.freeze({
      key: "failed-integrations" as const,
      label: "Failed integrations",
      requiredPermission: "system.health.read",
      async count() {
        return (await jobs()).filter((record) => FAILED_JOB_STATUSES.has(normalized(record.status))).length;
      },
    }),
  ]);

  const healthProviders: readonly AdminHealthPanelProvider[] = Object.freeze([
    Object.freeze({
      key: "organizations" as const,
      label: "Organizations",
      requiredPermission: "organization.profile.read",
      async load() {
        const [organizations, activeRestrictions] = await Promise.all([
          collectionRecords(db, "organizations"),
          restrictions(),
        ]);
        const restricted = activeRestrictions.filter((record) =>
          ["restricted", "suspended", "integrity-hold", "terminated"].includes(normalized(record.state)),
        ).length;
        return Object.freeze({
          status: restricted > 0 ? "attention" as const : "healthy" as const,
          metrics: Object.freeze([
            metric("organizations", "Organizations", organizations.length),
            metric("restricted-organizations", "Active restrictions", restricted),
          ]),
        });
      },
    }),
    Object.freeze({
      key: "marketplace" as const,
      label: "Marketplace",
      requiredPermission: "rfx.record.read",
      async load() {
        const [rfx, moderation] = await Promise.all([
          collectionRecords(db, "rfxAggregates"),
          countCases((record) => caseHasPermission(record, "rfx.moderation.review")),
        ]);
        return Object.freeze({
          status: moderation > 0 ? "attention" as const : "healthy" as const,
          metrics: Object.freeze([
            metric("rfx-records", "RFx records", rfx.length),
            metric("rfx-moderation", "Moderation cases", moderation),
          ]),
        });
      },
    }),
    Object.freeze({
      key: "connections" as const,
      label: "Connections",
      requiredPermission: "referral.record.read",
      async load() {
        const [referrals, referralCases] = await Promise.all([
          collectionRecords(db, "businessReferrals"),
          countCases((record) => caseHasPermission(record, "referral.case.review")),
        ]);
        return Object.freeze({
          status: referralCases > 0 ? "attention" as const : "healthy" as const,
          metrics: Object.freeze([
            metric("referrals", "Referrals", referrals.length),
            metric("referral-cases", "Referral cases", referralCases),
          ]),
        });
      },
    }),
    Object.freeze({
      key: "network" as const,
      label: "Network",
      requiredPermission: "analytics.dashboard.read",
      async load() {
        const [providers, resources] = await Promise.all([
          collectionRecords(db, "officialResourceProviderStatuses"),
          collectionRecords(db, "providerResources"),
        ]);
        return Object.freeze({
          status: "healthy" as const,
          metrics: Object.freeze([
            metric("official-providers", "Official providers", providers.length),
            metric("provider-resources", "Provider resources", resources.length),
          ]),
        });
      },
    }),
    Object.freeze({
      key: "commerce" as const,
      label: "Commerce",
      requiredPermission: "commerce.account.read",
      async load() {
        const [accounts, billingCases] = await Promise.all([
          collectionRecords(db, "organizationCommercialAccounts"),
          countCases((record) => caseHasPermission(record, "commerce.adjustment.review")),
        ]);
        return Object.freeze({
          status: billingCases > 0 ? "attention" as const : "healthy" as const,
          metrics: Object.freeze([
            metric("commercial-accounts", "Commercial accounts", accounts.length),
            metric("billing-exceptions", "Billing exceptions", billingCases),
          ]),
        });
      },
    }),
    Object.freeze({
      key: "trust" as const,
      label: "Trust",
      requiredPermission: "trust.report.read",
      async load() {
        const [reports, holds] = await Promise.all([
          countCases((record) => String(record.readPermission) === "trust.report.read"),
          (await restrictions()).filter((record) => normalized(record.state) === "integrity-hold").length,
        ]);
        return Object.freeze({
          status: holds > 0 ? "critical" as const : reports > 0 ? "attention" as const : "healthy" as const,
          metrics: Object.freeze([
            metric("trust-reports", "Open trust reports", reports),
            metric("integrity-holds", "Integrity holds", holds),
          ]),
        });
      },
    }),
    Object.freeze({
      key: "systems" as const,
      label: "Systems",
      requiredPermission: "system.health.read",
      async load() {
        const currentJobs = await jobs();
        const retryable = currentJobs.filter((record) => normalized(record.status) === "retryable-failure").length;
        const terminal = currentJobs.filter((record) => normalized(record.status) === "terminal-failure").length;
        return Object.freeze({
          status: terminal > 0 ? "critical" as const : retryable > 0 ? "attention" as const : "unknown" as const,
          metrics: Object.freeze([
            metric("retryable-jobs", "Retryable failures", retryable),
            metric("terminal-jobs", "Terminal failures", terminal),
          ]),
        });
      },
    }),
  ]);

  return Object.freeze({ queueProviders, healthProviders });
}

function permissionAvailable(
  permissions: readonly AdminPermissionKey[],
  permission: string,
): boolean {
  return permissions.some((candidate) => String(candidate) === permission);
}

export function createServerAdminSearchProviders(
  db: Firestore,
  permissions: readonly AdminPermissionKey[],
): readonly AdminSearchProvider[] {
  const providers: AdminSearchProvider[] = [];

  if (permissionAvailable(permissions, "organization.profile.read")) {
    providers.push(Object.freeze({
      key: "organizations",
      async search(query: string, limit: number) {
        const needle = query.toLowerCase();
        const records = await boundedCollectionRecords(db, "organizationProfiles", limit * 8);
        return Object.freeze(records.flatMap((record) => {
          const organizationId = String(record.organizationId ?? "").trim();
          const displayName = String(record.displayName ?? "").trim();
          if (!organizationId || !displayName) return [];
          if (!displayName.toLowerCase().includes(needle) && !organizationId.toLowerCase().includes(needle)) return [];
          const base = {
            id: organizationId,
            title: displayName,
            secondaryText: "Organization",
            route: `/admin/organizations/${encodeURIComponent(organizationId)}`,
            requiredPermission: "organization.profile.read",
          } as const;
          return organizationId.toLowerCase() === needle
            ? [Object.freeze({ ...base, category: "organization-id" as const }), Object.freeze({ ...base, category: "organization" as const })]
            : [Object.freeze({ ...base, category: "organization" as const })];
        }).slice(0, limit));
      },
    }));
  }

  if (permissionAvailable(permissions, "provider.application.read")) {
    providers.push(Object.freeze({
      key: "resource-providers",
      async search(query: string, limit: number) {
        const needle = query.toLowerCase();
        const applications = await boundedCollectionRecords(db, "providerApplications", limit * 5);
        const rows = await Promise.all(applications.map(async (record) => {
          const organizationId = String(record.organizationId ?? record.id ?? "").trim();
          if (!organizationId) return null;
          const profileSnapshot = await db.collection("organizationProfiles")
            .where("organizationId", "==", organizationId)
            .limit(1)
            .get();
          const displayName = String(profileSnapshot.docs[0]?.data()?.displayName ?? "Organization").trim();
          if (!displayName.toLowerCase().includes(needle) && !organizationId.toLowerCase().includes(needle)) return null;
          return Object.freeze({
            category: "provider" as const,
            id: organizationId,
            title: displayName,
            secondaryText: "Resource Provider application",
            route: `/admin/resource-providers?organizationId=${encodeURIComponent(organizationId)}`,
            requiredPermission: "provider.application.read",
          });
        }));
        return Object.freeze(rows.filter((row): row is NonNullable<typeof row> => row !== null).slice(0, limit));
      },
    }));
  }

  if (permissionAvailable(permissions, "support.case.read")) {
    providers.push(Object.freeze({
      key: "support-cases",
      async search(query: string, limit: number) {
        const needle = query.toLowerCase();
        const records = await new FirestoreAdministrativeCaseRepository(db).listOpen();
        return Object.freeze(records
          .filter((record) => String(record.readPermission) === "support.case.read")
          .filter((record) => [
            record.caseNumber,
            record.type,
            record.source,
            record.organizationId,
            record.userId,
          ].some((value) => String(value ?? "").toLowerCase().includes(needle)))
          .slice(0, limit)
          .map((record) => Object.freeze({
            category: "support-case" as const,
            id: String(record.id),
            title: String(record.caseNumber),
            secondaryText: `${record.type} · ${record.status}`,
            route: `/admin/cases/${encodeURIComponent(String(record.id))}`,
            requiredPermission: "support.case.read",
          })));
      },
    }));
  }

  return Object.freeze(providers);
}
