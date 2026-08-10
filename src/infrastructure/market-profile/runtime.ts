import type { Firestore } from "firebase-admin/firestore";

import { MarketProfileService } from "../../application/market-profile/market-profile.ts";
import type { ParticipantRouteResolution } from "../auth/participant-route-runtime.ts";
import { createServerFirebaseAccountSecurityService } from "../auth/firebase-account-security-runtime.ts";
import { loadImmutableAmacsCatalog } from "../amacs/runtime.ts";
import { FirestoreAiInterpretationRepository } from "../firestore/ai-interpretation-repository.ts";
import { createFirestoreOrganizationLocationRepositories } from "../firestore/organization-location.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { FirestoreOrganizationMarketProfileRepository } from "../firestore/market-profile.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

type AuthorizedParticipant = Extract<ParticipantRouteResolution, { readonly kind: "authorized" }>;

export async function createServerMarketProfileService(db: Firestore = getServerFirestore()) {
  const [catalog, foundation] = await Promise.all([
    loadImmutableAmacsCatalog(),
    Promise.resolve(createFirestoreFoundationRepositories(db)),
  ]);
  const locations = createFirestoreOrganizationLocationRepositories(db);
  return new MarketProfileService({
    authorization: {
      accountSecurity: createServerFirebaseAccountSecurityService(),
      organizations: foundation.organizations.accounts,
      memberships: foundation.users.memberships,
      authorizations: foundation.organizationAuthorization,
      restrictions: foundation.lifecycle.restrictions,
    },
    catalog,
    interpretations: new FirestoreAiInterpretationRepository(db),
    serviceGeographies: locations.serviceGeographies,
    repository: new FirestoreOrganizationMarketProfileRepository(db),
  });
}

export async function loadAuthorizedMarketProfile(access: AuthorizedParticipant) {
  const db = getServerFirestore();
  const [service, catalog] = await Promise.all([
    createServerMarketProfileService(db),
    loadImmutableAmacsCatalog(),
  ]);
  const organizationId = String(access.membership.organizationId);
  const [snapshot, release, domains, marketRoles, serviceGeographies] = await Promise.all([
    service.snapshot(organizationId),
    catalog.getRelease(),
    catalog.listDomains(),
    catalog.listMarketRoles(),
    createFirestoreOrganizationLocationRepositories(db).serviceGeographies.getByOrganizationId(access.membership.organizationId),
  ]);
  const families = (await Promise.all(domains.map((domain) => catalog.listFamilies(domain.domainId)))).flat();
  const capabilities = (await Promise.all(families.map((family) => catalog.listCapabilities(family.familyId)))).flat();
  const serviceGeographyIds = serviceGeographies?.serviceGeographyIds ?? [];
  const geographyDefinitions = createFirestoreGeographyRepositories(db).definitions;
  const resolvedGeographies = await Promise.all(
    serviceGeographyIds.map((id) => geographyDefinitions.getById(id)),
  );
  if (resolvedGeographies.some((definition) => !definition)) {
    throw new Error("Market profile service geography definitions are incomplete.");
  }
  return Object.freeze({
    snapshot,
    catalog: Object.freeze({ release, domains, families, capabilities }),
    marketRoles: Object.freeze(marketRoles.flatMap((record) => {
      const id = typeof record.market_role_id === "string" ? record.market_role_id : null;
      const label = typeof record.preferred_label === "string" ? record.preferred_label : null;
      const definition = typeof record.definition === "string" ? record.definition : "";
      return id && label ? [Object.freeze({ id, label, definition })] : [];
    })),
    serviceGeographyIds: Object.freeze(serviceGeographyIds.map(String)),
    serviceGeographies: Object.freeze(resolvedGeographies.map((definition, index) => Object.freeze({
      id: String(serviceGeographyIds[index]),
      label: definition?.name ?? "Authorized service geography",
    }))),
  });
}
